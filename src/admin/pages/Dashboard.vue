<template>
  <div class="modern-dashboard">
    <!-- Header -->
    <header class="dash-header">
      <div class="greeting">
        <h1 class="title">Hola, {{ userName }} 👋</h1>
        <p class="subtitle">Aquí tienes el resumen de tu negocio hoy, {{ currentDate }}.</p>
      </div>
      <div class="header-actions">
        <button class="btn-outline" @click="goToProperties">
          <font-awesome-icon :icon="['fas', 'building']" /> Ver Propiedades
        </button>
        <button class="btn-primary" @click="goToNewProperty">
          <font-awesome-icon :icon="['fas', 'plus']" /> Nueva Propiedad
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="loader-container">
      <div class="spinner"></div>
      <p>Cargando métricas...</p>
    </div>

    <div v-else-if="loadError" class="error-container">
      <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="error-icon" />
      <p>{{ loadError }}</p>
      <button class="btn-primary" @click="loadDashboardData">Reintentar</button>
    </div>

    <main v-else class="dash-content">
      <!-- Metric Cards -->
      <section class="metrics-grid">
        <article class="metric-card">
          <div class="card-header">
            <div class="icon-box blue">
              <font-awesome-icon :icon="['fas', 'users']" />
            </div>
            <span class="trend" :class="getTrendClass(stats?.users.growth)">
              <font-awesome-icon :icon="['fas', getTrendIcon(stats?.users.growth)]" /> 
              {{ formatGrowth(stats?.users.growth) }}
            </span>
          </div>
          <div class="card-body">
            <h3>Usuarios Totales</h3>
            <p class="value">{{ stats?.users.total || 0 }}</p>
            <p class="comparison">vs mes anterior</p>
          </div>
        </article>

        <article class="metric-card">
          <div class="card-header">
            <div class="icon-box green">
              <font-awesome-icon :icon="['fas', 'home']" />
            </div>
            <span class="trend" :class="getTrendClass(stats?.properties.growth)">
              <font-awesome-icon :icon="['fas', getTrendIcon(stats?.properties.growth)]" /> 
              {{ formatGrowth(stats?.properties.growth) }}
            </span>
          </div>
          <div class="card-body">
            <h3>Propiedades Activas</h3>
            <p class="value">{{ stats?.properties.available || 0 }}</p>
            <p class="comparison">vs mes anterior</p>
          </div>
        </article>

        <article class="metric-card">
          <div class="card-header">
            <div class="icon-box purple">
              <font-awesome-icon :icon="['fas', 'file-contract']" />
            </div>
            <span class="trend" :class="getTrendClass(stats?.contracts.growth)">
              <font-awesome-icon :icon="['fas', getTrendIcon(stats?.contracts.growth)]" /> 
              {{ formatGrowth(stats?.contracts.growth) }}
            </span>
          </div>
          <div class="card-body">
            <h3>Contratos Activos</h3>
            <p class="value">{{ stats?.contracts.active || 0 }}</p>
            <p class="comparison">vs mes anterior</p>
          </div>
        </article>

        <article class="metric-card">
          <div class="card-header">
            <div class="icon-box orange">
              <font-awesome-icon :icon="['fas', 'wallet']" />
            </div>
            <span class="trend" :class="getTrendClass(stats?.payments.growth)">
              <font-awesome-icon :icon="['fas', getTrendIcon(stats?.payments.growth)]" /> 
              {{ formatGrowth(stats?.payments.growth) }}
            </span>
          </div>
          <div class="card-body">
            <h3>Ingresos del Mes</h3>
            <p class="value">{{ formatCurrency(stats?.payments.revenue || 0) }}</p>
            <p class="comparison">vs mes anterior</p>
          </div>
        </article>
      </section>

      <!-- Charts Section -->
      <section class="charts-section">
        <div class="chart-container main-chart">
          <div class="chart-header">
            <div>
              <h3>Evolución de Ingresos</h3>
              <p>Últimos 6 meses</p>
            </div>
          </div>
          <div class="chart-wrapper">
            <Line :data="revenueChartData" :options="chartOptions" v-if="chartReady" />
          </div>
        </div>

        <div class="chart-container side-chart">
          <div class="chart-header">
            <h3>Distribución de Propiedades</h3>
          </div>
          <div class="doughnut-wrapper">
            <Doughnut :data="propertiesChartData" :options="doughnutOptions" v-if="chartReady" />
          </div>
          <div class="custom-legend">
            <div class="legend-item" v-for="(item, index) in propertiesChartData.labels" :key="index">
              <span class="dot" :style="{ backgroundColor: (propertiesChartData.datasets[0].backgroundColor as string[])[index] }"></span>
              <span class="label">{{ item }}</span>
              <span class="val">{{ propertiesChartData.datasets[0].data[index] }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Bottom Layout -->
      <section class="bottom-grid">
        <div class="activity-section card-box">
          <div class="section-top">
            <h3>Actividad Reciente</h3>
            <button class="btn-icon" @click="loadActivities" :disabled="loadingActivity">
              <font-awesome-icon :icon="['fas', 'sync-alt']" :class="{ 'spin-anim': loadingActivity }" />
            </button>
          </div>
          
          <div class="timeline" v-if="activities.length">
            <div class="timeline-item" v-for="act in activities.slice(0, 6)" :key="act.id">
              <div class="tl-icon" :style="{ backgroundColor: getSoftColor(act.type), color: getHardColor(act.type) }">
                <font-awesome-icon :icon="['fas', getActivityIcon(act.type)]" />
              </div>
              <div class="tl-content">
                <p class="tl-text">{{ getActivityText(act) }}</p>
                <span class="tl-time">{{ formatTimeAgo(act.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="empty-state" v-else>
            <font-awesome-icon :icon="['fas', 'inbox']" />
            <p>No hay actividad registrada aún.</p>
          </div>
        </div>

        <div class="actions-section card-box">
          <h3>Atención Requerida</h3>
          <p class="sub-text">Tareas pendientes que necesitan tu revisión</p>
          
          <div class="action-list">
            <div class="action-card" @click="router.push('/admin/properties')">
              <div class="ac-icon bg-orange"><font-awesome-icon :icon="['fas', 'home']" /></div>
              <div class="ac-info">
                <h4>{{ stats?.properties.pending_approval || 0 }} Propiedades</h4>
                <p>Pendientes de aprobación</p>
              </div>
              <font-awesome-icon :icon="['fas', 'chevron-right']" class="ac-arrow" />
            </div>

            <div class="action-card" @click="router.push('/admin/contracts')">
              <div class="ac-icon bg-red"><font-awesome-icon :icon="['fas', 'file-signature']" /></div>
              <div class="ac-info">
                <h4>{{ stats?.contracts.pending || 0 }} Contratos</h4>
                <p>Pendientes de validación o firma</p>
              </div>
              <font-awesome-icon :icon="['fas', 'chevron-right']" class="ac-arrow" />
            </div>

            <div class="action-card" @click="router.push('/admin/maintenances')">
              <div class="ac-icon bg-purple"><font-awesome-icon :icon="['fas', 'tools']" /></div>
              <div class="ac-info">
                <h4>{{ stats?.maintenances.pending || 0 }} Mantenimientos</h4>
                <p>Solicitudes nuevas sin revisar</p>
              </div>
              <font-awesome-icon :icon="['fas', 'chevron-right']" class="ac-arrow" />
            </div>
            
            <div class="action-card" @click="router.push('/admin/reports')">
              <div class="ac-icon bg-blue"><font-awesome-icon :icon="['fas', 'clipboard-list']" /></div>
              <div class="ac-info">
                <h4>{{ pendingReportsCount }} Reportes</h4>
                <p>Casos generados por usuarios</p>
              </div>
              <font-awesome-icon :icon="['fas', 'chevron-right']" class="ac-arrow" />
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { adminService, type AdminStats } from '@/services/adminService';
import { useUserStore } from '@/stores/useUserStore';
import { eventBus, EVENTS } from '@/events/eventBus';
import api from '@/services/api';

// Chart.js imports
import { Line, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler,
  ArcElement
);

const router = useRouter();
const userStore = useUserStore();

// State
const stats = ref<AdminStats | null>(null);
const isLoading = ref(true);
const loadError = ref<string | null>(null);
const pendingReportsCount = ref(0);

// Activities
const activities = ref<any[]>([]);
const loadingActivity = ref(false);
let activityInterval: number | null = null;

// Derived Data
const userName = computed(() => userStore.displayName);
const currentDate = computed(() => {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(new Date());
});

// ==================== CHARTS DATA & STYLING ====================
const chartReady = ref(false);

const revenueChartData = ref({
  labels: ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'],
  datasets: [
    {
      label: 'Ingresos Mensuales',
      data: [12000000, 15000000, 14500000, 18000000, 22000000, 25000000],
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      borderWidth: 3,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#8b5cf6',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      fill: true,
      tension: 0.4 // Smooth curves
    }
  ]
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1f2937',
      padding: 12,
      titleFont: { size: 13, family: 'sans-serif' },
      bodyFont: { size: 14, family: 'sans-serif', weight: 'bold' as const },
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) { label += ': '; }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      border: { display: false },
      ticks: {
        color: '#64748b',
        font: { family: 'sans-serif', size: 11 },
        callback: function(value: any) {
          return '$' + (value / 1000000) + 'M'; // Format as millions
        }
      }
    },
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#64748b', font: { family: 'sans-serif', size: 12 } }
    }
  },
  interaction: { intersect: false, mode: 'index' as const }
};

const propertiesChartData = ref({
  labels: ['Disponibles', 'Rentadas', 'Mantenimiento', 'Inactivas'],
  datasets: [{
    data: [0, 0, 0, 0],
    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#94a3b8'],
    borderWidth: 0,
    hoverOffset: 4
  }]
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1f2937',
      bodyFont: { family: 'sans-serif', size: 13 },
      padding: 10,
      callbacks: {
        label: function(context: any) {
          return ` ${context.label}: ${context.raw}`;
        }
      }
    }
  }
};

