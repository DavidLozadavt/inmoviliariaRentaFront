<template>
  <div class="rx-properties">
    <!-- ═══════ TOP BAR ═══════ -->
    <header class="rx-topbar">
      <div class="rx-topbar__left">
        <div class="rx-topbar__icon">
          <font-awesome-icon :icon="['fas', 'city']" />
        </div>
        <div>
          <h1 class="rx-topbar__title">Propiedades</h1>
          <p class="rx-topbar__sub">Gestión integral del portafolio inmobiliario</p>
        </div>
      </div>
      <button class="rx-btn rx-btn--accent" @click="openCreateModal">
        <font-awesome-icon :icon="['fas', 'plus']" />
        Nueva Propiedad
      </button>
    </header>

    <!-- ═══════ KPI STRIP ═══════ -->
    <section class="rx-kpi-strip" v-if="stats && !loadingStats">
      <div class="rx-kpi" style="--kpi-hue: 230">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'building']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.total }}</span>
          <span class="rx-kpi__label">Total</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 155">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'check-circle']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.available }}</span>
          <span class="rx-kpi__label">Disponibles</span>
        </div>
        <span class="rx-kpi__pct">{{ pctOf(stats.available, stats.total) }}%</span>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 35">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'clock']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.pending_approval }}</span>
          <span class="rx-kpi__label">Pendientes</span>
        </div>
        <span class="rx-kpi__pct">{{ pctOf(stats.pending_approval, stats.total) }}%</span>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 270">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'dollar-sign']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val price">{{ formatPrice(stats.average_price) }}</span>
          <span class="rx-kpi__label">Precio Promedio</span>
        </div>
      </div>
    </section>

    <!-- ═══════ VISUAL PANELS ═══════ -->
    <section class="rx-panels" v-if="stats && !loadingStats">
      <!-- Distribution donut -->
      <div class="rx-panel rx-panel--chart">
        <h3 class="rx-panel__title">
          <font-awesome-icon :icon="['fas', 'chart-pie']" class="rx-panel__icon" />
          Distribución
        </h3>
        <div class="rx-donut-wrap">
          <Doughnut :data="donutData" :options="donutOpts" v-if="chartReady" />
        </div>
        <div class="rx-legend">
          <span v-for="(item, i) in donutData.labels" :key="i" class="rx-legend__item">
            <i class="rx-legend__dot" :style="{ background: (donutData.datasets[0].backgroundColor as string[])[i] }"></i>
            {{ item }} <strong>{{ donutData.datasets[0].data[i] }}</strong>
          </span>
        </div>
      </div>

      <!-- Quick actions / insights panel -->
      <div class="rx-panel rx-panel--insights">
        <h3 class="rx-panel__title">
          <font-awesome-icon :icon="['fas', 'bolt']" class="rx-panel__icon" />
          Acciones Rápidas
        </h3>
        <div class="rx-quick-actions">
          <button class="rx-qa" @click="filterByPending" v-if="stats.pending_approval > 0">
            <span class="rx-qa__badge warn">{{ stats.pending_approval }}</span>
            <span class="rx-qa__text">Aprobar pendientes</span>
            <font-awesome-icon :icon="['fas', 'chevron-right']" class="rx-qa__arrow" />
          </button>
          <button class="rx-qa" @click="openCreateModal">
            <span class="rx-qa__badge accent"><font-awesome-icon :icon="['fas', 'plus']" /></span>
            <span class="rx-qa__text">Agregar propiedad</span>
            <font-awesome-icon :icon="['fas', 'chevron-right']" class="rx-qa__arrow" />
          </button>
          <button class="rx-qa" @click="clearFilters">
            <span class="rx-qa__badge neutral"><font-awesome-icon :icon="['fas', 'redo']" /></span>
            <span class="rx-qa__text">Resetear filtros</span>
            <font-awesome-icon :icon="['fas', 'chevron-right']" class="rx-qa__arrow" />
          </button>
        </div>
        <!-- Mini occupancy gauge -->
        <div class="rx-gauge-section">
          <h4 class="rx-gauge__title">Tasa de Ocupación</h4>
          <div class="rx-gauge-bar">
            <div class="rx-gauge-bar__fill" :style="{ width: occupancyRate + '%' }"></div>
          </div>
          <span class="rx-gauge__val">{{ occupancyRate }}%</span>
        </div>
      </div>
    </section>

    <!-- ═══════ FILTERS TOOLBAR ═══════ -->
    <section class="rx-toolbar">
      <div class="rx-search">
        <font-awesome-icon :icon="['fas', 'search']" class="rx-search__ico" />
        <input
          type="text"
          class="rx-search__input"
          placeholder="Buscar por título, ciudad o propietario…"
          v-model="searchQuery"
          @input="handleSearchInput"
        />
        <button v-if="searchQuery" class="rx-search__clear" @click="clearSearch">
          <font-awesome-icon :icon="['fas', 'times']" />
        </button>
      </div>
      <div class="rx-filters">
        <select class="rx-select" v-model="filterStatus" @change="applyFilters">
          <option value="">Estado: Todos</option>
          <option value="available">Disponible</option>
          <option value="rented">Rentada</option>
          <option value="maintenance">Mantenimiento</option>
        </select>
        <select class="rx-select" v-model="filterApproval" @change="applyFilters">
          <option value="">Aprobación: Todas</option>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobada</option>
          <option value="rejected">Rechazada</option>
        </select>
        <select class="rx-select" v-model="filterVisibility" @change="applyFilters">
          <option value="">Visibilidad: Todas</option>
          <option value="published">Publicada</option>
          <option value="hidden">Oculta</option>
        </select>
        <button v-if="hasActiveFilters" class="rx-btn rx-btn--ghost" @click="clearFilters">
          <font-awesome-icon :icon="['fas', 'times-circle']" />
          Limpiar
        </button>
      </div>
    </section>

    <!-- ═══════ DATA GRID ═══════ -->
    <section class="rx-datagrid">
      <!-- Loading -->
      <div v-if="loading && properties.length === 0" class="rx-state rx-state--loading">
        <div class="rx-spinner"></div>
        <p>Cargando propiedades…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error && properties.length === 0" class="rx-state rx-state--error">
        <font-awesome-icon :icon="['fas', 'exclamation-triangle']" class="rx-state__icon" />
        <h3>Error al cargar</h3>
        <p>{{ error }}</p>
        <button class="rx-btn rx-btn--accent" @click="loadProperties">Reintentar</button>
      </div>

      <!-- Empty -->
      <div v-else-if="properties.length === 0" class="rx-state rx-state--empty">
        <font-awesome-icon :icon="['fas', 'building']" class="rx-state__icon" />
        <h3>Sin propiedades</h3>
        <p>{{ hasActiveFilters ? 'Ajusta los filtros de búsqueda' : 'Aún no hay propiedades registradas' }}</p>
      </div>

      <!-- Table -->
      <div v-else class="rx-table-wrap">
        <table class="rx-table">
          <thead>
            <tr>
              <th @click="toggleSort('id')" class="rx-th--sortable">
                ID
                <font-awesome-icon :icon="['fas', getSortIcon('id')]" class="rx-sort" :class="{ active: sortField === 'id' }" />
              </th>
              <th @click="toggleSort('title')" class="rx-th--sortable">
                Propiedad
                <font-awesome-icon :icon="['fas', getSortIcon('title')]" class="rx-sort" :class="{ active: sortField === 'title' }" />
              </th>
              <th>Ubicación</th>
              <th @click="toggleSort('monthly_price')" class="rx-th--sortable">
                Precio
                <font-awesome-icon :icon="['fas', getSortIcon('monthly_price')]" class="rx-sort" :class="{ active: sortField === 'monthly_price' }" />
              </th>
              <th>Estado</th>
              <th>Aprobación</th>
              <th @click="toggleSort('views')" class="rx-th--sortable">
                Vistas
                <font-awesome-icon :icon="['fas', getSortIcon('views')]" class="rx-sort" :class="{ active: sortField === 'views' }" />
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="property in properties" :key="property.id" class="rx-row">
              <td><span class="rx-id">#{{ property.id }}</span></td>
              <td>
                <div class="rx-cell-prop">
                  <div class="rx-cell-prop__img">
                    <img :src="getPropertyImage(property)" :alt="property.title" @error="handleImageError" />
                  </div>
                  <div class="rx-cell-prop__info">
                    <span class="rx-cell-prop__name">{{ truncate(property.title, 28) }}</span>
                    <span class="rx-cell-prop__specs">
                      <font-awesome-icon :icon="['fas', 'bed']" /> {{ property.num_bedrooms }}
                      <font-awesome-icon :icon="['fas', 'bath']" /> {{ property.num_bathrooms }}
                      <font-awesome-icon :icon="['fas', 'ruler-combined']" /> {{ property.area_m2 }}m²
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <div class="rx-cell-loc">
                  <span class="rx-cell-loc__city"><font-awesome-icon :icon="['fas', 'map-marker-alt']" /> {{ property.city }}</span>
                  <span class="rx-cell-loc__addr">{{ truncate(property.address, 22) }}</span>
                </div>
              </td>
              <td>
                <span class="rx-price">{{ formatPrice(property.monthly_price) }}<small>/mes</small></span>
              </td>
              <td>
                <span class="rx-badge" :class="'rx-badge--' + property.status">
                  <font-awesome-icon :icon="['fas', getStatusConfig(property.status).icon]" />
                  {{ getStatusConfig(property.status).label }}
                </span>
              </td>
              <td>
                <span class="rx-badge" :class="'rx-badge--' + (property.approval_status || 'pending')">
                  <font-awesome-icon :icon="['fas', getApprovalConfig(property.approval_status).icon]" />
                  {{ getApprovalConfig(property.approval_status).label }}
                </span>
              </td>
              <td>
                <button class="rx-views" @click="openDetailsModal(property)" title="Ver detalles">
                  <font-awesome-icon :icon="['fas', 'eye']" />
                  {{ property.views || 0 }}
                </button>
              </td>
              <td>
                <div class="rx-actions">
                  <button
                    v-if="property.approval_status === 'pending'"
                    class="rx-act rx-act--approve"
                    @click="approveProperty(property)"
                    title="Aprobar"
                    :disabled="statusUpdateLoading[property.id]"
                  >
                    <font-awesome-icon :icon="['fas', statusUpdateLoading[property.id] ? 'spinner' : 'check']" :spin="statusUpdateLoading[property.id]" />
                  </button>
                  <button
                    v-if="property.approval_status !== 'rejected'"
                    class="rx-act rx-act--reject"
                    @click="rejectProperty(property)"
                    title="Rechazar"
                    :disabled="statusUpdateLoading[property.id]"
                  >
                    <font-awesome-icon :icon="['fas', statusUpdateLoading[property.id] ? 'spinner' : 'ban']" :spin="statusUpdateLoading[property.id]" />
                  </button>
                  <button class="rx-act rx-act--edit" @click="openEditModal(property)" title="Editar">
                    <font-awesome-icon :icon="['fas', 'pen']" />
                  </button>
                  <button class="rx-act rx-act--delete" @click="confirmDeleteProperty(property)" title="Eliminar">
                    <font-awesome-icon :icon="['fas', 'trash']" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination.lastPage > 1" class="rx-pagination">
          <button class="rx-pg-btn" :disabled="pagination.currentPage === 1 || paginationLoading" @click="changePage(pagination.currentPage - 1)">
            <font-awesome-icon :icon="['fas', 'chevron-left']" /> Anterior
          </button>
          <div class="rx-pg-pages">
            <button
              v-for="page in visiblePages"
              :key="page"
              class="rx-pg-page"
              :class="{ active: page === pagination.currentPage }"
              @click="changePage(page)"
              :disabled="page === '...' || paginationLoading"
            >{{ page }}</button>
          </div>
          <span class="rx-pg-info">
            Pág. {{ pagination.currentPage }}/{{ pagination.lastPage }} · {{ pagination.total }} propiedades
          </span>
          <button class="rx-pg-btn" :disabled="pagination.currentPage === pagination.lastPage || paginationLoading" @click="changePage(pagination.currentPage + 1)">
            Siguiente <font-awesome-icon :icon="['fas', 'chevron-right']" />
          </button>
        </div>
      </div>
    </section>
  </div>

  <!-- MODALS -->
  <PropertyDetailsModal
    :show="detailsModalOpen"
    :property-id="selectedPropertyId"
    @close="closeDetailsModal"
    @edit="handleEditFromDetails"
  />
  <PropertyEditModal
    :show="editModalOpen"
    :property="selectedProperty"
    @close="closeEditModal"
    @saved="handlePropertySaved"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { getPropertyImage as getPropertyImageUtil } from '../../utils/propertyUtils';
