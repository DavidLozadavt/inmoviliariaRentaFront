<script setup lang="ts">
// Distribución y fotos: por tipo de unidad (se reutiliza en todas las unidades del tipo) o por unidad
// (torre → piso → unidad). Cada espacio (habitación, baño, cocina…) se arma con VARIAS fotos: paredes,
// piso, techo y detalles; con al menos dos paredes marcadas, el recorrido arma la habitación en 3D.
// También acepta fotos 360° (2:1 o panorámica del celular). Todo se optimiza en el navegador antes de subir.
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { errorMessage, visor3dService } from '@/services/visor3dService'
import { useAlerts } from '@/composables/useAlerts'
import { detectProjection, preparePanorama, preparePhoto } from '@/utils/visor3d/image'
import { mediaUrl } from '@/utils/visor3d/device'
import {
  ROOM_SURFACES, SPACE_KINDS, SURFACES, type SpaceGroup, groupBySpace, kindIcon, kindLabel, nextSpaceName, nextSurface,
} from '@/utils/visor3d/spaces'
import type { BuildingPayload, PanoramaNode, PlanRoom, SpaceKind, Surface, TourLink, UnitPlan } from '@/types/visor3d'

const HotspotEditor = defineAsyncComponent(() => import('./HotspotEditor.vue'))
const RoomBuilder = defineAsyncComponent(() => import('./RoomBuilder.vue'))
const UnitPlanEditor = defineAsyncComponent(() => import('./UnitPlanEditor.vue'))

const props = defineProps<{ buildingId: number; payload: BuildingPayload }>()
const alerts = useAlerts()

const all = ref<PanoramaNode[]>([])
const loading = ref(true)
const mode = ref<'type' | 'unit'>('type')
const typeId = ref<number | null>(props.payload.unit_types.find((t) => t.id)?.id ?? null)
const tower = ref(props.payload.units[0]?.tower ?? '')
const floor = ref<number | null>(null)
const unitId = ref<number | null>(null)

const newKind = ref<SpaceKind>('habitacion')
const phoneAngle = ref(360)
const busy = ref(false)
const progress = ref('')
const editing = ref<PanoramaNode | null>(null)
const savingLinks = ref(false)
const showGuide = ref(true)

// ── Selección
const towers = computed(() => [...new Set(props.payload.units.map((u) => u.tower))].sort())
const floors = computed(() =>
  [...new Set(props.payload.units.filter((u) => u.tower === tower.value).map((u) => u.floor))].sort((a, b) => a - b),
)
const floorUnits = computed(() =>
  props.payload.units.filter((u) => u.tower === tower.value && u.floor === floor.value).sort((a, b) => a.unit_code.localeCompare(b.unit_code)),
)
watch(tower, () => { floor.value = floors.value[0] ?? null })
watch(floor, () => { unitId.value = floorUnits.value[0]?.id ?? null })
floor.value = floors.value[0] ?? null

const ownerId = computed(() => (mode.value === 'type' ? typeId.value : unitId.value))
const current = computed(() =>
  ownerId.value == null ? [] : all.value.filter((p) => p.owner?.kind === mode.value && p.owner?.id === ownerId.value),
)
const groups = computed(() => groupBySpace(current.value))
const spacesOf = (kind: 'type' | 'unit', id?: number) =>
  new Set(all.value.filter((p) => p.owner?.kind === kind && p.owner?.id === id).map((p) => p.space.toLowerCase())).size
const selectedUnit = computed(() => props.payload.units.find((u) => u.id === unitId.value))
const inheritedType = computed(() => props.payload.unit_types.find((t) => t.code === selectedUnit.value?.unit_type))
const title = computed(() => {
  if (mode.value === 'type') {
    const t = props.payload.unit_types.find((x) => x.id === typeId.value)
    return t ? `Tipo ${t.code}${t.name ? ' · ' + t.name : ''}` : 'Elige un tipo'
  }
  return selectedUnit.value ? `Torre ${selectedUnit.value.tower} · Piso ${selectedUnit.value.floor} · Unidad ${selectedUnit.value.unit_code}` : 'Elige una unidad'
})
const totalMb = computed(() => (all.value.reduce((s, p) => s + (p.size_kb ?? 0), 0) / 1024).toFixed(1))

