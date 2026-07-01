<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import Chart from 'chart.js/auto';

interface Props {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: number;
  sparklineData?: number[];
  loading?: boolean;
}

const props = defineProps<Props>();
const chartRef = ref<HTMLCanvasElement | null>(null);


onMounted(() => {
  if (chartRef.value && props.sparklineData?.length) {
    new Chart(chartRef.value, {
      type: 'line',
      data: {
        labels: props.sparklineData.map((_, i) => i),
        datasets: [{
          data: props.sparklineData,
          borderColor: props.color,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
          backgroundColor: `${props.color}15`,
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
});

const trendClass = computed(() => {
  if (!props.trend) return '';
  return props.trend > 0 ? 'trend-up' : 'trend-down';
});
</script>

<template>
  <div class="stat-card" :style="{ '--card-color': color }">
    <div class="stat-card-main">
      <div class="stat-icon-wrap" :style="{ background: `${color}20` }">
        <font-awesome-icon :icon="['fas', icon]" :style="{ color: color }" />
      </div>
      
      <div class="stat-info">
        <span class="stat-label">{{ label }}</span>
        <div class="stat-value-row">
          <h2 class="stat-value">{{ loading ? '...' : value }}</h2>
          <div v-if="trend" class="stat-trend" :class="trendClass">
            <font-awesome-icon :icon="['fas', trend > 0 ? 'arrow-up' : 'arrow-down']" />
            {{ Math.abs(trend) }}%
          </div>
        </div>
      </div>
    </div>
    
    <div class="stat-sparkline" v-if="sparklineData">
      <canvas ref="chartRef"></canvas>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  border-color: var(--card-color);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.stat-card-main {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  z-index: 2;
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--admin-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0;
  color: var(--white);
  font-family: 'DM Mono', monospace;
}

.stat-trend {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-up {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.trend-down {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.stat-sparkline {
  height: 40px;
  width: 100%;
}
</style>
