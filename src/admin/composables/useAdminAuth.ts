// src/admin/composables/useAdminAuth.ts
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authService, type User, type UserRole } from '../../services/auth';

// Estado global
const currentUser = ref<User | null>(null);

// Inicializar estado al cargar
const initializeAuth = async () => {
  if (authService.isAuthenticated()) {
    try {
      const user = await authService.getMe();
      currentUser.value = user;
      console.log('✅ Usuario admin inicializado:', user.name, '| Rol:', user.role);
    } catch (error) {
      console.error('❌ Error inicializando auth admin:', error);
      currentUser.value = null;
    }
  }
};

// Inicializar cuando se carga el módulo
initializeAuth();

export function useAdminAuth() {
  const router = useRouter();

  // Computed
  const user = computed(() => currentUser.value);
  const isAuthenticated = computed(() => authService.isAuthenticated());
  const isAdmin = computed(() => currentUser.value?.role === 'admin');
  const isSupport = computed(() => currentUser.value?.role === 'support');
  const hasAdminAccess = computed(() => isAdmin.value || isSupport.value);

  /**
   * Verificar si el usuario tiene acceso al panel de admin
   */
  const checkAdminAccess = (): boolean => {
    if (!authService.isAuthenticated()) {
      console.warn('⚠️ Usuario no autenticado');
      return false;
    }

    if (!currentUser.value) {
      console.warn('⚠️ No hay datos de usuario');
      return false;
    }

    const hasAccess = hasAdminAccess.value;
    console.log(`🔐 Verificación de acceso admin: ${hasAccess ? 'PERMITIDO' : 'DENEGADO'} | Rol: ${currentUser.value.role}`);
    
    return hasAccess;
  };

  /**
   * Verificar si el usuario tiene un rol específico
   */
  const hasRole = (role: UserRole): boolean => {
    const result = currentUser.value?.role === role;
    console.log(`🔍 Verificando rol ${role}: ${result ? 'SÍ' : 'NO'} | Rol actual: ${currentUser.value?.role}`);
    return result;
  };

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!currentUser.value) return false;
    const result = roles.includes(currentUser.value.role);
    console.log(`🔍 Verificando roles ${roles.join(', ')}: ${result ? 'SÍ' : 'NO'} | Rol actual: ${currentUser.value.role}`);
    return result;
  };

  /**
   * Redireccionar si no tiene acceso
   */
  const requireAdminAccess = (): boolean => {
    if (!checkAdminAccess()) {
      console.warn('🚫 Acceso denegado, redirigiendo a home');
      router.push({
        path: '/',
        query: { error: 'unauthorized' }
      });
      return false;
    }
    return true;
  };

  /**
   * Logout - usar el servicio existente
   */
  const logout = async () => {
    try {
      await authService.logout();
      currentUser.value = null;
      console.log('✅ Logout exitoso');
      router.push('/login');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      // Limpiar de todas formas
      currentUser.value = null;
      router.push('/login');
    }
  };

  /**
   * Login - usar el servicio existente
   */
  const login = async (email: string, password: string, remember: boolean = false) => {
    try {
      const response = await authService.login({ email, password, remember });
      
      if (response.success && response.user) {
        currentUser.value = response.user;
        console.log('✅ Login exitoso:', response.user.name, '| Rol:', response.user.role);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error al iniciar sesión:', error);
      return false;
    }
  };

  /**
   * Obtener información del usuario actual
   */
  const fetchCurrentUser = async () => {
    try {
      const user = await authService.getMe();
      currentUser.value = user;
      console.log('✅ Usuario actualizado:', user.name, '| Rol:', user.role);
      return currentUser.value;
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      currentUser.value = null;
      return null;
    }
  };

  /**
   * Sincronizar estado de autenticación
   */
  const syncAuthState = async () => {
    if (authService.isAuthenticated()) {
      await fetchCurrentUser();
    } else {
      currentUser.value = null;
    }
  };

  // Escuchar cambios en storage para sincronizar entre tabs
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', async (event) => {
      if (event.key === 'auth_token') {
        if (!event.newValue) {
          // Token eliminado en otra pestaña
          currentUser.value = null;
          console.log('🔄 Token eliminado en otra pestaña');
        } else if (event.oldValue !== event.newValue) {
          // Token actualizado en otra pestaña
          await syncAuthState();
          console.log('🔄 Token actualizado en otra pestaña');
        }
      }
    });
  }

  return {
    // State
    user,
    isAuthenticated,
    isAdmin,
    isSupport,
    hasAdminAccess,

    // Methods
    checkAdminAccess,
    hasRole,
    hasAnyRole,
    requireAdminAccess,
    logout,
    login,
    fetchCurrentUser,
    syncAuthState,
  };
}