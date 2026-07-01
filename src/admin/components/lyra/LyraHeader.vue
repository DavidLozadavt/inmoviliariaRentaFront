<script setup lang="ts">
import { computed } from 'vue';
import { useLyraStatus } from '../../composables/useLyraStatus';

const { status, toggleStatus, isOnline, changingStatus, showMaintenanceModal, confirmStatusChange } = useLyraStatus();

const statusLabel = computed(() => {
  if (!status.value) return 'Offline';
  const labels: any = {
    online: 'Operativa',
    maintenance: 'Mantenimiento',
    offline: 'Desconectada'
  };
  return labels[status.value.status] || 'Offline';
});
</script>

<template>
  <div class="lyra-header">
    <div class="lyra-header-left">
      <div class="lyra-avatar-wrap">
        <div class="lyra-avatar">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill="url(#lgAv)"/>
            <path d="M12 26 Q20 10 28 26" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <circle cx="20" cy="20" r="3" fill="white" opacity="0.9"/>
            <defs>
              <linearGradient id="lgAv" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stop-color="#818cf8"/>
                <stop offset="100%" stop-color="#6366f1"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="lyra-pulse" :class="{ 'pulse-offline': !isOnline }"></span>
      </div>
      <div>
        <div class="lyra-title-row">
          <h1 class="lyra-title">Lyra</h1>
          <span class="lyra-version">{{ status?.version || 'v2.1' }}</span>
        </div>
        <p class="lyra-subtitle">Cerebro conversacional de RentUs · NLP Engine</p>
      </div>
    </div>

    <div class="lyra-header-right">
      <div class="status-badge" :class="`status-${status?.status || 'offline'}`">
        <span class="status-dot"></span>
        {{ statusLabel }}
      </div>
      
      <div class="lyra-header-actions">
        <button 
          class="lyra-btn" 
          :class="isOnline ? 'lyra-btn-warning' : 'lyra-btn-success'"
          @click="toggleStatus"
          :disabled="changingStatus"
        >
          <font-awesome-icon :icon="['fas', isOnline ? 'pause' : 'play']" v-if="!changingStatus" />
          <font-awesome-icon :icon="['fas', 'spinner']" class="fa-spin" v-else />
          {{ isOnline ? 'Detener' : 'Activar' }}
        </button>
      </div>
    </div>

    <!-- Maintenance Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showMaintenanceModal" class="lyra-modal-overlay">
        <div class="lyra-modal">
          <div class="modal-icon warn">
            <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
          </div>
          <h2>¿Poner Lyra en mantenimiento?</h2>
          <p>El asistente dejará de responder a todos los usuarios inmediatamente. Podrás reactivarlo en cualquier momento.</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showMaintenanceModal = false" :disabled="changingStatus">Cancelar</button>
            <button class="btn-confirm" @click="confirmStatusChange('maintenance')" :disabled="changingStatus">
              <font-awesome-icon :icon="['fas', 'spinner']" class="fa-spin" v-if="changingStatus" />
              Confirmar Parada
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.lyra-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.lyra-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 10% 20%, var(--accent-ring) 0%, transparent 60%);
  opacity: 0.1;
  pointer-events: none;
}

.lyra-header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.lyra-avatar-wrap {
  position: relative;
}

.lyra-avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 4px 15px var(--accent-shadow);
}

.lyra-pulse {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--success);
  border: 2px solid var(--admin-surface);
  animation: pulse 2s infinite;
}

.lyra-pulse.pulse-offline {
  background: var(--warning);
  animation: none;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(52, 211, 153, 0); }
  100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
}

.lyra-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--white);
  margin: 0;
}

.lyra-version {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-family: 'DM Mono', monospace;
  color: var(--accent);
}

.lyra-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--admin-text-secondary);
}

.lyra-header-right {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-online { color: var(--success); }
.status-online .status-dot { background: var(--success); }

.status-maintenance { color: var(--warning); }
.status-maintenance .status-dot { background: var(--warning); }

.status-offline { color: var(--error); }
.status-offline .status-dot { background: var(--error); }

.lyra-btn {
  padding: 0.6rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.lyra-btn-success {
  background: var(--success);
  color: white;
}

.lyra-btn-success:hover {
  background: #059669;
  transform: translateY(-2px);
}

.lyra-btn-warning {
  background: var(--warning);
  color: white;
}

.lyra-btn-warning:hover {
  background: #d97706;
  transform: translateY(-2px);
}

/* Modal Styles */
.lyra-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
}

.lyra-modal {
  background: #1f2937;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2.5rem;
  max-width: 450px;
  width: 100%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: modal-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-pop {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 1.75rem;
}

.modal-icon.warn {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.lyra-modal h2 {
  color: white;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 800;
}

.lyra-modal p {
  color: #9ca3af;
  line-height: 1.6;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.modal-actions button {
  flex: 1;
  padding: 0.85rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-confirm {
  background: #f43f5e;
  color: white;
}

.btn-confirm:hover {
  background: #e11d48;
  transform: translateY(-2px);
}

.btn-confirm:disabled, .btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
