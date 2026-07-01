<template>
  <header class="admin-header">
    <div class="header-inner">
      <!-- Left -->
      <div class="header-left">
        <button class="hamburger-btn" @click="$emit('toggleSidebar')">
          <font-awesome-icon :icon="['fas', 'bars']" />
        </button>
        <div class="breadcrumb-nav">
          <span class="bc-root">Admin</span>
          <font-awesome-icon :icon="['fas', 'chevron-right']" class="bc-sep" />
          <span class="bc-current">{{ currentPageTitle }}</span>
        </div>
      </div>

      <!-- Right -->
      <div class="header-right">
        <!-- Search -->
        <div class="header-search">
          <font-awesome-icon :icon="['fas', 'search']" class="search-ico" />
          <input type="text" v-model="searchQuery" placeholder="Buscar..." @keyup.enter="handleSearch" />
        </div>

        <!-- Theme Toggle -->
        <button class="icon-circle" @click="toggleTheme" :title="isDark ? 'Modo claro' : 'Modo oscuro'">
          <font-awesome-icon :icon="['fas', isDark ? 'sun' : 'moon']" />
        </button>

        <!-- Notifications -->
        <NotificationsDropdown />

        <!-- User Menu -->
        <div class="user-pill" ref="userMenuRef" @click="showUserMenu = !showUserMenu">
          <div class="user-avatar">
            <img v-if="currentUser?.photo" :src="currentUser.photo" :alt="currentUser?.name" />
            <span v-else>{{ userInitials }}</span>
          </div>
          <div class="user-meta">
            <span class="user-name-text">{{ currentUser?.name || 'Admin' }}</span>
            <span class="user-role-text">{{ userRoleLabel }}</span>
          </div>
          <font-awesome-icon :icon="['fas', 'chevron-down']" class="user-caret" />
        </div>

        <!-- User dropdown -->
        <transition name="pop">
          <div v-if="showUserMenu" class="user-dropdown-menu">
            <div class="udm-header">
              <p class="udm-name">{{ currentUser?.name }}</p>
              <p class="udm-email">{{ currentUser?.email }}</p>
            </div>
            <div class="udm-body">
              <a class="udm-item" @click.prevent="goTo('/')">
                <font-awesome-icon :icon="['fas', 'home']" /> <span>Inicio</span>
              </a>
              <a class="udm-item" @click.prevent="goTo('/perfil')">
                <font-awesome-icon :icon="['fas', 'user']" /> <span>Mi Perfil</span>
              </a>
              <a class="udm-item" @click.prevent="goTo('/ajustes')">
                <font-awesome-icon :icon="['fas', 'cog']" /> <span>Configuración</span>
              </a>
              <div class="udm-divider"></div>
              <a class="udm-item danger" @click.prevent="handleLogout">
                <font-awesome-icon :icon="['fas', 'sign-out-alt']" />
                <span>{{ isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión' }}</span>
              </a>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Logout overlay -->
    <div v-if="isLoggingOut" class="logout-veil">
      <div class="logout-ring"></div>
      <p>Cerrando sesión...</p>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminAuth } from '../composables/useAdminAuth';
import { useAlerts } from '../../composables/useAlerts';
import { useTheme } from '../composables/useTheme';
import NotificationsDropdown from './NotificationsDropdown.vue';

defineEmits<{ toggleSidebar: [] }>();

const route = useRoute();
const router = useRouter();
const { user: currentUser, logout } = useAdminAuth();
const { confirm } = useAlerts();
const { isDark, toggleTheme } = useTheme();

const searchQuery = ref('');
const showUserMenu = ref(false);
const isLoggingOut = ref(false);

const currentPageTitle = computed(() => {
  const map: Record<string, string> = {
    '/admin/dashboard': 'Dashboard',
    '/admin/users': 'Usuarios',
    '/admin/properties': 'Propiedades',
    '/admin/contracts': 'Contratos',
    '/admin/payments': 'Pagos',
    '/admin/maintenances': 'Mantenimiento',
    '/admin/visits': 'Visitas',
    '/admin/reports': 'Reportes',
    '/admin/notifications': 'Notificaciones',
  };
  return map[route.path] || 'Admin Panel';
});

const userInitials = computed(() => {
  if (!currentUser.value?.name) return 'AD';
  return currentUser.value.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const userRoleLabel = computed(() => {
  const roles: Record<string, string> = { admin: 'Administrador', support: 'Soporte', user: 'Usuario' };
  return roles[currentUser.value?.role || 'user'];
});

const handleSearch = () => { /* TODO */ };

const goTo = (path: string) => {
  showUserMenu.value = false;
  router.push(path);
};

const handleLogout = async () => {
  if (isLoggingOut.value) return;
  confirm(
    '¿Estás seguro que deseas cerrar sesión?',
    async () => {
      showUserMenu.value = false;
      isLoggingOut.value = true;
      try {
        await logout();
        router.push({ name: 'Login', query: { message: 'Sesión cerrada exitosamente' } });
      } finally {
        isLoggingOut.value = false;
      }
    },
    () => {},
    { title: 'Cerrar Sesión', confirmText: 'Sí, cerrar sesión', cancelText: 'Cancelar' }
  );
};

const outsideClick = (e: MouseEvent) => {
  const t = e.target as HTMLElement;
  if (!t.closest('.user-pill') && !t.closest('.user-dropdown-menu')) {
    showUserMenu.value = false;
  }
};

onMounted(() => document.addEventListener('click', outsideClick));
onUnmounted(() => document.removeEventListener('click', outsideClick));
</script>

<style scoped>
.admin-header {
  position: fixed;
  top: 0;
  right: 0;
  left: var(--sidebar-width);
  height: 64px;
  z-index: 150;
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  gap: 1rem;
}

/* Left */
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hamburger-btn {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: var(--header-btn-bg);
  color: var(--header-text-secondary);
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  align-items: center;
  justify-content: center;
}
.hamburger-btn:hover {
  background: var(--header-btn-hover);
  color: var(--accent);
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
}
.bc-root { color: var(--header-text-muted); font-weight: 500; }
.bc-sep { color: var(--header-text-muted); font-size: 0.6rem; opacity: 0.5; }
.bc-current { color: var(--header-text-primary); font-weight: 700; }

/* Right */
.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

/* Search */
.header-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--header-btn-bg);
  border: 1px solid var(--header-border);
  border-radius: 10px;
  padding: 0.45rem 0.85rem;
  width: 240px;
  transition: all 0.2s;
}
.header-search:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.search-ico { color: var(--header-text-muted); font-size: 0.85rem; }
.header-search input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.85rem;
  color: var(--header-text-primary);
  width: 100%;
}
.header-search input::placeholder { color: var(--header-text-muted); }

