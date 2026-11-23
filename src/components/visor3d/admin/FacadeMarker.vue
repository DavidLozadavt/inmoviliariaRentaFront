<script setup lang="ts">
// Marcar las caras de la torre sobre fotos: frente (obligatoria), costado derecho, costado izquierdo,
// parte trasera y techo. Cada cara puede venir de una foto distinta (la trasera casi siempre es otra foto).
// Se marcan 4 esquinas, el navegador corrige la perspectiva y se suben como texturas del modelo 3D.
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { type Pt, type Quad, estimateFloors, loadImage, quadAspect, warpQuad } from '@/utils/visor3d/warp'

type Face = 'front' | 'side' | 'left' | 'back' | 'roof'
const FACES: { key: Face; label: string; color: string; hint: string }[] = [
  { key: 'front', label: 'Frente', color: '#da9c5f', hint: 'La fachada principal (obligatoria)' },
  { key: 'side', label: 'Costado derecho', color: '#60a5fa', hint: 'El lado que se ve a la derecha' },
  { key: 'left', label: 'Costado izquierdo', color: '#a78bfa', hint: 'Si no la marcas, copia el derecho' },
  { key: 'back', label: 'Parte trasera', color: '#34d399', hint: 'Si no la marcas, copia el frente' },
  { key: 'roof', label: 'Techo', color: '#f472b6', hint: 'Foto aérea o de dron; si no, se usa el color de techo' },
]

export interface FacadeResult {
  faces: Partial<Record<Face, Blob | null>>   // Blob = nueva, null = quitar, ausente = sin cambios
  frontAspect: number | null                   // alto / ancho de la cara frontal
  sideAspect: number | null
  floors: number | null                        // pisos que la persona confirmó (prellenado con la detección)
}

const props = defineProps<{
  imageUrl: string
  saving?: boolean
  title?: string
  existing?: Partial<Record<Face, string | null | undefined>>
  currentFloors?: number | null
}>()
const emit = defineEmits<{ save: [result: FacadeResult]; close: [] }>()

interface FaceState {
  mode: 'keep' | 'mark' | 'none'   // keep = dejar la que tiene, mark = marcar ahora, none = sin textura
  src: string                       // foto sobre la que se marca esta cara
  img: HTMLImageElement | null
  quad: Quad
  preview: string
}
const zero = (): Quad => [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]
const state = reactive<Record<Face, FaceState>>(Object.fromEntries(FACES.map((f) => [f.key, {
  mode: f.key === 'front' ? 'mark' : props.existing?.[f.key] ? 'keep' : 'none',
  src: props.imageUrl, img: null, quad: zero(), preview: '',
}])) as Record<Face, FaceState>)

const face = ref<Face>('front')
// Pisos: lo confirma la persona; la detección solo prellena si encuentra un patrón claro
const floorsInput = ref<number | null>(props.currentFloors || null)
const detected = ref<number | null>(null)
const cur = computed(() => state[face.value])
const box = ref<HTMLDivElement>()
const size = reactive({ w: 1, h: 1 })
const err = ref('')
const LABELS = ['Arriba izq.', 'Arriba der.', 'Abajo der.', 'Abajo izq.']

function defaultQuad(f: Face, W: number, H: number): Quad {
  if (f === 'roof') return [{ x: W * 0.3, y: H * 0.2 }, { x: W * 0.7, y: H * 0.2 }, { x: W * 0.7, y: H * 0.6 }, { x: W * 0.3, y: H * 0.6 }]
  if (f === 'side') return [{ x: W * 0.55, y: H * 0.12 }, { x: W * 0.72, y: H * 0.16 }, { x: W * 0.72, y: H * 0.82 }, { x: W * 0.55, y: H * 0.85 }]
  if (f === 'left') return [{ x: W * 0.28, y: H * 0.16 }, { x: W * 0.45, y: H * 0.12 }, { x: W * 0.45, y: H * 0.85 }, { x: W * 0.28, y: H * 0.82 }]
  return [{ x: W * 0.25, y: H * 0.12 }, { x: W * 0.75, y: H * 0.12 }, { x: W * 0.75, y: H * 0.85 }, { x: W * 0.25, y: H * 0.85 }]
}

async function ensureImage(f: Face) {
  const st = state[f]
  if (st.img && st.img.src.endsWith(st.src)) return
  try {
    st.img = await loadImage(st.src)
    st.quad = defaultQuad(f, st.img.naturalWidth, st.img.naturalHeight)
    render(f)
  } catch (e) {
    err.value = (e as Error).message
  }
}

async function selectFace(f: Face) {
  face.value = f
  if (state[f].mode === 'keep' || state[f].mode === 'none') state[f].mode = 'mark'
  await ensureImage(f)
  requestAnimationFrame(measure)
}

function onFaceFile(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  ;(ev.target as HTMLInputElement).value = ''
  if (!file) return
  const st = cur.value
  st.src = URL.createObjectURL(file)
  st.img = null
  ensureImage(face.value).then(() => requestAnimationFrame(measure))
}

onMounted(async () => {
  await ensureImage('front')
  measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))

