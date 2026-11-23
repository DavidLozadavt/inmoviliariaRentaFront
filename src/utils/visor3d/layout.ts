// Generador paramétrico. Misma regla de numeración que app/Services/Visor3d/BuildingLayout.php del backend.
// - Pisos residenciales: 1..floors, menos los especiales de esa torre.
// - Código de unidad: piso * 100 + posición (101, 102...).
// - Tipo: layout[posición - 1]; si no hay layout, el primer tipo declarado.
// Forma de cada torre (solo visual): filas por piso, ancho/fondo de unidad, rotación y posición (offset).
import type { BuildingConfig, SpecialKind, TowerConfig } from '@/types/visor3d'

export const UNIT_W = 7   // ancho por defecto de una unidad (m)
export const UNIT_D = 9   // fondo por defecto de una unidad (m)
export const TOWER_GAP = 12

export interface Slot {
  key: string           // "T1|101"
  tower: string
  floor: number
  position: number
  unit_code: string
  type_code: string | null
  x: number             // posición en el mundo (ya rotada)
  y: number
  z: number
  lx: number            // posición local dentro de la torre (sin rotar)
  lz: number
  row: number
  rows: number
  uw: number            // ancho / fondo de la unidad
  ud: number
  rot: number           // rotación de la torre (radianes, eje Y)
}

export interface SpecialSlab {
  tower: string
  floor: number
  kind: SpecialKind
  x: number
  y: number
  z: number
  w: number
  d: number
  rot: number
}

export interface TowerBox {
  code: string
  name: string
  x: number
  z: number
  w: number
  d: number
  rows: number
  cols: number
  uw: number
  ud: number
  rot: number
  minLevel: number
  maxLevel: number
  facadeFront: string | null   // fachada propia de la torre (si no, la del edificio)
  facadeSide: string | null
  facadeLeft: string | null
  facadeBack: string | null
  roof: string | null
}

export interface BuildingLayout {
  slots: Slot[]
  specials: SpecialSlab[]
  towers: TowerBox[]
  floorHeight: number
  baseLevel: number
  height: number
  size: number          // diagonal aproximada, para encuadrar la cámara
}

const clamp = (v: unknown, min: number, max: number, def: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, n)) : def
}

export function specialFloors(config: BuildingConfig, tower: string) {
  return (config.special_floors ?? []).filter((s) => !s.tower || s.tower === tower)
}

/** Filas por piso: las que pida la torre o, por defecto, 1 si hay ≤ 3 unidades y 2 si hay más. */
export function towerGrid(t: Pick<TowerConfig, 'units_per_floor' | 'rows'>) {
  const perFloor = Math.max(1, Number(t.units_per_floor) || 1)
  const rows = t.rows ? Math.min(perFloor, Math.max(1, Math.round(Number(t.rows)))) : perFloor <= 3 ? 1 : 2
  return { perFloor, rows, cols: Math.ceil(perFloor / rows) }
}

export function slotKey(tower: string, unitCode: string) {
  return `${tower}|${unitCode}`
}

/** Rota (lx, lz) un ángulo rot alrededor del eje Y, igual que three.js (rotation.y). */
export function rotateXZ(lx: number, lz: number, rot: number): [number, number] {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return [lx * c + lz * s, -lx * s + lz * c]
}

