<script setup lang="ts">
// Recorrido de la unidad: mezcla fotos 360° (Photo Sphere Viewer, con puntos de paso entre espacios)
// y fotos normales. La librería 360° se carga solo al abrir el recorrido.
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PanoramaNode, Tour } from '@/types/visor3d'
import { mediaUrl } from '@/utils/visor3d/device'
import { type SpaceGroup, groupBySpace, kindIcon, kindLabel, surfaceLabel } from '@/utils/visor3d/spaces'

const RoomScene = defineAsyncComponent(() => import('./RoomScene.vue'))
import NexiLivingLogo from '@/components/NexiLivingLogo.vue'
import { PLAN_COLS, PLAN_ROWS, center, neighbors } from '@/utils/visor3d/plan'

const props = defineProps<{ tour: Tour; title?: string; startId?: number | null }>()
const emit = defineEmits<{ close: [] }>()

const el = ref<HTMLDivElement>()
const loading = ref(false)
const failed = ref('')
// Las fotos se agrupan por espacio; un espacio con paredes marcadas se ve como habitación 3D
const groups = computed(() => groupBySpace(props.tour.nodes))
const ordered = computed(() => groups.value.flatMap((g) => g.nodes))
const currentId = ref<number | null>(props.startId ?? props.tour.start ?? props.tour.nodes[0]?.id ?? null)
const current = computed<PanoramaNode | undefined>(() => props.tour.nodes.find((n) => n.id === currentId.value))
const currentGroup = computed(() => groups.value.find((g) => g.nodes.some((n) => n.id === currentId.value)))
const groupIndex = computed(() => groups.value.findIndex((g) => g === currentGroup.value))
const index = computed(() => ordered.value.findIndex((n) => n.id === currentId.value))
const room = ref(!!currentGroup.value?.canBuildRoom)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let viewer: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let markers: any = null

async function ensureViewer() {
  if (viewer || !el.value) return
  const [{ Viewer }, { MarkersPlugin }] = await Promise.all([
    import('@photo-sphere-viewer/core'),
    import('@photo-sphere-viewer/markers-plugin'),
    import('@photo-sphere-viewer/core/index.css'),
    import('@photo-sphere-viewer/markers-plugin/index.css'),
  ])
  viewer = new Viewer({
    container: el.value,
    loadingTxt: 'Cargando foto 360°…',
    navbar: ['zoom', 'move', 'fullscreen'],
    touchmoveTwoFingers: false,
    mousewheelCtrlKey: false,
    plugins: [MarkersPlugin],
  })
  markers = viewer.getPlugin(MarkersPlugin)
  markers.addEventListener('select-marker', ({ marker }: { marker: { data?: { target?: number } } }) => {
    if (marker.data?.target) go(marker.data.target)
  })
  viewer.addEventListener('panorama-error', () => {
    failed.value = 'No se pudo cargar la foto 360°.'
    loading.value = false
  })
}

const nameOf = (id: number) => props.tour.nodes.find((n) => n.id === id)?.space ?? ''

