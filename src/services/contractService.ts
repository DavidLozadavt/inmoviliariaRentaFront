// services/contractService.ts
import api from "./api";

export interface Contract {
  id: number;
  property_id: number;
  tenant_id: number;
  landlord_id: number;
  status: "active" | "pending" | "expired" | "cancelled" | "rejected";
  validated_by_support?: boolean;
  start_date?: string;
  end_date?: string;
  total_amount?: number;
  created_at: string;
  updated_at: string;
  property?: {
    id: number;
    title: string;
    address?: string;
    city?: string;
    monthly_price?: number;
    status?: string;
  };
  tenant?: { id: number; name: string; email?: string; phone?: string; photo?: string };
  landlord?: { id: number; name: string; email?: string; phone?: string; photo?: string };
  payments?: any[];
  ratings?: { user: { id: number; name: string } }[];
}

export interface ContractStats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  cancelled: number;
  rejected: number;
  validated: number;
}

export const contractService = {
  async getUserContracts() {
    const response = await api.get("/contracts");
    return response.data;
  },

  async getAdminContracts(params?: { search?: string; status?: string; page?: number; per_page?: number }) {
    const response = await api.get("/admin/contracts", { params });
    return { data: response.data.data, meta: response.data.meta };
  },

  async getAdminContract(id: number) {
    const response = await api.get(`/admin/contracts/${id}`);
    return response.data.data;
  },

  async getStats(): Promise<ContractStats> {
    const response = await api.get("/admin/contracts/stats");
    return response.data.data;
  },

  async updateAdminContract(id: number, data: Partial<Contract>) {
    const response = await api.put(`/admin/contracts/${id}`, data);
    return response.data.data;
  },

  async validateContract(contractId: number, isValid: boolean) {
    const response = await api.put(`/admin/contracts/${contractId}/validate`, { validated_by_support: isValid });
    return response.data.data;
  },

  async cancelContract(contractId: number) {
    const response = await api.put(`/admin/contracts/${contractId}/cancel`);
    return response.data.data;
  },

  async acceptContract(contractId: number) {
    const response = await api.put(`/contracts/${contractId}/accept`);
    return response.data;
  },

  async rejectContract(contractId: number) {
    const response = await api.put(`/contracts/${contractId}/reject`);
    return response.data;
  },
};
