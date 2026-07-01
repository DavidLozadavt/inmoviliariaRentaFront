// services/ratingService.ts
import api from "./api";

export interface Rating {
    id: number;
    contract_id: number;
    property_id: number;
    user_id: number;
    score: number;
    comment?: string;
    date: string;
    created_at: string;
    updated_at: string;
}

/**
 * CRUD service for /api/ratings
 * Backend: RatingController (with duplicate prevention per contract)
 */
export const ratingService = {
    async getRatings(propertyId?: number): Promise<Rating[]> {
        const params = propertyId ? { property_id: propertyId } : {};
        const response = await api.get("/ratings", { params });
        return response.data?.data ?? [];
    },

    async getRating(id: number): Promise<Rating> {
        const response = await api.get(`/ratings/${id}`);
        return response.data?.data ?? response.data;
    },

    async createRating(data: Partial<Rating>): Promise<Rating> {
        const response = await api.post("/ratings", data);
        return response.data?.data ?? response.data;
    },

    async updateRating(id: number, data: Partial<Rating>): Promise<Rating> {
        const response = await api.put(`/ratings/${id}`, data);
        return response.data?.data ?? response.data;
    },

    async deleteRating(id: number): Promise<void> {
        await api.delete(`/ratings/${id}`);
    },
};
