<template>
  <div class="rx-maintenances">
    <!-- ═══════ TOP BAR ═══════ -->
    <header class="rx-topbar">
      <div class="rx-topbar__left">
        <div class="rx-topbar__icon"><font-awesome-icon :icon="['fas', 'tools']" /></div>
        <div>
          <h1 class="rx-topbar__title">Mantenimientos</h1>
          <p class="rx-topbar__sub">Solicitudes de mantenimiento y reparación de propiedades</p>
        </div>
      </div>
    </header>

    <!-- ═══════ KPI STRIP ═══════ -->
    <section class="rx-kpi-strip" v-if="stats && !loadingStats">
      <div class="rx-kpi" style="--kpi-hue: 35">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'exclamation-circle']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.pending || 0 }}</span>
          <span class="rx-kpi__label">Pendientes</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 230">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'hammer']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.in_progress || 0 }}</span>
          <span class="rx-kpi__label">En Progreso</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 155">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'check-circle']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.finished || 0 }}</span>
          <span class="rx-kpi__label">Completados</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 210">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'wrench']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.total || 0 }}</span>
          <span class="rx-kpi__label">Total</span>
        </div>
      </div>
    </section>

    <!-- ═══════ TOOLBAR ═══════ -->
    <section class="rx-toolbar">
      <div class="rx-search">
        <font-awesome-icon :icon="['fas', 'search']" class="rx-search__ico" />
        <input type="text" class="rx-search__input" placeholder="Buscar por ID, título o propiedad…" v-model="filters.search" @input="handleSearch" />
        <button v-if="filters.search" class="rx-search__clear" @click="clearSearch"><font-awesome-icon :icon="['fas', 'times']" /></button>
      </div>
      <div class="rx-filters">
        <select class="rx-select" v-model="filters.status" @change="fetchMaintenances">
          <option value="">Estado: Todos</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En Progreso</option>
          <option value="finished">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select class="rx-select" v-model="filters.priority" @change="fetchMaintenances">
          <option value="">Prioridad: Todas</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="emergency">Emergencia</option>
        </select>
        <select class="rx-select" v-model="filters.sort" @change="fetchMaintenances">
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select>
        <button v-if="hasActiveFilters" class="rx-btn rx-btn--ghost" @click="resetFilters">
          <font-awesome-icon :icon="['fas', 'times-circle']" /> Limpiar
        </button>
      </div>
    </section>

    <!-- ═══════ DATA GRID ═══════ -->
    <section class="rx-datagrid">
      <div v-if="loading && maintenances.length === 0" class="rx-state"><div class="rx-spinner"></div><p>Cargando mantenimientos…</p></div>
      <div v-else-if="maintenances.length === 0" class="rx-state">
        <font-awesome-icon :icon="['fas', 'tools']" class="rx-state__icon" /><h3>Sin mantenimientos</h3>
        <p>{{ hasActiveFilters ? 'Ajusta los filtros' : 'No hay solicitudes registradas' }}</p>
      </div>
      <div v-else class="rx-table-wrap">
        <table class="rx-table">
          <thead>
            <tr><th>ID</th><th>Fecha</th><th>Título</th><th>Prioridad</th><th>Estado</th><th>Propiedad</th><th>Propietario</th><th>Inquilino</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-for="request in maintenances" :key="request.id" class="rx-row">
              <td><span class="rx-id">#{{ request.id }}</span></td>
              <td><span class="rx-date">{{ formatDate(request.created_at) }}</span></td>
              <td><span class="rx-title" :title="request.title">{{ truncate(request.title, 35) }}</span></td>
              <td>
                <span class="rx-badge" :style="{ color: getPriorityConfig(request.priority).color, background: getPriorityConfig(request.priority).bg }">
                  <font-awesome-icon :icon="['fas', getPriorityConfig(request.priority).icon]" /> {{ getPriorityConfig(request.priority).label }}
                </span>
              </td>
              <td>
                <span class="rx-badge" :style="{ color: getStatusConfig(request.status).color, background: getStatusConfig(request.status).bg }">
                  <font-awesome-icon :icon="['fas', getStatusConfig(request.status).icon]" /> {{ getStatusConfig(request.status).label }}
                </span>
              </td>
              <td>
                <span v-if="request.property" class="rx-prop">{{ truncate(request.property.title, 25) }}</span>
                <span v-else class="rx-muted">—</span>
              </td>
              <td>
                <div v-if="request.property && request.property.user" class="rx-user-cell">
                  <div class="rx-avatar">{{ getInitials(request.property.user.name) }}</div>
                  <div class="rx-user-cell__info">
                    <span class="rx-user-cell__name">{{ request.property.user.name }}</span>
                    <span class="rx-user-cell__sub">{{ truncate(request.property.user.email, 20) }}</span>
                  </div>
                </div>
                <span v-else class="rx-muted">—</span>
              </td>
              <td>
                <div v-if="request.user" class="rx-user-cell">
                  <div class="rx-avatar rx-avatar--tenant">{{ getInitials(request.user.name) }}</div>
                  <div class="rx-user-cell__info">
                    <span class="rx-user-cell__name">{{ request.user.name }}</span>
                    <span class="rx-user-cell__sub">{{ truncate(request.user.email, 20) }}</span>
                  </div>
                </div>
                <span v-else class="rx-muted">—</span>
              </td>
              <td>
                <div class="rx-actions">
                  <button class="rx-act rx-act--view" @click="viewDetails(request)" title="Ver"><font-awesome-icon :icon="['fas', 'eye']" /></button>
                  <button v-if="request.status === 'pending'" class="rx-act rx-act--edit" @click="updateStatus(request, 'in_progress')" title="En Progreso"><font-awesome-icon :icon="['fas', 'hammer']" /></button>
                  <button v-if="['pending', 'in_progress'].includes(request.status)" class="rx-act rx-act--approve" @click="updateStatus(request, 'finished')" title="Completar"><font-awesome-icon :icon="['fas', 'check']" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="meta && meta.last_page > 1" class="rx-pagination">
          <button class="rx-pg-btn" :disabled="meta.current_page === 1 || loading" @click="changePage(meta.current_page - 1)"><font-awesome-icon :icon="['fas', 'chevron-left']" /> Anterior</button>
          <div class="rx-pg-pages"><button v-for="page in visiblePages" :key="page" class="rx-pg-page" :class="{ active: page === meta.current_page }" @click="typeof page === 'number' && changePage(page)" :disabled="page === '...' || loading">{{ page }}</button></div>
          <span class="rx-pg-info">Pág. {{ meta.current_page }}/{{ meta.last_page }} · {{ meta.total }} solicitudes</span>
          <button class="rx-pg-btn" :disabled="meta.current_page === meta.last_page || loading" @click="changePage(meta.current_page + 1)">Siguiente <font-awesome-icon :icon="['fas', 'chevron-right']" /></button>
        </div>
      </div>
    </section>
  </div>

  <!-- ═══════ DETAIL MODAL ═══════ -->
  <AdminModal
    v-model="showModal"
    title="Detalle de Mantenimiento"
    :subtitle="selectedRequest ? `Solicitud #${selectedRequest.id}` : ''"
    :icon="['fas', 'tools']"
    maxWidth="750px"
    @close="closeModal"
  >
    <template v-if="selectedRequest">
      <div class="rx-modal__status-row" style="display: flex; gap: 1rem; margin-bottom: 2rem;">
        <span class="rx-badge rx-badge--lg" :style="{ color: getStatusConfig(selectedRequest.status).color, background: getStatusConfig(selectedRequest.status).bg }">
          <font-awesome-icon :icon="['fas', getStatusConfig(selectedRequest.status).icon]" /> {{ getStatusConfig(selectedRequest.status).label }}
        </span>
        <span class="rx-badge rx-badge--lg" :style="{ color: getPriorityConfig(selectedRequest.priority).color, background: getPriorityConfig(selectedRequest.priority).bg }">
          <font-awesome-icon :icon="['fas', getPriorityConfig(selectedRequest.priority).icon]" /> {{ getPriorityConfig(selectedRequest.priority).label }}
        </span>
      </div>
      <div class="rx-detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
        <div class="rx-detail-item"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;"><font-awesome-icon :icon="['fas', 'home']" /> Propiedad</label><p v-if="selectedRequest.property">{{ selectedRequest.property.title }}</p><p v-else class="rx-muted">—</p></div>
        <div class="rx-detail-item"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;"><font-awesome-icon :icon="['fas', 'calendar']" /> Fecha</label><p>{{ formatDate(selectedRequest.request_date) }}</p></div>
        <div class="rx-detail-item">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;"><font-awesome-icon :icon="['fas', 'user']" /> Inquilino</label>
          <div v-if="selectedRequest.user" class="rx-user-cell">
            <div class="rx-avatar rx-avatar--tenant">{{ getInitials(selectedRequest.user.name) }}</div>
            <div class="rx-user-cell__info"><span class="rx-user-cell__name">{{ selectedRequest.user.name }}</span><span class="rx-user-cell__sub">{{ selectedRequest.user.email }}</span></div>
          </div>
          <p v-else class="rx-muted">—</p>
        </div>
        <div class="rx-detail-item"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;"><font-awesome-icon :icon="['fas', 'heading']" /> Título</label><p class="rx-highlight">{{ selectedRequest.title }}</p></div>
        <div class="rx-detail-item rx-detail-item--full" style="grid-column: 1 / -1;"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;"><font-awesome-icon :icon="['fas', 'align-left']" /> Descripción</label><div class="rx-description-box" style="background: var(--admin-surface-elevated, #f8fafc); padding: 1.2rem; border-radius: 12px; border: 1px solid var(--admin-border, #e2e8f0); white-space: pre-wrap; line-height: 1.6;">{{ selectedRequest.description }}</div></div>
      </div>
    </template>
    
    <template #footer>
      <button class="rx-btn rx-btn--ghost" @click="closeModal">Cerrar</button>
    </template>
  </AdminModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AdminModal from '@/admin/components/AdminModal.vue';
import { maintenanceService } from '@/services/maintenanceService';
import { useAlerts } from '@/composables/useAlerts';
import type { Maintenance, MaintenanceFilters } from '@/services/maintenanceService';

const { confirm, success, error } = useAlerts();
const maintenances = ref<Maintenance[]>([]);
const stats = ref<any>(null);
const loading = ref(true);
const loadingStats = ref(true);
const meta = ref<any>(null);
const selectedRequest = ref<Maintenance | null>(null);
const showModal = ref(false);

const filters = ref<MaintenanceFilters & { search?: string; sort?: string }>({ page: 1, status: '', priority: '', search: '', sort: 'newest' });
let searchTimeout: any = null;

const hasActiveFilters = computed(() => (filters.value.search ?? '') !== '' || (filters.value.status ?? '') !== '' || (filters.value.priority ?? '') !== '' || filters.value.sort !== 'newest');
const visiblePages = computed(() => {
  if (!meta.value) return [];
  const current = meta.value.current_page; const last = meta.value.last_page; const delta = 2;
  const range: number[] = []; const out: (number | string)[] = [];
  for (let i = 1; i <= last; i++) { if (i === 1 || i === last || (i >= current - delta && i <= current + delta)) range.push(i); }
  let prev = 0;
  for (const i of range) { if (prev) { if (i - prev === 2) out.push(prev + 1); else if (i - prev !== 1) out.push('...'); } out.push(i); prev = i; }
  return out;
});

onMounted(async () => { await fetchStats(); await fetchMaintenances(); });

const fetchStats = async () => { loadingStats.value = true; try { stats.value = await maintenanceService.getAdminMaintenanceStats(); } catch (e) { console.error(e); } finally { loadingStats.value = false; } };
const fetchMaintenances = async () => { loading.value = true; try { const r = await maintenanceService.getAdminMaintenances(filters.value); maintenances.value = r.data; meta.value = r.meta; } catch (e: any) { error(e.message || 'Error al cargar mantenimientos', 'Error'); } finally { loading.value = false; } };
const handleSearch = () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { filters.value.page = 1; fetchMaintenances(); }, 500); };
const clearSearch = () => { filters.value.search = ''; filters.value.page = 1; fetchMaintenances(); };
const resetFilters = () => { filters.value = { page: 1, status: '', priority: '', search: '', sort: 'newest' }; fetchMaintenances(); };
const changePage = (page: number) => { if (!meta.value) return; if (page >= 1 && page <= meta.value.last_page) { filters.value.page = page; fetchMaintenances(); } };

