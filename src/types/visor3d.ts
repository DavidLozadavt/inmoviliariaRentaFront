// Visor 3D de edificios — tipos compartidos (respuesta de /api/buildings/{id}/config)

export type SpecialKind = 'lobby' | 'parking' | 'terrace' | 'amenities'
export type CommercialStatus = 'available' | 'reserved' | 'rented' | 'sold'
export type ArrearsBucket = 'ok' | 'lt60' | 'gt60'
export type ColorMode = 'commercial' | 'arrears' | 'pqrs'

export interface TowerConfig {
  code: string
  name?: string | null
  floors: number
  units_per_floor: number
  layout?: string[] | null
  offset?: { x?: number; z?: number } | null   // posición sobre el plano (m desde el centro)
  rotation?: number | null                     // grados
  rows?: number | null                         // filas de unidades por piso (forma de la planta)
  unit_width?: number | null                   // ancho de cada unidad (m)
  unit_depth?: number | null                   // fondo de cada unidad (m)
  locked?: boolean | null                      // fijada en el plano (no se arrastra)
  // Solo lectura (las escribe el backend al subir imágenes de la torre)
  photo_url?: string | null
  facade_front_url?: string | null
  facade_side_url?: string | null
  facade_left_url?: string | null
  facade_back_url?: string | null
  roof_url?: string | null
}

export interface SpecialFloor {
  tower?: string | null
  floor: number
  kind: SpecialKind
}

export interface BuildingConfig {
  floor_height: number
  colors?: Record<string, string> | null
  towers: TowerConfig[]
  special_floors?: SpecialFloor[] | null
  site?: { width?: number | null } | null   // ancho real (m) del plano del conjunto
  unit_plans?: Record<string, UnitPlan> | null  // "type-<id>" / "unit-<id>" (solo lectura en el editor de estructura)
}

export interface UnitType {
  id?: number
  code: string
  name?: string | null
  area_m2?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  color?: string | null
}

export interface Unit {
  id: number
  tower: string
  floor: number
  unit_code: string
  unit_type: string | null
  title: string
  area_m2: number
  bedrooms: number
  bathrooms: number
  price: number
  commercial_status: CommercialStatus
  // Solo en modo privado
  tenant?: { id: number; name: string } | null
  contract_id?: number | null
  arrears_days?: number
  arrears_bucket?: ArrearsBucket
  open_requests?: number
}

export interface BuildingPayload {
  building: {
    id: number; name: string; address?: string | null; city?: string | null; version: number
    cover_url?: string | null; preview_url?: string | null
    facade_front_url?: string | null; facade_side_url?: string | null
    facade_left_url?: string | null; facade_back_url?: string | null; roof_url?: string | null
    site_plan_url?: string | null
  }
  config: BuildingConfig
  unit_types: UnitType[]
  units: Unit[]
}

export interface BuildingSummary {
  id: number
  name: string
  address?: string | null
  city?: string | null
  units_count: number
  available_count: number
  towers: number
  max_floors: number
  cover_url: string | null
  preview_url: string | null
  created_at?: string
  updated_at: string
}

export interface TourLink {
  id?: number
  target: number
  yaw: number
  pitch: number
  label?: string | null
}

export type SpaceKind =
  | 'sala' | 'comedor' | 'cocina' | 'habitacion' | 'bano' | 'balcon'
  | 'estudio' | 'lavanderia' | 'patio' | 'fachada' | 'otro'

export type Surface = 'front' | 'right' | 'back' | 'left' | 'floor' | 'ceiling' | 'detail'

export interface PanoramaNode {
  id: number
  space: string
  kind?: SpaceKind | null
  projection?: 'equirect' | 'flat'
  surface?: Surface | null   // qué muestra la foto normal dentro del espacio
  url: string
  thumb: string | null
  width: number | null
  size_kb: number | null
  is_start: boolean
  order: number
  links: TourLink[]
  owner?: { kind: 'type' | 'unit'; id: number }
}

/** Plano de la unidad: espacios en una cuadrícula de 12 × 8 y puertas que los conectan. */
export interface PlanRoom { space: string; kind?: SpaceKind | null; x: number; y: number; w: number; h: number }
export interface PlanDoor { a: string; b: string }
export interface UnitPlan { rooms: PlanRoom[]; doors?: PlanDoor[] }

export interface Tour {
  unit_id: number
  plan?: UnitPlan | null
  source: 'unit' | 'type' | null
  start: number | null
  nodes: PanoramaNode[]
}

export interface PublicLink {
  active: boolean
  url?: string
  embed_url?: string
  iframe?: string
  expires_at?: string | null
}
