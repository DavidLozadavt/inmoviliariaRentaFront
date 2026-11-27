// Fotos 360° optimizadas EN EL NAVEGADOR antes de subir: así PHP nunca abre la imagen
// y no se acerca al memory_limit del hosting compartido.

export const MAX_PANO_WIDTH = 6000
export const THUMB_WIDTH = 480

export interface PreparedPanorama {
  image: Blob
  thumb: Blob
  width: number
  height: number
  originalKb: number
  finalKb: number
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo convertir la imagen'))), type, quality),
  )
}

async function draw(source: ImageBitmap, width: number, quality: number): Promise<Blob> {
  const height = Math.round((width * source.height) / source.width)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('El navegador no permite procesar imágenes')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, width, height)
  let blob = await toBlob(canvas, 'image/webp', quality)
  // Safari antiguo no exporta WebP y devuelve PNG: en ese caso, JPEG
  if (blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality)
  canvas.width = canvas.height = 0 // libera memoria en móviles
  return blob
}

/** ¿Es una panorámica de celular (franja ancha) en vez de una 360° 2:1? */
export const isPhonePanorama = (w: number, h: number) => w / h > 2.2

/**
 * Convierte una panorámica de celular (franja horizontal) en una imagen 2:1 equirectangular.
 * `angle` = grados horizontales que cubre la foto (360 si dio la vuelta completa).
 * La franja queda centrada; techo y piso se rellenan estirando y difuminando el primer y último
 * renglón de la foto, y los lados (si no es 360°) con el borde de la foto.
 */
function phoneToEquirect(src: ImageBitmap, angle: number): HTMLCanvasElement {
  let fullW = Math.round((src.width * 360) / angle)
  const scale = Math.min(1, MAX_PANO_WIDTH / fullW)
  fullW = Math.round(fullW * scale)
  const fullH = Math.round(fullW / 2)
  const w = Math.round(src.width * scale)
  const h = Math.min(fullH, Math.round(src.height * scale))
  const x0 = Math.round((fullW - w) / 2)
  const y0 = Math.round((fullH - h) / 2)

  const c = document.createElement('canvas')
  c.width = fullW
  c.height = fullH
  const g = c.getContext('2d')
  if (!g) throw new Error('El navegador no permite procesar imágenes')
  g.fillStyle = '#1f1f1f'
  g.fillRect(0, 0, fullW, fullH)
  g.filter = 'blur(24px)'
  // techo y piso: primer / último renglón estirado
  g.drawImage(src, 0, 0, src.width, 2, x0, 0, w, y0 + 4)
  g.drawImage(src, 0, src.height - 2, src.width, 2, x0, y0 + h - 4, w, fullH - y0 - h + 4)
  // lados (panorámicas de menos de 360°)
  if (x0 > 0) {
    g.drawImage(src, 0, 0, 2, src.height, 0, 0, x0 + 4, fullH)
    g.drawImage(src, src.width - 2, 0, 2, src.height, x0 + w - 4, 0, fullW - x0 - w + 4, fullH)
  }
  g.filter = 'none'
  g.drawImage(src, x0, y0, w, h)
  return c
}

export async function preparePanorama(file: File, quality = 0.82, phoneAngle = 360): Promise<PreparedPanorama> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen')

  let bitmap = await createImageBitmap(file)
  try {
    if (isPhonePanorama(bitmap.width, bitmap.height)) {
      const canvas = phoneToEquirect(bitmap, phoneAngle)
      bitmap.close()
      bitmap = await createImageBitmap(canvas)
      canvas.width = canvas.height = 0
    }
    const ratio = bitmap.width / bitmap.height
    if (Math.abs(ratio - 2) > 0.1) {
      throw new Error(`La foto debe ser 360° equirectangular (2:1) o una panorámica de celular. Esta es ${bitmap.width}×${bitmap.height}.`)
    }
    const width = Math.min(bitmap.width, MAX_PANO_WIDTH)
    const image = await draw(bitmap, width, quality)
    const thumb = await draw(bitmap, THUMB_WIDTH, 0.7)
    return {
      image,
      thumb,
      width,
      height: Math.round(width / ratio),
      originalKb: Math.round(file.size / 1024),
      finalKb: Math.round(image.size / 1024),
    }
  } finally {
    bitmap.close()
  }
}

// ── Fotos normales (no 360°): portada del edificio y fotos de espacios ──

export interface PreparedPhoto {
  image: Blob
  thumb: Blob
  width: number
  originalKb: number
  finalKb: number
}

/** Redimensiona una foto normal a WebP (lado mayor ≤ maxSide) + miniatura. */
export async function preparePhoto(file: File | Blob, maxSide = 2400, quality = 0.82): Promise<PreparedPhoto> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen')
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const image = await draw(bitmap, width, quality)
    const thumb = await draw(bitmap, Math.min(width, THUMB_WIDTH), 0.7)
    return { image, thumb, width, originalKb: Math.round(file.size / 1024), finalKb: Math.round(image.size / 1024) }
  } finally {
    bitmap.close()
  }
}

/** 360° (2:1 o panorámica de celular) o foto normal, según la proporción. */
export async function detectProjection(file: File): Promise<'equirect' | 'flat'> {
  const b = await createImageBitmap(file)
  const r = b.width / b.height
  b.close()
  return Math.abs(r - 2) <= 0.1 || r > 2.2 ? 'equirect' : 'flat'
}
