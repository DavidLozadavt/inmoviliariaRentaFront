// src/stores/usePropertyStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { propertyManagementService } from '@/services/propertyManagementService';
import type { Property, PropertyFilters, PaginatedPropertiesResponse, PropertyStats } from '@/types/property';

/** Cache TTL: 60 seconds */
const CACHE_TTL_MS = 60_000;

export const usePropertyStore = defineStore('property', () => {
    // ── State ────────────────────────────────────────────────────────────────
    const properties = ref<Property[]>([]);
    const stats = ref<PropertyStats | null>(null);
    const currentProperty = ref<Property | null>(null);
    const pagination = ref<PaginatedPropertiesResponse['meta'] | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const lastFetchedAt = ref<number | null>(null);

    // ── Getters ──────────────────────────────────────────────────────────────
    const isCacheValid = computed(() => {
        if (!lastFetchedAt.value) return false;
        return Date.now() - lastFetchedAt.value < CACHE_TTL_MS;
    });

    // ── Actions ──────────────────────────────────────────────────────────────

    /**
     * Fetch properties from the API and cache the result.
     * @param filters - Optional filters and pagination
     * @param forceRefresh - Skip cache check if true
     */
    async function fetchProperties(filters: PropertyFilters = {}, forceRefresh = false): Promise<void> {
        // Return cached data if still fresh
        if (!forceRefresh && isCacheValid.value && !Object.keys(filters).length) return;

        isLoading.value = true;
        error.value = null;

        try {
            const response = await propertyManagementService.getProperties(filters);
            properties.value = response.data;
            pagination.value = response.meta;
            lastFetchedAt.value = Date.now();
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Error al cargar propiedades';
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Fetch a single property by ID.
     */
    async function fetchProperty(id: number): Promise<void> {
        isLoading.value = true;
        error.value = null;

        try {
            currentProperty.value = await propertyManagementService.getProperty(id);
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Error al cargar la propiedad';
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Fetch property statistics from the dedicated stats endpoint.
     */
    async function fetchStats(): Promise<void> {
        try {
            stats.value = await propertyManagementService.getPropertyStats();
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Error al cargar estadísticas';
        }
    }

    /** Remove a property optimistically and then sync with the API. */
    async function removeProperty(id: number): Promise<void> {
        const backup = [...properties.value];
        properties.value = properties.value.filter((p) => p.id !== id);

        try {
            await propertyManagementService.deleteProperty(id);
        } catch (err: unknown) {
            // Roll back on failure
            properties.value = backup;
            throw err;
        }
    }

    function clearCache(): void {
        lastFetchedAt.value = null;
    }

    return {
        // State
        properties,
        stats,
        currentProperty,
        pagination,
        isLoading,
        error,
        // Getters
        isCacheValid,
        // Actions
        fetchProperties,
        fetchProperty,
        fetchStats,
        removeProperty,
        clearCache,
    };
});