const updateStatus = (request: Maintenance, status: string) => {
  const labels: Record<string, string> = { in_progress: 'En Progreso', finished: 'Completado' };
  
  confirm(
    `¿Estás seguro de marcar esta solicitud como ${labels[status] || status}?`,
    async () => {
      try {
        await maintenanceService.updateAdminMaintenanceStatus(request.id, status);
        success('Estado actualizado exitosamente.', 'Hecho');
        await fetchMaintenances();
        await fetchStats();
      } catch (e: any) {
        error(e.response?.data?.message || 'Error al actualizar el estado', 'Fallo');
      }
    },
    undefined,
    { title: 'Confirmar Acción', confirmText: 'Aceptar', cancelText: 'Cancelar' }
  );
};

const viewDetails = (request: Maintenance) => { selectedRequest.value = request; showModal.value = true; };
const closeModal = () => { showModal.value = false; setTimeout(() => { selectedRequest.value = null; }, 300); };

const formatDate = (d?: string) => { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }); };
const truncate = (text?: string, len = 30) => { if (!text) return ''; return text.length > len ? text.substring(0, len) + '…' : text; };
const getInitials = (name?: string) => { if (!name) return '?'; return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(); };

const getStatusConfig = (status: string) => {
  const s = (status || '').toLowerCase();
  const config: Record<string, any> = {
    pending: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7', icon: 'exclamation-circle' },
    in_progress: { label: 'En Progreso', color: '#1d4ed8', bg: '#dbeafe', icon: 'hammer' },
    finished: { label: 'Completado', color: '#059669', bg: '#d1fae5', icon: 'check-circle' },
    completed: { label: 'Completado', color: '#059669', bg: '#d1fae5', icon: 'check-circle' },
    cancelled: { label: 'Cancelado', color: '#dc2626', bg: '#fee2e2', icon: 'times-circle' },
    pendiente: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7', icon: 'exclamation-circle' },
    en_progreso: { label: 'En Progreso', color: '#1d4ed8', bg: '#dbeafe', icon: 'hammer' },
    completado: { label: 'Completado', color: '#059669', bg: '#d1fae5', icon: 'check-circle' },
    cancelado: { label: 'Cancelado', color: '#dc2626', bg: '#fee2e2', icon: 'times-circle' },
  };
  return config[s] || { label: status, color: '#64748b', bg: '#f1f5f9', icon: 'circle' };
};