// ==================== METHODS ====================
const getTrendClass = (growth?: number) => {
  if (growth === undefined || growth === 0) return 'neutral';
  return growth > 0 ? 'positive' : 'negative';
};

const getTrendIcon = (growth?: number) => {
  if (growth === undefined || growth === 0) return 'minus';
  return growth > 0 ? 'arrow-trend-up' : 'arrow-trend-down';
};

const formatGrowth = (growth?: number) => {
  if (growth === undefined) return '0%';
  if (growth === 0) return 'Sin cambios';
  const prefix = growth > 0 ? '+' : '';
  return `${prefix}${growth}%`;
};

const loadDashboardData = async () => {
  isLoading.value = true;
  loadError.value = null;

  try {
    const [statsData, reportsRes] = await Promise.all([
      adminService.getDashboardStats(),
      api.get('/admin/reports/stats').catch(() => ({ data: { data: { pending_reports: 0 } } }))
    ]);

    stats.value = statsData;
    pendingReportsCount.value = reportsRes.data?.data?.pending_reports || 0;
    
    // Update Revenue Chart
    if (statsData.charts?.revenue) {
       revenueChartData.value.labels = statsData.charts.revenue.labels;
       revenueChartData.value.datasets[0].data = statsData.charts.revenue.data;
    } else {
       revenueChartData.value.datasets[0].data = [0,0,0,0,0,0];
    }
    
    // Update Doughnut Chart
    propertiesChartData.value.datasets[0].data = [
      statsData.properties.available || 0,
      statsData.properties.rented || 0,
      statsData.properties.maintenance || 0,
      (statsData.properties.total || 0) - (statsData.properties.available || 0) - (statsData.properties.rented || 0) - (statsData.properties.maintenance || 0)
    ];

    await loadActivities();
    
    // Render charts
    if (typeof window !== 'undefined') {
      nextTick(() => {
        chartReady.value = true;
      });
    }
  } catch (error: any) {
    console.error('Error cargando dashboard:', error);
    loadError.value = 'Ocurrió un error al cargar las métricas. Por favor intenta de nuevo.';
  } finally {
    isLoading.value = false;
  }
};