export function buildLayout(config: BuildingConfig, typeCodes: string[] = []): BuildingLayout {
  const h = Number(config.floor_height) || 3
  const towers = config.towers ?? []

  // Nivel base común para que todas las torres apoyen en el mismo suelo
  let baseLevel = 1
  for (const t of towers) {
    for (const s of specialFloors(config, t.code)) baseLevel = Math.min(baseLevel, s.floor)
  }

  const slots: Slot[] = []
  const specials: SpecialSlab[] = []
  const boxes: TowerBox[] = []
  let cursorX = 0
  let maxY = 0

  towers.forEach((t: TowerConfig) => {
    const { perFloor, rows, cols } = towerGrid(t)
    const uw = clamp(t.unit_width, 2, 40, UNIT_W)
    const ud = clamp(t.unit_depth, 2, 40, UNIT_D)
    const rot = ((Number(t.rotation) || 0) * Math.PI) / 180
    const w = cols * uw
    const d = rows * ud
    const ox = t.offset?.x ?? cursorX + w / 2
    const oz = t.offset?.z ?? 0
    cursorX = Math.max(cursorX, ox + w / 2) + TOWER_GAP

    const floors = Math.max(1, Number(t.floors) || 1)
    // Pisos especiales según los pisos de ESTA torre: la terraza general va siempre encima del último piso,
    // y los que quedan por encima de la torre se ignoran (evita losas flotando en torres bajas).
    const sp = specialFloors(config, t.code)
      .map((s) => (s.kind === 'terrace' && !s.tower ? { ...s, floor: floors + 1 } : s))
      .filter((s) => s.floor <= floors + 1)
      .filter((s, i, arr) => arr.findIndex((o) => o.floor === s.floor) === i)
    const spFloors = new Set(sp.map((s) => s.floor))
    let minLevel = 1
    let maxLevel = floors

    for (let floor = 1; floor <= floors; floor++) {
      if (spFloors.has(floor)) continue
      for (let pos = 1; pos <= perFloor; pos++) {
        const i = pos - 1
        const row = Math.floor(i / cols)
        const col = i % cols
        const lx = (col - (cols - 1) / 2) * uw
        const lz = (row - (rows - 1) / 2) * ud
        const [rx, rz] = rotateXZ(lx, lz, rot)
        const unit_code = String(floor * 100 + pos)
        slots.push({
          key: slotKey(t.code, unit_code),
          tower: t.code,
          floor,
          position: pos,
          unit_code,
          type_code: t.layout?.[i] ?? typeCodes[0] ?? null,
          x: ox + rx,
          y: (floor - baseLevel) * h + h / 2,
          z: oz + rz,
          lx, lz, row, rows, uw, ud, rot,
        })
      }
    }

    for (const s of sp) {
      minLevel = Math.min(minLevel, s.floor)
      maxLevel = Math.max(maxLevel, s.floor)
      specials.push({ tower: t.code, floor: s.floor, kind: s.kind, x: ox, y: (s.floor - baseLevel) * h + h / 2, z: oz, w, d, rot })
    }

    maxY = Math.max(maxY, (maxLevel - baseLevel + 1) * h)
    boxes.push({
      code: t.code, name: t.name || `Torre ${t.code}`, x: ox, z: oz, w, d, rows, cols, uw, ud, rot, minLevel, maxLevel,
      facadeFront: t.facade_front_url ?? null, facadeSide: t.facade_side_url ?? null,
      facadeLeft: t.facade_left_url ?? null, facadeBack: t.facade_back_url ?? null, roof: t.roof_url ?? null,
    })
  })

  const r = (b: TowerBox) => Math.hypot(b.w, b.d) / 2 // radio que cubre cualquier rotación
  const minX = Math.min(...boxes.map((b) => b.x - r(b)), 0)
  const maxX = Math.max(...boxes.map((b) => b.x + r(b)), 0)
  const minZ = Math.min(...boxes.map((b) => b.z - r(b)), 0)
  const maxZ = Math.max(...boxes.map((b) => b.z + r(b)), 0)

  return {
    slots,
    specials,
    towers: boxes,
    floorHeight: h,
    baseLevel,
    height: maxY,
    size: Math.hypot(maxX - minX, maxZ - minZ, maxY),
  }
}

/** Centro horizontal del conjunto, para apuntar la cámara. */
export function layoutCenter(l: BuildingLayout): [number, number, number] {
  if (!l.towers.length) return [0, 0, 0]
  const xs = l.towers.flatMap((t) => [t.x - t.w / 2, t.x + t.w / 2])
  const zs = l.towers.flatMap((t) => [t.z - t.d / 2, t.z + t.d / 2])
  return [(Math.min(...xs) + Math.max(...xs)) / 2, l.height / 2, (Math.min(...zs) + Math.max(...zs)) / 2]
}