async function load() {
  loading.value = true
  try {
    all.value = await visor3dService.panoramas(props.buildingId)
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudieron cargar las fotos'))
  } finally {
    loading.value = false
  }
}

/**
 * Sube fotos a un espacio. Sin `group` crea un espacio nuevo con el tipo elegido.
 * Las fotos normales reciben superficie sugerida en orden (frente, derecha, fondo, izquierda, piso, techo, detalle);
 * luego se puede cambiar en cada foto.
 */
async function onFiles(ev: Event, group?: SpaceGroup) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length || ownerId.value == null) return

  const space = group?.space ?? nextSpaceName(newKind.value, groups.value.map((g) => g.space))
  const kind = group?.kind ?? newKind.value
  const existing: PanoramaNode[] = [...(group?.nodes ?? [])]

  busy.value = true
  try {
    for (const [i, file] of files.entries()) {
      progress.value = `Optimizando ${i + 1} de ${files.length}…`
      const projection = await detectProjection(file)
      const prepared = projection === 'equirect' ? await preparePanorama(file, 0.82, phoneAngle.value) : await preparePhoto(file, 2400)
      const surface: Surface | null = projection === 'flat' ? nextSurface(existing) : null
      const ext = prepared.image.type === 'image/webp' ? 'webp' : 'jpg'
      const form = new FormData()
      form.append('owner_kind', mode.value)
      form.append('owner_id', String(ownerId.value))
      form.append('space', space)
      if (kind) form.append('kind', kind)
      form.append('projection', projection)
      if (surface) form.append('surface', surface)
      form.append('width', String(prepared.width))
      form.append('image', prepared.image, `foto.${ext}`)
      form.append('thumb', prepared.thumb, `thumb.${ext}`)
      const created = await visor3dService.uploadPanorama(props.buildingId, form, (pct) => {
        progress.value = `Subiendo foto ${i + 1} de ${files.length}: ${pct}%`
      })
      existing.push(created)
    }
    alerts.success(group ? `${files.length} foto(s) agregadas a ${space}` : `Espacio "${space}" creado con ${files.length} foto(s)`)
    await load()
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo subir la foto'))
  } finally {
    busy.value = false
    progress.value = ''
  }
}

async function setSurface(p: PanoramaNode, surface: string) {
  try {
    const updated = await visor3dService.updatePanorama(props.buildingId, p.id, { surface: (surface || null) as Surface | null })
    p.surface = updated.surface ?? null
  } catch (e) {
    alerts.error(errorMessage(e))
  }
}

async function setCover(p: PanoramaNode) {
  await visor3dService.updatePanorama(props.buildingId, p.id, { is_start: true })
  await load()
}

async function renameGroup(g: SpaceGroup) {
  const name = window.prompt('Nombre del espacio', g.space)?.trim()
  if (!name || name === g.space) return
  for (const n of g.nodes) await visor3dService.updatePanorama(props.buildingId, n.id, { space: name })
  await load()
}

async function changeKind(g: SpaceGroup, kind: string) {
  for (const n of g.nodes) await visor3dService.updatePanoramaKind(props.buildingId, n.id, kind || null)
  await load()
}

function removePhoto(p: PanoramaNode) {
  alerts.danger('¿Eliminar esta foto? Se borra del servidor.', async () => {
    try {
      await visor3dService.removePanorama(props.buildingId, p.id)
      await load()
    } catch (e) {
      alerts.error(errorMessage(e))
    }
  })
}

