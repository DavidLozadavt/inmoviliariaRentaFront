<script setup lang="ts">
// Ubicar y dar forma a las torres sobre el plano del conjunto.
// Por torre: mover (arrastrar), rotar (manija de giro), cambiar tamaño (manija de esquina),
// filas por piso (forma de la planta), medidas exactas y fijar (candado).
// Todo se guarda en config.towers[] (offset, rotation, rows, unit_width, unit_depth, locked).
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { TowerConfig } from '@/types/visor3d'
import { type TowerBox, UNIT_D, UNIT_W, towerGrid } from '@/utils/visor3d/layout'

const props = defineProps<{
  planUrl: string
  siteWidth: number          // metros que mide el plano de lado a lado
  towers: TowerConfig[]      // se modifican en sitio
  boxes: TowerBox[]          // posiciones automáticas (torres sin offset)
}>()

const imgEl = ref<HTMLImageElement>()
const size = ref({ w: 1, h: 1 })
const selected = ref(0)
type Mode = 'move' | 'rotate' | 'resize'
let action: { i: number; mode: Mode; dx: number; dz: number } | null = null
const active = ref<Mode | null>(null)

function measure() {
  if (imgEl.value) size.value = { w: imgEl.value.clientWidth, h: imgEl.value.clientHeight }
}
onMounted(() => window.addEventListener('resize', measure))
onBeforeUnmount(() => window.removeEventListener('resize', measure))

const scale = computed(() => size.value.w / Math.max(1, props.siteWidth)) // px por metro
const siteDepth = computed(() => size.value.h / scale.value)
const round1 = (n: number) => Math.round(n * 10) / 10
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/** Medidas actuales de la torre i (en metros) a partir de su configuración. */
function shape(i: number) {
  const t = props.towers[i]
  const { rows, cols } = towerGrid(t)
  const uw = Number(t.unit_width) || UNIT_W
  const ud = Number(t.unit_depth) || UNIT_D
  const b = props.boxes.find((x) => x.code === t.code)
  return {
    rows, cols, uw, ud,
    w: cols * uw,
    d: rows * ud,
    x: t.offset?.x ?? b?.x ?? 0,
    z: t.offset?.z ?? b?.z ?? 0,
    rot: Number(t.rotation) || 0,
  }
}

function boxStyle(i: number) {
  const s = shape(i)
  const w = s.w * scale.value
  const d = s.d * scale.value
  return {
    width: `${w}px`,
    height: `${d}px`,
    left: `${(s.x + props.siteWidth / 2) * scale.value - w / 2}px`,
    top: `${(s.z + siteDepth.value / 2) * scale.value - d / 2}px`,
    // three.js rota en sentido antihorario visto desde arriba; CSS en sentido horario
    transform: `rotate(${-s.rot}deg)`,
    '--cols': s.cols,
    '--rows': s.rows,
  }
}

function toMeters(e: PointerEvent) {
  const r = imgEl.value!.getBoundingClientRect()
  return {
    x: (e.clientX - r.left) / scale.value - props.siteWidth / 2,
    z: (e.clientY - r.top) / scale.value - siteDepth.value / 2,
  }
}

function start(i: number, mode: Mode, e: PointerEvent) {
  selected.value = i
  if (props.towers[i].locked) return
  const p = toMeters(e)
  const s = shape(i)
  action = { i, mode, dx: p.x - s.x, dz: p.z - s.z }
  active.value = mode
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
}

function move(e: PointerEvent) {
  if (!action || !imgEl.value) return
  const t = props.towers[action.i]
  const p = toMeters(e)
  const s = shape(action.i)

  if (action.mode === 'move') {
    t.offset = { x: round1(p.x - action.dx), z: round1(p.z - action.dz) }
    return
  }
  // Vector desde el centro de la torre al puntero (en metros, z hacia abajo en pantalla)
  const vx = p.x - s.x
  const vz = p.z - s.z
  if (action.mode === 'rotate') {
    const cssDeg = (Math.atan2(vx, -vz) * 180) / Math.PI   // 0° = manija arriba, horario
    let deg = -cssDeg
    if (!e.shiftKey) deg = Math.round(deg / 5) * 5           // pasos de 5° (Shift = libre)
    t.rotation = round1(((deg % 360) + 540) % 360 - 180)
    if (!t.offset) t.offset = { x: s.x, z: s.z }
    return
  }
  // Cambiar tamaño: llevar el puntero al sistema local de la torre (sin rotación)
  const a = (-s.rot * Math.PI) / 180 // ángulo CSS en radianes
  const lx = vx * Math.cos(a) + vz * Math.sin(a)
  const lz = -vx * Math.sin(a) + vz * Math.cos(a)
  t.unit_width = round1(clamp((2 * Math.abs(lx)) / s.cols, 2, 40))
  t.unit_depth = round1(clamp((2 * Math.abs(lz)) / s.rows, 2, 40))
  if (!t.offset) t.offset = { x: s.x, z: s.z }
}