import { propertyManagementService, type Property, type PropertyStats } from '../../services/propertyManagementService';
import { eventBus } from '../../events/eventBus';
import { useAlerts } from '../../composables/useAlerts';
import PropertyDetailsModal from '../components/Properties/PropertyDetailsModal.vue';
import PropertyEditModal from '../components/Properties/PropertyEditModal.vue';
import type {
  PropertyAvailabilityStatus,
  PropertyApprovalStatus,
  PropertyVisibility,
} from '../../types/property';

import { Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const { success, error: showError, confirm } = useAlerts();

// State
const properties = ref<Property[]>([]);
const stats = ref<PropertyStats | null>(null);
const loading = ref(true);
const loadingStats = ref(true);
const error = ref('');
const statusUpdateLoading = ref<Record<number, boolean>>({});
const paginationLoading = ref(false);

// Modals
const detailsModalOpen = ref(false);
const editModalOpen = ref(false);
const selectedPropertyId = ref<number | null>(null);
const selectedProperty = ref<Property | null>(null);

// Filters
const filterStatus = ref<PropertyAvailabilityStatus | ''>('');
const filterApproval = ref<PropertyApprovalStatus | ''>('');
const filterVisibility = ref<PropertyVisibility | ''>('');
const searchQuery = ref('');
const sortField = ref<'created_at' | string>('created_at');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Pagination
const pagination = ref({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });

// Chart
const chartReady = ref(false);
const donutData = ref({
  labels: ['Disponibles', 'Rentadas', 'Mantenimiento'],
  datasets: [{
    data: [0, 0, 0],
    backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
    borderWidth: 0,
    hoverOffset: 6,
  }]
});
const donutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '74%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#18181b',
      bodyFont: { family: 'Inter', size: 13 },
      padding: 10,
    }
  }
};