const getPriorityConfig = (priority: string) => {
  const p = (priority || '').toLowerCase();
  const config: Record<string, any> = {
    low: { label: 'Baja', color: '#4b5563', bg: '#f3f4f6', icon: 'arrow-down' },
    medium: { label: 'Media', color: '#d97706', bg: '#fef3c7', icon: 'minus' },
    high: { label: 'Alta', color: '#e11d48', bg: '#ffe4e6', icon: 'arrow-up' },
    emergency: { label: 'Emergencia', color: '#9f1239', bg: '#ffe4e6', icon: 'exclamation-triangle' },
    baja: { label: 'Baja', color: '#4b5563', bg: '#f3f4f6', icon: 'arrow-down' },
    media: { label: 'Media', color: '#d97706', bg: '#fef3c7', icon: 'minus' },
    alta: { label: 'Alta', color: '#e11d48', bg: '#ffe4e6', icon: 'arrow-up' },
    emergencia: { label: 'Emergencia', color: '#9f1239', bg: '#ffe4e6', icon: 'exclamation-triangle' },
  };
  return config[p] || { label: priority, color: '#64748b', bg: '#f1f5f9', icon: 'circle' };
};
</script>

<style scoped>
.rx-maintenances {
  --surface: var(--admin-surface, #fff); --surface-alt: var(--admin-surface-elevated, #f8fafc);
  --txt: var(--admin-text-primary, #0f172a); --txt2: var(--admin-text-secondary, #475569); --txt3: var(--admin-text-muted, #94a3b8);
  --brd: var(--admin-border, #e2e8f0); --accent-color: var(--accent, #6366f1);
  --radius: 14px; --shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03);
  max-width: 1560px; margin: 0 auto; color: var(--txt); animation: rxFade .4s ease;
}
@keyframes rxFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

.rx-topbar { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; margin-bottom: .5rem; }
.rx-topbar__left { display: flex; align-items: center; gap: 1rem; }
.rx-topbar__icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; font-size: 1.2rem; box-shadow: 0 4px 14px rgba(245,158,11,.3); }
.rx-topbar__title { font-size: 1.5rem; font-weight: 800; letter-spacing: -.02em; margin: 0; color: var(--txt); }
.rx-topbar__sub { font-size: .875rem; color: var(--txt3); margin: .15rem 0 0; }

.rx-kpi-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.rx-kpi { background: var(--surface); border: 1px solid var(--brd); border-radius: var(--radius); padding: 1.15rem 1.25rem; display: flex; align-items: center; gap: 1rem; transition: all .25s; box-shadow: var(--shadow); }
.rx-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.06); }
.rx-kpi__icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: hsl(var(--kpi-hue) 80% 95%); color: hsl(var(--kpi-hue) 70% 50%); font-size: 1rem; flex-shrink: 0; }
.rx-kpi__body { display: flex; flex-direction: column; }
.rx-kpi__val { font-size: 1.4rem; font-weight: 800; letter-spacing: -.02em; color: var(--txt); }
.rx-kpi__label { font-size: .78rem; color: var(--txt3); font-weight: 500; }

