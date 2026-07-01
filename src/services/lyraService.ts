import api from './api';

/**
 * Lyra Service - Conector con el motor NLP de RentUs
 */

export interface LyraStatus {
    status: 'online' | 'maintenance' | 'offline';
    version: string;
    uptime: string;
    lastRestart?: string;
}

export interface LyraStats {
    totalChats: number;
    todayChats: number;
    avgMessages: number;
    successRate: number;
    topCity: string;
    topIntent: string;
    weeklyTrend: { date: string; chats: number }[];
}

export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    intent?: string;
    confidence?: number;
    entities?: any;
    thinkingProcess?: any;
    processingTimeMs?: number;
    _showThinking?: boolean;
}

export interface ChatSession {
    id: string;
    lastIntent: string;
    lastMessage?: string;
    messageCount: number;
    city?: string;
    updatedAt: string;
    createdAt: string;
    userName?: string;
    userId?: number;
    userType: 'anonymous' | 'registered';
    status: 'active' | 'archived' | 'flagged' | 'reviewed' | 'pending' | 'blocked';
    messages: ChatMessage[];
    metadata: any;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
        initials?: string;
    };
}

export interface LyraVersion {
    id: number;
    version: string;
    is_current: boolean;
    deployed_at: string;
    deployed_by: string;
    changelog: string;
    metrics: {
        success_rate?: number;
        avg_response_ms?: number;
    };
}

export interface HealthCheck {
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    lastCheck: string;
    details?: string;
}

export interface LyraIntentStats {
    intent: string;
    count: number;
    percentage: number;
}

export interface PaginationMeta {
    total: number;
    current_page: number;
    last_page: number;
}

// ── MAPPERS (snake_case -> camelCase) ────────────────────────────────────────

const mapMessage = (raw: any): ChatMessage => ({
    id: raw.id?.toString(),
    role: raw.role,
    content: raw.content,
    timestamp: raw.created_at || raw.timestamp,
    intent: raw.intent,
    confidence: raw.confidence,
    entities: raw.entities,
    thinkingProcess: raw.thinking_process,
    processingTimeMs: raw.processing_time_ms,
    _showThinking: false,
});

const mapSession = (raw: any): ChatSession => ({
    id: raw.session_id || raw.id,
    lastIntent: raw.last_intent || 'desconocido',
    lastMessage: raw.messages?.length > 0 ? raw.messages[raw.messages.length - 1].content : undefined,
    messageCount: raw.messages_count || raw.messages?.length || 0,
    city: raw.city || undefined,
    updatedAt: raw.updated_at,
    createdAt: raw.created_at,
    userName: raw.user?.name || undefined,
    userId: raw.user_id,
    userType: raw.user_id ? 'registered' : 'anonymous',
    status: raw.status || 'active',
    messages: (raw.messages || []).map(mapMessage),
    metadata: raw.metadata || {},
    user: raw.user // Fixed: keep the user object for initials and meta
});