function measure() {
  const el = box.value?.querySelector('img')
  if (el) { size.w = el.clientWidth; size.h = el.clientHeight }
}
const scale = computed(() => (cur.value.img ? size.w / cur.value.img.naturalWidth : 1))
const toScreen = (p: Pt) => ({ x: p.x * scale.value, y: p.y * scale.value })
const poly = (q: Quad) => q.map((p) => { const s = toScreen(p); return `${s.x},${s.y}` }).join(' ')

let drag: number | null = null
function startDrag(i: number, e: PointerEvent) {
  drag = i
  ;(e.target as Element).setPointerCapture(e.pointerId)
}
function onMove(e: PointerEvent) {
  const st = cur.value
  if (drag === null || !st.img) return
  const r = box.value!.querySelector('img')!.getBoundingClientRect()
  st.quad[drag] = {
    x: Math.min(Math.max(0, (e.clientX - r.left) / scale.value), st.img.naturalWidth),
    y: Math.min(Math.max(0, (e.clientY - r.top) / scale.value), st.img.naturalHeight),
  }
}
function endDrag() {
  if (drag !== null) render(face.value)
  drag = null
}

function out(f: Face, w: number) {
  const st = state[f]
  const h = Math.round(Math.min(2048, Math.max(256, w * quadAspect(st.quad))))
  return warpQuad(st.img!, st.quad, w, h)
}
function render(f: Face) {
  if (!state[f].img) return
  try {
    const c = out(f, 220)
    state[f].preview = c.toDataURL('image/jpeg', 0.8)
    if (f === 'front') {
      detected.value = estimateFloors(out(f, 512))

    }
  } catch {
    err.value = 'El navegador no deja leer esta foto (CORS). Vuelve a subirla.'
  }
}

const blob = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) =>
  c.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo generar la textura'))), 'image/webp', 0.85))

async function save() {
  const faces: FacadeResult['faces'] = {}
  let frontCanvas: HTMLCanvasElement | null = null
  for (const f of FACES) {
    const st = state[f.key]
    if (st.mode === 'mark' && st.img) {
      const c = out(f.key, f.key === 'front' || f.key === 'back' ? 1024 : 640)
      if (f.key === 'front') frontCanvas = c
      faces[f.key] = await blob(c)
    } else if (st.mode === 'none' && props.existing?.[f.key]) {
      faces[f.key] = null
    }
  }
  emit('save', {
    faces,
    frontAspect: state.front.mode === 'mark' ? quadAspect(state.front.quad) : null,
    sideAspect: state.side.mode === 'mark' ? quadAspect(state.side.quad) : state.left.mode === 'mark' ? quadAspect(state.left.quad) : null,
    floors: frontCanvas && floorsInput.value ? Math.max(1, Math.min(80, Math.round(floorsInput.value))) : null,
  })
}

const color = computed(() => FACES.find((f) => f.key === face.value)!.color)
const canSave = computed(() => state.front.mode === 'mark' ? !!state.front.img : state.front.mode === 'keep')
</script>

