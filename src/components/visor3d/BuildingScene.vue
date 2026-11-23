<script setup lang="ts">
// Lienzo 3D. Se carga diferido (defineAsyncComponent) para que TresJS/three
// solo se descarguen cuando hay WebGL y se abre el visor.
import { computed } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import BuildingMeshes from './BuildingMeshes.vue'
import { type BuildingLayout, type Slot, layoutCenter } from '@/utils/visor3d/layout'
import { isLowEnd } from '@/utils/visor3d/device'

const props = defineProps<{
  layout: BuildingLayout
  colors: string[]
  selectedFloor: { tower: string; floor: number } | null
  selectedKey: string | null
  facade?: string
  capturable?: boolean     // el editor toma una imagen del lienzo al guardar
  facadeFront?: string | null
  facadeSide?: string | null
  look?: 'facade' | 'colors'
  sitePlan?: string | null
  siteWidth?: number | null
  faces?: { left?: string | null; back?: string | null; roof?: string | null } | null
  roofColor?: string | null
}>()
defineEmits<{ pick: [slot: Slot | null] }>()

const lowEnd = isLowEnd()
// Con plano del conjunto la cámara apunta al centro del plano; si no, al centro de las torres
const center = computed<[number, number, number]>(() =>
  props.sitePlan ? [0, props.layout.height / 3, 0] : layoutCenter(props.layout))
// En pantallas angostas (celular vertical) la cámara se aleja para que quepa el conjunto
const narrow = typeof window !== 'undefined' && window.innerWidth < 640
const dist = computed(() => Math.max(30, props.layout.size * (narrow ? 1.75 : 1.1), props.sitePlan ? (Number(props.siteWidth) || 100) * (narrow ? 1.2 : 0.8) : 0))
const camPos = computed<[number, number, number]>(() => [
  center.value[0] + dist.value * 0.75, center.value[1] + dist.value * 0.45, center.value[2] + dist.value * 0.85,
])
</script>

<template>
   <TresCanvas clear-color="#1c120e" :preserve-drawing-buffer="!!capturable" :dpr="lowEnd ? [1, 1.25] : [1, 2]" :antialias="!lowEnd" power-preference="high-performance">
    <TresPerspectiveCamera :position="camPos" :fov="45" :near="0.5" :far="dist * 8" :look-at="center" />
    <OrbitControls
      make-default
      :target="center"
      :enable-damping="true"
      :damping-factor="0.12"
      :max-polar-angle="Math.PI / 2.05"
      :min-distance="8"
      :max-distance="dist * 3"
    />
    <TresHemisphereLight :args="['#fff4e6', '#3a2a22', 1.7]" />
    <TresDirectionalLight :position="[dist, dist * 1.4, dist * 0.6]" :intensity="1.4" />
    <TresMesh v-if="!sitePlan" :rotation-x="-Math.PI / 2" :position="[center[0], -0.13, center[2]]">
      <TresCircleGeometry :args="[dist * 1.6, 48]" />
      <TresMeshStandardMaterial color="#2d211b" :roughness="1" />
    </TresMesh>
    <BuildingMeshes
      :layout="layout"
      :colors="colors"
      :selected-floor="selectedFloor"
      :selected-key="selectedKey"
      :facade="facade"
      :facade-front="facadeFront"
      :facade-side="facadeSide"
      :look="look"
      :site-plan="sitePlan"
      :site-width="siteWidth"
      :faces="faces"
      :roof-color="roofColor"
      @pick="$emit('pick', $event)"
    />
  </TresCanvas>
</template>
