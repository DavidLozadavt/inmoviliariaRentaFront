<script setup lang="ts">
// Planta 3D de un piso: cada unidad es una caja abierta (piso de color + muros bajos + código).
// Vive dentro de <TresCanvas>.
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { useLoop, useTres } from '@tresjs/core'
import * as THREE from 'three'
import { type Slot } from '@/utils/visor3d/layout'

const props = defineProps<{
  slots: Slot[]                 // unidades del piso
  colors: string[]              // mismo orden que slots
  selectedKey: string | null
  footprint: { x: number; z: number; w: number; d: number }
}>()
const emit = defineEmits<{ pick: [slot: Slot | null] }>()

const { renderer, camera, invalidate } = useTres()
const group = shallowRef(new THREE.Group())
const disposables: { dispose(): void }[] = []
let tiles: THREE.InstancedMesh | null = null
let ring: THREE.Mesh | null = null
const track = <T extends { dispose(): void }>(o: T) => (disposables.push(o), o)

// La planta se dibuja alineada (sin la rotación de la torre) para leerla mejor
const px = (s: Slot) => props.footprint.x + s.lx
const pz = (s: Slot) => props.footprint.z + s.lz

const WALL_H = 1.1
const WALL_T = 0.18

function label(text: string): THREE.Mesh {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 96
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(40, 24, 16, 0.82)'
  g.beginPath()
  g.roundRect(8, 14, 240, 68, 10)
  g.fill()
  g.fillStyle = '#f8fafc'
  g.font = 'bold 44px ui-monospace, Menlo, monospace'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 128, 50)
  const tex = track(new THREE.CanvasTexture(c))
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = track(new THREE.MeshBasicMaterial({ map: tex, transparent: true }))
  const mesh = new THREE.Mesh(track(new THREE.PlaneGeometry(2.6, 0.98)), mat)
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

function clear() {
  group.value.clear()
  disposables.splice(0).forEach((d) => d.dispose())
  tiles = ring = null
}

function build() {
  clear()
  const m = new THREE.Matrix4()
  const f = props.footprint

  // Losa del piso
  const slab = new THREE.Mesh(
    track(new THREE.BoxGeometry(f.w + 3, 0.4, f.d + 3)),
    track(new THREE.MeshStandardMaterial({ color: '#3f3f46', roughness: 0.95 })),
  )
  slab.position.set(f.x, -0.25, f.z)
  group.value.add(slab)

  // Pisos de las unidades (color por estado)
  tiles = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(1, 0.08, 1)),
    track(new THREE.MeshStandardMaterial({ roughness: 0.7 })),
    Math.max(1, props.slots.length),
  )
  tiles.count = props.slots.length
  props.slots.forEach((s, i) => {
    m.compose(new THREE.Vector3(px(s), 0.04, pz(s)), new THREE.Quaternion(), new THREE.Vector3(s.uw - WALL_T * 2, 1, s.ud - WALL_T * 2))
    tiles!.setMatrixAt(i, m)
  })
  group.value.add(tiles)

  // Muros: 4 por unidad
  const walls = new THREE.InstancedMesh(
    track(new THREE.BoxGeometry(1, 1, 1)),
    track(new THREE.MeshStandardMaterial({ color: '#d4d4d8', roughness: 0.6 })),
    Math.max(1, props.slots.length * 4),
  )
  let k = 0
  const q = new THREE.Quaternion()
  for (const s of props.slots) {
    for (const [dx, dz, sx, sz] of [
      [0, -s.ud / 2, s.uw, WALL_T], [0, s.ud / 2, s.uw, WALL_T],
      [-s.uw / 2, 0, WALL_T, s.ud], [s.uw / 2, 0, WALL_T, s.ud],
    ]) {
      m.compose(new THREE.Vector3(px(s) + dx, WALL_H / 2, pz(s) + dz), q, new THREE.Vector3(sx, WALL_H, sz))
      walls.setMatrixAt(k++, m)
    }
  }
  walls.count = k
  group.value.add(walls)

  // Códigos de unidad sobre el piso
  for (const s of props.slots) {
    const l = label(s.unit_code)
    l.position.set(px(s), 0.1, pz(s) + s.ud * 0.22)
    group.value.add(l)
  }

  // Anillo de selección
  ring = new THREE.Mesh(
    track(new THREE.TorusGeometry(1.1, 0.12, 12, 48)),
    track(new THREE.MeshBasicMaterial({ color: '#a3e635', transparent: true, opacity: 0.9 })),
  )
  ring.rotation.x = -Math.PI / 2
  ring.visible = false
  group.value.add(ring)

  paint()
}

function paint() {
  if (!tiles) return
  const c = new THREE.Color()
  props.slots.forEach((s, i) => {
    c.set(props.colors[i] ?? '#cbd5e1')
    if (props.selectedKey && s.key !== props.selectedKey) c.lerp(new THREE.Color('#18181b'), 0.25)
    tiles!.setColorAt(i, c)
  })
  if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true
  const sel = props.slots.find((s) => s.key === props.selectedKey)
  if (ring) {
    ring.visible = !!sel
    if (sel) ring.position.set(px(sel), 0.6, pz(sel) - sel.ud * 0.1)
  }
  invalidate()
}

// Pulso del anillo
const { onBeforeRender } = useLoop()
onBeforeRender(({ elapsed }) => {
  if (ring?.visible) {
    const s = 1 + Math.sin(elapsed * 3) * 0.12
    ring.scale.set(s, s, s)
  }
})

const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()
let down: { x: number; y: number } | null = null
const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY })
function onUp(e: PointerEvent) {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
  down = null
  const el = renderer.domElement as HTMLCanvasElement
  if (!tiles || !camera.value) return
  const r = el.getBoundingClientRect()
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  raycaster.setFromCamera(ndc, camera.value)
  const hit = raycaster.intersectObject(tiles, false)[0]
  emit('pick', hit?.instanceId !== undefined ? props.slots[hit.instanceId] ?? null : null)
}

onMounted(() => {
  build()
  const el = renderer.domElement as HTMLCanvasElement
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointerup', onUp)
})
onBeforeUnmount(() => {
  const el = renderer.domElement as HTMLCanvasElement
  el.removeEventListener('pointerdown', onDown)
  el.removeEventListener('pointerup', onUp)
  clear()
})

watch(() => props.slots.map((s) => s.key).join(), build)
watch(() => [props.colors, props.selectedKey], paint, { deep: true })
</script>

<template>
  <primitive :object="group" />
</template>
