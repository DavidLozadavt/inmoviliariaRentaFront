<template>
  <div class="rx-contracts">
    <!-- ═══════ TOP BAR ═══════ -->
    <header class="rx-topbar">
      <div class="rx-topbar__left">
        <div class="rx-topbar__icon">
          <font-awesome-icon :icon="['fas', 'file-contract']" />
        </div>
        <div>
          <h1 class="rx-topbar__title">Contratos</h1>
          <p class="rx-topbar__sub">Monitorea y administra los contratos de arrendamiento</p>
        </div>
      </div>
    </header>

    <!-- ═══════ KPI STRIP ═══════ -->
    <section class="rx-kpi-strip" v-if="stats">
      <div class="rx-kpi" style="--kpi-hue: 230">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'file-alt']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.total || 0 }}</span>
          <span class="rx-kpi__label">Total</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 155">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'check-circle']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.active || 0 }}</span>
          <span class="rx-kpi__label">Activos</span>
        </div>
        <span class="rx-kpi__pct" v-if="stats.total">{{ pctOf(stats.active, stats.total) }}%</span>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 35">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'clock']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.pending || 0 }}</span>
          <span class="rx-kpi__label">Pendientes</span>
        </div>
        <span class="rx-kpi__pct" v-if="stats.total">{{ pctOf(stats.pending, stats.total) }}%</span>
      </div>
    </section>

    <!-- ═══════ VISUAL PANELS ═══════ -->
    <section class="rx-panels" v-if="stats">
      <div class="rx-panel">
        <h3 class="rx-panel__title">
          <font-awesome-icon :icon="['fas', 'chart-pie']" class="rx-panel__icon" />
          Distribución de Estados
        </h3>
        <div class="rx-status-bars">
          <div class="rx-sbar" v-for="(item, idx) in statusDistribution" :key="idx">
            <div class="rx-sbar__head">
              <span class="rx-sbar__dot" :style="{ background: item.color }"></span>
              <span class="rx-sbar__label">{{ item.label }}</span>
              <span class="rx-sbar__val">{{ item.count }}</span>
            </div>
            <div class="rx-sbar__track">
              <div class="rx-sbar__fill" :style="{ width: item.pct + '%', background: item.color }"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="rx-panel">
        <h3 class="rx-panel__title">
          <font-awesome-icon :icon="['fas', 'bolt']" class="rx-panel__icon" />
          Resumen Rápido
        </h3>
        <div class="rx-summary-grid">
          <div class="rx-summary-item">
            <div class="rx-summary-item__icon" style="--sh: 155"><font-awesome-icon :icon="['fas', 'handshake']" /></div>
            <div>
              <span class="rx-summary-item__val">{{ stats.active || 0 }}</span>
              <span class="rx-summary-item__label">Contratos vigentes</span>
            </div>
          </div>
          <div class="rx-summary-item">
            <div class="rx-summary-item__icon" style="--sh: 35"><font-awesome-icon :icon="['fas', 'exclamation-circle']" /></div>
            <div>
              <span class="rx-summary-item__val">{{ stats.pending || 0 }}</span>
              <span class="rx-summary-item__label">Requieren atención</span>
            </div>
          </div>
          <div class="rx-summary-item">
            <div class="rx-summary-item__icon" style="--sh: 0"><font-awesome-icon :icon="['fas', 'calendar-times']" /></div>
            <div>
              <span class="rx-summary-item__val">{{ stats.expired || 0 }}</span>
              <span class="rx-summary-item__label">Expirados</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ TOOLBAR ═══════ -->
    <section class="rx-toolbar">
      <div class="rx-search">
        <font-awesome-icon :icon="['fas', 'search']" class="rx-search__ico" />
        <input type="text" class="rx-search__input" placeholder="Buscar por ID, propiedad o usuario…" v-model="filters.search" @input="handleSearch" />
        <button v-if="filters.search" class="rx-search__clear" @click="clearSearch"><font-awesome-icon :icon="['fas', 'times']" /></button>
      </div>
      <div class="rx-filters">
        <select class="rx-select" v-model="filters.status" @change="fetchContracts">
          <option value="">Estado: Todos</option>
          <option value="active">Activo</option>
          <option value="pending">Pendiente</option>
          <option value="expired">Expirado</option>
          <option value="cancelled">Cancelado</option>
          <option value="rejected">Rechazado</option>
        </select>
        <button v-if="hasActiveFilters" class="rx-btn rx-btn--ghost" @click="resetFilters">
          <font-awesome-icon :icon="['fas', 'times-circle']" /> Limpiar
        </button>
      </div>
    </section>

    <!-- ═══════ DATA GRID ═══════ -->
    <section class="rx-datagrid">
      <div v-if="loading && contracts.length === 0" class="rx-state">
        <div class="rx-spinner"></div>
        <p>Cargando contratos…</p>
      </div>
      <div v-else-if="contracts.length === 0" class="rx-state">
        <font-awesome-icon :icon="['fas', 'file-alt']" class="rx-state__icon" />
        <h3>Sin contratos</h3>
        <p>{{ hasActiveFilters ? 'Ajusta los filtros de búsqueda' : 'No hay contratos registrados' }}</p>
        <button v-if="hasActiveFilters" class="rx-btn rx-btn--accent" @click="resetFilters">Limpiar Filtros</button>
      </div>

      <div v-else class="rx-table-wrap">
        <table class="rx-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Propiedad</th>
              <th>Inquilino</th>
              <th>Propietario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contract in contracts" :key="contract.id" class="rx-row">
              <td><span class="rx-id">#{{ contract.id }}</span></td>
              <td><span class="rx-date">{{ formatDate(contract.created_at) }}</span></td>
              <td>
                <span class="rx-badge" :style="{ color: getStatusConfig(contract.status).color, background: getStatusConfig(contract.status).bg }">
                  <font-awesome-icon :icon="['fas', getStatusConfig(contract.status).icon]" />
                  {{ getStatusConfig(contract.status).label }}
                </span>
              </td>
              <td>
                <div v-if="contract.property" class="rx-cell-prop">
                  <div class="rx-cell-prop__placeholder"><font-awesome-icon :icon="['fas', 'home']" /></div>
                  <div class="rx-cell-prop__info">
                    <span class="rx-cell-prop__name">{{ contract.property.title }}</span>
                    <span v-if="contract.property.city" class="rx-cell-prop__sub"><font-awesome-icon :icon="['fas', 'map-marker-alt']" /> {{ contract.property.city }}</span>
                  </div>
                </div>
                <span v-else class="rx-muted">—</span>
              </td>
              <td>
                <div v-if="contract.tenant" class="rx-user-cell">
                  <div class="rx-avatar rx-avatar--tenant">{{ getInitials(contract.tenant.name) }}</div>
                  <div class="rx-user-cell__info">
                    <span class="rx-user-cell__name">{{ contract.tenant.name }}</span>
                    <span class="rx-user-cell__sub">{{ contract.tenant.email }}</span>
                  </div>
                </div>
                <span v-else class="rx-muted">—</span>
              </td>
              <td>
                <div v-if="contract.landlord" class="rx-user-cell">
                  <div class="rx-avatar rx-avatar--landlord">{{ getInitials(contract.landlord.name) }}</div>
                  <div class="rx-user-cell__info">
                    <span class="rx-user-cell__name">{{ contract.landlord.name }}</span>
                    <span class="rx-user-cell__sub">{{ contract.landlord.email }}</span>
                  </div>
                </div>
                <span v-else class="rx-muted">—</span>
              </td>
              <td>
                <div class="rx-actions">
                  <button class="rx-act rx-act--view" @click="openDetailsModal(contract)" title="Ver Detalles"><font-awesome-icon :icon="['fas', 'eye']" /></button>
                  <button v-if="(contract.status === 'pending' || contract.status === 'active') && !contract.validated_by_support" class="rx-act rx-act--approve" @click="verifyContractAction(contract)" title="Verificar"><font-awesome-icon :icon="['fas', 'check-double']" /></button>
                  <button v-if="contract.status === 'pending' || contract.status === 'active'" class="rx-act rx-act--reject" @click="cancelContractAction(contract)" title="Cancelar"><font-awesome-icon :icon="['fas', 'ban']" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="meta && meta.last_page > 1" class="rx-pagination">
          <button class="rx-pg-btn" :disabled="meta.current_page === 1" @click="changePage(meta.current_page - 1)">
            <font-awesome-icon :icon="['fas', 'chevron-left']" /> Anterior
          </button>
          <div class="rx-pg-pages">
            <button v-for="page in visiblePages" :key="page" class="rx-pg-page" :class="{ active: page === meta.current_page }" @click="typeof page === 'number' && changePage(page)" :disabled="page === '...'">{{ page }}</button>
          </div>
          <span class="rx-pg-info">Pág. {{ meta.current_page }}/{{ meta.last_page }} · {{ meta.total }} contratos</span>
          <button class="rx-pg-btn" :disabled="meta.current_page === meta.last_page" @click="changePage(meta.current_page + 1)">
            Siguiente <font-awesome-icon :icon="['fas', 'chevron-right']" />
          </button>
        </div>
      </div>
    </section>
  </div>

  <!-- ═══════ DETAIL MODAL ═══════ -->
  <AdminModal
    v-model="detailsModalOpen"
    title="Detalle de Contrato"
    :subtitle="selectedContract ? `Contrato #${selectedContract.id}` : ''"
    :icon="['fas', 'file-contract']"
    maxWidth="850px"
    @close="closeDetailsModal"
  >
    <template v-if="selectedContract">
      <div class="rx-modal__status-row">
        <span class="rx-badge rx-badge--lg" :style="{ color: getStatusConfig(selectedContract.status).color, background: getStatusConfig(selectedContract.status).bg }">
          <font-awesome-icon :icon="['fas', getStatusConfig(selectedContract.status).icon]" />
          {{ getStatusConfig(selectedContract.status).label }}
        </span>
        <span class="rx-modal__date"><font-awesome-icon :icon="['fas', 'calendar-check']" /> {{ formatDate(selectedContract.created_at) }}</span>
      </div>

      <div class="rx-detail-grid">
        <!-- Propiedad -->
        <div class="rx-detail-card">
          <div class="rx-detail-card__head"><font-awesome-icon :icon="['fas', 'home']" class="rx-dc-icon--prop" /> <h3>Propiedad</h3></div>
          <div v-if="selectedContract.property" class="rx-detail-card__body">
            <div class="rx-drow"><span class="rx-drow__k"><font-awesome-icon :icon="['fas', 'heading']" /> Título</span><span class="rx-drow__v">{{ selectedContract.property.title }}</span></div>
            <div v-if="selectedContract.property.address" class="rx-drow"><span class="rx-drow__k"><font-awesome-icon :icon="['fas', 'map-marker-alt']" /> Dirección</span><span class="rx-drow__v">{{ selectedContract.property.address }}</span></div>
            <div v-if="selectedContract.property.monthly_price" class="rx-drow"><span class="rx-drow__k"><font-awesome-icon :icon="['fas', 'dollar-sign']" /> Precio/mes</span><span class="rx-drow__v rx-drow__v--price">{{ formatPrice(selectedContract.property.monthly_price) }}</span></div>
          </div>
          <div v-else class="rx-detail-empty">Sin información</div>
        </div>
        <!-- Período -->
        <div class="rx-detail-card">
          <div class="rx-detail-card__head"><font-awesome-icon :icon="['fas', 'calendar-alt']" class="rx-dc-icon--date" /> <h3>Período</h3></div>
          <div class="rx-detail-card__body">
            <div class="rx-drow"><span class="rx-drow__k"><font-awesome-icon :icon="['fas', 'calendar']" /> Inicio</span><span class="rx-drow__v">{{ selectedContract.start_date ? formatDate(selectedContract.start_date) : '—' }}</span></div>
            <div class="rx-drow"><span class="rx-drow__k"><font-awesome-icon :icon="['fas', 'calendar-times']" /> Vencimiento</span><span class="rx-drow__v">{{ selectedContract.end_date ? formatDate(selectedContract.end_date) : '—' }}</span></div>
            <div class="rx-drow"><span class="rx-drow__k"><font-awesome-icon :icon="['fas', 'dollar-sign']" /> Monto total</span><span class="rx-drow__v rx-drow__v--price">{{ selectedContract.total_amount ? formatPrice(selectedContract.total_amount) : '—' }}</span></div>
          </div>
        </div>
        <!-- Inquilino -->
        <div class="rx-detail-card">
          <div class="rx-detail-card__head"><font-awesome-icon :icon="['fas', 'user']" class="rx-dc-icon--tenant" /> <h3>Inquilino</h3></div>
          <div v-if="selectedContract.tenant" class="rx-detail-card__body">
            <div class="rx-modal-person">
              <div class="rx-avatar rx-avatar--tenant rx-avatar--lg">{{ getInitials(selectedContract.tenant.name) }}</div>
              <div>
                <div class="rx-person-name">{{ selectedContract.tenant.name }}</div>
                <div v-if="selectedContract.tenant.email" class="rx-person-meta"><font-awesome-icon :icon="['fas', 'envelope']" /> {{ selectedContract.tenant.email }}</div>
                <div v-if="selectedContract.tenant.phone" class="rx-person-meta"><font-awesome-icon :icon="['fas', 'phone']" /> {{ selectedContract.tenant.phone }}</div>
              </div>
            </div>
          </div>
          <div v-else class="rx-detail-empty">Sin información</div>
        </div>
        <!-- Propietario -->
        <div class="rx-detail-card">
          <div class="rx-detail-card__head"><font-awesome-icon :icon="['fas', 'user-tie']" class="rx-dc-icon--landlord" /> <h3>Propietario</h3></div>
          <div v-if="selectedContract.landlord" class="rx-detail-card__body">
            <div class="rx-modal-person">
              <div class="rx-avatar rx-avatar--landlord rx-avatar--lg">{{ getInitials(selectedContract.landlord.name) }}</div>
              <div>
                <div class="rx-person-name">{{ selectedContract.landlord.name }}</div>
                <div v-if="selectedContract.landlord.email" class="rx-person-meta"><font-awesome-icon :icon="['fas', 'envelope']" /> {{ selectedContract.landlord.email }}</div>
                <div v-if="selectedContract.landlord.phone" class="rx-person-meta"><font-awesome-icon :icon="['fas', 'phone']" /> {{ selectedContract.landlord.phone }}</div>
              </div>
            </div>
          </div>
          <div v-else class="rx-detail-empty">Sin información</div>
        </div>
      </div>
    </template>

    <template #footer v-if="selectedContract">
      <button v-if="selectedContract.status === 'pending' || selectedContract.status === 'active'" class="rx-btn rx-btn--danger" @click="cancelContractAction(selectedContract)">
        <font-awesome-icon :icon="['fas', 'ban']" /> Cancelar Contrato
      </button>
      <button class="rx-btn rx-btn--ghost" @click="closeDetailsModal">
        <font-awesome-icon :icon="['fas', 'times']" /> Cerrar
      </button>
    </template>
  </AdminModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AdminModal from '@/admin/components/AdminModal.vue';
