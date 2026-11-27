<script setup lang="ts">
// Crear / editar edificio con vista previa 3D en vivo. Después de guardar se habilitan
// unidades, fotos 360° y enlace público.
import { computed, defineAsyncComponent, nextTick, onMounted, reactive, ref, shallowRef, toRaw, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorMessage, visor3dService, type BuildingInput } from '@/services/visor3dService'
import { useAlerts } from '@/composables/useAlerts'
import { buildLayout, towerGrid } from '@/utils/visor3d/layout'
import { preparePhoto } from '@/utils/visor3d/image'
import { mediaUrl } from '@/utils/visor3d/device'
import { SPECIAL_LABELS } from '@/utils/visor3d/colors'
import { supportsWebGL } from '@/utils/visor3d/device'
import FloorPlan2D from '@/components/visor3d/FloorPlan2D.vue'
import type { FacadeResult } from '@/components/visor3d/admin/FacadeMarker.vue'
import UnitsPanel from '@/components/visor3d/admin/UnitsPanel.vue'
import ShareLinkPanel from '@/components/visor3d/admin/ShareLinkPanel.vue'
import SitePlanModal from '@/components/visor3d/admin/SitePlanModal.vue'
import type { BuildingPayload, SpecialKind, TowerConfig, UnitType } from '@/types/visor3d'

const BuildingScene = defineAsyncComponent(() => import('@/components/visor3d/BuildingScene.vue'))
const PanoramasPanel = defineAsyncComponent(() => import('@/components/visor3d/admin/PanoramasPanel.vue'))
const FacadeMarker = defineAsyncComponent(() => import('@/components/visor3d/admin/FacadeMarker.vue'))

const route = useRoute()
const router = useRouter()
const alerts = useAlerts()

const id = computed(() => (route.params.id ? Number(route.params.id) : null))
const tab = ref<'structure' | 'units' | 'photos' | 'share'>((['units', 'photos', 'share'] as const).find((t) => t === route.query.tab) ?? 'structure')
const loading = ref(!!id.value)
const saving = ref(false)
const payload = ref<BuildingPayload | null>(null)
const webgl = supportsWebGL()

// ── Foto del edificio (referencia que envía el cliente)
const coverUrl = ref<string | null>(null)        // ya subida
const pendingCover = ref<Blob | null>(null)      // elegida antes de crear el edificio
const pendingCoverUrl = ref<string | null>(null)
const coverBusy = ref(false)
const previewMode = ref<'3d' | 'photo' | 'compare'>('3d')
const overlay = ref(55)                          // opacidad del 3D sobre la foto (modo comparar)
const shownCover = computed(() => pendingCoverUrl.value ?? mediaUrl(coverUrl.value))

// ── Plano del conjunto (suelo del 3D y ubicación de las torres)
const sitePlanUrl = ref<string | null>(null)
const pendingPlan = ref<Blob | null>(null)
const pendingPlanUrl = ref<string | null>(null)
const planBusy = ref(false)
const planOpen = ref(false)
const shownPlan = computed(() => pendingPlanUrl.value ?? mediaUrl(sitePlanUrl.value))
const siteWidth = computed({
  get: () => Number(form.config.site?.width) || 100,
  set: (v: number) => { form.config.site = { ...(form.config.site ?? {}), width: v } },
})

async function onPlan(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  planBusy.value = true
  try {
    const { image } = await preparePhoto(file, 3000)
    if (id.value) {
      sitePlanUrl.value = (await visor3dService.uploadMedia(id.value, 'site_plan', image)).url
    } else {
      pendingPlan.value = image
      if (pendingPlanUrl.value) URL.revokeObjectURL(pendingPlanUrl.value)
      pendingPlanUrl.value = URL.createObjectURL(image)
    }
    if (!form.config.site?.width) siteWidth.value = 100
    // Torres sin posición: se reparten sobre el plano
    if (form.config.towers.some((t) => !t.offset)) {
      await nextTick()
      spreadTowers()
    }
    planOpen.value = true
    alerts.success('Plano cargado: arrastra las torres a su lugar y guarda')
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo usar ese plano'))
  } finally {
    planBusy.value = false
  }
}

function removePlan() {
  const clear = () => {
    pendingPlan.value = null
    if (pendingPlanUrl.value) URL.revokeObjectURL(pendingPlanUrl.value)
    pendingPlanUrl.value = null
    sitePlanUrl.value = null
    form.config.towers.forEach((t) => delete t.offset) // vuelven a la fila automática
  }
  if (!id.value || !sitePlanUrl.value) return clear()
  alerts.danger('¿Quitar el plano del conjunto? Las torres vuelven a ubicarse en fila.', async () => {
    await visor3dService.removeMedia(id.value!, 'site_plan')
    clear()
  })
}

// ── Fachada para el 3D (texturas enderezadas desde fotos): frente, costados, parte trasera y techo
type Face = 'front' | 'side' | 'left' | 'back' | 'roof'
const FACES: Face[] = ['front', 'side', 'left', 'back', 'roof']
const FACE_KIND = { front: 'facade_front', side: 'facade_side', left: 'facade_left', back: 'facade_back', roof: 'roof' } as const
const TOWER_URL = { front: 'facade_front_url', side: 'facade_side_url', left: 'facade_left_url', back: 'facade_back_url', roof: 'roof_url' } as const

const facadeFront = ref<string | null>(null)
const facadeSide = ref<string | null>(null)
const facadeLeft = ref<string | null>(null)
const facadeBack = ref<string | null>(null)
const roofImg = ref<string | null>(null)
const buildingFace = { front: facadeFront, side: facadeSide, left: facadeLeft, back: facadeBack, roof: roofImg }
const marking = ref(false)
const savingFacade = ref(false)

type MarkTarget = { kind: 'building' } | { kind: 'tower'; i: number }
const markTarget = ref<MarkTarget>({ kind: 'building' })
type FaceBlobs = Partial<Record<Face, Blob | null>>
// Imágenes elegidas antes de crear el edificio: se suben al crearlo
const pendingFacade = ref<FaceBlobs | null>(null)
// Imágenes de torre aún no subidas. Se atan al objeto de la torre (no a su código): si la torre se quita o se
// renombra antes de guardar, no quedan fotos huérfanas apuntando a un código que el servidor no conoce.
type TowerPending = { photo?: Blob; faces?: FaceBlobs }
const pendingTower = new WeakMap<object, TowerPending>()
const pendingOf = (t: TowerConfig) => pendingTower.get(toRaw(t))
const setPending = (t: TowerConfig, p: TowerPending) => {
  const prev = pendingOf(t) ?? {}
  pendingTower.set(toRaw(t), { ...prev, ...p, faces: { ...(prev.faces ?? {}), ...(p.faces ?? {}) } })
}
// Torres que ya existen en el servidor (las nuevas o renombradas esperan al guardar)
const savedCodes = computed(() => new Set((payload.value?.config.towers ?? []).map((t) => t.code)))
const canUploadNow = (t: TowerConfig) => !!id.value && savedCodes.value.has(t.code)

