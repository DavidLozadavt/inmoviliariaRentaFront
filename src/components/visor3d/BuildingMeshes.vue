<script setup lang="ts">
// Geometría del edificio. Vive DENTRO de <TresCanvas>: usa el contexto de TresJS.
// Una InstancedMesh para todas las unidades (un solo draw call), otras para losas y balcones,
// cajas para pisos especiales y una "piel" con la fachada real por torre. Cada torre puede estar
// rotada y tener su propio ancho/fondo de unidad (forma ajustada sobre el plano del conjunto).
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { useTres } from '@tresjs/core'
import * as THREE from 'three'
import { type BuildingLayout, type Slot, rotateXZ } from '@/utils/visor3d/layout'
import { SPECIAL_COLORS } from '@/utils/visor3d/colors'
import { mediaUrl } from '@/utils/visor3d/device'

const props = defineProps<{
  layout: BuildingLayout
  colors: string[]                       // un color por slot (mismo orden que layout.slots)
  selectedFloor: { tower: string; floor: number } | null
  selectedKey: string | null
  facade?: string
  facadeFront?: string | null   // textura del frente (foto del edificio enderezada)
  facadeSide?: string | null
  look?: 'facade' | 'colors'    // fachada real o colores de disponibilidad
  faces?: { left?: string | null; back?: string | null; roof?: string | null } | null  // caras extra del edificio
  roofColor?: string | null     // color del techo si no hay foto
  sitePlan?: string | null      // plano / vista aérea del conjunto como suelo
  siteWidth?: number | null     // ancho real del plano (m)
}>()

const emit = defineEmits<{ pick: [slot: Slot | null] }>()

const { renderer, camera, invalidate } = useTres()

const group = shallowRef(new THREE.Group())
let units: THREE.InstancedMesh | null = null
let floorBox: THREE.LineSegments | null = null
let unitBox: THREE.LineSegments | null = null
let shells: THREE.Mesh[] = []
let plain: THREE.Object3D[] = []   // losas, balcones y pisos especiales (se ocultan con la fachada)
const disposables: { dispose(): void }[] = []
const loader = new THREE.TextureLoader().setCrossOrigin('anonymous')
const texCache = new Map<string, THREE.Texture>()
const UP = new THREE.Vector3(0, 1, 0)
const q = (rot: number) => new THREE.Quaternion().setFromAxisAngle(UP, rot)

function texture(url: string, onReady: (t: THREE.Texture) => void) {
  const hit = texCache.get(url)
  if (hit) return onReady(hit)
  loader.load(mediaUrl(url), (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    texCache.set(url, t)
    onReady(t)
    invalidate()
  })
}

const facadeOn = () => props.look !== 'colors' && (!!props.facadeFront || props.layout.towers.some((t) => t.facadeFront))

function windowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 128, 128)
  g.fillStyle = '#5b6b7c'
  g.fillRect(14, 30, 42, 58) // dos ventanas por cara
  g.fillRect(72, 30, 42, 58)
  g.fillStyle = '#e5e7eb'
  g.fillRect(0, 118, 128, 10) // antepecho
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function track<T extends { dispose(): void }>(o: T): T {
  disposables.push(o)
  return o
}

function clear() {
  group.value.clear()
  disposables.splice(0).forEach((d) => d.dispose())
  units = floorBox = unitBox = null
  shells = []
  plain = []
}

const m4 = new THREE.Matrix4()
const v3 = new THREE.Vector3()
const s3 = new THREE.Vector3()

function unitMatrix(s: Slot, visible: boolean, h: number) {
  if (!visible) s3.set(0, 0, 0)
  else s3.set(s.uw * 0.94, h * 0.9, s.ud * 0.94)
  return m4.compose(v3.set(s.x, s.y, s.z), q(s.rot), s3)
}

