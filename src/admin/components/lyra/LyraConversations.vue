<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useLyraSessions } from '../../composables/useLyraSessions';
import ChatMessage from './shared/ChatMessage.vue';
import IntentBadge from './shared/IntentBadge.vue';

const { 
  sessions, 
  activeSession, 
  stats,
  loadingSessions, 
  loadingMore,
  loadingDetail,
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
} = useLyraSessions();

const showFilters = ref(false);
const showReplay = ref(false);
const chatMessagesRef = ref<HTMLElement | null>(null);

onMounted(() => {
  fetchSessions();
  fetchStats();
});

const selectSession = async (session: any) => {
  await getSessionDetail(session.id);
  showReplay.value = false;
  await nextTick();
  scrollToBottom();
};

const scrollToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
};

const formatDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'reviewed': return '#10b981';
    case 'flagged':  return '#f59e0b';
    case 'blocked':  return '#ef4444';
    default:         return '#6366f1';
  }
};
</script>

<template>
  <div class="lyra-admin-container" :class="{ 'detail-open': activeSession }">
    
    <!-- HEADER: Live Stats -->
    <header class="lyra-stats-grid" v-if="stats">
      <div class="stat-card">
        <span class="label">Total Sesiones</span>
        <span class="value">{{ stats.total_sessions }}</span>
      </div>
      <div class="stat-card highlight">
        <span class="label">Hoy</span>
        <span class="value">{{ stats.active_today }}</span>
        <div class="sub-stats">
          <span>{{ stats.registered_today }} Reg.</span>
          <span>{{ stats.anonymous_today }} Anón.</span>
        </div>
      </div>
      <div class="stat-card warning">
        <span class="label">Marcadas</span>
        <span class="value">{{ stats.flagged }}</span>
      </div>
      <div class="stat-card info">
        <span class="label">Msgs/Sesión</span>
        <span class="value">{{ stats.avg_messages }}</span>
      </div>
    </header>

    <main class="lyra-conversations-layout">
      <!-- SIDEBAR: List of Sessions -->
      <section class="sessions-sidebar">
        <div class="sidebar-toolbar">
          <div class="search-box">
            <font-awesome-icon :icon="['fas', 'search']" />
            <input v-model="filters.search" placeholder="Buscar por ID o Usuario..." />
          </div>
          <button class="icon-btn" @click="showFilters = !showFilters" :class="{ active: showFilters }">
            <font-awesome-icon :icon="['fas', 'filter']" />
          </button>
        </div>

        <!-- Advanced Filters Popover -->
        <div class="filters-panel" v-if="showFilters">
          <div class="filter-row">
            <select v-model="filters.userType">
              <option value="all">Cualquier Usuario</option>
              <option value="registered">Registrados</option>
              <option value="anonymous">Anónimos</option>
            </select>
            <select v-model="filters.status">
              <option value="all">Cualquier Estado</option>
              <option value="pending">Pendientes</option>
              <option value="reviewed">Revisados</option>
              <option value="flagged">Marcados</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>
          <div class="filter-row">
            <input type="date" v-model="filters.dateFrom" placeholder="Desde" />
            <input type="date" v-model="filters.dateTo" placeholder="Hasta" />
          </div>
          <div class="panel-actions">
            <button @click="exportSessions('csv')">Exportar CSV</button>
            <button class="clear" @click="filters.search = ''; showFilters = false">Cerrar</button>
          </div>
        </div>

        <div class="sessions-list" v-if="!loadingSessions">
          <div 
            v-for="session in sessions" 
            :key="session.id"
            class="session-item"
            :class="{ active: activeSession?.id === session.id, flagged: session.status === 'flagged', blocked: session.status === 'blocked' }"
            @click="selectSession(session)"
          >
            <div class="session-avatar" :class="{ 'has-user': session.user }">
              <template v-if="session.user">
                <span class="initials">{{ session.user.initials }}</span>
              </template>
              <template v-else>
                <font-awesome-icon :icon="['fas', 'user-secret']" />
              </template>
            </div>
            
            <div class="session-info">
              <div class="info-top">
                <span class="user-name">{{ session.user?.name || 'Usuario Anónimo' }}</span>
                <span class="time">{{ formatDate(session.updatedAt) }}</span>
              </div>
              <div class="info-bottom">
                <IntentBadge :intent="session.lastIntent" size="sm" />
                <span class="msg-count">
                  <font-awesome-icon :icon="['fas', 'comment']" /> 
                  {{ session.messageCount }}
                </span>
              </div>
            </div>

            <div class="status-indicator" :style="{ backgroundColor: getStatusColor(session.status) }"></div>
          </div>

          <button v-if="hasMore" @click="loadMore" :disabled="loadingMore" class="load-more">
            {{ loadingMore ? 'Cargando...' : 'Cargar más sessions' }}
          </button>
        </div>
        <div v-else class="list-spinner">
          <div class="spinner"></div>
        </div>
      </section>

      <!-- DETAIL: Chat View & Replay -->
      <section class="session-detail">
        <template v-if="activeSession">
          <!-- Detail Header -->
          <header class="detail-header">
            <div class="user-preview">
              <div class="avatar-large" :class="{ anonymous: !activeSession.user }">
                <span v-if="activeSession.user">{{ activeSession.user.initials }}</span>
                <font-awesome-icon v-else :icon="['fas', 'user-secret']" />
              </div>
              <div class="meta">
                <h2>{{ activeSession.user?.name || 'Sesión Anónima' }}</h2>
                <p>{{ activeSession.id }} • {{ activeSession.city || 'Ubicación no detectada' }}</p>
              </div>
            </div>

            <div class="actions">
              <button class="btn replay" @click="showReplay = !showReplay">
                <font-awesome-icon :icon="['fas', 'history']" />
                <span>Replay</span>
              </button>
              
              <div class="action-divider"></div>

              <div class="btn-group">
                <button 
                  class="btn-icon" 
                  title="Marcar como revisado"
                  @click="setStatus(activeSession.id, 'reviewed')"
                  v-if="activeSession.status !== 'reviewed'"
                >
                  <font-awesome-icon :icon="['fas', 'check']" />
                </button>
                <button 
                  class="btn-icon flag" 
                  title="Marcar para revisión posterior"
                  @click="setStatus(activeSession.id, 'flagged')"
                  :class="{ active: activeSession.status === 'flagged' }"
                >
                  <font-awesome-icon :icon="['fas', 'flag']" />
                </button>
                <button class="btn-icon block" title="Bloquear sesión/usuario" @click="blockSession(activeSession.id, 'Spam detectado')">
                  <font-awesome-icon :icon="['fas', 'ban']" />
                </button>
                <button class="btn-icon delete" title="Eliminar permanentemente" @click="deleteSession(activeSession.id)">
                  <font-awesome-icon :icon="['fas', 'trash']" />
                </button>
              </div>
            </div>
          </header>

          <!-- Messages Area -->
          <div class="chat-container" ref="chatMessagesRef">
            <template v-if="!loadingDetail">
              <div class="session-meta-info">
                Iniciado el {{ formatDate(activeSession.createdAt) }} 
                via IP: {{ (activeSession.metadata as any)?.ip || 'desconocida' }}
              </div>

              <div v-for="msg in activeSession.messages" :key="msg.id || msg.timestamp" class="message-wrapper" :class="msg.role">
                <ChatMessage 
                  :content="msg.content"
                  :role="msg.role"
                  :timestamp="msg.timestamp"
                  :intent="msg.intent"
                />
              </div>
            </template>
            <div v-else class="chat-loader">
              <div class="pulse"></div>
            </div>
          </div>
        </template>

        <!-- Empty State -->
        <div v-else class="empty-detail">
          <div class="empty-hero">
            <font-awesome-icon :icon="['fas', 'comments']" class="icon" />
            <h3>Selecciona una conversación</h3>
            <p>Monitorea y gestiona las interacciones de Lyra en tiempo real.</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.lyra-admin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--admin-bg);
  color: var(--admin-text-primary);
  overflow: hidden;
  --card-bg: var(--admin-surface);
  --border-color: var(--admin-border);
  --admin-bg-secondary: var(--admin-border-light);
}

