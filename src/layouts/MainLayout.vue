<!-- src/layouts/MainLayout.vue -->
<template>
  <div class="main-layout">
    <ScrollExtras />
    <NavBarComponent />

    <main ref="content" class="content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <FooterComponent />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import FooterComponent from '../components/FooterComponent.vue'
import NavBarComponent from '../components/NavBarComponent.vue'
import ScrollExtras from '../components/ui/ScrollExtras.vue'
import { autoReveal } from '../directives/reveal'

// Tarjetas y bloques que aparecen suavemente al hacer scroll en todo el sitio
const REVEAL = '.property-card, .pd-card, .v3d-section, .item, .box, .group, .step, .feature-card, .faq-item, .team-card, section > h2'
const content = ref(null)
let stop = null
onMounted(() => { if (content.value) stop = autoReveal(content.value, REVEAL) })
onBeforeUnmount(() => stop && stop())
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  flex: 1;
}
</style>