.rx-toolbar { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; align-items: center; }
.rx-search { flex: 1; min-width: 260px; position: relative; }
.rx-search__ico { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--txt3); font-size: .85rem; }
.rx-search__input { width: 100%; padding: .7rem 2.5rem .7rem 2.75rem; border-radius: 10px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt); font-size: .875rem; font-family: inherit; }
.rx-search__input::placeholder { color: var(--txt3); }
.rx-search__input:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
.rx-search__clear { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--txt3); cursor: pointer; }
.rx-filters { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.rx-select { padding: .65rem 2rem .65rem .85rem; border-radius: 10px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt2); font-size: .8rem; font-family: inherit; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .75rem center; }

.rx-btn { display: inline-flex; align-items: center; gap: .5rem; padding: .65rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: .875rem; border: none; cursor: pointer; transition: all .2s; font-family: inherit; }
.rx-btn--ghost { background: var(--surface-alt); color: var(--txt2); border: 1px solid var(--brd); }
.rx-btn--ghost:hover { border-color: var(--accent-color); color: var(--accent-color); }

.rx-datagrid { background: var(--surface); border: 1px solid var(--brd); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
.rx-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; gap: .75rem; }
.rx-state__icon { font-size: 2.5rem; color: var(--txt3); }
.rx-state h3 { font-size: 1.1rem; font-weight: 700; color: var(--txt); margin: 0; }
.rx-state p { font-size: .875rem; color: var(--txt3); margin: 0; }
.rx-spinner { width: 36px; height: 36px; border: 3px solid var(--brd); border-top-color: var(--accent-color); border-radius: 50%; animation: rxSpin .7s linear infinite; }
@keyframes rxSpin { to { transform: rotate(360deg); } }