import { contractService } from '@/services/contractService';
import { useAlerts } from '@/composables/useAlerts';
import type { Contract, ContractStats } from '@/services/contractService';

const { confirm, success, error } = useAlerts();

const contracts = ref<Contract[]>([]);
const stats = ref<ContractStats | null>(null);
const loading = ref(true);
const meta = ref<any>(null);
const detailsModalOpen = ref(false);
const selectedContract = ref<Contract | null>(null);
const filters = ref<{ search?: string; status?: string; page?: number }>({ page: 1, status: '', search: '' });
let searchTimeout: ReturnType<typeof setTimeout>;

const hasActiveFilters = computed(() => (filters.value.search ?? '') !== '' || (filters.value.status ?? '') !== '');

const pctOf = (part: number, total: number) => total > 0 ? Math.round((part / total) * 100) : 0;

const statusDistribution = computed(() => {
  if (!stats.value) return [];
  const s = stats.value;
  const total = s.total || 1;
  return [
    { label: 'Activos', count: s.active || 0, color: '#10b981', pct: pctOf(s.active || 0, total) },
    { label: 'Pendientes', count: s.pending || 0, color: '#f59e0b', pct: pctOf(s.pending || 0, total) },
    { label: 'Expirados', count: s.expired || 0, color: '#94a3b8', pct: pctOf(s.expired || 0, total) },
    { label: 'Cancelados', count: s.cancelled || 0, color: '#ef4444', pct: pctOf(s.cancelled || 0, total) },
  ];
});

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

