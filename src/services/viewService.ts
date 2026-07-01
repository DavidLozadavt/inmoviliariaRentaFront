// services/viewService.ts
import api from "./api";

export const viewService = {
    // --- Admin Endpoints ---
    async getAdminViewStats(): Promise<any> {
        const response = await api.get("/admin/views/stats");
        return response.data?.data ?? response.data;
    },

    async getAdminTopProperties(limit: number = 10): Promise<any[]> {
        const response = await api.get("/admin/views/top-properties", { params: { limit } });
        return response.data?.data ?? [];
    },

    async getAdminViewsByCity(): Promise<any[]> {
        const response = await api.get("/admin/views/by-city");
        return response.data?.data ?? [];
    },
};
