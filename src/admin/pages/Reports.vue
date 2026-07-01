<template>
  <div class="rx-reports">
    <!-- ═══════ TOP BAR ═══════ -->
    <header class="rx-topbar">
      <div class="rx-topbar__left">
        <div class="rx-topbar__icon"><font-awesome-icon :icon="['fas', 'shield-alt']" /></div>
        <div>
          <h1 class="rx-topbar__title">Gestión de Reportes</h1>
          <p class="rx-topbar__sub">Revisa y gestiona alertas sobre usuarios y propiedades</p>
        </div>
      </div>
    </header>

    <!-- ═══════ KPI STRIP ═══════ -->
    <section class="rx-kpi-strip" v-if="stats && !loadingStats">
      <div class="rx-kpi" style="--kpi-hue: 35">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'flag']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.pending_reports || 0 }}</span>
          <span class="rx-kpi__label">Pendientes</span>
        </div>
        <span class="rx-kpi__pct" v-if="stats.total_reports">{{ pctOf(stats.pending_reports, stats.total_reports) }}%</span>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 230">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'home']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.property_reports || 0 }}</span>
          <span class="rx-kpi__label">Propiedades</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 330">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'user-shield']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.user_reports || 0 }}</span>
          <span class="rx-kpi__label">Usuarios</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 210">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'folder-open']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.total_reports || 0 }}</span>
          <span class="rx-kpi__label">Total</span>
        </div>
      </div>
    </section>

    <!-- ═══════ TOOLBAR ═══════ -->
    <section class="rx-toolbar">
      <div class="rx-search">
        <font-awesome-icon :icon="['fas', 'search']" class="rx-search__ico" />
        <input type="text" class="rx-search__input" placeholder="Buscar por ID, usuario o propiedad…" v-model="filters.search" @input="handleSearch" />
        <button v-if="filters.search" class="rx-search__clear" @click="clearSearch"><font-awesome-icon :icon="['fas', 'times']" /></button>
      </div>
      <div class="rx-filters">
        <select class="rx-select" v-model="filters.status" @change="fetchReports">
          <option value="">Estado: Todos</option>
          <option value="pending">Pendiente</option>
          <option value="reviewed">Revisado</option>
          <option value="resolved">Resuelto</option>
          <option value="dismissed">Descartado</option>
        </select>
        <select class="rx-select" v-model="filters.type" @change="fetchReports">
          <option value="">Tipo: Todos</option>
          <option value="property">Propiedad</option>
          <option value="user">Usuario</option>
          <option value="review">Reseña</option>
          <option value="other">Otro</option>
        </select>
        <select class="rx-select" v-model="filters.sort" @change="fetchReports">
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
      <div v-if="loading && reports.length === 0" class="rx-state">
        <div class="rx-spinner"></div>
        <p>Cargando reportes…</p>
      </div>
      <div v-else-if="reports.length === 0" class="rx-state">
        <font-awesome-icon :icon="['fas', 'clipboard-check']" class="rx-state__icon" />
        <h3>Sin reportes</h3>
        <p>{{ hasActiveFilters ? 'Ajusta los filtros' : 'No hay reportes registrados' }}</p>
        <button v-if="hasActiveFilters" class="rx-btn rx-btn--accent" @click="resetFilters">Limpiar Filtros</button>
      </div>
      <div v-else class="rx-table-wrap">
        <table class="rx-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Objetivo</th>
              <th>Reportado Por</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="report in reports" :key="report.id" class="rx-row">
              <td><span class="rx-id">#{{ report.id }}</span></td>
              <td><span class="rx-date">{{ formatDate(report.created_at) }}</span></td>
              <td>
                <span class="rx-type-badge" :style="{ color: getTypeConfig(report.type).color }">
                  <font-awesome-icon :icon="['fas', getTypeConfig(report.type).icon]" />
                  {{ getTypeConfig(report.type).label }}
                </span>
              </td>
              <td>
                <span class="rx-badge" :style="{ color: getStatusConfig(report.status).color, background: getStatusConfig(report.status).bg }">
                  <font-awesome-icon :icon="['fas', getStatusConfig(report.status).icon]" />
                  {{ getStatusConfig(report.status).label }}
                </span>
              </td>
              <td>
                <div v-if="report.reported_user_id" class="rx-target"><font-awesome-icon :icon="['fas', 'user']" /> Usuario #{{ report.reported_user_id }}</div>
                <div v-else-if="report.property_id" class="rx-target"><font-awesome-icon :icon="['fas', 'home']" /> Propiedad #{{ report.property_id }}</div>
                <span v-else class="rx-muted">—</span>
              </td>
              <td>
                <div v-if="report.user" class="rx-user-cell">
                  <div class="rx-avatar">{{ getInitials(report.user.name) }}</div>
                  <div class="rx-user-cell__info">
                    <span class="rx-user-cell__name">{{ report.user.name }}</span>
                    <span class="rx-user-cell__sub">{{ truncate(report.user.email, 20) }}</span>
                  </div>
                </div>
                <div v-else class="rx-user-cell">
                  <div class="rx-avatar rx-avatar--system"><font-awesome-icon :icon="['fas', 'robot']" /></div>
                  <span class="rx-user-cell__name">Sistema</span>
                </div>
              </td>
              <td>
                <div class="rx-actions">
                  <button class="rx-act rx-act--view" @click="viewDetails(report)" title="Ver"><font-awesome-icon :icon="['fas', 'eye']" /></button>
                  <button class="rx-act rx-act--delete" @click="deleteReport(report)" title="Eliminar"><font-awesome-icon :icon="['fas', 'trash']" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="meta && meta.last_page > 1" class="rx-pagination">
          <button class="rx-pg-btn" :disabled="meta.current_page === 1 || loading" @click="changePage(meta.current_page - 1)">
            <font-awesome-icon :icon="['fas', 'chevron-left']" /> Anterior
          </button>
          <div class="rx-pg-pages">
            <button v-for="page in visiblePages" :key="page" class="rx-pg-page" :class="{ active: page === meta.current_page }" @click="typeof page === 'number' && changePage(page)" :disabled="page === '...' || loading">{{ page }}</button>
          </div>
          <span class="rx-pg-info">Pág. {{ meta.current_page }}/{{ meta.last_page }} · {{ meta.total }} reportes</span>
          <button class="rx-pg-btn" :disabled="meta.current_page === meta.last_page || loading" @click="changePage(meta.current_page + 1)">
            Siguiente <font-awesome-icon :icon="['fas', 'chevron-right']" />
          </button>
        </div>
      </div>
    </section>
  </div>

  <!-- ═══════ DETAIL MODAL ═══════ -->
  <AdminModal
    v-model="showModal"
    title="Detalles del Reporte"
    :subtitle="selectedReport ? `Reporte #${selectedReport.id}` : ''"
    :icon="['fas', 'shield-alt']"
    maxWidth="700px"
    @close="closeModal"
  >
    <div v-if="selectedReport" class="rx-modal-content">
      <div class="rx-modal__status-row" style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1.5rem;">
        <span class="rx-badge rx-badge--lg" :style="{ color: getStatusConfig(selectedReport.status).color, background: getStatusConfig(selectedReport.status).bg }" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.85rem; font-size: 0.82rem; font-weight: 600; border-radius: 8px;">
          <font-awesome-icon :icon="['fas', getStatusConfig(selectedReport.status).icon]" />
          {{ getStatusConfig(selectedReport.status).label }}
        </span>
        <span class="rx-type-badge" :style="{ color: getTypeConfig(selectedReport.type).color }" style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.82rem; font-weight: 600;">
          <font-awesome-icon :icon="['fas', getTypeConfig(selectedReport.type).icon]" />
          {{ getTypeConfig(selectedReport.type).label }}
        </span>
      </div>
      <div class="rx-detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
        <div class="rx-detail-item">
          <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 700; color: var(--admin-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.35rem;"><font-awesome-icon :icon="['fas', 'calendar']" /> Fecha</label>
          <p style="margin: 0; font-weight: 500;">{{ formatDate(selectedReport.created_at) }}</p>
        </div>
        <div class="rx-detail-item">
          <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 700; color: var(--admin-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.35rem;"><font-awesome-icon :icon="['fas', 'crosshairs']" /> Objetivo</label>
          <div v-if="selectedReport.reported_user_id" class="rx-target" style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; color: var(--admin-text-primary); font-weight: 500;"><font-awesome-icon :icon="['fas', 'user']" style="color: var(--admin-text-muted);" /> Usuario #{{ selectedReport.reported_user_id }}</div>
          <div v-else-if="selectedReport.property_id" class="rx-target" style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; color: var(--admin-text-primary); font-weight: 500;"><font-awesome-icon :icon="['fas', 'home']" style="color: var(--admin-text-muted);" /> Propiedad #{{ selectedReport.property_id }}</div>
          <p v-else style="margin: 0; color: var(--admin-text-muted);">—</p>
        </div>
        <div class="rx-detail-item">
          <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 700; color: var(--admin-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.35rem;"><font-awesome-icon :icon="['fas', 'user']" /> Reportado por</label>
          <div v-if="selectedReport.user" class="rx-user-cell" style="display: flex; align-items: center; gap: 0.65rem;">
            <div class="rx-avatar" style="width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; background: #e0e7ff; color: #4338ca;">{{ getInitials(selectedReport.user.name) }}</div>
            <div class="rx-user-cell__info" style="display: flex; flex-direction: column;">
              <span class="rx-user-cell__name" style="font-weight: 600; font-size: 0.82rem; color: var(--admin-text-primary);">{{ selectedReport.user.name }}</span>
              <span class="rx-user-cell__sub" style="font-size: 0.7rem; color: var(--admin-text-muted);">{{ selectedReport.user.email }}</span>
            </div>
          </div>
          <span v-else style="color: var(--admin-text-muted);">Sistema / Anónimo</span>
        </div>
        <div v-if="selectedReport.description" class="rx-detail-item rx-detail-item--full" style="grid-column: 1 / -1;">
          <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 700; color: var(--admin-text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.35rem;"><font-awesome-icon :icon="['fas', 'align-left']" /> Descripción</label>
          <div class="rx-description-box" style="padding: 1rem; background: var(--admin-surface-elevated, #f8fafc); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 10px; font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">{{ selectedReport.description }}</div>
        </div>
      </div>
    </div>

    <template #footer>
      <div v-if="selectedReport && selectedReport.status !== 'resolved' && selectedReport.status !== 'dismissed'" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button v-if="selectedReport.status === 'pending'" class="rx-btn rx-btn--accent" @click="updateReportStatus(selectedReport.id, 'reviewed')" style="padding: 0.65rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; border: none; background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 2px 8px rgba(99,102,241,0.25);">
          <font-awesome-icon :icon="['fas', 'clipboard-check']" /> Revisar
        </button>
        <button class="rx-btn" @click="updateReportStatus(selectedReport.id, 'resolved')" style="padding: 0.65rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; border: none; background: #10b981; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 2px 8px rgba(16,185,129,0.25);">
          <font-awesome-icon :icon="['fas', 'check-circle']" /> Resolver
        </button>
        <button class="rx-btn" @click="updateReportStatus(selectedReport.id, 'dismissed')" style="padding: 0.65rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; border: none; background: #64748b; color: #fff; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">
          <font-awesome-icon :icon="['fas', 'times-circle']" /> Descartar
        </button>
      </div>
      <button class="rx-btn rx-btn--ghost" @click="closeModal" style="padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; font-size: 0.875rem; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-secondary); cursor: pointer; margin-left: auto;">Cerrar</button>
    </template>
  </AdminModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AdminModal from '@/admin/components/AdminModal.vue';
import { reportService } from '@/services/reportService';
import { useAlerts } from '@/composables/useAlerts';
import type { Report } from '@/services/reportService';

const { confirm, success, error } = useAlerts();
const reports = ref<Report[]>([]);
const stats = ref<any>(null);
const loading = ref(true);
const loadingStats = ref(true);
const meta = ref<any>(null);
const selectedReport = ref<Report | null>(null);
const showModal = ref(false);

const filters = ref<{ page: number; status: string; type: string; search: string; sort: string }>({
  page: 1, status: '', type: '', search: '', sort: 'newest'
});
let searchTimeout: any = null;

const hasActiveFilters = computed(() => (filters.value.search ?? '') !== '' || (filters.value.status ?? '') !== '' || (filters.value.type ?? '') !== '' || filters.value.sort !== 'newest');
const pctOf = (part: number, total: number) => total > 0 ? Math.round((part / total) * 100) : 0;

const visiblePages = computed(() => {
  if (!meta.value) return [];
  const current = meta.value.current_page;
  const last = meta.value.last_page;
  const delta = 2;
  const range: number[] = [];
  const out: (number | string)[] = [];
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= current - delta && i <= current + delta)) range.push(i);
  }
  let prev = 0;
  for (const i of range) {
    if (prev) { if (i - prev === 2) out.push(prev + 1); else if (i - prev !== 1) out.push('...'); }
    out.push(i); prev = i;
  }
  return out;
});

onMounted(async () => { await fetchStats(); await fetchReports(); });

const fetchStats = async () => { loadingStats.value = true; try { stats.value = await reportService.getAdminReportStats(); } catch (e) { console.error(e); } finally { loadingStats.value = false; } };
const fetchReports = async () => {
  loading.value = true;
  try { const r = await reportService.getAdminReports(filters.value); reports.value = r.data; meta.value = r.meta; }
  catch (e: any) { error(e.message || 'Error al cargar reportes', 'Error'); }
  finally { loading.value = false; }
};

const handleSearch = () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { filters.value.page = 1; fetchReports(); }, 500); };
const clearSearch = () => { filters.value.search = ''; filters.value.page = 1; fetchReports(); };
const resetFilters = () => { filters.value = { page: 1, status: '', type: '', search: '', sort: 'newest' }; fetchReports(); };
const changePage = (page: number) => { if (!meta.value) return; if (page >= 1 && page <= meta.value.last_page) { filters.value.page = page; fetchReports(); } };

