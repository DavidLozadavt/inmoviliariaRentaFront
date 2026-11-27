<script setup lang="ts">
// Planta 3D del piso seleccionado (carga diferida, igual que BuildingScene).
import { computed } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import FloorMeshes from './FloorMeshes.vue'
import type { Slot } from '@/utils/visor3d/layout'
import { isLowEnd } from '@/utils/visor3d/device'

const props = defineProps<{
  slots: Slot[]
  colors: string[]
  selectedKey: string | null
  footprint: { x: number; z: number; w: number; d: number }
}>()
defineEmits<{ pick: [slot: Slot | null] }>()

const lowEnd = isLowEnd()
const narrow = typeof window !== 'undefined' && window.innerWidth < 640
const target = computed<[number, number, number]>(() => [props.footprint.x, 0, props.footprint.z])
const dist = computed(() => Math.max(18, Math.max(props.footprint.w, props.footprint.d) * (narrow ? 2.4 : 1.75)))
const camPos = computed<[number, number, number]>(() => [
  props.footprint.x + dist.value * 0.35, dist.value * 0.95, props.footprint.z + dist.value * 0.75,
])
</script>

<template>
  <TresCanvas clear-color="#1c120e" :dpr="lowEnd ? [1, 1.25] : [1, 2]" :antialias="!lowEnd">
    <TresPerspectiveCamera :position="camPos" :fov="42" :near="0.5" :far="dist * 10" :look-at="target" />
    <OrbitControls make-default :target="target" :enable-damping="true" :damping-factor="0.12"
      :max-polar-angle="Math.PI / 2.4" :min-distance="6" :max-distance="dist * 2.5" />
    <TresHemisphereLight :args="['#ffffff', '#3f3f46', 1.7]" />
    <TresDirectionalLight :position="[dist, dist * 1.6, dist * 0.4]" :intensity="1.3" />
    <FloorMeshes :slots="slots" :colors="colors" :selected-key="selectedKey" :footprint="footprint" @pick="$emit('pick', $event)" />
  </TresCanvas>
</template>
