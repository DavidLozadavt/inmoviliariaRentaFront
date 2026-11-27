<script setup lang="ts">
// Armar un espacio en 3D: la habitación se ve desde adentro; se toca una pared, el piso o el techo
// (o se elige en la lista) y se sube la foto de ese lugar. El resultado se ve al instante.
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import type { PanoramaNode, Surface } from '@/types/visor3d'
import { ROOM_SURFACES, SURFACES, type SpaceGroup } from '@/utils/visor3d/spaces'
import { mediaUrl } from '@/utils/visor3d/device'

const RoomScene = defineAsyncComponent(() => import('../RoomScene.vue'))

const props = defineProps<{ group: SpaceGroup; busy?: boolean; progress?: string }>()
const emit = defineEmits<{
  upload: [surface: Surface, file: File]
  remove: [node: PanoramaNode]
  close: []
}>()

const selected = ref<Surface>(ROOM_SURFACES.find((s) => !props.group.surfaces[s]) ?? 'front')
const fileInput = ref<HTMLInputElement>()
const cameraInput = ref<HTMLInputElement>()
// En celular, tocar una cara vacía abre la cámara; en computador, el selector de archivos
const isTouch = typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches
const done = computed(() => ROOM_SURFACES.filter((s) => props.group.surfaces[s]).length)
const details = computed(() => props.group.nodes.filter((n) => n.surface === 'detail' || (n.projection === 'flat' && !n.surface)))

function pick(s: Surface) {
  selected.value = s
  if (!props.group.surfaces[s]) (isTouch ? cameraInput.value : fileInput.value)?.click()
}
function onFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) emit('upload', selected.value, file)
}
const label = (s: Surface) => SURFACES.find((x) => x.key === s)!