const deleteReport = (report: Report) => {
  confirm(
    '¿Estás seguro de eliminar este reporte?',
    async () => {
      try { 
        await reportService.deleteAdminReport(report.id); 
        success('Reporte eliminado exitosamente', 'Hecho'); 
        await fetchReports(); 
        await fetchStats(); 
      } catch (e: any) { 
        error(e.message || 'Error al eliminar', 'Error'); 
      }
    },
    undefined,
    { title: 'Confirmar Eliminación', confirmText: 'Eliminar', cancelText: 'Cancelar' }
  );
};

const viewDetails = (report: Report) => { selectedReport.value = report; showModal.value = true; };
const closeModal = () => { showModal.value = false; setTimeout(() => { selectedReport.value = null; }, 300); };

const updateReportStatus = (id: number, status: string) => {
  const labels: Record<string, string> = { reviewed: 'Revisado', resolved: 'Resuelto', dismissed: 'Descartado' };
  confirm(
    `¿Cambiar el estado a ${labels[status] || status}?`,
    async () => {
      try {
        await reportService.updateAdminReportStatus(id, status);
        success('Estado actualizado', 'Hecho');
        if (selectedReport.value && selectedReport.value.id === id) {
          selectedReport.value.status = status as any;
        }
        await fetchReports(); await fetchStats();
      } catch (e: any) { error(e.message || 'Error al actualizar', 'Error'); }
    },
    undefined,
    { title: 'Confirmar Acción', confirmText: 'Aceptar', cancelText: 'Cancelar' }
  );
};

