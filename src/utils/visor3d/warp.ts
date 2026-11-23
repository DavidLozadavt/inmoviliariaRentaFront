// Endereza una cara del edificio marcada con 4 esquinas en una foto (corrige la perspectiva).
// Homografía rectángulo → cuadrilátero; la imagen se dibuja por triángulos pequeños con transformación afín.

export interface Pt { x: number; y: number }
/** Esquinas en orden: arriba-izq, arriba-der, abajo-der, abajo-izq. */
export type Quad = [Pt, Pt, Pt, Pt]

/** Matriz 3x3 (fila mayor) que lleva los puntos `from` a `to` (4 pares). */
export function homography(from: Pt[], to: Pt[]): number[] {
  const A: number[][] = []
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i]
    const { x: u, y: v } = to[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u])
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v])
  }
  // Eliminación gaussiana con pivoteo parcial (8 incógnitas)
  for (let c = 0; c < 8; c++) {
    let p = c
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r
    ;[A[c], A[p]] = [A[p], A[c]]
    const d = A[c][c] || 1e-12
    for (let k = c; k < 9; k++) A[c][k] /= d
    for (let r = 0; r < 8; r++) {
      if (r === c) continue
      const f = A[r][c]
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k]
    }
  }
  return [A[0][8], A[1][8], A[2][8], A[3][8], A[4][8], A[5][8], A[6][8], A[7][8], 1]
}

export function apply(H: number[], p: Pt): Pt {
  const w = H[6] * p.x + H[7] * p.y + H[8]
  return { x: (H[0] * p.x + H[1] * p.y + H[2]) / w, y: (H[3] * p.x + H[4] * p.y + H[5]) / w }
}

function drawTriangle(ctx: CanvasRenderingContext2D, img: CanvasImageSource, s: Pt[], d: Pt[]) {
  // Transformación afín que lleva el triángulo de origen (s) al de destino (d)
  const [s0, s1, s2] = s
  const [d0, d1, d2] = d
  const den = s0.x * (s2.y - s1.y) - s1.x * s2.y + s2.x * s1.y + (s1.x - s2.x) * s0.y
  if (Math.abs(den) < 1e-9) return
  const a = -(s0.y * (d2.x - d1.x) - s1.y * d2.x + s2.y * d1.x + (s1.y - s2.y) * d0.x) / den
  const b = -(s0.y * (d2.y - d1.y) - s1.y * d2.y + s2.y * d1.y + (s1.y - s2.y) * d0.y) / den
  const c = (s0.x * (d2.x - d1.x) - s1.x * d2.x + s2.x * d1.x + (s1.x - s2.x) * d0.x) / den
  const dd = (s0.x * (d2.y - d1.y) - s1.x * d2.y + s2.x * d1.y + (s1.x - s2.x) * d0.y) / den
  const e = (s0.x * (s2.y * d1.x - s1.y * d2.x) + s0.y * (s1.x * d2.x - s2.x * d1.x) + (s2.x * s1.y - s1.x * s2.y) * d0.x) / den
  const f = (s0.x * (s2.y * d1.y - s1.y * d2.y) + s0.y * (s1.x * d2.y - s2.x * d1.y) + (s2.x * s1.y - s1.x * s2.y) * d0.y) / den

  // Recorte del triángulo destino, agrandado medio píxel para no dejar costuras
  const cx = (d0.x + d1.x + d2.x) / 3
  const cy = (d0.y + d1.y + d2.y) / 3
  const grow = (p: Pt) => {
    const dx = p.x - cx
    const dy = p.y - cy
    const l = Math.hypot(dx, dy) || 1
    return { x: p.x + (dx / l) * 0.6, y: p.y + (dy / l) * 0.6 }
  }
  const [g0, g1, g2] = [grow(d0), grow(d1), grow(d2)]
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(g0.x, g0.y)
  ctx.lineTo(g1.x, g1.y)
  ctx.lineTo(g2.x, g2.y)
  ctx.closePath()
  ctx.clip()
  ctx.setTransform(a, b, c, dd, e, f)
  ctx.drawImage(img, 0, 0)
  ctx.restore()
}

/** Tamaño de salida según el cuadrilátero (ancho fijo, alto proporcional). */
export function quadAspect(q: Quad): number {
  const w = (Math.hypot(q[1].x - q[0].x, q[1].y - q[0].y) + Math.hypot(q[2].x - q[3].x, q[2].y - q[3].y)) / 2
  const h = (Math.hypot(q[3].x - q[0].x, q[3].y - q[0].y) + Math.hypot(q[2].x - q[1].x, q[2].y - q[1].y)) / 2
  return h / Math.max(1, w)
}

