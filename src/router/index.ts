// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { authService } from "@/services/auth";
import { useUserStore } from "@/stores/useUserStore";
import logger from "@/utils/logger";

// ── Eager-loaded routes (critical path) ──────────────────────────────────
import MainLayout from "@/layouts/MainLayout.vue";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/Auth/LoginView.vue";

// ── Lazy-loaded routes ────────────────────────────────────────────────────
const RegisterView = () => import("@/views/Auth/RegisterView.vue");
const ConfirmEmailView = () => import("@/views/Auth/ConfirmEmailView.vue");
const ResetPasswordView = () => import("@/views/Auth/ResetPasswordView.vue");
const PropertyDetail = () => import("@/views/Property/PropertyDetail.vue");
const ProfileView = () => import("@/views/Dropdown/ProfileView.vue");
const PropertyView = () => import("@/views/Property/PropertyView.vue");
const PropertyCreate = () => import("@/views/Property/PropertyCreate.vue");
const PropertyEdit = () => import("@/views/Property/PropertyEdit.vue");
const AboutUsView = () => import("@/views/AboutUsView.vue");
const ContractView = () => import("@/views/Dropdown/ContractView.vue");
const PaymentsView = () => import("@/views/Dropdown/PaymentsView.vue");
const MaintenancesView = () => import("@/views/Dropdown/MaintenancesView.vue");
const ReportsView = () => import("@/views/Dropdown/ReportsView.vue");
const SettingsView = () => import("@/views/Dropdown/SettingsView.vue");
const MapExplorerView = () => import("@/views/Map/MapExplorerView.vue");
const MapView = () => import("@/components/modals/Maps/MapView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");
const FaqView = () => import("@/views/FaqView.vue");
const LegalNoticeView = () => import("@/views/Legal/LegalNoticeView.vue");
const PrivacyPolicyView = () => import("@/views/Legal/PrivacyPolicyView.vue");

// ── Admin routes ──────────────────────────────────────────────────────────
import { adminRoutes } from "@/admin/router/admin.routes";

// ── Route definitions ─────────────────────────────────────────────────────
const routes: RouteRecordRaw[] = [
  // Routes with main layout
  {
    path: "/",
    component: MainLayout,
    children: [
      {
        path: "",
        name: "home",
        component: HomeView,
        meta: { title: "Inicio" },
      },
      {
        path: "properties/:id",
        name: "PropertyDetail",
        component: PropertyDetail,
        meta: { title: "Detalle de Propiedad" },
      },
      {
        path: "/perfil",
        name: "ProfileView",
        component: ProfileView,
        meta: { title: "Perfil", requiresAuth: true },
      },
      {
        path: "/propiedades",
        name: "PropertyView",
        component: PropertyView,
        meta: { title: "Propiedades" },
      },
      {
        path: "/properties/create",
        name: "PropertyCreate",
        component: PropertyCreate,
        meta: { title: "Crear Propiedad", requiresAuth: true },
      },
      {
        path: "/propiedades/:id/editar",
        name: "PropertyEdit",
        component: PropertyEdit,
        meta: { title: "Editar Propiedad", requiresAuth: true },
      },
      {
        path: "/sobre-nosotros",
        name: "AboutUsView",
        component: AboutUsView,
        meta: { title: "Sobre Nosotros" },
      },
      {
        path: "/contratos",
        name: "ContractView",
        component: ContractView,
        meta: { title: "Contratos", requiresAuth: true },
      },
      {
        path: "/pagos",
        name: "PaymentsView",
        component: PaymentsView,
        meta: { title: "Mis Pagos", requiresAuth: true },
      },
      {
        path: "/mantenimiento",
        name: "MaintenancesView",
        component: MaintenancesView,
        meta: { title: "Mantenimiento", requiresAuth: true },
      },
      {
        path: "/reportes",
        name: "ReportsView",
        component: ReportsView,
        meta: { title: "Mis Reportes", requiresAuth: true },
      },
      {
        path: "/ajustes",
        name: "SettingsView",
        component: SettingsView,
        meta: { title: "Ajustes de Cuenta", requiresAuth: true },
      },
      {
        path: "/preguntas-frecuentes",
        name: "FaqView",
        component: FaqView,
        meta: { title: "Preguntas Frecuentes" },
      },
      {
        path: "/aviso-legal",
        name: "LegalNotice",
        component: LegalNoticeView,
        meta: { title: "Aviso Legal" },
      },
      {
        path: "/politica-privacidad",
        name: "PrivacyPolicy",
        component: PrivacyPolicyView,
        meta: { title: "Política de Privacidad" },
      },
    ],
  },

  // Admin panel
  ...adminRoutes,

  // Map views (no layout)
  {
    path: "/mapa",
    name: "MapExplorer",
    component: MapExplorerView,
    meta: { title: "Explorar en Mapa" },
  },
  {
    path: "/map/:id",
    name: "MapView",
    component: MapView,
    props: true,
    meta: { title: "Mapa de Propiedad" },
  },

  // Auth views (no layout)
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    meta: { title: "Iniciar Sesión", hideForAuth: true },
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterView,
    meta: { title: "Registro", hideForAuth: true },
  },
  {
    path: "/confirm-email",
    name: "ConfirmEmail",
    component: ConfirmEmailView,
    meta: { title: "Confirmar Email" },
    beforeEnter: (to, _from, next) => {
      const token =
        typeof to.query.token === "string" ? to.query.token : undefined;
      if (!token) {
        next({ name: "home" });
        return;
      }
      next();
    },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: ResetPasswordView,
    meta: { title: "Recuperar Contraseña", hideForAuth: true },
  },

  // 404 — dedicated page instead of silent redirect
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFoundView,
    meta: { title: "Página no encontrada" },
  },
];

