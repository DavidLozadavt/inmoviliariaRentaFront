import type { PanoramaNode, SpaceKind, Surface } from '@/types/visor3d'

/** Tipos de espacio que se marcan en una unidad (mismos valores que PanoramaService::KINDS). */
export const SPACE_KINDS: { key: SpaceKind; label: string; icon: string }[] = [
  { key: 'sala', label: 'Sala', icon: '🛋️' },
  { key: 'comedor', label: 'Comedor', icon: '🍽️' },
  { key: 'cocina', label: 'Cocina', icon: '🍳' },
  { key: 'habitacion', label: 'Habitación', icon: '🛏️' },
  { key: 'bano', label: 'Baño', icon: '🚿' },
  { key: 'balcon', label: 'Balcón', icon: '🌇' },
  { key: 'estudio', label: 'Estudio', icon: '💻' },
  { key: 'lavanderia', label: 'Lavandería', icon: '🧺' },
  { key: 'patio', label: 'Patio', icon: '🌿' },
  { key: 'fachada', label: 'Fachada / vista', icon: '🏢' },
  { key: 'otro', label: 'Otro', icon: '📍' },
]

export const kindLabel = (k?: string | null) => SPACE_KINDS.find((s) => s.key === k)?.label ?? 'Espacio'
export const kindIcon = (k?: string | null) => SPACE_KINDS.find((s) => s.key === k)?.icon ?? '📍'

/** Siguiente nombre libre: "Habitación", "Habitación 2"... */
export function nextSpaceName(kind: SpaceKind, used: string[]): string {
  const base = kindLabel(kind)
  if (!used.includes(base)) return base
  let i = 2
  while (used.includes(`${base} ${i}`)) i++
  return `${base} ${i}`
}

// ── Un espacio se arma con varias fotos: cada una indica qué superficie muestra

export const SURFACES: { key: Surface; label: string; short: string; hint: string }[] = [
  { key: 'front', label: 'Pared frontal', short: 'Frente', hint: 'La pared que ves al entrar' },
  { key: 'right', label: 'Pared derecha', short: 'Derecha', hint: 'Gira a la derecha' },
  { key: 'back', label: 'Pared del fondo', short: 'Fondo', hint: 'La de la puerta, de espaldas a la frontal' },
  { key: 'left', label: 'Pared izquierda', short: 'Izquierda', hint: 'Gira a la izquierda' },
  { key: 'floor', label: 'Piso', short: 'Piso', hint: 'Apunta la cámara hacia abajo' },
  { key: 'ceiling', label: 'Techo', short: 'Techo', hint: 'Apunta la cámara hacia arriba' },
  { key: 'detail', label: 'Detalle', short: 'Detalle', hint: 'Acabados, closet, ventana, vista…' },
]
export const surfaceLabel = (s?: string | null) => SURFACES.find((x) => x.key === s)?.label ?? 'Sin marcar'
/** Superficies que forman la caja de la habitación (todo menos "detalle"). */
export const ROOM_SURFACES: Surface[] = ['front', 'right', 'back', 'left', 'floor', 'ceiling']

export interface SpaceGroup {
  space: string
  kind: PanoramaNode['kind']
  nodes: PanoramaNode[]
  cover: PanoramaNode
  /** Fotos con superficie de pared/piso/techo: con 2 o más se puede armar la habitación 3D. */
  surfaces: Partial<Record<Surface, PanoramaNode>>
  canBuildRoom: boolean
}

/** Agrupa las fotos por espacio (mismo nombre), en el orden en que aparecen. */
export function groupBySpace(nodes: PanoramaNode[]): SpaceGroup[] {
  const map = new Map<string, PanoramaNode[]>()
  for (const n of nodes) {
    const k = n.space.trim().toLowerCase()
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(n)
  }
  return [...map.values()].map((list) => {
    const surfaces: Partial<Record<Surface, PanoramaNode>> = {}
    for (const n of list) if (n.projection === 'flat' && n.surface && n.surface !== 'detail' && !surfaces[n.surface]) surfaces[n.surface] = n
    const walls = (['front', 'right', 'back', 'left'] as Surface[]).filter((s) => surfaces[s]).length
    return {
      space: list[0].space,
      kind: list[0].kind,
      nodes: list,
      cover: list.find((n) => n.is_start) ?? list.find((n) => n.surface === 'front') ?? list[0],
      surfaces,
      canBuildRoom: walls >= 2,
    }
  })
}

/** Siguiente superficie sugerida para un espacio (para guiar al tomar las fotos). */
export function nextSurface(nodes: PanoramaNode[]): Surface {
  const used = new Set(nodes.map((n) => n.surface))
  return SURFACES.find((s) => s.key !== 'detail' && !used.has(s.key))?.key ?? 'detail'
}
