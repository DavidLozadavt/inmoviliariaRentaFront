// composables/useProperties.ts
import { ref, computed, onMounted, nextTick } from 'vue';
import { propertyManagementService } from '../services/propertyManagementService';
import { useAlerts } from './useAlerts';
import type {
  Property,
  PropertyFilters,
  PropertyStats,
  PropertyAvailabilityStatus,
  PropertyVisibility,
} from '../types/property';

export function useProperties() {
  // Estados
  const properties = ref<Property[]>([]);
  const stats = ref<PropertyStats | null>(null);
  const loading = ref(false);
  const loadingStats = ref(false);
  const error = ref<string | null>(null);

  // Paginación
  const currentPage = ref(1);
  const perPage = ref(10);
  const totalPages = ref(1);
  const totalItems = ref(0);

  // Filtros
  const filters = ref<PropertyFilters>({
    search: '',
    status: '',
    approval_status: '',
    visibility: '',
    city: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Sistema de alertas
  const { success, error: showError, confirm } = useAlerts();

  /**
   * Cargar propiedades con filtros actuales
   */
  const loadProperties = async (silent: boolean = false) => {
    if (!silent) {
      loading.value = true;
    }

    try {
      error.value = null;

      const response = await propertyManagementService.getProperties({
        ...filters.value,
        page: currentPage.value,
        perPage: perPage.value,
      });

      properties.value = response.data;
      currentPage.value = response.meta.current_page;
      totalPages.value = response.meta.last_page;
      totalItems.value = response.meta.total;
      perPage.value = response.meta.per_page;

      console.log(`✅ Cargadas ${response.data.length} propiedades de ${response.meta.total} totales`);
    } catch (err: any) {
      console.error('❌ Error cargando propiedades:', err);
      error.value = err.response?.data?.message || err.message || 'Error al cargar propiedades';
      properties.value = [];
    } finally {
      if (!silent) {
        loading.value = false;
      }
    }
  };

  /**
   * Cargar estadísticas de propiedades
   */
  const loadStats = async () => {
    loadingStats.value = true;

    try {
      stats.value = await propertyManagementService.getPropertyStats();
      console.log('✅ Estadísticas de propiedades cargadas');
    } catch (err: any) {
      console.error('❌ Error cargando estadísticas:', err);
      // No mostrar error en UI, solo log
    } finally {
      loadingStats.value = false;
    }
  };

  /**
   * Aprobar una propiedad
   */
  const approveProperty = async (property: Property) => {
    try {
      loading.value = true;

      const updated = await propertyManagementService.updateApprovalStatus(
        property.id,
        'approved'
      );

      console.log('🔄 Propiedad actualizada recibida:', updated);
      console.log('🔄 approval_status:', updated.approval_status);

      // SOLUCIÓN: Forzar reactividad de forma correcta
      const index = properties.value.findIndex(p => p.id === property.id);
      if (index !== -1) {
        // Método 1: Crear nuevo array (más seguro)
        const newArray = [...properties.value];
        newArray[index] = {
          ...newArray[index],
          approval_status: 'approved'  // Forzar explícitamente
        };
        properties.value = newArray;

        // Método 2: Usar Object.assign para mantener la reactividad
        // Object.assign(properties.value[index], {
        //   approval_status: 'approved'
        // });

        console.log('✅ Propiedad actualizada en lista local');
        console.log('✅ Estado actual:', properties.value[index].approval_status);

        // Forzar actualización del componente
        await nextTick(); // Importante: esperar el siguiente ciclo de renderizado
      }

      success(`La propiedad "${property.title}" ha sido aprobada`);

      // Recargar stats
      await loadStats();

    } catch (err: any) {
      console.error('❌ Error aprobando propiedad:', err);
      showError(
        err.response?.data?.message || 'Error al aprobar la propiedad',
        'Error de Aprobación'
      );
    } finally {
      loading.value = false;
    }
  };

  /**
   * Rechazar una propiedad
   */
  const rejectProperty = async (property: Property) => {
    confirm(
      `¿Estás seguro de que deseas rechazar la propiedad "${property.title}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          loading.value = true;

          const updated = await propertyManagementService.updateApprovalStatus(
            property.id,
            'rejected'
          );

          // Actualizar en la lista local
          const index = properties.value.findIndex(p => p.id === property.id);
          if (index !== -1) {
            properties.value[index] = { ...properties.value[index], ...updated };
          }

          success(`La propiedad "${property.title}" ha sido rechazada`);

          // Recargar stats
          await loadStats();
        } catch (err: any) {
          console.error('❌ Error rechazando propiedad:', err);
          showError(
            err.response?.data?.message || 'Error al rechazar la propiedad',
            'Error de Rechazo'
          );
        } finally {
          loading.value = false;
        }
      },
      undefined,
      {
        title: 'Confirmar Rechazo',
        confirmText: 'Rechazar',
        cancelText: 'Cancelar',
      }
    );
  };

  /**
   * Cambiar estado de disponibilidad
   */
  const updateAvailabilityStatus = async (
    property: Property,
    newStatus: PropertyAvailabilityStatus
  ) => {
    try {
      loading.value = true;

      const updated = await propertyManagementService.updateAvailabilityStatus(
        property.id,
        newStatus
      );

      // Actualizar en la lista local
      const index = properties.value.findIndex(p => p.id === property.id);
      if (index !== -1) {
        properties.value[index] = { ...properties.value[index], ...updated };
      }

      const statusLabel = propertyManagementService.getStatusConfig(newStatus).label;
      success(`Estado actualizado a "${statusLabel}"`);

      // Recargar stats
      await loadStats();
    } catch (err: any) {
      console.error('❌ Error actualizando estado:', err);
      showError(
        err.response?.data?.message || 'Error al actualizar el estado',
        'Error de Actualización'
      );
    } finally {
      loading.value = false;
    }
  };

  /**
   * Cambiar visibilidad
   */
  const updateVisibility = async (property: Property, newVisibility: PropertyVisibility) => {
    try {
      loading.value = true;

      const updated = await propertyManagementService.updateVisibility(
        property.id,
        newVisibility
      );

      // Actualizar en la lista local
      const index = properties.value.findIndex(p => p.id === property.id);
      if (index !== -1) {
        properties.value[index] = { ...properties.value[index], ...updated };
      }

      const visibilityLabel = propertyManagementService.getVisibilityConfig(newVisibility).label;
      success(`Visibilidad cambiada a "${visibilityLabel}"`);

      // Recargar stats
      await loadStats();
    } catch (err: any) {
      console.error('❌ Error actualizando visibilidad:', err);
      showError(
        err.response?.data?.message || 'Error al cambiar la visibilidad',
        'Error de Actualización'
      );
    } finally {
      loading.value = false;
    }
  };

  /**
   * Eliminar una propiedad
   */
  const deleteProperty = async (property: Property) => {
    confirm(
      `¿Estás seguro de que deseas eliminar la propiedad "${property.title}"? Esta acción no se puede deshacer y se eliminarán todos los datos asociados.`,
      async () => {
        try {
          loading.value = true;

          await propertyManagementService.deleteProperty(property.id);

          // Eliminar de la lista local
          properties.value = properties.value.filter(p => p.id !== property.id);

          success(`La propiedad "${property.title}" ha sido eliminada`);

          // Recargar stats y lista
          await Promise.all([loadStats(), loadProperties(true)]);
        } catch (err: any) {
          console.error('❌ Error eliminando propiedad:', err);
          showError(
            err.response?.data?.message || 'Error al eliminar la propiedad',
            'Error de Eliminación'
          );
        } finally {
          loading.value = false;
        }
      },
      undefined,
      {
        title: 'Confirmar Eliminación',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
      }
    );
  };

  /**
   * Aplicar filtros (resetea a página 1)
   */
  const applyFilters = (newFilters: Partial<PropertyFilters>) => {
    filters.value = { ...filters.value, ...newFilters };
    currentPage.value = 1;
    loadProperties();
  };

  /**
   * Limpiar todos los filtros
   */
  const clearFilters = () => {
    filters.value = {
      search: '',
      status: '',
      approval_status: '',
      visibility: '',
      city: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    };
    currentPage.value = 1;
    loadProperties();
  };

  /**
   * Cambiar página
   */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      loadProperties();
    }
  };

  /**
   * Cambiar orden
   */
  const changeSorting = (sortBy: string) => {
    if (filters.value.sortBy === sortBy) {
      // Cambiar dirección
      filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Nuevo campo de ordenamiento
      filters.value.sortBy = sortBy;
      filters.value.sortOrder = 'desc';
    }

    loadProperties();
  };

  // Computed
  const hasFilters = computed(() => {
    return !!(
      filters.value.search ||
      filters.value.status ||
      filters.value.approval_status ||
      filters.value.visibility ||
      filters.value.city
    );
  });

  const hasPrevPage = computed(() => currentPage.value > 1);
  const hasNextPage = computed(() => currentPage.value < totalPages.value);

  // Inicializar al montar
  onMounted(() => {
    loadProperties();
    loadStats();
  });

  return {
    // Estado
    properties,
    stats,
    loading,
    loadingStats,
    error,
    filters,
    currentPage,
    perPage,
    totalPages,
    totalItems,
    hasFilters,
    hasPrevPage,
    hasNextPage,

    // Métodos
    loadProperties,
    loadStats,
    approveProperty,
    rejectProperty,
    updateAvailabilityStatus,
    updateVisibility,
    deleteProperty,
    applyFilters,
    clearFilters,
    goToPage,
    changeSorting,
  };
}