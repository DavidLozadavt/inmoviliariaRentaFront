<template>
  <div class="admin-shell" :class="themeClass">
    <AlertsContainer />
    <Sidebar
      :is-collapsed="sidebarCollapsed"
      :mobile-open="mobileOpen"
      @toggle="toggleSidebar"
      @close-mobile="mobileOpen = false"
    />

    <div class="admin-main" :style="{ '--sidebar-width': sidebarWidth }">
      <AdminNavbar @toggle-sidebar="toggleMobile" />

      <main class="admin-page">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Sidebar from '../components/Sidebar.vue';
import AdminNavbar from '../components/AdminNavbar.vue';
import AlertsContainer from '../../components/AlertsContainer.vue';
import { useTheme } from '../composables/useTheme';

const { theme } = useTheme();

const sidebarCollapsed = ref(false);
const mobileOpen = ref(false);

const sidebarWidth = computed(() => sidebarCollapsed.value ? '72px' : '260px');
const themeClass = computed(() => `theme-${theme.value}`);

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value;
};
</script>

<style>
/* ================================================================
   ADMIN DESIGN SYSTEM — LIGHT / DARK THEMES
   ================================================================ */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
@import '../styles/admin-modals.css';

/* ──────────── LIGHT THEME ──────────── */
.admin-shell.theme-light {
  --admin-bg: #f4f6f9;
  --admin-surface: #ffffff;
  --admin-surface-elevated: #ffffff;
  --admin-text-primary: #0f172a;
  --admin-text-secondary: #475569;
  --admin-text-muted: #94a3b8;
  --admin-border: #e2e8f0;
  --admin-border-light: #f1f5f9;

  --accent: #6366f1;
  --accent-dark: #4338ca;
  --accent-light: #818cf8;
  --accent-shadow: rgba(99, 102, 241, 0.25);
  --accent-ring: rgba(99, 102, 241, 0.12);
  --accent-bg: rgba(99, 102, 241, 0.06);

  --sidebar-bg: #ffffff;
  --sidebar-border: #e2e8f0;
  --sidebar-text-primary: #0f172a;
  --sidebar-text-secondary: #64748b;
  --sidebar-text-muted: #94a3b8;
  --sidebar-hover: #f8fafc;
  --sidebar-active-bg: rgba(99, 102, 241, 0.08);

  --header-bg: rgba(255, 255, 255, 0.85);
  --header-border: #e2e8f0;
  --header-text-primary: #0f172a;
  --header-text-secondary: #475569;
  --header-text-muted: #94a3b8;
  --header-btn-bg: #f8fafc;
  --header-btn-hover: #f1f5f9;

  --dropdown-bg: #ffffff;
  --dropdown-header-bg: #f8fafc;
  --dropdown-shadow: rgba(0, 0, 0, 0.1);

  --logout-overlay: rgba(255, 255, 255, 0.92);
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #06b6d4;
}

/* ──────────── DARK THEME ──────────── */
.admin-shell.theme-dark {
  --admin-bg: #09090b;
  --admin-surface: #111113;
  --admin-surface-elevated: #1a1a1e;
  --admin-text-primary: #fafafa;
  --admin-text-secondary: #a1a1aa;
  --admin-text-muted: #71717a;
  --admin-border: #27272a;
  --admin-border-light: #1f1f23;

  --accent: #818cf8;
  --accent-dark: #6366f1;
  --accent-light: #a5b4fc;
  --accent-shadow: rgba(129, 140, 248, 0.2);
  --accent-ring: rgba(129, 140, 248, 0.15);
  --accent-bg: rgba(129, 140, 248, 0.08);

  --sidebar-bg: #0c0c0e;
  --sidebar-border: #27272a;
  --sidebar-text-primary: #fafafa;
  --sidebar-text-secondary: #a1a1aa;
  --sidebar-text-muted: #71717a;
  --sidebar-hover: rgba(255, 255, 255, 0.05);
  --sidebar-active-bg: rgba(129, 140, 248, 0.12);

  --header-bg: rgba(9, 9, 11, 0.92);
  --header-border: #27272a;
  --header-text-primary: #fafafa;
  --header-text-secondary: #a1a1aa;
  --header-text-muted: #71717a;
  --header-btn-bg: rgba(255, 255, 255, 0.05);
  --header-btn-hover: rgba(255, 255, 255, 0.08);

  --dropdown-bg: #18181b;
  --dropdown-header-bg: #111113;
  --dropdown-shadow: rgba(0, 0, 0, 0.5);

  --logout-overlay: rgba(9, 9, 11, 0.95);
  --success: #34d399;
  --warning: #fbbf24;
  --danger: #f87171;
  --info: #22d3ee;
}

