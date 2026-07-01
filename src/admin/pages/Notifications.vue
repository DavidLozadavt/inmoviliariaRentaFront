<template>
  <div class="rx-notifications">
    <!-- ═══════ TOP BAR ═══════ -->
    <header class="rx-topbar">
      <div class="rx-topbar__left">
        <div class="rx-topbar__icon"><font-awesome-icon :icon="['fas', 'bell']" /></div>
        <div>
          <h1 class="rx-topbar__title">Notificaciones</h1>
          <p class="rx-topbar__sub">Todas las notificaciones del sistema</p>
        </div>
      </div>
      <button v-if="unreadCount > 0" class="rx-btn rx-btn--ghost" @click="markAllAsRead">
        <font-awesome-icon :icon="['fas', 'check-double']" /> Marcar todas como leídas
      </button>
    </header>

    <!-- ═══════ KPI STRIP ═══════ -->
    <section class="rx-kpi-strip">
      <div class="rx-kpi" style="--kpi-hue: 230">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'bell']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ notifications.length }}</span>
          <span class="rx-kpi__label">Total</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 35">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'envelope']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ unreadCount }}</span>
          <span class="rx-kpi__label">Sin leer</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 155">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'check-circle']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ readCount }}</span>
          <span class="rx-kpi__label">Leídas</span>
        </div>
      </div>
    </section>

    <!-- ═══════ TOOLBAR ═══════ -->
    <section class="rx-toolbar">
      <div class="rx-search">
        <font-awesome-icon :icon="['fas', 'search']" class="rx-search__ico" />
        <input type="text" class="rx-search__input" placeholder="Buscar notificaciones…" v-model="searchQuery" />
      </div>
      <div class="rx-filters">
        <select class="rx-select" v-model="filterType">
          <option value="all">Tipo: Todos</option>
          <option value="system">Sistema</option>
          <option value="rental_request">Solicitudes</option>
          <option value="contract_sent">Contratos</option>
          <option value="payment_reminder">Pagos</option>
          <option value="maintenance">Mantenimiento</option>
        </select>
        <select class="rx-select" v-model="filterRead">
          <option value="all">Estado: Todas</option>
          <option value="unread">Sin leer</option>
          <option value="read">Leídas</option>
        </select>
      </div>
    </section>

    <!-- ═══════ LOADING ═══════ -->
    <div v-if="loading" class="rx-state"><div class="rx-spinner"></div><p>Cargando notificaciones…</p></div>

    <!-- ═══════ NOTIFICATIONS LIST ═══════ -->
    <div v-else-if="filteredNotifications.length > 0" class="rx-notif-list">
      <transition-group name="notif-list" tag="div" class="rx-notif-container">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          class="rx-notif"
          :class="{ 'rx-notif--unread': !notification.read }"
        >
          <div class="rx-notif__left">
            <div v-if="!notification.read" class="rx-notif__dot"></div>
            <div class="rx-notif__ico" :class="getTypeClass(notification.type)">
              <font-awesome-icon :icon="['fas', getIcon(notification.type)]" />
            </div>
          </div>
          <div class="rx-notif__body">
            <div class="rx-notif__head">
              <h4 class="rx-notif__title">{{ notification.title }}</h4>
              <span class="rx-notif__type-badge" :class="getTypeClass(notification.type)">{{ getTypeLabel(notification.type) }}</span>
            </div>
            <p class="rx-notif__message" v-html="notification.message"></p>
            <div class="rx-notif__meta">
              <span class="rx-notif__time"><font-awesome-icon :icon="['fas', 'clock']" /> {{ formatTimeAgo(notification.created_at) }}</span>
              <span v-if="notification.read" class="rx-notif__read-label"><font-awesome-icon :icon="['fas', 'check']" /> Leída</span>
            </div>
          </div>
          <div class="rx-notif__actions">
            <button v-if="!notification.read" class="rx-act rx-act--approve" @click="markAsRead(notification.id)" title="Marcar como leída">
              <font-awesome-icon :icon="['fas', 'check']" />
            </button>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- ═══════ EMPTY ═══════ -->
    <div v-else class="rx-state">
      <font-awesome-icon :icon="['fas', 'bell-slash']" class="rx-state__icon" />
      <h3>Sin notificaciones</h3>
      <p>{{ searchQuery || filterType !== 'all' || filterRead !== 'all' ? 'No se encontraron notificaciones con los filtros aplicados.' : 'Cuando haya novedades, aparecerán aquí.' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { notificationService, type NotificationItem } from '@/services/notificationService';
import { useAlerts } from '@/composables/useAlerts';

const { success, error: showError } = useAlerts();
const loading = ref(true);
const notifications = ref<NotificationItem[]>([]);
const searchQuery = ref('');
const filterType = ref('all');
const filterRead = ref('all');

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);
const readCount = computed(() => notifications.value.filter(n => n.read).length);

const filteredNotifications = computed(() => {
  let result = [...notifications.value];
  if (filterType.value !== 'all') result = result.filter(n => n.type === filterType.value);
  if (filterRead.value === 'unread') result = result.filter(n => !n.read);
  else if (filterRead.value === 'read') result = result.filter(n => n.read);
  if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); result = result.filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)); }
  return result;
});

