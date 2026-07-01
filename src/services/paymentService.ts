// services/paymentService.ts
import api from "./api";

export interface Payment {
    id: number;
    contract_id: number;
    amount: number;
    payment_date: string;
    status: "pending" | "paid" | "rejected" | "overdue";
    payment_method?: string;
    reference_number?: string;
    notes?: string;
    proof_url?: string;
    created_at: string;
    updated_at: string;
    contract?: any;
    user?: any;
}

export interface PaymentFilters {
    status?: string;
    contract_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
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

/**
 * CRUD service for /api/payments
 * Backend: PaymentController (tenant creates, landlord confirms/rejects)
 */
export const paymentService = {
    async getPayments(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> {
        const response = await api.get("/payments", { params: filters });
        const body = response.data;
        return {
            data: body?.data ?? [],
            meta: body?.meta ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        };
    },

    async getPayment(id: number): Promise<Payment> {
        const response = await api.get(`/payments/${id}`);
        return response.data?.data ?? response.data;
    },

    async createPayment(data: Partial<Payment>): Promise<Payment> {
        const response = await api.post("/payments", data);
        return response.data?.data ?? response.data;
    },

    async updatePayment(id: number, data: Partial<Payment>): Promise<Payment> {
        const response = await api.put(`/payments/${id}`, data);
        return response.data?.data ?? response.data;
    },

    async deletePayment(id: number): Promise<void> {
        await api.delete(`/payments/${id}`);
    },

    // --- Admin Endpoints ---
    async getAdminPayments(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> {
        const response = await api.get("/admin/payments", { params: filters });
        const body = response.data;
        return {
            data: body?.data ?? [],
            meta: body?.meta ?? { current_page: 1, last_page: 1, per_page: 20, total: 0 },
        };
    },

    async getAdminPayment(id: number): Promise<Payment> {
        const response = await api.get(`/admin/payments/${id}`);
        return response.data?.data ?? response.data;
    },

    async updateAdminPaymentStatus(id: number, status: string): Promise<Payment> {
        const response = await api.put(`/admin/payments/${id}/status`, { status });
        return response.data?.data ?? response.data;
    },

    async getAdminPaymentStats(): Promise<any> {
        const response = await api.get("/admin/payments/stats");
        return response.data?.data ?? response.data;
    },
};
