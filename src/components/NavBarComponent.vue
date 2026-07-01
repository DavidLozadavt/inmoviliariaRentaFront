<template>
  <header class="property-header" :class="isLoggedIn ? 'auth' : 'no-auth'">

    <!-- Logo -->
    <div class="logo" @click="goHome" style="cursor: pointer">
      <img src="/favicon-light.png" alt="Logo" />
      <div class="logo-text"><strong>Rent</strong><span>Us</span></div>
    </div>

    <!-- Barra de navegación (Desktop) -->
    <nav class="navigation-section">
      <div class="nav-links">
        <router-link to="/" class="nav-link" :class="{ active: isActive('/') }" @click="closeMobileMenu">
          <font-awesome-icon icon="home" class="nav-icon" />
          <span class="nav-text">{{ $t('navbar.links.home') }}</span>
        </router-link>

        <router-link to="/propiedades" class="nav-link" :class="{ active: isActive('/propiedades') }"
          @click="closeMobileMenu">
          <font-awesome-icon icon="building" class="nav-icon" />
          <span class="nav-text">{{ $t('navbar.links.properties') }}</span>
        </router-link>

        <router-link to="/sobre-nosotros" class="nav-link" :class="{ active: isActive('/sobre-nosotros') }"
          @click="closeMobileMenu">
          <font-awesome-icon icon="people-group" class="nav-icon" />
          <span class="nav-text">{{ $t('navbar.links.about') }}</span>
        </router-link>
      </div>
    </nav>

    <!-- Derecha del header -->
    <div class="header-right">

      <!-- Language Toggle -->
      <div class="language-toggle" @click="toggleLanguage">
        <div class="toggle-track">
          <div class="toggle-slider" :class="{ active: currentLanguage === 'es' }"></div>
          <div class="language-option" :class="{ active: currentLanguage === 'en' }">
            <span class="lang-code">EN</span>
          </div>
          <div class="language-option" :class="{ active: currentLanguage === 'es' }">
            <span class="lang-code">ES</span>
          </div>
          <div class="toggle-glow"></div>
        </div>
      </div>

      <!-- Login button desktop (sin sesión) -->
      <button v-if="!isLoggedIn" @click="goLogin" class="login-btn desktop-login-btn" type="button">
        {{ $t('navbar.auth.login') }}
      </button>

      <!-- DROPDOWN USUARIO (con sesión) -->
      <div v-else class="user-profile" id="userToggle" @click="toggleUserDropdown">
        <div class="user-avatar">
          <img v-if="profilePhoto" :src="profilePhoto" alt="Usuario" class="avatar-img" />
          <img v-else src="/img/default.webp" alt="Usuario" class="avatar-img" />
          <div class="status-indicator"></div>
        </div>

        <div class="user-details">
          <div class="user-greeting">{{ $t('navbar.auth.greeting') }}, {{ firstName }}</div>
        </div>

        <div class="dropdown-arrow" :class="{ rotated: showDropdown }">
          <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
            <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
      </div>

      <!-- BOTÓN HAMBURGUESA (MÓVIL) -->
      <button class="hamburger-btn" :class="{ active: showMobileMenu }" @click.stop="toggleMobileMenu"
        aria-label="Menú principal">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Dropdown Menu Desktop -->
    <transition name="dropdown-fade">
      <div v-if="showDropdown" class="user-dropdown-menu" @click.stop>
        <div class="dropdown-header">
          <div class="header-background"></div>
          <button class="dropdown-close-btn" @click="closeDropdown" aria-label="Cerrar menú">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-linecap="round" />
            </svg>
          </button>
          <div class="dropdown-avatar-wrapper">
            <div class="avatar-glow"></div>
            <img v-if="profilePhoto" :src="profilePhoto" alt="Usuario" class="dropdown-avatar" />
            <img v-else src="/img/default.webp" alt="Usuario" class="dropdown-avatar" />
          </div>
          <div class="dropdown-user-info">
            <div class="dropdown-name">{{ fullName }}</div>
            <div class="dropdown-email">{{ userEmail }}</div>
          </div>
        </div>

        <div class="dropdown-items">
          <!-- Main Links (if any) -->
          <div @click="goPerfil" class="dropdown-item">
            <font-awesome-icon icon="user" class="item-icon" />
            <div class="item-text">{{ $t('navbar.dropdown.myProfile') }}</div>
          </div>
          <div @click="openNotificaciones" class="dropdown-item">
            <font-awesome-icon icon="bell" class="item-icon" />
            <div class="item-text">{{ $t('navbar.dropdown.notifications') }}</div>
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
          </div>
          
          <div class="dropdown-divider"></div>
          
          <div @click="goContratos" class="dropdown-item">
            <font-awesome-icon icon="file-contract" class="item-icon" />
            <div class="item-text">{{ $t('navbar.dropdown.contracts') }}</div>
          </div>
          <div @click="goPagos" class="dropdown-item">
            <font-awesome-icon icon="receipt" class="item-icon" />
            <div class="item-text">{{ $t('navbar.dropdown.payments') }}</div>
          </div>
          
          <div @click="openSolicitudesModal" class="dropdown-item">
            <font-awesome-icon icon="clipboard-list" class="item-icon" />
            <div class="item-text">{{ $t('navbar.dropdown.ownerRequests') }}</div>
          </div>

          <div v-if="currentUser?.role === 'admin' || currentUser?.role === 'support'" @click="goToAdminPanel" class="dropdown-item admin">
            <font-awesome-icon icon="shield-alt" class="item-icon" />
            <div class="item-text">{{ $t('navbar.dropdown.adminPanel') }}</div>
          </div>

          <div @click="goReportes" class="dropdown-item">
            <font-awesome-icon icon="flag" class="item-icon" />
            <div class="item-text">{{ $t('navbar.dropdown.myReports') }}</div>
          </div>

          <div @click="goAjustes" class="dropdown-item">
            <font-awesome-icon icon="cog" class="item-icon" />
            <div class="item-text">{{ $t('navbar.dropdown.settings') }}</div>
          </div>

          <div @click="openMyRequestsModalFn" class="dropdown-item">
            <font-awesome-icon icon="calendar-check" class="item-icon" />
            <div class="item-text">{{ $t('navbar.dropdown.myRequests') }}</div>
          </div>

          <div @click="goMantenimiento" class="dropdown-item">
            <font-awesome-icon icon="wrench" class="item-icon" />
            <div class="item-text">{{ $t('navbar.dropdown.maintenance') }}</div>
          </div>

          <div class="dropdown-divider"></div>

          <div @click="handleLogout" class="dropdown-item logout-item">
            <font-awesome-icon icon="sign-out-alt" class="item-icon" />
            <div class="item-text">{{ $t('navbar.auth.logout') }}</div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Mobile Side Menu (The "No Paila" Version) -->
    <transition name="slide-side">
      <div v-if="showMobileMenu" class="mobile-side-menu" @click.stop>
        <div class="m-menu-header">
          <div class="logo">
            <img src="/favicon-light.png" alt="Logo" />
            <div class="logo-text"><strong>Rent</strong><span>Us</span></div>
          </div>
          <button class="m-close-btn" @click="closeMobileMenu">✕</button>
        </div>

        <div class="m-menu-content">
          <router-link to="/" class="m-link" @click="closeMobileMenu">
            <font-awesome-icon icon="home" /> {{ $t('navbar.links.home') }}
          </router-link>
          <router-link to="/propiedades" class="m-link" @click="closeMobileMenu">
            <font-awesome-icon icon="building" /> {{ $t('navbar.links.properties') }}
          </router-link>
          <router-link to="/sobre-nosotros" class="m-link" @click="closeMobileMenu">
            <font-awesome-icon icon="people-group" /> {{ $t('navbar.links.about') }}
          </router-link>
          
          <div v-if="isLoggedIn" class="m-divider"></div>
          
          <template v-if="isLoggedIn">
             <div @click="goPerfil" class="m-link"><font-awesome-icon icon="user" /> {{ $t('navbar.dropdown.myProfile') }}</div>
             <div @click="openNotificaciones" class="m-link">
               <font-awesome-icon icon="bell" /> {{ $t('navbar.dropdown.notifications') }}
               <span v-if="unreadCount > 0" class="m-badge">{{ unreadCount }}</span>
             </div>
             <div @click="goContratos" class="m-link"><font-awesome-icon icon="file-contract" /> {{ $t('navbar.dropdown.contracts') }}</div>
             <div @click="goPagos" class="m-link"><font-awesome-icon icon="receipt" /> {{ $t('navbar.dropdown.payments') }}</div>
             <div @click="openSolicitudesModal" class="m-link"><font-awesome-icon icon="clipboard-list" /> Solicitudes</div>
             <div @click="goReportes" class="m-link"><font-awesome-icon icon="flag" /> {{ $t('navbar.dropdown.myReports') }}</div>
             <div @click="goAjustes" class="m-link"><font-awesome-icon icon="cog" /> {{ $t('navbar.dropdown.settings') }}</div>
             <div @click="openMyRequestsModalFn" class="m-link"><font-awesome-icon icon="calendar-check" /> {{ $t('navbar.dropdown.myRequests') }}</div>
             <div @click="goMantenimiento" class="m-link"><font-awesome-icon icon="wrench" /> {{ $t('navbar.dropdown.maintenance') }}</div>
             
             <div v-if="currentUser?.role === 'admin'" @click="goToAdminPanel" class="m-link admin"><font-awesome-icon icon="shield-alt" /> Admin</div>
             
             <div class="m-divider"></div>
             <div @click="handleLogout" class="m-link logout"><font-awesome-icon icon="sign-out-alt" /> {{ $t('navbar.auth.logout') }}</div>
          </template>
          <div v-else class="m-actions">
            <button @click="goLogin" class="m-login-btn">{{ $t('navbar.auth.login') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Overlay backdrop for mobile menu -->
    <transition name="fade">
      <div v-if="showMobileMenu" class="m-menu-overlay" @click="closeMobileMenu"></div>
    </transition>

  </header>


  <div class="dropdown-backdrop" :class="{ active: showDropdown }" @click="closeDropdown"></div>


  <RequestsView :open="showRequestModal" @close="showRequestModal = false" />
  <NotificationsView :open="showNotificaciontModal" @close="showNotificaciontModal = false" />
  <MyRequestsModal :open="showMyRequestsModal" @close="showMyRequestsModal = false" />

  <!-- Alerta personalizada -->
  <transition name="alert-slide">
    <div v-if="alert.show" class="custom-alert" :class="`alert-${alert.type}`">
      <div class="alert-icon">
        <font-awesome-icon :icon="alert.type === 'success' ? 'check-circle' :
          alert.type === 'error' ? 'times-circle' : 'info-circle'" />
      </div>
      <div class="alert-content">
        <div class="alert-title">{{ alert.title }}</div>
        <div class="alert-message">{{ alert.message }}</div>
      </div>
      <button @click="closeAlert" class="alert-close">
        <font-awesome-icon icon="times" />
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { authService } from "../services/auth";
import type { User } from "../services/auth";
import { notificationService } from "../services/notificationService";
import RequestsView from "../components/modals/ModalRequest/RequestsView.vue";
import NotificationsView from "../components/modals/Notifications/NotificationsView.vue";
import MyRequestsModal from "../components/modals/ModalRequest/MyRequestsModal.vue";
import { eventBus, EVENTS } from '../events/eventBus';

const router = useRouter();
const route  = useRoute();
const { t, locale } = useI18n();

// Estado de autenticación
const isLoggedIn   = ref(false);
const currentUser  = ref<User | null>(null);
const fullName     = ref("Usuario");
const firstName    = ref("Usuario");
const userEmail    = ref("");
const profilePhoto = ref("");

// Estado de UI
const showDropdown         = ref(false);
const showMobileMenu       = ref(false);
const showRequestModal     = ref(false);
const showNotificaciontModal = ref(false);
const showMyRequestsModal  = ref(false);
const unreadCount          = ref(0);

// Idioma
const currentLanguage = ref(locale.value);

// Alertas
interface Alert {
  show: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

const alert = ref<Alert>({ show: false, type: 'success', title: '', message: '' });
let alertTimeout: number | undefined;

const showAlert = (type: Alert['type'], title: string, message: string) => {
  alert.value = { show: true, type, title, message };
  if (alertTimeout) clearTimeout(alertTimeout);
  alertTimeout = window.setTimeout(closeAlert, 5000);
};

const closeAlert = () => {
  alert.value.show = false;
  if (alertTimeout) clearTimeout(alertTimeout);
};

const isActive = (path: string) => route.path === path;

// ==================== Idioma ====================

const toggleLanguage = () => changeLanguage(currentLanguage.value === 'es' ? 'en' : 'es');

const changeLanguage = (lang: string) => {
  currentLanguage.value = lang;
  locale.value = lang;
  localStorage.setItem('lang', lang);
  eventBus.emit(EVENTS.LANGUAGE_CHANGED, lang);
};

const handleLanguageChange = (lang: string) => {
  if (currentLanguage.value !== lang) {
    currentLanguage.value = lang;
    locale.value = lang;
  }
};

// ==================== Autenticación ====================

const checkAuthAndLoadUser = async () => {
  try {
    if (!authService.isAuthenticated()) {
      isLoggedIn.value = false;
      currentUser.value = null;
      return;
    }
    const storedUser = authService.getUser();
    if (storedUser) { updateUserData(storedUser); isLoggedIn.value = true; }

    const user = await authService.getMe();
    updateUserData(user);
    currentUser.value = user;
    isLoggedIn.value = true;
    await loadUnreadCount();
  } catch (error) {
    console.error("Error verificando autenticación:", error);
    await handleLogout();
  }
};

const goToAdminPanel = () => {
  router.push('/admin/dashboard');
  closeDropdown();
  closeMobileMenu();
};

const updateUserData = (user: User) => {
  fullName.value    = user.name  || "Usuario";
  firstName.value   = fullName.value.split(" ")[0];
  userEmail.value   = user.email || "";
  if (firstName.value.length > 10) firstName.value = firstName.value.slice(0, 10) + "...";
  profilePhoto.value = user.photo || "";
};

const handleLogout = async () => {
  try {
    await authService.logout();
    showAlert('success', t('navbar.alerts.logoutSuccess.title'), t('navbar.alerts.logoutSuccess.message'));
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    showAlert('error', t('navbar.alerts.logoutError.title'), t('navbar.alerts.logoutError.message'));
  } finally {
    isLoggedIn.value   = false;
    currentUser.value  = null;
    fullName.value     = "Usuario";
    firstName.value    = "Usuario";
    userEmail.value    = "";
    profilePhoto.value = "";
    showDropdown.value = false;
    router.push("/login");
  }
};

// ==================== Navegación ====================

const goHome      = () => { router.push("/");          closeMobileMenu(); };
const goLogin     = () => { router.push("/login");     closeMobileMenu(); };
const goPerfil    = () => { router.push('/perfil');    closeDropdown(); closeMobileMenu(); };
const goContratos = () => { router.push("/contratos"); closeDropdown(); closeMobileMenu(); };
const goPagos     = () => { router.push("/pagos");     closeDropdown(); closeMobileMenu(); };
const goMantenimiento= () => { router.push("/mantenimiento"); closeDropdown(); closeMobileMenu(); };
const goReportes  = () => { router.push("/reportes"); closeDropdown(); closeMobileMenu(); };
const goAjustes   = () => { router.push("/ajustes");   closeDropdown(); closeMobileMenu(); };

// ==================== UI ====================

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
  if (showMobileMenu.value) { showDropdown.value = false; document.body.classList.remove('dropdown-open'); }
  document.body.classList.toggle('mobile-menu-open', showMobileMenu.value);
};

const closeMobileMenu = () => {
  showMobileMenu.value = false;
  document.body.classList.remove('mobile-menu-open');
};

const toggleUserDropdown = () => {
  showDropdown.value = !showDropdown.value;
  if (showDropdown.value) {
    closeMobileMenu();
    if (window.innerWidth <= 768) document.body.classList.add('dropdown-open');
  } else {
    document.body.classList.remove('dropdown-open');
  }
};

const closeDropdown = () => {
  showDropdown.value = false;
  document.body.classList.remove('dropdown-open');
};

// ==================== Modales ====================

const openSolicitudesModal    = () => { showRequestModal.value      = true; closeDropdown(); };
const openMyRequestsModalFn   = () => { showMyRequestsModal.value   = true; closeDropdown(); };
const openNotificaciones      = () => { showNotificaciontModal.value = true; closeDropdown(); };

// ==================== Notificaciones ====================

const loadUnreadCount = async () => {
  try {
    if (!isLoggedIn.value) return;
    const response = await notificationService.getUnreadCount();
    unreadCount.value = typeof response === 'number' ? response : (response as any).count || 0;
  } catch (error) {
    console.error("Error cargando notificaciones:", error);
  }
};

const handlePhotoUpdate = (newPhoto: string) => {
  profilePhoto.value = newPhoto;
  if (currentUser.value) {
    currentUser.value.photo = newPhoto;
    const storage = localStorage.getItem("auth_token") ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(currentUser.value));
  }
};

// ==================== Click outside ====================

const handleClickOutside = (event: MouseEvent) => {
  const userMenu  = document.getElementById("userToggle");
  const dropdown  = document.querySelector(".user-dropdown-menu");
  const hamburger = document.querySelector(".hamburger-btn");
  const mobileNav = document.querySelector(".navigation-section");

  if (userMenu && dropdown &&
      !userMenu.contains(event.target as Node) &&
      !dropdown.contains(event.target as Node) &&
      showDropdown.value) {
    closeDropdown();
  }

  if (hamburger && mobileNav &&
      !hamburger.contains(event.target as Node) &&
      !mobileNav.contains(event.target as Node) &&
      showMobileMenu.value) {
    closeMobileMenu();
  }
};

// ==================== Watchers ====================

watch(() => route.path, async () => {
  if (authService.isAuthenticated() && !isLoggedIn.value) await checkAuthAndLoadUser();
});

// ==================== Lifecycle ====================

let notificationInterval: number | undefined;

onMounted(async () => {
  await checkAuthAndLoadUser();

  const savedLang = localStorage.getItem('lang');
  if (savedLang) { currentLanguage.value = savedLang; locale.value = savedLang; }

  document.addEventListener("click", handleClickOutside);
  eventBus.on(EVENTS.PROFILE_PHOTO_UPDATED, handlePhotoUpdate);
  eventBus.on(EVENTS.LANGUAGE_CHANGED, handleLanguageChange);

  notificationInterval = window.setInterval(() => {
    if (isLoggedIn.value) loadUnreadCount();
  }, 30000);
});

onBeforeUnmount(() => {
  if (notificationInterval) clearInterval(notificationInterval);
  document.removeEventListener("click", handleClickOutside);
  eventBus.off(EVENTS.PROFILE_PHOTO_UPDATED, handlePhotoUpdate);
  eventBus.off(EVENTS.LANGUAGE_CHANGED, handleLanguageChange);
  document.body.classList.remove("dropdown-open", "mobile-menu-open");
});
</script>

<style scoped>
@import "../assets/css/components/navbar.css";
</style>