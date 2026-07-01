<template>
  <aside class="admin-sidebar" :class="{ collapsed: isCollapsed, 'mobile-open': mobileOpen }">
    <!-- Overlay for mobile -->
    <div v-if="mobileOpen" class="sidebar-overlay" @click="$emit('closeMobile')"></div>

    <div class="sidebar-inner">
      <!-- Logo -->
      <div class="sidebar-brand">
        <div class="brand-logo">
          <font-awesome-icon :icon="['fas', 'building']" />
        </div>
        <transition name="slide-text">
          <div v-if="!isCollapsed" class="brand-text">
            <span class="brand-name">RentUs</span>
            <span class="brand-label">Admin</span>
          </div>
        </transition>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-menu">
        <div class="menu-group">
          <span v-if="!isCollapsed" class="menu-group-label">General</span>
          <router-link to="/admin/dashboard" class="menu-item" :class="{ active: isActive('/admin/dashboard') }">
            <span class="menu-icon"><font-awesome-icon :icon="['fas', 'chart-pie']" /></span>
            <span v-if="!isCollapsed" class="menu-label">Dashboard</span>
          </router-link>
        </div>

        <div class="menu-group">
          <span v-if="!isCollapsed" class="menu-group-label">Gestión</span>
          <router-link
            v-for="item in managementItems"
            :key="item.path"
            :to="item.path"
            class="menu-item"
            :class="{ active: isActive(item.path) }"
          >
            <span class="menu-icon"><font-awesome-icon :icon="['fas', item.icon]" /></span>
            <span v-if="!isCollapsed" class="menu-label">{{ item.label }}</span>
          </router-link>
        </div>

        <div class="menu-group">
          <span v-if="!isCollapsed" class="menu-group-label">Sistema</span>
          <router-link
            v-for="item in systemItems"
            :key="item.path"
            :to="item.path"
            class="menu-item"
            :class="{ active: isActive(item.path) }"
          >
            <span class="menu-icon"><font-awesome-icon :icon="['fas', item.icon]" /></span>
            <span v-if="!isCollapsed" class="menu-label">{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button class="collapse-toggle" @click="$emit('toggle')" :title="isCollapsed ? 'Expandir' : 'Colapsar'">
          <font-awesome-icon :icon="['fas', isCollapsed ? 'chevron-right' : 'chevron-left']" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

defineProps<{
  isCollapsed: boolean;
  mobileOpen: boolean;
}>();

defineEmits<{
  toggle: [];
  closeMobile: [];
}>();

const route = useRoute();

const managementItems = [
  { path: '/admin/users', label: 'Usuarios', icon: 'users' },
  { path: '/admin/properties', label: 'Propiedades', icon: 'building' },
  { path: '/admin/contracts', label: 'Contratos', icon: 'file-contract' },
  { path: '/admin/payments', label: 'Pagos', icon: 'credit-card' },
  { path: '/admin/maintenances', label: 'Mantenimiento', icon: 'tools' },
  { path: '/admin/visits', label: 'Visitas', icon: 'calendar-check' },
];

const systemItems = [
  { path: '/admin/reports', label: 'Reportes', icon: 'flag' },
  { path: '/admin/notifications', label: 'Notificaciones', icon: 'bell' },
  { path: '/admin/lyra',          label: 'Lyra AI',        icon: 'robot'    },
];

const isActive = (path: string) => route.path.startsWith(path);


</script>

<style scoped>
.admin-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 260px;
  z-index: 200;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-sidebar.collapsed {
  width: 72px;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: -1;
}

.sidebar-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  overflow: hidden;
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--sidebar-border);
  min-height: 64px;
}

.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px var(--accent-shadow);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0;
  white-space: nowrap;
  overflow: hidden;
}

.brand-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--sidebar-text-primary);
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.brand-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Menu */
.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.75rem 0;
}

.sidebar-menu::-webkit-scrollbar { width: 3px; }
.sidebar-menu::-webkit-scrollbar-thumb { background: var(--sidebar-border); border-radius: 3px; }

.menu-group {
  margin-bottom: 0.5rem;
}

.menu-group-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--sidebar-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 0.75rem 1.25rem 0.4rem;
  display: block;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  margin: 0.15rem 0.5rem;
  border-radius: 10px;
  color: var(--sidebar-text-secondary);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.menu-item:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text-primary);
}

.menu-item.active {
  background: var(--sidebar-active-bg);
  color: var(--accent);
  font-weight: 600;
}

.menu-item.active .menu-icon {
  color: var(--accent);
}

.menu-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
  transition: color 0.2s;
}

.menu-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Footer */
.sidebar-footer {
  padding: 0.75rem;
  border-top: 1px solid var(--sidebar-border);
}

.collapse-toggle {
  width: 100%;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--sidebar-border);
  background: var(--sidebar-hover);
  color: var(--sidebar-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.collapse-toggle:hover {
  background: var(--sidebar-active-bg);
  color: var(--accent);
  border-color: var(--accent);
}

/* Transitions */
.slide-text-enter-active, .slide-text-leave-active {
  transition: all 0.2s ease;
}
.slide-text-enter-from, .slide-text-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

/* Responsive */
@media (max-width: 1024px) {
  .admin-sidebar {
    transform: translateX(-100%);
    width: 260px !important;
  }
  .admin-sidebar.mobile-open {
    transform: translateX(0);
  }
  .admin-sidebar.collapsed {
    width: 260px !important;
  }
}
</style>
