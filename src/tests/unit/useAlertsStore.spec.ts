// src/tests/unit/useAlertsStore.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAlertsStore } from '@/stores/useAlertsStore';

describe('useAlertsStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('adds a success alert', () => {
        const store = useAlertsStore();
        store.success('Operation completed');
        expect(store.alerts).toHaveLength(1);
        expect(store.alerts[0].type).toBe('success');
        expect(store.alerts[0].message).toBe('Operation completed');
    });

    it('adds an error alert with title', () => {
        const store = useAlertsStore();
        store.error('Something went wrong', 'Error');
        expect(store.alerts[0].type).toBe('error');
        expect(store.alerts[0].title).toBe('Error');
    });

    it('deduplicates identical alerts', () => {
        const store = useAlertsStore();
        store.success('Same message');
        store.success('Same message');
        expect(store.alerts).toHaveLength(1);
    });

    it('evicts the oldest non-confirm alert when at MAX_ALERTS', () => {
        const store = useAlertsStore();
        store.success('Alert 1');
        store.success('Alert 2');
        store.success('Alert 3');
        const firstId = store.alerts[0].id;
        store.info('Alert 4');
        expect(store.alerts.find((a) => a.id === firstId)).toBeUndefined();
        expect(store.alerts).toHaveLength(3);
    });

    it('only allows one confirm dialog at a time', () => {
        const store = useAlertsStore();
        const id1 = store.confirm('Delete item?', () => { });
        const id2 = store.confirm('Another confirm?', () => { });
        expect(id1).toBe(id2);
        expect(store.alerts.filter((a) => a.type === 'confirm')).toHaveLength(1);
    });

    it('removes an alert by id', () => {
        const store = useAlertsStore();
        const id = store.success('Removable alert');
        store.remove(id);
        expect(store.alerts).toHaveLength(0);
    });

    it('clears all alerts', () => {
        const store = useAlertsStore();
        store.success('A');
        store.error('B');
        store.clear();
        expect(store.alerts).toHaveLength(0);
    });
});
