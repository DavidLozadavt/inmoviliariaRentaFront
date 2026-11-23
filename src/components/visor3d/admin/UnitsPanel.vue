<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { errorMessage, visor3dService } from '@/services/visor3dService'
import { useAlerts } from '@/composables/useAlerts'
import { buildLayout, slotKey } from '@/utils/visor3d/layout'
import { STATUS_LABELS, formatCOP } from '@/utils/visor3d/colors'
import type { BuildingPayload } from '@/types/visor3d'

const props = defineProps<{ buildingId: number; payload: BuildingPayload }>()
const emit = defineEmits<{ changed: [] }>()
const alerts = useAlerts()

const layout = computed(() => buildLayout(props.payload.config, props.payload.unit_types.map((t) => t.code)))
const linked = computed(() => new Set(props.payload.units.map((u) => slotKey(u.tower, u.unit_code))))
const missing = computed(() => layout.value.slots.filter((s) => !linked.value.has(s.key)))
const pct = computed(() => (layout.value.slots.length ? Math.round((props.payload.units.length / layout.value.slots.length) * 100) : 0))

/** Cuántas posiciones vacías hay por tipo (para mostrar en cada tarjeta de precio). */
const missingByType = computed(() => {
  const m: Record<string, number> = {}
  for (const s of missing.value) m[s.type_code ?? '—'] = (m[s.type_code ?? '—'] ?? 0) + 1
  return m
})

const prices = reactive<Record<string, number>>({})
const generating = ref(false)
const available = ref<{ id: number; title: string; city: string; monthly_price: number }[]>([])
const link = reactive({ property_id: '' as number | '', slot: '' })
const linking = ref(false)
const filterTower = ref('')

// Cuadrícula de TODAS las posiciones del edificio (con o sin unidad), por torre y piso (piso más alto arriba)
const unitAt = computed(() => new Map(props.payload.units.map((u) => [slotKey(u.tower, u.unit_code), u])))
const byTower = computed(() => layout.value.towers
  .filter((t) => !filterTower.value || t.code === filterTower.value)
  .map((t) => {
    const slots = layout.value.slots.filter((s) => s.tower === t.code)
    const floors = [...new Set(slots.map((s) => s.floor))].sort((a, b) => b - a)
    return { tower: t.code, floors: floors.map((f) => ({ floor: f, slots: slots.filter((s) => s.floor === f) })) }
  }))

// ── Acomodar (arrastrar a otra posición; si está ocupada se intercambian) y eliminar
const selectedId = ref<number | null>(null)
const selected = computed(() => props.payload.units.find((u) => u.id === selectedId.value) ?? null)
const dragId = ref<number | null>(null)
const overKey = ref<string | null>(null)
const working = ref(false)
const confirmDel = ref<'unlink' | 'delete' | null>(null)

async function moveTo(unitId: number, slot: { tower: string; floor: number; unit_code: string; type_code: string | null }) {
  const u = props.payload.units.find((x) => x.id === unitId)
  if (!u || (u.tower === slot.tower && u.unit_code === slot.unit_code)) return
  const other = unitAt.value.get(slotKey(slot.tower, slot.unit_code))
  working.value = true
  try {
    await visor3dService.moveUnit(props.buildingId, unitId, { tower: slot.tower, floor: slot.floor, unit_code: slot.unit_code })
    alerts.success(other ? `${u.unit_code} y ${other.unit_code} intercambiadas` : `Unidad movida a ${slot.tower}-${slot.unit_code}`)
    emit('changed')
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo mover la unidad'))
  } finally {
    working.value = false
  }
}
function onDrop(slot: { tower: string; floor: number; unit_code: string; type_code: string | null }) {
  overKey.value = null
  if (dragId.value != null) moveTo(dragId.value, slot)
  dragId.value = null
}
// Tocar (celular): unidad seleccionada + tocar otra posición = mover allí
function onSlotClick(slot: { key: string; tower: string; floor: number; unit_code: string; type_code: string | null }) {
  const u = unitAt.value.get(slot.key)
  if (selected.value && moveMode.value && (!u || u.id !== selected.value.id)) {
    moveTo(selected.value.id, slot)
    moveMode.value = false
    return
  }
  selectedId.value = u?.id ?? null
  confirmDel.value = null
}
const moveMode = ref(false)