/* Icon circle */
.icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--header-border);
  background: var(--header-btn-bg);
  color: var(--header-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.25s ease;
}
.icon-circle:hover {
  background: var(--header-btn-hover);
  color: var(--accent);
  border-color: var(--accent);
  transform: scale(1.05);
}

/* User pill */
.user-pill {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.75rem 0.35rem 0.35rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--header-btn-bg);
  border: 1px solid var(--header-border);
}
.user-pill:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 8px var(--accent-ring);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 0;
  line-height: 1.2;
}
.user-name-text { font-size: 0.82rem; font-weight: 700; color: var(--header-text-primary); }
.user-role-text { font-size: 0.68rem; color: var(--header-text-muted); font-weight: 500; }
.user-caret { font-size: 0.6rem; color: var(--header-text-muted); transition: transform 0.2s; }

/* User dropdown */
.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 240px;
  background: var(--dropdown-bg);
  border: 1px solid var(--header-border);
  border-radius: 14px;
  box-shadow: 0 16px 48px var(--dropdown-shadow);
  overflow: hidden;
  z-index: 1000;
}
.udm-header {
  padding: 1rem 1.15rem;
  border-bottom: 1px solid var(--header-border);
  background: var(--dropdown-header-bg);
}
.udm-name { font-size: 0.9rem; font-weight: 700; color: var(--header-text-primary); margin: 0 0 0.15rem; }
.udm-email { font-size: 0.78rem; color: var(--header-text-muted); margin: 0; }
.udm-body { padding: 0.4rem 0; }
.udm-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 1.15rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--header-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s;
}
.udm-item:hover { background: var(--header-btn-hover); color: var(--accent); }
.udm-item.danger { color: #ef4444; }
.udm-item.danger:hover { background: rgba(239, 68, 68, 0.08); }
.udm-divider { height: 1px; background: var(--header-border); margin: 0.25rem 0; }

/* Logout veil */
.logout-veil {
  position: fixed;
  inset: 0;
  background: var(--logout-overlay);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 9999;
}
.logout-ring {
  width: 44px;
  height: 44px;
  border: 3px solid var(--header-border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.logout-veil p { color: var(--header-text-primary); font-weight: 700; font-size: 1rem; }

/* Transitions */
.pop-enter-active, .pop-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-8px) scale(0.96); }

/* Responsive */
@media (max-width: 1024px) {
  .admin-header { left: 0; }
  .hamburger-btn { display: flex; }
  .header-search { width: 180px; }
  .user-meta { display: none; }
}
@media (max-width: 768px) {
  .header-inner { padding: 0 1rem; }
  .breadcrumb-nav { display: none; }
  .header-search { flex: 1; width: auto; }
}
</style>