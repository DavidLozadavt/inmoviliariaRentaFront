// services/visor3dService.ts — Visor 3D de edificios
import axios from 'axios'
import api from './api'
import type {
  BuildingConfig, BuildingPayload, BuildingSummary, PanoramaNode, PublicLink, Tour, TourLink, UnitPlan, UnitType,
} from '@/types/visor3d'

export type TowerMediaKind = 'photo' | 'facade_front' | 'facade_side' | 'facade_left' | 'facade_back' | 'roof'
export type MediaKind = 'cover' | 'preview' | 'facade_front' | 'facade_side' | 'facade_left' | 'facade_back' | 'roof' | 'site_plan'
type Envelope<T> = { success: boolean; data: T; message?: string }
const unwrap = <T>(p: Promise<{ data: Envelope<T> }>) => p.then((r) => r.data.data)

export interface BuildingInput {
  name: string
  address?: string | null
  city?: string | null
  config: BuildingConfig
  unit_types: UnitType[]
}

// Cliente sin token para el modo público (iframe / enlace compartido)
const publicApi = axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 15000, headers: { Accept: 'application/json' } })

export const visor3dService = {
  list: () => unwrap<BuildingSummary[]>(api.get('/buildings')),
  config: (id: number) => unwrap<BuildingPayload>(api.get(`/buildings/${id}/config`)),
  create: (data: BuildingInput) => unwrap<BuildingPayload>(api.post('/buildings', data)),
  update: (id: number, data: Partial<BuildingInput>) => unwrap<BuildingPayload>(api.put(`/buildings/${id}`, data)),
  remove: (id: number) => unwrap<null>(api.delete(`/buildings/${id}`)),

  generateUnits: (id: number, prices: Record<string, number>) =>
    unwrap<{ created: number; total_slots: number }>(api.post(`/buildings/${id}/units/generate`, { prices })),
  updateUnit: (id: number, unitId: number, data: Record<string, unknown>) =>
    unwrap<{ id: number }>(api.put(`/buildings/${id}/units/${unitId}`, data)),
  availableProperties: (id: number) =>
    unwrap<{ id: number; title: string; city: string; monthly_price: number }[]>(api.get(`/buildings/${id}/units/available`)),
  linkProperty: (id: number, data: { property_id: number; tower: string; floor: number; unit_code: string; unit_type?: string | null }) =>
    unwrap<{ id: number }>(api.post(`/buildings/${id}/units/link`, data)),
  moveUnit: (id: number, unitId: number, pos: { tower: string; floor: number; unit_code: string; unit_type?: string | null }) =>
    unwrap<{ id: number }>(api.put(`/buildings/${id}/units/${unitId}/move`, pos)),
  unlinkUnit: (id: number, unitId: number) => unwrap<null>(api.delete(`/buildings/${id}/units/${unitId}`)),
  deleteUnit: (id: number, unitId: number) => unwrap<null>(api.delete(`/buildings/${id}/units/${unitId}/destroy`)),
  tour: (id: number, unitId: number) => unwrap<Tour>(api.get(`/buildings/${id}/units/${unitId}/tour`)),

  panoramas: (id: number) => unwrap<PanoramaNode[]>(api.get(`/buildings/${id}/panoramas`)),
  uploadPanorama: (id: number, form: FormData, onProgress?: (pct: number) => void) =>
    unwrap<PanoramaNode>(api.post(`/buildings/${id}/panoramas`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    })),
  updatePanorama: (id: number, panoId: number, data: Partial<Pick<PanoramaNode, 'space' | 'is_start' | 'order' | 'surface'>>) =>
    unwrap<PanoramaNode>(api.put(`/buildings/${id}/panoramas/${panoId}`, data)),
  updatePanoramaKind: (id: number, panoId: number, kind: string | null) =>
    unwrap<PanoramaNode>(api.put(`/buildings/${id}/panoramas/${panoId}`, { kind })),
  saveHotspots: (id: number, panoId: number, links: TourLink[]) =>
    unwrap<PanoramaNode>(api.put(`/buildings/${id}/panoramas/${panoId}/hotspots`, { links })),
  removePanorama: (id: number, panoId: number) => unwrap<null>(api.delete(`/buildings/${id}/panoramas/${panoId}`)),

  uploadMedia: (id: number, kind: MediaKind, image: Blob) => {
    const form = new FormData()
    form.append('image', image, `${kind}.${image.type === 'image/png' ? 'png' : image.type === 'image/jpeg' ? 'jpg' : 'webp'}`)
    return unwrap<{ url: string }>(api.post(`/buildings/${id}/media/${kind}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000,
    }))
  },
  removeMedia: (id: number, kind: MediaKind) => unwrap<null>(api.delete(`/buildings/${id}/media/${kind}`)),

  uploadTowerMedia: (id: number, tower: string, kind: TowerMediaKind, image: Blob) => {
    const form = new FormData()
    form.append('image', image, `${kind}.${image.type === 'image/png' ? 'png' : image.type === 'image/jpeg' ? 'jpg' : 'webp'}`)
    return unwrap<{ url: string }>(api.post(`/buildings/${id}/towers/${encodeURIComponent(tower)}/media/${kind}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000,
    }))
  },
  removeTowerMedia: (id: number, tower: string, kind: TowerMediaKind) =>
    unwrap<null>(api.delete(`/buildings/${id}/towers/${encodeURIComponent(tower)}/media/${kind}`)),

  savePlan: (id: number, ownerKind: 'type' | 'unit', ownerId: number, plan: UnitPlan) =>
    unwrap<UnitPlan>(api.put(`/buildings/${id}/plans`, { owner_kind: ownerKind, owner_id: ownerId, rooms: plan.rooms, doors: plan.doors ?? [] })),

  publicLink: (id: number) => unwrap<PublicLink>(api.get(`/buildings/${id}/public-link`)),
  createPublicLink: (id: number, expiresInDays: number | null) =>
    unwrap<PublicLink>(api.post(`/buildings/${id}/public-link`, { expires_in_days: expiresInDays })),
  revokePublicLink: (id: number) => unwrap<null>(api.delete(`/buildings/${id}/public-link`)),

  // ── Público ──
  publicConfig: (token: string, query: string) =>
    unwrap<BuildingPayload>(publicApi.get(`/public/buildings/${token}?${query}`)),
  publicTour: (token: string, query: string, unitId: number) =>
    unwrap<Tour>(publicApi.get(`/public/buildings/${token}?${query}&tour=${unitId}`)),
}

/** Mensaje legible de un error de axios. */
export function errorMessage(e: unknown, fallback = 'Ocurrió un error'): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    if (d?.errors) return Object.values(d.errors).flat()[0] ?? fallback
    if (d?.message) return d.message
    if (e.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder'
  }
  return e instanceof Error ? e.message : fallback
}
