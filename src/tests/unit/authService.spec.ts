// src/tests/unit/authService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '@/services/auth';

// Mock the api module
vi.mock('@/services/api', async () => {
    const actual = await vi.importActual<typeof import('@/services/api')>('@/services/api');
    return {
        ...actual,
        default: {
            post: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
            defaults: { headers: { common: {} } },
        },
        getToken: actual.getToken,
        saveToken: actual.saveToken,
        clearStorage: actual.clearStorage,
    };
});

import api from '@/services/api';

describe('authService', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    describe('isAuthenticated()', () => {
        it('returns false when no token is stored', () => {
            expect(authService.isAuthenticated()).toBe(false);
        });

        it('returns true when a token exists in sessionStorage', () => {
            sessionStorage.setItem('auth_token', 'test-token');
            expect(authService.isAuthenticated()).toBe(true);
        });

        it('returns true when a token exists in localStorage', () => {
            localStorage.setItem('auth_token', 'test-token');
            expect(authService.isAuthenticated()).toBe(true);
        });
    });

    describe('hasRole()', () => {
        it('returns true when user has matching role', () => {
            sessionStorage.setItem(
                'user',
                JSON.stringify({ id: 1, name: 'Admin', email: 'a@b.com', role: 'admin', phone: '', address: '', id_documento: '', status: 'active' }),
            );
            expect(authService.hasRole('admin')).toBe(true);
        });

        it('returns false when user has different role', () => {
            sessionStorage.setItem(
                'user',
                JSON.stringify({ id: 2, name: 'User', email: 'u@b.com', role: 'user', phone: '', address: '', id_documento: '', status: 'active' }),
            );
            expect(authService.hasRole('admin')).toBe(false);
        });
    });

    describe('login()', () => {
        it('throws a user-friendly error on 401', async () => {
            const { AxiosError } = await import('axios');
            const err = new AxiosError('Unauthorized');
            err.response = { status: 401, data: { message: 'Credenciales inválidas' } } as any;
            (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(err);

            await expect(
                authService.login({ email: 'bad@email.com', password: 'wrong' }),
            ).rejects.toThrow('Credenciales inválidas');
        });

        it('saves token on successful login', async () => {
            (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({
                data: {
                    success: true,
                    token: 'jwt-token-12345',
                    user: { id: 1, name: 'Test User', email: 't@t.com', role: 'user', phone: '', address: '', id_documento: '', status: 'active' },
                },
            });

            const result = await authService.login({ email: 'test@test.com', password: 'password123' });

            expect(result.success).toBe(true);
            expect(sessionStorage.getItem('auth_token')).toBe('jwt-token-12345');
        });
    });

    describe('logout()', () => {
        it('clears storage after logout', async () => {
            sessionStorage.setItem('auth_token', 'some-token');
            sessionStorage.setItem('user', JSON.stringify({ id: 1 }));
            (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({});

            await authService.logout();

            expect(sessionStorage.getItem('auth_token')).toBeNull();
            expect(sessionStorage.getItem('user')).toBeNull();
        });
    });
});
