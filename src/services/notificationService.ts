// services/notificationService.ts
import api from "../services/api";

export interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

/**
 * All backend responses now use the standardized envelope:
 *   { success: true, data: [...], meta: { unread_count, current_page, ... } }
 */
export const notificationService = {
  /**
   * Obtener todas las notificaciones del usuario.
   * Returns { notifications, unreadCount } after unwrapping the envelope.
   */
  async getNotifications(): Promise<NotificationsResponse> {
    const response = await api.get("/notifications");
    const body = response.data;

    // Unwrap standardized envelope
    const raw = body?.data ?? body;
    const notifications: NotificationItem[] = Array.isArray(raw) ? raw : [];
    const unreadCount: number = body?.meta?.unread_count ?? notifications.filter(n => !n.read).length;

    return { notifications, unreadCount };
  },

  /** Obtener solo no leídas */
  async getUnreadNotifications(): Promise<NotificationItem[]> {
    const response = await api.get("/notifications/unread");
    const raw = response.data?.data ?? response.data;
    return Array.isArray(raw) ? raw : [];
  },

  /** Marcar como leída */
  async markAsRead(notificationId: number) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /** Marcar todas como leídas */
  async markAllAsRead() {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },

  /** Eliminar notificación */
  async deleteNotification(notificationId: number) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  /** Obtener contador de no leídas */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.getNotifications();
      return response.unreadCount;
    } catch {
      return 0;
    }
  },
};