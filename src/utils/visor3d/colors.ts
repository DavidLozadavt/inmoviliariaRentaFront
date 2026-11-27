import type { ColorMode, Unit } from '@/types/visor3d'

export interface LegendItem { key: string; label: string; color: string }

export const NEUTRAL = '#cbd5e1'      // posición sin unidad vinculada
export const FILTERED = '#e9edf2'     // no cumple los filtros
export const SPECIAL_COLORS: Record<string, string> = {
  lobby: '#a8a29e', parking: '#64748b', terrace: '#86efac', amenities: '#93c5fd',
}
export const SPECIAL_LABELS: Record<string, string> = {
  lobby: 'Lobby', parking: 'Parqueaderos', terrace: 'Terraza', amenities: 'Zonas comunes',
}

export const LEGENDS: Record<ColorMode, LegendItem[]> = {
  commercial: [
    { key: 'available', label: 'Disponible', color: '#22c55e' },
    { key: 'reserved', label: 'Separado', color: '#eab308' },
    { key: 'rented', label: 'Arrendado / vendido', color: '#ef4444' },
  ],
  arrears: [
    { key: 'ok', label: 'Al día', color: '#22c55e' },
    { key: 'lt60', label: 'Mora hasta 60 días', color: '#eab308' },
    { key: 'gt60', label: 'Mora de más de 60 días', color: '#ef4444' },
    { key: 'none', label: 'Sin contrato', color: '#94a3b8' },
  ],
  pqrs: [
    { key: 'open', label: 'Con solicitudes abiertas', color: '#f97316' },
    { key: 'none', label: 'Sin solicitudes', color: '#d1d5db' },
  ],
}

export const MODE_LABELS: Record<ColorMode, string> = {
  commercial: 'Inmobiliaria',
  arrears: 'Administración',
  pqrs: 'PQRS',
}

export const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible', reserved: 'Separado', rented: 'Arrendado', sold: 'Vendido',
}

const pick = (mode: ColorMode, key: string) => LEGENDS[mode].find((l) => l.key === key)?.color ?? NEUTRAL

export function unitColor(unit: Unit | undefined, mode: ColorMode): string {
  if (!unit) return NEUTRAL
  switch (mode) {
    case 'commercial':
      return pick('commercial', unit.commercial_status === 'sold' ? 'rented' : unit.commercial_status)
    case 'arrears':
      return unit.contract_id ? pick('arrears', unit.arrears_bucket ?? 'ok') : pick('arrears', 'none')
    case 'pqrs':
      return (unit.open_requests ?? 0) > 0 ? pick('pqrs', 'open') : pick('pqrs', 'none')
  }
}

export const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0)
