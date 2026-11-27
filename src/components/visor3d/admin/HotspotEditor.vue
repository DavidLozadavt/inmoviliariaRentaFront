<script setup lang="ts">
// Puntos de paso entre espacios: clic en la foto 360° → elegir a qué espacio lleva.
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { PanoramaNode, TourLink } from '@/types/visor3d'
import { mediaUrl } from '@/utils/visor3d/device'

const props = defineProps<{ panorama: PanoramaNode; siblings: PanoramaNode[]; saving?: boolean }>()
const emit = defineEmits<{ save: [links: TourLink[]]; close: [] }>()

const el = ref<HTMLDivElement>()
const links = ref<TourLink[]>(props.panorama.links.map((l) => ({ ...l })))
const pending = ref<{ yaw: number; pitch: number } | null>(null)
const target = ref<number | ''>('')
const targets = () => props.siblings.filter((s) => s.id !== props.panorama.id)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let viewer: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let markers: any = null

const nameOf = (id: number) => props.siblings.find((s) => s.id === id)?.space ?? `#${id}`

function drawMarkers() {
  if (!markers) return
  markers.clearMarkers()
  links.value.forEach((l, i) => markers.addMarker({
    id: `l${i}`, position: { yaw: l.yaw, pitch: l.pitch },
    html: `<span class="hs">➜ ${l.label || nameOf(l.target)}</span>`, anchor: 'center center',
  }))
  if (pending.value) {
    markers.addMarker({ id: 'pending', position: pending.value, html: '<span class="hs pending">●</span>', anchor: 'center center' })
  }
}

onMounted(async () => {
  const [{ Viewer }, { MarkersPlugin }] = await Promise.all([
    import('@photo-sphere-viewer/core'),
    import('@photo-sphere-viewer/markers-plugin'),
    import('@photo-sphere-viewer/core/index.css'),
    import('@photo-sphere-viewer/markers-plugin/index.css'),
  ])
  viewer = new Viewer({ container: el.value!, panorama: mediaUrl(props.panorama.url), navbar: ['zoom', 'fullscreen'], plugins: [MarkersPlugin] })
  markers = viewer.getPlugin(MarkersPlugin)
  viewer.addEventListener('click', ({ data }: { data: { yaw: number; pitch: number; rightclick?: boolean } }) => {
    if (data.rightclick) return
    pending.value = { yaw: Number(data.yaw.toFixed(4)), pitch: Number(data.pitch.toFixed(4)) }
    drawMarkers()
  })
  viewer.addEventListener('ready', drawMarkers, { once: true })
})

onBeforeUnmount(() => viewer?.destroy())
watch(links, drawMarkers, { deep: true })

function add() {
  if (!pending.value || target.value === '') return
  links.value.push({ target: Number(target.value), yaw: pending.value.yaw, pitch: pending.value.pitch, label: nameOf(Number(target.value)) })
  pending.value = null
  target.value = ''
}
</script>

<template>
  <div class="hs-editor" role="dialog" aria-modal="true">
    <header>
      <strong>Puntos de paso · {{ panorama.space }}</strong>
      <button type="button" class="x" @click="emit('close')">✕</button>
    </header>
    <div ref="el" class="pano" />
    <footer>
      <p v-if="!targets().length" class="muted">Sube al menos otro espacio de esta unidad para poder enlazarlo.</p>
      <template v-else>
        <p class="muted">Haz clic en la foto donde va la puerta o el paso, elige el destino y agrégalo.</p>
        <div class="row">
          <select v-model="target" :disabled="!pending">
            <option value="">{{ pending ? 'Lleva a…' : 'Primero haz clic en la foto' }}</option>
            <option v-for="t in targets()" :key="t.id" :value="t.id">{{ t.space }}</option>
          </select>
          <button type="button" class="secondary" :disabled="!pending || target === ''" @click="add">Agregar punto</button>
        </div>
      </template>
      <ul class="list">
        <li v-for="(l, i) in links" :key="i">
          ➜ {{ nameOf(l.target) }} <small>(yaw {{ l.yaw.toFixed(2) }}, pitch {{ l.pitch.toFixed(2) }})</small>
          <button type="button" class="link danger" @click="links.splice(i, 1)">Quitar</button>
        </li>
      </ul>
      <div class="row end">
        <button type="button" class="secondary" @click="emit('close')">Cancelar</button>
        <button type="button" class="primary" :disabled="saving" @click="emit('save', links)">{{ saving ? 'Guardando…' : 'Guardar puntos' }}</button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.hs-editor { position: fixed; inset: 0; z-index: 100000; background: #0b1120; display: flex; flex-direction: column; color: #fff; }
header { display: flex; justify-content: space-between; padding: 10px 16px; }
.x { background: none; border: 0; color: #fff; font-size: 18px; cursor: pointer; }
.pano { flex: 1; min-height: 0; }
footer { background: var(--v3d-surface); color: var(--v3d-text); padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; max-height: 40vh; overflow: auto; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.row.end { justify-content: flex-end; }
select { padding: 7px 8px; border: 1px solid var(--v3d-border); border-radius: 8px; min-width: 200px; }
.list { list-style: none; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
.muted { color: var(--v3d-muted); font-size: 13px; }
.primary { background: var(--v3d-accent); color: var(--v3d-on-accent); border: 0; border-radius: 8px; padding: 8px 14px; cursor: pointer; }
.secondary { color: var(--v3d-text); background: var(--v3d-surface-2); border: 1px solid var(--v3d-border); border-radius: 8px; padding: 8px 14px; cursor: pointer; }
.link { background: none; border: 0; color: var(--v3d-accent); cursor: pointer; }
.danger { color: #f87171; }
:deep(.hs) { background: rgba(218, 156, 95, .92); color: #fff; padding: 4px 10px; border-radius: 999px; font-size: 13px; white-space: nowrap; }
:deep(.hs.pending) { background: #f59e0b; padding: 2px 8px; }
</style>
