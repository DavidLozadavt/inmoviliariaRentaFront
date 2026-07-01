// services/rentalRequestService.ts
import api from "../services/api";

export interface RentalRequestItem {
  id: number;
  property_id: number;
  user_id: number;
  owner_id: number;
  requested_date: string;
  requested_time: string;
  counter_date?: string;
  counter_time?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'counter_proposed' | 'visit_completed' | 'contract_sent';
  visit_end_time?: string;
  property?: {
    id: number;
    title: string;
    address: string;
    image_url: string;
    monthly_price: number;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    photo?: string;
  };
  owner?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ContractTermsData {
  rental_request_id: number;
  property_id: number;
  tenant_id: number;
  landlord_id: number;
  start_date: string;
  end_date: string;
  monthly_price: number;
  deposit: number;
  clauses: string[];
  payment_day: number; // día del mes para pagar
  late_fee: number; // multa por retraso
  utilities_included: string[]; // servicios incluidos
  special_conditions?: string; // condiciones especiales
}

export const rentalRequestService = {
  // ==================== INQUILINO ====================

  // Crear solicitud de cita
  async createRequest(data: {
    property_id: number;
    requested_date: string;
    requested_time: string;
  }) {
    const response = await api.post("/rental-requests", data);
    return response.data;
  },

  // Obtener mis solicitudes (inquilino)
  async getMyRequests() {
    const response = await api.get("/rental-requests/my-requests");
    return response.data;
  },

  // Aceptar contra-propuesta del dueño
  async acceptCounterProposal(requestId: number) {
    const response = await api.put(`/rental-requests/${requestId}/accept-counter`);
    return response.data;
  },

  // Rechazar contra-propuesta
  async rejectCounterProposal(requestId: number) {
    const response = await api.put(`/rental-requests/${requestId}/reject-counter`);
    return response.data;
  },

  // ==================== DUEÑO ====================

  // Obtener solicitudes recibidas (dueño)
  async getOwnerRequests() {
    const response = await api.get("/rental-requests/my-received");
    return response.data;
  },

  // Aceptar solicitud
  async acceptRequest(requestId: number) {
    const response = await api.put(`/rental-requests/${requestId}/accept`);
    return response.data;
  },

  // Rechazar solicitud
  async rejectRequest(requestId: number) {
    const response = await api.put(`/rental-requests/${requestId}/reject`);
    return response.data;
  },

  // Proponer otra fecha/hora
  async counterPropose(requestId: number, data: {
    counter_date: string;
    counter_time: string;
  }) {
    const response = await api.put(`/rental-requests/${requestId}/counter-propose`, data);
    return response.data;
  },

  // Verificar si la visita ya finalizó (para habilitar botón)
  async checkVisitStatus(requestId: number) {
    const response = await api.get(`/rental-requests/${requestId}/visit-status`);
    return response.data; // { can_continue: boolean, time_remaining?: string }
  },

  // Enviar términos del contrato
  async sendContractTerms(data: ContractTermsData) {
    const response = await api.post("/rental-requests/send-contract", data);
    return response.data;
  },

  // ==================== GENERAL ====================

  // Obtener detalles de una solicitud
  async getRequestDetails(requestId: number) {
    const response = await api.get(`/rental-requests/${requestId}`);
    return response.data;
  },

  // Cancelar solicitud (cualquiera puede cancelar)
  async cancelRequest(requestId: number) {
    const response = await api.delete(`/rental-requests/${requestId}`);
    return response.data;
  }
};