// Computed
const hasActiveFilters = computed(() =>
  searchQuery.value !== '' ||
  filterStatus.value !== '' ||
  filterApproval.value !== '' ||
  filterVisibility.value !== ''
);

const occupancyRate = computed(() => {
  if (!stats.value || stats.value.total === 0) return 0;
  const rented = stats.value.total - stats.value.available - (stats.value.pending_approval || 0);
  return Math.round(Math.max(0, rented) / stats.value.total * 100);
});

const visiblePages = computed(() => {
  const current = pagination.value.currentPage;
  const last = pagination.value.lastPage;
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }
  let prev = 0;
  for (const i of range) {
    if (prev) {
      if (i - prev === 2) rangeWithDots.push(prev + 1);
      else if (i - prev !== 1) rangeWithDots.push('...');
    }
    rangeWithDots.push(i);
    prev = i;
  }
  return rangeWithDots;
});

// Utils
const pctOf = (part: number, total: number) => total > 0 ? Math.round((part / total) * 100) : 0;
const truncate = (text: string, max: number) => (!text ? '' : text.length > max ? text.substring(0, max) + '…' : text);
const formatPrice = (price: number) => propertyManagementService.formatPrice(price);
const getPropertyImage = (property: any) => getPropertyImageUtil(property);

// Modal methods
const openDetailsModal = (p: Property) => { selectedPropertyId.value = p.id; detailsModalOpen.value = true; };
const closeDetailsModal = () => { detailsModalOpen.value = false; selectedPropertyId.value = null; };
const openCreateModal = () => { selectedProperty.value = null; editModalOpen.value = true; };
const openEditModal = (p: Property) => { selectedProperty.value = p; editModalOpen.value = true; };
const handleEditFromDetails = (p: Property) => { closeDetailsModal(); openEditModal(p); };
const closeEditModal = () => { editModalOpen.value = false; selectedProperty.value = null; };
const handlePropertySaved = async () => { await loadProperties(); await loadStats(); };

