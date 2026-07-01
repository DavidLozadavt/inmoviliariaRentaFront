// src/stores/useUserStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth';
import type { User, UserRole } from '@/services/auth';

export const useUserStore = defineStore('user', () => {
    // ── State ────────────────────────────────────────────────────────────────
    const user = ref<User | null>(authService.getUser());
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // ── Getters ──────────────────────────────────────────────────────────────
    const isAuthenticated = computed(() => !!user.value && authService.isAuthenticated());
    const isAdmin = computed(() => user.value?.role === 'admin');
    const hasAdminAccess = computed(() =>
        user.value?.role === 'admin' || user.value?.role === 'support',
    );
    const displayName = computed(() => user.value?.name ?? 'Usuario');
    const avatarUrl = computed(() => user.value?.photo ?? null);

    // ── Actions ──────────────────────────────────────────────────────────────

    /**
     * Load the current user from the API and cache in store.
     * @param force Force a refresh even if user is already loaded
     */
    async function loadMe(force = false): Promise<void> {
        // Avoid redundant calls while already loading
        if (isLoading.value) return;

        // Skip if already have user and not forcing refresh
        if (user.value && !force) return;

        isLoading.value = true;
        error.value = null;

        try {
            user.value = await authService.getMe();
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Error al obtener usuario';
            user.value = null;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Log the current user out and clear store state.
     */
    async function logout(): Promise<void> {
        await authService.logout();
        user.value = null;
    }

    /**
     * Returns true if the stored user has a specific role.
     */
    function hasRole(role: UserRole): boolean {
        return user.value?.role === role;
    }

    function setUser(u: User): void {
        user.value = u;
    }

    function clearUser(): void {
        user.value = null;
    }

    return {
        // State
        user,
        isLoading,
        error,
        // Getters
        isAuthenticated,
        isAdmin,
        hasAdminAccess,
        displayName,
        avatarUrl,
        // Actions
        loadMe,
        logout,
        hasRole,
        setUser,
        clearUser,
    };
});