const markImage = computed(() => {
  const t = markTarget.value.kind === 'tower' ? form.config.towers[markTarget.value.i] : null
  return (t?.photo_url ? mediaUrl(t.photo_url) : null) ?? shownCover.value
})
const markTitle = computed(() =>
  markTarget.value.kind === 'tower' ? `Torre ${form.config.towers[markTarget.value.i]?.code}` : 'Todo el edificio')
/** Caras ya marcadas del objetivo (para mostrarlas en el marcador). */
const markExisting = computed<Partial<Record<Face, string | null>>>(() => {
  const target = markTarget.value
  if (target.kind === 'building') return Object.fromEntries(FACES.map((f) => [f, mediaUrl(buildingFace[f].value)]))
  const t = form.config.towers[target.i]
  return Object.fromEntries(FACES.map((f) => [f, mediaUrl(t?.[TOWER_URL[f]] ?? null)]))
})

function openMark(target: MarkTarget) {
  markTarget.value = target
  marking.value = true
}

/** Ajusta ancho/fondo de las torres para que el 3D tenga la misma silueta que la foto. */
function applyProportions(indexes: number[], res: FacadeResult) {
  const h = Number(form.config.floor_height) || 3
  for (const i of indexes) {
    const t = form.config.towers[i]
    const box = preview.value.towers.find((b) => b.code === t.code)
    const levels = box ? box.maxLevel - box.minLevel + 1 : Number(t.floors) || 1
    const height = levels * h
    const { rows, cols } = towerGrid(t)
    if (res.frontAspect) t.unit_width = Math.round(Math.min(40, Math.max(2, height / res.frontAspect / cols)) * 10) / 10
    if (res.sideAspect) t.unit_depth = Math.round(Math.min(40, Math.max(2, height / res.sideAspect / rows)) * 10) / 10
  }
}

/** Sube/borra cada cara: Blob = nueva textura, null = quitarla, ausente = no se tocó. */
async function applyFaces(target: MarkTarget, faces: FaceBlobs) {
  if (target.kind === 'building') {
    if (!id.value) {
      pendingFacade.value = { ...(pendingFacade.value ?? {}), ...faces }
      for (const f of FACES) if (f in faces) buildingFace[f].value = faces[f] ? URL.createObjectURL(faces[f]!) : null
      return
    }
    for (const f of FACES) {
      if (!(f in faces)) continue
      const b = faces[f]
      if (b) buildingFace[f].value = (await visor3dService.uploadMedia(id.value, FACE_KIND[f], b)).url
      else if (buildingFace[f].value) {
        if (!isLocal(buildingFace[f].value)) await visor3dService.removeMedia(id.value, FACE_KIND[f])
        buildingFace[f].value = null
      }
    }
    return
  }
  const t = form.config.towers[target.i]
  if (!canUploadNow(t)) {
    setPending(t, { faces })
    for (const f of FACES) if (f in faces) t[TOWER_URL[f]] = faces[f] ? URL.createObjectURL(faces[f]!) : null
    return
  }
  for (const f of FACES) {
    if (!(f in faces)) continue
    const b = faces[f]
    if (b) t[TOWER_URL[f]] = (await visor3dService.uploadTowerMedia(id.value!, t.code, FACE_KIND[f], b)).url
    else if (t[TOWER_URL[f]]) {
      if (!isLocal(t[TOWER_URL[f]])) await visor3dService.removeTowerMedia(id.value!, t.code, FACE_KIND[f])
      t[TOWER_URL[f]] = null
    }
  }
}

async function saveFacade(res: FacadeResult) {
  const target = markTarget.value
  savingFacade.value = true
  try {
    await applyFaces(target, res.faces)
    const idxs = target.kind === 'tower'
      ? [target.i]
      : form.config.towers.map((t, i) => (t.facade_front_url ? -1 : i)).filter((i) => i >= 0)
    applyProportions(idxs, res)
    marking.value = false
    previewMode.value = '3d'
    alerts.success('Fachada aplicada al modelo 3D')

    // Pisos que la persona confirmó en el marcador
    if (res.floors) {
      const targets = target.kind === 'tower' ? [target.i] : form.config.towers.map((_, i) => i)
      targets.forEach((i) => { form.config.towers[i].floors = res.floors! })
      setTimeout(() => applyProportions(targets, res), 300) // con los pisos nuevos, recalcular la silueta
    }
    if (id.value) await capturePreview(id.value)
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo guardar la fachada'))
  } finally {
    savingFacade.value = false
  }
}

async function onTowerPhoto(i: number, ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const t = form.config.towers[i]
  try {
    const { image } = await preparePhoto(file, 2400)
    if (canUploadNow(t)) t.photo_url = (await visor3dService.uploadTowerMedia(id.value!, t.code, 'photo', image)).url
    else {
      setPending(t, { photo: image })
      t.photo_url = URL.createObjectURL(image)
    }
    openMark({ kind: 'tower', i })
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo usar esa foto'))
  }
}

// Quitar fachada: confirmación en el mismo bloque (no en un aviso que pueda quedar tapado)
const confirmRemove = ref<string | null>(null)
const removing = ref(false)
const isLocal = (u?: string | null) => !!u && u.startsWith('blob:')
const allNull = (): FaceBlobs => Object.fromEntries(FACES.map((f) => [f, null]))

async function removeTowerFacade(i: number) {
  const t = form.config.towers[i]
  removing.value = true
  try {
    const p = pendingOf(t)
    if (p) delete p.faces
    await applyFaces({ kind: 'tower', i }, allNull())
    confirmRemove.value = null
    alerts.success(facadeFront.value
      ? `Torre ${t.code}: fachada propia quitada (ahora usa la del edificio)`
      : `Torre ${t.code}: fachada quitada, vuelve a verse con colores`)
    if (id.value) await capturePreview(id.value)
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo quitar la fachada'))
  } finally {
    removing.value = false
  }
}

/**
 * Sube lo que quedó pendiente (antes de crear el edificio o en torres nuevas aún no guardadas).
 * Solo para torres que existen en el servidor; un fallo no corta el guardado: se avisa y queda pendiente.
 */
async function uploadPending(buildingId: number): Promise<string[]> {
  const failed: string[] = []
  if (pendingFacade.value) {
    try {
      for (const f of FACES) {
        const b = pendingFacade.value[f]
        if (b) buildingFace[f].value = (await visor3dService.uploadMedia(buildingId, FACE_KIND[f], b)).url
      }
      pendingFacade.value = null
    } catch {
      failed.push('fachada del edificio')
    }
  }
  for (const t of form.config.towers) {
    const p = pendingOf(t)
    if (!p || !savedCodes.value.has(t.code)) continue
    try {
      if (p.photo) t.photo_url = (await visor3dService.uploadTowerMedia(buildingId, t.code, 'photo', p.photo)).url
      for (const f of FACES) {
        const b = p.faces?.[f]
        if (b) t[TOWER_URL[f]] = (await visor3dService.uploadTowerMedia(buildingId, t.code, FACE_KIND[f], b)).url
      }
      pendingTower.delete(toRaw(t))
    } catch {
      failed.push(`torre ${t.code}`)
    }
  }
  return failed
}