const formatDate = (d?: string) => { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }); };
const truncate = (text?: string, len = 30) => { if (!text) return ''; return text.length > len ? text.substring(0, len) + '…' : text; };
const getInitials = (name?: string) => { if (!name) return '?'; return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(); };

const getStatusConfig = (status: string) => {
  const s = (status || '').toLowerCase();
  const config: Record<string, any> = {
    pending: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7', icon: 'clock' },
    reviewed: { label: 'Revisado', color: '#1d4ed8', bg: '#dbeafe', icon: 'clipboard-check' },
    resolved: { label: 'Resuelto', color: '#059669', bg: '#d1fae5', icon: 'check-circle' },
    dismissed: { label: 'Descartado', color: '#64748b', bg: '#f1f5f9', icon: 'times-circle' },
    pendiente: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7', icon: 'clock' },
    revisado: { label: 'Revisado', color: '#1d4ed8', bg: '#dbeafe', icon: 'clipboard-check' },
    resuelto: { label: 'Resuelto', color: '#059669', bg: '#d1fae5', icon: 'check-circle' },
    descartado: { label: 'Descartado', color: '#64748b', bg: '#f1f5f9', icon: 'times-circle' },
  };
  return config[s] || { label: status, color: '#64748b', bg: '#f1f5f9', icon: 'circle' };
};

