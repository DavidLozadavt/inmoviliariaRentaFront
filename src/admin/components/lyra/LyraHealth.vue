<script setup lang="ts">
import { useLyraHealth } from '../../composables/useLyraHealth';
import HealthIndicator from './shared/HealthIndicator.vue';

const { 
  healthChecks, 
  healthHistory, 
  lastIncident, 
  incidents, 
  loadingIncidents, 
  restartService 
} = useLyraHealth();
</script>

<template>
  <div class="lyra-health">
    
    <!-- Health Status Banner -->
    <div v-if="lastIncident" class="health-alert-banner" :class="{ 'banner-down': healthChecks.some(c => c.status === 'down') }">
      <div class="banner-icon">
        <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
      </div>
      <div class="banner-content">
        <h3>Alerta de Sistema: {{ lastIncident.service.toUpperCase() }} {{ lastIncident.status }}</h3>
        <p>Detectado por última vez el {{ new Date(lastIncident.timestamp).toLocaleTimeString() }}. Se recomienda inspeccionar logs de Laravel.</p>
      </div>
      <div class="banner-actions">
        <button class="banner-btn" v-if="lastIncident.service === 'cache'" @click="restartService('cache')">Limpiar Caché</button>
      </div>
    </div>

    <!-- Health Grid -->
    <div class="health-grid">
      <HealthIndicator 
        v-for="check in healthChecks" 
        :key="check.service"
        :service="check.service"
        :status="check.status"
        :latency="check.latency"
        :history="healthHistory[check.service]"
        :details="check.details"
        :lastCheck="check.lastCheck"
        @restart="restartService"
      />
    </div>

    <!-- System Logs Card -->
    <div class="lyra-card logs-card">
      <div class="lyra-card-header">
        <font-awesome-icon :icon="['fas', 'terminal']" />
        Log de Incidencias de Sistema (Últimos 7 días)
      </div>
      
      <div class="logs-container">
        <div v-if="loadingIncidents" class="loading-state">Cargando incidencias...</div>
        <table v-else class="logs-table">
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>Servicio</th>
              <th>Estado</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="incident in incidents" :key="incident.id">
              <td class="log-date">{{ new Date(incident.started_at).toLocaleString() }}</td>
              <td><span class="log-service-tag">{{ incident.service.toUpperCase() }}</span></td>
              <td>
                <span 
                  class="log-event-tag" 
                  :class="incident.status === 'down' ? 'type-error' : 'type-warn'"
                >{{ incident.status.toUpperCase() }}</span>
              </td>
              <td class="log-detail">
                {{ incident.resolved_at 
                  ? `${Math.round((new Date(incident.resolved_at).getTime() - new Date(incident.started_at).getTime()) / 60000)} min`
                  : 'Activa' 
                }}
              </td>
            </tr>
            <tr class="empty-log-row" v-if="incidents.length === 0">
              <td colspan="4">No hay incidencias registradas en los últimos 7 días.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<style scoped>
.lyra-health {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: slideIn 0.3s ease-out;
}

.health-alert-banner {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  position: sticky;
  top: 1rem;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.banner-down {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.1);
}

.banner-icon {
  width: 50px;
  height: 50px;
  background: rgba(245, 158, 11, 0.2);
  color: var(--warning);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.banner-down .banner-icon {
  background: rgba(239, 68, 68, 0.2);
  color: var(--error);
  animation: pulse-warn 1.5s infinite;
}

@keyframes pulse-warn {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

.banner-content { flex: 1; }
.banner-content h3 { font-size: 1.1rem; font-weight: 800; margin-bottom: 0.25rem; color: var(--white); }
.banner-content p { font-size: 0.85rem; color: var(--admin-text-secondary); opacity: 0.9; }

.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* System Logs */
.logs-container {
  overflow-x: auto;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.1);
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'DM Mono', monospace;
  font-size: 0.85rem;
}

.logs-table th {
  text-align: left;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  color: var(--admin-text-secondary);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.logs-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  color: var(--white);
}

.log-date { color: var(--admin-text-secondary); }

.log-service-tag {
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.log-event-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.type-warn { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
.type-error { background: rgba(239, 68, 68, 0.15); color: var(--error); }

.log-detail { opacity: 0.8; font-size: 0.8rem; }

@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
