<script setup lang="ts">
import { ref, onMounted } from 'vue';
import StatCard from './shared/StatCard.vue';
import lyraService, { type LyraStats, type LyraIntentStats } from '../../../services/lyraService';
import Chart from 'chart.js/auto';

const stats = ref<LyraStats | null>(null);
const intents = ref<LyraIntentStats[]>([]);
const hourlyData = ref<number[]>(new Array(168).fill(0));
const loading = ref(true);
const error = ref<string | null>(null);
const trendChartRef = ref<HTMLCanvasElement | null>(null);
let trendChart: Chart | null = null;

const fetchDashboardData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [statsData, intentsData, hourlyRaw] = await Promise.all([
      lyraService.getStats(),
      lyraService.getIntentStats('30d'),
      lyraService.getHourlyStats()
    ]);
    stats.value = statsData;
    intents.value = intentsData;
    
    // Map hourly data (day [0-6], hour [0-23]) to index 0-167
    if (hourlyRaw) {
      const mapped = new Array(168).fill(0);
      hourlyRaw.forEach((item: any) => {
        const idx = (item.day * 24) + item.hour;
        if (idx >= 0 && idx < 168) mapped[idx] = item.count;
      });
      hourlyData.value = mapped;
    }

    initTrendChart();
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    error.value = 'No se pudieron cargar las estadísticas. Verifica tu conexión.';
  } finally {
    loading.value = false;
  }
};

const retry = () => fetchDashboardData();