// Data loading
const loadProperties = async () => {
  try {
    loading.value = true;
    error.value = '';
    const filters = {
      search: searchQuery.value,
      status: filterStatus.value,
      approval_status: filterApproval.value,
      visibility: filterVisibility.value,
      page: pagination.value.currentPage,
      perPage: pagination.value.perPage,
      sortBy: sortField.value,
      sortOrder: sortOrder.value,
    };
    const response = await propertyManagementService.getProperties(filters);
    properties.value = response.data;
    pagination.value = {
      currentPage: response.meta.current_page,
      lastPage: response.meta.last_page,
      perPage: response.meta.per_page,
      total: response.meta.total,
    };
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error al cargar propiedades';
    showError('Error al cargar propiedades', 'Error');
  } finally {
    loading.value = false;
    paginationLoading.value = false;
  }
};

const loadStats = async () => {
  try {
    loadingStats.value = true;
    stats.value = await propertyManagementService.getPropertyStats();
    // Update donut
    if (stats.value) {
      const s = stats.value;
      donutData.value.datasets[0].data = [s.available, s.total - s.available - (s.pending_approval || 0), s.pending_approval || 0];
      nextTick(() => { chartReady.value = true; });
    }
  } catch (err: any) {
    showError('Error cargando estadísticas', 'Error');
  } finally {
    loadingStats.value = false;
  }
};