const loadActivities = async () => {
  loadingActivity.value = true;
  try {
    const response = await api.get('/admin/dashboard/activity', { params: { limit: 10 } });
    if (response.data && response.data.success !== false) {
      activities.value = response.data.data || [];
    }
  } catch (err) {
    console.error(err);
  } finally {
    loadingActivity.value = false;
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatTimeAgo = (dateString: string): string => {
  try {
    if (!dateString) return "Hace un momento";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recientemente";
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Hace unos seg";
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
    if (seconds < 2592000) return `Hace ${Math.floor(seconds / 86400)} d`;
    
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  } catch (e) {
    return "Recientemente";
  }
};

// Activity mappings
const getActivityIcon = (type: string): string => {
  const icons: Record<string, string> = {
    user_registered: 'user-plus', user_updated: 'user-edit', user_deleted: 'user-minus',
    property_created: 'building', property_updated: 'edit', property_deleted: 'trash-alt',
    contract_signed: 'file-signature', payment_received: 'money-bill-wave',
    maintenance_requested: 'wrench', rental_request: 'clipboard-list'
  };
  return icons[type] || 'circle';
};

const getSoftColor = (type: string): string => {
  if (type.includes('user')) return '#dbeafe'; // Blue 100
  if (type.includes('property')) return '#dcfce7'; // Green 100
  if (type.includes('contract')) return '#fef3c7'; // Amber 100
  if (type.includes('payment')) return '#f3e8ff'; // Purple 100
  if (type.includes('maintenance')) return '#fee2e2'; // Red 100
  return '#f1f5f9'; // Slate 100
};

const getHardColor = (type: string): string => {
  if (type.includes('user')) return '#2563eb'; // Blue 600
  if (type.includes('property')) return '#16a34a'; // Green 600
  if (type.includes('contract')) return '#d97706'; // Amber 600
  if (type.includes('payment')) return '#9333ea'; // Purple 600
  if (type.includes('maintenance')) return '#dc2626'; // Red 600
  return '#475569'; // Slate 600
};

const getActivityText = (activity: any): string => {
  // Si ya tiene description explícita (del fallback de AdminDashboardController), usarla
  if (activity.data?.description) return activity.data.description;

  const d = activity.data || {};
  const type = activity.type || '';

  switch (type) {
    case 'user_registered':
      return `${d.user_name || 'Un usuario'} se registró en la plataforma.`;
    case 'user_deleted':
      return `${d.deleted_by || 'Sistema'} eliminó al usuario ${d.user_name || ''}.`;
    case 'user_status_changed':
      return `El estado de ${d.user_name || 'un usuario'} cambió de ${d.old_status || '?'} a ${d.new_status || '?'}.`;
    case 'user_role_changed':
      return `${d.changed_by || 'Sistema'} cambió el rol de ${d.user_name || 'un usuario'} a ${d.new_role || '?'}.`;
    case 'user_updated':
      return `${d.updated_by || 'Sistema'} actualizó los datos de ${d.user_name || 'un usuario'}.`;
    case 'property_created':
      return `${d.created_by || 'Un usuario'} publicó la propiedad "${d.property_title || ''}".`;
    case 'property_deleted':
      return `${d.deleted_by || 'Sistema'} eliminó la propiedad "${d.property_title || ''}".`;
    case 'property_updated':
      return `${d.updated_by || 'Sistema'} actualizó la propiedad "${d.property_title || ''}".`;
    case 'property_status_changed':
      return `El estado de "${d.property_title || 'una propiedad'}" cambió a ${d.new_status || '?'}.`;
    case 'contract_created':
    case 'contract_signed':
      return `${d.created_by || 'Un usuario'} creó un contrato para "${d.property_title || 'una propiedad'}".`;
    case 'payment_received':
      const amount = d.amount ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(d.amount) : '';
      return `${d.received_by || 'Un usuario'} realizó un pago${amount ? ' de ' + amount : ''}.`;
    case 'maintenance_requested':
      return `${d.requested_by || 'Un usuario'} solicitó mantenimiento para "${d.property_title || 'una propiedad'}".`;
    case 'rental_request':
      return `${d.requested_by || 'Un usuario'} solicitó arriendo para "${d.property_title || 'una propiedad'}".`;
    default:
      return activity.title || 'Actividad registrada';
  }
};

const goToNewProperty = () => router.push('/admin/properties/new');
const goToProperties = () => router.push('/admin/properties');

// Lifecycle
onMounted(async () => {
  await loadDashboardData();
  activityInterval = window.setInterval(loadActivities, 60000);
  eventBus.on(EVENTS.NOTIFICATION_RECEIVED, loadDashboardData);
});

onUnmounted(() => {
  if (activityInterval) clearInterval(activityInterval);
  eventBus.off(EVENTS.NOTIFICATION_RECEIVED, loadDashboardData);
});
</script>

<style scoped>
/* 
  🎨 RENTUS MODERN DASHBOARD V2 
  SaaS Inspired, Clear Hierarchy, Custom Space
*/

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.modern-dashboard {
  --font-main: 'Plus Jakarta Sans', system-ui, sans-serif;
  --bg-color: #f8fafc;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  
  --c-blue: #3b82f6; --c-blue-soft: #eff6ff;
  --c-green: #10b981; --c-green-soft: #ecfdf5;
  --c-purple: #8b5cf6; --c-purple-soft: #f5f3ff;
  --c-orange: #f59e0b; --c-orange-soft: #fffbeb;
  --c-red: #ef4444; --c-red-soft: #fef2f2;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.02);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02);
  
  font-family: var(--font-main);;
  min-height: 100vh;
  padding: 1.5rem 2rem;
  color: var(--text-main);
  max-width: 1600px;
  margin: 0 auto;
}

/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.spin-anim { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* HEADER */
.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  animation: fadeIn 0.4s ease-out;
}

.greeting .title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.02em;
}

.greeting .subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin: 0;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

button {
  font-family: var(--font-main);
  cursor: pointer;
  outline: none;
}

.btn-primary {
  background: var(--text-main); /* Dark sleek button */
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover {
  background: #1e293b;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-outline {
  background: white;
  color: var(--text-main);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}
.btn-outline:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* STATES */
.loader-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 1rem;
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--c-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.error-icon { font-size: 3rem; color: var(--c-red); }

/* MAIN CONTENT */
.dash-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 1. METRICS GRID */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  animation: fadeIn 0.5s ease-out 0.1s both;
}

.metric-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}
.metric-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
  border-color: #cbd5e1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.icon-box {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem;
}
.icon-box.blue { background: var(--c-blue-soft); color: var(--c-blue); }
.icon-box.green { background: var(--c-green-soft); color: var(--c-green); }
.icon-box.purple { background: var(--c-purple-soft); color: var(--c-purple); }
.icon-box.orange { background: var(--c-orange-soft); color: var(--c-orange); }

