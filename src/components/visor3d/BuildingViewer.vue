<script setup lang="ts">
// Visor completo: escena 3D (o plano 2D), modos de color, filtros, pisos, ficha y recorrido.
// Lo usan la vista privada (dueño/administración) y la pública (enlace compartido / iframe).
import { computed, defineAsyncComponent, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import type { BuildingPayload, ColorMode, CommercialStatus, Tour, Unit } from '@/types/visor3d'
import { buildLayout, type Slot, slotKey } from '@/utils/visor3d/layout'
import { FILTERED, LEGENDS, MODE_LABELS, STATUS_LABELS, formatCOP, unitColor } from '@/utils/visor3d/colors'
import { supportsWebGL } from '@/utils/visor3d/device'
import FloorPlan2D from './FloorPlan2D.vue'
import UnitCard from './UnitCard.vue'

const BuildingScene = defineAsyncComponent(() => import('./BuildingScene.vue'))
const FloorScene = defineAsyncComponent(() => import('./FloorScene.vue'))
const PanoramaTour = defineAsyncComponent(() => import('./PanoramaTour.vue'))

const props = defineProps<{
  payload: BuildingPayload
  isPublic?: boolean
  loadTour: (unitId: number) => Promise<Tour>
  saveUnit?: (unitId: number, data: { commercial_status: CommercialStatus; monthly_price: number }) => Promise<void>
  live?: boolean                 // la vista refresca los datos sola (muestra "En vivo")
  initialUnitId?: number         // marca el piso de esta unidad al abrir
  initialView?: '3d' | 'floor'   // con initialUnitId: 'floor' abre la planta con la unidad seleccionada (por defecto)
}>()

const modes = computed<ColorMode[]>(() => (props.isPublic ? ['commercial'] : ['commercial', 'arrears', 'pqrs']))
const mode = ref<ColorMode>('commercial')
const webgl = ref(supportsWebGL())
const view = ref<'3d' | 'floor' | '2d'>(webgl.value ? '3d' : '2d')
// Fachada real (si el edificio tiene la foto marcada) o colores de disponibilidad
const hasFacade = computed(() => !!props.payload.building.facade_front_url || props.payload.config.towers.some((t) => t.facade_front_url))
const look = ref<'facade' | 'colors'>(hasFacade.value ? 'facade' : 'colors')

const filters = reactive({ tower: '', floor: '' as string | number, type: '', min: null as number | null, max: null as number | null })
const selectedFloor = ref<{ tower: string; floor: number } | null>(null)
const selectedKey = ref<string | null>(null)

const typeCodes = computed(() => props.payload.unit_types.map((t) => t.code))
const layout = shallowRef(buildLayout(props.payload.config, typeCodes.value))
const configKey = computed(() => JSON.stringify([props.payload.config, typeCodes.value]))
watch(configKey, () => {
  layout.value = buildLayout(props.payload.config, typeCodes.value)
})

const unitsByKey = computed(() => new Map(props.payload.units.map((u) => [slotKey(u.tower, u.unit_code), u])))

function matches(s: Slot, u: Unit | undefined) {
  if (filters.tower && s.tower !== filters.tower) return false
  if (filters.floor !== '' && s.floor !== Number(filters.floor)) return false
  if (filters.type && (u?.unit_type ?? s.type_code) !== filters.type) return false
  if (filters.min != null && (!u || u.price < filters.min)) return false
  if (filters.max != null && (!u || u.price > filters.max)) return false
  return true
}

const colors = computed(() =>
  layout.value.slots.map((s) => {
    const u = unitsByKey.value.get(s.key)
    return matches(s, u) ? unitColor(u, mode.value) : FILTERED
  }),
)

const labels = computed(() =>
  Object.fromEntries(layout.value.slots.map((s) => {
    const u = unitsByKey.value.get(s.key)
    return [s.key, u ? `${s.unit_code} · ${STATUS_LABELS[u.commercial_status]} · ${formatCOP(u.price)}` : `${s.unit_code} · sin vincular`]
  })),
)

const floorsOf = (tower: string) =>
  [...new Set(layout.value.slots.filter((s) => s.tower === tower).map((s) => s.floor))].sort((a, b) => b - a)
const allFloors = computed(() => [...new Set(layout.value.slots.map((s) => s.floor))].sort((a, b) => a - b))

const selectedSlot = computed(() => layout.value.slots.find((s) => s.key === selectedKey.value) ?? null)
const selectedUnit = computed(() => (selectedKey.value ? unitsByKey.value.get(selectedKey.value) ?? null : null))
const floorSlots = computed(() =>
  selectedFloor.value
    ? layout.value.slots.filter((s) => s.tower === selectedFloor.value!.tower && s.floor === selectedFloor.value!.floor)
    : [],
)

// ── Etiqueta al pasar el mouse sobre una unidad
const hover = ref<{ slot: Slot; x: number; y: number } | null>(null)
const hoverUnit = computed(() => (hover.value ? unitsByKey.value.get(hover.value.slot.key) ?? null : null))

// ── Planta del piso
const floorColors = computed(() => floorSlots.value.map((s) => colors.value[layout.value.slots.indexOf(s)]))
const footprint = computed(() => {
  const t = layout.value.towers.find((x) => x.code === selectedFloor.value?.tower)
  return t ? { x: t.x, z: t.z, w: t.w, d: t.d } : { x: 0, z: 0, w: 10, d: 10 }
})
const towerFloors = computed(() => (selectedFloor.value ? floorsOf(selectedFloor.value.tower).slice().reverse() : []))

function openFloor(floor?: number) {
  if (floor !== undefined && selectedFloor.value) selectedFloor.value = { tower: selectedFloor.value.tower, floor }
  if (!selectedFloor.value) {
    const t = layout.value.towers[0]
    if (!t) return
    selectedFloor.value = { tower: t.code, floor: floorsOf(t.code).slice(-1)[0] ?? 1 }
  }
  selectedKey.value = null
  view.value = 'floor'
}

// ── Contadores (piso seleccionado o edificio completo)
const scopeUnits = computed(() =>
  (selectedFloor.value ? floorSlots.value : layout.value.slots)
    .map((s) => unitsByKey.value.get(s.key))
    .filter((u): u is Unit => !!u),
)
const counters = computed(() => {
  const c = { available: 0, reserved: 0, taken: 0 }
  for (const u of scopeUnits.value) {
    if (u.commercial_status === 'available') c.available++
    else if (u.commercial_status === 'reserved') c.reserved++
    else c.taken++
  }
  return c
})
const takenLabel = computed(() => (props.payload.units.some((u) => u.commercial_status === 'sold') ? 'Vendidas' : 'Arrendadas'))

const legendCounts = computed(() => {
  const counts: Record<string, number> = {}
  const colorKey = new Map(LEGENDS[mode.value].map((l) => [l.color, l.key]))
  for (const s of layout.value.slots) {
    const u = unitsByKey.value.get(s.key)
    if (!u) continue
    const k = colorKey.get(unitColor(u, mode.value))
    if (k) counts[k] = (counts[k] ?? 0) + 1
  }
  return counts
})

// Clic en 3D: primero el piso, luego la unidad
function onPick(slot: Slot | null) {
  if (!slot) {
    selectedKey.value = null
    return
  }
  const sameFloor = selectedFloor.value?.tower === slot.tower && selectedFloor.value?.floor === slot.floor
  if (!sameFloor) {
    selectedFloor.value = { tower: slot.tower, floor: slot.floor }
    selectedKey.value = null
  } else {
    selectedKey.value = slot.key
  }
}

function pickUnit(slot: Slot) {
  selectedFloor.value = { tower: slot.tower, floor: slot.floor }
  selectedKey.value = slot.key
}

function selectFloor(sel: { tower: string; floor: number }) {
  selectedFloor.value = sel
  selectedKey.value = null
}

function clearSelection() {
  selectedFloor.value = null
  selectedKey.value = null
}

function resetFilters() {
  Object.assign(filters, { tower: '', floor: '', type: '', min: null, max: null })
}

onMounted(() => {
  const u = props.initialUnitId ? props.payload.units.find((x) => x.id === props.initialUnitId) : undefined
  const slot = u && layout.value.slots.find((s) => s.key === slotKey(u.tower, u.unit_code))
  if (slot) {
    selectedFloor.value = { tower: slot.tower, floor: slot.floor }
    if (props.initialView === '3d') return // edificio con el piso marcado; el usuario elige
    selectedKey.value = slot.key
    if (webgl.value) view.value = 'floor'
  }
})

// ── Recorrido 360°
const tour = ref<Tour | null>(null)
const tourLoading = ref(false)
const tourError = ref('')
async function enter() {
  if (!selectedUnit.value) return
  tourLoading.value = true
  tourError.value = ''
  try {
    tour.value = await props.loadTour(selectedUnit.value.id)
  } catch {
    tourError.value = 'No se pudo cargar el recorrido.'
  } finally {
    tourLoading.value = false
  }
}

// ── Edición rápida desde la ficha
const saving = ref(false)
async function onSave(data: { commercial_status: CommercialStatus; monthly_price: number }) {
  if (!props.saveUnit || !selectedUnit.value) return
  saving.value = true
  try {
    await props.saveUnit(selectedUnit.value.id, data)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="viewer">
    <div class="toolbar">
      <div class="modes" role="tablist" aria-label="Modo de color">
        <button
          v-for="m in modes"
          :key="m"
          type="button"
          role="tab"
          :aria-selected="mode === m"
          :class="{ on: mode === m }"
          @click="mode = m"
        >{{ MODE_LABELS[m] }}</button>
      </div>

      <div class="filters">
        <select v-model="filters.tower" aria-label="Torre">
          <option value="">Todas las torres</option>
          <option v-for="t in layout.towers" :key="t.code" :value="t.code">{{ t.name }}</option>
        </select>
        <select v-model="filters.floor" aria-label="Piso">
          <option value="">Todos los pisos</option>
          <option v-for="f in allFloors" :key="f" :value="f">Piso {{ f }}</option>
        </select>
        <select v-model="filters.type" aria-label="Tipo">
          <option value="">Todos los tipos</option>
          <option v-for="t in payload.unit_types" :key="t.code" :value="t.code">Tipo {{ t.code }}</option>
        </select>
        <input v-model.number="filters.min" type="number" min="0" step="100000" placeholder="Precio mín." aria-label="Precio mínimo" />
        <input v-model.number="filters.max" type="number" min="0" step="100000" placeholder="Precio máx." aria-label="Precio máximo" />
        <button type="button" class="link" @click="resetFilters">Limpiar</button>
      </div>

      <div v-if="webgl && hasFacade && view === '3d'" class="views">
        <button type="button" :class="{ on: look === 'facade' }" @click="look = 'facade'">Fachada</button>
        <button type="button" :class="{ on: look === 'colors' }" @click="look = 'colors'">Colores</button>
      </div>

      <div v-if="webgl" class="views">
        <button type="button" :class="{ on: view === '3d' }" @click="view = '3d'">Edificio</button>
        <button type="button" :class="{ on: view === 'floor' }" @click="openFloor()">Planta</button>
        <button type="button" :class="{ on: view === '2d' }" @click="view = '2d'">Plano</button>
      </div>
    </div>

    <div class="body">
      <div class="stage">
        <Suspense v-if="view === '3d'">
          <BuildingScene
            :layout="layout"
            :colors="colors"
            :selected-floor="selectedFloor"
            :selected-key="selectedKey"
            :facade="payload.config.colors?.facade"
            :facade-front="payload.building.facade_front_url"
            :facade-side="payload.building.facade_side_url"
            :look="look"
            :site-plan="payload.building.site_plan_url"
            :site-width="payload.config.site?.width"
            :faces="{ left: payload.building.facade_left_url, back: payload.building.facade_back_url, roof: payload.building.roof_url }"
            :roof-color="payload.config.colors?.roof"
            @pick="onPick"
            @hover="hover = $event"
          />
          <template #fallback>
            <div class="loading"><span class="spinner" />Cargando visor 3D…</div>
          </template>
        </Suspense>
        <template v-else-if="view === 'floor' && selectedFloor">
          <Suspense>
            <FloorScene
              :key="`${selectedFloor.tower}-${selectedFloor.floor}`"
              :slots="floorSlots"
              :colors="floorColors"
              :selected-key="selectedKey"
              :footprint="footprint"
              @pick="(s) => (selectedKey = s?.key ?? null)"
            />
            <template #fallback>
              <div class="loading dark"><span class="spinner" />Cargando planta…</div>
            </template>
          </Suspense>
          <div class="floor-bar">
            <button type="button" class="back" @click="view = '3d'">← Edificio</button>
            <span class="lbl">Piso</span>
            <button
              v-for="f in towerFloors"
              :key="f"
              type="button"
              :class="{ on: f === selectedFloor.floor }"
              @click="openFloor(f)"
            >{{ String(f).padStart(2, '0') }}</button>
          </div>
          <p v-if="selectedUnit" class="live-unit" :class="selectedUnit.commercial_status">
            <i />{{ live ? 'En vivo · ' : '' }}Unidad {{ selectedSlot?.unit_code }} · {{ STATUS_LABELS[selectedUnit.commercial_status] }}
          </p>
        </template>
        <div v-else class="plan-wrap">
          <p v-if="!webgl" class="notice">Este dispositivo no soporta 3D: se muestra el plano por piso.</p>
          <FloorPlan2D
            :layout="layout"
            :colors="colors"
            :selected-floor="selectedFloor"
            :selected-key="selectedKey"
            :labels="labels"
            @pick="(s) => s && pickUnit(s)"
            @floor="selectFloor"
          />
        </div>

        <div v-if="hover && view === '3d'" class="tip3d" :style="{ left: hover.x + 'px', top: hover.y + 'px' }">
          <strong>Torre {{ hover.slot.tower }} · {{ hover.slot.unit_code }}</strong>
          <span v-if="hoverUnit" :class="hoverUnit.commercial_status">{{ STATUS_LABELS[hoverUnit.commercial_status] }} · {{ formatCOP(hoverUnit.price) }}</span>
          <span v-else>Sin unidad</span>
          <small>Piso {{ hover.slot.floor }}{{ hover.slot.type_code ? ' · Tipo ' + hover.slot.type_code : '' }} · clic para ver</small>
        </div>

        <ul v-if="!(view === 'floor' && mode === 'commercial')" class="legend" :class="{ low: view === 'floor' }" aria-label="Leyenda">
          <li v-for="l in LEGENDS[mode]" :key="l.key">
            <i :style="{ background: l.color }" />{{ l.label }}
            <b>{{ legendCounts[l.key] ?? 0 }}</b>
          </li>
        </ul>

        <div v-if="mode === 'commercial' && view !== '2d'" class="counters" :class="{ dark: view === 'floor' }">
          <span v-if="live" class="live"><i />En vivo</span>
          <div><small>Libres</small><b class="g">{{ counters.available }}</b></div>
          <div><small>Reservadas</small><b class="y">{{ counters.reserved }}</b></div>
          <div><small>{{ takenLabel }}</small><b class="r">{{ counters.taken }}</b></div>
        </div>

        <button v-if="view === '3d' && selectedFloor && !selectedKey" type="button" class="open-floor" @click="openFloor()">
          Ver planta del piso {{ selectedFloor.floor }} →
        </button>

        <p v-if="view === '3d' && !selectedFloor" class="hint">Arrastra para girar · rueda o pellizco para zoom · clic en un piso</p>

        <div v-if="selectedSlot" class="card-wrap">
          <UnitCard
            :unit="selectedUnit"
            :tower="selectedSlot.tower"
            :unit-code="selectedSlot.unit_code"
            :floor="selectedSlot.floor"
            :type-code="selectedUnit?.unit_type ?? selectedSlot.type_code"
            :is-public="isPublic"
            :editable="!!saveUnit"
            :saving="saving"
            @enter="enter"
            @save="onSave"
            @close="selectedKey = null"
          />
          <p v-if="tourLoading" class="tour-msg">Abriendo recorrido…</p>
          <p v-if="tourError" class="tour-msg err">{{ tourError }}</p>
        </div>
      </div>

      <aside class="side">
        <template v-if="selectedFloor">
          <div class="side-head">
            <h3>Torre {{ selectedFloor.tower }} · Piso {{ selectedFloor.floor }}</h3>
            <button type="button" class="link" @click="clearSelection">Ver todo</button>
          </div>
          <ul class="unit-list">
            <li v-for="s in floorSlots" :key="s.key">
              <button type="button" :class="{ on: s.key === selectedKey }" @click="pickUnit(s)">
                <i :style="{ background: colors[layout.slots.indexOf(s)] }" />
                <span class="code">{{ s.unit_code }}</span>
                <span class="meta">{{ labels[s.key].split(' · ').slice(1).join(' · ') }}</span>
              </button>
            </li>
          </ul>
        </template>
        <template v-else>
          <h3>{{ payload.building.name }}</h3>
          <p class="muted">{{ [payload.building.address, payload.building.city].filter(Boolean).join(', ') }}</p>
          <p class="muted">{{ payload.units.length }} unidades · {{ layout.towers.length }} torre(s)</p>
          <div v-for="t in layout.towers" :key="t.code" class="floors">
            <h4>{{ t.name }}</h4>
            <div class="chips">
              <button
                v-for="f in floorsOf(t.code)"
                :key="f"
                type="button"
                @click="selectFloor({ tower: t.code, floor: f })"
              >{{ f }}</button>
            </div>
          </div>
          <p v-if="!payload.units.length" class="empty">Este edificio aún no tiene unidades vinculadas.</p>
        </template>
      </aside>
    </div>

    <PanoramaTour
      v-if="tour"
      :tour="tour"
      :title="selectedSlot ? `Unidad ${selectedSlot.unit_code} · Torre ${selectedSlot.tower}` : undefined"
      @close="tour = null"
    />
  </div>
</template>

<style scoped>
.viewer { display: flex; flex-direction: column; gap: 10px; color: var(--v3d-text); }
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
.modes, .views { display: inline-flex; background: var(--v3d-surface-2); border-radius: 10px; padding: 3px; }
.modes button, .views button { border: 0; background: transparent; padding: 7px 12px; border-radius: 8px; font-size: 13px; cursor: pointer; color: var(--v3d-muted); }
.modes button.on, .views button.on { background: var(--v3d-surface); color: var(--v3d-accent-strong); font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
.filters { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.filters select, .filters input { padding: 7px 8px; border: 1px solid var(--v3d-border); border-radius: 8px; font-size: 13px; background: var(--v3d-surface); color: var(--v3d-text); }
.filters input { width: 118px; }
.link { background: none; border: 0; color: var(--v3d-accent); cursor: pointer; font-size: 13px; }
.body { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 12px; }
.stage { position: relative; height: min(72vh, 720px); min-height: 420px; background: var(--v3d-stage); border-radius: 14px; overflow: hidden; touch-action: none; }
.plan-wrap { height: 100%; overflow: auto; padding: 108px 12px 12px; } /* deja ver la leyenda */
.notice { font-size: 13px; background: var(--v3d-accent-soft); padding: 8px 10px; border-radius: 8px; margin-bottom: 8px; }
.loading { height: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--v3d-muted); }
.spinner { width: 22px; height: 22px; border: 3px solid #c7d2fe; border-top-color: var(--v3d-accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.legend { position: absolute; top: 10px; left: 10px; list-style: none; background: rgba(28,18,14,.88); border-radius: 10px; padding: 8px 10px; font-size: 12px; display: flex; flex-direction: column; gap: 4px; pointer-events: none; }
.legend.low { top: auto; bottom: 10px; left: auto; right: 10px; }
.legend li { display: flex; align-items: center; gap: 6px; }
.legend i, .unit-list i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; flex: none; }
.legend b { margin-left: auto; padding-left: 8px; color: var(--v3d-muted); }
.loading.dark { background: var(--v3d-stage); color: #d4d4d8; }
.counters { position: absolute; left: 10px; bottom: 10px; display: flex; gap: 6px; align-items: stretch; background: rgba(28,18,14,.88); border-radius: 12px; padding: 8px 12px; pointer-events: none; }
.counters.dark { background: rgba(24,24,27,.82); color: #e4e4e7; }
.counters div { display: flex; flex-direction: column; min-width: 74px; }
.counters small { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #71717a; font-family: ui-monospace, monospace; }
.counters.dark small { color: #a1a1aa; }
.counters b { font-size: 30px; line-height: 1.1; font-family: ui-monospace, monospace; }
.counters .g { color: #22c55e; } .counters .y { color: #eab308; } .counters .r { color: #ef4444; }
.live { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; font-family: ui-monospace, monospace; margin-right: 6px; }
.live i, .live-unit i { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: blink 1.6s infinite; }
@keyframes blink { 50% { opacity: .25; } }
.open-floor { position: absolute; left: 50%; top: 14px; transform: translateX(-50%); background: var(--v3d-accent); color: var(--v3d-on-accent); font-weight: 700; border: 0; border-radius: 999px; padding: 9px 16px; font-size: 13px; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,.25); }
.floor-bar { position: absolute; top: 10px; left: 10px; right: 10px; display: flex; gap: 4px; align-items: center; overflow-x: auto; background: rgba(24,24,27,.85); border-radius: 10px; padding: 6px; }
.floor-bar button { flex: none; border: 1px solid #3f3f46; background: transparent; color: #d4d4d8; border-radius: 6px; padding: 5px 8px; font-family: ui-monospace, monospace; font-size: 12px; cursor: pointer; }
.floor-bar button.on { background: #f4f4f5; color: #18181b; }
.floor-bar .back { border-color: transparent; color: #fff; }
.floor-bar .lbl { color: #71717a; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; padding: 0 4px 0 8px; font-family: ui-monospace, monospace; }
.live-unit { position: absolute; top: 58px; left: 10px; display: inline-flex; align-items: center; gap: 8px; background: rgba(24,24,27,.88); color: #f4f4f5; padding: 8px 14px; border-left: 3px solid #22c55e; border-radius: 6px; font-family: ui-monospace, monospace; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; pointer-events: none; }
.live-unit.reserved { border-left-color: #eab308; } .live-unit.reserved i { background: #eab308; }
.live-unit.sold, .live-unit.rented { border-left-color: #ef4444; } .live-unit.sold i, .live-unit.rented i { background: #ef4444; }
.tip3d { position: absolute; z-index: 6; transform: translate(14px, -50%); pointer-events: none; display: flex; flex-direction: column; gap: 2px;
  background: rgba(24, 15, 12, .92); border: 1px solid rgba(139, 92, 246, .55); border-radius: 10px; padding: 8px 12px; color: #f5efe6;
  box-shadow: 0 10px 28px rgba(0,0,0,.45); white-space: nowrap; backdrop-filter: blur(6px); }
.tip3d strong { font-size: 13px; }
.tip3d span { font-size: 12px; font-weight: 700; color: #4ade80; }
.tip3d span.reserved { color: #facc15; }
.tip3d span.rented, .tip3d span.sold { color: #f87171; }
.tip3d small { font-size: 10px; color: #c2ad99; }
.hint { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(15,23,42,.7); color: #fff; font-size: 12px; padding: 5px 12px; border-radius: 999px; pointer-events: none; white-space: nowrap; }
.card-wrap { position: absolute; right: 10px; bottom: 10px; width: min(340px, calc(100% - 20px)); }
.tour-msg { background: var(--v3d-surface); padding: 6px 10px; border-radius: 8px; margin-top: 6px; font-size: 13px; }
.tour-msg.err { color: #f87171; }
.side { background: var(--v3d-card); border: 1px solid var(--v3d-border); border-radius: 14px; padding: 14px; max-height: min(72vh, 720px); overflow: auto; }
.side h3 { font-size: 16px; }
.side h4 { font-size: 13px; color: var(--v3d-muted); margin: 12px 0 6px; }
.side-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.muted { color: var(--v3d-muted); font-size: 13px; margin-top: 2px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chips button { color: var(--v3d-text); border: 1px solid var(--v3d-border); background: var(--v3d-surface-2); border-radius: 6px; padding: 4px 8px; font-size: 12px; cursor: pointer; min-width: 34px; }
.chips button:hover { border-color: var(--v3d-accent); }
.unit-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
.unit-list button { color: var(--v3d-text); width: 100%; display: flex; align-items: center; gap: 8px; border: 1px solid var(--v3d-border); background: var(--v3d-surface); border-radius: 8px; padding: 8px; cursor: pointer; text-align: left; font-size: 13px; }
.unit-list button.on { border-color: var(--v3d-accent); background: var(--v3d-accent-soft); }
.code { color: var(--v3d-text); font-weight: 700; }
.meta { color: var(--v3d-muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty { margin-top: 12px; color: var(--v3d-muted); font-size: 13px; }

@media (max-width: 900px) {
  .body { grid-template-columns: 1fr; }
  .stage { height: 62vh; min-height: 360px; }
  .side { max-height: none; }
  .card-wrap { left: 8px; right: 8px; bottom: 8px; width: auto; max-height: 62%; overflow: auto; }
  .legend { font-size: 11px; padding: 6px 8px; }
  .hint { display: none; }
  .open-floor { top: auto; bottom: 86px; }
  .stage:has(.card-wrap) .counters, .stage:has(.card-wrap) .live-unit { display: none; }
  .counters { right: 76px; gap: 2px; padding: 6px 8px; } /* deja libre la burbuja de Lyra */
  .counters b { font-size: 22px; }
  .counters div { min-width: 0; flex: 1; }
  .counters small { font-size: 8px; letter-spacing: .06em; }
  .counters .live { display: none; }
}
</style>