// Search / Filter
let searchTimeout: ReturnType<typeof setTimeout>;
const handleSearchInput = () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { pagination.value.currentPage = 1; loadProperties(); }, 500); };
const clearSearch = () => { searchQuery.value = ''; pagination.value.currentPage = 1; loadProperties(); };
const applyFilters = () => { pagination.value.currentPage = 1; loadProperties(); };
const clearFilters = () => { searchQuery.value = ''; filterStatus.value = ''; filterApproval.value = ''; filterVisibility.value = ''; pagination.value.currentPage = 1; loadProperties(); };
const filterByPending = () => { filterApproval.value = 'pending'; filterStatus.value = ''; filterVisibility.value = ''; pagination.value.currentPage = 1; loadProperties(); };

// Sort
const toggleSort = (field: string) => {
  if (sortField.value !== field) { sortField.value = field; sortOrder.value = 'desc'; }
  else { sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'; }
  pagination.value.currentPage = 1;
  loadProperties();
};
const getSortIcon = (field: string): string => {
  if (sortField.value !== field) return 'sort';
  return sortOrder.value === 'asc' ? 'sort-up' : 'sort-down';
};

// Pagination
const changePage = (page: number | string) => {
  if (typeof page === 'string') return;
  if (page < 1 || page > pagination.value.lastPage || page === pagination.value.currentPage) return;
  paginationLoading.value = true;
  pagination.value.currentPage = page;
  loadProperties();
};

// Actions
const approveProperty = async (property: Property) => {
  try {
    statusUpdateLoading.value[property.id] = true;
    await propertyManagementService.approveProperty(property.id);
    success('Propiedad aprobada correctamente', 'Éxito');
    const idx = properties.value.findIndex(p => p.id === property.id);
    if (idx !== -1) properties.value[idx].approval_status = 'approved';
    await loadStats();
  } catch (err: any) { showError(err.response?.data?.message || 'Error al aprobar', 'Error'); }
  finally { statusUpdateLoading.value[property.id] = false; }
};

const rejectProperty = async (property: Property) => {
  try {
    statusUpdateLoading.value[property.id] = true;
    await propertyManagementService.rejectProperty(property.id);
    success('Propiedad rechazada correctamente', 'Éxito');
    const idx = properties.value.findIndex(p => p.id === property.id);
    if (idx !== -1) properties.value[idx].approval_status = 'rejected';
    await loadStats();
  } catch (err: any) { showError(err.response?.data?.message || 'Error al rechazar', 'Error'); }
  finally { statusUpdateLoading.value[property.id] = false; }
};

const confirmDeleteProperty = (property: Property) => {
  confirm(
    `¿Estás seguro de eliminar "${property.title}"? Esta acción no se puede deshacer.`,
    () => deleteProperty(property),
    undefined,
    { title: 'Confirmar Eliminación', confirmText: 'Eliminar', cancelText: 'Cancelar' }
  );
};
const deleteProperty = async (property: Property) => {
  try {
    statusUpdateLoading.value[property.id] = true;
    await propertyManagementService.deleteProperty(property.id);
    success('Propiedad eliminada', 'Éxito');
    properties.value = properties.value.filter(p => p.id !== property.id);
    await loadStats();
  } catch (err: any) { showError(err.response?.data?.message || 'Error al eliminar', 'Error'); }
  finally { statusUpdateLoading.value[property.id] = false; }
};

const handleImageError = (e: Event) => { (e.target as HTMLImageElement).style.display = 'none'; };

const getStatusConfig = (status: string) => {
  const config = propertyManagementService.getStatusConfig(status as any);
  const iconMap: Record<string, string> = { '✓': 'check-circle', '⏸': 'pause-circle', '🔧': 'wrench' };
  return { ...config, icon: iconMap[config.icon] || 'circle' };
};
const getApprovalConfig = (status?: PropertyApprovalStatus) => {
  const safeStatus: PropertyApprovalStatus = status ?? 'pending';
  const config = propertyManagementService.getApprovalConfig(safeStatus);
  const iconMap: Record<string, string> = { '⏳': 'clock', '✓': 'check-circle', '✕': 'times-circle' };
  return { ...config, icon: iconMap[config.icon] || 'circle' };
};

// Events
const handlePropertyCreated = () => { loadProperties(); loadStats(); };
const handlePropertyUpdated = () => { loadProperties(); loadStats(); };
const handlePropertyDeleted = () => { loadProperties(); loadStats(); };

onMounted(() => {
  loadProperties();
  loadStats();
  eventBus.on('property:created', handlePropertyCreated);
  eventBus.on('property:updated', handlePropertyUpdated);
  eventBus.on('property:deleted', handlePropertyDeleted);
  eventBus.on('property:approved', handlePropertyUpdated);
  eventBus.on('property:rejected', handlePropertyUpdated);
});
onUnmounted(() => {
  eventBus.off('property:created', handlePropertyCreated);
  eventBus.off('property:updated', handlePropertyUpdated);
  eventBus.off('property:deleted', handlePropertyDeleted);
  eventBus.off('property:approved', handlePropertyUpdated);
  eventBus.off('property:rejected', handlePropertyUpdated);
});
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   PROPERTIES — RENTUS ADMIN 2025 · REDESIGN FROM 0
   ═══════════════════════════════════════════════════ */

.rx-properties {
  --surface: var(--admin-surface, #fff);
  --surface-alt: var(--admin-surface-elevated, #f8fafc);
  --txt: var(--admin-text-primary, #0f172a);
  --txt2: var(--admin-text-secondary, #475569);
  --txt3: var(--admin-text-muted, #94a3b8);
  --brd: var(--admin-border, #e2e8f0);
  --accent: var(--accent, #6366f1);
  --radius: 14px;
  --shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03);

  padding: 0;
  max-width: 1560px;
  margin: 0 auto;
  animation: rxFade .4s ease;
  color: var(--txt);
}
@keyframes rxFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

/* ─── TOP BAR ─── */
.rx-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 0;
  margin-bottom: .5rem;
}
.rx-topbar__left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.rx-topbar__icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 1.2rem;
  box-shadow: 0 4px 14px rgba(99,102,241,.3);
}
.rx-topbar__title {
  font-size: 1.5rem; font-weight: 800;
  letter-spacing: -.02em;
  margin: 0; color: var(--txt);
}
.rx-topbar__sub {
  font-size: .875rem; color: var(--txt3);
  margin: .15rem 0 0;
}

/* ─── BUTTONS ─── */
.rx-btn {
  display: inline-flex; align-items: center; gap: .5rem;
  padding: .65rem 1.25rem;
  border-radius: 10px;
  font-weight: 600; font-size: .875rem;
  border: none; cursor: pointer;
  transition: all .2s;
  font-family: inherit;
}
.rx-btn--accent {
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: #fff;
  box-shadow: 0 2px 10px rgba(99,102,241,.25);
}
.rx-btn--accent:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,.35); }
.rx-btn--ghost {
  background: var(--surface-alt);
  color: var(--txt2);
  border: 1px solid var(--brd);
}
.rx-btn--ghost:hover { border-color: var(--accent); color: var(--accent); }

/* ─── KPI STRIP ─── */
.rx-kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.rx-kpi {
  background: var(--surface);
  border: 1px solid var(--brd);
  border-radius: var(--radius);
  padding: 1.15rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  transition: all .25s;
  box-shadow: var(--shadow);
}
.rx-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.06); }
.rx-kpi__icon {
  width: 42px; height: 42px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: hsl(var(--kpi-hue) 80% 95%);
  color: hsl(var(--kpi-hue) 70% 50%);
  font-size: 1rem;
  flex-shrink: 0;
}
.rx-kpi__body { display: flex; flex-direction: column; }
.rx-kpi__val { font-size: 1.4rem; font-weight: 800; letter-spacing: -.02em; color: var(--txt); }
.rx-kpi__val.price { font-size: 1.1rem; }
.rx-kpi__label { font-size: .78rem; color: var(--txt3); font-weight: 500; }
.rx-kpi__pct {
  position: absolute; top: .75rem; right: 1rem;
  font-size: .7rem; font-weight: 700;
  color: hsl(var(--kpi-hue) 70% 50%);
  background: hsl(var(--kpi-hue) 80% 95%);
  padding: .15rem .45rem;
  border-radius: 6px;
}

/* ─── PANELS ─── */
.rx-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}
.rx-panel {
  background: var(--surface);
  border: 1px solid var(--brd);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
}
.rx-panel__title {
  font-size: 1rem; font-weight: 700;
  margin: 0 0 1rem;
  display: flex; align-items: center; gap: .5rem;
  color: var(--txt);
}
.rx-panel__icon { color: var(--accent); font-size: .9rem; }

