// types/property.ts

/**
 * Estado de aprobación de una propiedad
 */
export type PropertyApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * Estado de disponibilidad de una propiedad
 */
export type PropertyAvailabilityStatus = 'available' | 'rented' | 'maintenance';

/**
 * Visibilidad de publicación
 */
export type PropertyVisibility = 'published' | 'hidden';

/**
 * Interfaz principal de Propiedad
 */
export interface Property {
  type: string;
  id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  status: PropertyAvailabilityStatus;
  approval_status?: PropertyApprovalStatus;
  visibility?: PropertyVisibility;
  monthly_price: number;
  area_m2: number;
  num_bedrooms: number;
  num_bathrooms: number;
  included_services: string[];
  publication_date: string;
  image_url: string;
  lat: number;
  lng: number;
  views: number;
  user_id: number;
  user?: PropertyOwner;
  created_at: string;
  updated_at: string;
}

/**
 * Información del propietario
 */
export interface PropertyOwner {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
}

/**
 * Filtros para búsqueda de propiedades
 */
export interface PropertyFilters {
  search?: string;
  status?: PropertyAvailabilityStatus | '';
  approval_status?: PropertyApprovalStatus | '';
  visibility?: PropertyVisibility | '';
  city?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Respuesta paginada de propiedades
 */
export interface PaginatedPropertiesResponse {
  data: Property[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Estadísticas de propiedades
 */
export interface PropertyStats {
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
}