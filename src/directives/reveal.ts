// Aparición suave al hacer scroll. Uso: v-reveal (o automático con useAutoReveal en el layout).
import type { Directive } from 'vue'

let io: IntersectionObserver | null = null
function observer() {
  if (io || typeof IntersectionObserver === 'undefined') return io
  io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('nl-in'); io!.unobserve(e.target) }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 })
  return io
}

export function reveal(el: Element, delay = 0) {
  if (el.classList.contains('nl-reveal')) return
  const obs = observer()
  if (!obs) return
  el.classList.add('nl-reveal')
  if (delay) (el as HTMLElement).style.transitionDelay = `${delay}ms`
  obs.observe(el)
}

export const vReveal: Directive<Element, number | undefined> = { mounted: (el, b) => reveal(el, b.value ?? 0) }

/** Marca solas las tarjetas y secciones de una zona (y las que aparezcan después). */
export function autoReveal(root: Element, selector: string) {
  const scan = () => root.querySelectorAll(selector).forEach((el, i) => reveal(el, Math.min(i % 6, 5) * 60))
  scan()
  const mo = new MutationObserver(() => scan())
  mo.observe(root, { childList: true, subtree: true })
  return () => mo.disconnect()
}
