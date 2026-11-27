<script setup lang="ts">
// Planta 3D de un piso: cada unidad es un apartamento abierto (piso de madera, muros con remate, puerta,
// muebles básicos, franja con el color de estado y código).
// Vive dentro de <TresCanvas>.
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { useLoop, useTres } from '@tresjs/core'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { type Slot } from '@/utils/visor3d/layout'

const props = defineProps<{
  slots: Slot[]                 // unidades del piso
  colors: string[]              // mismo orden que slots
  selectedKey: string | null
  footprint: { x: number; z: number; w: number; d: number }
}>()
const emit = defineEmits<{ pick: [slot: Slot | null] }>()

const { renderer, camera, invalidate, scene } = useTres()
const group = shallowRef(new THREE.Group())
const disposables: { dispose(): void }[] = []
let tiles: THREE.InstancedMesh | null = null
let ring: THREE.Mesh | null = null
let strips: THREE.InstancedMesh | null = null
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

/** Piso de madera en tablas (blanco cálido de base para que el estado lo tiña suave). */
function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  for (let i = 0; i < 8; i++) {
    const l = 225 + Math.random() * 25
    g.fillStyle = `rgb(${l}, ${l - 14}, ${l - 30})`
    g.fillRect(0, i * 32, 256, 32)
    g.fillStyle = 'rgba(80,50,30,.18)'
    g.fillRect(0, i * 32, 256, 1.5)
    const off = Math.random() * 256
    g.fillRect(off, i * 32, 1.5, 32)
    for (let k = 0; k < 6; k++) {
      g.strokeStyle = `rgba(120,80,50,${0.05 + Math.random() * 0.06})`
      g.beginPath(); g.moveTo(0, i * 32 + 4 + k * 4.5); g.bezierCurveTo(80, i * 32 + k * 5, 170, i * 32 + 8 + k * 4, 256, i * 32 + 3 + k * 4.5); g.stroke()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  return t
}

function clear() {
  group.value.clear()
  disposables.splice(0).forEach((d) => d.dispose())
  tiles = ring = strips = null
}

function build() {
  clear()
  const m = new THREE.Matrix4()
  const f = props.footprint

  // Losa del piso
  const slab = new THREE.Mesh(
    track(new THREE.BoxGeometry(f.w + 3, 0.4, f.d + 3)),
    track(new THREE.MeshStandardMaterial({ color: '#3a2a22', roughness: 0.9 })),
  )
  slab.position.set(f.x, -0.25, f.z)
  group.value.add(slab)

  const box = track(new THREE.BoxGeometry(1, 1, 1))
  const q = new THREE.Quaternion()
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
  const n = Math.max(1, props.slots.length)

  // Piso de madera de cada unidad (teñido suave con el color de estado)
  const wood = track(woodTexture())
  tiles = new THREE.InstancedMesh(track(new THREE.BoxGeometry(1, 0.08, 1)),
    track(new THREE.MeshStandardMaterial({ map: wood, roughness: 0.55, metalness: 0.02 })), n)
  tiles.count = props.slots.length
  props.slots.forEach((s, i) => {
    m.compose(v(px(s), 0.04, pz(s)), q, v(s.uw - WALL_T * 2, 1, s.ud - WALL_T * 2))
    tiles!.setMatrixAt(i, m)
  })
  group.value.add(tiles)

  // Franja con el color de estado por dentro de los muros (se lee de lejos sin pintar todo el piso)
  strips = new THREE.InstancedMesh(box, track(new THREE.MeshBasicMaterial({ color: '#ffffff' })), n * 4)
  let k = 0
  for (const s of props.slots) {
    const iw = s.uw - WALL_T * 2, id = s.ud - WALL_T * 2, b = 0.22
    for (const [dx, dz, sx, sz] of [[0, -id / 2 + b / 2, iw, b], [0, id / 2 - b / 2, iw, b], [-iw / 2 + b / 2, 0, b, id], [iw / 2 - b / 2, 0, b, id]]) {
      m.compose(v(px(s) + dx, 0.09, pz(s) + dz), q, v(sx, 0.02, sz))
      strips.setMatrixAt(k++, m)
    }
  }
  strips.count = k
  group.value.add(strips)

  // Muros con vano de puerta en el frente, remate oscuro arriba
  const DOOR = 1.0
  const segs: [number, number, number, number][] = []
  for (const s of props.slots) {
    const x = px(s), z = pz(s)
    const side = (s.uw - DOOR) / 2
    segs.push([x, z - s.ud / 2, s.uw, WALL_T]) // fondo
    segs.push([x - s.uw / 2, z, WALL_T, s.ud], [x + s.uw / 2, z, WALL_T, s.ud]) // laterales
    segs.push([x - DOOR / 2 - side / 2, z + s.ud / 2, side, WALL_T], [x + DOOR / 2 + side / 2, z + s.ud / 2, side, WALL_T]) // frente con puerta
  }
  const walls = new THREE.InstancedMesh(box, track(new THREE.MeshStandardMaterial({ color: '#efe6da', roughness: 0.7 })), Math.max(1, segs.length))
  const caps = new THREE.InstancedMesh(box, track(new THREE.MeshStandardMaterial({ color: '#7a5a44', roughness: 0.6 })), Math.max(1, segs.length))
  segs.forEach(([x, z, sx, sz], i) => {
    walls.setMatrixAt(i, m.compose(v(x, WALL_H / 2, z), q, v(sx, WALL_H, sz)))
    caps.setMatrixAt(i, m.compose(v(x, WALL_H + 0.03, z), q, v(sx + 0.02, 0.06, sz + 0.02)))
  })
  group.value.add(walls, caps)

  // Muebles básicos: cama al fondo y sofá hacia el frente (escala según la unidad)
  const bed = new THREE.InstancedMesh(box, track(new THREE.MeshStandardMaterial({ color: '#e9e3f5', roughness: 0.8 })), n)
  const pillow = new THREE.InstancedMesh(box, track(new THREE.MeshStandardMaterial({ color: '#8b5cf6', roughness: 0.7 })), n)
  const sofa = new THREE.InstancedMesh(box, track(new THREE.MeshStandardMaterial({ color: '#b98a5e', roughness: 0.75 })), n)
  const table = new THREE.InstancedMesh(box, track(new THREE.MeshStandardMaterial({ color: '#5a3d2b', roughness: 0.5 })), n)
  props.slots.forEach((s, i) => {
    const x = px(s), z = pz(s)
    const bw = Math.min(1.8, s.uw * 0.32), bd = Math.min(2.1, s.ud * 0.3)
    bed.setMatrixAt(i, m.compose(v(x - s.uw * 0.22, 0.3, z - s.ud / 2 + WALL_T + bd / 2 + 0.15), q, v(bw, 0.45, bd)))
    pillow.setMatrixAt(i, m.compose(v(x - s.uw * 0.22, 0.58, z - s.ud / 2 + WALL_T + 0.35), q, v(bw * 0.8, 0.12, 0.35)))
    sofa.setMatrixAt(i, m.compose(v(x + s.uw * 0.18, 0.28, z + s.ud * 0.12), q, v(Math.min(2.2, s.uw * 0.38), 0.45, 0.8)))
    table.setMatrixAt(i, m.compose(v(x + s.uw * 0.18, 0.2, z - s.ud * 0.08), q, v(0.9, 0.3, 0.6)))
  })
  for (const f of [bed, pillow, sofa, table]) f.count = props.slots.length
  group.value.add(bed, pillow, sofa, table)

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
  const white = new THREE.Color('#ffffff')
  const dim = new THREE.Color('#18181b')
  props.slots.forEach((s, i) => {
    const off = !!props.selectedKey && s.key !== props.selectedKey
    c.set(props.colors[i] ?? '#cbd5e1').lerp(white, 0.6)
    if (off) c.lerp(dim, 0.35)
    tiles!.setColorAt(i, c)
    c.set(props.colors[i] ?? '#cbd5e1')
    if (off) c.lerp(dim, 0.45)
    for (let k = 0; k < 4; k++) strips?.setColorAt(i * 4 + k, c)
  })
  if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true
  if (strips?.instanceColor) strips.instanceColor.needsUpdate = true
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

let pmrem: THREE.PMREMGenerator | null = null
onMounted(() => {
  try {
    pmrem = new THREE.PMREMGenerator(renderer as unknown as THREE.WebGLRenderer)
    ;(scene.value as unknown as THREE.Scene).environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  } catch { /* sin entorno: luz básica */ }
  build()
  const el = renderer.domElement as HTMLCanvasElement
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointerup', onUp)
})
onBeforeUnmount(() => {
  const el = renderer.domElement as HTMLCanvasElement
  el.removeEventListener('pointerdown', onDown)
  el.removeEventListener('pointerup', onUp)
  pmrem?.dispose()
  clear()
})

watch(() => props.slots.map((s) => s.key).join(), build)
watch(() => [props.colors, props.selectedKey], paint, { deep: true })
</script>

<template>
  <primitive :object="group" />
</template>
