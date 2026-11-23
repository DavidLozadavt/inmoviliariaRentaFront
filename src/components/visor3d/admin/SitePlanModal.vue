<script setup lang="ts">
// Ubicar las torres sobre el plano en pantalla completa: plano grande a la izquierda (mover, girar, tamaño,
// forma, fijar) y el 3D en vivo a la derecha para ver el resultado mientras se ajusta.
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import SitePlanEditor from './SitePlanEditor.vue'
import type { BuildingLayout } from '@/utils/visor3d/layout'
import type { TowerConfig } from '@/types/visor3d'

const BuildingScene = defineAsyncComponent(() => import('../BuildingScene.vue'))

defineProps<{
  planUrl: string
  siteWidth: number
  towers: TowerConfig[]
  layout: BuildingLayout
  colors: string[]
  facadeFront?: string | null
  facadeSide?: string | null
  facade?: string
  faces?: { left?: string | null; back?: string | null; roof?: string | null } | null
  roofColor?: string | null
}>()
const emit = defineEmits<{ close: []; 'update:siteWidth': [v: number] }>()

const editor = ref<InstanceType<typeof SitePlanEditor> | null>(null)
const show3d = ref(window.innerWidth > 900)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="spm" role="dialog" aria-modal="true" aria-label="Ubicar torres en el plano">
    <header>
      <div class="t">
        <strong>Ubicar torres en el plano</strong>
        <small>Clic en una torre · arrástrala · ⟳ para girar · esquina para el tamaño · 🔒 para fijarla</small>
      </div>
      <label class="w">Ancho del terreno
        <input type="number" min="10" max="3000" step="5" :value="siteWidth" @change="emit('update:siteWidth', Number(($event.target as HTMLInputElement).value) || siteWidth)" />
        <span>m</span>
      </label>
      <button type="button" class="ghost" @click="editor?.spread()">Repartir</button>
      <button type="button" class="ghost toggle" @click="show3d = !show3d">{{ show3d ? 'Ocultar 3D' : 'Ver 3D' }}</button>
      <button type="button" class="done" @click="emit('close')">Listo</button>
    </header>
    <div class="body" :class="{ with3d: show3d }">
      <div class="plan-col">
        <SitePlanEditor ref="editor" :plan-url="planUrl" :site-width="siteWidth" :towers="towers" :boxes="layout.towers" />
      </div>
      <div v-if="show3d" class="scene-col">
        <Suspense>
          <BuildingScene
            :layout="layout" :colors="colors" :selected-floor="null" :selected-key="null" :facade="facade"
            :facade-front="facadeFront" :facade-side="facadeSide" look="facade" :site-plan="planUrl" :site-width="siteWidth" :faces="faces" :roof-color="roofColor"
          />
          <template #fallback><div class="loading">Cargando 3D…</div></template>
        </Suspense>
        <span class="tag">Vista 3D en vivo</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.spm { position: fixed; inset: 0; z-index: 99995; background: #140d0a; color: var(--v3d-text); display: flex; flex-direction: column; }
header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 18px; border-bottom: 1px solid var(--v3d-border);
  background: linear-gradient(135deg, rgba(62,36,24,.98), rgba(28,18,14,.98)); }
.t { display: flex; flex-direction: column; flex: 1; min-width: 220px; }
.t small { color: var(--v3d-muted); font-size: 12px; }
.w { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--v3d-muted); }
.w input { width: 90px; padding: 6px 8px; border: 1px solid var(--v3d-border); border-radius: 8px; background: var(--v3d-surface-2); color: var(--v3d-text); }
.ghost { background: transparent; color: var(--v3d-text); border: 1px solid var(--v3d-border); border-radius: 10px; padding: 8px 14px; cursor: pointer; }
.done { background: linear-gradient(135deg, var(--v3d-accent), var(--v3d-accent-strong)); color: var(--v3d-on-accent); border: 0; border-radius: 10px; padding: 9px 20px; font-weight: 800; cursor: pointer; }
.body { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr; }
.body.with3d { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); }
.plan-col { overflow: auto; padding: 20px 24px 24px; }
.scene-col { position: relative; border-left: 1px solid var(--v3d-border); min-height: 300px; }
.tag { position: absolute; top: 10px; left: 10px; font-size: 11px; background: rgba(20,13,10,.8); color: var(--v3d-accent); border-radius: 999px; padding: 4px 10px; pointer-events: none; }
.loading { height: 100%; display: grid; place-items: center; color: var(--v3d-muted); }
@media (max-width: 900px) {
  .body.with3d { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) 40vh; }
  .scene-col { border-left: 0; border-top: 1px solid var(--v3d-border); }
  .plan-col { padding: 14px 10px; }
  .toggle { display: none; }
}
</style>