onMounted(async () => { await fetchStats(); await fetchContracts(); });

const fetchStats = async () => { try { stats.value = await contractService.getStats(); } catch (e) { console.error(e); } };

const fetchContracts = async () => {
  loading.value = true;
  try {
    const response = await contractService.getAdminContracts(filters.value);
    contracts.value = response.data;
    meta.value = response.meta;
  } catch (e: any) { error(e.message || 'Error al cargar contratos', 'Error'); }
  finally { loading.value = false; }
};

const verifyContractAction = (contract: Contract) => {
  confirm(
    `¿Verificar el contrato #${contract.id}?`,
    async () => {
      try {
        await contractService.updateAdminContract(contract.id, { validated_by_support: true });
        success('Contrato verificado', 'Hecho');
        fetchContracts(); fetchStats();
      } catch (e: any) { error(e.message || 'Error al verificar', 'Error'); }
    },
    undefined,
    { title: 'Verificar Contrato', confirmText: 'Verificar', cancelText: 'Cancelar' }
  );
};

const handleSearch = () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { filters.value.page = 1; fetchContracts(); }, 500); };
const clearSearch = () => { filters.value.search = ''; filters.value.page = 1; fetchContracts(); };
const resetFilters = () => { filters.value = { page: 1, status: '', search: '' }; fetchContracts(); };
const changePage = (page: number) => { if (!meta.value) return; if (page >= 1 && page <= meta.value.last_page) { filters.value.page = page; fetchContracts(); } };

