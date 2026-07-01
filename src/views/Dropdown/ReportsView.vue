<template>
  <div class="rv-page">
    <div class="rv-bg" aria-hidden="true">
      <div class="rv-bg__orb rv-bg__orb--1"></div>
      <div class="rv-bg__orb rv-bg__orb--2"></div>
    </div>

    <div class="rv-shell">

      <!-- ── Header ── -->
      <header class="rv-header">
        <div class="rv-header__left">
          <span class="rv-eyebrow">{{ $t('reports.eyebrow') }}</span>
          <h1 class="rv-title" v-html="$t('reports.title')"></h1>
          <p class="rv-subtitle">{{ $t('reports.subtitle') }}</p>
        </div>
        <button class="btn-gold" @click="openCreateModal">
          <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          {{ $t('reports.actions.new') }}
        </button>
      </header>

      <!-- ── Panel ── -->
      <div class="rv-panel">

        <!-- Toolbar -->
        <div class="rv-toolbar">
          <div class="rv-search">
            <svg viewBox="0 0 20 20" fill="none" width="14" height="14" class="rv-search__ico">
              <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
              <path d="M15 15l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input v-model="searchQuery" type="text" :placeholder="$t('reports.searchPlaceholder')" @input="handleSearch" />
          </div>
          <select v-model="statusFilter" class="rv-select" @change="fetchReports">
            <option value="">{{ $t('reports.filters.all') }}</option>
            <option value="pending">{{ $t('reports.status.pending') }}</option>
            <option value="reviewed">{{ $t('reports.status.reviewed') }}</option>
            <option value="resolved">{{ $t('reports.status.resolved') }}</option>
            <option value="dismissed">{{ $t('reports.status.dismissed') }}</option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="rv-state">
          <div class="rv-spinner"></div>
          <p>{{ $t('reports.states.loading') }}</p>
        </div>

        <!-- Empty -->
        <div v-else-if="reports.length === 0" class="rv-state">
          <div class="rv-empty-icon">
            <svg viewBox="0 0 48 48" fill="none" width="26" height="26">
              <path d="M24 10l-4 4-4-4m4 28l-4-4-4 4m20-14h10m-10 6h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </div>
          <h3>{{ $t('reports.states.empty.title') }}</h3>
          <p>{{ $t('reports.states.empty.description') }}</p>
          <button class="btn-gold btn-gold--sm" @click="openCreateModal" style="margin-top:1rem">
            <svg viewBox="0 0 16 16" fill="none" width="12" height="12"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            {{ $t('reports.actions.new') }}
          </button>
        </div>

        <!-- Table -->
        <div v-else class="rv-table-wrap">
          <table class="rv-table">
            <thead>
              <tr>
                <th>{{ $t('reports.table.headers.id') }}</th>
                <th>{{ $t('reports.table.headers.date') }}</th>
                <th>{{ $t('reports.table.headers.type') }}</th>
                <th>{{ $t('reports.table.headers.detail') }}</th>
                <th>{{ $t('reports.table.headers.status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="req in reports" :key="req.id" class="rv-row">
                <td><span class="cell-id">#{{ req.id }}</span></td>
                <td><span class="cell-muted">{{ formatDate(req.created_at) }}</span></td>
                <td>
                  <span class="report-type">
                    <span class="type-dot" :style="{ background: getTypeColor(req.type) }"></span>
                    {{ translateType(req.type) }}
                  </span>
                </td>
                <td>
                  <span class="cell-desc" :title="req.description">{{ req.description }}</span>
                </td>
                <td>
                  <span :class="['rv-status', `rv-status--${req.status}`]">
                    {{ translateStatus(req.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="meta && meta.last_page > 1" class="rv-pager">
          <button :disabled="meta.current_page === 1" @click="changePage(meta.current_page - 1)" class="pager-arrow">
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ $t('reports.pagination.prev') }}
          </button>
          <span class="pager-info">{{ $t('reports.pagination.info', { page: meta.current_page, total: meta.last_page }) }}</span>
          <button :disabled="meta.current_page === meta.last_page" @click="changePage(meta.current_page + 1)" class="pager-arrow">
            {{ $t('reports.pagination.next') }}
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>

      </div>
    </div>

    <!-- ── Modal Crear Reporte ── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showCreateModal" class="rv-modal-backdrop" @click.self="closeCreateModal">
          <div class="rv-modal">
            <header class="rv-modal__header">
              <div class="rv-modal__title-group">
                <span class="rv-modal__eyebrow">{{ $t('reports.modals.create.eyebrow') }}</span>
                <h3 class="rv-modal__title">{{ $t('reports.modals.create.title') }}</h3>
              </div>
              <button class="rv-modal__close" @click="closeCreateModal" aria-label="Cerrar">
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </button>
            </header>

            <div class="rv-modal__body">

              <div class="form-group">
                <label>{{ $t('reports.modals.create.fields.type') }}</label>
                <select v-model="newReport.type" class="form-select">
                  <option value="property">🏠 {{ $t('reports.type.property') }}</option>
                  <option value="user">👤 {{ $t('reports.type.user') }}</option>
                  <option value="review">⭐ {{ $t('reports.type.review') }}</option>
                  <option value="other">🔖 {{ $t('reports.type.other') }}</option>
                </select>
              </div>

              <div class="form-group" v-if="newReport.type === 'property'">
                <label>{{ $t('reports.modals.create.fields.propertyId') }} <span class="form-optional">{{ $t('reports.modals.create.fields.optional') }}</span></label>
                <input v-model="newReport.property_id" type="number" class="form-input" :placeholder="$t('reports.modals.create.fields.propertyIdPlaceholder')" />
              </div>

              <div class="form-group" v-if="newReport.type === 'user'">
                <label>{{ $t('reports.modals.create.fields.userId') }} <span class="form-optional">{{ $t('reports.modals.create.fields.optional') }}</span></label>
                <input v-model="newReport.reported_user_id" type="number" class="form-input" :placeholder="$t('reports.modals.create.fields.userIdPlaceholder')" />
              </div>

              <div class="form-group">
                <label>{{ $t('reports.modals.create.fields.description') }}</label>
                <textarea
                  v-model="newReport.description"
                  rows="4"
                  class="form-input form-textarea"
                  :placeholder="$t('reports.modals.create.fields.descriptionPlaceholder')"
                ></textarea>
                <span class="form-char">{{ newReport.description.length }} {{ $t('reports.modals.create.fields.charCount') }}</span>
              </div>

            </div>

            <footer class="rv-modal__footer">
              <button class="btn-outline" @click="closeCreateModal">{{ $t('reports.actions.cancel') }}</button>
              <button class="btn-gold" @click="submitReport" :disabled="!isReportValid">
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                  <path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ $t('reports.actions.send') }}
              </button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAlerts } from '@/composables/useAlerts';
import api from '@/services/api';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const { error, success } = useAlerts();

const reports = ref<any[]>([]);
const loading = ref(true);
const meta = ref<any>(null);
const showCreateModal = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
let searchTimeout: any = null;

const newReport = ref({
  type: 'property',
  description: '',
  property_id: null as number | null,
  reported_user_id: null as number | null
});

onMounted(() => fetchReports());

const fetchReports = async () => {
  loading.value = true;
  try {
    const params: any = { page: currentPage.value };
    if (searchQuery.value) params.search = searchQuery.value;
    if (statusFilter.value) params.status = statusFilter.value;
    const response = await api.get('/reports', { params });
    const resData = response.data;
    reports.value = resData.data ?? (Array.isArray(resData) ? resData : []);
    meta.value = resData.meta ?? { current_page: 1, last_page: 1 };
  } catch (err: any) {
    error(t('reports.alerts.fetchError'), 'Error');
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { currentPage.value = 1; fetchReports(); }, 500);
};
const changePage = (p: number) => { currentPage.value = p; fetchReports(); };

const openCreateModal = () => {
  newReport.value = { type: 'property', description: '', property_id: null, reported_user_id: null };
  showCreateModal.value = true;
};
const closeCreateModal = () => { showCreateModal.value = false; };

const isReportValid = computed(() => newReport.value.description.trim().length > 0);

const submitReport = async () => {
  if (!isReportValid.value) return;
  try {
    const payload: any = { ...newReport.value };
    if (payload.type !== 'property') delete payload.property_id;
    if (payload.type !== 'user') delete payload.reported_user_id;
    await api.post('/reports', payload);
    success(t('reports.alerts.submitSuccess'), 'Success');
    closeCreateModal();
    currentPage.value = 1;
    fetchReports();
  } catch {
    error(t('reports.alerts.submitError'));
  }
};

const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString(locale.value, { dateStyle: 'medium' }) : '—';

const translateStatus = (s: string) => {
  const map: Record<string, string> = {
    pending: t('reports.status.pending'),
    reviewed: t('reports.status.reviewed'),
    resolved: t('reports.status.resolved'),
    dismissed: t('reports.status.dismissed')
  };
  return map[s?.toLowerCase()] || s;
};

const translateType = (type: string) => {
  const map: Record<string, string> = {
    property: t('reports.type.property'),
    user: t('reports.type.user'),
    review: t('reports.type.review'),
    other: t('reports.type.other')
  };
  return map[type?.toLowerCase()] || type;
};
const getTypeColor = (t: string) => ({ property: '#da9c5f', user: '#a5b4fc', review: '#f59e0b', other: '#94a3b8' }[t?.toLowerCase()] || '#94a3b8');
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   REPORTS VIEW  — Mis Reportes y Quejas
   • padding-top: 65px  →  navbar fixed height
   • Paleta: #1a0e0a / #2e1d17 / #3b2416 + #da9c5f
   ══════════════════════════════════════════════════════════════ */
.rv-page {
  min-height: calc(100vh - 65px);
  padding-top: 65px;
  position: relative;
  overflow-x: hidden;
  background: linear-gradient(135deg, #1a0e0a 0%, #2e1d17 50%, #3b2416 100%);
}
.rv-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("https://i.pinimg.com/1200x/e2/d2/b7/e2d2b7877ffb88a68d6b72e5ea0bd965.jpg") center/cover no-repeat;
  opacity: 0.12;
  filter: blur(7px);
  pointer-events: none;
  z-index: 0;
}

/* Orbs */
.rv-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
.rv-bg__orb { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.18; }
.rv-bg__orb--1 { width: 440px; height: 440px; background: radial-gradient(circle, rgba(218,156,95,0.45), transparent); top: -160px; right: -160px; }
.rv-bg__orb--2 { width: 340px; height: 340px; background: radial-gradient(circle, rgba(231,76,60,0.25), transparent); bottom: -100px; left: -100px; }

/* Shell */
.rv-shell {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 2rem 4rem;
}

/* Header */
.rv-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.rv-eyebrow {
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
.ew-pip { display: block; width: 6px; height: 6px; border-radius: 50%; background: #da9c5f; box-shadow: 0 0 8px rgba(218,156,95,0.7); }
.rv-title {
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  font-weight: 800;
  color: #f0e5db;
  line-height: 1.15;
  margin: 0 0 0.4rem;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 15px rgba(218,156,95,0.3), 0 0 30px rgba(218,156,95,0.15);
}
.rv-title em { font-style: italic; color: #da9c5f; font-weight: 500; }
.rv-subtitle { font-size: 0.9rem; color: rgba(240,229,219,0.5); margin: 0; }

/* Buttons */
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
  flex-shrink: 0;
}
.btn-gold:hover:not(:disabled) {
  background: linear-gradient(135deg, #e0a96a, #c9851f);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(218,156,95,0.5);
}
.btn-gold:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.btn-gold--sm { padding: 0.55rem 1.1rem; font-size: 0.82rem; }

.btn-outline {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.35rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(218,156,95,0.3);
  border-radius: 10px;
  color: rgba(240,229,219,0.65);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-outline:hover { background: rgba(218,156,95,0.08); color: #f0e5db; border-color: rgba(218,156,95,0.5); }

/* Panel */
.rv-panel {
  background: linear-gradient(135deg, rgba(62,36,24,0.95), rgba(46,29,23,0.95));
  border: 1px solid rgba(218,156,95,0.2);
  border-radius: 18px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
}

/* Toolbar */
.rv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid rgba(218,156,95,0.12);
  flex-wrap: wrap;
}
.rv-search { position: relative; flex: 1; min-width: 220px; max-width: 380px; }
.rv-search__ico { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: rgba(240,229,219,0.3); pointer-events: none; }
.rv-search input {
  width: 100%;
  padding: 0.65rem 0.9rem 0.65rem 2.5rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(218,156,95,0.2);
  border-radius: 9px;
  color: #f0e5db;
  font-family: inherit;
  font-size: 0.86rem;
  transition: all 0.2s;
}
.rv-search input::placeholder { color: rgba(240,229,219,0.28); }
.rv-search input:focus { outline: none; border-color: rgba(218,156,95,0.5); background: rgba(255,255,255,0.07); box-shadow: 0 0 0 3px rgba(218,156,95,0.08); }
.rv-select {
  padding: 0.65rem 0.9rem;
  min-width: 170px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(218,156,95,0.2);
  border-radius: 9px;
  color: rgba(240,229,219,0.7);
  font-family: inherit;
  font-size: 0.83rem;
  cursor: pointer;
}
.rv-select:focus { outline: none; border-color: rgba(218,156,95,0.5); }
.rv-select option { background: #2e1d17; color: #f0e5db; }

/* States */
.rv-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem 2rem; text-align: center; }
.rv-spinner { width: 38px; height: 38px; border-radius: 50%; border: 2px solid rgba(218,156,95,0.2); border-top-color: #da9c5f; animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.rv-empty-icon { width: 68px; height: 68px; border-radius: 50%; background: rgba(218,156,95,0.08); border: 1px solid rgba(218,156,95,0.25); display: flex; align-items: center; justify-content: center; color: #da9c5f; }
.rv-state h3 { font-size: 1.15rem; font-weight: 700; color: #f0e5db; margin: 0; }
.rv-state p { font-size: 0.85rem; color: rgba(240,229,219,0.4); max-width: 340px; margin: 0; line-height: 1.65; }

/* Table */
.rv-table-wrap { overflow-x: auto; }
.rv-table { width: 100%; border-collapse: collapse; }
.rv-table thead tr { border-bottom: 1px solid rgba(218,156,95,0.15); }
.rv-table th { padding: 0.85rem 1.25rem; font-size: 0.67rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(240,229,219,0.3); text-align: left; background: rgba(255,255,255,0.02); }
.rv-row { border-bottom: 1px solid rgba(218,156,95,0.07); transition: background 0.15s; }
.rv-row:last-child { border-bottom: none; }
.rv-row:hover { background: rgba(218,156,95,0.04); }
.rv-table td { padding: 1rem 1.25rem; font-size: 0.87rem; color: rgba(240,229,219,0.65); vertical-align: middle; }
.cell-id { font-weight: 700; color: rgba(240,229,219,0.3); font-size: 0.8rem; }
.cell-muted { color: rgba(240,229,219,0.45); font-size: 0.82rem; }
.report-type { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: rgba(240,229,219,0.7); }
.type-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.cell-desc { display: block; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: rgba(240,229,219,0.6); font-size: 0.84rem; }

/* Status */
.rv-status { display: inline-flex; align-items: center; padding: 0.22rem 0.8rem; border-radius: 100px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; }
.rv-status--pending   { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
.rv-status--reviewed  { background: rgba(99,102,241,0.12); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.25); }
.rv-status--resolved  { background: rgba(46,204,113,0.12); color: #2ecc71; border: 1px solid rgba(46,204,113,0.25); }
.rv-status--dismissed { background: rgba(160,174,192,0.08); color: #718096; border: 1px solid rgba(160,174,192,0.15); }

/* Pager */
.rv-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(218,156,95,0.1);
}
.pager-arrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(218,156,95,0.2);
  border-radius: 8px;
  color: rgba(240,229,219,0.45);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.pager-arrow:not(:disabled):hover { background: rgba(218,156,95,0.1); color: #da9c5f; border-color: rgba(218,156,95,0.4); }
.pager-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
.pager-info { font-size: 0.82rem; color: rgba(240,229,219,0.3); }

/* ── Modal ───────────────────────────────────────────────────── */
.rv-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10,6,5,0.88);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1.5rem;
}
.rv-modal {
  background: linear-gradient(135deg, rgba(62,36,24,0.99), rgba(46,29,23,0.99));
  border: 1px solid rgba(218,156,95,0.3);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07);
  overflow: hidden;
  animation: modal-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes modal-pop { 0% { transform: scale(0.94); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

.rv-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.4rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(218,156,95,0.15);
}
.rv-modal__eyebrow {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(218,156,95,0.6);
  margin-bottom: 0.25rem;
}
.rv-modal__title { font-size: 1.15rem; font-weight: 800; color: #da9c5f; margin: 0; text-shadow: 0 2px 8px rgba(218,156,95,0.3); }
.rv-modal__close {
  width: 32px; height: 32px;
  border-radius: 9px;
  background: rgba(231,76,60,0.1);
  border: 1px solid rgba(231,76,60,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e74c3c;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.rv-modal__close:hover { background: rgba(231,76,60,0.22); transform: rotate(90deg); }

.rv-modal__body { padding: 1.4rem 1.5rem; }

.form-group { margin-bottom: 1.2rem; }
.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(240,229,219,0.6);
  margin-bottom: 0.45rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}
.form-optional { text-transform: none; font-weight: 400; color: rgba(240,229,219,0.35); font-size: 0.75rem; letter-spacing: 0; }
.form-input, .form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(218,156,95,0.22);
  border-radius: 10px;
  color: #f0e5db;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.form-input::placeholder { color: rgba(240,229,219,0.3); }
.form-input:focus, .form-select:focus {
  outline: none;
  border-color: rgba(218,156,95,0.55);
  background: rgba(255,255,255,0.09);
  box-shadow: 0 0 0 3px rgba(218,156,95,0.1);
}
.form-select { cursor: pointer; }
.form-select option { background: #2e1d17; color: #f0e5db; }
.form-textarea { resize: vertical; min-height: 110px; line-height: 1.6; }
.form-char { display: block; text-align: right; font-size: 0.72rem; color: rgba(240,229,219,0.28); margin-top: 0.3rem; }

.rv-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.85rem;
  padding: 1rem 1.5rem 1.4rem;
  border-top: 1px solid rgba(218,156,95,0.12);
  background: rgba(255,255,255,0.02);
}

/* Modal transition */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 768px) {
  .rv-shell { padding: 2rem 1.25rem 3rem; }
  .rv-header { flex-direction: column; align-items: flex-start; }
  .rv-search { max-width: none; }
}
@media (max-width: 600px) {
  .rv-shell { padding: 1.5rem 1rem 2.5rem; }
  .rv-toolbar { flex-direction: column; align-items: stretch; }
  .rv-select { width: 100%; }
}
</style>