function end() {
  action = null
  active.value = null
}

/** Reparte las torres en fila centrada sobre el plano (respeta las fijadas). */
function spread() {
  const n = props.towers.length
  props.towers.forEach((t, i) => {
    if (t.locked) return
    t.offset = { x: Math.round(((i + 0.5) / n - 0.5) * props.siteWidth * 0.6), z: 0 }
  })
}

function resetShape(i: number) {
  const t = props.towers[i]
  t.rotation = null
  t.rows = null
  t.unit_width = null
  t.unit_depth = null
}

const sel = computed(() => props.towers[selected.value])
const selShape = computed(() => (sel.value ? shape(selected.value) : null))
const rowOptions = computed(() => {
  const n = Math.max(1, Number(sel.value?.units_per_floor) || 1)
  return Array.from({ length: Math.min(n, 8) }, (_, i) => i + 1)
})

function setNum(key: 'rotation' | 'unit_width' | 'unit_depth', v: string) {
  const n = Number(v)
  if (!sel.value || !Number.isFinite(n)) return
  sel.value[key] = key === 'rotation' ? clamp(n, -180, 180) : clamp(n, 2, 40)
}
function setPos(axis: 'x' | 'z', v: string) {
  const n = Number(v)
  if (!sel.value || !Number.isFinite(n) || !selShape.value) return
  sel.value.offset = { x: selShape.value.x, z: selShape.value.z, [axis]: n }
}

defineExpose({ spread })
</script>

<template>
  <div class="spe">
    <div class="plan" @pointermove="move" @pointerup="end" @pointerleave="end">
      <img ref="imgEl" :src="planUrl" alt="Plano del conjunto" draggable="false" @load="measure" />
      <div
        v-for="(t, i) in towers"
        :key="t.code + i"
        class="tw"
        :class="{ on: selected === i, locked: t.locked, dragging: active && selected === i }"
        :style="boxStyle(i)"
        @pointerdown.prevent="start(i, 'move', $event)"
      >
        <span class="grid" />
        <span class="lbl">{{ t.code }}<template v-if="t.locked"> 🔒</template></span>
        <template v-if="selected === i && !t.locked">
          <span class="rot-stem" />
          <span class="rot" title="Girar (Shift = sin pasos)" @pointerdown.prevent.stop="start(i, 'rotate', $event)">⟳</span>
          <span class="rsz" title="Cambiar tamaño" @pointerdown.prevent.stop="start(i, 'resize', $event)" />
        </template>
      </div>
    </div>

    <div v-if="sel && selShape" class="panel">
      <div class="tabs">
        <button v-for="(t, i) in towers" :key="t.code + i" type="button" :class="{ on: selected === i }" @click="selected = i">
          {{ t.code }}<template v-if="t.locked"> 🔒</template>
        </button>
      </div>
      <div class="fields">
        <label>X (m)<input type="number" step="0.5" :value="selShape.x" :disabled="!!sel.locked" @change="setPos('x', ($event.target as HTMLInputElement).value)" /></label>
        <label>Z (m)<input type="number" step="0.5" :value="selShape.z" :disabled="!!sel.locked" @change="setPos('z', ($event.target as HTMLInputElement).value)" /></label>
        <label>Rotación (°)<input type="number" step="1" :value="selShape.rot" :disabled="!!sel.locked" @change="setNum('rotation', ($event.target as HTMLInputElement).value)" /></label>
        <label>Filas por piso
          <select :value="selShape.rows" :disabled="!!sel.locked" @change="sel.rows = Number(($event.target as HTMLSelectElement).value)">
            <option v-for="r in rowOptions" :key="r" :value="r">{{ r }} × {{ Math.ceil((Number(sel.units_per_floor) || 1) / r) }}</option>
          </select>
        </label>
        <label>Ancho unidad (m)<input type="number" step="0.5" min="2" max="40" :value="selShape.uw" :disabled="!!sel.locked" @change="setNum('unit_width', ($event.target as HTMLInputElement).value)" /></label>
        <label>Fondo unidad (m)<input type="number" step="0.5" min="2" max="40" :value="selShape.ud" :disabled="!!sel.locked" @change="setNum('unit_depth', ($event.target as HTMLInputElement).value)" /></label>
      </div>
      <p class="meta">Planta: {{ selShape.w.toFixed(1) }} × {{ selShape.d.toFixed(1) }} m · {{ selShape.cols }} × {{ selShape.rows }} unidades por piso</p>
      <div class="acts">
        <button type="button" class="lock" :class="{ on: sel.locked }" @click="sel.locked = !sel.locked">
          {{ sel.locked ? '🔒 Fijada (clic para soltar)' : '🔓 Fijar en el plano' }}
        </button>
        <button type="button" class="link" :disabled="!!sel.locked" @click="resetShape(selected)">Restablecer forma</button>
      </div>
    </div>
    <p class="hint">Clic en una torre para elegirla. Arrástrala para moverla, usa ⟳ para girarla y la esquina para cambiar su tamaño.
      Cuando calce con el plano, fíjala.</p>
  </div>