const openDetailsModal = (c: Contract) => { selectedContract.value = c; detailsModalOpen.value = true; document.body.style.overflow = 'hidden'; };
const closeDetailsModal = () => { detailsModalOpen.value = false; selectedContract.value = null; document.body.style.overflow = ''; };

const cancelContractAction = (contract: Contract) => {
  confirm(
    '¿Estás seguro de cancelar este contrato?',
    async () => {
      try {
        await contractService.cancelContract(contract.id);
        success('Contrato cancelado', 'Hecho');
        closeDetailsModal();
        await fetchContracts(); await fetchStats();
      } catch (e: any) { error(e.message || 'Error al cancelar', 'Error'); }
    },
    undefined,
    { title: 'Confirmar Cancelación', confirmText: 'Cancelar Contrato', cancelText: 'Volver' }
  );
};

const formatDate = (d?: string) => { if (!d) return 'N/A'; return new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }); };
const formatPrice = (a?: number) => { if (a == null) return '—'; return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(a); };
const getInitials = (name?: string) => { if (!name) return '?'; return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase(); };

const STATUS_CONFIG: Record<string, any> = {
  active: { label: 'Activo', color: '#059669', bg: '#d1fae5', icon: 'check-circle' },
  pending: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7', icon: 'clock' },
  expired: { label: 'Expirado', color: '#64748b', bg: '#f1f5f9', icon: 'hourglass-end' },
  cancelled: { label: 'Cancelado', color: '#dc2626', bg: '#fee2e2', icon: 'times-circle' },
  rejected: { label: 'Rechazado', color: '#7c3aed', bg: '#ede9fe', icon: 'ban' },
  activo: { label: 'Activo', color: '#059669', bg: '#d1fae5', icon: 'check-circle' },
  pendiente: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7', icon: 'clock' },
  expirado: { label: 'Expirado', color: '#64748b', bg: '#f1f5f9', icon: 'hourglass-end' },
  cancelado: { label: 'Cancelado', color: '#dc2626', bg: '#fee2e2', icon: 'times-circle' },
  rechazado: { label: 'Rechazado', color: '#7c3aed', bg: '#ede9fe', icon: 'ban' },
};
const getStatusConfig = (status: string) => { const s = (status || '').toLowerCase(); return STATUS_CONFIG[s] ?? { label: status, color: '#64748b', bg: '#f1f5f9', icon: 'circle' }; };
</script>

