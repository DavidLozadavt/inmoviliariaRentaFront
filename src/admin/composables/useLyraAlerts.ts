import { ref, onMounted, onUnmounted } from 'vue';
import lyraService from '../../services/lyraService';

/**
 * Composable para alertas administrativas de Lyra
 */
export function useLyraAlerts() {
    const pendingAlerts = ref<any[]>([]);
    const loadingAlerts = ref(false);

    const fetchAlerts = async () => {
        loadingAlerts.value = true;
        try {
            pendingAlerts.value = await lyraService.getPendingAlerts();
        } catch (err: any) {
            console.error('Error fetching admin alerts:', err);
        } finally {
            loadingAlerts.value = false;
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await lyraService.markAlertAsRead(id);
            pendingAlerts.value = pendingAlerts.value.filter(a => a.id !== id);
        } catch (err: any) {
            console.error('Error marking alert as read:', err);
        }
    };

    let intervalId: any = null;
    onMounted(() => {
        fetchAlerts();
        intervalId = setInterval(fetchAlerts, 60000); // Poll every 1m
    });

    onUnmounted(() => {
        if (intervalId) clearInterval(intervalId);
    });

    return {
        pendingAlerts,
        loadingAlerts,
        fetchAlerts,
        markAsRead
    };
}
