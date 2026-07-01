<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';

interface Props {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  history?: number[];
  details?: string;
  lastCheck: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['restart']);

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart | null = null;

const statusData = computed(() => {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    healthy: { label: 'Saludable', color: '#10b981', icon: 'check-circle' },
    degraded: { label: 'Degradado', color: '#f59e0b', icon: 'exclamation-triangle' },
    down: { label: 'Caído', color: '#ef4444', icon: 'times-circle' }
  };
  return map[props.status] || { label: 'Desconocido', color: '#6b7280', icon: 'question-circle' };
});

const serviceLabel = computed(() => {
  const map: Record<string, string> = {
    nlp_engine: 'Motor NLP',
    cache: 'Caché de Contexto',
    geo_engine: 'Geo-Engine',
    database: 'Base de Datos',
    queue: 'Cola de Trabajo'
  };
  return map[props.service] || props.service;
});

const initChart = () => {
  if (canvasRef.value && props.history?.length) {
    if (chart) chart.destroy();
    chart = new Chart(canvasRef.value, {
      type: 'line',
      data: {
        labels: props.history.map((_, i) => i),
        datasets: [{
          data: props.history,
          borderColor: statusData.value.color,
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.3,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
  }
};

onMounted(initChart);
watch(() => props.history, initChart, { deep: true });
</script>

<template>
  <div class="health-indicator" :class="`status-${status}`">
    <div class="health-top">
      <div class="health-icon" :style="{ background: `${statusData.color}15`, color: statusData.color }">
        <font-awesome-icon :icon="['fas', statusData.icon]" />
      </div>
      <div class="health-meta">
        <span class="service-name">{{ serviceLabel }}</span>
        <span class="status-text">{{ statusData.label }}</span>
      </div>
      <div class="health-actions" v-if="service === 'cache' || service === 'queue'">
        <button class="restart-btn" @click="$emit('restart', service)" title="Reiniciar servicio">
          <font-awesome-icon :icon="['fas', 'sync-alt']" />
        </button>
      </div>
    </div>
    
    <div class="health-metrics">
      <div class="metric-item">
        <span class="m-label">Latencia</span>
        <span class="m-val">{{ latency }}ms</span>
      </div>
      <div class="metric-sparkline">
        <canvas ref="canvasRef"></canvas>
      </div>
    </div>
    
    <div class="health-footer">
      <span class="last-check">Último check: {{ new Date(lastCheck).toLocaleTimeString() }}</span>
    </div>
    
    <div class="details-popup" v-if="details">
      <p>{{ details }}</p>
    </div>
  </div>
</template>

<style scoped>
.health-indicator {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 16px;
  padding: 1.25rem;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
}

.health-indicator::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: v-bind('statusData.color');
}

.health-top {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.health-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.health-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.service-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--white);
}

.status-text {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.8;
}

.restart-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--admin-border);
  color: var(--admin-text-secondary);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.restart-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.health-metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
}

.m-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: var(--admin-text-secondary);
}

.m-val {
  font-size: 1rem;
  font-weight: 700;
  color: var(--white);
  font-family: 'DM Mono', monospace;
}

.metric-sparkline {
  flex: 1;
  height: 30px;
}

.health-footer {
  font-size: 0.65rem;
  color: var(--admin-text-secondary);
  opacity: 0.6;
  text-align: right;
}

.status-degraded {
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.status-down {
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  animation: pulse-down 2s infinite;
}

@keyframes pulse-down {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
</style>