function warnFailed(failed: string[]) {
  if (failed.length) alerts.warning(`No se pudieron subir las imágenes de: ${failed.join(', ')}. Vuelve a intentarlo desde su sección.`)
}

async function removeFacade() {
  removing.value = true
  try {
    pendingFacade.value = null
    await applyFaces({ kind: 'building' }, allNull())
    confirmRemove.value = null
    const own = form.config.towers.filter((t) => t.facade_front_url).map((t) => t.code)
    alerts.success(own.length
      ? `Fachada del edificio quitada. Las torres ${own.join(', ')} conservan su fachada propia.`
      : 'Fachada quitada: el edificio vuelve a verse con colores')
    if (id.value) await capturePreview(id.value)
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo quitar la fachada'))
  } finally {
    removing.value = false
  }
}

// ── Foto del edificio
async function onCover(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  coverBusy.value = true
  try {
    const { image } = await preparePhoto(file, 2400)
    if (id.value) {
      coverUrl.value = (await visor3dService.uploadMedia(id.value, 'cover', image)).url
      alerts.success('Foto del edificio guardada')
    } else {
      pendingCover.value = image
      if (pendingCoverUrl.value) URL.revokeObjectURL(pendingCoverUrl.value)
      pendingCoverUrl.value = URL.createObjectURL(image)
    }
    previewMode.value = 'compare'
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo usar esa foto'))
  } finally {
    coverBusy.value = false
  }
}

function removeCover() {
  if (pendingCover.value) {
    pendingCover.value = null
    if (pendingCoverUrl.value) URL.revokeObjectURL(pendingCoverUrl.value)
    pendingCoverUrl.value = null
    return
  }
  if (!id.value) return
  alerts.danger('¿Quitar la foto del edificio?', async () => {
    await visor3dService.removeMedia(id.value!, 'cover')
    coverUrl.value = null
    if (previewMode.value !== '3d') previewMode.value = '3d'
  })
}

/** Imagen del modelo 3D para la tarjeta del edificio (se toma del lienzo de la vista previa). */
async function capturePreview(buildingId: number) {
  const canvas = document.querySelector<HTMLCanvasElement>('.preview .stage canvas')
  if (!canvas) return
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.82))
  if (blob && blob.size > 2000) await visor3dService.uploadMedia(buildingId, 'preview', blob).catch(() => undefined)
}

// ── Pasos del formulario (guían la creación; cada uno muestra ✓ cuando está completo)
type StepKey = 'datos' | 'tipos' | 'torres' | 'especiales' | 'foto' | 'plano'
const openStep = ref<StepKey>('datos')
const steps = computed(() => [
  { key: 'datos' as StepKey, title: 'Datos del edificio', help: 'Nombre, dirección y altura de cada piso.', done: !!form.name.trim() },
  { key: 'tipos' as StepKey, title: 'Tipos de unidad', help: 'Los modelos de apartamento: A, B, C… con área, alcobas y baños.',
    done: form.unit_types.length > 0 && form.unit_types.every((t) => !!t.code) },
  { key: 'torres' as StepKey, title: 'Torres y pisos', help: 'Cuántas torres, pisos y unidades por piso; foto y fachada de cada torre.',
    done: form.config.towers.length > 0 && preview.value.slots.length > 0 },
  { key: 'especiales' as StepKey, title: 'Pisos especiales', help: 'Lobby, parqueaderos, zonas comunes y terraza (no llevan apartamentos).',
    done: (form.config.special_floors?.length ?? 0) > 0, optional: true },
  { key: 'foto' as StepKey, title: 'Foto del edificio', help: 'Portada del edificio en el listado. La fachada 3D se marca en cada torre (paso 3).',
    done: !!shownCover.value, optional: true },
  { key: 'plano' as StepKey, title: 'Plano del conjunto', help: 'Para varias torres: el plano es el suelo y ubicas cada torre.',
    done: !!shownPlan.value, optional: true },
])
const doneCount = computed(() => steps.value.filter((x) => x.done).length)