const initTrendChart = () => {
  if (trendChartRef.value && stats.value?.weeklyTrend) {
    if (trendChart) trendChart.destroy();
    trendChart = new Chart(trendChartRef.value, {
      type: 'line',
      data: {
        labels: stats.value.weeklyTrend.map(t => t.date),
        datasets: [{
          label: 'Conversaciones',
          data: stats.value.weeklyTrend.map(t => t.chats),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            titleFont: { family: 'DM Sans', size: 12 },
            bodyFont: { family: 'DM Sans', size: 14 },
            padding: 12,
            cornerRadius: 10,
            displayColors: false
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' }, beginAtZero: true }
        }
      }
    });
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<template>
  <div class="lyra-dashboard">
    <div v-if="error" class="lyra-card error-state-full">
      <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
      <p>{{ error }}</p>
      <button class="mini-btn" @click="retry">Reintentar</button>
    </div>

    <!-- Stat Cards Grid -->
    <div v-else class="stats-grid">
      <StatCard 
        label="Conversaciones Totales" 
        :value="stats?.totalChats || 0" 
        icon="comments" 
        color="#6366f1"
        :sparklineData="[30, 45, 32, 50, 40, 60, 55]"
        :loading="loading"
      />
      <StatCard 
        label="Hoy" 
        :value="stats?.todayChats || 0" 
        icon="calendar-day" 
        color="#10b981"
        :trend="12"
        :sparklineData="[12, 18, 15, 22, 25, 19, 38]"
        :loading="loading"
      />
      <StatCard 
        label="Msgs Promedio" 
        :value="stats?.avgMessages?.toFixed(1) || '0.0'" 
        icon="exchange-alt" 
        color="#f59e0b"
        :sparklineData="[4.1, 4.3, 3.9, 4.5, 4.2, 4.8, 4.3]"
        :loading="loading"
      />
      <StatCard 
        label="Tasa de Éxito" 
        :value="`${stats?.successRate || 0}%`" 
        icon="check-circle" 
        color="#06b6d4"
        :trend="3"
        :sparklineData="[82, 85, 84, 88, 86, 89, 87]"
        :loading="loading"
      />
    </div>

    <!-- Charts Row -->
    <div class="dashboard-row">
      <!-- Main Trend Chart -->
      <div class="lyra-card trend-chart-card">
        <div class="lyra-card-header">
          <font-awesome-icon :icon="['fas', 'chart-line']" />
          Tendencia de Conversaciones (14 días)
        </div>
        <div class="chart-wrap">
          <canvas ref="trendChartRef"></canvas>
        </div>
      </div>

      <!-- Intents Distribution -->
      <div class="lyra-card intents-card">
        <div class="lyra-card-header">
          <font-awesome-icon :icon="['fas', 'brain']" />
          Distribución de Intents
        </div>
        <div class="intent-list">
          <div class="intent-item" v-for="intent in intents" :key="intent.intent">
            <div class="intent-info">
              <span class="intent-name">{{ intent.intent }}</span>
              <span class="intent-pct">{{ intent.percentage }}%</span>
            </div>
            <div class="intent-progress-bg">
              <div 
                class="intent-progress-fill" 
                :style="{ width: `${intent.percentage}%`, background: '#6366f1' }"
              ></div>
            </div>
            <div class="intent-meta">
              <span>{{ intent.count }} consultas</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Secondary Row -->
    <div class="dashboard-row secondary-row">
      <!-- Heatmap (Mock) -->
      <div class="lyra-card heatmap-card">
        <div class="lyra-card-header">
          <font-awesome-icon :icon="['fas', 'th']" />
          Actividad por Hora (Heatmap)
        </div>
        <!-- PENDING_ENDPOINT: GET /admin/lyra/stats/hourly — endpoint no implementado aún -->
        <div class="heatmap-grid-wrap">
          <div class="heatmap-days">
            <span v-for="d in ['Lun', 'Mie', 'Vie', 'Dom']" :key="d">{{ d }}</span>
          </div>
          <div class="heatmap-body">
            <div 
              v-for="(count, idx) in hourlyData" 
              :key="idx" 
              class="heat-cell"
              :style="{ 
                opacity: count === 0 ? 0.05 : Math.min(0.2 + (count / 10), 1),
                background: count > 5 ? 'var(--accent)' : 'rgba(99, 102, 241, 0.5)'
              }"
              :title="`Hora: ${idx % 24}:00 - Msgs: ${count}`"
            ></div>
          </div>
        </div>
        <div class="heatmap-legend">
          <span>Baja</span>
          <div class="legend-gradient"></div>
          <span>Alta</span>
        </div>
      </div>

      <!-- Quality Metrics -->
      <div class="lyra-card quality-card">
        <div class="lyra-card-header">
          <font-awesome-icon :icon="['fas', 'award']" />
          Métricas de Calidad NLP
        </div>
        <div class="quality-grid">
          <div class="quality-item">
            <div class="q-val">12%</div>
            <div class="q-label">Necesitó Clarificación</div>
          </div>
          <div class="quality-item">
            <div class="q-val">6%</div>
            <div class="q-label">Fuera de Contexto</div>
          </div>
          <div class="quality-item">
            <div class="q-val">2.8s</div>
            <div class="q-label">Latencia Promedio</div>
          </div>
          <div class="quality-item">
            <div class="q-val q-warn">Buscar Propiedad</div>
            <div class="q-label">Intent más confundido</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lyra-dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: slideUp 0.4s ease-out;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.dashboard-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.chart-wrap {
  height: 300px;
  position: relative;
}

.intent-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.intent-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.intent-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 600;
}

.intent-name {
  color: var(--admin-text-primary);
}

.intent-pct {
  color: var(--accent);
}

.intent-progress-bg {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  overflow: hidden;
}

.intent-progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 1s ease-out;
}

.intent-meta {
  font-size: 0.75rem;
  color: var(--admin-text-secondary);
  text-align: right;
  opacity: 0.7;
}

/* Heatmap */
.heatmap-grid-wrap {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.heatmap-days {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--admin-text-secondary);
  padding: 4px 0;
}

.heatmap-body {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: repeat(7, 1fr);
  gap: 3px;
}

.heat-cell {
  aspect-ratio: 1;
  background: var(--accent);
  border-radius: 2px;
  min-width: 8px;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: flex-end;
  font-size: 0.7rem;
  color: var(--admin-text-secondary);
}

.legend-gradient {
  width: 100px;
  height: 6px;
  background: linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 1));
  border-radius: 10px;
}

/* Quality Grid */
.quality-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.quality-item {
  background: rgba(255, 255, 255, 0.03);
  padding: 1.25rem;
  border-radius: 16px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.q-val {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--white);
  margin-bottom: 0.25rem;
  font-family: 'DM Mono', monospace;
}

.q-val.q-warn {
  font-size: 1rem;
  color: var(--warning);
}

.q-label {
  font-size: 0.75rem;
  color: var(--admin-text-secondary);
}

.error-state-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: var(--danger);
  grid-column: 1 / -1;
}

.error-state-full p {
  color: var(--admin-text-secondary);
  font-size: 0.9rem;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
  .dashboard-row {
    grid-template-columns: 1fr;
  }
}
</style>
