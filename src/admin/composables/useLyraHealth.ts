import { ref, onMounted, onUnmounted } from 'vue';
import lyraService, { type HealthCheck } from '../../services/lyraService';
import { useAlerts } from '../../composables/useAlerts';

/**
 * Composable para monitorear la salud de Lyra en tiempo real
 */
export function useLyraHealth() {
    const { success, error: showError } = useAlerts();

    const healthChecks = ref<HealthCheck[]>([]);
    const loadingHealth = ref(false);
    const healthHistory = ref<Record<string, number[]>>({}); // Store history for sparklines
    const lastIncident = ref<{ service: string; status: string; timestamp: string } | null>(null);

    const fetchHealth = async () => {
        loadingHealth.value = true;
        try {
            const data = await lyraService.getHealth();
            healthChecks.value = data;

            // Update history for sparklines
            data.forEach((check) => {
                if (!healthHistory.value[check.service]) {
                    healthHistory.value[check.service] = [];
                }
                healthHistory.value[check.service].push(check.latency);
                if (healthHistory.value[check.service].length > 10) {
                    healthHistory.value[check.service].shift();
                }

                // Detect incidents
                if (check.status !== 'healthy') {
                    lastIncident.value = {
                        service: check.service,
                        status: check.status,
                        timestamp: new Date().toISOString()
                    };
                }
            });
        } catch (err: any) {
            // showError('Error al obtener salud del sistema');
        } finally {
            loadingHealth.value = false;
        }
    };

    const restartService = async (service: string) => {
        try {
            await lyraService.restartService(service);
            success(`Servicio ${service} reiniciado correctamente`);
            await fetchHealth();
        } catch (err: any) {
            showError(`Error al reiniciar ${service}`);
        }
    };

    const incidents = ref<any[]>([]);
    const loadingIncidents = ref(false);

    const fetchIncidents = async (days: number = 7) => {
        loadingIncidents.value = true;
        try {
            incidents.value = await lyraService.getHealthIncidents(days);
        } catch (err: any) {
            // showError('Error al obtener incidencias');
        } finally {
            loadingIncidents.value = false;
        }
    };

    let intervalId: any = null;
    onMounted(() => {
        fetchHealth();
        fetchIncidents();
        intervalId = setInterval(fetchHealth, 30000); // Poll every 30s
    });

    onUnmounted(() => {
        if (intervalId) clearInterval(intervalId);
    });

    return {
        healthChecks,
        loadingHealth,
        healthHistory,
        lastIncident,
        incidents,
        loadingIncidents,
        fetchHealth,
        fetchIncidents,
        restartService
    };
}
