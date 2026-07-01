<template>
  <div class="mx-page">
    <!-- Background — positioned absolute dentro del flow, no fixed -->
    <div class="mx-bg" aria-hidden="true">
      <div class="mx-bg__orb mx-bg__orb--1"></div>
      <div class="mx-bg__orb mx-bg__orb--2"></div>
    </div>

    <div class="mx-shell">

      <!-- ── Header ── -->
      <header class="mx-header">
        <div class="mx-header__left">
          <span class="mx-eyebrow"><span class="ew-pip"></span>{{ $t('maintenance.eyebrow') }}</span>
          <h1 class="mx-title" v-html="$t('maintenance.title')"></h1>
          <p class="mx-subtitle">{{ $t('maintenance.subtitle') }}</p>
        </div>
        <div class="mx-header__right">
          <div class="mx-counters">
            <div class="mx-counter">
              <span class="mx-counter__val">{{ maintenances.length }}</span>
              <span class="mx-counter__lbl">{{ $t('maintenance.counters.results') }}</span>
            </div>
            <div class="mx-counter-sep"></div>
            <div class="mx-counter">
              <span class="mx-counter__val">{{ maintenances.filter(m => m.status === 'pending').length }}</span>
              <span class="mx-counter__lbl">{{ $t('maintenance.counters.pending') }}</span>
            </div>
          </div>
          <button class="btn-gold" @click="openCreateModal">
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            {{ $t('maintenance.actions.new') }}
          </button>
        </div>
      </header>

      <!-- ── Status Tabs ── -->
      <nav class="mx-tabs">
        <button
          v-for="tab in statusTabs" :key="tab.value"
          :class="['mx-tab', { 'mx-tab--active': statusFilter === tab.value }]"
          @click="statusFilter = tab.value; fetchMaintenances()"
        >
          <span class="mx-tab__dot" :style="{ background: tab.color }"></span>
          {{ tab.label }}
          <span class="mx-tab__count">{{ tab.count }}</span>
        </button>
      </nav>

      <!-- ── Toolbar ── -->
      <div class="mx-toolbar">
        <div class="mx-search">
          <svg viewBox="0 0 20 20" fill="none" width="14" height="14" class="mx-search__ico">
            <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
            <path d="M15 15l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input v-model="searchQuery" type="text" :placeholder="$t('maintenance.searchPlaceholder')" @input="handleSearch" />
        </div>
        <select v-model="priorityFilter" class="mx-select" @change="fetchMaintenances">
          <option value="">{{ $t('maintenance.filters.priorityAll') }}</option>
          <option value="low">{{ $t('maintenance.priority.low') }}</option>
          <option value="medium">{{ $t('maintenance.priority.medium') }}</option>
          <option value="high">{{ $t('maintenance.priority.high') }}</option>
          <option value="emergency">{{ $t('maintenance.priority.emergency') }}</option>
        </select>
      </div>

      <!-- ── Panel ── -->
      <div class="mx-panel">

        <!-- Loading -->
        <div v-if="loading" class="mx-state">
          <div class="mx-spinner"></div>
          <p>{{ $t('maintenance.states.loading') }}</p>
        </div>

        <!-- Empty -->
        <div v-else-if="maintenances.length === 0" class="mx-state">
          <div class="mx-empty-icon">
            <svg viewBox="0 0 48 48" fill="none" width="26" height="26">
              <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="1.5"/>
              <path d="M16 24h16M16 30h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M24 8v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h3>{{ $t('maintenance.states.empty.title') }}</h3>
          <p>{{ $t('maintenance.states.empty.description') }}</p>
          <button class="btn-gold btn-gold--sm" @click="openCreateModal" style="margin-top:1rem">
            <svg viewBox="0 0 16 16" fill="none" width="12" height="12"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            {{ $t('maintenance.actions.create') }}
          </button>
        </div>

        <!-- Table -->
        <div v-else class="mx-table-wrap">
          <table class="mx-table">
            <thead>
              <tr>
                <th>{{ $t('maintenance.table.headers.id') }}</th>
                <th>{{ $t('maintenance.table.headers.date') }}</th>
                <th>{{ $t('maintenance.table.headers.property') }}</th>
                <th>{{ $t('maintenance.table.headers.title') }}</th>
                <th>{{ $t('maintenance.table.headers.priority') }}</th>
                <th>{{ $t('maintenance.table.headers.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="req in maintenances" :key="req.id" class="mx-row">
                <td><span class="cell-id">#{{ req.id }}</span></td>
                <td><span class="cell-muted">{{ formatDate(req.created_at) }}</span></td>
                <td>
                  <span v-if="req.property" class="cell-prop">
                    <span class="prop-dot"></span>{{ req.property.title }}
                  </span>
                  <span v-else class="cell-na">—</span>
                </td>
                <td><span class="cell-title" :title="req.title">{{ req.title }}</span></td>
                <td>
                  <span :class="['prio-chip', `prio-chip--${req.priority}`]">
                    <span class="prio-pip"></span>{{ translatePriority(req.priority) }}
                  </span>
                </td>
                <td>
                  <span :class="['status-chip', `status-chip--${req.status}`]">
                    {{ translateStatus(req.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="meta && meta.last_page > 1" class="mx-pager">
          <button :disabled="meta.current_page === 1" @click="changePage(meta.current_page - 1)" class="pager-arrow">
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="pager-nums">
            <button v-for="p in visiblePages" :key="p" :class="['pager-num', { 'pager-num--active': p === meta.current_page }]" @click="changePage(p)">{{ p }}</button>
          </div>
          <button :disabled="meta.current_page === meta.last_page" @click="changePage(meta.current_page + 1)" class="pager-arrow">
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>

      </div>
    </div>

    <MaintenanceModal :is-visible="showCreateModal" @close="closeCreateModal" @submitted="onMaintenanceSubmitted" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAlerts } from '@/composables/useAlerts';
import MaintenanceModal from '@/components/modals/Maintenance/MaintenanceModal.vue';
import api from '@/services/api';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const { error, success } = useAlerts();
const maintenances = ref<any[]>([]);
const loading = ref(true);
const meta = ref<any>(null);
const showCreateModal = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const priorityFilter = ref('');
const currentPage = ref(1);
let searchTimeout: any = null;

const statusTabs = computed(() => [
  { value: '', label: t('maintenance.tabs.all'), color: '#a0aec0', count: maintenances.value.length },
  { value: 'pending', label: t('maintenance.tabs.pending'), color: '#f59e0b', count: maintenances.value.filter(m => m.status === 'pending').length },
  { value: 'in_progress', label: t('maintenance.tabs.in_progress'), color: '#6366f1', count: maintenances.value.filter(m => m.status === 'in_progress').length },
  { value: 'completed', label: t('maintenance.tabs.completed'), color: '#2ecc71', count: maintenances.value.filter(m => m.status === 'completed').length },
  { value: 'cancelled', label: t('maintenance.tabs.cancelled'), color: '#e74c3c', count: maintenances.value.filter(m => m.status === 'cancelled').length },
]);

const visiblePages = computed(() => {
  if (!meta.value) return [];
  const total = meta.value.last_page, cur = meta.value.current_page;
  const pages: number[] = [];
  for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
  return pages;
});

onMounted(() => fetchMaintenances());

const fetchMaintenances = async () => {
  loading.value = true;
  try {
    const params: any = { page: currentPage.value };
    if (searchQuery.value) params.search = searchQuery.value;
    if (statusFilter.value) params.status = statusFilter.value;
    if (priorityFilter.value) params.priority = priorityFilter.value;
    const response = await api.get('/maintenances', { params });
    const resData = response.data;
    maintenances.value = resData.data ?? (Array.isArray(resData) ? resData : []);
    meta.value = resData.meta ?? { current_page: 1, last_page: 1 };
  } catch {
    error(t('maintenance.alerts.fetchError'), 'Error');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage.value = 1; fetchMaintenances(); }, 500);
};
const changePage = (p: number) => { currentPage.value = p; fetchMaintenances(); };
const openCreateModal = () => { showCreateModal.value = true; };
const closeCreateModal = () => { showCreateModal.value = false; };
const onMaintenanceSubmitted = () => {
  success(t('maintenance.alerts.submitSuccess'), 'Success');
  showCreateModal.value = false;
  currentPage.value = 1;
  fetchMaintenances();
};
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString(locale.value, { dateStyle: 'medium' }) : '—';
const translateStatus = (s: string) => ({ pending: t('maintenance.status.pending'), in_progress: t('maintenance.status.in_progress'), completed: t('maintenance.status.completed'), cancelled: t('maintenance.status.cancelled') }[s?.toLowerCase()] || s);
const translatePriority = (p: string) => ({ low: t('maintenance.priority.low'), medium: t('maintenance.priority.medium'), high: t('maintenance.priority.high'), emergency: t('maintenance.priority.emergency') }[p?.toLowerCase()] || p);
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   MAINTENANCES VIEW
   • padding-top: 65px  →  compensa el navbar fixed (height 65px)
   • NO usa position:fixed en fondos propios (lo gestiona el layout global)
   • Paleta: #1a0e0a / #2e1d17 / #3b2416 + acento #da9c5f
   ══════════════════════════════════════════════════════════════ */

/* ── Página base ─────────────────────────────────────────────── */
.mx-page {
  min-height: calc(100vh - 65px);
  padding-top: 65px;          /* altura del navbar fijo */
  position: relative;
  overflow-x: hidden;
  /* Fondo igual que contracts.css / settings.css */
  background: linear-gradient(135deg, #1a0e0a 0%, #2e1d17 50%, #3b2416 100%);
}

/* Imagen de fondo con blur — igual que el resto de vistas */
.mx-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("https://i.pinimg.com/1200x/e2/d2/b7/e2d2b7877ffb88a68d6b72e5ea0bd965.jpg") center/cover no-repeat;
  opacity: 0.12;
  filter: blur(7px);
  pointer-events: none;
  z-index: 0;
}

/* ── Orbs decorativos ────────────────────────────────────────── */
.mx-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.mx-bg__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.2;
}
.mx-bg__orb--1 {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(218,156,95,0.45), transparent);
  top: -140px; right: -140px;
}
.mx-bg__orb--2 {
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(184,121,31,0.35), transparent);
  bottom: -120px; left: -120px;
}

/* ── Contenedor principal ────────────────────────────────────── */
.mx-shell {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  margin: 0 auto;
  padding: 2.5rem 2rem 4rem;
}

/* ── Header ──────────────────────────────────────────────────── */
.mx-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.mx-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #da9c5f;
  margin-bottom: 0.6rem;
}
.ew-pip {
  display: block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #da9c5f;
  box-shadow: 0 0 8px rgba(218,156,95,0.7);
}
.mx-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  color: #f0e5db;
  line-height: 1.15;
  margin: 0 0 0.4rem;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 15px rgba(218,156,95,0.3), 0 0 30px rgba(218,156,95,0.15);
}
.mx-title em { font-style: italic; color: #da9c5f; font-weight: 500; }
.mx-subtitle { font-size: 0.9rem; color: rgba(240,229,219,0.5); margin: 0; }

.mx-header__right { display: flex; align-items: center; gap: 1.25rem; flex-shrink: 0; }

.mx-counters {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1.2rem;
  background: linear-gradient(135deg, rgba(62,36,24,0.95), rgba(46,29,23,0.95));
  border: 1px solid rgba(218,156,95,0.25);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07);
}
.mx-counter { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.mx-counter__val { font-size: 1.35rem; font-weight: 800; color: #da9c5f; line-height: 1; }
.mx-counter__lbl {
  font-size: 0.63rem; font-weight: 600;
  letter-spacing: 0.09em; text-transform: uppercase;
  color: rgba(240,229,219,0.35);
}
.mx-counter-sep { width: 1px; height: 28px; background: rgba(218,156,95,0.2); }

.btn-gold {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.7rem 1.35rem;
  background: linear-gradient(135deg, #da9c5f, #b8791f);
  color: #1a0e0a;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 4px 14px rgba(218,156,95,0.4);
}
.btn-gold:hover {
  background: linear-gradient(135deg, #e0a96a, #c9851f);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(218,156,95,0.5);
}
.btn-gold--sm { padding: 0.55rem 1.1rem; font-size: 0.82rem; }

/* ── Tabs ────────────────────────────────────────────────────── */
.mx-tabs {
  display: flex;
  gap: 0.2rem;
  padding: 0.25rem;
  background: linear-gradient(135deg, rgba(62,36,24,0.7), rgba(46,29,23,0.7));
  border: 1px solid rgba(218,156,95,0.18);
  border-radius: 12px;
  margin-bottom: 1.25rem;
  overflow-x: auto;
  scrollbar-width: none;
  flex-wrap: wrap;
  backdrop-filter: blur(12px);
}
.mx-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1rem;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: rgba(240,229,219,0.4);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.mx-tab:hover { color: #f0e5db; background: rgba(218,156,95,0.08); }
.mx-tab--active { background: rgba(218,156,95,0.18); color: #da9c5f; font-weight: 700; }
.mx-tab__dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.mx-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px; height: 20px;
  padding: 0 5px;
  background: rgba(255,255,255,0.05);
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(240,229,219,0.4);
}
.mx-tab--active .mx-tab__count { background: rgba(218,156,95,0.2); color: #da9c5f; }

/* ── Toolbar ─────────────────────────────────────────────────── */
.mx-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.mx-search {
  position: relative;
  flex: 1;
  min-width: 240px;
  max-width: 420px;
}
.mx-search__ico {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(240,229,219,0.3);
  pointer-events: none;
}
.mx-search input {
  width: 100%;
  padding: 0.7rem 1rem 0.7rem 2.75rem;
  background: linear-gradient(135deg, rgba(62,36,24,0.8), rgba(46,29,23,0.8));
  border: 1px solid rgba(218,156,95,0.22);
  border-radius: 10px;
  color: #f0e5db;
  font-family: inherit;
  font-size: 0.88rem;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}
.mx-search input::placeholder { color: rgba(240,229,219,0.28); }
.mx-search input:focus {
  outline: none;
  border-color: rgba(218,156,95,0.55);
  background: linear-gradient(135deg, rgba(86,44,29,0.9), rgba(62,36,24,0.9));
  box-shadow: 0 0 0 3px rgba(218,156,95,0.1);
}
.mx-select {
  padding: 0.7rem 1rem;
  min-width: 170px;
  background: linear-gradient(135deg, rgba(62,36,24,0.8), rgba(46,29,23,0.8));
  border: 1px solid rgba(218,156,95,0.22);
  border-radius: 10px;
  color: rgba(240,229,219,0.75);
  font-family: inherit;
  font-size: 0.83rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
}
.mx-select:focus { outline: none; border-color: rgba(218,156,95,0.55); }
.mx-select option { background: #2e1d17; color: #f0e5db; }

/* ── Panel ───────────────────────────────────────────────────── */
.mx-panel {
  background: linear-gradient(135deg, rgba(62,36,24,0.95), rgba(46,29,23,0.95));
  border: 1px solid rgba(218,156,95,0.2);
  border-radius: 18px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
}

/* ── States ──────────────────────────────────────────────────── */
.mx-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 5rem 2rem;
  text-align: center;
}
.mx-spinner {
  width: 38px; height: 38px;
  border-radius: 50%;
  border: 2px solid rgba(218,156,95,0.2);
  border-top-color: #da9c5f;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.mx-empty-icon {
  width: 68px; height: 68px;
  border-radius: 50%;
  background: rgba(218,156,95,0.08);
  border: 1px solid rgba(218,156,95,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #da9c5f;
}
.mx-state h3 { font-size: 1.15rem; font-weight: 700; color: #f0e5db; margin: 0; }
.mx-state p { font-size: 0.85rem; color: rgba(240,229,219,0.4); max-width: 320px; margin: 0; line-height: 1.65; }

/* ── Tabla ───────────────────────────────────────────────────── */
.mx-table-wrap { overflow-x: auto; }
.mx-table { width: 100%; border-collapse: collapse; }
.mx-table thead tr { border-bottom: 1px solid rgba(218,156,95,0.15); }
.mx-table th {
  padding: 0.9rem 1.25rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(240,229,219,0.3);
  text-align: left;
  background: rgba(255,255,255,0.02);
}
.mx-row { border-bottom: 1px solid rgba(218,156,95,0.07); transition: background 0.15s; }
.mx-row:last-child { border-bottom: none; }
.mx-row:hover { background: rgba(218,156,95,0.05); }
.mx-table td {
  padding: 1rem 1.25rem;
  font-size: 0.87rem;
  color: rgba(240,229,219,0.65);
  vertical-align: middle;
}
.cell-id { font-weight: 700; color: rgba(240,229,219,0.3); font-size: 0.8rem; }
.cell-muted { color: rgba(240,229,219,0.45); font-size: 0.82rem; }
.cell-prop { display: inline-flex; align-items: center; gap: 6px; color: #da9c5f; font-weight: 600; }
.prop-dot { width: 5px; height: 5px; border-radius: 50%; background: #da9c5f; flex-shrink: 0; }
.cell-na { color: rgba(240,229,219,0.2); }
.cell-title {
  display: block;
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #f0e5db;
  font-weight: 500;
}

/* Prioridad */
.prio-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}
.prio-pip { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.prio-chip--low    { background: rgba(160,174,192,0.12); color: #a0aec0; }
.prio-chip--low .prio-pip { background: #a0aec0; }
.prio-chip--medium { background: rgba(245,158,11,0.12);  color: #f59e0b; }
.prio-chip--medium .prio-pip { background: #f59e0b; }
.prio-chip--high   { background: rgba(231,76,60,0.12);   color: #e74c3c; }
.prio-chip--high .prio-pip { background: #e74c3c; }
.prio-chip--emergency {
  background: rgba(192,57,43,0.2);
  color: #ffb6b6;
  border: 1px solid rgba(231,76,60,0.3);
}
.prio-chip--emergency .prio-pip { background: #e74c3c; box-shadow: 0 0 6px #e74c3c; }

/* Estado */
.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.85rem;
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}
.status-chip--pending     { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
.status-chip--in_progress { background: rgba(99,102,241,0.12); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.25); }
.status-chip--completed   { background: rgba(46,204,113,0.12); color: #2ecc71; border: 1px solid rgba(46,204,113,0.25); }
.status-chip--cancelled   { background: rgba(160,174,192,0.08); color: #718096; border: 1px solid rgba(160,174,192,0.15); }

/* ── Paginación ──────────────────────────────────────────────── */
.mx-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.2rem;
  border-top: 1px solid rgba(218,156,95,0.12);
}
.pager-arrow {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(218,156,95,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(240,229,219,0.45);
  cursor: pointer;
  transition: all 0.2s;
}
.pager-arrow:not(:disabled):hover {
  background: rgba(218,156,95,0.1);
  color: #da9c5f;
  border-color: rgba(218,156,95,0.4);
}
.pager-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
.pager-nums { display: flex; gap: 0.25rem; }
.pager-num {
  min-width: 32px; height: 32px;
  padding: 0 0.4rem;
  border-radius: 8px;
  background: transparent;
  border: 1px solid rgba(218,156,95,0.15);
  color: rgba(240,229,219,0.4);
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}
.pager-num:hover { background: rgba(218,156,95,0.08); color: #f0e5db; }
.pager-num--active {
  background: linear-gradient(135deg, #da9c5f, #b8791f);
  border-color: #da9c5f;
  color: #1a0e0a;
  font-weight: 700;
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 900px) {
  .mx-shell { padding: 2rem 1.25rem 3rem; }
  .mx-header { flex-direction: column; align-items: flex-start; }
  .mx-header__right { width: 100%; justify-content: space-between; }
}
@media (max-width: 600px) {
  .mx-shell { padding: 1.5rem 1rem 2.5rem; }
  .mx-counters { display: none; }
  .mx-search { max-width: none; }
}
</style>