// src/stores/useAlertsStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface Alert {
    id: string;
    type: AlertType;
    title?: string;
    message: string;
    duration?: number;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

let _counter = 0;
const MAX_ALERTS = 3;

export const useAlertsStore = defineStore('alerts', () => {
    const alerts = ref<Alert[]>([]);

    function _genId(): string {
        return `alert-${_counter++}`;
    }

    function remove(id: string): void {
        const idx = alerts.value.findIndex((a) => a.id === id);
        if (idx !== -1) alerts.value.splice(idx, 1);
    }

    function show(options: Omit<Alert, 'id'>): string {
        // Only one confirm dialog at a time
        if (options.type === 'confirm') {
            const existing = alerts.value.find((a) => a.type === 'confirm');
            if (existing) return existing.id;
        }

        // Deduplicate by type + message
        const duplicate = alerts.value.find(
            (a) => a.type === options.type && a.message === options.message,
        );
        if (duplicate) return duplicate.id;

        // Evict oldest non-confirm when at capacity
        if (alerts.value.length >= MAX_ALERTS) {
            const oldest = alerts.value.find((a) => a.type !== 'confirm');
            if (oldest) remove(oldest.id);
        }

        const id = _genId();
        alerts.value.push({ id, ...options });

        // Auto-dismiss
        if (options.type !== 'confirm' && options.duration !== 0) {
            setTimeout(() => remove(id), options.duration ?? 4000);
        }

        return id;
    }

    function success(message: string, title?: string, duration?: number): string {
        return show({ type: 'success', message, title, duration });
    }

    function error(message: string, title?: string, duration?: number): string {
        return show({ type: 'error', message, title, duration });
    }

    function warning(message: string, title?: string, duration?: number): string {
        return show({ type: 'warning', message, title, duration });
    }

    function info(message: string, title?: string, duration?: number): string {
        return show({ type: 'info', message, title, duration });
    }

    function confirm(
        message: string,
        onConfirm: () => void,
        onCancel?: () => void,
        options?: { title?: string; confirmText?: string; cancelText?: string },
    ): string {
        return show({
            type: 'confirm',
            message,
            title: options?.title,
            confirmText: options?.confirmText ?? 'Confirmar',
            cancelText: options?.cancelText ?? 'Cancelar',
            onConfirm,
            onCancel,
            duration: 0,
        });
    }

    function clear(): void {
        alerts.value = [];
    }

    return { alerts, show, remove, success, error, warning, info, confirm, clear };
});