const lyraService = {
    /**
     * Obtiene el estado operativo actual de Lyra
     */
    async getStatus(): Promise<LyraStatus> {
        const res = await api.get('/admin/lyra/status');
        return res.data.data;
    },

    /**
     * Cambia el estado de Lyra (Online / Mantenimiento)
     */
    async updateStatus(status: 'online' | 'maintenance'): Promise<any> {
        const res = await api.post('/admin/lyra/status', { status });
        return res.data;
    },

    /**
     * Obtiene estadísticas generales de uso
     */
    async getStats(period: string = '7d'): Promise<LyraStats> {
        const res = await api.get('/admin/lyra/stats', { params: { period } });
        return res.data.data;
    },

    /**
     * Obtiene lista paginada de sesiones
     */
    async getSessions(params: any = {}): Promise<{ data: ChatSession[]; meta: PaginationMeta }> {
        const res = await api.get('/admin/lyra/sessions', { params });
        const rawData = res.data.data;
        return {
            data: rawData.map(mapSession),
            meta: res.data.meta,
        };
    },

    /**
     * Obtiene el detalle de una sesión específica
     */
    async getSessionDetail(id: string): Promise<ChatSession> {
        const res = await api.get(`/admin/lyra/sessions/${id}`);
        return mapSession(res.data.data);
    },

    /**
     * Exporta las sesiones en formato CSV o JSON
     */
    async exportSessions(filters: any, format: 'csv' | 'json') {
        const res = await api.get('/admin/lyra/sessions/export', {
            params: { ...filters, format },
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `lyra-sessions-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Marca una sesión con un flag o actualiza sus datos
     */
    async updateSession(id: string, data: any): Promise<any> {
        const res = await api.patch(`/admin/lyra/sessions/${id}`, data);
        return res.data;
    },

    /**
     * Elimina una sesión permanentemente
     */
    async deleteSession(id: string): Promise<any> {
        const res = await api.delete(`/admin/lyra/sessions/${id}`);
        return res.data;
    },

    /**
     * Bloquea una sesión (y potencialmente al usuario)
     */
    async blockSession(id: string, reason?: string): Promise<any> {
        const res = await api.post(`/admin/lyra/sessions/${id}/block`, { reason });
        return res.data;
    },

    /**
     * Obtiene el timeline de replay de una sesión
     */
    async replaySession(id: string): Promise<any> {
        const res = await api.get(`/admin/lyra/sessions/${id}/replay`);
        return res.data;
    },

    /**
     * Obtiene estadísticas globales de sesiones
     */
    async getSessionStats(): Promise<any> {
        const res = await api.get('/admin/lyra/sessions/stats');
        return res.data.data;
    },

    /**
     * Limpia el caché de contexto del NLP
     */
    async clearCache(): Promise<any> {
        const res = await api.post('/admin/lyra/clear-cache');
        return res.data;
    },

    /**
     * Obtiene el historial de versiones de Lyra
     */
    async getVersions(): Promise<LyraVersion[]> {
        const res = await api.get('/admin/lyra/versions');
        return res.data.data;
    },

    /**
     * Realiza un rollback a una versión anterior
     */
    async rollbackVersion(id: number | string): Promise<any> {
        const res = await api.post(`/admin/lyra/versions/${id}/rollback`);
        return res.data;
    },

    /**
     * Crea una nueva versión de Lyra
     * MODIFIED: nuevo método para registrar versiones desde el dashboard
     */
    async createVersion(data: {
        version: string
        changelog: string
        activate: boolean
        metrics?: { success_rate?: number; avg_response_ms?: number }
    }): Promise<any> {
        const res = await api.post('/admin/lyra/versions', data)
        return res.data
    },

    /**
     * Obtiene el breakdown de intents
     */
    async getIntentStats(period: string = '7d'): Promise<LyraIntentStats[]> {
        const res = await api.get('/admin/lyra/intents/stats', { params: { period } });
        return res.data.data;
    },

    /**
     * Obtiene el estado de salud de los servicios
     */
    async getHealth(): Promise<HealthCheck[]> {
        const res = await api.get('/admin/lyra/health');
        return res.data.data;
    },

    /**
     * Reinicia un servicio específico (cache o queue)
     */
    async restartService(service: string): Promise<any> {
        const res = await api.post(`/admin/lyra/services/${service}/restart`);
        return res.data;
    },

    /**
     * Obtiene la configuración actual de Lyra
     */
    async getConfig(): Promise<any> {
        const res = await api.get('/admin/lyra/config');
        return res.data.data;
    },

    /**
     * Actualiza la configuración de Lyra
     */
    async updateConfig(config: any): Promise<any> {
        const res = await api.put('/admin/lyra/config', config);
        return res.data;
    },

    /**
     * Obtiene el historial de incidencias de salud
     */
    async getHealthIncidents(days: number = 7): Promise<any[]> {
        const res = await api.get('/admin/lyra/health/incidents', { params: { days } });
        return res.data.data;
    },

    /**
     * Obtiene las estadísticas de mensajes por hora (para el mapa de calor)
     */
    async getHourlyStats(): Promise<any> {
        const res = await api.get('/admin/lyra/stats/hourly');
        return res.data.data;
    },

    /**
     * Obtiene alertas administrativas pendientes
     */
    async getPendingAlerts(): Promise<any[]> {
        const res = await api.get('/admin/lyra/alerts/pending');
        return res.data.data;
    },

    /**
     * Marca una alerta como leída
     */
    async markAlertAsRead(id: number): Promise<any> {
        const res = await api.post(`/admin/lyra/alerts/${id}/read`);
        return res.data;
    },
};

export default lyraService;