/* Donut */
.rx-donut-wrap {
  height: 180px;
  display: flex; justify-content: center;
  margin-bottom: .75rem;
}
.rx-legend {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem 1.25rem;
}
.rx-legend__item {
  display: flex; align-items: center; gap: .35rem;
  font-size: .8rem; color: var(--txt2);
}
.rx-legend__item strong { color: var(--txt); font-weight: 700; }
.rx-legend__dot {
  width: 10px; height: 10px;
  border-radius: 3px;
  display: inline-block;
}

/* Quick Actions */
.rx-quick-actions { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1.25rem; }
.rx-qa {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .75rem 1rem;
  border-radius: 10px;
  background: var(--surface-alt);
  border: 1px solid var(--brd);
  cursor: pointer;
  transition: all .2s;
  font-family: inherit;
  width: 100%;
  text-align: left;
}
.rx-qa:hover { border-color: var(--accent); transform: translateX(3px); }
.rx-qa__badge {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: .8rem; font-weight: 700; flex-shrink: 0;
}
.rx-qa__badge.warn { background: #fef3c7; color: #d97706; }
.rx-qa__badge.accent { background: #ede9fe; color: #6366f1; }
.rx-qa__badge.neutral { background: #f1f5f9; color: #64748b; }
.rx-qa__text { flex: 1; font-size: .875rem; font-weight: 600; color: var(--txt); }
.rx-qa__arrow { color: var(--txt3); font-size: .7rem; }

/* Gauge */
.rx-gauge-section { margin-top: auto; }
.rx-gauge__title { font-size: .78rem; font-weight: 600; color: var(--txt3); margin-bottom: .5rem; }
.rx-gauge-bar {
  width: 100%; height: 8px;
  background: var(--surface-alt);
  border-radius: 99px;
  overflow: hidden;
  border: 1px solid var(--brd);
}
.rx-gauge-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 99px;
  transition: width .6s ease;
}
.rx-gauge__val {
  display: block;
  text-align: right;
  font-size: .8rem;
  font-weight: 700;
  color: #10b981;
  margin-top: .25rem;
}

/* ─── TOOLBAR ─── */
.rx-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-bottom: 1.25rem;
  align-items: center;
}
.rx-search {
  flex: 1;
  min-width: 260px;
  position: relative;
}
.rx-search__ico {
  position: absolute;
  left: 1rem; top: 50%;
  transform: translateY(-50%);
  color: var(--txt3);
  font-size: .85rem;
}
.rx-search__input {
  width: 100%;
  padding: .7rem 2.5rem .7rem 2.75rem;
  border-radius: 10px;
  border: 1px solid var(--brd);
  background: var(--surface);
  color: var(--txt);
  font-size: .875rem;
  font-family: inherit;
  transition: border-color .2s;
}
.rx-search__input::placeholder { color: var(--txt3); }
.rx-search__input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
.rx-search__clear {
  position: absolute; right: .75rem; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  color: var(--txt3); cursor: pointer;
  font-size: .8rem;
}
.rx-filters {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  align-items: center;
}
.rx-select {
  padding: .65rem 2rem .65rem .85rem;
  border-radius: 10px;
  border: 1px solid var(--brd);
  background: var(--surface);
  color: var(--txt2);
  font-size: .8rem;
  font-family: inherit;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right .75rem center;
}
.rx-select:focus { outline: none; border-color: var(--accent); }

/* ─── DATA GRID ─── */
.rx-datagrid {
  background: var(--surface);
  border: 1px solid var(--brd);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

/* States */
.rx-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: .75rem;
}
.rx-state__icon { font-size: 2.5rem; color: var(--txt3); }
.rx-state h3 { font-size: 1.1rem; font-weight: 700; color: var(--txt); margin: 0; }
.rx-state p { font-size: .875rem; color: var(--txt3); margin: 0; }
.rx-spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--brd);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: rxSpin .7s linear infinite;
}
@keyframes rxSpin { to { transform: rotate(360deg); } }