function removeGroup(g: SpaceGroup) {
  alerts.danger(`¿Eliminar el espacio "${g.space}" con sus ${g.nodes.length} foto(s)?`, async () => {
    try {
      for (const n of g.nodes) await visor3dService.removePanorama(props.buildingId, n.id)
      await load()
    } catch (e) {
      alerts.error(errorMessage(e))
    }
  })
}

async function saveLinks(links: TourLink[]) {
  if (!editing.value) return
  savingLinks.value = true
  try {
    await visor3dService.saveHotspots(props.buildingId, editing.value.id, links)
    alerts.success('Puntos de paso guardados')
    editing.value = null
    await load()
  } catch (e) {
    alerts.error(errorMessage(e))
  } finally {
    savingLinks.value = false
  }
}

// ── Armar en 3D: espacio abierto en el constructor (se busca por nombre para ver los cambios al recargar)
const building = ref<string | null>(null)
const buildingGroup = computed(() => groups.value.find((g) => g.space === building.value) ?? null)

/** Sube una foto a una superficie del espacio; si ya había foto en esa superficie, la reemplaza. */
async function uploadToSurface(g: SpaceGroup, surface: Surface, file: File) {
  if (ownerId.value == null) return
  busy.value = true
  try {
    progress.value = 'Optimizando foto…'
    const prepared = await preparePhoto(file, 2400)
    const ext = prepared.image.type === 'image/webp' ? 'webp' : 'jpg'
    const form = new FormData()
    form.append('owner_kind', mode.value)
    form.append('owner_id', String(ownerId.value))
    form.append('space', g.space)
    if (g.kind) form.append('kind', g.kind)
    form.append('projection', 'flat')
    form.append('surface', surface)
    form.append('width', String(prepared.width))
    form.append('image', prepared.image, `foto.${ext}`)
    form.append('thumb', prepared.thumb, `thumb.${ext}`)
    await visor3dService.uploadPanorama(props.buildingId, form, (pct) => { progress.value = `Subiendo: ${pct}%` })
    const old = g.surfaces[surface]
    if (old) await visor3dService.removePanorama(props.buildingId, old.id)
    await load()
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo subir la foto'))
  } finally {
    busy.value = false
    progress.value = ''
  }
}

async function removeNode(n: PanoramaNode) {
  try {
    await visor3dService.removePanorama(props.buildingId, n.id)
    await load()
  } catch (e) {
    alerts.error(errorMessage(e))
  }
}

/** Crear un espacio vacío y abrirlo directamente en el constructor 3D. */
function createAndBuild() {
  const name = nextSpaceName(newKind.value, groups.value.map((g) => g.space))
  pendingKind.value = newKind.value
  building.value = name
}
const pendingKind = ref<SpaceKind | null>(null)
const builderGroup = computed<SpaceGroup | null>(() => {
  if (buildingGroup.value) return buildingGroup.value
  if (!building.value) return null
  // Espacio aún sin fotos: grupo vacío
  const fake = { id: 0, space: building.value, kind: pendingKind.value, url: '', thumb: null, width: null, size_kb: null,
    is_start: false, order: 0, links: [] } as unknown as PanoramaNode
  return { space: building.value, kind: pendingKind.value, nodes: [], cover: fake, surfaces: {}, canBuildRoom: false }
})

// ── Plano de la unidad (cómo se unen sus espacios)
const view = ref<'plan' | 'list'>('plan')
const plans = ref<Record<string, UnitPlan>>({ ...(props.payload.config.unit_plans ?? {}) })
const planKey = computed(() => (ownerId.value == null ? null : `${mode.value}-${ownerId.value}`))
const inheritedPlan = computed(() => (mode.value === 'unit' && inheritedType.value?.id ? plans.value[`type-${inheritedType.value.id}`] : null))
const plan = computed<UnitPlan>(() => (planKey.value && plans.value[planKey.value]) || { rooms: [], doors: [] })
const photoCount = computed(() => Object.fromEntries(groups.value.map((g) => [g.space.toLowerCase(), g.nodes.length])))
const savingPlan = ref(false)
let planTimer: ReturnType<typeof setTimeout> | undefined

