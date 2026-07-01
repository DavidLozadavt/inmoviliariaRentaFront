import { ref, watch, onMounted, onUnmounted } from 'vue';
import lyraService, { type ChatSession, type PaginationMeta } from '../../services/lyraService';
import { useAlerts } from '../../composables/useAlerts';
import echo from '@/plugins/echo';

/**
 * Composable para gestionar sesiones de chat de Lyra con tiempo real
 */
export function useLyraSessions() {
    const { error: showError, success } = useAlerts();

    const sessions = ref<ChatSession[]>([]);
    const activeSession = ref<ChatSession | null>(null);
    const stats = ref<any>(null);
    const loadingSessions = ref(false);
    const loadingMore = ref(false);
    const loadingDetail = ref(false);
    const loadingStats = ref(false);
    const hasMore = ref(true);
    const page = ref(1);

    const pagination = ref<PaginationMeta>({
        total: 0,
        current_page: 1,
        last_page: 1
    });

    const filters = ref({
        intent: '' as string,
        city: '',
        dateFrom: '',
        dateTo: '',
        userType: 'all',
        search: '',
        status: 'all',
        sortBy: 'updated_at',
        sortDir: 'desc'
    });

    const fetchSessions = async (p: number = 1, append: boolean = false) => {
        if (append) loadingMore.value = true;
        else loadingSessions.value = true;

        try {
            page.value = p;
            const { data, meta } = await lyraService.getSessions({
                page: p,
                ...filters.value
            });

            if (append) {
                sessions.value.push(...data);
            } else {
                sessions.value = data;
            }

            pagination.value = meta;
            hasMore.value = meta.current_page < meta.last_page;
        } catch (err: any) {
            showError('Error al cargar sesiones de chat');
        } finally {
            loadingSessions.value = false;
            loadingMore.value = false;
        }
    };

    const fetchStats = async () => {
        loadingStats.value = true;
        try {
            stats.value = await lyraService.getSessionStats();
        } catch (err) {
            console.error('Error fetching stats', err);
        } finally {
            loadingStats.value = false;
        }
    };

    const loadMore = async () => {
        if (loadingMore.value || !hasMore.value) return;
        await fetchSessions(page.value + 1, true);
    };

    const getSessionDetail = async (id: string) => {
        loadingDetail.value = true;
        try {
            activeSession.value = await lyraService.getSessionDetail(id);
        } catch (err: any) {
            showError('No se pudo cargar el detalle de la conversación');
        } finally {
            loadingDetail.value = false;
        }
    };

    const setStatus = async (id: string, status: string) => {
        try {
            await lyraService.updateSession(id, { status });
            // El broadcast se encargará de actualizar la UI globalmente, 
            // pero para respuesta inmediata lo hacemos local también:
            if (activeSession.value && activeSession.value.id === id) {
                activeSession.value.status = status as any;
            }
            const s = sessions.value.find(s => s.id === id);
            if (s) s.status = status as any;

            success('Estado actualizado');
        } catch (err: any) {
            showError('Error al actualizar estado');
        }
    };

    const deleteSession = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta sesión permanentemente?')) return;
        try {
            await lyraService.deleteSession(id);
            sessions.value = sessions.value.filter(s => s.id !== id);
            if (activeSession.value?.id === id) activeSession.value = null;
            success('Sesión eliminada');
            fetchStats();
        } catch (err) {
            showError('No se pudo eliminar la sesión');
        }
    };

    const blockSession = async (id: string, reason: string) => {
        try {
            await lyraService.blockSession(id, reason);
            success('Usuario/Sesión bloqueada');
            if (activeSession.value?.id === id) activeSession.value.status = 'blocked' as any;
        } catch (err) {
            showError('Error al bloquear');
        }
    };

    const exportSessions = async (format: 'csv' | 'json') => {
        try {
            success(`Generando archivo ${format.toUpperCase()}...`);
            await lyraService.exportSessions(filters.value, format);
        } catch (err: any) {
            showError('Error al exportar historial');
        }
    };

    // ── Tiempo Real con Echo ─────────────────────────────────────
    // MODIFIED: suscripción directa en onMounted usando el plugin echo
    onMounted(() => {
        fetchStats();

        echo.channel('lyra.sessions')
            .listen('.session.new', (e: any) => {
                if (!sessions.value.find(s => s.id === e.session.id)) {
                    sessions.value.unshift({
                        ...e.session,
                        id: e.session.id,
                        lastIntent: e.session.last_intent || 'desconocido',
                        messageCount: e.session.messages_count || 1,
                        city: e.session.city,
                        updatedAt: e.session.updated_at,
                        createdAt: e.session.created_at,
                        userType: e.session.user_id ? 'registered' : 'anonymous',
                        status: e.session.status || 'active',
                        messages: [],
                        metadata: e.session.metadata || {},
                        user: e.session.user || null,
                    });
                    fetchStats();
                }
            })
            .listen('.session.updated', (e: any) => {
                const s = sessions.value.find(s => s.id === e.id);
                if (s) {
                    s.status = e.status;
                    s.lastIntent = e.lastIntent || s.lastIntent;
                    s.city = e.city || s.city;
                    s.updatedAt = new Date().toISOString();
                }
                if (activeSession.value && activeSession.value.id === e.id) {
                    activeSession.value.status = e.status;
                    activeSession.value.lastIntent = e.lastIntent || activeSession.value.lastIntent;
                    activeSession.value.city = e.city || activeSession.value.city;
                }
            })
            .listen('.session.deleted', (e: any) => {
                sessions.value = sessions.value.filter(s => s.id !== e.id);
                if (activeSession.value && activeSession.value.id === e.id) {
                    activeSession.value = null;
                }
                fetchStats();
            })
            .listen('.message.new', (e: any) => {
                console.log('🔥 MESSAGE.NEW RECIBIDO:', e)

                // Actualizar contador y mover al tope de la lista
                const s = sessions.value.find(s => s.id === e.sessionId)
                if (s) {
                    s.messageCount++
                    s.updatedAt = e.message.created_at
                    s.lastIntent = e.message.intent || s.lastIntent
                    sessions.value = [s, ...sessions.value.filter(item => item.id !== s.id)]
                }

                // MODIFIED: reasignar objeto completo para forzar reactividad en producción
                if (activeSession.value && activeSession.value.id === e.sessionId) {
                    activeSession.value = {
                        ...activeSession.value,
                        messages: [...activeSession.value.messages, {
                            id: e.message.id?.toString(),
                            role: e.message.role,
                            content: e.message.content,
                            timestamp: e.message.created_at,
                            intent: e.message.intent,
                            confidence: e.message.confidence,
                            entities: e.message.entities,
                            thinkingProcess: e.message.thinking_process,
                            processingTimeMs: e.message.processing_time_ms,
                        }]
                    }
                    setTimeout(() => {
                        const el = document.querySelector('.chat-container')
                        if (el) el.scrollTop = el.scrollHeight
                    }, 0)
                }
            })
    });

    onUnmounted(() => {
        // MODIFIED: usar echo directamente para limpiar
        echo.leaveChannel('lyra.sessions');
    });

    // Watch filters to reload sessions
    watch(filters, () => fetchSessions(1), { deep: true });

    return {
        sessions,
        activeSession,
        stats,
        loadingSessions,
        loadingMore,
        loadingDetail,
        loadingStats,
        pagination,
        filters,
        hasMore,
        fetchSessions,
        fetchStats,
        loadMore,
        getSessionDetail,
        setStatus,
        deleteSession,
        blockSession,
        exportSessions
    };
}