const getTypeConfig = (type: string) => {
  const t = (type || '').toLowerCase();
  const config: Record<string, any> = {
    property: { label: 'Propiedad', icon: 'building', color: '#2563eb' },
    properties: { label: 'Propiedad', icon: 'building', color: '#2563eb' },
    user: { label: 'Usuario', icon: 'user', color: '#db2777' },
    users: { label: 'Usuario', icon: 'user', color: '#db2777' },
    review: { label: 'Reseña', icon: 'star', color: '#f59e0b' },
    maintenance: { label: 'Mantenimiento', icon: 'tools', color: '#059669' },
    contract: { label: 'Contrato', icon: 'file-contract', color: '#ea580c' },
    contracts: { label: 'Contrato', icon: 'file-contract', color: '#ea580c' },
    financial: { label: 'Financiero', icon: 'coins', color: '#059669' },
    other: { label: 'Otro', icon: 'flag', color: '#64748b' },
    propiedad: { label: 'Propiedad', icon: 'building', color: '#2563eb' },
    usuario: { label: 'Usuario', icon: 'user', color: '#db2777' },
  };
  return config[t] || { label: type || 'Desconocido', icon: 'question', color: '#64748b' };
};
</script>

<style scoped>
.rx-reports {
  --surface: var(--admin-surface, #fff);
  --surface-alt: var(--admin-surface-elevated, #f8fafc);
  --txt: var(--admin-text-primary, #0f172a);
  --txt2: var(--admin-text-secondary, #475569);
  --txt3: var(--admin-text-muted, #94a3b8);
  --brd: var(--admin-border, #e2e8f0);
  --accent-color: var(--accent, #6366f1);
  --radius: 14px;
  --shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03);
  max-width: 1560px; margin: 0 auto; color: var(--txt);
  animation: rxFade .4s ease;
}
@keyframes rxFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

.rx-topbar { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; margin-bottom: .5rem; }
.rx-topbar__left { display: flex; align-items: center; gap: 1rem; }
.rx-topbar__icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; font-size: 1.2rem; box-shadow: 0 4px 14px rgba(239,68,68,.3); }
.rx-topbar__title { font-size: 1.5rem; font-weight: 800; letter-spacing: -.02em; margin: 0; color: var(--txt); }
.rx-topbar__sub { font-size: .875rem; color: var(--txt3); margin: .15rem 0 0; }

.rx-kpi-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.rx-kpi { background: var(--surface); border: 1px solid var(--brd); border-radius: var(--radius); padding: 1.15rem 1.25rem; display: flex; align-items: center; gap: 1rem; position: relative; transition: all .25s; box-shadow: var(--shadow); }
.rx-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.06); }
.rx-kpi__icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: hsl(var(--kpi-hue) 80% 95%); color: hsl(var(--kpi-hue) 70% 50%); font-size: 1rem; flex-shrink: 0; }
.rx-kpi__body { display: flex; flex-direction: column; }
.rx-kpi__val { font-size: 1.4rem; font-weight: 800; letter-spacing: -.02em; color: var(--txt); }
.rx-kpi__label { font-size: .78rem; color: var(--txt3); font-weight: 500; }
.rx-kpi__pct { position: absolute; top: .75rem; right: 1rem; font-size: .7rem; font-weight: 700; color: hsl(var(--kpi-hue) 70% 50%); background: hsl(var(--kpi-hue) 80% 95%); padding: .15rem .45rem; border-radius: 6px; }

.rx-toolbar { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; align-items: center; }
.rx-search { flex: 1; min-width: 260px; position: relative; }
.rx-search__ico { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--txt3); font-size: .85rem; }
.rx-search__input { width: 100%; padding: .7rem 2.5rem .7rem 2.75rem; border-radius: 10px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt); font-size: .875rem; font-family: inherit; transition: border-color .2s; }
.rx-search__input::placeholder { color: var(--txt3); }
.rx-search__input:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
.rx-search__clear { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--txt3); cursor: pointer; }
.rx-filters { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.rx-select { padding: .65rem 2rem .65rem .85rem; border-radius: 10px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt2); font-size: .8rem; font-family: inherit; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .75rem center; }
.rx-select:focus { outline: none; border-color: var(--accent-color); }