const loadNotifications = async () => { loading.value = true; try { const res = await notificationService.getNotifications(); notifications.value = res.notifications; } catch { notifications.value = []; } finally { loading.value = false; } };
const markAsRead = async (id: number) => { try { await notificationService.markAsRead(id); const n = notifications.value.find(n => n.id === id); if (n) n.read = true; } catch { showError('Error al marcar como leída'); } };
const markAllAsRead = async () => { try { await notificationService.markAllAsRead(); notifications.value.forEach(n => n.read = true); success('Todas marcadas como leídas'); } catch { showError('Error al marcar todas como leídas'); } };

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString); const now = new Date(); const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Ahora mismo'; if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`; if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)} días`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getIcon = (type: string): string => {
  const icons: Record<string, string> = { rental_request: 'home', counter_proposal: 'calendar-alt', contract_sent: 'file-contract', contract_accepted: 'check-circle', visit_reminder: 'clock', payment_reminder: 'money-bill-wave', maintenance: 'wrench', system: 'bell' };
  return icons[type] || 'info-circle';
};
const getTypeClass = (type: string): string => {
  const classes: Record<string, string> = { rental_request: 'type-primary', counter_proposal: 'type-warning', contract_sent: 'type-success', contract_accepted: 'type-success', visit_reminder: 'type-info', payment_reminder: 'type-warning', maintenance: 'type-danger', system: 'type-info' };
  return classes[type] || 'type-info';
};
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = { rental_request: 'Solicitud', counter_proposal: 'Contrapropuesta', contract_sent: 'Contrato', contract_accepted: 'Contrato', visit_reminder: 'Visita', payment_reminder: 'Pago', maintenance: 'Mantenimiento', system: 'Sistema' };
  return labels[type] || 'General';
};

onMounted(() => { loadNotifications(); });
</script>

<style scoped>
.rx-notifications {
  --surface: var(--admin-surface, #fff); --surface-alt: var(--admin-surface-elevated, #f8fafc);
  --txt: var(--admin-text-primary, #0f172a); --txt2: var(--admin-text-secondary, #475569); --txt3: var(--admin-text-muted, #94a3b8);
  --brd: var(--admin-border, #e2e8f0); --accent-color: var(--accent, #6366f1);
  --radius: 14px; --shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03);
  max-width: 1200px; margin: 0 auto; color: var(--txt); animation: rxFade .4s ease;
}
@keyframes rxFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

.rx-topbar { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; margin-bottom: .5rem; flex-wrap: wrap; gap: .75rem; }
.rx-topbar__left { display: flex; align-items: center; gap: 1rem; }
.rx-topbar__icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; font-size: 1.2rem; box-shadow: 0 4px 14px rgba(59,130,246,.3); }
.rx-topbar__title { font-size: 1.5rem; font-weight: 800; letter-spacing: -.02em; margin: 0; color: var(--txt); }
.rx-topbar__sub { font-size: .875rem; color: var(--txt3); margin: .15rem 0 0; }

.rx-btn { display: inline-flex; align-items: center; gap: .5rem; padding: .65rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: .875rem; border: none; cursor: pointer; transition: all .2s; font-family: inherit; }
.rx-btn--ghost { background: var(--surface); color: var(--txt2); border: 1px solid var(--brd); }
.rx-btn--ghost:hover { border-color: var(--accent-color); color: var(--accent-color); }

.rx-kpi-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
.rx-kpi { background: var(--surface); border: 1px solid var(--brd); border-radius: var(--radius); padding: 1.15rem 1.25rem; display: flex; align-items: center; gap: 1rem; transition: all .25s; box-shadow: var(--shadow); }
.rx-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.06); }
.rx-kpi__icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: hsl(var(--kpi-hue) 80% 95%); color: hsl(var(--kpi-hue) 70% 50%); font-size: 1rem; flex-shrink: 0; }
.rx-kpi__body { display: flex; flex-direction: column; }
.rx-kpi__val { font-size: 1.4rem; font-weight: 800; letter-spacing: -.02em; color: var(--txt); }
.rx-kpi__label { font-size: .78rem; color: var(--txt3); font-weight: 500; }

.rx-toolbar { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; align-items: center; }
.rx-search { flex: 1; min-width: 250px; position: relative; }
.rx-search__ico { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--txt3); font-size: .85rem; }
.rx-search__input { width: 100%; padding: .7rem 1rem .7rem 2.75rem; border-radius: 10px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt); font-size: .875rem; font-family: inherit; }
.rx-search__input::placeholder { color: var(--txt3); }
.rx-search__input:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
.rx-filters { display: flex; gap: .5rem; }
.rx-select { padding: .65rem 2rem .65rem .85rem; border-radius: 10px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt2); font-size: .8rem; font-family: inherit; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .75rem center; }