/* ================================================================
   GLOBAL DARK MODE OVERRIDES
   Catches ALL hardcoded whites/colors from all admin pages.
   Uses !important to override scoped styles.
   ================================================================ */

/* Base page */
.admin-shell.theme-dark .admin-page {
  color: var(--admin-text-primary);
}

/* Page-level wrappers */
.admin-shell.theme-dark .modern-dashboard,
.admin-shell.theme-dark .admin-reports-page,
.admin-shell.theme-dark .admin-payments-page,
.admin-shell.theme-dark .admin-maintenances-page,
.admin-shell.theme-dark .admin-contracts-page,
.admin-shell.theme-dark .admin-properties-page,
.admin-shell.theme-dark .admin-visits-page,
.admin-shell.theme-dark .admin-users-page,
.admin-shell.theme-dark .admin-notifications-page {
  color: var(--admin-text-primary) !important;
}

/* ── SURFACES: everything that was white ── */
.admin-shell.theme-dark .card-box,
.admin-shell.theme-dark .stat-card,
.admin-shell.theme-dark .metric-card,
.admin-shell.theme-dark .stats-card,
.admin-shell.theme-dark .summary-card,
.admin-shell.theme-dark .info-card,
.admin-shell.theme-dark .chart-container,
.admin-shell.theme-dark .chart-card,
.admin-shell.theme-dark .chart-section,
.admin-shell.theme-dark .charts-section,
.admin-shell.theme-dark .chart-wrapper,
.admin-shell.theme-dark .action-card,
.admin-shell.theme-dark .data-card,
.admin-shell.theme-dark .detail-card,
.admin-shell.theme-dark .notification-card,
.admin-shell.theme-dark .empty-state,
.admin-shell.theme-dark .kpi-card,
.admin-shell.theme-dark .quick-action,
.admin-shell.theme-dark .page-header,
.admin-shell.theme-dark .detail-section,
.admin-shell.theme-dark .detail-panel,
.admin-shell.theme-dark .content-panel,
.admin-shell.theme-dark .section-card {
  background: var(--admin-surface) !important;
  border-color: var(--admin-border) !important;
  color: var(--admin-text-primary) !important;
}

/* Metric grids direct children */
.admin-shell.theme-dark .metrics-grid > div,
.admin-shell.theme-dark .stats-grid > div,
.admin-shell.theme-dark .kpi-grid > div,
.admin-shell.theme-dark .overview-grid > div {
  background: var(--admin-surface) !important;
  border-color: var(--admin-border) !important;
}

/* ── FILTER / SEARCH ── */
.admin-shell.theme-dark .filters-bar,
.admin-shell.theme-dark .filters-container,
.admin-shell.theme-dark .filter-bar,
.admin-shell.theme-dark .toolbar,
.admin-shell.theme-dark .search-box,
.admin-shell.theme-dark .search-container,
.admin-shell.theme-dark .activity-search-container {
  background: var(--admin-surface) !important;
  border-color: var(--admin-border) !important;
}

.admin-shell.theme-dark .filter-select,
.admin-shell.theme-dark .filter-btn,
.admin-shell.theme-dark .btn-outline,
.admin-shell.theme-dark .btn-filter,
.admin-shell.theme-dark .export-btn {
  background: var(--admin-surface-elevated) !important;
  border-color: var(--admin-border) !important;
  color: var(--admin-text-secondary) !important;
}