.rx-btn { display: inline-flex; align-items: center; gap: .5rem; padding: .65rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: .875rem; border: none; cursor: pointer; transition: all .2s; font-family: inherit; }
.rx-btn--accent { background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; }
.rx-btn--ghost { background: var(--surface-alt); color: var(--txt2); border: 1px solid var(--brd); }
.rx-btn--ghost:hover { border-color: var(--accent-color); color: var(--accent-color); }
.rx-btn--success { background: #10b981; color: #fff; }
.rx-btn--success:hover { background: #059669; }
.rx-btn--info { background: #3b82f6; color: #fff; }
.rx-btn--info:hover { background: #2563eb; }

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
.rx-muted { color: var(--txt3); }
.rx-badge { display: inline-flex; align-items: center; gap: .3rem; padding: .25rem .65rem; border-radius: 7px; font-size: .72rem; font-weight: 600; white-space: nowrap; }
.rx-badge--lg { padding: .35rem .85rem; font-size: .82rem; }
.rx-type-badge { display: inline-flex; align-items: center; gap: .35rem; font-size: .82rem; font-weight: 600; }
.rx-target { display: flex; align-items: center; gap: .35rem; font-size: .82rem; color: var(--txt2); }

.rx-user-cell { display: flex; align-items: center; gap: .65rem; }
.rx-avatar { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 700; flex-shrink: 0; background: #dbeafe; color: #2563eb; }
.rx-avatar--system { background: var(--surface-alt); color: var(--txt3); }
.rx-user-cell__info { display: flex; flex-direction: column; }
.rx-user-cell__name { font-weight: 600; color: var(--txt); font-size: .82rem; }
.rx-user-cell__sub { font-size: .7rem; color: var(--txt3); }

.rx-actions { display: flex; gap: .35rem; }
.rx-act { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--brd); background: var(--surface); color: var(--txt3); cursor: pointer; transition: all .2s; font-size: .75rem; }
.rx-act:hover { color: #fff; transform: scale(1.08); }
.rx-act--view:hover { background: #3b82f6; border-color: #3b82f6; }
.rx-act--delete:hover { background: #ef4444; border-color: #ef4444; }

.rx-pagination { display: flex; align-items: center; justify-content: center; gap: .75rem; padding: 1rem; border-top: 1px solid var(--brd); flex-wrap: wrap; }
.rx-pg-btn { display: inline-flex; align-items: center; gap: .35rem; padding: .5rem 1rem; border-radius: 8px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt2); font-size: .8rem; font-weight: 600; cursor: pointer; transition: all .2s; font-family: inherit; }
.rx-pg-btn:hover:not(:disabled) { border-color: var(--accent-color); color: var(--accent-color); }
.rx-pg-btn:disabled { opacity: .4; cursor: not-allowed; }
.rx-pg-pages { display: flex; gap: .25rem; }
.rx-pg-page { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; background: transparent; color: var(--txt2); font-size: .8rem; font-weight: 600; cursor: pointer; font-family: inherit; }
.rx-pg-page:hover { background: var(--surface-alt); }
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
  .rx-status-actions { flex-wrap: wrap; justify-content: center; width: 100%; }
  .rx-status-actions .rx-btn { width: 100%; }
}
@media (max-width: 480px) {
  .rx-kpi-strip { grid-template-columns: 1fr; }
  .rx-topbar__title { font-size: 1.25rem; }
  .rx-topbar__icon { width: 40px; height: 40px; font-size: 1rem; }
}
</style>
