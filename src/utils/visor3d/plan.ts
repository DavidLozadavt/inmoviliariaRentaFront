// Plano de la unidad: espacios en una cuadrícula y puertas que los conectan.
import type { PlanDoor, PlanRoom, SpaceKind, UnitPlan } from '@/types/visor3d'

export const PLAN_COLS = 12
export const PLAN_ROWS = 8

/** ¿Comparten un borde (se tocan, no solo una esquina)? */
export function touching(a: PlanRoom, b: PlanRoom): boolean {
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  const sideX = a.x + a.w === b.x || b.x + b.w === a.x
  const sideY = a.y + a.h === b.y || b.y + b.h === a.y
  return (sideX && overlapY > 0) || (sideY && overlapX > 0)
}

export const doorKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)
export const hasDoor = (plan: UnitPlan, a: string, b: string) => (plan.doors ?? []).some((d) => doorKey(d.a, d.b) === doorKey(a, b))

export function toggleDoor(plan: UnitPlan, a: string, b: string): PlanDoor[] {
  const doors = plan.doors ?? []
  return hasDoor(plan, a, b) ? doors.filter((d) => doorKey(d.a, d.b) !== doorKey(a, b)) : [...doors, { a, b }]
}

/** Conecta todos los espacios que se tocan (sin quitar las puertas existentes). */
export function connectNeighbors(plan: UnitPlan): PlanDoor[] {
  const doors = [...(plan.doors ?? [])]
  for (let i = 0; i < plan.rooms.length; i++) {
    for (let j = i + 1; j < plan.rooms.length; j++) {
      const a = plan.rooms[i], b = plan.rooms[j]
      if (touching(a, b) && !doors.some((d) => doorKey(d.a, d.b) === doorKey(a.space, b.space))) doors.push({ a: a.space, b: b.space })
    }
  }
  return doors
}

/** Espacios conectados a uno (para "Pasar a…" en el recorrido). */
export function neighbors(plan: UnitPlan | null | undefined, space: string): string[] {
  if (!plan) return []
  const k = space.trim().toLowerCase()
  return (plan.doors ?? []).flatMap((d) =>
    d.a.toLowerCase() === k ? [d.b] : d.b.toLowerCase() === k ? [d.a] : [])
}

/** Centro de un espacio (para dibujar la puerta en el plano). */
export const center = (r: PlanRoom) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

/** Plantilla de ejemplo: apartamento de 2 alcobas, ya conectado. */
export function templatePlan(): UnitPlan {
  const rooms: PlanRoom[] = [
    { space: 'Sala', kind: 'sala' as SpaceKind, x: 0, y: 0, w: 5, h: 4 },
    { space: 'Comedor', kind: 'comedor' as SpaceKind, x: 5, y: 0, w: 3, h: 4 },
    { space: 'Cocina', kind: 'cocina' as SpaceKind, x: 8, y: 0, w: 4, h: 3 },
    { space: 'Balcón', kind: 'balcon' as SpaceKind, x: 0, y: 4, w: 2, h: 4 },
    { space: 'Habitación principal', kind: 'habitacion' as SpaceKind, x: 2, y: 4, w: 4, h: 4 },
    { space: 'Baño', kind: 'bano' as SpaceKind, x: 6, y: 4, w: 2, h: 2 },
    { space: 'Habitación 2', kind: 'habitacion' as SpaceKind, x: 8, y: 3, w: 4, h: 5 },
  ]
  const doors: PlanDoor[] = [
    { a: 'Sala', b: 'Comedor' }, { a: 'Comedor', b: 'Cocina' }, { a: 'Sala', b: 'Balcón' },
    { a: 'Sala', b: 'Habitación principal' }, { a: 'Comedor', b: 'Baño' }, { a: 'Comedor', b: 'Habitación 2' },
  ]
  return { rooms, doors }
}