.trend {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  display: flex; align-items: center; gap: 0.25rem;
}
.trend.positive { background: var(--c-green-soft); color: var(--c-green); }
.trend.negative { background: var(--c-red-soft); color: var(--c-red); }
.trend.neutral { background: #f1f5f9; color: #64748b; }

.card-body h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0 0 0.25rem 0;
}
.card-body .value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.03em;
}
.card-body .comparison {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
}

/* 2. CHARTS SECTION */
.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
  animation: fadeIn 0.6s ease-out 0.2s both;
}

.chart-container {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.chart-header h3 { font-size: 1.1rem; font-weight: 700; margin: 0; }
.chart-header p { font-size: 0.85rem; color: var(--text-muted); margin: 0.25rem 0 0 0; }

.chart-select {
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  font-family: var(--font-main);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
  background: #f8fafc;
  cursor: pointer;
  outline: none;
}
.chart-select:focus { border-color: var(--c-blue); }

.chart-wrapper {
  flex: 1;
  min-height: 280px;
  width: 100%;
  position: relative;
}

.doughnut-wrapper {
  height: 200px;
  position: relative;
  display: flex;
  justify-content: center;
}

.custom-legend {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}
.legend-item .dot {
  width: 10px; height: 10px; border-radius: 50%;
  margin-right: 0.75rem;
}
.legend-item .label {
  color: var(--text-muted);
  flex: 1;
  font-weight: 500;
}
.legend-item .val {
  font-weight: 700;
  color: var(--text-main);
}

/* 3. BOTTOM GRID */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  animation: fadeIn 0.7s ease-out 0.3s both;
}

