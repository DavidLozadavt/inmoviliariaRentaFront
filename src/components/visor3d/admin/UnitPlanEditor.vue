<script setup lang="ts">
// Plano de la unidad: ubicar sus espacios (sala, cocina, baño, habitaciones…) en una cuadrícula
// y conectarlos con puertas. Las puertas son las que el recorrido usa para "Pasar a…".
// Modo Mover: arrastrar / cambiar tamaño. Modo Conectar: tocar un espacio y luego otro (pone o quita la puerta).
import { computed, reactive, ref } from 'vue'
import type { SpaceKind, UnitPlan, PlanRoom } from '@/types/visor3d'
import { PLAN_COLS, PLAN_ROWS, center, connectNeighbors, hasDoor, templatePlan, toggleDoor } from '@/utils/visor3d/plan'
import { SPACE_KINDS, kindIcon, kindLabel, nextSpaceName } from '@/utils/visor3d/spaces'

const props = defineProps<{ plan: UnitPlan; photoCount: Record<string, number>; saving?: boolean }>()
const emit = defineEmits<{ change: [plan: UnitPlan]; build: [room: PlanRoom] }>()

const CELL = 56 // px por celda (el SVG escala al ancho disponible)
const W = PLAN_COLS * CELL
const H = PLAN_ROWS * CELL
const mode = ref<'move' | 'connect'>('move')
const selected = ref<string | null>(props.plan.rooms[0]?.space ?? null)
const connectFrom = ref<string | null>(null)
const svg = ref<SVGSVGElement>()
const KIND_COLOR: Record<string, string> = {
  sala: '#e0a45e', comedor: '#d4935a', cocina: '#7fb3c8', habitacion: '#9d8ec9', bano: '#6fc2b3',
  balcon: '#8fbf6a', estudio: '#c79bd1', lavanderia: '#a3b8c2', patio: '#7fb069', fachada: '#b0a090', otro: '#b8a99a',
}

const sel = computed(() => props.plan.rooms.find((r) => r.space === selected.value) ?? null)
const doors = computed(() => (props.plan.doors ?? []).map((d) => {
  const a = props.plan.rooms.find((r) => r.space === d.a)
  const b = props.plan.rooms.find((r) => r.space === d.b)
  return a && b ? { d, a: center(a), b: center(b) } : null
}).filter((x): x is NonNullable<typeof x> => !!x))

function update(rooms: PlanRoom[], doorsList = props.plan.doors ?? []) {
  const names = new Set(rooms.map((r) => r.space))
  emit('change', { rooms, doors: doorsList.filter((d) => names.has(d.a) && names.has(d.b)) })
}

// ── Arrastrar / cambiar tamaño (en celdas)
let drag: { space: string; mode: 'move' | 'resize'; ox: number; oy: number; start: PlanRoom } | null = null
const ghost = reactive<{ room: PlanRoom | null }>({ room: null })
function cellAt(e: PointerEvent) {
  const r = svg.value!.getBoundingClientRect()
  return { cx: ((e.clientX - r.left) / r.width) * PLAN_COLS, cy: ((e.clientY - r.top) / r.height) * PLAN_ROWS }
}
function start(room: PlanRoom, how: 'move' | 'resize', e: PointerEvent) {
  if (mode.value === 'connect') return clickConnect(room)
  selected.value = room.space
  const { cx, cy } = cellAt(e)
  drag = { space: room.space, mode: how, ox: cx - room.x, oy: cy - room.y, start: { ...room } }
  ghost.room = { ...room }
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
}
function move(e: PointerEvent) {
  if (!drag || !ghost.room) return
  const { cx, cy } = cellAt(e)
  const g = ghost.room
  if (drag.mode === 'move') {
    g.x = Math.max(0, Math.min(PLAN_COLS - g.w, Math.round(cx - drag.ox)))
    g.y = Math.max(0, Math.min(PLAN_ROWS - g.h, Math.round(cy - drag.oy)))
  } else {
    g.w = Math.max(1, Math.min(PLAN_COLS - g.x, Math.round(cx - g.x)))
    g.h = Math.max(1, Math.min(PLAN_ROWS - g.y, Math.round(cy - g.y)))
  }
}
function end() {
  if (drag && ghost.room) {
    const g = ghost.room
    update(props.plan.rooms.map((r) => (r.space === drag!.space ? { ...g } : r)))
  }
  drag = null
  ghost.room = null
}
const shown = (r: PlanRoom) => (ghost.room && drag?.space === r.space ? ghost.room : r)

// ── Conectar
function clickConnect(room: PlanRoom) {
  if (!connectFrom.value) { connectFrom.value = room.space; return }
  if (connectFrom.value !== room.space) update(props.plan.rooms, toggleDoor(props.plan, connectFrom.value, room.space))
  connectFrom.value = null
}

