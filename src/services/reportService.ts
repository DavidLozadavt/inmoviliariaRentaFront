// services/reportService.ts
import api from "./api";

export interface Report {
    id: number;
    property_id: number;
    user_id: number;
    type: string;
    description: string;
    status: "pending" | "reviewed" | "resolved" | "dismissed";
    created_at: string;
    updated_at: string;
    property?: any;
    user?: any;
    reporter?: any;
    reported_user?: any;
    reported_user_id?: number;
}

/**
 * CRUD service for /api/reports
 * Backend: ReportController (with owner-based authorization)
 */
export const reportService = {
    async getReports(): Promise<Report[]> {
        const response = await api.get("/reports");
        return response.data?.data ?? [];
    },

    async getReport(id: number): Promise<Report> {
        const response = await api.get(`/reports/${id}`);
        return response.data?.data ?? response.data;
    },

    async createReport(data: Partial<Report>): Promise<Report> {
        const response = await api.post("/reports", data);
        return response.data?.data ?? response.data;
    },

    async deleteReport(id: number): Promise<void> {
        await api.delete(`/reports/${id}`);
    },

    // --- Admin Endpoints ---
    async getAdminReports(filters?: { type?: string; user_id?: number; search?: string; page?: number; per_page?: number }): Promise<{ data: Report[]; meta: any }> {
        const response = await api.get("/admin/reports", { params: filters });
        const body = response.data;
        return {
            data: body?.data ?? [],
            meta: body?.meta ?? { current_page: 1, last_page: 1, per_page: 20, total: 0 },
        };
    },

    async getAdminReport(id: number): Promise<Report> {
        const response = await api.get(`/admin/reports/${id}`);
        return response.data?.data ?? response.data;
    },

    async updateAdminReportStatus(id: number, status: string): Promise<Report> {
        const response = await api.put(`/admin/reports/${id}/status`, { status });
        return response.data?.data ?? response.data;
    },

    async deleteAdminReport(id: number): Promise<void> {
        await api.delete(`/admin/reports/${id}`);
    },

    async getAdminReportStats(): Promise<any> {
        const response = await api.get("/admin/reports/stats");
        return response.data?.data ?? response.data;
    },
};
