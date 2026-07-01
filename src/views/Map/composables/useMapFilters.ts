/**
 * @composable useMapFilters
 * @description Manages the reactive state for map-based property filtering.
 * Includes derived lists for cities and neighborhoods based on the selected Department.
 */
import { ref, computed } from 'vue';
import { COLOMBIA_GEO } from '@/services/propertyMapService';

export function useMapFilters() {
    const filters = ref({
        department: '',
        city: '',
        neighborhood: '',
        zone: '',
        address: '',
        status: '',
        min_price: undefined as number | string | undefined,
        max_price: undefined as number | string | undefined,
    });

    const departmentList = computed<string[]>(() => Object.keys(COLOMBIA_GEO).sort());

    const cityList = computed<string[]>(() =>
        filters.value.department ? Object.keys(COLOMBIA_GEO[filters.value.department] || {}).sort() : []
    );

    const neighborhoodList = computed<string[]>(() =>
        (filters.value.department && filters.value.city)
            ? (COLOMBIA_GEO[filters.value.department]?.[filters.value.city] ?? [])
            : []
    );

    const hasActiveFilters = computed(() =>
        !!(filters.value.department || filters.value.city || filters.value.neighborhood ||
            filters.value.zone || filters.value.status ||
            (typeof filters.value.min_price === 'number') || (typeof filters.value.max_price === 'number'))
    );

    /**
     * Resets all filters to their initial empty state.
     */
    const clearFilters = () => {
        filters.value = {
            department: '',
            city: '',
            neighborhood: '',
            zone: '',
            address: '',
            status: '',
            min_price: undefined,
            max_price: undefined,
        };
    };

    return {
        filters,
        departmentList,
        cityList,
        neighborhoodList,
        hasActiveFilters,
        clearFilters
    };
}
