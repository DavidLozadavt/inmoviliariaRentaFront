<template>
  <!-- Logo oficial de NexiLiving (public/nexiliving-logo.svg) escrito en línea para que use la letra Sora de la página. -->
  <svg
    class="nexiliving-logo"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 518.13 131.99"
    role="img"
    aria-label="NexiLiving, by Virtual Technology SAS"
  >
    <text class="nl-firma" :fill="colorTexto" transform="translate(246.54 119.85)">
      <tspan class="nl-200 nl-08" x="0" y="0">By: </tspan>
      <tspan class="nl-600" style="letter-spacing: -0.02em" x="32.69" y="0">V</tspan>
      <tspan class="nl-600" x="44.46" y="0">i</tspan>
      <tspan class="nl-600" style="letter-spacing: 0.01em" x="49.82" y="0">r</tspan>
      <tspan class="nl-600" x="56.9" y="0">tual</tspan>
      <tspan class="nl-200" style="letter-spacing: 0.02em" x="89.3" y="0">T</tspan>
      <tspan class="nl-200 nl-08" x="99.17" y="0">echnology </tspan>
      <tspan class="nl-200" style="letter-spacing: 0.07em" x="202" y="0">SA</tspan>
      <tspan class="nl-200 nl-08" x="228.09" y="0">S</tspan>
    </text>
    <text class="nl-nombre" :fill="colorTexto" transform="translate(127.46 86.16)">
      <tspan class="nl-300" x="0" y="0">N</tspan>
      <tspan class="nl-300" x="56.57" y="0">e</tspan>
      <tspan class="nl-300" x="97.52" y="0">xi</tspan>
      <tspan class="nl-600" x="154.5" y="0">Living</tspan>
    </text>
    <path
      fill="#b71540"
      d="M26.44,52.95c-.2-.21-1.07.65-1.3.78-7.14,4.16-14-4.49-8.65-10.5L59.37,10.85c3.38-2.31,7.59-2.33,11.07-.22l43.2,32.6c5.36,6.01-1.51,14.66-8.65,10.5-.43-.25-.78-.81-1.3-.78v37.48c0,.69-1.21,2.58-1.75,3.1-2.22,2.12-6.97,1.91-9.9,1.68s-5.18-2.34-5.59-5.18v-43.08c0-.99-.54-1.7-1.54-1.81-1.21-.14-5.3-.17-6.45,0-.7.11-1.17.87-1.21,1.54-.33,5.56.41,11.58.02,17.19-.48,3.98-5.21,5.39-7.7,2.26l-16.09-20.65c-.32-.24-.61-.31-1-.35-1.67-.16-5.63-.18-7.27,0-1.01.11-1.54.83-1.55,1.81v37.81c-.77,2.74-4.6,2.08-4.58-.79v-37.16c.12-3.41,2.4-5.99,5.85-6.26,2.1-.16,7.88-.23,9.7.41.95.33,1.83.92,2.48,1.69l15.24,19.62.38.23v-17.02c0-1.59,2.28-3.94,3.73-4.48,1.75-.65,6.73-.59,8.72-.44,3.42.27,5.76,2.85,5.86,6.26v42.8c.18.6.65.95,1.27,1.02,1.14.14,4.38.14,5.52,0,.8-.1,1.31-.6,1.34-1.41v-39.78s-33.97-25.65-33.97-25.65l-.45.1c-11.24,8.58-22.7,16.89-33.82,25.61l.14,40.32.88.74h19.93c.48-.24.87-.49.94-1.08.33-5.91-.47-12.34-.01-18.18.31-3.94,4.3-5.73,7.34-3.16l17.29,22.15c.9.69,3.28.18,4.5.35,2.66.36,2.69,4.25-.12,4.56-3.91.44-6.17.07-8.68-2.9-5.33-6.31-10.08-13.39-15.35-19.78l-.4-.2v17.97c0,.18-.48,1.44-.6,1.69-.99,1.98-3.09,3.09-5.25,3.23-6.63.43-13.91-.2-20.56-.18-1.66-.43-3.16-1.51-3.95-3.05-.09-.18-.6-1.47-.6-1.55v-37.48ZM64.36,13.69c-1.41.16-2.48,1.01-3.59,1.79l-40.91,30.82c-2.03,2.09.59,5.16,2.93,3.47l42.22-31.81,42.32,31.81c2.41,1.68,5-1.43,2.86-3.53l-42.26-31.76c-1.17-.67-2.21-.95-3.57-.8Z"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/** `oscuro`: texto negro, para fondos claros. `claro`: texto blanco, para fondos oscuros. */
const props = withDefaults(defineProps<{ tono?: 'oscuro' | 'claro' }>(), { tono: 'oscuro' });

const colorTexto = computed(() => (props.tono === 'claro' ? '#ffffff' : '#1a1a1a'));
</script>

<style scoped>
/* El alto lo pone quien lo usa con --alto-logo; el ancho sale de la proporción del logo. */
.nexiliving-logo {
  display: block;
  height: var(--alto-logo, 40px);
  width: auto;
  aspect-ratio: 518.13 / 131.99;
  flex-shrink: 0;
  overflow: visible;
}

.nexiliving-logo text {
  font-family: 'Sora', sans-serif;
}

.nl-nombre {
  font-size: 67.35px;
}

.nl-firma {
  font-size: 16.5px;
}

.nl-200 {
  font-weight: 200;
}

.nl-300 {
  font-weight: 300;
}

.nl-600 {
  font-weight: 600;
}

.nl-08 {
  letter-spacing: 0.08em;
}
</style>