/* Table */
.rx-table-wrap { overflow-x: auto; }
.rx-table {
  width: 100%;
  border-collapse: collapse;
}
.rx-table thead {
  position: sticky; top: 0; z-index: 2;
}
.rx-table th {
  padding: .85rem 1rem;
  font-size: .75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--txt3);
  background: var(--surface-alt);
  border-bottom: 1px solid var(--brd);
  text-align: left;
  white-space: nowrap;
}
.rx-th--sortable { cursor: pointer; user-select: none; }
.rx-th--sortable:hover { color: var(--txt); }
.rx-sort {
  font-size: .65rem;
  margin-left: .35rem;
  color: var(--txt3);
  opacity: .5;
  transition: opacity .2s;
}
.rx-sort.active { opacity: 1; color: var(--accent); }
.rx-table td {
  padding: .85rem 1rem;
  font-size: .85rem;
  color: var(--txt);
  border-bottom: 1px solid var(--brd);
  vertical-align: middle;
}
.rx-row { transition: background .15s; }
.rx-row:hover td { background: var(--surface-alt); }
.rx-row:last-child td { border-bottom: none; }

/* Cell: ID */
.rx-id {
  font-size: .75rem;
  font-weight: 600;
  color: var(--txt3);
  background: var(--surface-alt);
  padding: .2rem .55rem;
  border-radius: 6px;
  border: 1px solid var(--brd);
}