/* Base styles are now driven by global variables from AdminLayout */


/* live stats header */
.lyra-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
}

.stat-card {
  padding: 1.25rem;
  background: var(--admin-bg-secondary);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.stat-card .label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-card .value { font-size: 1.75rem; font-weight: 700; color: var(--admin-text-primary); margin-top: 0.25rem; }

.stat-card.highlight { border-left: 4px solid #3b82f6; background: rgba(59, 130, 246, 0.1); }
.stat-card.warning { border-left: 4px solid #f59e0b; background: rgba(245, 158, 11, 0.1); }
.stat-card.info { border-left: 4px solid #10b981; background: rgba(16, 185, 129, 0.1); }

/* layout */
.lyra-conversations-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* sidebar */
.sessions-sidebar {
  width: 380px;
  background: var(--card-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.sidebar-toolbar {
  padding: 1.25rem;
  display: flex;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--admin-bg-secondary);
  border-radius: 0.75rem;
  padding: 0 0.75rem;
}

.search-box input {
  background: transparent;
  border: none;
  padding: 0.6rem;
  flex: 1;
  font-size: 0.9rem;
  outline: none;
  color: inherit;
}

.icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: #64748b;
  cursor: pointer;
}
.icon-btn.active { background: #0f172a; color: white; }

/* sessions list */
.sessions-list {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  padding: 1rem 1.25rem;
  display: flex;
  gap: 1rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  transition: background 0.2s;
}

.session-item:hover { background: rgba(0,0,0,0.02); }
:global(.dark-admin) .session-item:hover { background: rgba(255,255,255,0.02); }
.session-item.active { background: rgba(59, 130, 246, 0.1); }

.session-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--admin-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-weight: 700;
  flex-shrink: 0;
}
.session-avatar.has-user { background: #6366f1; color: white; }

.session-info { flex: 1; min-width: 0; }
.info-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem; }
.user-name { font-weight: 600; font-size: 0.95rem; color: var(--admin-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.time { font-size: 0.75rem; color: #94a3b8; }

.info-bottom { display: flex; align-items: center; gap: 0.75rem; }
.msg-count { font-size: 0.75rem; color: #64748b; display: flex; align-items: center; gap: 0.35rem; }

/* detail section */
.session-detail {
  flex: 1;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
}

.detail-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-large { width: 56px; height: 56px; border-radius: 1.25rem; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 700; }
.avatar-large.anonymous { background: #64748b; }

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: var(--admin-bg-secondary);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--admin-border) transparent;
}

.chat-container::-webkit-scrollbar {
  width: 6px;
}
.chat-container::-webkit-scrollbar-track {
  background: transparent;
}
.chat-container::-webkit-scrollbar-thumb {
  background: var(--admin-border);
  border-radius: 10px;
}
.chat-container::-webkit-scrollbar-thumb:hover {
  background: var(--admin-text-secondary);
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--admin-border) transparent;
}

.sessions-list::-webkit-scrollbar {
  width: 4px;
}
.sessions-list::-webkit-scrollbar-track {
  background: transparent;
}
.sessions-list::-webkit-scrollbar-thumb {
  background: var(--admin-border);
  border-radius: 10px;
}

.session-meta-info {
  align-self: center;
  font-size: 0.75rem;
  color: #94a3b8;
  background: var(--card-bg);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  border: 1px solid var(--border-color);
}

.message-wrapper { display: flex; width: 100%; }
.message-wrapper.user { justify-content: flex-end; }
.message-wrapper.assistant { justify-content: flex-start; }

.load-more {
  width: calc(100% - 2.5rem);
  margin: 1.25rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  background: var(--admin-bg-secondary);
  color: var(--admin-text-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.load-more:hover:not(:disabled) {
  background: var(--border-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.load-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.action-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 0.5rem;
}

.btn { 
  height: 40px; 
  padding: 0 1rem; 
  border-radius: 0.75rem; 
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--admin-text-primary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:hover {
  background: var(--admin-bg-secondary);
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

.btn.replay {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.btn.replay:hover {
  background: #4f46e5;
  color: white;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.btn.flag.active {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.btn.block:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.btn.delete:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.btn-group {
  display: flex;
  gap: 0.25rem;
  background: var(--admin-bg-secondary);
  padding: 0.25rem;
  border-radius: 0.75rem;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: var(--admin-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--card-bg);
  color: var(--accent);
}

.btn-icon.flag.active {
  background: #fef3c7;
  color: #f59e0b;
}

:global(.dark-admin) .btn-icon.flag.active {
  background: rgba(245, 158, 11, 0.2);
}

.btn-icon.block:hover, .btn-icon.delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

:global(.dark-admin) .btn-icon.block:hover, :global(.dark-admin) .btn-icon.delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.empty-detail { flex: 1; display: flex; align-items: center; justify-content: center; }
.empty-hero { text-align: center; color: #94a3b8; }
.empty-hero .icon { font-size: 4rem; opacity: 0.2; margin-bottom: 1rem; }

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0,0,0,0.1);
  border-left-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