</template>

<style scoped>
.spe { display: flex; flex-direction: column; gap: 8px; }
.plan { position: relative; border-radius: 10px; overflow: visible; margin-top: 44px; border: 1px solid var(--v3d-border); touch-action: none; user-select: none; background: #000; }
.plan img { display: block; width: 100%; height: auto; pointer-events: none; border-radius: 10px; }
.tw { position: absolute; min-width: 10px; min-height: 10px; border: 2px solid #da9c5f; background: rgba(218, 156, 95, .35); border-radius: 3px; cursor: grab; box-shadow: 0 2px 8px rgba(0,0,0,.4); transform-origin: center center; }
.tw.on { border-color: #fff; background: rgba(218, 156, 95, .5); z-index: 2; }
.tw.dragging { cursor: grabbing; }
.tw.locked { cursor: pointer; border-style: dashed; background: rgba(34, 197, 94, .3); border-color: #4ade80; }
.grid { position: absolute; inset: 0; pointer-events: none; opacity: .55;
  background-image:
    linear-gradient(to right, rgba(28,18,14,.55) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(28,18,14,.55) 1px, transparent 1px);
  background-size: calc(100% / var(--cols)) 100%, 100% calc(100% / var(--rows)); }
.lbl { position: absolute; inset: 0; display: grid; place-items: center; font-weight: 800; font-size: 11px; color: #1c120e; pointer-events: none; text-shadow: 0 0 3px rgba(255,255,255,.7); }
.rot-stem { position: absolute; left: 50%; top: -22px; width: 2px; height: 22px; background: #fff; transform: translateX(-50%); pointer-events: none; }
.rot { position: absolute; left: 50%; top: -40px; width: 22px; height: 22px; margin-left: -11px; border-radius: 50%; background: #fff; color: #1c120e; display: grid; place-items: center; font-size: 14px; cursor: grab; box-shadow: 0 2px 6px rgba(0,0,0,.4); }
.rsz { position: absolute; right: -8px; bottom: -8px; width: 16px; height: 16px; border-radius: 3px; background: #fff; border: 2px solid #da9c5f; cursor: nwse-resize; }
.panel { border: 1px solid var(--v3d-border); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,.18); }
.tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.tabs button { border: 1px solid var(--v3d-border); background: transparent; color: var(--v3d-text); border-radius: 7px; padding: 4px 10px; font-size: 12px; cursor: pointer; font-weight: 700; }
.tabs button.on { background: var(--v3d-accent); color: var(--v3d-on-accent); border-color: var(--v3d-accent); }
.fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.fields label { display: flex; flex-direction: column; gap: 3px; font-size: 11px; color: var(--v3d-muted); }
.fields input, .fields select { padding: 6px 8px; border: 1px solid var(--v3d-border); border-radius: 7px; background: var(--v3d-surface-2); color: var(--v3d-text); font-size: 13px; min-width: 0; }
.fields input:disabled, .fields select:disabled { opacity: .5; }
.meta { font-size: 12px; color: var(--v3d-muted); }
.acts { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.lock { border: 1px solid var(--v3d-border); background: transparent; color: var(--v3d-text); border-radius: 8px; padding: 7px 12px; cursor: pointer; font-size: 13px; }
.lock.on { border-color: #4ade80; color: #4ade80; background: rgba(34,197,94,.12); }
.link { background: none; border: 0; color: var(--v3d-accent); cursor: pointer; font-size: 13px; }
.link:disabled { opacity: .4; }
.hint { color: var(--v3d-muted); font-size: 12px; line-height: 1.5; }
@media (max-width: 520px) { .fields { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
