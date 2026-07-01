import { ref, onMounted, onUnmounted } from 'vue';
import api from '../services/api';

export interface Activity {
  id: string;
  type: string;
  data: Record<string, any>;
  created_at: string;
  timestamp?: number;
}

export function useRecentActivity(limit: number = 5, autoRefresh: boolean = true) {
  const activities = ref<Activity[]>([]);
  const loading = ref(false);
  const error = ref('');
  const lastUpdate = ref<Date | null>(null);
  let intervalId: number | null = null;

  const loadActivities = async (silent: boolean = false) => {
    if (!silent) {
      loading.value = true;
    }

    try {
      error.value = '';

      const response = await api.get('/admin/dashboard/activity', {
        params: { limit }
      });

      if (response.data.success) {
        activities.value = response.data.data;
        lastUpdate.value = new Date(response.data.meta.timestamp);
      } else {
        throw new Error(response.data.message || 'Error en la respuesta del servidor');
      }
    } catch (err: any) {
      console.error('Error cargando actividades:', err);
      error.value = err.response?.data?.message || err.message || 'Error al cargar actividades';

      // Si falla, intentar mostrar datos en caché o vacío
      if (!silent) {
        activities.value = [];
      }
    } finally {
      if (!silent) {
        loading.value = false;
      }
    }
  };

  const refresh = () => loadActivities();

  const startAutoRefresh = () => {
    if (autoRefresh && !intervalId) {
      // Refrescar cada 30 segundos
      intervalId = window.setInterval(() => {
        loadActivities(true); // Silent refresh
      }, 30000);
    }
  };

  const stopAutoRefresh = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const formatTimeAgo = (dateInput: any): string => {
    try {
      if (!dateInput) return "Hace un momento";

      let date: Date;

      // Si ya es un objeto Date
      if (dateInput instanceof Date) {
        date = dateInput;
      }
      // Si es un string
      else if (typeof dateInput === 'string') {
        // Intentar parsear como fecha ISO
        date = new Date(dateInput);

        // Si falla, intentar con formato MySQL
        if (isNaN(date.getTime())) {
          date = new Date(dateInput.replace(' ', 'T') + 'Z');
        }

        // Si aún falla, intentar sin timezone
        if (isNaN(date.getTime())) {
          date = new Date(dateInput.replace(' ', 'T'));
        }
      }
      // Si es un número (timestamp)
      else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
      }
      // Si no se puede determinar
      else {
        console.warn('Formato de fecha no reconocido:', dateInput);
        return "Recientemente";
      }

      if (isNaN(date.getTime())) {
        return "Recientemente";
      }

      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (seconds < 60) return "Hace unos segundos";
      if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
      if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
      if (seconds < 2592000) return `Hace ${Math.floor(seconds / 86400)} días`;
      if (seconds < 31536000) return `Hace ${Math.floor(seconds / 2592000)} meses`;

      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, 'Input:', dateInput);
      return "Recientemente";
    }
  };

  const getActivityCount = (type?: string): number => {
    if (type) {
      return activities.value.filter(activity => activity.type === type).length;
    }
    return activities.value.length;
  };

  onMounted(() => {
    loadActivities();
    startAutoRefresh();
  });

  onUnmounted(() => {
    stopAutoRefresh();
  });

  return {
    activities,
    loading,
    error,
    lastUpdate,
    loadActivities: refresh,
    refresh,
    formatTimeAgo,
    getActivityCount,
    startAutoRefresh,
    stopAutoRefresh,
  };
}