.rx-table-wrap { overflow-x: auto; }
.rx-table { width: 100%; border-collapse: collapse; }
.rx-table th { padding: .85rem 1rem; font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--txt3); background: var(--surface-alt); border-bottom: 1px solid var(--brd); text-align: left; white-space: nowrap; }
.rx-table td { padding: .85rem 1rem; font-size: .85rem; color: var(--txt); border-bottom: 1px solid var(--brd); vertical-align: middle; }
.rx-row { transition: background .15s; }
.rx-row:hover td { background: var(--surface-alt); }
.rx-row:last-child td { border-bottom: none; }

.rx-id { font-size: .75rem; font-weight: 600; color: var(--txt3); background: var(--surface-alt); padding: .2rem .55rem; border-radius: 6px; border: 1px solid var(--brd); }
.rx-date { font-size: .82rem; color: var(--txt2); }
.rx-title { font-weight: 600; color: var(--txt); font-size: .85rem; }
.rx-muted { color: var(--txt3); font-size: .82rem; }
.rx-prop { font-weight: 600; font-size: .82rem; color: var(--txt); }
.rx-highlight { font-weight: 700; color: var(--txt); }
.rx-badge { display: inline-flex; align-items: center; gap: .3rem; padding: .25rem .65rem; border-radius: 7px; font-size: .72rem; font-weight: 600; white-space: nowrap; }
.rx-badge--lg { padding: .35rem .85rem; font-size: .82rem; }