.rx-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; gap: .75rem; }
.rx-state__icon { font-size: 2.5rem; color: var(--txt3); }
.rx-state h3 { font-size: 1.1rem; font-weight: 700; color: var(--txt); margin: 0; }
.rx-state p { font-size: .875rem; color: var(--txt3); margin: 0; max-width: 350px; }
.rx-spinner { width: 36px; height: 36px; border: 3px solid var(--brd); border-top-color: var(--accent-color); border-radius: 50%; animation: rxSpin .7s linear infinite; }
@keyframes rxSpin { to { transform: rotate(360deg); } }

/* ─── NOTIFICATION CARDS ─── */
.rx-notif-container { display: flex; flex-direction: column; gap: .65rem; }
.rx-notif { display: flex; align-items: flex-start; gap: 1rem; background: var(--surface); border: 1px solid var(--brd); border-radius: var(--radius); padding: 1.15rem 1.35rem; transition: all .2s; position: relative; }
.rx-notif:hover { box-shadow: 0 4px 16px rgba(0,0,0,.05); transform: translateY(-1px); }
.rx-notif--unread { background: linear-gradient(90deg, rgba(59,130,246,.04) 0%, var(--surface) 100%); border-left: 3px solid #3b82f6; }

.rx-notif__left { position: relative; flex-shrink: 0; }
.rx-notif__dot { position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; border: 2px solid var(--surface); z-index: 1; box-shadow: 0 0 6px rgba(59,130,246,.5); }
.rx-notif__ico { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: .95rem; color: #fff; }
.rx-notif__ico.type-primary { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.rx-notif__ico.type-success { background: linear-gradient(135deg, #10b981, #059669); }
.rx-notif__ico.type-warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
.rx-notif__ico.type-danger { background: linear-gradient(135deg, #ef4444, #dc2626); }
.rx-notif__ico.type-info { background: linear-gradient(135deg, #06b6d4, #0891b2); }

.rx-notif__body { flex: 1; min-width: 0; }
.rx-notif__head { display: flex; align-items: center; gap: .65rem; margin-bottom: .25rem; flex-wrap: wrap; }
.rx-notif__title { font-size: .92rem; font-weight: 700; color: var(--txt); margin: 0; }
.rx-notif__type-badge { font-size: .68rem; font-weight: 600; padding: .12rem .45rem; border-radius: 6px; white-space: nowrap; }
.rx-notif__type-badge.type-primary { background: rgba(59,130,246,.1); color: #2563eb; }
.rx-notif__type-badge.type-success { background: rgba(16,185,129,.1); color: #059669; }
.rx-notif__type-badge.type-warning { background: rgba(245,158,11,.1); color: #d97706; }
.rx-notif__type-badge.type-danger { background: rgba(239,68,68,.1); color: #dc2626; }
.rx-notif__type-badge.type-info { background: rgba(6,182,212,.1); color: #0891b2; }

.rx-notif__message { font-size: .85rem; color: var(--txt2); margin: 0 0 .45rem; line-height: 1.5; }
.rx-notif__meta { display: flex; align-items: center; gap: .85rem; font-size: .75rem; color: var(--txt3); }
.rx-notif__time { display: flex; align-items: center; gap: .3rem; }
.rx-notif__read-label { color: #10b981; display: flex; align-items: center; gap: .3rem; }

.rx-notif__actions { display: flex; flex-direction: column; gap: .35rem; flex-shrink: 0; opacity: 0; transition: opacity .2s; }
.rx-notif:hover .rx-notif__actions { opacity: 1; }
.rx-act { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--brd); background: var(--surface); color: var(--txt3); cursor: pointer; transition: all .2s; font-size: .75rem; }
.rx-act--approve:hover { background: #10b981; border-color: #10b981; color: #fff; }

.notif-list-enter-active, .notif-list-leave-active { transition: all .3s ease; }
.notif-list-enter-from, .notif-list-leave-to { opacity: 0; transform: translateX(-20px); }
/* ─── RESPONSIVE ─── */
@media (max-width: 1024px) {
  .rx-panels { grid-template-columns: 1fr; }
  .rx-detail-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .rx-topbar { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .rx-topbar__left, .rx-topbar__right { width: 100%; display: flex; flex-direction: column; align-items: flex-start; }
  .rx-topbar__right .rx-btn { width: 100%; justify-content: center; margin-top: 0.5rem; }
  .rx-kpi-strip { grid-template-columns: 1fr 1fr; }
  .rx-toolbar { flex-direction: column; align-items: stretch; gap: 1rem; }
  .rx-search { width: 100%; }
  .rx-search__input { width: 100%; }
  .rx-filters { width: 100%; flex-direction: column; align-items: stretch; gap: 0.5rem; }
  .rx-select { width: 100%; }
  .rx-filters .rx-btn { width: 100%; justify-content: center; }
  .rx-form__grid { grid-template-columns: 1fr; }
  .rx-modal__footer { flex-direction: column; gap: 0.5rem; }
  .rx-modal__footer .rx-btn { width: 100%; margin: 0; }
  .rx-notif__actions { opacity: 1; flex-direction: row; margin-top: 0.5rem; }
}
@media (max-width: 480px) {
  .rx-kpi-strip { grid-template-columns: 1fr; }
  .rx-topbar__title { font-size: 1.25rem; }
  .rx-topbar__icon { width: 40px; height: 40px; font-size: 1rem; }
}
</style>