/* ── FORM ELEMENTS ── */
.admin-shell.theme-dark input,
.admin-shell.theme-dark select,
.admin-shell.theme-dark textarea,
.admin-shell.theme-dark .search-input {
  background: var(--admin-surface-elevated) !important;
  border-color: var(--admin-border) !important;
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark input::placeholder,
.admin-shell.theme-dark textarea::placeholder,
.admin-shell.theme-dark .search-input::placeholder {
  color: var(--admin-text-muted) !important;
}

/* ── TABLES ── */
.admin-shell.theme-dark table,
.admin-shell.theme-dark .table-container,
.admin-shell.theme-dark .data-table,
.admin-shell.theme-dark .table-wrapper {
  background: var(--admin-surface) !important;
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark th {
  background: var(--admin-surface-elevated) !important;
  color: var(--admin-text-secondary) !important;
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark td {
  border-color: var(--admin-border) !important;
  color: var(--admin-text-primary) !important;
  background: transparent !important;
}
.admin-shell.theme-dark tr {
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark tr:hover td {
  background: var(--admin-surface-elevated) !important;
}

/* ── HEADINGS ── */
.admin-shell.theme-dark .page-title,
.admin-shell.theme-dark .section-title,
.admin-shell.theme-dark .card-title,
.admin-shell.theme-dark .chart-title,
.admin-shell.theme-dark .modal-title,
.admin-shell.theme-dark h1, .admin-shell.theme-dark h2,
.admin-shell.theme-dark h3, .admin-shell.theme-dark h4,
.admin-shell.theme-dark h5 {
  color: var(--admin-text-primary) !important;
}

/* ── BODY TEXT ── */
.admin-shell.theme-dark .page-subtitle,
.admin-shell.theme-dark .stat-label,
.admin-shell.theme-dark .metric-label,
.admin-shell.theme-dark .text-muted,
.admin-shell.theme-dark .description,
.admin-shell.theme-dark .help-text,
.admin-shell.theme-dark label,
.admin-shell.theme-dark p {
  color: var(--admin-text-secondary) !important;
}

/* ── VALUES ── */
.admin-shell.theme-dark .stat-value,
.admin-shell.theme-dark .metric-value,
.admin-shell.theme-dark .kpi-value,
.admin-shell.theme-dark .stat-number {
  color: var(--admin-text-primary) !important;
}

/* ── CELL CONTENT (tables) ── */
.admin-shell.theme-dark .cell-title,
.admin-shell.theme-dark .cell-main,
.admin-shell.theme-dark .cell-name,
.admin-shell.theme-dark .cell-value {
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .cell-sub,
.admin-shell.theme-dark .cell-meta,
.admin-shell.theme-dark .cell-detail,
.admin-shell.theme-dark .cell-secondary {
  color: var(--admin-text-muted) !important;
}

/* ── DASHBOARD SPECIFIC ── */
.admin-shell.theme-dark .action-list,
.admin-shell.theme-dark .action-item,
.admin-shell.theme-dark .quick-actions,
.admin-shell.theme-dark .recent-activity,
.admin-shell.theme-dark .activity-item,
.admin-shell.theme-dark .tl-item {
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .action-item:hover,
.admin-shell.theme-dark .activity-item:hover,
.admin-shell.theme-dark .tl-item:hover {
  background: var(--admin-surface-elevated) !important;
}
.admin-shell.theme-dark .tl-text {
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .tl-time,
.admin-shell.theme-dark .tl-meta {
  color: var(--admin-text-muted) !important;
}
.admin-shell.theme-dark .welcome-banner,
.admin-shell.theme-dark .greeting-section {
  background: var(--admin-surface) !important;
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark .stat-chart {
  background: var(--admin-border) !important;
}

/* ── MODALS ── */
.admin-shell.theme-dark .modal-content,
.admin-shell.theme-dark .modal-body,
.admin-shell.theme-dark .modal-header,
.admin-shell.theme-dark .modal-footer,
.admin-shell.theme-dark .modal-box,
.admin-shell.theme-dark .detail-modal {
  background: var(--admin-surface) !important;
  border-color: var(--admin-border) !important;
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .modal-overlay {
  background: rgba(0, 0, 0, 0.65) !important;
}

/* ── BUTTONS ── */
.admin-shell.theme-dark .btn-secondary,
.admin-shell.theme-dark .btn-default,
.admin-shell.theme-dark .btn-cancel,
.admin-shell.theme-dark .btn-more {
  background: var(--admin-surface-elevated) !important;
  border-color: var(--admin-border) !important;
  color: var(--admin-text-secondary) !important;
}
.admin-shell.theme-dark .btn-secondary:hover,
.admin-shell.theme-dark .btn-default:hover,
.admin-shell.theme-dark .btn-more:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  color: var(--admin-text-primary) !important;
}

/* ── PAGINATION ── */
.admin-shell.theme-dark .pagination,
.admin-shell.theme-dark .pagination-info,
.admin-shell.theme-dark .page-info {
  color: var(--admin-text-secondary) !important;
}
.admin-shell.theme-dark .pagination button,
.admin-shell.theme-dark .page-btn {
  background: var(--admin-surface-elevated) !important;
  border-color: var(--admin-border) !important;
  color: var(--admin-text-secondary) !important;
}

/* ── NOTIFICATION DROPDOWN ── */
.admin-shell.theme-dark .dropdown-panel {
  background: var(--dropdown-bg) !important;
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark .dropdown-header {
  background: var(--dropdown-header-bg) !important;
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark .notification-text,
.admin-shell.theme-dark .dropdown-title,
.admin-shell.theme-dark .empty-title,
.admin-shell.theme-dark .notif-title {
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .notification-time,
.admin-shell.theme-dark .empty-description,
.admin-shell.theme-dark .notif-message {
  color: var(--admin-text-muted) !important;
}
.admin-shell.theme-dark .notification-item:hover {
  background: var(--header-btn-hover) !important;
}
.admin-shell.theme-dark .notification-item.unread {
  background: rgba(129, 140, 248, 0.06) !important;
}
.admin-shell.theme-dark .dropdown-footer {
  background: var(--dropdown-header-bg) !important;
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark .view-all-btn {
  color: var(--accent) !important;
}
.admin-shell.theme-dark .view-all-btn:hover {
  background: var(--header-btn-hover) !important;
}
.admin-shell.theme-dark .mark-all-btn {
  border-color: var(--admin-border) !important;
  color: var(--admin-text-muted) !important;
}
.admin-shell.theme-dark .mark-all-btn:hover {
  background: var(--header-btn-hover) !important;
  color: var(--accent) !important;
  border-color: var(--accent) !important;
}

/* ── NOTIFICATION PAGE ── */
.admin-shell.theme-dark .notif-actions .action-btn {
  background: var(--admin-surface-elevated) !important;
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark .notif-meta {
  color: var(--admin-text-muted) !important;
}

/* ── ICON WRAPPERS ── */
.admin-shell.theme-dark .icon-wrapper {
  box-shadow: 0 4px 12px var(--accent-shadow) !important;
}

/* ── DIVIDERS ── */
.admin-shell.theme-dark hr,
.admin-shell.theme-dark .divider,
.admin-shell.theme-dark .separator {
  border-color: var(--admin-border) !important;
  background: var(--admin-border) !important;
}

/* ── LOADING ── */
.admin-shell.theme-dark .loading-container,
.admin-shell.theme-dark .loading-state {
  color: var(--admin-text-muted) !important;
}
.admin-shell.theme-dark .spinner {
  border-color: var(--admin-border) !important;
  border-top-color: var(--accent) !important;
}

/* ── EMPTY STATE ── */
.admin-shell.theme-dark .empty-icon-wrapper {
  background: var(--admin-surface-elevated) !important;
  color: var(--admin-text-muted) !important;
}

/* ── CHARTS ── */
.admin-shell.theme-dark canvas {
  filter: brightness(0.9);
}

/* ── SCROLLBARS ── */
.admin-shell.theme-dark ::-webkit-scrollbar-track {
  background: var(--admin-bg) !important;
}
.admin-shell.theme-dark ::-webkit-scrollbar-thumb {
  background: var(--admin-border) !important;
}

/* ── CATCH-ALL for inline white backgrounds ── */
.admin-shell.theme-dark [style*="background: #fff"],
.admin-shell.theme-dark [style*="background: white"],
.admin-shell.theme-dark [style*="background:#fff"],
.admin-shell.theme-dark [style*="background-color: #fff"],
.admin-shell.theme-dark [style*="background-color: white"] {
  background: var(--admin-surface) !important;
}

/* ================================================================
   TABLE ACTION BUTTONS (applies to ALL admin tables)
   ================================================================ */
.admin-shell.theme-dark .btn-action {
  background: var(--admin-surface-elevated) !important;
  border-color: var(--admin-border) !important;
  color: var(--admin-text-secondary) !important;
}
.admin-shell.theme-dark .btn-action:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: var(--admin-text-primary) !important;
  border-color: var(--accent) !important;
}
.admin-shell.theme-dark .btn-action .fa-eye,
.admin-shell.theme-dark .btn-action .fa-edit,
.admin-shell.theme-dark .btn-action .fa-pen,
.admin-shell.theme-dark .btn-action .fa-trash,
.admin-shell.theme-dark .btn-action .fa-trash-alt,
.admin-shell.theme-dark .btn-action .fa-check,
.admin-shell.theme-dark .btn-action .fa-times,
.admin-shell.theme-dark .btn-action .fa-download,
.admin-shell.theme-dark .btn-action svg {
  color: inherit !important;
}
.admin-shell.theme-dark .action-buttons {
  color: var(--admin-text-secondary) !important;
}

/* ================================================================
   PROPERTIES TABLE specific
   ================================================================ */
.admin-shell.theme-dark .properties-table {
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark .properties-table thead {
  background: var(--admin-surface-elevated) !important;
}
.admin-shell.theme-dark .properties-table th {
  background: var(--admin-surface-elevated) !important;
  color: var(--admin-text-muted) !important;
  border-bottom-color: var(--admin-border) !important;
}
.admin-shell.theme-dark .properties-table th.sortable:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .properties-table td {
  background: transparent !important;
  border-bottom-color: var(--admin-border) !important;
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .property-row:hover td {
  background: var(--admin-surface-elevated) !important;
}
.admin-shell.theme-dark .sort-icon {
  color: var(--admin-text-muted) !important;
}
.admin-shell.theme-dark .sort-icon.active {
  color: var(--accent) !important;
}

/* ID badge */
.admin-shell.theme-dark .id-badge {
  background: var(--admin-surface-elevated) !important;
  color: var(--admin-text-muted) !important;
}

/* Avatar image border */
.admin-shell.theme-dark .avatar-img {
  border-color: var(--admin-border) !important;
}

/* Property name / info columns */
.admin-shell.theme-dark .prop-name,
.admin-shell.theme-dark .property-name,
.admin-shell.theme-dark .prop-title {
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .prop-location,
.admin-shell.theme-dark .prop-address,
.admin-shell.theme-dark .prop-city {
  color: var(--admin-text-muted) !important;
}

/* ================================================================
   RANKING LIST (Visits page and others)
   ================================================================ */
.admin-shell.theme-dark .ranking-list {
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .ranking-item {
  background: var(--admin-surface-elevated) !important;
  border-color: var(--admin-border) !important;
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .ranking-item:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: var(--accent) !important;
}
.admin-shell.theme-dark .rank-number {
  color: var(--admin-text-muted) !important;
}
.admin-shell.theme-dark .rank-number.top-3 {
  color: var(--warning) !important;
}
.admin-shell.theme-dark .prop-details .prop-title,
.admin-shell.theme-dark .ranking-item .prop-title {
  color: var(--admin-text-primary) !important;
}
.admin-shell.theme-dark .prop-details .prop-city,
.admin-shell.theme-dark .ranking-item .prop-city {
  color: var(--admin-text-muted) !important;
}

/* Visit / City count badges */
.admin-shell.theme-dark .view-count {
  background: rgba(59, 130, 246, 0.12) !important;
  color: #93bbfd !important;
  border-color: rgba(59, 130, 246, 0.25) !important;
}
.admin-shell.theme-dark .city-count {
  background: rgba(79, 70, 229, 0.12) !important;
  color: #a5b4fc !important;
  border-color: rgba(79, 70, 229, 0.25) !important;
}

/* Loading / empty states in small panels */
.admin-shell.theme-dark .loading-state-small,
.admin-shell.theme-dark .empty-state-small {
  color: var(--admin-text-muted) !important;
}

/* ================================================================
   GENERIC table overrides (catches ALL remaining tables)
   ================================================================ */
.admin-shell.theme-dark thead {
  background: var(--admin-surface-elevated) !important;
}
.admin-shell.theme-dark tbody {
  background: transparent !important;
}
.admin-shell.theme-dark table thead th {
  background: var(--admin-surface-elevated) !important;
  color: var(--admin-text-muted) !important;
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark table tbody td {
  background: transparent !important;
  color: var(--admin-text-primary) !important;
  border-color: var(--admin-border) !important;
}
.admin-shell.theme-dark table tbody tr:hover td {
  background: var(--admin-surface-elevated) !important;
}

/* ================================================================
   GENERIC hover backgrounds that leak white
   ================================================================ */
.admin-shell.theme-dark .hover-bg:hover,
.admin-shell.theme-dark [class*="-row"]:hover td,
.admin-shell.theme-dark [class*="-row"]:hover {
  background: var(--admin-surface-elevated) !important;
}
</style>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: var(--admin-bg);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  transition: background 0.3s ease;
}

.admin-main {
  flex: 1;
  margin-left: var(--sidebar-width);
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.admin-page {
  flex: 1;
  padding: 1.5rem;
  margin-top: 64px;
  animation: pageIn 0.3s ease;
}

@keyframes pageIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1024px) {
  .admin-main {
    margin-left: 0 !important;
  }
}

@media (max-width: 768px) {
  .admin-page {
    padding: 1rem;
  }
}
</style>