/* Cell: Property */
.rx-cell-prop {
  display: flex; align-items: center; gap: .75rem;
}
.rx-cell-prop__img {
  width: 44px; height: 44px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--surface-alt);
  border: 1px solid var(--brd);
}
.rx-cell-prop__img img { width: 100%; height: 100%; object-fit: cover; }
.rx-cell-prop__placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: var(--txt3); font-size: .9rem;
}
.rx-cell-prop__info { display: flex; flex-direction: column; }
.rx-cell-prop__name { font-weight: 600; color: var(--txt); font-size: .85rem; }
.rx-cell-prop__specs {
  font-size: .72rem; color: var(--txt3);
  display: flex; align-items: center; gap: .5rem;
  margin-top: .15rem;
}

/* Cell: Location */
.rx-cell-loc { display: flex; flex-direction: column; }
.rx-cell-loc__city { font-weight: 600; font-size: .82rem; color: var(--txt); display: flex; align-items: center; gap: .35rem; }
.rx-cell-loc__addr { font-size: .72rem; color: var(--txt3); margin-top: .1rem; }

/* Cell: Price */
.rx-price {
  font-weight: 700; color: var(--txt);
  font-size: .88rem;
}
.rx-price small {
  font-weight: 400; color: var(--txt3);
  font-size: .72rem;
}

/* Badge */
.rx-badge {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  padding: .25rem .65rem;
  border-radius: 7px;
  font-size: .72rem;
  font-weight: 600;
  white-space: nowrap;
}
.rx-badge--available { background: #ecfdf5; color: #059669; }
.rx-badge--rented { background: #eef2ff; color: #4f46e5; }
.rx-badge--maintenance { background: #fffbeb; color: #d97706; }
.rx-badge--pending { background: #fef3c7; color: #d97706; }
.rx-badge--approved { background: #ecfdf5; color: #059669; }
.rx-badge--rejected { background: #fef2f2; color: #dc2626; }

/* Views button */
.rx-views {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  padding: .3rem .65rem;
  border-radius: 7px;
  background: var(--surface-alt);
  border: 1px solid var(--brd);
  color: var(--txt2);
  font-size: .78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  font-family: inherit;
}
.rx-views:hover { border-color: var(--accent); color: var(--accent); }

/* Actions */
.rx-actions {
  display: flex;
  gap: .35rem;
}
.rx-act {
  width: 30px; height: 30px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--brd);
  background: var(--surface);
  color: var(--txt3);
  cursor: pointer;
  transition: all .2s;
  font-size: .75rem;
}
.rx-act:hover { color: #fff; transform: scale(1.08); }
.rx-act--approve:hover { background: #059669; border-color: #059669; }
.rx-act--reject:hover { background: #dc2626; border-color: #dc2626; }
.rx-act--edit:hover { background: #6366f1; border-color: #6366f1; }
.rx-act--delete:hover { background: #ef4444; border-color: #ef4444; }
.rx-act:disabled { opacity: .4; cursor: not-allowed; }

/* ─── PAGINATION ─── */
.rx-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .75rem;
  padding: 1rem;
  border-top: 1px solid var(--brd);
  flex-wrap: wrap;
}
.rx-pg-btn {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--brd);
  background: var(--surface);
  color: var(--txt2);
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  font-family: inherit;
}
.rx-pg-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.rx-pg-btn:disabled { opacity: .4; cursor: not-allowed; }
.rx-pg-pages { display: flex; gap: .25rem; }
.rx-pg-page {
  width: 34px; height: 34px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid transparent;
  background: transparent;
  color: var(--txt2);
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  font-family: inherit;
}
.rx-pg-page:hover { background: var(--surface-alt); }
.rx-pg-page.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
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