<script setup lang="ts">
// Habitación armada con fotos: caja vista desde adentro, cada foto en su pared, piso o techo.
// En modo edición se toca una cara para subirle su foto.
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import RoomMeshes from './RoomMeshes.vue'
import type { PanoramaNode, Surface } from '@/types/visor3d'

defineProps<{
  surfaces: Partial<Record<Surface, PanoramaNode | { url: string }>>
  editable?: boolean
  highlight?: Surface | null
}>()
defineEmits<{ pick: [surface: Surface] }>()
</script>

<template>
  <TresCanvas clear-color="#140d0a">
    <TresPerspectiveCamera :position="[0, 0, 0.05]" :fov="75" :near="0.01" :far="50" />
    <OrbitControls make-default :target="[0, 0, 0]" :enable-zoom="false" :enable-pan="false"
      :rotate-speed="-0.35" :enable-damping="true" :damping-factor="0.1" />
    <RoomMeshes :surfaces="surfaces" :editable="editable" :highlight="highlight" @pick="$emit('pick', $event)" />
  </TresCanvas>
</template>