async function show(node: PanoramaNode | undefined) {
  failed.value = ''
  if (!node || node.projection === 'flat' || room.value) return
  loading.value = true
  try {
    await ensureViewer()
    await viewer.setPanorama(mediaUrl(node.url), { transition: false, showLoader: true })
    markers.clearMarkers()
    node.links.forEach((l, i) => markers.addMarker({
      id: `l${i}`,
      position: { yaw: l.yaw, pitch: l.pitch },
      html: `<button class="v3d-hs">➜ ${l.label || nameOf(l.target)}</button>`,
      anchor: 'center center',
      data: { target: l.target },
    }))
  } catch (e) {
    failed.value = 'Este navegador no puede mostrar la foto 360°.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

function go(id: number) {
  room.value = false
  currentId.value = id
}
/** Entrar a un espacio: habitación 3D si se puede armar; si no, su foto de portada. */
function goGroup(g: SpaceGroup) {
  currentId.value = g.cover.id
  room.value = g.canBuildRoom
  if (!room.value) show(current.value)
}
function step(d: number) {
  const list = ordered.value
  const n = list.length
  if (!n) return
  if (room.value) {
    // Desde la vista 3D, las flechas pasan de espacio en espacio
    const gs = groups.value
    goGroup(gs[(groupIndex.value + d + gs.length) % gs.length])
    return
  }
  go(list[(index.value + d + n) % n].id)
}

// Botón "atrás" del navegador / celular: cierra el recorrido en vez de salir de la página
let pushed = false
function onPop() {
  pushed = false
  emit('close')
}
function close() {
  if (pushed) history.back() // dispara onPop → close
  else emit('close')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
  if (e.key === 'ArrowRight' && current.value?.projection === 'flat') step(1)
  if (e.key === 'ArrowLeft' && current.value?.projection === 'flat') step(-1)
  if (e.key === 'PageDown') step(1)
  if (e.key === 'PageUp') step(-1)
}

// ── Plano de la unidad: mini mapa y "Pasar a…" según las puertas
const plan = computed(() => (props.tour.plan?.rooms?.length ? props.tour.plan : null))
const groupByName = (name: string) => groups.value.find((g) => g.space.trim().toLowerCase() === name.trim().toLowerCase())
const nextSpaces = computed(() => (currentGroup.value ? neighbors(plan.value, currentGroup.value.space) : [])
  .map((n) => groupByName(n)).filter((g): g is SpaceGroup => !!g))
const showMap = ref(typeof window === 'undefined' || window.innerWidth > 640)
function goName(name: string) {
  const g = groupByName(name)
  if (g) goGroup(g)
}

watch(current, (n) => show(n))
watch(room, (v) => { if (!v) nextTick(() => show(current.value)) })
watch(() => props.tour, () => go(props.startId ?? props.tour.start ?? props.tour.nodes[0]?.id))

onMounted(async () => {
  await nextTick()
  show(current.value)
  window.addEventListener('keydown', onKey)
  history.pushState({ ...(history.state ?? {}), v3dTour: true }, '')
  pushed = true
  window.addEventListener('popstate', onPop)
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('popstate', onPop)
  if (pushed) history.back() // se cerró desde fuera: quitar la entrada de historial que agregamos
  document.body.style.overflow = ''
  viewer?.destroy()
})
</script>

<template>
  <div class="tour" role="dialog" aria-modal="true" :aria-label="title || 'Recorrido'">
    <div class="stage">
      <div v-show="current?.projection !== 'flat' && !room" ref="el" class="viewer" />
      <div v-if="room && currentGroup" class="room">
        <Suspense>
          <RoomScene :surfaces="currentGroup.surfaces" />
          <template #fallback><div class="state"><span class="spin" />Armando la habitación…</div></template>
        </Suspense>
      </div>
      <div v-else-if="current?.projection === 'flat'" class="flat">
        <img class="bg" :src="mediaUrl(current.url)" alt="" aria-hidden="true" />
        <img class="photo" :src="mediaUrl(current.url)" :alt="current.space" />
      </div>
      <div v-if="loading" class="state"><span class="spin" />Cargando…</div>
      <div v-if="failed" class="state error">{{ failed }}</div>

      <div v-if="!tour.nodes.length" class="empty">
        <span class="empty-ico">📷</span>
        <p>Esta unidad todavía no tiene fotos de sus espacios.</p>
        <small>Se agregan en Editar edificio → "Distribución y fotos".</small>
      </div>

      <!-- Encabezado flotante -->
      <header class="bar">
        <button type="button" class="back" @click="close">
          <span aria-hidden="true">←</span><span class="txt">Volver</span>
        </button>
        <NexiLivingLogo tono="claro" class="brand" />
        <div class="where">
          <small>{{ title || 'Recorrido' }}</small>
          <strong v-if="current">{{ kindIcon(current.kind) }} {{ currentGroup?.space ?? current.space }}</strong>
        </div>
        <span v-if="current" class="badge">{{ room ? 'Habitación 3D' : current.projection === 'flat' ? surfaceLabel(current.surface) : '360°' }}</span>
        <span v-if="groups.length > 1" class="count">{{ groupIndex + 1 }} / {{ groups.length }}</span>
      </header>

      <p v-if="room" class="tip">Arrastra para mirar las paredes, el piso y el techo · abajo puedes ver cada foto</p>
      <p v-else-if="current && current.projection !== 'flat' && !loading" class="tip">Arrastra para mirar alrededor · toca los botones dorados para pasar a otro espacio</p>

      <!-- Pasar a los espacios conectados -->
      <div v-if="nextSpaces.length" class="doors">
        <span>Pasar a</span>
        <button v-for="g in nextSpaces" :key="g.space" type="button" @click="goGroup(g)">🚪 {{ kindIcon(g.kind) }} {{ g.space }}</button>
      </div>

      <!-- Mini plano de la unidad -->
      <div v-if="plan" class="minimap" :class="{ closed: !showMap }">
        <button type="button" class="mm-toggle" @click="showMap = !showMap">{{ showMap ? 'Ocultar plano' : '📐 Plano' }}</button>
        <svg v-if="showMap" :viewBox="`0 0 ${PLAN_COLS * 20} ${PLAN_ROWS * 20}`">
          <rect :width="PLAN_COLS * 20" :height="PLAN_ROWS * 20" fill="rgba(20,13,10,.6)" />
          <g v-for="r in plan.rooms" :key="r.space" class="mm-room"
            :class="{ on: currentGroup && r.space.toLowerCase() === currentGroup.space.toLowerCase(), off: !groupByName(r.space) }"
            @click="goName(r.space)">
            <rect :x="r.x * 20 + 1.5" :y="r.y * 20 + 1.5" :width="r.w * 20 - 3" :height="r.h * 20 - 3" rx="3" />
            <text :x="(r.x + r.w / 2) * 20" :y="(r.y + r.h / 2) * 20 + 3" text-anchor="middle">{{ r.space.length > 12 ? r.space.slice(0, 11) + '…' : r.space }}</text>
          </g>
          <line v-for="(d, i) in plan.doors ?? []" :key="'d' + i" class="mm-door"
            :x1="center(plan.rooms.find((r) => r.space === d.a) ?? plan.rooms[0]).x * 20"
            :y1="center(plan.rooms.find((r) => r.space === d.a) ?? plan.rooms[0]).y * 20"
            :x2="center(plan.rooms.find((r) => r.space === d.b) ?? plan.rooms[0]).x * 20"
            :y2="center(plan.rooms.find((r) => r.space === d.b) ?? plan.rooms[0]).y * 20" />
        </svg>
      </div>

      <!-- Vistas del espacio actual: habitación 3D + cada foto -->
      <div v-if="currentGroup && (currentGroup.nodes.length > 1 || currentGroup.canBuildRoom)" class="views">
        <button v-if="currentGroup.canBuildRoom" type="button" class="v3d" :class="{ on: room }" @click="room = true">🧊<span>3D</span></button>
        <button v-for="n in currentGroup.nodes" :key="n.id" type="button" :class="{ on: !room && n.id === currentId }" :title="surfaceLabel(n.surface)" @click="go(n.id)">
          <img :src="mediaUrl(n.thumb || n.url)" alt="" loading="lazy" />
          <span>{{ n.projection === 'flat' ? surfaceLabel(n.surface) : '360°' }}</span>
        </button>
      </div>

      <template v-if="tour.nodes.length > 1">
        <button type="button" class="nav prev" aria-label="Espacio anterior" @click="step(-1)">‹</button>
        <button type="button" class="nav next" aria-label="Espacio siguiente" @click="step(1)">›</button>
      </template>
    </div>

    <nav v-if="tour.nodes.length" class="spaces" aria-label="Espacios">
      <button v-for="(g, i) in groups" :key="g.space" type="button" :class="{ on: g === currentGroup }" @click="goGroup(g)">
        <span class="th">
          <img :src="mediaUrl(g.cover.thumb || g.cover.url)" alt="" loading="lazy" />
          <em>{{ g.canBuildRoom ? '🧊 3D' : g.cover.projection === 'flat' ? g.nodes.length + ' fotos' : '360°' }}</em>
          <b>{{ i + 1 }}</b>
        </span>
        <span class="name">{{ kindIcon(g.kind) }} {{ g.space }}</span>
        <small>{{ kindLabel(g.kind) }} · {{ g.nodes.length }} {{ g.nodes.length === 1 ? 'foto' : 'fotos' }}</small>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.tour { position: fixed; inset: 0; z-index: 100000; background: #140d0a; display: flex; flex-direction: column; color: #f5efe6; }
.stage { position: relative; flex: 1; min-height: 0; }
.viewer { position: absolute; inset: 0; }

/* Encabezado flotante, translúcido sobre la imagen */
.bar { position: absolute; top: 0; left: 0; right: 0; z-index: 5; display: flex; align-items: center; gap: 14px;
  padding: 14px 18px 26px; background: linear-gradient(to bottom, rgba(20,13,10,.92), rgba(20,13,10,.55) 65%, transparent); pointer-events: none; }
.bar > * { pointer-events: auto; }
.back { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #da9c5f, #c9853d); color: #2b1a0e;
  border: 0; border-radius: 999px; padding: 10px 18px 10px 14px; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,.35); }
.back span:first-child { font-size: 18px; line-height: 1; }
.back:hover { filter: brightness(1.08); }
.brand { --alto-logo: 30px; flex: none; padding: 0 14px; border-left: 1px solid rgba(218,156,95,.3); border-right: 1px solid rgba(218,156,95,.3); }
.where { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.where small { color: #d8c6b3; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.where strong { font-size: 19px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 6px rgba(0,0,0,.5); }
.badge { font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: .12em; color: #da9c5f; border: 1px solid rgba(218,156,95,.45);
  background: rgba(20,13,10,.6); border-radius: 999px; padding: 5px 11px; }
.count { font-family: ui-monospace, monospace; font-size: 13px; color: #f5efe6; background: rgba(20,13,10,.6); border-radius: 999px; padding: 5px 11px; }
.tip { position: absolute; left: 50%; bottom: 62px; transform: translateX(-50%); z-index: 4; background: rgba(20,13,10,.72); color: #e9dccd;
  font-size: 12px; padding: 6px 14px; border-radius: 999px; pointer-events: none; white-space: nowrap; animation: fade 6s forwards; }
@keyframes fade { 0%, 75% { opacity: 1; } 100% { opacity: 0; } }

.room { position: absolute; inset: 0; }
.doors { position: absolute; left: 16px; bottom: 120px; z-index: 6; display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.doors span { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #e9dccd;
  background: rgba(20,13,10,.7); padding: 3px 8px; border-radius: 6px; }
.doors button { background: rgba(218,156,95,.95); color: #2b1a0e; border: 0; border-radius: 999px; padding: 8px 14px; font-weight: 800; font-size: 13px;
  cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,.35); }
.doors button:hover { background: #f0b878; }
.minimap { position: absolute; top: 84px; right: 16px; z-index: 6; width: 260px; background: rgba(20,13,10,.82); border: 1px solid rgba(218,156,95,.35);
  border-radius: 12px; padding: 6px; backdrop-filter: blur(6px); }
.minimap.closed { width: auto; }
.minimap svg { width: 100%; height: auto; display: block; border-radius: 8px; }
.mm-toggle { background: none; border: 0; color: #da9c5f; font-size: 11px; cursor: pointer; padding: 2px 4px 6px; }
.mm-room { cursor: pointer; }
.mm-room rect { fill: rgba(218,156,95,.35); stroke: rgba(218,156,95,.6); stroke-width: 1; }
.mm-room.on rect { fill: #da9c5f; stroke: #fff; stroke-width: 2; }
.mm-room.off { cursor: default; opacity: .45; }
.mm-room text { fill: #f5efe6; font-size: 8px; font-weight: 700; pointer-events: none; }
.mm-room.on text { fill: #2b1a0e; }
.mm-door { stroke: #f5efe6; stroke-width: 1.5; stroke-dasharray: 3 3; pointer-events: none; }
.views { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 5; display: flex; gap: 6px; max-width: calc(100% - 140px);
  overflow-x: auto; padding: 6px; background: rgba(20,13,10,.78); border: 1px solid rgba(218,156,95,.3); border-radius: 14px; backdrop-filter: blur(6px); }
.views button { flex: none; width: 86px; display: flex; flex-direction: column; gap: 3px; align-items: center; background: transparent; border: 2px solid transparent;
  border-radius: 9px; padding: 3px; color: #f5efe6; cursor: pointer; font-size: 10px; }
.views button img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 6px; display: block; }
.views button.on { border-color: #da9c5f; background: rgba(218,156,95,.16); }
.views .v3d { justify-content: center; font-size: 26px; background: rgba(218,156,95,.12); }
.views .v3d span { font-size: 11px; font-weight: 800; color: #da9c5f; }
.flat { position: absolute; inset: 0; overflow: hidden; display: grid; place-items: center; padding: 84px 70px 118px; }
.flat .bg { position: absolute; inset: -40px; width: calc(100% + 80px); height: calc(100% + 80px); object-fit: cover; filter: blur(30px) brightness(.4); }
.flat .photo { position: relative; max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 12px; box-shadow: 0 24px 70px rgba(0,0,0,.55); }
.nav { position: absolute; top: 50%; transform: translateY(-50%); z-index: 5; width: 52px; height: 52px; border-radius: 50%;
  border: 1px solid rgba(218,156,95,.5); background: rgba(20,13,10,.65); color: #fff; font-size: 30px; line-height: 1; cursor: pointer; backdrop-filter: blur(6px); }
.nav:hover { background: #da9c5f; color: #2b1a0e; }
.prev { left: 16px; } .next { right: 16px; }

.state { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 6; display: flex; align-items: center; gap: 10px;
  background: rgba(20,13,10,.8); padding: 12px 18px; border-radius: 10px; pointer-events: none; }
.state.error { background: #b91c1c; }
.spin { width: 18px; height: 18px; border: 3px solid rgba(218,156,95,.3); border-top-color: #da9c5f; border-radius: 50%; animation: sp .8s linear infinite; }
@keyframes sp { to { transform: rotate(360deg); } }
.empty { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #c2ad99; padding: 16px; text-align: center; }
.empty-ico { font-size: 42px; }

/* Franja de espacios */
.spaces { display: flex; gap: 12px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); overflow-x: auto;
  background: linear-gradient(135deg, rgba(62,36,24,.98), rgba(28,18,14,.98)); border-top: 1px solid rgba(218,156,95,.25); }
.spaces button { flex: 0 0 auto; width: 150px; display: flex; flex-direction: column; gap: 4px; background: rgba(0,0,0,.25);
  border: 2px solid transparent; border-radius: 12px; color: #f5efe6; padding: 5px; cursor: pointer; text-align: left; transition: transform .15s, border-color .15s; }
.spaces button:hover { transform: translateY(-2px); border-color: rgba(218,156,95,.45); }
.spaces button.on { border-color: #da9c5f; background: rgba(218,156,95,.16); box-shadow: 0 0 0 3px rgba(218,156,95,.15); }
.spaces .name { font-size: 13px; font-weight: 600; padding: 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spaces small { color: #c2ad99; font-size: 10px; padding: 0 3px 2px; }
.th { position: relative; display: block; }
.th img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 8px; display: block; }
.th em { position: absolute; top: 5px; left: 5px; font-style: normal; font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 999px; background: rgba(20,13,10,.8); color: #da9c5f; }
.th b { position: absolute; top: 5px; right: 5px; font-size: 10px; width: 18px; height: 18px; display: grid; place-items: center; border-radius: 50%; background: rgba(20,13,10,.8); }

/* Controles de Photo Sphere Viewer con la paleta del sitio */
.viewer :deep(.psv-navbar) { background: linear-gradient(to top, rgba(20,13,10,.9), rgba(20,13,10,.5)); }
.viewer :deep(.psv-button) { color: #f5efe6; }
.viewer :deep(.psv-button:hover) { color: #da9c5f; }
.viewer :deep(.psv-loader) { color: #da9c5f; }
:deep(.v3d-hs) { background: rgba(218, 156, 95, .95); color: #2b1a0e; border: 0; border-radius: 999px; padding: 8px 16px; font-weight: 800;
  font-size: 13px; cursor: pointer; box-shadow: 0 6px 18px rgba(0,0,0,.4); white-space: nowrap; }
:deep(.v3d-hs:hover) { background: #f0b878; transform: scale(1.05); }

@media (max-width: 640px) {
  .bar { gap: 8px; padding: 10px 10px 22px; }
  .back { padding: 9px 12px; }
  .back .txt { display: none; }
  .brand { --alto-logo: 20px; padding: 0 8px; }
  .where strong { font-size: 15px; }
  .badge { display: none; }
  .tip { display: none; }
  .views { max-width: calc(100% - 16px); bottom: 8px; }
  .doors { left: 8px; bottom: 96px; }
  .doors button { padding: 6px 10px; font-size: 12px; }
  .minimap { top: 64px; right: 8px; width: 170px; }
  .views button { width: 64px; }
  .flat { padding: 64px 8px 96px; }
  .nav { width: 40px; height: 40px; font-size: 24px; }
  .prev { left: 6px; } .next { right: 6px; }
  .spaces { gap: 8px; padding: 8px 8px calc(8px + env(safe-area-inset-bottom)); }
  .spaces button { width: 104px; }
  .spaces .name { font-size: 11px; }
  .spaces small { display: none; }
  :deep(.v3d-hs) { padding: 6px 11px; font-size: 12px; }
}
</style>
