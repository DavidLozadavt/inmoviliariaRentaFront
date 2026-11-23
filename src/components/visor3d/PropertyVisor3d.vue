<script setup lang="ts">
// Visor 3D incrustado en el detalle de una propiedad que pertenece a un edificio:
// edificio (girar / zoom) → piso → planta o lista por número → unidad → recorrido 360°.
// Si la propiedad no tiene edificio (404) no se muestra nada.
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import api from '@/services/api'
import type { BuildingPayload, Tour } from '@/types/visor3d'
import { STATUS_LABELS } from '@/utils/visor3d/colors'
import { mediaUrl } from '@/utils/visor3d/device'
import { groupBySpace, kindIcon } from '@/utils/visor3d/spaces'

const BuildingViewer = defineAsyncComponent(() => import('./BuildingViewer.vue'))
const PanoramaTour = defineAsyncComponent(() => import('./PanoramaTour.vue'))

const props = defineProps<{ propertyId: number }>()

type Data = { unit_id: number; building: BuildingPayload; tour: Tour }
const data = ref<Data | null>(null)
const showTour = ref(false)
const tourStart = ref<number | null>(null)
function openTour(id: number | null = null) {
  tourStart.value = id
  showTour.value = true
}

const spaceGroups = computed(() => groupBySpace(data.value?.tour.nodes ?? []))
const unit = computed(() => data.value?.building.units.find((u) => u.id === data.value?.unit_id) ?? null)

// Recorrido de cualquier unidad del edificio (las publicadas tienen su propio endpoint público)
async function loadTour(unitId: number): Promise<Tour> {
  if (unitId === data.value?.unit_id) return data.value.tour
  const r = await api.get(`/properties/${unitId}/visor3d`)
  return r.data.data.tour
}

onMounted(async () => {
  try {
    const r = await api.get(`/properties/${props.propertyId}/visor3d`)
    data.value = r.data.data
  } catch {
    data.value = null
  }
})
</script>

<template>
  <section v-if="data && unit" class="v3d-section">
    <header class="v3d-head">
      <div>
        <span class="eyebrow"><i />Edificio en 3D · en vivo</span>
        <h2>{{ data.building.building.name }}</h2>
        <p>
          Esta unidad: Torre {{ unit.tower }} · Piso {{ unit.floor }} · {{ unit.unit_code }}
          <b :class="unit.commercial_status">{{ STATUS_LABELS[unit.commercial_status] }}</b>
        </p>
      </div>
      <div class="steps" aria-hidden="true">
        <span>1 Gira el edificio</span><span>2 Elige un piso</span><span>3 Entra a la planta</span><span>4 Recorrido 360°</span>
      </div>
      <button v-if="data.tour.nodes.length" type="button" class="primary" @click="openTour()">
        Recorrido 360° de esta unidad
      </button>
    </header>

    <div v-if="data.tour.nodes.length" class="spaces">
      <span class="lbl">Espacios de esta unidad</span>
      <div class="strip">
        <button v-for="g in spaceGroups" :key="g.space" type="button" @click="openTour(g.cover.id)">
          <img :src="mediaUrl(g.cover.thumb || g.cover.url)" :alt="g.space" loading="lazy" />
          <span>{{ kindIcon(g.kind) }} {{ g.space }}</span>
          <em>{{ g.canBuildRoom ? '🧊 3D' : g.cover.projection === 'flat' ? g.nodes.length + (g.nodes.length === 1 ? ' foto' : ' fotos') : '360°' }}</em>
        </button>
      </div>
    </div>

    <BuildingViewer
      :payload="data.building"
      is-public
      live
      :load-tour="loadTour"
      :initial-unit-id="data.unit_id"
      initial-view="3d"
    />

    <Teleport to="body">
      <PanoramaTour
        v-if="showTour"
        :tour="data.tour"
        :start-id="tourStart"
        :title="`Unidad ${unit.unit_code} · Torre ${unit.tower}`"
        @close="showTour = false"
      />
    </Teleport>
  </section>
</template>

<style scoped>
.v3d-section { margin: 0 0 1.5rem; padding: 1.25rem; border-radius: 16px; background: var(--v3d-card); border: 1px solid var(--v3d-border); color: var(--v3d-text); display: flex; flex-direction: column; gap: 14px; }
.v3d-head { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: flex-end; justify-content: space-between; }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--v3d-accent); }
.eyebrow i { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 4px rgba(34,197,94,.18); }
h2 { font-size: 24px; margin-top: 6px; }
.v3d-head p { color: var(--v3d-muted); font-size: 14px; margin-top: 4px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.v3d-head b { font-size: 11px; padding: 2px 10px; border-radius: 999px; font-weight: 700; }
b.available { background: rgba(34,197,94,.18); color: #4ade80; }
b.reserved { background: rgba(234,179,8,.18); color: #facc15; }
b.rented, b.sold { background: rgba(239,68,68,.18); color: #f87171; }
.steps { display: flex; gap: 6px; flex-wrap: wrap; }
.steps span { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--v3d-muted); border: 1px solid var(--v3d-border); border-radius: 999px; padding: 4px 10px; }
.spaces { display: flex; flex-direction: column; gap: 6px; }
.lbl { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--v3d-muted); }
.strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.strip button { position: relative; flex: 0 0 auto; width: 170px; border: 1px solid var(--v3d-border); background: rgba(0,0,0,.2); border-radius: 12px; overflow: hidden; padding: 0; color: var(--v3d-text); cursor: pointer; text-align: left; transition: border-color .2s, transform .2s; }
.strip button:hover { border-color: var(--v3d-accent); transform: translateY(-2px); }
.strip img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; }
.strip span { display: block; font-size: 13px; padding: 6px 10px; }
.strip em { position: absolute; top: 6px; left: 6px; font-style: normal; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(28,18,14,.8); color: var(--v3d-accent); }
.primary { background: linear-gradient(135deg, var(--v3d-accent), var(--v3d-accent-strong)); color: var(--v3d-on-accent); border: 0; border-radius: 12px; padding: 11px 18px; font-weight: 700; cursor: pointer; }
</style>
