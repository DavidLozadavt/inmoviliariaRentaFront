<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CommercialStatus, Unit } from '@/types/visor3d'
import { STATUS_LABELS, formatCOP } from '@/utils/visor3d/colors'

const props = defineProps<{
  unit: Unit | null
  tower: string
  unitCode: string
  floor: number
  typeCode: string | null
  isPublic?: boolean
  editable?: boolean
  saving?: boolean
}>()
const emit = defineEmits<{
  enter: []
  close: []
  save: [data: { commercial_status: CommercialStatus; monthly_price: number }]
}>()

const status = ref<CommercialStatus>('available')
const price = ref(0)
watch(() => props.unit, (u) => {
  status.value = u?.commercial_status ?? 'available'
  price.value = u?.price ?? 0
}, { immediate: true })

const arrearsText = (u: Unit) => {
  if (!u.contract_id) return 'Sin contrato activo'
  if (!u.arrears_days) return 'Al día'
  return `${u.arrears_days} días de mora`
}
</script>

<template>
  <aside class="card" aria-live="polite">
    <header>
      <div>
        <small>Torre {{ tower }} · Piso {{ floor }}</small>
        <h3>Unidad {{ unitCode }} <span v-if="typeCode" class="type">Tipo {{ typeCode }}</span></h3>
      </div>
      <button type="button" class="x" aria-label="Cerrar ficha" @click="emit('close')">✕</button>
    </header>

    <p v-if="!unit" class="empty">Esta posición no tiene una unidad vinculada todavía.</p>

    <template v-else>
      <span class="badge" :class="unit.commercial_status">{{ STATUS_LABELS[unit.commercial_status] }}</span>
      <dl>
        <div><dt>Área</dt><dd>{{ unit.area_m2 || '—' }} m²</dd></div>
        <div><dt>Habitaciones</dt><dd>{{ unit.bedrooms }}</dd></div>
        <div><dt>Baños</dt><dd>{{ unit.bathrooms }}</dd></div>
        <div><dt>Precio</dt><dd>{{ formatCOP(unit.price) }}</dd></div>
        <template v-if="!isPublic">
          <div><dt>Inquilino</dt><dd>{{ unit.tenant?.name ?? '—' }}</dd></div>
          <div><dt>Cartera</dt><dd :class="unit.arrears_bucket">{{ arrearsText(unit) }}</dd></div>
          <div><dt>PQRS abiertas</dt><dd>{{ unit.open_requests ?? 0 }}</dd></div>
        </template>
      </dl>

      <form v-if="editable" class="edit" @submit.prevent="emit('save', { commercial_status: status, monthly_price: price })">
        <label>Estado
          <select v-model="status">
            <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
        <label>Precio
          <input v-model.number="price" type="number" min="0" step="1000" />
        </label>
        <button type="submit" class="secondary" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
      </form>

      <button type="button" class="primary" @click="emit('enter')">Entrar · recorrido 360°</button>
    </template>
  </aside>
</template>

<style scoped>
.card { background: var(--v3d-card); border: 1px solid var(--v3d-border); border-radius: 12px; box-shadow: 0 8px 30px rgba(15, 23, 42, .18); padding: 14px 16px; color: var(--v3d-text); display: flex; flex-direction: column; gap: 10px; }
header { display: flex; justify-content: space-between; gap: 8px; }
small { color: var(--v3d-muted); font-size: 12px; }
h3 { font-size: 18px; margin-top: 2px; }
.type { font-size: 12px; background: var(--v3d-accent-soft); color: var(--v3d-accent-strong); padding: 2px 8px; border-radius: 999px; margin-left: 6px; vertical-align: middle; }
.x { border: 0; background: transparent; font-size: 16px; cursor: pointer; color: var(--v3d-muted); align-self: flex-start; }
.badge { align-self: flex-start; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
.badge.available { background: rgba(34,197,94,.18); color: #4ade80; }
.badge.reserved { background: rgba(234,179,8,.18); color: #facc15; }
.badge.rented, .badge.sold { background: rgba(239,68,68,.18); color: #f87171; }
dl { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; }
dt { font-size: 11px; color: var(--v3d-muted); }
dd { font-size: 14px; font-weight: 600; }
dd.lt60 { color: #facc15; }
dd.gt60 { color: #f87171; }
.edit { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: end; border-top: 1px solid var(--v3d-border); padding-top: 10px; }
.edit label { display: flex; flex-direction: column; font-size: 11px; color: var(--v3d-muted); gap: 3px; }
.edit select, .edit input { padding: 6px 8px; border: 1px solid var(--v3d-border); border-radius: 6px; font-size: 13px; min-width: 0; }
.primary { background: var(--v3d-accent); color: var(--v3d-on-accent); border: 0; border-radius: 8px; padding: 10px; font-weight: 600; cursor: pointer; }
.primary:hover { background: var(--v3d-accent-strong); }
.edit .secondary { color: var(--v3d-text); grid-column: 1 / -1; }
.secondary { color: var(--v3d-text); background: var(--v3d-surface-2); border: 1px solid var(--v3d-border); border-radius: 6px; padding: 7px 10px; cursor: pointer; font-size: 13px; }
.empty { color: var(--v3d-muted); font-size: 14px; }
</style>
