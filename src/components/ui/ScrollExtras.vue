<script setup lang="ts">
// Barra de progreso de scroll (arriba) y botón "volver arriba" con anillo de progreso.
import { onBeforeUnmount, onMounted, ref } from 'vue'

const pct = ref(0)
let ticking = false
function update() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  pct.value = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0
  ticking = false
}
const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }
onMounted(() => { update(); window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll) })
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll) })
const C = 2 * Math.PI * 20
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
</script>

<template>
  <div class="nl-progress" :style="{ transform: `scaleX(${pct / 100})` }" aria-hidden="true" />
  <button v-show="pct > 8" type="button" class="nl-top" aria-label="Volver arriba" @click="toTop">
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="20" class="trk" />
      <circle cx="24" cy="24" r="20" class="val" :stroke-dasharray="C" :stroke-dashoffset="C * (1 - pct / 100)" />
    </svg>
    <span>↑</span>
  </button>
</template>

<style scoped>
.nl-progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 10001; transform-origin: 0 50%;
  background: var(--nl-gradient); box-shadow: 0 0 10px rgba(139, 92, 246, 0.6); pointer-events: none; }
.nl-top { position: fixed; left: 22px; bottom: 22px; z-index: 9000; width: 48px; height: 48px; border-radius: 50%; border: 0; cursor: pointer;
  background: rgba(31, 20, 15, 0.85); color: #f5efe6; display: grid; place-items: center; backdrop-filter: blur(8px);
  box-shadow: 0 8px 22px rgba(0,0,0,.35); transition: transform .2s; }
.nl-top:hover { transform: translateY(-3px); }
.nl-top svg { position: absolute; inset: 0; transform: rotate(-90deg); }
.trk { fill: none; stroke: rgba(255,255,255,.12); stroke-width: 3; }
.val { fill: none; stroke: var(--nexi-purple); stroke-width: 3; stroke-linecap: round; transition: stroke-dashoffset .1s linear; }
.nl-top span { position: relative; font-size: 18px; font-weight: 800; }
@media (max-width: 640px) { .nl-top { left: 12px; bottom: 12px; width: 42px; height: 42px; } }
</style>
