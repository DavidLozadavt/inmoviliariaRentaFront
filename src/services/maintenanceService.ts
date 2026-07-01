// services/maintenanceService.ts
import api from "./api";

export interface Maintenance {
    id: number;
    property_id: number;
    user_id: number;
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    status: "pending" | "in_progress" | "completed" | "cancelled";
    request_date: string;
    resolution_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    property?: any;
    user?: any;
}

export interface MaintenanceFilters {
    status?: string;
    priority?: string;
    property_id?: number;
    page?: number;
    per_page?: number;
}

/**
 * CRUD service for /api/maintenances
 * Backend: MaintenanceController (tenant/owner creates, owner updates status)
 */
export const maintenanceService = {
    async getMaintenances(filters?: MaintenanceFilters): Promise<{ data: Maintenance[]; meta: any }> {
        const response = await api.get("/maintenances", { params: filters });
        const body = response.data;
        return {
            data: body?.data ?? [],
            meta: body?.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        };
    },

    async getMaintenance(id: number): Promise<Maintenance> {
        const response = await api.get(`/maintenances/${id}`);
        return response.data?.data ?? response.data;
    },

    async createMaintenance(data: Partial<Maintenance>): Promise<Maintenance> {
        const response = await api.post("/maintenances", data);
        return response.data?.data ?? response.data;
    },

    async updateMaintenance(id: number, data: Partial<Maintenance>): Promise<Maintenance> {
        const response = await api.put(`/maintenances/${id}`, data);
        return response.data?.data ?? response.data;
    },

    async deleteMaintenance(id: number): Promise<void> {
        await api.delete(`/maintenances/${id}`);
    },

    // --- Admin Endpoints ---
    async getAdminMaintenances(filters?: MaintenanceFilters): Promise<{ data: Maintenance[]; meta: any }> {
        const response = await api.get("/admin/maintenances", { params: filters });
        const body = response.data;
        return {
            data: body?.data ?? [],
            meta: body?.meta ?? { current_page: 1, last_page: 1, per_page: 20, total: 0 },
        };
    },

    async getAdminMaintenance(id: number): Promise<Maintenance> {
        const response = await api.get(`/admin/maintenances/${id}`);
        return response.data?.data ?? response.data;
    },

    async updateAdminMaintenanceStatus(id: number, status: string): Promise<Maintenance> {
        const response = await api.put(`/admin/maintenances/${id}/status`, { status });
        return response.data?.data ?? response.data;
    },

    async getAdminMaintenanceStats(): Promise<any> {
        const response = await api.get("/admin/maintenances/stats");
        return response.data?.data ?? response.data;
    },
};