<style scoped>
/* ═══════════════════════════════════════════════
   CONTRACTS — RENTUS ADMIN 2025
   ═══════════════════════════════════════════════ */
.rx-contracts {
  --surface: var(--admin-surface, #fff);
  --surface-alt: var(--admin-surface-elevated, #f8fafc);
  --txt: var(--admin-text-primary, #0f172a);
  --txt2: var(--admin-text-secondary, #475569);
  --txt3: var(--admin-text-muted, #94a3b8);
  --brd: var(--admin-border, #e2e8f0);
  --accent-color: var(--accent, #6366f1);
  --radius: 14px;
  --shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03);
  max-width: 1560px; margin: 0 auto;
  animation: rxFade .4s ease; color: var(--txt);
}
@keyframes rxFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

/* ─── TOP BAR ─── */
.rx-topbar { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; margin-bottom: .5rem; }
.rx-topbar__left { display: flex; align-items: center; gap: 1rem; }
.rx-topbar__icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; font-size: 1.2rem; box-shadow: 0 4px 14px rgba(245,158,11,.3); }
.rx-topbar__title { font-size: 1.5rem; font-weight: 800; letter-spacing: -.02em; margin: 0; color: var(--txt); }
.rx-topbar__sub { font-size: .875rem; color: var(--txt3); margin: .15rem 0 0; }

/* ─── KPI ─── */
.rx-kpi-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.rx-kpi { background: var(--surface); border: 1px solid var(--brd); border-radius: var(--radius); padding: 1.15rem 1.25rem; display: flex; align-items: center; gap: 1rem; position: relative; transition: all .25s; box-shadow: var(--shadow); }
.rx-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.06); }
.rx-kpi__icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: hsl(var(--kpi-hue) 80% 95%); color: hsl(var(--kpi-hue) 70% 50%); font-size: 1rem; flex-shrink: 0; }
.rx-kpi__body { display: flex; flex-direction: column; }
.rx-kpi__val { font-size: 1.4rem; font-weight: 800; letter-spacing: -.02em; color: var(--txt); }
.rx-kpi__label { font-size: .78rem; color: var(--txt3); font-weight: 500; }
.rx-kpi__pct { position: absolute; top: .75rem; right: 1rem; font-size: .7rem; font-weight: 700; color: hsl(var(--kpi-hue) 70% 50%); background: hsl(var(--kpi-hue) 80% 95%); padding: .15rem .45rem; border-radius: 6px; }

/* ─── PANELS ─── */
.rx-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
.rx-panel { background: var(--surface); border: 1px solid var(--brd); border-radius: var(--radius); padding: 1.5rem; box-shadow: var(--shadow); }
.rx-panel__title { font-size: 1rem; font-weight: 700; margin: 0 0 1rem; display: flex; align-items: center; gap: .5rem; color: var(--txt); }
.rx-panel__icon { color: var(--accent-color); font-size: .9rem; }

/* Status bars */
.rx-status-bars { display: flex; flex-direction: column; gap: .85rem; }
.rx-sbar__head { display: flex; align-items: center; gap: .5rem; margin-bottom: .3rem; }
.rx-sbar__dot { width: 10px; height: 10px; border-radius: 3px; }
.rx-sbar__label { flex: 1; font-size: .82rem; font-weight: 600; color: var(--txt); }
.rx-sbar__val { font-size: .78rem; font-weight: 700; color: var(--txt2); }
.rx-sbar__track { width: 100%; height: 6px; background: var(--surface-alt); border-radius: 99px; overflow: hidden; }
.rx-sbar__fill { height: 100%; border-radius: 99px; transition: width .6s ease; }

/* Summary grid */
.rx-summary-grid { display: flex; flex-direction: column; gap: .75rem; }
.rx-summary-item { display: flex; align-items: center; gap: .85rem; padding: .75rem; background: var(--surface-alt); border: 1px solid var(--brd); border-radius: 10px; transition: all .2s; }
.rx-summary-item:hover { transform: translateX(3px); border-color: var(--accent-color); }
.rx-summary-item__icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: hsl(var(--sh) 80% 95%); color: hsl(var(--sh) 70% 50%); font-size: .85rem; flex-shrink: 0; }
.rx-summary-item__val { font-size: 1.15rem; font-weight: 800; color: var(--txt); display: block; }
.rx-summary-item__label { font-size: .75rem; color: var(--txt3); }

/* ─── TOOLBAR ─── */
.rx-toolbar { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; align-items: center; }
.rx-search { flex: 1; min-width: 260px; position: relative; }
.rx-search__ico { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--txt3); font-size: .85rem; }
.rx-search__input { width: 100%; padding: .7rem 2.5rem .7rem 2.75rem; border-radius: 10px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt); font-size: .875rem; font-family: inherit; transition: border-color .2s; }
.rx-search__input::placeholder { color: var(--txt3); }
.rx-search__input:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
.rx-search__clear { position: absolute; right: .75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--txt3); cursor: pointer; font-size: .8rem; }
.rx-filters { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.rx-select { padding: .65rem 2rem .65rem .85rem; border-radius: 10px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt2); font-size: .8rem; font-family: inherit; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .75rem center; }
.rx-select:focus { outline: none; border-color: var(--accent-color); }