function onPlanChange(p: UnitPlan) {
  if (!planKey.value || ownerId.value == null) return
  plans.value = { ...plans.value, [planKey.value]: p }
  const kind = mode.value
  const id = ownerId.value
  clearTimeout(planTimer)
  planTimer = setTimeout(async () => {
    savingPlan.value = true
    try {
      await visor3dService.savePlan(props.buildingId, kind, id, p)
    } catch (e) {
      alerts.error(errorMessage(e, 'No se pudo guardar el plano'))
    } finally {
      savingPlan.value = false
    }
  }, 600)
}

function copyInherited() {
  if (inheritedPlan.value) onPlanChange(JSON.parse(JSON.stringify(inheritedPlan.value)))
}

/** Desde el plano: abrir el espacio en el constructor 3D (si aún no tiene fotos, se crea al subir la primera). */
function buildRoom(room: PlanRoom) {
  pendingKind.value = (room.kind ?? null) as SpaceKind | null
  building.value = groups.value.find((g) => g.space.toLowerCase() === room.space.toLowerCase())?.space ?? room.space
}

onMounted(load)
</script>

<template>
  <section class="dist">
    <!-- ── ¿A quién le pongo los espacios? ── -->
    <aside class="pick">
      <div class="seg">
        <button type="button" :class="{ on: mode === 'type' }" @click="mode = 'type'">Por tipo de unidad</button>
        <button type="button" :class="{ on: mode === 'unit' }" @click="mode = 'unit'">Por piso y unidad</button>
      </div>
      <p class="hint" v-if="mode === 'type'">Lo que armes aquí lo ven <b>todas</b> las unidades de ese tipo. Es lo más rápido.</p>
      <p class="hint" v-else>Solo para unidades distintas a su tipo. Sus espacios se suman a los del tipo.</p>

      <template v-if="mode === 'type'">
        <p v-if="!payload.unit_types.some((t) => t.id)" class="empty">Guarda primero los tipos de unidad en "Estructura".</p>
        <button
          v-for="t in payload.unit_types.filter((x) => x.id)"
          :key="t.id"
          type="button"
          class="type-card"
          :class="{ on: typeId === t.id }"
          @click="typeId = t.id!"
        >
          <span class="code" :style="{ background: t.color || 'var(--v3d-accent)' }">{{ t.code }}</span>
          <span class="tinfo">
            <strong>{{ t.name || `Tipo ${t.code}` }}</strong>
            <small>{{ t.area_m2 ?? '—' }} m² · {{ t.bedrooms ?? 0 }} hab · {{ t.bathrooms ?? 0 }} baños</small>
          </span>
          <span class="count" :title="'Espacios'">{{ spacesOf('type', t.id) }}</span>
        </button>
      </template>

      <template v-else>
        <p v-if="!payload.units.length" class="empty">Genera o vincula unidades primero (pestaña "Unidades").</p>
        <template v-else>
          <label class="lbl">Torre
            <select v-model="tower"><option v-for="t in towers" :key="t" :value="t">Torre {{ t }}</option></select>
          </label>
          <span class="lbl">Piso</span>
          <div class="chips">
            <button v-for="f in floors" :key="f" type="button" :class="{ on: f === floor }" @click="floor = f">{{ f }}</button>
          </div>
          <span class="lbl">Unidad</span>
          <div class="units">
            <button v-for="u in floorUnits" :key="u.id" type="button" :class="{ on: u.id === unitId }" @click="unitId = u.id">
              {{ u.unit_code }}
              <small>{{ u.unit_type ? 'Tipo ' + u.unit_type : '' }}</small>
              <i v-if="spacesOf('unit', u.id)" title="Tiene espacios propios" />
            </button>
          </div>
        </template>
      </template>
    </aside>

    <!-- ── Espacios de la selección ── -->
    <div class="spaces">
      <header class="head">
        <div>
          <h3>{{ title }}</h3>
          <p class="hint">{{ groups.length }} espacio(s) · {{ current.length }} foto(s) · espacio usado por el edificio: {{ totalMb }} MB</p>
        </div>
      </header>

      <p v-if="mode === 'unit' && !current.length && inheritedType" class="info">
        Esta unidad usa los espacios del <b>Tipo {{ inheritedType.code }}</b>. Agrega aquí solo lo que sea distinto.
      </p>

      <div v-if="ownerId != null" class="views">
        <button type="button" :class="{ on: view === 'plan' }" @click="view = 'plan'">📐 Plano de la unidad</button>
        <button type="button" :class="{ on: view === 'list' }" @click="view = 'list'">🖼️ Espacios y fotos</button>
      </div>

      <template v-if="view === 'plan' && ownerId != null">
        <p class="hint">Ubica los espacios de la unidad y conéctalos con puertas: en el recorrido se podrá pasar de uno a otro.
          Toca un espacio y luego <b>Armar en 3D / fotos</b> para tomarle las fotos.</p>
        <p v-if="mode === 'unit' && !plan.rooms.length && inheritedPlan" class="info">
          Esta unidad usa el plano del <b>Tipo {{ inheritedType?.code }}</b>.
          <button type="button" class="link" @click="copyInherited">Copiarlo para editarlo solo en esta unidad</button>
        </p>
        <UnitPlanEditor :plan="plan" :photo-count="photoCount" :saving="savingPlan" @change="onPlanChange" @build="buildRoom" />
      </template>

      <template v-else>
      <!-- Guía para tomar las fotos -->
      <div v-if="showGuide" class="guide">
        <button type="button" class="x" aria-label="Ocultar guía" @click="showGuide = false">✕</button>
        <strong>📸 Cómo fotografiar un espacio para armarlo en 3D</strong>
        <ol>
          <li>Párate en el centro, con el celular a la altura del pecho y en <b>horizontal</b>.</li>
          <li>Toma <b>una foto por pared</b>: frente, derecha, fondo e izquierda (mínimo 2, ideal 4).</li>
          <li>Apunta hacia abajo para el <b>piso</b> y hacia arriba para el <b>techo</b>.</li>
          <li>Agrega <b>detalles</b>: closet, ventana, vista, acabados. Una foto 360° también sirve.</li>
        </ol>
        <small>Sube todas juntas: se marcan solas en ese orden y luego puedes corregir cada una.</small>
      </div>

      <!-- Nuevo espacio -->
      <div v-if="ownerId != null" class="add">
        <span class="lbl">Nuevo espacio</span>
        <div class="kinds">
          <button v-for="k in SPACE_KINDS" :key="k.key" type="button" :class="{ on: newKind === k.key }" @click="newKind = k.key">
            <span>{{ k.icon }}</span>{{ k.label }}
          </button>
        </div>
        <div class="row">
          <button type="button" class="primary build" :disabled="busy" @click="createAndBuild">
            🧊 Armar {{ kindLabel(newKind).toLowerCase() }} en 3D
          </button>
          <label class="ghost" :class="{ disabled: busy }">
            {{ busy ? 'Procesando…' : 'o subir varias fotos a la vez' }}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden :disabled="busy" @change="onFiles($event)" />
          </label>
          <label class="ghost" :class="{ disabled: busy }">📷 Tomar fotos
            <input type="file" accept="image/*" capture="environment" multiple hidden :disabled="busy" @change="onFiles($event)" />
          </label>
          <select v-model.number="phoneAngle" title="Solo aplica a panorámicas de celular">
            <option :value="360">Panorámica de celular: 360°</option>
            <option :value="270">Panorámica de celular: 270°</option>
            <option :value="180">Panorámica de celular: 180°</option>
          </select>
        </div>
        <p v-if="progress" class="progress">{{ progress }}</p>
      </div>

      <div v-if="loading" class="hint">Cargando…</div>
      <div v-else class="groups">
        <article v-for="g in groups" :key="g.space" class="group">
          <header>
            <span class="gico">{{ kindIcon(g.kind) }}</span>
            <div class="gtitle">
              <strong>{{ g.space }}</strong>
              <small>{{ g.nodes.length }} foto(s) · {{ kindLabel(g.kind) }}</small>
            </div>
            <span v-if="g.canBuildRoom" class="ready">🧊 Habitación 3D lista</span>
            <span v-else class="pending">Faltan paredes para el 3D</span>
            <button type="button" class="build-btn" @click="building = g.space">🧊 Armar en 3D</button>
          </header>

          <!-- Qué superficies tiene -->
          <div class="checklist">
            <span v-for="s in ROOM_SURFACES" :key="s" :class="{ ok: g.surfaces[s] }">{{ g.surfaces[s] ? '✓' : '○' }} {{ SURFACES.find((x) => x.key === s)?.short }}</span>
          </div>

          <ul class="photos">
            <li v-for="p in g.nodes" :key="p.id" class="photo">
              <div class="thumb">
                <img :src="mediaUrl(p.thumb || p.url)" :alt="p.space" loading="lazy" />
                <span class="proj">{{ p.projection === 'flat' ? 'Foto' : '360°' }}</span>
                <span v-if="p.is_start" class="start">Portada</span>
              </div>
              <select v-if="p.projection === 'flat'" :value="p.surface ?? ''" aria-label="Qué muestra la foto"
                @change="setSurface(p, ($event.target as HTMLSelectElement).value)">
                <option value="">Sin marcar</option>
                <option v-for="s in SURFACES" :key="s.key" :value="s.key">{{ s.label }}</option>
              </select>
              <small v-else class="pano-note">360° · {{ p.links.length }} paso(s)</small>
              <div class="pacts">
                <button v-if="p.projection !== 'flat'" type="button" class="link" @click="editing = p">Pasos</button>
                <button v-if="!p.is_start" type="button" class="link" @click="setCover(p)">Portada</button>
                <button type="button" class="link danger" @click="removePhoto(p)">Quitar</button>
              </div>
            </li>
            <li class="photo addph">
              <label :class="{ disabled: busy }">
                <span>＋</span>
                <small>Agregar fotos<br />(siguiente: {{ SURFACES.find((s) => s.key === nextSurface(g.nodes))?.short }})</small>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden :disabled="busy" @change="onFiles($event, g)" />
              </label>
            </li>
          </ul>

          <footer>
            <select :value="g.kind ?? ''" aria-label="Tipo de espacio" @change="changeKind(g, ($event.target as HTMLSelectElement).value)">
              <option value="">Sin tipo</option>
              <option v-for="k in SPACE_KINDS" :key="k.key" :value="k.key">{{ k.icon }} {{ k.label }}</option>
            </select>
            <button type="button" class="link" @click="renameGroup(g)">Renombrar</button>
            <button type="button" class="link danger" @click="removeGroup(g)">Eliminar espacio</button>
          </footer>
        </article>
        <p v-if="ownerId != null && !groups.length" class="empty">Todavía no hay espacios. Elige un tipo arriba y sube sus fotos.</p>
      </div>
      </template>
    </div>

    <RoomBuilder
      v-if="builderGroup"
      :group="builderGroup"
      :busy="busy"
      :progress="progress"
      @upload="(s, f) => uploadToSurface(builderGroup!, s, f)"
      @remove="removeNode"
      @close="building = null"
    />

    <HotspotEditor
      v-if="editing"
      :panorama="editing"
      :siblings="current.filter((x) => x.projection !== 'flat')"
      :saving="savingLinks"
      @save="saveLinks"
      @close="editing = null"
    />
  </section>