// ── Router instance ───────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0, behavior: "smooth" };
  },
});

// ── Navigation guard ──────────────────────────────────────────────────────
router.beforeEach((to, _from, next) => {
  // 1. Update document title immediately (Synchronous)
  document.title = to.meta.title
    ? `${to.meta.title} | RentUs`
    : "RentUs — Encuentra tu hogar ideal";

  const isAuthenticated = authService.isAuthenticated();
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  const hideForAuth = to.matched.some((r) => r.meta.hideForAuth);
  const requiresAdmin = to.matched.some((r) => r.meta.requiresAdmin);
  const requiresRole = to.meta.requiresRole as string | undefined;

  // 2. Critical Block: No session on protected route
  if (requiresAuth && !isAuthenticated) {
    localStorage.setItem("redirectAfterLogin", to.fullPath);
    next({ name: "Login", query: { redirect: to.fullPath } });
    return;
  }

  // 3. Simple Redirect: Authenticated user tries to visit login/register
  if (hideForAuth && isAuthenticated) {
    const cachedUser = authService.getUser();
    if (cachedUser && (cachedUser.role === "admin" || cachedUser.role === "support")) {
      next({ name: "admin-dashboard" });
    } else {
      next({ name: "home" });
    }
    return;
  }

  // 4. Preliminary Role Check (Synchronous using cache)
  // If cache exists and confirms lack of permissions, block immediately.
  if (isAuthenticated && (requiresAdmin || requiresRole)) {
    const cachedUser = authService.getUser();
    if (cachedUser) {
      const isAdminAccess = cachedUser.role === "admin" || cachedUser.role === "support";
      if (requiresAdmin && !isAdminAccess) {
        next({ name: "home", query: { error: "unauthorized" } });
        return;
      }
      if (requiresRole && cachedUser.role !== requiresRole) {
        next({
          name: "admin-dashboard",
          query: { error: "insufficient_permissions" },
        });
        return;
      }
    }
  }

  // 5. Background Validation (Non-blocking)
  // We let the user navigate immediately, then verify the session/roles in the background.
  if (isAuthenticated) {
    const userStore = useUserStore();

    // Trigger background refresh (don't await)
    userStore.loadMe().then(() => {
      const currentUser = userStore.user;

      // If session is found to be invalid/expired in the background
      if (!currentUser && (requiresAuth || requiresAdmin)) {
        logger.warn("Session expired or invalid. Redirecting to login.");
        router.push({ name: "Login", query: { redirect: to.fullPath } });
        return;
      }

      // Late role check: if data changed or cache was wrong
      if (currentUser && requiresAdmin) {
        const isAdminAccess = currentUser.role === "admin" || currentUser.role === "support";
        if (!isAdminAccess) {
          logger.warn("Access denied: user is not an admin.");
          router.push({ name: "home", query: { error: "unauthorized" } });
        } else if (requiresRole && currentUser.role !== requiresRole) {
          logger.warn(`Access denied: required role "${requiresRole}", has "${currentUser.role}".`);
          router.push({
            name: "admin-dashboard",
            query: { error: "insufficient_permissions" },
          });
        }
      }
    }).catch((err) => {
      logger.error("Background validation error:", err);
      // If it's a 401 or similar, authService already cleared local state.
      if (requiresAuth || requiresAdmin) {
        router.push({ name: "Login", query: { redirect: to.fullPath } });
      }
    });
  }

  // 6. Finalize navigation immediately
  next();
});

// ── Error handler ─────────────────────────────────────────────────────────
router.onError((error) => {
  logger.error("Navigation error:", error);
});

export default router;