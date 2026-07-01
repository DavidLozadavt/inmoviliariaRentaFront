// src/tests/integration/router.guards.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { defineComponent } from 'vue';

// --- Minimal mock components ---
const MockHome = defineComponent({ template: '<div>Home</div>' });
const MockLogin = defineComponent({ template: '<div>Login</div>' });
const MockProfile = defineComponent({ template: '<div>Profile</div>' });
const MockAdmin = defineComponent({ template: '<div>Admin</div>' });

// --- Mock authService ---
const mockIsAuthenticated = vi.fn(() => false);
const mockGetMe = vi.fn();

vi.mock('@/services/auth', () => ({
    authService: {
        isAuthenticated: mockIsAuthenticated,
        getMe: mockGetMe,
        logout: vi.fn(),
    },
}));

import { authService } from '@/services/auth';

// --- Build a minimal router that mirrors the real guards ---
function buildRouter() {
    const routes: RouteRecordRaw[] = [
        { path: '/', name: 'home', component: MockHome },
        { path: '/login', name: 'Login', component: MockLogin, meta: { hideForAuth: true } },
        { path: '/perfil', name: 'ProfileView', component: MockProfile, meta: { requiresAuth: true } },
        { path: '/admin/dashboard', name: 'admin-dashboard', component: MockAdmin, meta: { requiresAuth: true, requiresAdmin: true } },
    ];

    const router = createRouter({ history: createWebHistory(), routes });

    router.beforeEach(async (to, _from, next) => {
        const isAuthenticated = authService.isAuthenticated();
        const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
        const hideForAuth = to.matched.some((r) => r.meta.hideForAuth);
        const requiresAdmin = to.matched.some((r) => r.meta.requiresAdmin);

        if (requiresAuth && !isAuthenticated) {
            next({ name: 'Login' });
            return;
        }

        if (hideForAuth && isAuthenticated) {
            try {
                const user = await authService.getMe();
                next({ name: user.role === 'admin' ? 'admin-dashboard' : 'home' });
            } catch {
                next({ name: 'home' });
            }
            return;
        }

        if (isAuthenticated && requiresAdmin) {
            try {
                const user = await authService.getMe();
                if (user.role !== 'admin' && user.role !== 'support') {
                    next({ name: 'home', query: { error: 'unauthorized' } });
                    return;
                }
            } catch {
                next({ name: 'Login' });
                return;
            }
        }

        next();
    });

    return router;
}

describe('Router Guards', () => {
    let router: ReturnType<typeof buildRouter>;

    beforeEach(async () => {
        router = buildRouter();
        mockIsAuthenticated.mockReturnValue(false);
        mockGetMe.mockReset();
        await router.push('/');
        await router.isReady();
    });

    it('redirects unauthenticated user from protected route to Login', async () => {
        await router.push('/perfil');
        expect(router.currentRoute.value.name).toBe('Login');
    });

    it('allows unauthenticated user to visit home', async () => {
        await router.push('/');
        expect(router.currentRoute.value.path).toBe('/');
    });

    it('redirects authenticated admin away from login to admin-dashboard', async () => {
        mockIsAuthenticated.mockReturnValue(true);
        mockGetMe.mockResolvedValue({ role: 'admin' });
        await router.push('/login');
        expect(router.currentRoute.value.name).toBe('admin-dashboard');
    });

    it('redirects authenticated regular user away from login to home', async () => {
        mockIsAuthenticated.mockReturnValue(true);
        mockGetMe.mockResolvedValue({ role: 'user' });
        await router.push('/login');
        expect(router.currentRoute.value.name).toBe('home');
    });

    it('redirects non-admin from admin route to home with error query', async () => {
        mockIsAuthenticated.mockReturnValue(true);
        mockGetMe.mockResolvedValue({ role: 'user' });
        await router.push('/admin/dashboard');
        expect(router.currentRoute.value.name).toBe('home');
        expect(router.currentRoute.value.query.error).toBe('unauthorized');
    });

    it('allows admin to access admin dashboard', async () => {
        mockIsAuthenticated.mockReturnValue(true);
        mockGetMe.mockResolvedValue({ role: 'admin' });
        await router.push('/admin/dashboard');
        expect(router.currentRoute.value.name).toBe('admin-dashboard');
    });
});