</template>

<style scoped>
.dist { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 18px; align-items: start; }
.pick { display: flex; flex-direction: column; gap: 10px; background: rgba(0,0,0,.18); border: 1px solid var(--v3d-border); border-radius: 14px; padding: 14px; position: sticky; top: 84px; }
.seg { display: grid; grid-template-columns: 1fr 1fr; background: rgba(0,0,0,.25); border-radius: 10px; padding: 3px; }
.seg button { border: 0; background: transparent; color: var(--v3d-muted); padding: 8px 6px; border-radius: 8px; cursor: pointer; font-size: 13px; }
.seg button.on { background: var(--v3d-accent-soft); color: var(--v3d-accent); font-weight: 600; }
.hint { color: var(--v3d-muted); font-size: 12px; line-height: 1.5; }
.info { background: var(--v3d-accent-soft); border: 1px solid var(--v3d-border); border-radius: 10px; padding: 10px 12px; font-size: 13px; }
.empty { color: var(--v3d-muted); font-size: 13px; }
.type-card { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; border: 1px solid var(--v3d-border); background: transparent; color: var(--v3d-text); border-radius: 12px; padding: 10px; cursor: pointer; }
.type-card.on { border-color: var(--v3d-accent); background: var(--v3d-accent-soft); }
.type-card .code { width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; font-weight: 800; color: #1c120e; flex: none; }
.tinfo { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.tinfo small { color: var(--v3d-muted); font-size: 11px; }
.count { font-family: ui-monospace, monospace; font-size: 12px; background: rgba(0,0,0,.3); border-radius: 999px; padding: 2px 9px; }
.lbl { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--v3d-muted); display: flex; flex-direction: column; gap: 4px; }
select { padding: 7px 9px; border: 1px solid var(--v3d-border); border-radius: 8px; background: var(--v3d-surface-2); color: var(--v3d-text); font-size: 13px; min-width: 0; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chips button { min-width: 36px; border: 1px solid var(--v3d-border); background: transparent; color: var(--v3d-text); border-radius: 7px; padding: 5px 6px; font-family: ui-monospace, monospace; font-size: 12px; cursor: pointer; }
.chips button.on { background: var(--v3d-text); color: #1c120e; }
.units { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.units button { position: relative; display: flex; flex-direction: column; align-items: center; border: 1px solid var(--v3d-border); background: rgba(0,0,0,.2); color: var(--v3d-text); border-radius: 9px; padding: 7px 4px; cursor: pointer; font-weight: 700; }
.units button small { font-weight: 400; font-size: 10px; color: var(--v3d-muted); }
.units button.on { border-color: var(--v3d-accent); background: var(--v3d-accent-soft); }
.units i { position: absolute; top: 5px; right: 5px; width: 7px; height: 7px; border-radius: 50%; background: var(--v3d-accent); }
.spaces { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.spaces h3 { font-size: 18px; }
.guide { position: relative; border: 1px solid var(--v3d-border); background: linear-gradient(135deg, rgba(218,156,95,.14), rgba(0,0,0,.15)); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.guide ol { padding-left: 18px; display: flex; flex-direction: column; gap: 3px; color: var(--v3d-text); }
.guide small { color: var(--v3d-muted); }
.guide .x { position: absolute; top: 8px; right: 10px; background: none; border: 0; color: var(--v3d-muted); cursor: pointer; }
.add { border: 1px dashed var(--v3d-border); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.kinds { display: flex; flex-wrap: wrap; gap: 6px; }
.kinds button { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--v3d-border); background: transparent; color: var(--v3d-text); border-radius: 999px; padding: 6px 12px; cursor: pointer; font-size: 13px; }
.kinds button.on { background: var(--v3d-accent); color: var(--v3d-on-accent); border-color: var(--v3d-accent); font-weight: 600; }
.row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.progress { font-size: 13px; color: var(--v3d-accent); }
.primary { background: linear-gradient(135deg, var(--v3d-accent), var(--v3d-accent-strong)); color: var(--v3d-on-accent); border: 0; border-radius: 10px; padding: 9px 16px; cursor: pointer; font-weight: 700; font-size: 14px; }
.primary.disabled { opacity: .6; pointer-events: none; }
.primary.build { font-size: 15px; padding: 11px 18px; }
.views { display: inline-flex; align-self: flex-start; background: rgba(0,0,0,.25); border-radius: 12px; padding: 4px; gap: 2px; }
.views button { border: 0; background: transparent; color: var(--v3d-muted); padding: 8px 14px; border-radius: 9px; cursor: pointer; font-size: 13px; }
.views button.on { background: var(--v3d-accent); color: var(--v3d-on-accent); font-weight: 800; }
.ghost { background: transparent; color: var(--v3d-text); border: 1px solid var(--v3d-border); border-radius: 10px; padding: 9px 14px; cursor: pointer; font-size: 13px; }
.ghost.disabled { opacity: .5; pointer-events: none; }
.build-btn { background: var(--v3d-accent-soft); color: var(--v3d-accent); border: 1px solid var(--v3d-accent); border-radius: 999px; padding: 5px 12px; font-weight: 700; font-size: 12px; cursor: pointer; }
.build-btn:hover { background: var(--v3d-accent); color: var(--v3d-on-accent); }
.groups { display: flex; flex-direction: column; gap: 14px; }
.group { border: 1px solid var(--v3d-border); border-radius: 16px; background: rgba(0,0,0,.2); padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.group > header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.gico { font-size: 24px; }
.gtitle { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.gtitle small { color: var(--v3d-muted); font-size: 12px; }
.ready { font-size: 12px; font-weight: 700; color: #4ade80; background: rgba(34,197,94,.14); border: 1px solid rgba(34,197,94,.35); border-radius: 999px; padding: 4px 10px; }
.pending { font-size: 12px; color: var(--v3d-muted); border: 1px dashed var(--v3d-border); border-radius: 999px; padding: 4px 10px; }
.checklist { display: flex; flex-wrap: wrap; gap: 6px; }
.checklist span { font-size: 11px; padding: 3px 9px; border-radius: 999px; border: 1px solid var(--v3d-border); color: var(--v3d-muted); }
.checklist span.ok { color: #4ade80; border-color: rgba(34,197,94,.4); }
.photos { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.photo { display: flex; flex-direction: column; gap: 6px; border: 1px solid var(--v3d-border); border-radius: 12px; padding: 6px; background: rgba(0,0,0,.18); }
.thumb { position: relative; aspect-ratio: 4 / 3; background: #1c120e; border-radius: 8px; overflow: hidden; }
.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.proj, .start { position: absolute; top: 6px; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; background: rgba(28,18,14,.85); }
.proj { left: 6px; color: var(--v3d-accent); }
.start { right: 6px; color: #4ade80; }
.pano-note { font-size: 11px; color: var(--v3d-muted); padding: 4px 2px; }
.pacts { display: flex; gap: 8px; flex-wrap: wrap; }
.addph label { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 160px; border: 2px dashed var(--v3d-border); border-radius: 10px; cursor: pointer; color: var(--v3d-muted); text-align: center; }
.addph label:hover { border-color: var(--v3d-accent); color: var(--v3d-accent); }
.addph label.disabled { opacity: .5; pointer-events: none; }
.addph span { font-size: 28px; }
.addph small { font-size: 11px; }
.group footer { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; border-top: 1px solid var(--v3d-border); padding-top: 10px; }
.link { background: none; border: 0; color: var(--v3d-accent); cursor: pointer; font-size: 12px; padding: 0; }
.danger { color: #f87171; }
@media (max-width: 900px) { .dist { grid-template-columns: 1fr; } .pick { position: static; } }
@media (max-width: 480px) { .photos { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
