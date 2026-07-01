// services/userManagementService.ts
import api from "./api";
import { eventBus } from "../events/eventBus";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'support';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  photo?: string;
  bio?: string;
  department?: string;
  city?: string;
  address: string;
  id_documento: string;
  verification_status: 'pending' | 'verified';
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  verification_status?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  suspended: number;
  byRole: {
    user: number;
    admin: number;
    support: number;
  };
}

export const userManagementService = {
  /**
   * Obtener lista de usuarios con filtros y paginación
   */
  async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    try {
      const params: Record<string, string> = {};

      // Búsqueda
      if (filters.search && filters.search.trim() !== '') {
        params.search = filters.search.trim();
      }

      // Filtro por rol
      if (filters.role && filters.role !== '') {
        params.role = filters.role;
      }

      // Filtro por estado
      if (filters.status && filters.status !== '') {
        params.status = filters.status;
      }

      // Filtro por verificación - CORREGIDO
      if (filters.verification_status && filters.verification_status !== '') {
        params.verification_status = filters.verification_status;
      }

      // Paginación
      if (filters.page) {
        params.page = filters.page.toString();
      }

      if (filters.perPage) {
        params.per_page = filters.perPage.toString();
      }

      // Ordenamiento
      if (filters.sortBy) {
        params.sort_by = filters.sortBy;
        params.sort_order = filters.sortOrder || 'asc';
      }

      console.log('Parámetros enviados al backend:', params); // DEBUG

      const response = await api.get('/users', { params });

      return response.data;
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats(): Promise<UserStats> {
    try {
      // Si existe endpoint específico para stats
      // const response = await api.get('/admin/users/stats');
      // return response.data;

      // Mientras tanto, calcular desde la lista completa
      const users = await this.getUsers({ perPage: 1000 });

      const stats: UserStats = {
        total: users.meta.total,
        active: 0,
        inactive: 0,
        pending: 0,
        suspended: 0,
        byRole: {
          user: 0,
          admin: 0,
          support: 0,
        },
      };

      users.data.forEach(user => {
        // Contar por status
        if (user.status === 'active') stats.active++;
        if (user.status === 'inactive') stats.inactive++;
        if (user.status === 'pending') stats.pending++;
        if (user.status === 'suspended') stats.suspended++;

        // Contar por rol
        stats.byRole[user.role]++;
      });

      return stats;
    } catch (error) {
      console.error("Error obteniendo estadísticas de usuarios:", error);
      throw error;
    }
  },

  /**
   * Obtener un usuario específico
   */
  async getUser(id: number): Promise<User> {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo usuario ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crear un nuevo usuario
   */
  async createUser(userData: FormData | Partial<User>): Promise<User> {
    try {
      const response = await api.post('/users', userData, {
        headers: userData instanceof FormData ? {
          'Content-Type': 'multipart/form-data',
        } : undefined,
      });

      eventBus.emit('user:created', response.data);

      return response.data;
    } catch (error) {
      console.error("Error creando usuario:", error);
      throw error;
    }
  },

  /**
   * Actualizar un usuario existente
   */
  /**
   * Actualizar un usuario existente
   */
  async updateUser(id: number, userData: FormData | Partial<User>): Promise<User> {
    try {
      let response;

      // Si es FormData (incluye archivos), usar POST con _method
      if (userData instanceof FormData) {
        // Agregar _method=PUT para simular PUT request
        userData.append('_method', 'PUT');

        response = await api.post(`/users/${id}`, userData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Si son datos JSON, usar PUT normal
        response = await api.put(`/users/${id}`, userData);
      }

      // Verificar que la respuesta sea exitosa
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al actualizar usuario');
      }

      eventBus.emit('user:updated', response.data.user);

      return response.data.user;
    } catch (error: any) {
      console.error(`Error actualizando usuario ${id}:`, error);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  },

  /**
   * Cambiar el rol de un usuario
   */
  async updateUserRole(id: number, role: 'user' | 'admin' | 'support'): Promise<User> {
    try {
      const response = await api.put(`/users/${id}`, { role });

      eventBus.emit('user:role:updated', { id, role });

      return response.data;
    } catch (error) {
      console.error(`Error cambiando rol del usuario ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cambiar el estado de un usuario (activar/desactivar/suspender)
   */
  async updateUserStatus(id: number, status: 'active' | 'inactive' | 'suspended'): Promise<User> {
    try {
      const response = await api.put(`/users/${id}`, { status });

      eventBus.emit('user:status:updated', { id, status });

      return response.data;
    } catch (error) {
      console.error(`Error cambiando estado del usuario ${id}:`, error);
      throw error;
    }
  },

  /**
   * Eliminar un usuario
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await api.delete(`/users/${id}`);

      eventBus.emit('user:deleted', id);
    } catch (error) {
      console.error(`Error eliminando usuario ${id}:`, error);
      throw error;
    }
  },

  /**
   * Subir foto de perfil
   */
  async uploadUserPhoto(id: number, photoFile: File): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await api.post(`/users/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      eventBus.emit('user:photo:updated', { id, photo: response.data.photo });

      return response.data;
    } catch (error) {
      console.error(`Error subiendo foto del usuario ${id}:`, error);
      throw error;
    }
  },

  /**
   * Formatear tiempo relativo
   */
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Hace unos segundos";
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
    if (seconds < 2592000) return `Hace ${Math.floor(seconds / 86400)} días`;

    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  },

  /**
   * Obtener configuración de color para el rol
   */
  getRoleConfig(role: string): { color: string; bg: string; label: string } {
    const configs = {
      admin: {
        color: '#dc2626',
        bg: '#fef2f2',
        label: 'Administrador',
      },
      support: {
        color: '#2563eb',
        bg: '#eff6ff',
        label: 'Soporte',
      },
      user: {
        color: '#059669',
        bg: '#f0fdf4',
        label: 'Usuario',
      },
    };

    return configs[role as keyof typeof configs] || configs.user;
  },

  /**
   * Obtener configuración de color para el estado
   */
  getStatusConfig(status: string): { color: string; bg: string; label: string; icon: string } {
    const s = (status || '').toLowerCase();
    const configs: Record<string, any> = {
      active: { color: '#059669', bg: '#f0fdf4', label: 'Activo', icon: '✓' },
      inactive: { color: '#6b7280', bg: '#f9fafb', label: 'Inactivo', icon: '○' },
      pending: { color: '#f59e0b', bg: '#fffbeb', label: 'Pendiente', icon: '⏳' },
      suspended: { color: '#dc2626', bg: '#fef2f2', label: 'Suspendido', icon: '✕' },
      // Spanish keys
      activo: { color: '#059669', bg: '#f0fdf4', label: 'Activo', icon: '✓' },
      inactivo: { color: '#6b7280', bg: '#f9fafb', label: 'Inactivo', icon: '○' },
      pendiente: { color: '#f59e0b', bg: '#fffbeb', label: 'Pendiente', icon: '⏳' },
      suspendido: { color: '#dc2626', bg: '#fef2f2', label: 'Suspendido', icon: '✕' },
    };

    return configs[s] || configs.inactive;
  },
};