function goStep(k: StepKey) {
  openStep.value = k
  nextTick(() => document.getElementById(`step-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}
function nextStep(k: StepKey) {
  const i = steps.value.findIndex((x) => x.key === k)
  const next = steps.value[i + 1]
  if (next) goStep(next.key)
}

/** Torres sin posición: se reparten en fila centrada sobre el plano (respeta las fijadas). */
function spreadTowers() {
  const n = form.config.towers.length
  const w = siteWidth.value
  form.config.towers.forEach((t, i) => {
    if (t.locked) return
    t.offset = { x: Math.round(((i + 0.5) / n - 0.5) * w * 0.6), z: 0 }
  })
}

// ── Formulario
const PALETTE = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb923c']
const KINDS: SpecialKind[] = ['lobby', 'parking', 'terrace', 'amenities']

const form = reactive<BuildingInput>({
  name: '',
  address: '',
  city: '',
  config: {
    floor_height: 3,
    colors: { facade: '#d6d3d1', roof: '#2b2b2b' },
    towers: [{ code: 'T1', name: 'Torre 1', floors: 8, units_per_floor: 4, layout: ['A', 'B', 'B', 'A'] }],
    special_floors: [{ tower: null, floor: 1, kind: 'lobby' }, { tower: null, floor: 9, kind: 'terrace' }],
  },
  unit_types: [
    { code: 'A', name: 'Esquinero', area_m2: 68, bedrooms: 3, bathrooms: 2, color: PALETTE[0] },
    { code: 'B', name: 'Central', area_m2: 52, bedrooms: 2, bathrooms: 2, color: PALETTE[1] },
  ],
})

function fill(p: BuildingPayload) {
  form.name = p.building.name
  form.address = p.building.address ?? ''
  form.city = p.building.city ?? ''
  form.config = JSON.parse(JSON.stringify({ colors: { facade: '#d6d3d1' }, special_floors: [], ...p.config }))
  coverUrl.value = p.building.cover_url ?? null
  facadeFront.value = p.building.facade_front_url ?? null
  facadeSide.value = p.building.facade_side_url ?? null
  facadeLeft.value = p.building.facade_left_url ?? null
  facadeBack.value = p.building.facade_back_url ?? null
  roofImg.value = p.building.roof_url ?? null
  sitePlanUrl.value = p.building.site_plan_url ?? null
  form.unit_types = p.unit_types.map(({ code, name, area_m2, bedrooms, bathrooms, color }) => ({ code, name, area_m2, bedrooms, bathrooms, color }))
}

async function load() {
  if (!id.value) return
  try {
    payload.value = await visor3dService.config(id.value)
    fill(payload.value)
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo cargar el edificio'))
    router.push({ name: 'Visor3dList' })
  } finally {
    loading.value = false
  }
}

// ── Torres / tipos / especiales
const typeCodes = computed(() => form.unit_types.map((t) => t.code).filter(Boolean))

function addTower() {
  const n = form.config.towers.length + 1
  const base = form.config.towers[0]
  form.config.towers.push({
    code: `T${n}`, name: `Torre ${n}`, floors: base?.floors ?? 8, units_per_floor: base?.units_per_floor ?? 4,
    layout: [...(base?.layout ?? [])],
  })
}

function resizeLayout(t: TowerConfig) {
  const n = Math.max(1, Math.min(30, Number(t.units_per_floor) || 1))
  const l = [...(t.layout ?? [])].slice(0, n)
  while (l.length < n) l.push(typeCodes.value[l.length % Math.max(1, typeCodes.value.length)] ?? 'A')
  t.layout = l
}

function addType() {
  const used = new Set(typeCodes.value)
  const code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((c) => !used.has(c)) ?? `T${form.unit_types.length + 1}`
  form.unit_types.push({ code, name: '', area_m2: 50, bedrooms: 2, bathrooms: 1, color: PALETTE[form.unit_types.length % PALETTE.length] })
}

function removeType(i: number) {
  const code = form.unit_types[i].code
  form.unit_types.splice(i, 1)
  const fallback = typeCodes.value[0] ?? ''
  form.config.towers.forEach((t) => (t.layout = (t.layout ?? []).map((c) => (c === code ? fallback : c))))
}

function addSpecial() {
  (form.config.special_floors ??= []).push({ tower: null, floor: 0, kind: 'parking' })
}

// ── Vista previa en vivo (con pequeño retardo para no reconstruir en cada tecla)
const preview = shallowRef(buildLayout(form.config, typeCodes.value))
let timer: ReturnType<typeof setTimeout> | undefined
watch(() => [form.config, form.unit_types], () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    try {
      preview.value = buildLayout(form.config, typeCodes.value)
    } catch { /* configuración a medias mientras se escribe */ }
  }, 250)
}, { deep: true })

const typeColor = computed(() => new Map(form.unit_types.map((t, i) => [t.code, t.color || PALETTE[i % PALETTE.length]])))
const previewColors = computed(() => preview.value.slots.map((s) => typeColor.value.get(s.type_code ?? '') ?? '#cbd5e1'))
const previewLabels = computed(() => Object.fromEntries(preview.value.slots.map((s) => [s.key, `${s.unit_code} · Tipo ${s.type_code ?? '—'}`])))
const tooBig = computed(() => preview.value.slots.length > 4000)

// ── Guardar
function clean(): BuildingInput {
  const c = JSON.parse(JSON.stringify(form)) as BuildingInput
  c.config.floor_height = Number(c.config.floor_height)
  c.config.towers.forEach((t) => {
    t.floors = Number(t.floors)
    t.units_per_floor = Number(t.units_per_floor)
    if (!t.name) delete t.name
    // La posición solo se guarda si hay plano del conjunto (si no, van en fila automática)
    if (!shownPlan.value || !t.offset) delete t.offset
    // Las imágenes de cada torre las maneja su propio endpoint
    delete t.photo_url
    for (const k of Object.values(TOWER_URL)) delete t[k]
  })
  c.config.special_floors = (c.config.special_floors ?? []).map((s) => ({ ...s, floor: Number(s.floor), tower: s.tower || null }))
  c.unit_types = c.unit_types.map((t: UnitType) => ({ ...t, name: t.name || null }))
  return c
}

async function save() {
  if (!form.name.trim()) return alerts.warning('Ponle un nombre al edificio')
  if (!form.unit_types.length) return alerts.warning('Agrega al menos un tipo de unidad')
  saving.value = true
  try {
    if (id.value) {
      payload.value = await visor3dService.update(id.value, clean())
      warnFailed(await uploadPending(id.value)) // fotos de torres nuevas, ya guardadas
      if (previewMode.value === '3d') await capturePreview(id.value)
      alerts.success('Edificio guardado')
    } else {
      const created = await visor3dService.create(clean())
      payload.value = created // ya existe: desde aquí, nunca volver a crear con el mismo formulario
      if (previewMode.value === '3d') await capturePreview(created.building.id).catch(() => undefined)
      warnFailed(await uploadPending(created.building.id))
      try {
        if (pendingPlan.value) {
          sitePlanUrl.value = (await visor3dService.uploadMedia(created.building.id, 'site_plan', pendingPlan.value)).url
          pendingPlan.value = null
          pendingPlanUrl.value = null
        }
        if (pendingCover.value) {
          coverUrl.value = (await visor3dService.uploadMedia(created.building.id, 'cover', pendingCover.value)).url
          removeCover()
        }
      } catch {
        warnFailed(['foto o plano del edificio'])
      }
      alerts.success('Edificio creado. Ahora genera sus unidades.')
      await router.replace({ name: 'Visor3dEdit', params: { id: created.building.id } })
      payload.value = created
      tab.value = 'units'
    }
  } catch (e) {
    alerts.error(errorMessage(e, 'No se pudo guardar'))
  } finally {
    saving.value = false
  }
}

function remove() {
  if (!id.value) return
  alerts.danger('¿Eliminar el edificio? Las unidades (propiedades) se conservan, solo se desvinculan.', async () => {
    await visor3dService.remove(id.value!)
    router.push({ name: 'Visor3dList' })
  })
}

async function reloadPayload() {
  if (id.value) payload.value = await visor3dService.config(id.value)
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="head">
      <button type="button" class="link" @click="router.push({ name: 'Visor3dList' })">← Edificios</button>
      <h1>{{ id ? form.name || 'Editar edificio' : 'Nuevo edificio' }}</h1>
      <div class="head-actions">
        <button v-if="id" type="button" class="secondary" @click="router.push({ name: 'Visor3dView', params: { id } })">Ver visor</button>
        <button v-if="id" type="button" class="link danger" @click="remove">Eliminar</button>
      </div>
    </header>

    <nav class="tabs">
      <button type="button" :class="{ on: tab === 'structure' }" @click="tab = 'structure'">Estructura</button>
      <button type="button" :class="{ on: tab === 'units' }" :disabled="!id" @click="tab = 'units'">Unidades</button>
      <button type="button" :class="{ on: tab === 'photos' }" :disabled="!id" @click="tab = 'photos'">Distribución y fotos</button>
      <button type="button" :class="{ on: tab === 'share' }" :disabled="!id" @click="tab = 'share'">Compartir</button>
    </nav>

    <div v-if="loading" class="state">Cargando…</div>

    <div v-else-if="tab === 'structure'" class="structure">
      <form class="form" @submit.prevent="save">
        <!-- Avance -->
        <nav class="stepper" aria-label="Pasos">
          <button v-for="(st, i) in steps" :key="st.key" type="button" :class="{ on: openStep === st.key, done: st.done }" @click="goStep(st.key)">
            <b>{{ st.done ? '✓' : i + 1 }}</b><span>{{ st.title }}</span>
          </button>
        </nav>
        <p class="progress-txt">{{ doneCount }} de {{ steps.length }} pasos listos · los marcados como opcionales se pueden saltar</p>

        <!-- 1 · Datos -->
        <section id="step-datos" class="step" :class="{ open: openStep === 'datos', done: steps[0].done }">
          <button type="button" class="step-head" @click="openStep = 'datos'">
            <b>{{ steps[0].done ? '✓' : 1 }}</b><span><strong>{{ steps[0].title }}</strong><small>{{ steps[0].help }}</small></span>
          </button>
          <div v-show="openStep === 'datos'" class="step-body">
            <label>Nombre del edificio o conjunto<input v-model="form.name" required maxlength="150" placeholder="Ej: Conjunto Los Robles" /></label>
            <div class="two">
              <label>Dirección<input v-model="form.address" maxlength="255" placeholder="Calle 100 # 15-20" /></label>
              <label>Ciudad<input v-model="form.city" maxlength="100" placeholder="Bogotá" /></label>
            </div>
            <div class="two">
              <label>Altura de cada piso (m)<input v-model.number="form.config.floor_height" type="number" min="2.2" max="6" step="0.1" />
                <small class="fhint">Normal: 2,5 a 3 m</small></label>
              <label>Color de fachada<input v-model="form.config.colors!.facade" type="color" /></label>
              <label>Color del techo<input v-model="form.config.colors!.roof" type="color" />
                <small class="fhint">Se usa si no hay foto del techo</small></label>
            </div>
            <button type="button" class="next" @click="nextStep('datos')">Siguiente: tipos de unidad →</button>
          </div>
        </section>

        <!-- 2 · Tipos -->
        <section id="step-tipos" class="step" :class="{ open: openStep === 'tipos', done: steps[1].done }">
          <button type="button" class="step-head" @click="openStep = 'tipos'">
            <b>{{ steps[1].done ? '✓' : 2 }}</b><span><strong>{{ steps[1].title }}</strong><small>{{ steps[1].help }}</small></span>
          </button>
          <div v-show="openStep === 'tipos'" class="step-body">
            <div class="type-head"><span>Código</span><span>Nombre</span><span>m²</span><span>Alcobas</span><span>Baños</span><span>Color</span><span /></div>
            <div v-for="(t, i) in form.unit_types" :key="i" class="type-row">
              <input v-model="t.code" class="code" maxlength="10" aria-label="Código" />
              <input v-model="t.name" placeholder="Ej: Esquinero" aria-label="Nombre" />
              <input v-model.number="t.area_m2" type="number" min="0" step="0.5" aria-label="m²" placeholder="m²" />
              <input v-model.number="t.bedrooms" type="number" min="0" max="20" aria-label="Alcobas" placeholder="0" />
              <input v-model.number="t.bathrooms" type="number" min="0" max="20" aria-label="Baños" placeholder="0" />
              <input v-model="t.color" type="color" aria-label="Color en la vista previa" />
              <button type="button" class="icon-btn" :disabled="form.unit_types.length < 2" title="Quitar tipo" @click="removeType(i)">✕</button>
            </div>
            <div class="step-foot">
              <button type="button" class="add-btn" @click="addType">+ Agregar tipo</button>
              <button type="button" class="next" @click="nextStep('tipos')">Siguiente: torres →</button>
            </div>
          </div>
        </section>

        <!-- 3 · Torres -->
        <section id="step-torres" class="step" :class="{ open: openStep === 'torres', done: steps[2].done }">
          <button type="button" class="step-head" @click="openStep = 'torres'">
            <b>{{ steps[2].done ? '✓' : 3 }}</b><span><strong>{{ steps[2].title }}</strong><small>{{ steps[2].help }}</small></span>
          </button>
          <div v-show="openStep === 'torres'" class="step-body">
            <div v-for="(t, i) in form.config.towers" :key="i" class="tower">
              <div class="tower-top">
                <span class="tchip">{{ t.code || '?' }}</span>
                <input v-model="t.name" class="tname" maxlength="60" placeholder="Nombre de la torre" aria-label="Nombre de la torre" />
                <button v-if="form.config.towers.length > 1" type="button" class="icon-btn" title="Quitar torre" @click="form.config.towers.splice(i, 1)">✕</button>
              </div>
              <div class="three">
                <label>Código<input v-model="t.code" maxlength="20" /></label>
                <label>Pisos<input v-model.number="t.floors" type="number" min="1" max="80" /></label>
                <label>Unidades por piso<input v-model.number="t.units_per_floor" type="number" min="1" max="30" @change="resizeLayout(t)" /></label>
              </div>
              <div class="layout">
                <span>Tipo de cada posición en el piso:</span>
                <select v-for="(_, p) in t.layout ?? []" :key="p" v-model="t.layout![p]" :aria-label="`Posición ${p + 1}`">
                  <option v-for="c in typeCodes" :key="c" :value="c">{{ p + 1 }}: {{ c }}</option>
                </select>
                <button v-if="!t.layout?.length" type="button" class="link" @click="resizeLayout(t)">Definir</button>
              </div>
              <div class="tower-media">
                <img v-if="t.photo_url" :src="mediaUrl(t.photo_url)" :alt="`Foto de la torre ${t.code}`" />
                <div v-else class="tm-empty">📷</div>
                <div class="tm-body">
                  <strong>Foto y fachada de la torre <small class="opt">opcional</small></strong>
                  <small v-if="t.facade_front_url" class="ok">✓ El 3D usa la fachada de esta torre</small>
                  <small v-else-if="shownCover">Sin fachada propia: usa la del edificio, si la tiene.</small>
                  <small v-else>Sube su foto y marca la fachada: el 3D toma su aspecto y proporciones.</small>
                  <div class="row">
                    <label class="secondary sm">{{ t.photo_url ? 'Cambiar foto' : 'Subir foto' }}
                      <input type="file" accept="image/*" hidden @change="onTowerPhoto(i, $event)" />
                    </label>
                    <button type="button" class="primary sm" :disabled="!t.photo_url && !shownCover" @click="openMark({ kind: 'tower', i })">
                      {{ t.facade_front_url ? 'Volver a marcar' : 'Marcar fachada' }}
                    </button>
                    <template v-if="t.facade_front_url">
                      <span v-if="confirmRemove === 'tower-' + i" class="confirm">
                        ¿Quitar?
                        <button type="button" class="danger-btn" :disabled="removing" @click="removeTowerFacade(i)">{{ removing ? 'Quitando…' : 'Sí, quitar' }}</button>
                        <button type="button" class="link" @click="confirmRemove = null">Cancelar</button>
                      </span>
                      <button v-else type="button" class="link danger" @click="confirmRemove = 'tower-' + i">Quitar fachada</button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <div class="step-foot">
              <button type="button" class="add-btn" @click="addTower">+ Agregar torre</button>
              <button type="button" class="next" @click="nextStep('torres')">Siguiente: pisos especiales →</button>
            </div>
          </div>
        </section>

        <!-- 4 · Pisos especiales -->
        <section id="step-especiales" class="step" :class="{ open: openStep === 'especiales', done: steps[3].done }">
          <button type="button" class="step-head" @click="openStep = 'especiales'">
            <b>{{ steps[3].done ? '✓' : 4 }}</b><span><strong>{{ steps[3].title }} <em>opcional</em></strong><small>{{ steps[3].help }}</small></span>
          </button>
          <div v-show="openStep === 'especiales'" class="step-body">
            <p class="hint">Usa 0 o negativos para sótanos, y un piso por encima del último para la terraza.</p>
            <div v-for="(sf, i) in form.config.special_floors" :key="i" class="special">
              <select v-model="sf.tower" aria-label="Torre">
                <option :value="null">Todas las torres</option>
                <option v-for="t in form.config.towers" :key="t.code" :value="t.code">{{ t.code }}</option>
              </select>
              <input v-model.number="sf.floor" type="number" min="-10" max="80" aria-label="Piso" />
              <select v-model="sf.kind" aria-label="Tipo">
                <option v-for="k in KINDS" :key="k" :value="k">{{ SPECIAL_LABELS[k] }}</option>
              </select>
              <button type="button" class="icon-btn" title="Quitar" @click="form.config.special_floors!.splice(i, 1)">✕</button>
            </div>
            <div class="step-foot">
              <button type="button" class="add-btn" @click="addSpecial">+ Agregar piso especial</button>
              <button type="button" class="next" @click="nextStep('especiales')">Siguiente: foto y fachada →</button>
            </div>
          </div>
        </section>

        <!-- 5 · Foto y fachada -->
        <section id="step-foto" class="step" :class="{ open: openStep === 'foto', done: steps[4].done }">
          <button type="button" class="step-head" @click="openStep = 'foto'">
            <b>{{ steps[4].done ? '✓' : 5 }}</b><span><strong>{{ steps[4].title }} <em>opcional</em></strong><small>{{ steps[4].help }}</small></span>
          </button>
          <div v-show="openStep === 'foto'" class="step-body">
            <div v-if="shownCover" class="cover-preview">
              <img :src="shownCover" alt="Foto del edificio" />
              <div class="cover-actions">
                <label class="secondary">Cambiar<input type="file" accept="image/*" hidden @change="onCover" /></label>
                <button type="button" class="link danger" @click="removeCover">Quitar</button>
              </div>
            </div>
            <div v-if="shownCover && facadeFront" class="facade-box">
              <div>
                <strong>Fachada en el 3D</strong>
                <small>Este edificio tiene una fachada general (versión anterior). Ahora la fachada se marca en cada torre (paso 3);
                  puedes quitar esta.</small>
              </div>
              <div class="facade-thumbs" v-if="facadeFront">
                <img :src="mediaUrl(facadeFront)" alt="Frente" />
                <img v-if="facadeSide" :src="mediaUrl(facadeSide)" alt="Costado derecho" />
              <img v-if="facadeLeft" :src="mediaUrl(facadeLeft)" alt="Costado izquierdo" />
              <img v-if="facadeBack" :src="mediaUrl(facadeBack)" alt="Trasera" />
              <img v-if="roofImg" :src="mediaUrl(roofImg)" alt="Techo" />
              </div>
              <div class="row">
                <template v-if="facadeFront">
                  <span v-if="confirmRemove === 'building'" class="confirm">
                    ¿Quitar?
                    <button type="button" class="danger-btn" :disabled="removing" @click="removeFacade">{{ removing ? 'Quitando…' : 'Sí, quitar' }}</button>
                    <button type="button" class="link" @click="confirmRemove = null">Cancelar</button>
                  </span>
                  <button v-else type="button" class="link danger" @click="confirmRemove = 'building'">Quitar fachada</button>
                </template>
              </div>
            </div>
            <label v-else class="drop" :class="{ busy: coverBusy }">
              <span class="drop-ico">📷</span>
              <strong>{{ coverBusy ? 'Procesando…' : 'Subir foto del edificio o conjunto (portada)' }}</strong>
              <small>JPG, PNG o WebP · se comprime en tu navegador</small>
              <input type="file" accept="image/*" hidden :disabled="coverBusy" @change="onCover" />
            </label>
            <div class="step-foot">
              <span />
              <button type="button" class="next" @click="nextStep('foto')">Siguiente: plano del conjunto →</button>
            </div>
          </div>
        </section>

        <!-- 6 · Plano -->
        <section id="step-plano" class="step" :class="{ open: openStep === 'plano', done: steps[5].done }">
          <button type="button" class="step-head" @click="openStep = 'plano'">
            <b>{{ steps[5].done ? '✓' : 6 }}</b><span><strong>{{ steps[5].title }} <em>opcional</em></strong><small>{{ steps[5].help }}</small></span>
          </button>
          <div v-show="openStep === 'plano'" class="step-body">
            <template v-if="shownPlan">
              <button type="button" class="plan-thumb" @click="planOpen = true">
                <img :src="shownPlan" alt="Plano del conjunto" />
                <span>🗺️ Abrir editor del plano · ubicar, girar y dar forma a las torres</span>
              </button>
              <div class="row">
                <label class="inline">Ancho real del terreno <input v-model.number="siteWidth" type="number" min="10" max="3000" step="5" /> m</label>
                <label class="secondary sm">Cambiar plano<input type="file" accept="image/*" hidden @change="onPlan" /></label>
                <button type="button" class="link danger" @click="removePlan">Quitar plano</button>
              </div>
            </template>
            <label v-else class="drop" :class="{ busy: planBusy }">
              <span class="drop-ico">🗺️</span>
              <strong>{{ planBusy ? 'Procesando…' : 'Subir plano o vista aérea del conjunto' }}</strong>
              <small>Plano de implantación, render o captura de mapa. Se abre el editor para ubicar las torres.</small>
              <input type="file" accept="image/*" hidden :disabled="planBusy" @change="onPlan" />
            </label>
          </div>
        </section>

        <div class="save">
          <span class="muted">{{ form.config.towers.length }} torre(s) · {{ preview.slots.length }} unidades</span>
          <button type="submit" class="primary" :disabled="saving || tooBig">{{ saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear edificio' }}</button>
        </div>
        <p v-if="tooBig" class="warn">Demasiadas unidades para un solo edificio (máx. 4000).</p>
      </form>

      <div class="preview">
        <div v-if="shownCover" class="pmodes">
          <button type="button" :class="{ on: previewMode === '3d' }" @click="previewMode = '3d'">Modelo 3D</button>
          <button type="button" :class="{ on: previewMode === 'photo' }" @click="previewMode = 'photo'">Foto del cliente</button>
          <button type="button" :class="{ on: previewMode === 'compare' }" @click="previewMode = 'compare'">Comparar</button>
          <input v-if="previewMode === 'compare'" v-model.number="overlay" type="range" min="10" max="90" aria-label="Opacidad del 3D" />
        </div>
        <div class="stage" :class="previewMode">
          <img v-if="shownCover && previewMode !== '3d'" :src="shownCover" class="ref-photo" alt="Foto del edificio" />
          <Suspense v-if="webgl && !tooBig">
            <BuildingScene
              v-show="previewMode !== 'photo'"
              :style="previewMode === 'compare' ? { opacity: overlay / 100 } : undefined"
              class="scene"
              capturable
              :facade-front="facadeFront"
              :facade-side="facadeSide"
              look="facade"
              :site-plan="shownPlan"
              :site-width="siteWidth"
              :faces="{ left: facadeLeft, back: facadeBack, roof: roofImg }"
              :roof-color="form.config.colors?.roof"
              :layout="preview" :colors="previewColors" :selected-floor="null" :selected-key="null" :facade="form.config.colors?.facade" />
            <template #fallback><div class="state">Cargando vista previa…</div></template>
          </Suspense>
          <div v-else class="plan">
            <FloorPlan2D :layout="preview" :colors="previewColors" :selected-floor="null" :selected-key="null" :labels="previewLabels" />
          </div>
        </div>
        <p v-if="previewMode === 'compare'" class="hint">Gira y acerca el 3D hasta que coincida con la foto, y ajusta pisos y
          unidades por piso hasta que las franjas calcen.</p>
        <ul class="legend">
          <li v-for="t in form.unit_types" :key="t.code"><i :style="{ background: typeColor.get(t.code) }" />Tipo {{ t.code }}</li>
        </ul>
      </div>
    </div>

    <UnitsPanel v-else-if="tab === 'units' && id && payload" :building-id="id" :payload="payload" @changed="reloadPayload" />
    <PanoramasPanel v-else-if="tab === 'photos' && id && payload" :building-id="id" :payload="payload" />
    <ShareLinkPanel v-else-if="tab === 'share' && id" :building-id="id" />

    <FacadeMarker
      v-if="marking && markImage"
      :image-url="markImage"
      :title="markTitle"
      :existing="markExisting"
      :current-floors="markTarget.kind === 'tower' ? Number(form.config.towers[markTarget.i]?.floors) || null : null"
      :saving="savingFacade"
      @save="saveFacade"
      @close="marking = false"
    />
    <SitePlanModal
      v-if="planOpen && shownPlan"
      v-model:site-width="siteWidth"
      :plan-url="shownPlan"
      :towers="form.config.towers"
      :layout="preview"
      :colors="previewColors"
      :facade-front="facadeFront"
      :facade-side="facadeSide"
      :faces="{ left: facadeLeft, back: facadeBack, roof: roofImg }"
      :roof-color="form.config.colors?.roof"
      :facade="form.config.colors?.facade"
      @close="planOpen = false"
    />
  </div>
</template>

<style scoped>
.page { max-width: 1400px; margin: 96px auto 40px; background: var(--v3d-card); border: 1px solid var(--v3d-border); color: var(--v3d-text); border-radius: 18px; padding: 16px 16px 48px; color: var(--v3d-text); }
.head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.head h1 { font-size: 22px; flex: 1; }
.head-actions { display: flex; gap: 10px; align-items: center; }
.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--v3d-border); margin-bottom: 14px; overflow-x: auto; }
.tabs button { border: 0; background: none; padding: 10px 14px; cursor: pointer; color: var(--v3d-muted); border-bottom: 2px solid transparent; font-size: 14px; white-space: nowrap; }
.tabs button.on { color: var(--v3d-accent-strong); border-bottom-color: var(--v3d-accent); font-weight: 600; }
.tabs button:disabled { opacity: .45; cursor: not-allowed; }
.structure { display: grid; grid-template-columns: minmax(0, 440px) minmax(0, 1fr); gap: 16px; align-items: start; }
.form { display: flex; flex-direction: column; gap: 12px; }
fieldset { background: var(--v3d-surface-2); border: 1px solid var(--v3d-border); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
legend { font-weight: 600; font-size: 14px; padding: 0 6px; }
label { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--v3d-muted); }
input, select { padding: 7px 9px; border: 1px solid var(--v3d-border); border-radius: 8px; font-size: 14px; background: var(--v3d-surface); color: var(--v3d-text); min-width: 0; }
input[type='color'] { padding: 2px; height: 34px; width: 46px; }
.two, .three { display: grid; gap: 8px; }
.two { grid-template-columns: 1fr 1fr; }
.three { grid-template-columns: 1fr 1fr 1.3fr; }
.type-row { display: grid; grid-template-columns: 48px 1fr 64px 56px 56px 46px 30px; gap: 4px; align-items: center; }
.type-row .code { color: var(--v3d-text); text-align: center; font-weight: 700; }
.tower { border: 1px dashed var(--v3d-border); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.layout { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 12px; color: var(--v3d-muted); }
.layout select { padding: 4px 6px; font-size: 12px; }
.special { display: grid; grid-template-columns: 1fr 70px 1fr auto; gap: 6px; align-items: center; }
.hint, .muted { color: var(--v3d-muted); font-size: 12px; }
.warn { color: #f87171; font-size: 13px; }
.save { position: sticky; bottom: 0; background: var(--v3d-surface); padding: 10px 0; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--v3d-border); }
.preview { position: sticky; top: 80px; }
.pmodes { display: flex; gap: 4px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
.pmodes button { border: 1px solid var(--v3d-border); background: transparent; color: var(--v3d-muted); border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 13px; }
.pmodes button.on { background: var(--v3d-accent-soft); color: var(--v3d-accent); border-color: var(--v3d-accent); }
.pmodes input { flex: 1; min-width: 120px; accent-color: var(--v3d-accent); }
.stage { position: relative; }
.ref-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #1c120e; }
.stage.compare .scene, .stage.compare :deep(canvas) { position: relative; z-index: 1; }
.stage.compare :deep(canvas) { mix-blend-mode: screen; }
.cover-preview { position: relative; border-radius: 10px; overflow: hidden; }
.cover-preview img { width: 100%; max-height: 220px; object-fit: cover; display: block; }
.cover-actions { position: absolute; right: 8px; bottom: 8px; display: flex; gap: 8px; align-items: center; background: rgba(28,18,14,.8); padding: 6px 10px; border-radius: 10px; }
.drop { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 22px 12px; border: 2px dashed var(--v3d-border); border-radius: 12px; cursor: pointer; text-align: center; color: var(--v3d-muted); transition: border-color .2s; }
.drop:hover { border-color: var(--v3d-accent); }
.drop strong { color: var(--v3d-text); font-size: 14px; }
.drop.busy { opacity: .6; pointer-events: none; }
.drop-ico { font-size: 28px; }
.facade-box { margin-top: 10px; border: 1px solid var(--v3d-border); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 10px; background: var(--v3d-surface-2); }
.facade-box > div:first-child { display: flex; flex-direction: column; gap: 3px; }
.facade-box small { color: var(--v3d-muted); font-size: 12px; }
.facade-thumbs { display: flex; gap: 8px; }
.facade-thumbs img { height: 110px; border-radius: 6px; border: 1px solid var(--v3d-border); background: #000; }
.row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.primary.sm { padding: 8px 14px; font-size: 13px; }
.stepper { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
.stepper button { flex: none; display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--v3d-border); background: var(--v3d-surface-2);
  color: var(--v3d-muted); border-radius: 999px; padding: 5px 12px 5px 5px; cursor: pointer; font-size: 12px; white-space: nowrap; }
.stepper b { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.08); color: var(--v3d-text); font-size: 11px; }
.stepper button.done b { background: rgba(34,197,94,.25); color: #4ade80; }
.stepper button.on { border-color: var(--v3d-accent); color: var(--v3d-text); background: var(--v3d-accent-soft); }
.stepper button.on b { background: var(--v3d-accent); color: var(--v3d-on-accent); }
.progress-txt { font-size: 11px; color: var(--v3d-muted); margin-top: -4px; }
.step { border: 1px solid var(--v3d-border); border-radius: 14px; background: var(--v3d-surface-2); scroll-margin-top: 90px; transition: border-color .2s; }
.step.open { border-color: var(--v3d-accent); background: var(--v3d-surface-2); }
.step-head { width: 100%; display: flex; gap: 12px; align-items: center; text-align: left; background: none; border: 0; color: var(--v3d-text); padding: 12px 14px; cursor: pointer; }
.step-head > b { width: 30px; height: 30px; flex: none; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.08); font-size: 13px; }
.step.done .step-head > b { background: rgba(34,197,94,.22); color: #4ade80; }
.step.open .step-head > b { background: var(--v3d-accent); color: var(--v3d-on-accent); }
.step-head span { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.step-head strong { font-size: 15px; }
.step-head em { font-style: normal; font-size: 10px; font-weight: 600; color: var(--v3d-muted); border: 1px solid var(--v3d-border); border-radius: 999px; padding: 1px 7px; margin-left: 6px; vertical-align: middle; }
.step-head small { color: var(--v3d-muted); font-size: 12px; }
.step-body { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 10px; }
.step-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.next { align-self: flex-end; background: var(--v3d-accent-soft); color: var(--v3d-accent); border: 1px solid var(--v3d-accent); border-radius: 10px; padding: 8px 14px; font-weight: 700; cursor: pointer; font-size: 13px; }
.next:hover { background: var(--v3d-accent); color: var(--v3d-on-accent); }
.add-btn { background: transparent; border: 1px dashed var(--v3d-border); color: var(--v3d-text); border-radius: 10px; padding: 8px 14px; cursor: pointer; font-size: 13px; }
.add-btn:hover { border-color: var(--v3d-accent); color: var(--v3d-accent); }
.icon-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--v3d-border); background: transparent; color: #f87171; cursor: pointer; }
.icon-btn:disabled { opacity: .35; cursor: default; }
.fhint { color: var(--v3d-muted); font-size: 11px; }
.type-head { display: grid; grid-template-columns: 48px 1fr 64px 56px 56px 46px 30px; gap: 4px; font-size: 10px; color: var(--v3d-muted); text-transform: uppercase; letter-spacing: .06em; }
.tower-top { display: flex; align-items: center; gap: 8px; }
.tchip { min-width: 34px; height: 30px; padding: 0 8px; border-radius: 8px; background: var(--v3d-accent); color: var(--v3d-on-accent); font-weight: 800; display: grid; place-items: center; }
.tname { flex: 1; }
.tm-empty { width: 64px; height: 84px; border-radius: 6px; border: 1px dashed var(--v3d-border); display: grid; place-items: center; font-size: 22px; flex: none; }
.opt { font-size: 10px; color: var(--v3d-muted); font-weight: 400; }
.plan-thumb { position: relative; padding: 0; border: 1px solid var(--v3d-border); border-radius: 12px; overflow: hidden; cursor: pointer; background: #000; }
.plan-thumb img { width: 100%; max-height: 220px; object-fit: cover; display: block; opacity: .85; transition: opacity .2s; }
.plan-thumb span { position: absolute; left: 10px; right: 10px; bottom: 10px; background: rgba(20,13,10,.85); color: var(--v3d-text); border: 1px solid var(--v3d-accent);
  border-radius: 10px; padding: 8px 12px; font-size: 13px; font-weight: 700; }
.plan-thumb:hover img { opacity: 1; }
.inline { display: inline-flex; flex-direction: row; align-items: center; gap: 6px; font-size: 12px; }
.inline input { width: 90px; }
.secondary.sm { padding: 7px 12px; font-size: 13px; cursor: pointer; }
.confirm { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #fca5a5; background: rgba(239,68,68,.12);
  border: 1px solid rgba(239,68,68,.35); border-radius: 8px; padding: 4px 6px 4px 10px; }
.danger-btn { background: #ef4444; color: #fff; border: 0; border-radius: 6px; padding: 6px 10px; font-weight: 700; font-size: 12px; cursor: pointer; }
.danger-btn:disabled { opacity: .6; }
.tower-media { display: flex; gap: 10px; align-items: flex-start; border-top: 1px dashed var(--v3d-border); padding-top: 8px; }
.tower-media img { width: 64px; height: 84px; object-fit: cover; border-radius: 6px; border: 1px solid var(--v3d-border); flex: none; }
.tm-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.tm-body small { color: var(--v3d-muted); font-size: 12px; }
.tm-body small.ok { color: #4ade80; }
.stage { height: min(70vh, 680px); min-height: 380px; border-radius: 14px; overflow: hidden; background: var(--v3d-stage); touch-action: none; }
.plan { height: 100%; overflow: auto; padding: 10px; }
.legend { list-style: none; display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px; margin-top: 8px; }
.legend li { display: flex; gap: 6px; align-items: center; }
.legend i { width: 12px; height: 12px; border-radius: 3px; }
.state { padding: 40px; text-align: center; color: var(--v3d-muted); }
.primary { background: var(--v3d-accent); color: var(--v3d-on-accent); border: 0; border-radius: 8px; padding: 10px 16px; cursor: pointer; font-weight: 600; }
.primary:disabled { opacity: .6; }
.secondary { color: var(--v3d-text); background: var(--v3d-surface-2); border: 1px solid var(--v3d-border); border-radius: 8px; padding: 8px 14px; cursor: pointer; }
.link { background: none; border: 0; color: var(--v3d-accent); cursor: pointer; font-size: 13px; align-self: flex-start; padding: 0; }
.link:disabled { opacity: .4; cursor: default; }
.danger { color: #f87171; }

@media (max-width: 960px) {
  .structure { grid-template-columns: 1fr; }
  .preview { position: static; order: -1; }
  .stage { height: 48vh; min-height: 300px; }
  .type-row { grid-template-columns: 44px 1fr 60px 50px 50px 40px auto; }
}
</style>