function onKey(e: KeyboardEvent) { if (e.key === 'Escape') emit('close') }
onMounted(() => { window.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden' })
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' })
</script>

<template>
  <div class="rb" role="dialog" aria-modal="true" :aria-label="`Armar ${group.space} en 3D`">
    <header>
      <div class="t">
        <strong>🧊 Armar «{{ group.space }}» en 3D</strong>
        <small>Arrastra para mirar alrededor · toca una pared, el piso o el techo para subir su foto</small>
      </div>
      <span class="prog">{{ done }} / {{ ROOM_SURFACES.length }} superficies</span>
      <button type="button" class="done" @click="emit('close')">Listo</button>
    </header>

    <div class="body">
      <div class="scene">
        <Suspense>
          <RoomScene :surfaces="group.surfaces" editable :highlight="selected" @pick="pick" />
          <template #fallback><div class="loading">Cargando habitación…</div></template>
        </Suspense>
        <p v-if="busy" class="busy"><span class="spin" />{{ progress || 'Subiendo…' }}</p>
      </div>

      <aside>
        <p class="hint">Párate en el centro del espacio y toma una foto horizontal de cada pared. Para el piso y el techo,
          apunta la cámara hacia abajo o hacia arriba.</p>
        <button v-for="s in ROOM_SURFACES" :key="s" type="button" class="face" :class="{ on: selected === s, ok: group.surfaces[s] }"
          @click="selected = s">
          <span class="th">
            <img v-if="group.surfaces[s]" :src="mediaUrl(group.surfaces[s]!.thumb || group.surfaces[s]!.url)" alt="" />
            <b v-else>+</b>
          </span>
          <span class="fi">
            <strong>{{ label(s).label }}</strong>
            <small>{{ group.surfaces[s] ? '✓ Lista' : label(s).hint }}</small>
          </span>
        </button>

        <div class="cur">
          <label class="primary" :class="{ disabled: busy }">
            📷 Tomar foto · {{ label(selected).short }}
            <input ref="cameraInput" type="file" accept="image/*" capture="environment" hidden :disabled="busy" @change="onFile" />
          </label>
          <label class="secondary" :class="{ disabled: busy }">
            {{ group.surfaces[selected] ? 'Cambiar por otra foto' : 'Subir desde la galería' }}
            <input ref="fileInput" type="file" accept="image/*" hidden :disabled="busy" @change="onFile" />
          </label>
          <button v-if="group.surfaces[selected]" type="button" class="link danger" @click="emit('remove', group.surfaces[selected] as PanoramaNode)">
            Quitar foto
          </button>
        </div>

        <div v-if="details.length" class="det">
          <span class="lbl">Detalles de este espacio</span>
          <div class="dgrid"><img v-for="d in details" :key="d.id" :src="mediaUrl(d.thumb || d.url)" alt="" /></div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.rb { position: fixed; inset: 0; z-index: 99995; background: #140d0a; color: var(--v3d-text); display: flex; flex-direction: column; }
header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 18px; border-bottom: 1px solid var(--v3d-border);
  background: linear-gradient(135deg, rgba(62,36,24,.98), rgba(28,18,14,.98)); }
.t { display: flex; flex-direction: column; flex: 1; min-width: 220px; }
.t small { color: var(--v3d-muted); font-size: 12px; }
.prog { font-family: ui-monospace, monospace; font-size: 12px; color: var(--v3d-accent); border: 1px solid var(--v3d-border); border-radius: 999px; padding: 4px 10px; }
.done { background: linear-gradient(135deg, var(--v3d-accent), var(--v3d-accent-strong)); color: var(--v3d-on-accent); border: 0; border-radius: 10px; padding: 9px 20px; font-weight: 800; cursor: pointer; }
.body { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 320px; }
.scene { position: relative; min-height: 300px; }
.loading { height: 100%; display: grid; place-items: center; color: var(--v3d-muted); }
.busy { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); display: flex; gap: 8px; align-items: center; background: rgba(20,13,10,.85);
  padding: 8px 14px; border-radius: 999px; font-size: 13px; }
.spin { width: 14px; height: 14px; border: 2px solid rgba(218,156,95,.3); border-top-color: #da9c5f; border-radius: 50%; animation: s .8s linear infinite; }
@keyframes s { to { transform: rotate(360deg); } }
aside { border-left: 1px solid var(--v3d-border); padding: 14px; display: flex; flex-direction: column; gap: 8px; overflow: auto; background: rgba(28,18,14,.92); }
.hint { color: var(--v3d-muted); font-size: 12px; line-height: 1.5; }
.face { display: flex; gap: 10px; align-items: center; text-align: left; border: 1px solid var(--v3d-border); background: transparent; color: var(--v3d-text); border-radius: 10px; padding: 6px; cursor: pointer; }
.face.on { border-color: var(--v3d-accent); background: var(--v3d-accent-soft); }
.th { width: 64px; height: 48px; border-radius: 6px; overflow: hidden; background: rgba(0,0,0,.3); display: grid; place-items: center; flex: none; }
.th img { width: 100%; height: 100%; object-fit: cover; }
.th b { font-size: 22px; color: var(--v3d-accent); }
.fi { display: flex; flex-direction: column; min-width: 0; }
.fi small { color: var(--v3d-muted); font-size: 11px; }
.face.ok .fi small { color: #4ade80; }
.cur { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
.primary { background: linear-gradient(135deg, var(--v3d-accent), var(--v3d-accent-strong)); color: var(--v3d-on-accent); border-radius: 10px; padding: 10px 14px; font-weight: 700; cursor: pointer; text-align: center; }
.primary.disabled, .secondary.disabled { opacity: .6; pointer-events: none; }
.secondary { background: transparent; color: var(--v3d-text); border: 1px solid var(--v3d-border); border-radius: 10px; padding: 9px 14px; text-align: center; cursor: pointer; font-size: 13px; }
.link { background: none; border: 0; cursor: pointer; font-size: 13px; }
.danger { color: #f87171; }
.lbl { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--v3d-muted); }
.det { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.dgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.dgrid img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 4px; }
@media (max-width: 860px) {
  .body { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; }
  aside { border-left: 0; border-top: 1px solid var(--v3d-border); max-height: 45vh; }
}
</style>
