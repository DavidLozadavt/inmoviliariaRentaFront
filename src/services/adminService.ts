// services/adminService.ts
import api from "./api";

export interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    pending_verification: number;
    growth?: number;
  };
  properties: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    pending_approval: number;
    approved: number;
    rejected: number;
    published: number;
    hidden: number;
    total_views: number;
    average_price: number;
    growth?: number;
  };
  contracts: {
    total: number;
    active: number;
    pending: number;
    expired: number;
    rejected: number;
    growth?: number;
  };
  payments: {
    total: number;
    paid: number;
    pending: number;
    rejected: number;
    revenue: number;
    total_revenue?: number;
    growth?: number;
  };
  requests: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
  maintenances: {
    total: number;
    pending: number;
    in_progress: number;
    finished: number;
  };
  charts?: {
    revenue: {
      labels: string[];
      data: number[];
    };
  };
}

export interface ActivityItem {
  id: string | number;
  type: string;
  data?: any;
  created_at: string;
  timestamp: number;
}

export const adminService = {
  /**
   * Obtener estadísticas del dashboard
   */
  async getDashboardStats(): Promise<AdminStats> {
    try {
      const response = await api.get("/admin/dashboard/stats");
      // Backend returns { success, data, meta } envelope
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error("Error obteniendo estadísticas del admin:", error);
      throw error;
    }
  },

  /**
   * Obtener actividad reciente (próximamente desde backend)
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    try {
      const response = await api.get("/admin/dashboard/activity", {
        params: { limit },
      });
      return response.data?.data ?? [];
    } catch (error) {
      console.error("Error obteniendo actividad reciente:", error);
      return [];
    }
  },
};