.card-box {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}
.card-box h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 0.25rem 0; }
.card-box .sub-text { font-size: 0.85rem; color: var(--text-muted); margin: 0 0 1.5rem 0; }

.section-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.5rem;
}
.btn-icon {
  background: transparent; border: none; font-size: 1.1rem; color: var(--text-muted); transition: color 0.2s;
}
.btn-icon:hover { color: var(--text-main); }

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: relative;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 17px; top: 10px; bottom: 10px;
  width: 2px;
  background: #f1f5f9;
  z-index: 0;
}
.timeline-item {
  display: flex;
  gap: 1rem;
  position: relative;
  z-index: 1;
}
.tl-icon {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
  box-shadow: 0 0 0 4px white;
}
.tl-content {
  display: flex; flex-direction: column; justify-content: center; gap: 0.2rem;
}
.tl-text { margin: 0; font-size: 0.9rem; font-weight: 600; color: #334155; }
.tl-time { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

.empty-state {
  text-align: center; color: #94a3b8; padding: 2rem 0;
}
.empty-state svg { font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5; }

/* Actions */
.action-list {
  display: flex; flex-direction: column; gap: 0.75rem;
}
.action-card {
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}
.action-card:hover {
  border-color: #cbd5e1;
  box-shadow: var(--shadow-sm);
  background: #f8fafc;
}
.action-card:hover .ac-arrow {
  transform: translateX(4px);
  color: var(--text-main);
}
.ac-icon {
  width: 42px; height: 42px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; color: white;
}
.bg-orange { background: var(--c-orange); }
.bg-red { background: var(--c-red); }
.bg-purple { background: var(--c-purple); }
.bg-blue { background: var(--c-blue); }

.ac-info { flex: 1; }
.ac-info h4 { margin: 0 0 0.15rem 0; font-size: 0.95rem; font-weight: 700; color: var(--text-main); }
.ac-info p { margin: 0; font-size: 0.8rem; color: var(--text-muted); font-weight: 500;}
.ac-arrow { color: #cbd5e1; transition: all 0.2s; font-size: 1rem; }

/* RESPONSIVE */
@media (max-width: 1024px) {
  .charts-section, .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .modern-dashboard { padding: 1rem; }
  .dash-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .header-actions { width: 100%; }
  .btn-primary, .btn-outline { flex: 1; justify-content: center; }
  .chart-wrapper { height: 240px; }
}
</style>