function build() {
  clear()
  const l = props.layout
  const h = l.floorHeight
  const unitGeo = track(new THREE.BoxGeometry(1, 1, 1))

  // Unidades
  const mat = track(new THREE.MeshStandardMaterial({ map: track(windowTexture()), roughness: 0.75, metalness: 0.05 }))
  units = new THREE.InstancedMesh(unitGeo, mat, Math.max(1, l.slots.length))
  units.count = l.slots.length
  l.slots.forEach((s, i) => units!.setMatrixAt(i, unitMatrix(s, true, h)))
  units.instanceMatrix.needsUpdate = true
  group.value.add(units)

  // Balcones con baranda de vidrio en las fachadas largas (primera y última fila de cada torre)
  const BAL_D = 1.3
  const balconies: { s: Slot; dir: number }[] = []
  for (const s of l.slots) {
    if (s.row === 0) balconies.push({ s, dir: -1 })
    if (s.row === s.rows - 1) balconies.push({ s, dir: 1 })
  }
  if (balconies.length) {
    const balSlab = new THREE.InstancedMesh(unitGeo, track(new THREE.MeshStandardMaterial({ color: '#f5f5f4', roughness: 0.6 })), balconies.length)
    const glass = new THREE.InstancedMesh(unitGeo,
      track(new THREE.MeshStandardMaterial({ color: '#9fc3d6', transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.2 })), balconies.length)
    const t = l.towers
    balconies.forEach(({ s, dir }, i) => {
      const tw = t.find((x) => x.code === s.tower)!
      const yBase = s.y - h * 0.45
      const place = (lzOff: number, y: number, sx: number, sy: number, sz: number) => {
        const [rx, rz] = rotateXZ(s.lx, s.lz + lzOff, s.rot)
        return m4.compose(v3.set(tw.x + rx, y, tw.z + rz), q(s.rot), s3.set(sx, sy, sz))
      }
      balSlab.setMatrixAt(i, place(dir * (s.ud / 2 + BAL_D / 2), yBase, s.uw * 0.78, 0.18, BAL_D))
      glass.setMatrixAt(i, place(dir * (s.ud / 2 + BAL_D), yBase + h * 0.16, s.uw * 0.78, h * 0.32, 0.06))
    })
    group.value.add(balSlab, glass)
    plain.push(balSlab, glass)
  }

  // Losas entre pisos (una por nivel y torre)
  const levels: { x: number; y: number; z: number; w: number; d: number; rot: number }[] = []
  for (const t of l.towers) {
    const topIsTerrace = l.specials.some((s) => s.tower === t.code && s.floor === t.maxLevel && s.kind === 'terrace')
    for (let lv = t.minLevel; lv <= t.maxLevel + (topIsTerrace ? 0 : 1); lv++) {
      levels.push({ x: t.x, y: (lv - l.baseLevel) * h, z: t.z, w: t.w + 0.6, d: t.d + 0.6, rot: t.rot })
    }
  }
  const slabs = new THREE.InstancedMesh(unitGeo, track(new THREE.MeshStandardMaterial({ color: props.facade || '#d6d3d1', roughness: 0.9 })), Math.max(1, levels.length))
  levels.forEach((s, i) => slabs.setMatrixAt(i, m4.compose(v3.set(s.x, s.y, s.z), q(s.rot), s3.set(s.w, 0.25, s.d))))
  slabs.count = levels.length
  group.value.add(slabs)
  plain.push(slabs)

  // Pisos especiales (lobby, parqueaderos, terraza…)
  for (const s of l.specials) {
    const isTerrace = s.kind === 'terrace'
    const g = track(new THREE.BoxGeometry(s.w * (isTerrace ? 1 : 0.96), isTerrace ? h * 0.25 : h * 0.9, s.d * (isTerrace ? 1 : 0.96)))
    const mt = track(new THREE.MeshStandardMaterial({
      color: SPECIAL_COLORS[s.kind] ?? '#9ca3af', roughness: 0.8, transparent: s.kind === 'lobby', opacity: s.kind === 'lobby' ? 0.75 : 1,
    }))
    const mesh = new THREE.Mesh(g, mt)
    mesh.position.set(s.x, isTerrace ? s.y - h * 0.32 : s.y, s.z)
    mesh.rotation.y = s.rot
    group.value.add(mesh)
    plain.push(mesh)
  }

  // Fachada real: una "piel" por torre con una textura por cara. Caras sin foto propia usan la opuesta
  // (izquierda ← derecha ← frente; trasera ← frente). El techo usa su foto o el color de techo.
  {
    for (const t of l.towers) {
      const own = !!t.facadeFront
      const ff = t.facadeFront ?? props.facadeFront
      if (!ff) continue
      const pick = (towerVal: string | null, bVal?: string | null) => (own ? towerVal : bVal ?? null)
      const fRight = pick(t.facadeSide, props.facadeSide) ?? ff
      const fLeft = pick(t.facadeLeft, props.faces?.left) ?? fRight
      const fBack = pick(t.facadeBack, props.faces?.back) ?? ff
      const fRoof = pick(t.roof, props.faces?.roof)
      const y0 = (t.minLevel - l.baseLevel) * h
      const y1 = (t.maxLevel + 1 - l.baseLevel) * h
      const mk = (url: string) => {
        const m = track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.65, metalness: 0.05, transparent: true }))
        texture(url, (tx) => { m.map = tx; m.needsUpdate = true })
        return m
      }
      const roof = track(new THREE.MeshStandardMaterial({ color: props.roofColor || props.facade || '#b9a48c', roughness: 0.9, transparent: true }))
      if (fRoof) texture(fRoof, (tx) => { roof.map = tx; roof.color.set('#ffffff'); roof.needsUpdate = true })
      const bottom = track(new THREE.MeshStandardMaterial({ color: '#3f3f46', transparent: true }))
      // Orden de BoxGeometry: +x (derecha), -x (izquierda), +y (techo), -y, +z (frente), -z (trasera)
      const shell = new THREE.Mesh(track(new THREE.BoxGeometry(t.w + 0.3, y1 - y0, t.d + 0.3)),
        [mk(fRight), mk(fLeft), roof, bottom, mk(ff), mk(fBack)])
      shell.position.set(t.x, (y0 + y1) / 2, t.z)
      shell.rotation.y = t.rot
      shell.userData.tower = t.code
      group.value.add(shell)
      shells.push(shell)
    }
  }

  // Suelo: plano del conjunto centrado en el origen
  if (props.sitePlan) {
    const W = Number(props.siteWidth) || 100
    const gm = track(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }))
    const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), gm)
    ground.rotation.x = -Math.PI / 2
    ground.position.set(0, -0.14, 0)
    ground.scale.set(W, W, 1)
    texture(props.sitePlan, (tx) => {
      const img = tx.image as { width: number; height: number }
      ground.scale.set(W, W * (img.height / img.width), 1)
      gm.map = tx
      gm.needsUpdate = true
    })
    group.value.add(ground)
  }

  // Marcos de selección (cubo unitario escalado y rotado según la torre / unidad)
  const edges = track(new THREE.EdgesGeometry(unitGeo))
  floorBox = new THREE.LineSegments(edges, track(new THREE.LineBasicMaterial({ color: '#da9c5f' })))
  floorBox.visible = false
  unitBox = new THREE.LineSegments(edges, track(new THREE.LineBasicMaterial({ color: '#ffffff' })))
  unitBox.visible = false
  group.value.add(floorBox, unitBox)

  paint()
  highlight()
}