/* ─── BUTTONS ─── */
.rx-btn { display: inline-flex; align-items: center; gap: .5rem; padding: .65rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: .875rem; border: none; cursor: pointer; transition: all .2s; font-family: inherit; }
.rx-btn--accent { background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; box-shadow: 0 2px 10px rgba(99,102,241,.25); }
.rx-btn--ghost { background: var(--surface-alt); color: var(--txt2); border: 1px solid var(--brd); }
.rx-btn--ghost:hover { border-color: var(--accent-color); color: var(--accent-color); }
.rx-btn--danger { background: #ef4444; color: #fff; }
.rx-btn--danger:hover { background: #dc2626; }

/* ─── DATA GRID ─── */
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

/* Cell property */
.rx-cell-prop { display: flex; align-items: center; gap: .65rem; }
.rx-cell-prop__placeholder { width: 36px; height: 36px; border-radius: 9px; background: var(--surface-alt); border: 1px solid var(--brd); display: flex; align-items: center; justify-content: center; color: var(--txt3); font-size: .8rem; flex-shrink: 0; }
.rx-cell-prop__info { display: flex; flex-direction: column; }
.rx-cell-prop__name { font-weight: 600; color: var(--txt); font-size: .82rem; }
.rx-cell-prop__sub { font-size: .72rem; color: var(--txt3); margin-top: .1rem; display: flex; align-items: center; gap: .25rem; }

/* User cell */
.rx-user-cell { display: flex; align-items: center; gap: .65rem; }
.rx-avatar { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 700; flex-shrink: 0; }
.rx-avatar--tenant { background: #dbeafe; color: #2563eb; }
.rx-avatar--landlord { background: #ede9fe; color: #7c3aed; }
.rx-avatar--lg { width: 44px; height: 44px; font-size: .85rem; border-radius: 12px; }
.rx-user-cell__info { display: flex; flex-direction: column; }
.rx-user-cell__name { font-weight: 600; color: var(--txt); font-size: .82rem; }
.rx-user-cell__sub { font-size: .7rem; color: var(--txt3); }

/* Actions */
.rx-actions { display: flex; gap: .35rem; }
.rx-act { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--brd); background: var(--surface); color: var(--txt3); cursor: pointer; transition: all .2s; font-size: .75rem; }
.rx-act:hover { color: #fff; transform: scale(1.08); }
.rx-act--view:hover { background: #3b82f6; border-color: #3b82f6; }
.rx-act--approve:hover { background: #059669; border-color: #059669; }
.rx-act--reject:hover { background: #dc2626; border-color: #dc2626; }

/* Pagination */
.rx-pagination { display: flex; align-items: center; justify-content: center; gap: .75rem; padding: 1rem; border-top: 1px solid var(--brd); flex-wrap: wrap; }
.rx-pg-btn { display: inline-flex; align-items: center; gap: .35rem; padding: .5rem 1rem; border-radius: 8px; border: 1px solid var(--brd); background: var(--surface); color: var(--txt2); font-size: .8rem; font-weight: 600; cursor: pointer; transition: all .2s; font-family: inherit; }
.rx-pg-btn:hover:not(:disabled) { border-color: var(--accent-color); color: var(--accent-color); }
.rx-pg-btn:disabled { opacity: .4; cursor: not-allowed; }
.rx-pg-pages { display: flex; gap: .25rem; }
.rx-pg-page { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; background: transparent; color: var(--txt2); font-size: .8rem; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit; }
.rx-pg-page:hover { background: var(--surface-alt); }
.rx-pg-page.active { background: var(--accent-color); color: #fff; border-color: var(--accent-color); }
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