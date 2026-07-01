import { ref, computed, onMounted, onUnmounted } from 'vue';
import lyraService, { type LyraStatus } from '../../services/lyraService';
import { useAlerts } from '../../composables/useAlerts';
import echo from '@/plugins/echo';

/**
 * Composable para el estado global de Lyra y acciones básicas
 */
export function useLyraStatus() {
    const { success, error: showError } = useAlerts();

    const status = ref<LyraStatus | null>(null);
    const loadingStatus = ref(false);
    const showMaintenanceModal = ref(false);
    const changingStatus = ref(false);

    const isOnline = computed(() => status.value?.status === 'online');

    const fetchStatus = async () => {
        loadingStatus.value = true;
        try {
            status.value = await lyraService.getStatus();
        } catch (err: any) {
            // showError('No se pudo obtener el estado de Lyra');
        } finally {
            loadingStatus.value = false;
        }
    };

    /**
     * Abre el modal de confirmación o activa directamente
     */
    const toggleStatus = () => {
        if (isOnline.value) {
            showMaintenanceModal.value = true;
        } else {
            confirmStatusChange('online');
        }
    };

    /**
     * Procesa el cambio real de estado
     */
    const confirmStatusChange = async (targetStatus?: 'online' | 'maintenance') => {
        showMaintenanceModal.value = false;
        changingStatus.value = true;

        const nextStatus = targetStatus || (status.value?.status === 'online' ? 'maintenance' : 'online');

        try {
            await lyraService.updateStatus(nextStatus);
            if (status.value) status.value.status = nextStatus;

            if (nextStatus === 'maintenance') {
                success('Lyra está ahora en mantenimiento');
            } else {
                success('Lyra ha sido activada correctamente');
            }
        } catch (err: any) {
            showError('No se pudo cambiar el estado de Lyra');
        } finally {
            changingStatus.value = false;
        }
    };

    const clearCache = async () => {
        try {
            await lyraService.clearCache();
            success('Caché de Lyra limpiado');
        } catch (err: any) {
            showError('Error al limpiar el caché');
        }
    };

    // Polling para status cada 1 minuto
    onMounted(() => {
        fetchStatus();

        // Sincronización en tiempo real: escuchar cambios hechos por otros admins o sistema
        echo.channel('lyra.status')
            .listen('.status.changed', (data: { status: 'online' | 'maintenance' }) => {
                if (status.value) status.value.status = data.status;
            });
    });

    onUnmounted(() => {
        echo.leaveChannel('lyra.status');
    });

    return {
        status,
        loadingStatus,
        changingStatus,
        showMaintenanceModal,
        isOnline,
        fetchStatus,
        toggleStatus,
        confirmStatusChange,
        clearCache
    };
}