.rx-user-cell { display: flex; align-items: center; gap: .65rem; }
.rx-avatar { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 700; flex-shrink: 0; background: #fef3c7; color: #d97706; }
.rx-avatar--tenant { background: #dbeafe; color: #2563eb; }
.rx-user-cell__info { display: flex; flex-direction: column; }
.rx-user-cell__name { font-weight: 600; color: var(--txt); font-size: .82rem; }
.rx-user-cell__sub { font-size: .7rem; color: var(--txt3); }

.rx-actions { display: flex; gap: .35rem; }
.rx-act { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--brd); background: var(--surface); color: var(--txt3); cursor: pointer; transition: all .2s; font-size: .75rem; }
.rx-act:hover { color: #fff; transform: scale(1.08); }
.rx-act--view:hover { background: #3b82f6; border-color: #3b82f6; }
.rx-act--edit:hover { background: #6366f1; border-color: #6366f1; }
.rx-act--approve:hover { background: #10b981; border-color: #10b981; }

.rx-pagination { display: flex; align-items: center; justify-content: center; gap: .75rem; padding: 1rem; border-top: 1px solid var(--brd); flex-wrap: wrap; }
.rx-pg-btn { display: inline-flex; align-items: center; gap: .35rem; padding: .5rem 1rem; border-radius: 8px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt2); font-size: .8rem; font-weight: 600; cursor: pointer; font-family: inherit; }
.rx-pg-btn:hover:not(:disabled) { border-color: var(--accent-color); color: var(--accent-color); }
.rx-pg-btn:disabled { opacity: .4; cursor: not-allowed; }
.rx-pg-pages { display: flex; gap: .25rem; }
.rx-pg-page { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; background: transparent; color: var(--txt2); font-size: .8rem; font-weight: 600; cursor: pointer; font-family: inherit; }
.rx-pg-page.active { background: var(--accent-color); color: #fff; }
.rx-pg-info { font-size: .78rem; color: var(--txt3); }

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
}
@media (max-width: 480px) {
  .rx-kpi-strip { grid-template-columns: 1fr; }
  .rx-topbar__title { font-size: 1.25rem; }
  .rx-topbar__icon { width: 40px; height: 40px; font-size: 1rem; }
}
</style>