export function warpQuad(img: CanvasImageSource, quad: Quad, outW: number, outH: number, grid = 24): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('El navegador no permite procesar imágenes')
  ctx.imageSmoothingQuality = 'high'

  const rect: Pt[] = [{ x: 0, y: 0 }, { x: outW, y: 0 }, { x: outW, y: outH }, { x: 0, y: outH }]
  const H = homography(rect, quad) // destino (rectángulo) → origen (foto)

  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      const x0 = (outW * i) / grid
      const x1 = (outW * (i + 1)) / grid
      const y0 = (outH * j) / grid
      const y1 = (outH * (j + 1)) / grid
      const d = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }]
      const s = d.map((p) => apply(H, p))
      drawTriangle(ctx, img, [s[0], s[1], s[2]], [d[0], d[1], d[2]])
      drawTriangle(ctx, img, [s[0], s[2], s[3]], [d[0], d[2], d[3]])
    }
  }
  return canvas
}

/** Carga una imagen apta para dibujar en canvas (CORS anónimo). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la foto'))
    img.src = src
  })
}

/**
 * Estima cuántos pisos tiene una fachada enderezada.
 * 1) Perfil vertical: contraste horizontal por renglón (losas, antepechos y bordes de ventana).
 * 2) Se suaviza con una ventana de ~h/25 para borrar detalles finos (láminas de persianas, rejas, ladrillo),
 *    que son los que confundían el conteo.
 * 3) Autocorrelación normalizada: el período de un piso es el primer pico fuerte.
 * Solo devuelve un número si el patrón es claro (confianza ≥ 0,35); si no, null (no se sugiere nada).
 * `aspect` = alto/ancho real de la cara: limita el rango a pisos de 2,4 a 4,5 m si se conoce el ancho.
 */
export function estimateFloors(canvas: HTMLCanvasElement, widthMeters?: number): number | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const { width: w, height: h } = canvas
  if (h < 80) return null
  const data = ctx.getImageData(0, 0, w, h).data
  const lum = (x: number, y: number) => {
    const i = (y * w + x) * 4
    return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  // Solo el centro (evita bordes del recorte) y diferencias verticales con paso de 2 px
  const x0 = Math.floor(w * 0.1), x1 = Math.ceil(w * 0.9)
  const step = Math.max(1, Math.floor((x1 - x0) / 160))
  const raw = new Float64Array(h)
  for (let y = 2; y < h; y++) {
    let s = 0
    for (let x = x0; x < x1; x += step) s += Math.abs(lum(x, y) - lum(x, y - 2))
    raw[y] = s
  }
  // Suavizado (quita lo fino) y quitar tendencia (quita cambios de luz)
  const box = (src: Float64Array, r: number) => {
    const out = new Float64Array(h)
    let acc = 0, n = 0
    for (let y = 0; y < h + r; y++) {
      if (y < h) { acc += src[y]; n++ }
      if (y - 2 * r - 1 >= 0) { acc -= src[y - 2 * r - 1]; n-- }
      const c = y - r
      if (c >= 0 && c < h) out[c] = acc / n
    }
    return out
  }
  const smooth = box(raw, Math.max(2, Math.round(h / 50)))
  const trend = box(smooth, Math.max(6, Math.round(h / 6)))
  const r = new Float64Array(h)
  let mean = 0
  for (let y = 0; y < h; y++) { r[y] = smooth[y] - trend[y]; mean += r[y] }
  mean /= h
  let v0 = 0
  for (let y = 0; y < h; y++) { r[y] -= mean; v0 += r[y] * r[y] }
  if (v0 <= 0) return null

  // Rango de períodos posibles: de 1 a 40 pisos; si se sabe el ancho, piso de 2,4 a 4,5 m
  let minLag = Math.max(8, Math.round(h / 40))
  let maxLag = Math.round(h / 1.2)
  if (widthMeters && widthMeters > 0) {
    const pxPerM = w / widthMeters
    minLag = Math.max(minLag, Math.round(2.4 * pxPerM))
    maxLag = Math.min(maxLag, Math.round(4.5 * pxPerM))
  }
  if (maxLag <= minLag) return null

  const corr = (lag: number) => {
    let s = 0
    for (let y = 0; y + lag < h; y++) s += r[y] * r[y + lag]
    return (s / (h - lag)) / (v0 / h)
  }
  let best = 0, bestLag = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    const c = corr(lag)
    if (c > best) { best = c; bestLag = lag }
  }
  if (!bestLag || best < 0.35) return null
  // Ambigüedad: si el doble del período (o la mitad) también correlaciona fuerte, puede haber dos franjas
  // por piso (ventana + persiana). En ese caso no se adivina: se deja que la persona lo indique.
  const dbl = 2 * bestLag <= Math.round(h / 1.05) ? corr(2 * bestLag) : 0
  const half = Math.round(bestLag / 2) >= 4 ? corr(Math.round(bestLag / 2)) : 0
  if (dbl > best * 0.6 || half > best * 0.6) return null
  const floors = Math.round(h / bestLag)
  return floors >= 1 && floors <= 60 ? floors : null
}