/** Fachada real: piel opaca; con un piso elegido, piel transparente y solo las unidades de ese piso. */
function applyLook() {
  if (!units) return
  const on = facadeOn()
  const sel = props.selectedFloor
  for (const o of plain) o.visible = !on
  for (const sh of shells) {
    sh.visible = on
    for (const mt of sh.material as THREE.MeshStandardMaterial[]) {
      mt.opacity = sel ? 0.22 : 1
      mt.depthWrite = !sel
    }
  }
  const h = props.layout.floorHeight
  props.layout.slots.forEach((s, i) => {
    const show = !on || (!!sel && s.tower === sel.tower && s.floor === sel.floor)
    units!.setMatrixAt(i, unitMatrix(s, show, h))
  })
  units.instanceMatrix.needsUpdate = true
}

const tmp = new THREE.Color()
const white = new THREE.Color('#ffffff')

function paint() {
  if (!units) return
  applyLook()
  const sel = props.selectedFloor
  props.layout.slots.forEach((s, i) => {
    tmp.set(props.colors[i] ?? '#cbd5e1')
    if (!facadeOn() && sel && (s.tower !== sel.tower || s.floor !== sel.floor)) tmp.lerp(white, 0.72)
    units!.setColorAt(i, tmp)
  })
  if (units.instanceColor) units.instanceColor.needsUpdate = true
  invalidate()
}

