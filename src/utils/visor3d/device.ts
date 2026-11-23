/** ¿El navegador puede dibujar WebGL? Si no, el visor muestra el plano 2D. */
export function supportsWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

/** Celulares y equipos modestos: menos resolución de render. */
export function isLowEnd(): boolean {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return (mem !== undefined && mem <= 4) || (navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth < 768
}

/**
 * URL de una foto 360°. En desarrollo se pide por el proxy de Vite (/storage → backend)
 * porque `php artisan serve` no agrega CORS a los archivos estáticos. En producción
 * se usa tal cual (el .htaccess del backend agrega Access-Control-Allow-Origin).
 */
export function mediaUrl(url: string): string
export function mediaUrl(url: string | null | undefined): string | undefined
export function mediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (!import.meta.env.DEV) return url
  const i = url.indexOf('/storage/')
  return i >= 0 ? url.slice(i) : url
}