// ── Agregar / quitar / renombrar
function addRoom(kind: SpaceKind) {
  const name = nextSpaceName(kind, props.plan.rooms.map((r) => r.space))
  // primer hueco libre de 3 × 3 (o donde quepa)
  const free = (x: number, y: number, w: number, h: number) => props.plan.rooms.every((r) =>
    x + w <= r.x || r.x + r.w <= x || y + h <= r.y || r.y + r.h <= y)
  let pos = { x: 0, y: 0, w: 3, h: 3 }
  outer: for (const size of [3, 2, 1]) for (let y = 0; y <= PLAN_ROWS - size; y++) for (let x = 0; x <= PLAN_COLS - size; x++) {
    if (free(x, y, size, size)) { pos = { x, y, w: size, h: size }; break outer }
  }
  update([...props.plan.rooms, { space: name, kind, ...pos }])
  selected.value = name
}
function removeRoom(space: string) {
  update(props.plan.rooms.filter((r) => r.space !== space))
  selected.value = null
}
function rename(space: string) {
  const name = window.prompt('Nombre del espacio', space)?.trim()
  if (!name || name === space || props.plan.rooms.some((r) => r.space === name)) return
  update(props.plan.rooms.map((r) => (r.space === space ? { ...r, space: name } : r)),
    (props.plan.doors ?? []).map((d) => ({ a: d.a === space ? name : d.a, b: d.b === space ? name : d.b })))
  selected.value = name
}
function useTemplate() {
  if (props.plan.rooms.length && !window.confirm('¿Reemplazar el plano actual por la plantilla de ejemplo?')) return
  const t = templatePlan()
  emit('change', t)
  selected.value = t.rooms[0].space
}
</script>

<template>
  <div class="upe">
    <div class="bar">
      <div class="seg">
        <button type="button" :class="{ on: mode === 'move' }" @click="mode = 'move'; connectFrom = null">✋ Mover y tamaño</button>
        <button type="button" :class="{ on: mode === 'connect' }" @click="mode = 'connect'">🚪 Conectar espacios</button>
      </div>
      <button type="button" class="ghost" @click="update(plan.rooms, connectNeighbors(plan))">Conectar vecinos</button>
      <button type="button" class="ghost" @click="useTemplate">📐 Plantilla de ejemplo</button>
      <span v-if="saving" class="saving">Guardando…</span>
    </div>
    <p class="hint" v-if="mode === 'connect'">
      {{ connectFrom ? `Ahora toca el espacio que se conecta con «${connectFrom}» (tocar uno ya conectado quita la puerta).` : 'Toca un espacio y luego otro para poner o quitar la puerta entre ellos.' }}
    </p>
    <p class="hint" v-else>Arrastra los espacios para ubicarlos y usa la esquina para cambiar su tamaño.</p>

    <div class="wrap">
      <svg ref="svg" :viewBox="`0 0 ${W} ${H}`" class="grid" @pointermove="move" @pointerup="end" @pointerleave="end">
        <defs>
          <pattern id="cell" :width="CELL" :height="CELL" patternUnits="userSpaceOnUse">
            <path :d="`M ${CELL} 0 L 0 0 0 ${CELL}`" fill="none" stroke="rgba(218,156,95,.14)" stroke-width="1" />
          </pattern>
        </defs>
        <rect :width="W" :height="H" fill="#1c120e" />
        <rect :width="W" :height="H" fill="url(#cell)" />

        <g v-for="r in plan.rooms" :key="r.space" class="room"
          :class="{ sel: selected === r.space, from: connectFrom === r.space, connect: mode === 'connect' }"
          @pointerdown.prevent="start(r, 'move', $event)">
          <rect :x="shown(r).x * CELL + 3" :y="shown(r).y * CELL + 3" :width="shown(r).w * CELL - 6" :height="shown(r).h * CELL - 6"
            rx="8" :fill="(KIND_COLOR[r.kind ?? 'otro'] ?? '#b8a99a') + 'cc'" />
          <text :x="(shown(r).x + shown(r).w / 2) * CELL" :y="(shown(r).y + shown(r).h / 2) * CELL - 6" text-anchor="middle" class="t1">
            {{ kindIcon(r.kind) }} {{ r.space }}
          </text>
          <text :x="(shown(r).x + shown(r).w / 2) * CELL" :y="(shown(r).y + shown(r).h / 2) * CELL + 14" text-anchor="middle" class="t2">
            {{ photoCount[r.space.toLowerCase()] ? `📷 ${photoCount[r.space.toLowerCase()]}` : 'sin fotos' }}
          </text>
          <rect v-if="mode === 'move' && selected === r.space" class="rsz"
            :x="(shown(r).x + shown(r).w) * CELL - 18" :y="(shown(r).y + shown(r).h) * CELL - 18" width="14" height="14" rx="3"
            @pointerdown.prevent.stop="start(r, 'resize', $event)" />
        </g>

        <!-- Puertas -->
        <g v-for="(d, i) in doors" :key="i" class="door">
          <line :x1="d.a.x * CELL" :y1="d.a.y * CELL" :x2="d.b.x * CELL" :y2="d.b.y * CELL" />
          <circle :cx="((d.a.x + d.b.x) / 2) * CELL" :cy="((d.a.y + d.b.y) / 2) * CELL" r="13" />
          <text :x="((d.a.x + d.b.x) / 2) * CELL" :y="((d.a.y + d.b.y) / 2) * CELL + 5" text-anchor="middle">🚪</text>
        </g>
      </svg>

      <aside>
        <span class="lbl">Agregar espacio</span>
        <div class="kinds">
          <button v-for="k in SPACE_KINDS.filter((x) => x.key !== 'fachada')" :key="k.key" type="button" @click="addRoom(k.key)">
            {{ k.icon }} {{ k.label }}
          </button>
        </div>

        <div v-if="sel" class="selbox">
          <strong>{{ kindIcon(sel.kind) }} {{ sel.space }}</strong>
          <small>{{ kindLabel(sel.kind) }} · {{ sel.w }} × {{ sel.h }} celdas · {{ photoCount[sel.space.toLowerCase()] ?? 0 }} foto(s)</small>
          <small>Conectado con:
            {{ plan.rooms.filter((r) => r.space !== sel!.space && hasDoor(plan, sel!.space, r.space)).map((r) => r.space).join(', ') || 'nada todavía' }}</small>
          <button type="button" class="primary" @click="emit('build', sel)">🧊 Armar en 3D / fotos</button>
          <div class="row">
            <button type="button" class="link" @click="rename(sel.space)">Renombrar</button>
            <button type="button" class="link danger" @click="removeRoom(sel.space)">Quitar del plano</button>
          </div>
        </div>
        <p v-else-if="!plan.rooms.length" class="empty">Plano vacío: usa la plantilla de ejemplo o agrega espacios.</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.upe { display: flex; flex-direction: column; gap: 10px; }
.bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.seg { display: inline-flex; background: var(--v3d-surface-2); border-radius: 10px; padding: 3px; }
.seg button { border: 0; background: transparent; color: var(--v3d-muted); padding: 7px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.seg button.on { background: var(--v3d-accent-soft); color: var(--v3d-accent); font-weight: 700; }
.ghost { background: transparent; color: var(--v3d-text); border: 1px solid var(--v3d-border); border-radius: 10px; padding: 7px 12px; cursor: pointer; font-size: 13px; }
.saving { font-size: 12px; color: var(--v3d-accent); }
.hint { color: var(--v3d-muted); font-size: 12px; }
.wrap { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 12px; align-items: start; }
.grid { width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--v3d-border); touch-action: none; user-select: none; }
.room { cursor: grab; }
.room.connect { cursor: pointer; }
.room rect:first-child { stroke: rgba(0,0,0,.35); stroke-width: 2; }
.room.sel rect:first-child { stroke: #fff; stroke-width: 3; }
.room.from rect:first-child { stroke: #4ade80; stroke-width: 4; stroke-dasharray: 8 5; }
.t1 { fill: #1c120e; font-weight: 800; font-size: 14px; pointer-events: none; }
.t2 { fill: rgba(28,18,14,.75); font-size: 11px; pointer-events: none; }
.rsz { fill: #fff; stroke: #da9c5f; stroke-width: 2; cursor: nwse-resize; }
.door line { stroke: #f5efe6; stroke-width: 3; stroke-dasharray: 6 5; pointer-events: none; }
.door circle { fill: #1c120e; stroke: #da9c5f; stroke-width: 2; pointer-events: none; }
.door text { font-size: 13px; pointer-events: none; }
aside { display: flex; flex-direction: column; gap: 8px; }
.lbl { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--v3d-muted); }
.kinds { display: flex; flex-wrap: wrap; gap: 4px; }
.kinds button { border: 1px solid var(--v3d-border); background: transparent; color: var(--v3d-text); border-radius: 999px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
.kinds button:hover { border-color: var(--v3d-accent); }
.selbox { display: flex; flex-direction: column; gap: 6px; border: 1px solid var(--v3d-accent); border-radius: 12px; padding: 12px; background: var(--v3d-accent-soft); }
.selbox small { color: var(--v3d-muted); font-size: 12px; }
.primary { background: linear-gradient(135deg, var(--v3d-accent), var(--v3d-accent-strong)); color: var(--v3d-on-accent); border: 0; border-radius: 10px; padding: 9px 12px; font-weight: 800; cursor: pointer; }
.row { display: flex; gap: 12px; }
.link { background: none; border: 0; color: var(--v3d-accent); cursor: pointer; font-size: 12px; padding: 0; }
.danger { color: #f87171; }
.empty { color: var(--v3d-muted); font-size: 13px; }
@media (max-width: 900px) { .wrap { grid-template-columns: 1fr; } }
</style>