function highlight() {
  const l = props.layout
  const sel = props.selectedFloor
  if (floorBox) {
    const t = sel && l.towers.find((x) => x.code === sel.tower)
    floorBox.visible = !!t
    if (t && sel) {
      floorBox.position.set(t.x, (sel.floor - l.baseLevel) * l.floorHeight + l.floorHeight / 2, t.z)
      floorBox.rotation.y = t.rot
      floorBox.scale.set(t.w + 1, l.floorHeight, t.d + 1)
    }
  }
  if (unitBox) {
    const s = props.selectedKey ? l.slots.find((x) => x.key === props.selectedKey) : undefined
    unitBox.visible = !!s
    if (s) {
      unitBox.position.set(s.x, s.y, s.z)
      unitBox.rotation.y = s.rot
      unitBox.scale.set(s.uw * 0.98, l.floorHeight * 0.94, s.ud * 0.98)
    }
  }
  invalidate()
}

// ── Selección con el puntero (distingue clic de arrastre para no chocar con la órbita)
const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()
let down: { x: number; y: number } | null = null

function onDown(e: PointerEvent) {
  down = { x: e.clientX, y: e.clientY }
}

function onUp(e: PointerEvent) {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
  down = null
  const el = renderer.domElement as HTMLCanvasElement
  const cam = camera.value
  if (!units || !cam) return
  const r = el.getBoundingClientRect()
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  raycaster.setFromCamera(ndc, cam)
  const targets: THREE.Object3D[] = [units, ...shells.filter((s) => s.visible && !props.selectedFloor)]
  const hit = raycaster.intersectObjects(targets, false)[0]
  if (!hit) return emit('pick', null)
  if (hit.object === units && hit.instanceId !== undefined) return emit('pick', props.layout.slots[hit.instanceId] ?? null)
  // Clic en la fachada: piso según la altura y la unidad más cercana de ese piso
  const l = props.layout
  const tower = hit.object.userData.tower as string
  const floor = Math.floor(hit.point.y / l.floorHeight) + l.baseLevel
  const candidates = l.slots.filter((s) => s.tower === tower && s.floor === floor)
  if (!candidates.length) return emit('pick', null)
  const near = candidates.reduce((a, b) =>
    Math.hypot(b.x - hit.point.x, b.z - hit.point.z) < Math.hypot(a.x - hit.point.x, a.z - hit.point.z) ? b : a)
  emit('pick', near)
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

watch(() => [props.layout, props.facade, props.facadeFront, props.facadeSide, props.faces, props.roofColor, props.sitePlan, props.siteWidth], build, { deep: true })
watch(() => props.look, paint)
watch(() => [props.colors, props.selectedFloor], paint, { deep: true })
watch(() => [props.selectedFloor, props.selectedKey], highlight, { deep: true })
</script>

<template>
  <primitive :object="group" />
</template>