async function removeSelected(how: 'unlink' | 'delete') {
  if (!selected.value) return
  working.value = true
  try {
    if (how === 'delete') await visor3dService.deleteUnit(props.buildingId, selected.value.id)
    else await visor3dService.unlinkUnit(props.buildingId, selected.value.id)
    alerts.success(how === 'delete' ? 'Unidad eliminada' : 'Unidad quitada del edificio (la propiedad se conserva)')
    selectedId.value = null
    confirmDel.value = null
    emit('changed')
  } catch (e) {
    alerts.error(errorMessage(e))
  } finally {
    working.value = false
  }
}
const towers = computed(() => layout.value.towers.map((t) => t.code))

async function generate() {
  generating.value = true
  try {
    const r = await visor3dService.generateUnits(props.buildingId, prices)
    alerts.success(`${r.created} unidades creadas (de ${r.total_slots} posiciones).`)
    emit('changed')
  } catch (e) {
    alerts.error(errorMessage(e))
  } finally {
    generating.value = false
  }
}

async function doLink() {
  const slot = layout.value.slots.find((s) => s.key === link.slot)
  if (!slot || link.property_id === '') return
  linking.value = true
  try {
    await visor3dService.linkProperty(props.buildingId, {
      property_id: Number(link.property_id), tower: slot.tower, floor: slot.floor, unit_code: slot.unit_code, unit_type: slot.type_code,
    })
    alerts.success('Propiedad vinculada')
    link.property_id = ''
    link.slot = ''
    available.value = await visor3dService.availableProperties(props.buildingId)
    emit('changed')
  } catch (e) {
    alerts.error(errorMessage(e))
  } finally {
    linking.value = false
  }
}

onMounted(async () => {
  for (const t of props.payload.unit_types) prices[t.code] ??= 0
  try {
    available.value = await visor3dService.availableProperties(props.buildingId)
  } catch {
    available.value = []
  }
})
</script>

