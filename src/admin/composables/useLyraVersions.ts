import { ref, onMounted } from 'vue';
import lyraService, { type LyraVersion } from '../../services/lyraService';
import { useAlerts } from '../../composables/useAlerts';

/**
 * Composable para gestionar versiones y rollbacks de Lyra
 */
export function useLyraVersions() {
    const { error: showError, success } = useAlerts();

    const versions = ref<LyraVersion[]>([]);
    const currentVersion = ref<string | null>(null);
    const loadingVersions = ref(false);
    const performingRollback = ref(false);

    const fetchVersions = async () => {
        loadingVersions.value = true;
        try {
            const history = await lyraService.getVersions();
            versions.value = history;
            const current = history.find((v: any) => v.is_current);
            currentVersion.value = current ? current.version : null;
        } catch (err: any) {
            // showError('Error al cargar versiones');
        } finally {
            loadingVersions.value = false;
        }
    };

    const rollback = async (versionId: string) => {
        performingRollback.value = true;
        try {
            await lyraService.rollbackVersion(versionId);
            success('Rollback completado con éxito');
            await fetchVersions();
        } catch (err: any) {
            showError('Error al realizar rollback');
        } finally {
            performingRollback.value = false;
        }
    };

    // MODIFIED: agregar estado y método para crear versión
    const creatingVersion = ref(false)
    const showCreateModal = ref(false)

    const createVersion = async (data: {
        version: string
        changelog: string
        activate: boolean
        metrics?: { success_rate?: number; avg_response_ms?: number }
    }) => {
        creatingVersion.value = true
        try {
            await lyraService.createVersion(data)
            success(`Versión ${data.version} creada correctamente`)
            showCreateModal.value = false
            await fetchVersions() // recargar lista
        } catch (err: any) {
            showError(err.response?.data?.message || 'Error al crear versión')
        } finally {
            creatingVersion.value = false
        }
    }

    onMounted(() => {
        fetchVersions();
    });

    return {
        versions,
        currentVersion,
        loadingVersions,
        performingRollback,
        creatingVersion,
        showCreateModal,
        fetchVersions,
        rollback,
        createVersion
    };
}
