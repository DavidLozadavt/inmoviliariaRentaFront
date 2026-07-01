// src/stores/useNotificationStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import logger from '@/utils/logger';

export interface AppNotification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    read: boolean;
    created_at: string;
}

export const useNotificationStore = defineStore('notifications', () => {
    // ── State ────────────────────────────────────────────────────────────────
    const notifications = ref<AppNotification[]>([]);
    const isLoading = ref(false);

    // ── Getters ──────────────────────────────────────────────────────────────
    const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length);
    const hasUnread = computed(() => unreadCount.value > 0);

    // ── Actions ──────────────────────────────────────────────────────────────
    async function fetchNotifications(): Promise<void> {
        isLoading.value = true;
        try {
            const response = await api.get<{ data: AppNotification[] }>('/notifications');
            notifications.value = response.data.data ?? [];
        } catch (err: unknown) {
            logger.warn('Failed to fetch notifications:', err);
        } finally {
            isLoading.value = false;
        }
    }

    async function markAsRead(id: number): Promise<void> {
        try {
            await api.put(`/notifications/${id}/read`);
            const notification = notifications.value.find((n) => n.id === id);
            if (notification) notification.read = true;
        } catch (err: unknown) {
            logger.warn('Failed to mark notification as read:', err);
        }
    }

    async function markAllAsRead(): Promise<void> {
        try {
            await api.put('/notifications/mark-all-read');
            notifications.value.forEach((n) => { n.read = true; });
        } catch (err: unknown) {
            logger.warn('Failed to mark all notifications as read:', err);
        }
    }

    function addLocal(notification: Omit<AppNotification, 'id' | 'read' | 'created_at'>): void {
        notifications.value.unshift({
            id: Date.now(),
            read: false,
            created_at: new Date().toISOString(),
            ...notification,
        });
    }

    function addNotification(message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info'): void {
        addLocal({ title: 'Notificación', message, type });
    }

    function clearAll(): void {
        notifications.value = [];
    }

    return {
        notifications,
        isLoading,
        unreadCount,
        hasUnread,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addLocal,
        addNotification,
        clearAll,
    };
});