<template>
  <section class="panel">
    <!-- Resumen -->
    <div class="summary">
      <div class="stat"><span class="ico">🏢</span><div><b>{{ layout.slots.length }}</b><small>posiciones en el 3D</small></div></div>
      <div class="stat ok"><span class="ico">✓</span><div><b>{{ payload.units.length }}</b><small>unidades creadas</small></div></div>
      <div class="stat warn"><span class="ico">○</span><div><b>{{ missing.length }}</b><small>posiciones sin unidad</small></div></div>
      <div class="bar-wrap">
        <div class="bar"><span :style="{ width: pct + '%' }" /></div>
        <small>{{ pct }} % del edificio tiene unidades</small>
      </div>
    </div>

    <!-- Generar -->
    <div class="box hero" :class="{ done: !missing.length }">
      <div class="box-head">
        <span class="step-ico">⚡</span>
        <div>
          <h3>{{ missing.length ? 'Generar unidades automáticamente' : 'Todas las posiciones tienen unidad' }}</h3>
          <p class="muted">
            Se crea una propiedad por cada posición vacía, con código piso+posición (101, 102…) y el área, alcobas y baños de su
            tipo. Quedan <b>ocultas</b> en NexiLiving hasta que las publiques. Las que ya existen no se tocan.
          </p>
        </div>
      </div>
      <div v-if="missing.length" class="prices">
        <label v-for="t in payload.unit_types" :key="t.code" class="price-card">
          <span class="tc" :style="{ background: t.color || 'var(--v3d-accent)' }">{{ t.code }}</span>
          <span class="pi">
            <strong>{{ t.name || `Tipo ${t.code}` }}</strong>
            <small>{{ t.area_m2 ?? '—' }} m² · {{ t.bedrooms ?? 0 }} alc. · {{ t.bathrooms ?? 0 }} baños · {{ missingByType[t.code] ?? 0 }} por crear</small>
            <span class="money">
              <em>$</em>
              <input v-model.number="prices[t.code]" type="number" min="0" step="50000" :aria-label="`Precio tipo ${t.code}`" />
            </span>
            <small class="fmt">{{ formatCOP(prices[t.code] || 0) }}</small>
          </span>
        </label>
      </div>
      <button v-if="missing.length" type="button" class="primary" :disabled="generating" @click="generate">
        {{ generating ? 'Generando…' : `Generar ${missing.length} unidades` }}
      </button>
    </div>

    <!-- Acomodar unidades -->
    <div v-if="layout.slots.length" class="box">
      <div class="list-head">
        <div>
          <h3>Acomodar unidades</h3>
          <p class="muted">Arrastra una unidad a otra posición (si está ocupada, se intercambian). En celular: tócala, luego
            "Mover" y toca el destino. Las posiciones punteadas están vacías.</p>
        </div>
        <select v-if="towers.length > 1" v-model="filterTower" aria-label="Torre">
          <option value="">Todas las torres</option>
          <option v-for="t in towers" :key="t" :value="t">Torre {{ t }}</option>
        </select>
      </div>

      <div v-if="selected" class="selbar">
        <strong>{{ selected.tower }}-{{ selected.unit_code }}</strong>
        <span>{{ selected.unit_type ? 'Tipo ' + selected.unit_type + ' · ' : '' }}{{ formatCOP(selected.price) }} · {{ STATUS_LABELS[selected.commercial_status] }}</span>
        <button type="button" class="chip" :class="{ on: moveMode }" :disabled="working" @click="moveMode = !moveMode">
          {{ moveMode ? 'Toca el destino…' : '↔ Mover' }}
        </button>
        <template v-if="confirmDel">
          <span class="confirm">{{ confirmDel === 'delete' ? '¿Eliminar la unidad?' : '¿Quitarla del edificio?' }}
            <button type="button" class="danger-btn" :disabled="working" @click="removeSelected(confirmDel)">Sí</button>
            <button type="button" class="link" @click="confirmDel = null">No</button></span>
        </template>
        <template v-else>
          <button type="button" class="chip" :disabled="working" @click="confirmDel = 'unlink'">Quitar del edificio</button>
          <button type="button" class="chip danger" :disabled="working" @click="confirmDel = 'delete'">🗑 Eliminar</button>
        </template>
        <button type="button" class="link" @click="selectedId = null; moveMode = false">Cerrar</button>
      </div>

      <div v-for="t in byTower" :key="t.tower" class="tower">
        <h4>Torre {{ t.tower }}</h4>
        <div v-for="f in t.floors" :key="f.floor" class="floor">
          <span class="fl">P{{ f.floor }}</span>
          <div class="units">
            <div
              v-for="sl in f.slots"
              :key="sl.key"
              class="unit"
              :class="[unitAt.get(sl.key)?.commercial_status ?? 'empty', {
                sel: unitAt.get(sl.key)?.id === selectedId, over: overKey === sl.key, target: moveMode && unitAt.get(sl.key)?.id !== selectedId }]"
              :draggable="!!unitAt.get(sl.key) && !working"
              @dragstart="dragId = unitAt.get(sl.key)?.id ?? null"
              @dragend="dragId = null; overKey = null"
              @dragover.prevent="overKey = sl.key"
              @dragleave="overKey === sl.key && (overKey = null)"
              @drop.prevent="onDrop(sl)"
              @click="onSlotClick(sl)"
            >
              <template v-if="unitAt.get(sl.key)">
                <strong>{{ sl.unit_code }}</strong>
                <small>{{ unitAt.get(sl.key)!.unit_type ? 'Tipo ' + unitAt.get(sl.key)!.unit_type : '' }}</small>
                <small class="pr">{{ formatCOP(unitAt.get(sl.key)!.price) }}</small>
                <span class="st">{{ STATUS_LABELS[unitAt.get(sl.key)!.commercial_status] }}</span>
              </template>
              <template v-else>
                <strong class="ph">{{ sl.unit_code }}</strong>
                <small>vacía</small>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vincular -->
    <div class="box">
      <div class="box-head">
        <span class="step-ico">🔗</span>
        <div>
          <h3>Vincular una propiedad que ya existe</h3>
          <p class="muted">Para propiedades publicadas antes en NexiLiving: elige la propiedad y la posición del 3D que ocupa.</p>
        </div>
      </div>
      <p v-if="!available.length" class="empty">No tienes propiedades sueltas (sin edificio) para vincular.</p>
      <div v-else class="row">
        <select v-model="link.property_id">
          <option value="">Propiedad…</option>
          <option v-for="p in available" :key="p.id" :value="p.id">{{ p.title }} ({{ p.city }})</option>
        </select>
        <select v-model="link.slot">
          <option value="">Posición…</option>
          <option v-for="s in missing" :key="s.key" :value="s.key">Torre {{ s.tower }} · {{ s.unit_code }}</option>
        </select>
        <button type="button" class="secondary" :disabled="linking || link.property_id === '' || !link.slot" @click="doLink">Vincular</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; gap: 16px; }
.summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.4fr); gap: 10px; align-items: stretch; }
.stat { display: flex; gap: 12px; align-items: center; background: rgba(0,0,0,.22); border: 1px solid var(--v3d-border); border-radius: 14px; padding: 12px 14px; }
.stat .ico { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; background: var(--v3d-accent-soft); color: var(--v3d-accent); font-size: 18px; flex: none; }
.stat.ok .ico { background: rgba(34,197,94,.16); color: #4ade80; }
.stat.warn .ico { background: rgba(234,179,8,.14); color: #facc15; }
.stat b { font-size: 24px; display: block; line-height: 1.1; }
.stat small { color: var(--v3d-muted); font-size: 12px; }
.bar-wrap { display: flex; flex-direction: column; justify-content: center; gap: 6px; background: rgba(0,0,0,.22); border: 1px solid var(--v3d-border); border-radius: 14px; padding: 12px 14px; }
.bar { height: 8px; border-radius: 999px; background: rgba(255,255,255,.08); overflow: hidden; }
.bar span { display: block; height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80); }
.bar-wrap small { color: var(--v3d-muted); font-size: 12px; }
.box { border: 1px solid var(--v3d-border); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: rgba(0,0,0,.16); }
.box.hero { background: linear-gradient(135deg, rgba(218,156,95,.12), rgba(0,0,0,.18)); border-color: rgba(218,156,95,.4); }
.box.hero.done { background: rgba(34,197,94,.08); border-color: rgba(34,197,94,.35); }
.box-head { display: flex; gap: 12px; align-items: flex-start; }
.step-ico { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: var(--v3d-accent-soft); font-size: 20px; flex: none; }
h3 { font-size: 16px; }
h4 { font-size: 13px; color: var(--v3d-muted); margin-bottom: 6px; }
.muted { color: var(--v3d-muted); font-size: 13px; line-height: 1.5; margin-top: 3px; }
.empty { color: var(--v3d-muted); font-size: 13px; }
.prices { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
.price-card { display: flex; gap: 10px; align-items: flex-start; border: 1px solid var(--v3d-border); border-radius: 12px; padding: 12px; background: rgba(0,0,0,.2); cursor: text; }
.tc { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; font-weight: 800; color: #1c120e; flex: none; }
.pi { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.pi small { color: var(--v3d-muted); font-size: 11px; }
.money { display: flex; align-items: center; gap: 6px; border: 1px solid var(--v3d-border); border-radius: 8px; padding: 0 10px; background: var(--v3d-surface-2); margin-top: 4px; }
.money em { font-style: normal; color: var(--v3d-accent); font-weight: 700; }
.money input { border: 0; background: transparent; color: var(--v3d-text); padding: 8px 0; font-size: 15px; width: 100%; outline: none; }
.fmt { color: var(--v3d-accent) !important; }
.primary { align-self: flex-start; background: linear-gradient(135deg, var(--v3d-accent), var(--v3d-accent-strong)); color: var(--v3d-on-accent); border: 0; border-radius: 10px; padding: 11px 20px; cursor: pointer; font-weight: 800; }
.primary:disabled, .secondary:disabled { opacity: .6; cursor: default; }
.secondary { background: transparent; color: var(--v3d-text); border: 1px solid var(--v3d-border); border-radius: 10px; padding: 8px 16px; cursor: pointer; }
.list-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.tower { display: flex; flex-direction: column; gap: 4px; }
.floor { display: flex; gap: 8px; align-items: flex-start; }
.fl { width: 38px; flex: none; text-align: center; font-family: ui-monospace, monospace; font-size: 11px; color: var(--v3d-muted); background: rgba(0,0,0,.25); border-radius: 6px; padding: 6px 0; }
.units { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
.selbar { position: sticky; top: 76px; z-index: 3; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 12px;
  border: 1px solid var(--v3d-accent); border-radius: 12px; background: #2f1d15; }
.selbar span { color: var(--v3d-muted); font-size: 12px; }
.chip { border: 1px solid var(--v3d-border); background: transparent; color: var(--v3d-text); border-radius: 999px; padding: 5px 12px; cursor: pointer; font-size: 12px; }
.chip.on { background: var(--v3d-accent); color: var(--v3d-on-accent); border-color: var(--v3d-accent); }
.chip.danger { color: #f87171; border-color: rgba(239,68,68,.4); }
.confirm { display: inline-flex; gap: 8px; align-items: center; color: #fca5a5 !important; font-size: 12px; }
.danger-btn { background: #ef4444; color: #fff; border: 0; border-radius: 6px; padding: 4px 10px; font-weight: 700; cursor: pointer; }
.link { background: none; border: 0; color: var(--v3d-accent); cursor: pointer; font-size: 12px; }
.unit { cursor: grab; transition: transform .12s, box-shadow .12s; }
.unit.empty { border-style: dashed; border-left-width: 1px; background: transparent; cursor: default; opacity: .7; }
.unit .ph { color: var(--v3d-muted); }
.unit.sel { box-shadow: 0 0 0 2px #fff; }
.unit.over, .unit.target:hover { box-shadow: 0 0 0 2px var(--v3d-accent); transform: translateY(-2px); opacity: 1; }
.unit.target { cursor: pointer; }
.unit { min-width: 108px; display: flex; flex-direction: column; border: 1px solid var(--v3d-border); border-left: 4px solid #22c55e; border-radius: 8px; padding: 6px 8px; background: rgba(0,0,0,.2); }
.unit.reserved { border-left-color: #eab308; }
.unit.rented, .unit.sold { border-left-color: #ef4444; }
.unit small { color: var(--v3d-muted); font-size: 10px; }
.unit .pr { color: var(--v3d-text); font-size: 11px; }
.unit .st { font-size: 10px; color: var(--v3d-accent); }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
select { padding: 8px 10px; border: 1px solid var(--v3d-border); border-radius: 8px; font-size: 14px; background: var(--v3d-surface-2); color: var(--v3d-text); }
@media (max-width: 860px) { .summary { grid-template-columns: repeat(3, minmax(0, 1fr)); } .bar-wrap { grid-column: 1 / -1; } }
@media (max-width: 520px) { .summary { grid-template-columns: 1fr; } }
</style>
