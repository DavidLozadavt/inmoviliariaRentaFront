<script setup lang="ts">
// Caja de la habitación vista desde adentro. Vive dentro de <TresCanvas>.
// Cada cara lleva su foto; las que no tienen foto muestran una superficie neutra (y en modo edición,
// un rótulo "+ Pared frontal" para indicar que se puede tocar y subir la foto).
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { useTres } from '@tresjs/core'
import * as THREE from 'three'
import type { PanoramaNode, Surface } from '@/types/visor3d'
import { mediaUrl } from '@/utils/visor3d/device'
import { SURFACES } from '@/utils/visor3d/spaces'

const props = defineProps<{
  surfaces: Partial<Record<Surface, PanoramaNode | { url: string }>>
  editable?: boolean
  highlight?: Surface | null
}>()
const emit = defineEmits<{ pick: [surface: Surface] }>()

const { renderer, camera, invalidate } = useTres()
const H = 2.6
// Orden de caras de BoxGeometry: +x, -x, +y, -y, +z, -z. La cámara mira hacia -z (pared frontal).
const FACES: Surface[] = ['right', 'left', 'ceiling', 'floor', 'back', 'front']
const group = shallowRef(new THREE.Group())
const loader = new THREE.TextureLoader().setCrossOrigin('anonymous')
const disposables: { dispose(): void }[] = []
let box: THREE.Mesh | null = null
let mats: THREE.MeshBasicMaterial[] = []
let ring: THREE.LineSegments | null = null

/** Superficie sin foto: tono suave con cuadrícula; en edición, rótulo para invitar a subir la foto. */
function emptyTexture(surface: Surface): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  const base = surface === 'floor' ? '#cfc4b6' : surface === 'ceiling' ? '#f3efe9' : '#e7e0d6'
  g.fillStyle = base
  g.fillRect(0, 0, 512, 512)
  g.strokeStyle = 'rgba(90,70,50,.12)'
  g.lineWidth = 2
  for (let i = 0; i <= 512; i += 64) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke()
    g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke()
  }
  if (props.editable) {
    g.fillStyle = 'rgba(218,156,95,.92)'
    g.beginPath(); g.roundRect(96, 200, 320, 112, 24); g.fill()
    g.fillStyle = '#2b1a0e'
    g.font = 'bold 40px system-ui, sans-serif'
    g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText('+ ' + (SURFACES.find((s) => s.key === surface)?.short ?? ''), 256, 240)
    g.font = '24px system-ui, sans-serif'
    g.fillText('toca para subir la foto', 256, 284)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = THREE.RepeatWrapping
  t.repeat.x = -1
  t.offset.x = 1
  disposables.push(t)
  return t
}

function build() {
  group.value.clear()
  disposables.splice(0).forEach((d) => d.dispose())
  const geo = new THREE.BoxGeometry(1, 1, 1)
  disposables.push(geo)
  mats = FACES.map((f) => {
    const m = new THREE.MeshBasicMaterial({ map: emptyTexture(f), side: THREE.BackSide })
    disposables.push(m)
    return m
  })
  box = new THREE.Mesh(geo, mats)
  box.scale.set(4, H, 4)
  group.value.add(box)

  const aspect: Partial<Record<Surface, number>> = {}
  const resize = () => {
    const w = aspect.front ?? aspect.back ?? 4 / 3
    const d = aspect.left ?? aspect.right ?? w
    box!.scale.set(Math.min(8, Math.max(2, H * w)), H, Math.min(8, Math.max(2, H * d)))
    invalidate()
  }

  FACES.forEach((face, i) => {
    const node = props.surfaces[face]
    if (!node) return
    loader.load(mediaUrl(node.url), (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      tex.wrapS = THREE.RepeatWrapping
      tex.repeat.x = -1
      tex.offset.x = 1
      if (face === 'floor' || face === 'ceiling') { tex.center.set(0.5, 0.5); tex.rotation = Math.PI }
      const img = tex.image as { width: number; height: number }
      if (face !== 'floor' && face !== 'ceiling') aspect[face] = img.width / img.height
      mats[i].map = tex
      mats[i].needsUpdate = true
      disposables.push(tex)
      resize()
    })
  })

  // Marco de la cara resaltada (en edición)
  ring = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: '#da9c5f' }))
  ring.visible = false
  group.value.add(ring)
  mark()
}

/** Dibuja un marco dorado sobre la cara resaltada. */
function mark() {
  if (!ring || !box) return
  const f = props.highlight
  ring.visible = !!f && !!props.editable
  if (!f) return invalidate()
  const s = box.scale
  const e = 0.49
  ring.rotation.set(0, 0, 0)
  ring.scale.set(1, 1, 1)
  if (f === 'front') { ring.position.set(0, 0, -s.z * e); ring.scale.set(s.x * 0.96, s.y * 0.96, 1) }
  if (f === 'back') { ring.position.set(0, 0, s.z * e); ring.scale.set(s.x * 0.96, s.y * 0.96, 1) }
  if (f === 'right') { ring.position.set(s.x * e, 0, 0); ring.rotation.y = Math.PI / 2; ring.scale.set(s.z * 0.96, s.y * 0.96, 1) }
  if (f === 'left') { ring.position.set(-s.x * e, 0, 0); ring.rotation.y = Math.PI / 2; ring.scale.set(s.z * 0.96, s.y * 0.96, 1) }
  if (f === 'floor') { ring.position.set(0, -s.y * e, 0); ring.rotation.x = Math.PI / 2; ring.scale.set(s.x * 0.96, s.z * 0.96, 1) }
  if (f === 'ceiling') { ring.position.set(0, s.y * e, 0); ring.rotation.x = Math.PI / 2; ring.scale.set(s.x * 0.96, s.z * 0.96, 1) }
  invalidate()
}

// Toque/clic sobre una cara (distingue de arrastrar para mirar)
const ray = new THREE.Raycaster()
const ndc = new THREE.Vector2()
let down: { x: number; y: number } | null = null
const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY })
function onUp(e: PointerEvent) {
  if (!props.editable || !down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || !box || !camera.value) return
  down = null
  const r = (renderer.domElement as HTMLCanvasElement).getBoundingClientRect()
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(ndc, camera.value)
  const hit = ray.intersectObject(box, false)[0]
  const mi = hit?.face?.materialIndex
  if (mi !== undefined) emit('pick', FACES[mi])
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
  disposables.splice(0).forEach((d) => d.dispose())
})
watch(() => [props.surfaces, props.editable], build, { deep: true })
watch(() => props.highlight, mark)
</script>

<template>
  <primitive :object="group" />
</template>