<template>
  <div class="fm" role="dialog" aria-modal="true" aria-label="Marcar fachada">
    <header>
      <div>
        <strong>Fachada en 3D{{ title ? ' · ' + title : '' }}</strong>
        <small>Elige una cara, arrastra sus 4 esquinas sobre la foto (sin calle ni cielo). Cada cara puede usar otra foto.</small>
      </div>
      <button type="button" class="x" aria-label="Cerrar" @click="emit('close')">✕</button>
    </header>

    <div class="body">
      <div class="photo" @pointermove="onMove" @pointerup="endDrag" @pointerleave="endDrag">
        <div v-if="cur.mode === 'mark'" ref="box" class="box">
          <img v-if="cur.img" :src="cur.src" alt="Foto" crossorigin="anonymous" @load="measure" />
          <svg v-if="cur.img" :width="size.w" :height="size.h">
            <polygon :points="poly(cur.quad)" class="q" :style="{ stroke: color, fill: color + '22' }" />
            <circle v-for="(p, i) in cur.quad" :key="i" :cx="toScreen(p).x" :cy="toScreen(p).y" r="11" class="h"
              :style="{ fill: color }" @pointerdown.prevent="startDrag(i, $event)"><title>{{ LABELS[i] }}</title></circle>
          </svg>
        </div>
        <div v-else class="off">
          <p v-if="cur.mode === 'keep'">Esta cara conserva la textura que ya tiene.</p>
          <p v-else>Esta cara no lleva foto{{ face === 'roof' ? ': se usa el color de techo' : face === 'left' ? ': copia el costado derecho' : face === 'back' ? ': copia el frente' : '' }}.</p>
          <button type="button" class="primary" @click="cur.mode = 'mark'; ensureImage(face)">Marcar esta cara</button>
        </div>
        <p v-if="err" class="err">{{ err }}</p>
      </div>

      <aside class="side-panel">
        <button v-for="f in FACES" :key="f.key" type="button" class="face" :class="{ on: face === f.key }" @click="selectFace(f.key)">
          <i :style="{ background: f.color }" />
          <span class="fi">
            <strong>{{ f.label }}</strong>
            <small>{{ state[f.key].mode === 'mark' ? 'Marcando' : state[f.key].mode === 'keep' ? 'Ya tiene foto' : f.hint }}</small>
          </span>
          <img v-if="state[f.key].mode === 'mark' && state[f.key].preview" :src="state[f.key].preview" alt="" />
          <img v-else-if="state[f.key].mode === 'keep' && existing?.[f.key]" :src="existing[f.key]!" alt="" />
        </button>

        <label class="floors">¿Cuántos pisos tiene esta torre?
          <input v-model.number="floorsInput" type="number" min="1" max="80" placeholder="Cuéntalos en la foto" />
          <small>Cuenta los pisos con apartamentos en la foto (sin lobby ni terraza).
            <button v-if="detected && detected !== floorsInput" type="button" class="hintbtn" @click="floorsInput = detected">Posible: {{ detected }} · usar</button></small>
        </label>

        <div class="cur-acts">
          <label class="secondary">Usar otra foto para {{ FACES.find((f) => f.key === face)!.label.toLowerCase() }}
            <input type="file" accept="image/*" hidden @change="onFaceFile" />
          </label>
          <button v-if="face !== 'front' && cur.mode !== 'none'" type="button" class="link" @click="cur.mode = 'none'">
            {{ existing?.[face] ? 'Quitar esta cara' : 'No marcar esta cara' }}
          </button>
        </div>

        <div class="acts">
          <button type="button" class="secondary" @click="emit('close')">Cancelar</button>
          <button type="button" class="primary" :disabled="saving || !canSave" @click="save">{{ saving ? 'Guardando…' : 'Usar en el 3D' }}</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.fm { position: fixed; inset: 0; z-index: 100000; background: #140d0a; color: #f5efe6; display: flex; flex-direction: column; }
header { display: flex; justify-content: space-between; gap: 12px; padding: 12px 18px; border-bottom: 1px solid rgba(218,156,95,.2); }
header div { display: flex; flex-direction: column; gap: 3px; }
header small { color: #c2ad99; font-size: 13px; }
.x { background: none; border: 0; color: #fff; font-size: 20px; cursor: pointer; }
.body { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 320px; }
.photo { position: relative; overflow: auto; display: grid; place-items: center; padding: 16px; touch-action: none; }
.box { position: relative; display: inline-block; }
.box img { display: block; max-width: min(100%, 1100px); max-height: calc(100vh - 140px); user-select: none; -webkit-user-drag: none; }
.box svg { position: absolute; inset: 0; overflow: visible; }
.q { stroke-width: 3; }
.h { cursor: grab; stroke: #1c120e; stroke-width: 3; }
.off { display: flex; flex-direction: column; align-items: center; gap: 12px; color: #c2ad99; text-align: center; }
.side-panel { border-left: 1px solid rgba(218,156,95,.2); padding: 14px; display: flex; flex-direction: column; gap: 8px; overflow: auto; background: rgba(28,18,14,.9); }
.face { display: flex; align-items: center; gap: 10px; text-align: left; border: 1px solid rgba(218,156,95,.25); background: transparent; color: #f5efe6; border-radius: 10px; padding: 8px; cursor: pointer; }
.face.on { border-color: #da9c5f; background: rgba(218,156,95,.14); }
.face i { width: 12px; height: 12px; border-radius: 50%; flex: none; }
.fi { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.fi small { color: #c2ad99; font-size: 11px; }
.face img { width: 44px; height: 56px; object-fit: cover; border-radius: 4px; background: #000; flex: none; }
.floors { display: flex; flex-direction: column; gap: 4px; font-size: 13px; margin-top: 6px; padding: 10px; border: 1px solid rgba(218,156,95,.3); border-radius: 10px; }
.floors input { padding: 7px 9px; border-radius: 8px; border: 1px solid rgba(218,156,95,.35); background: #2c1b14; color: #f5efe6; }
.floors small { color: #c2ad99; font-size: 11px; }
.hintbtn { margin-left: 4px; background: none; border: 1px dashed rgba(218,156,95,.5); color: #da9c5f; border-radius: 6px; padding: 1px 6px; font-size: 11px; cursor: pointer; }
.cur-acts { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.err { color: #f87171; margin-top: 8px; }
.acts { display: flex; gap: 8px; margin-top: auto; padding-top: 10px; }
.primary { flex: 1; background: linear-gradient(135deg, #da9c5f, #c9853d); color: #2b1a0e; border: 0; border-radius: 10px; padding: 10px 14px; font-weight: 700; cursor: pointer; }
.primary:disabled { opacity: .6; }
.secondary { background: transparent; color: #f5efe6; border: 1px solid rgba(218,156,95,.3); border-radius: 10px; padding: 9px 12px; cursor: pointer; font-size: 13px; text-align: center; }
.link { background: none; border: 0; color: #f87171; cursor: pointer; font-size: 13px; }
@media (max-width: 860px) { .body { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; } .side-panel { border-left: 0; border-top: 1px solid rgba(218,156,95,.2); max-height: 45vh; } }
</style>
