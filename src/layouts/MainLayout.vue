<!-- src/layouts/MainLayout.vue -->
<template>
  <div class="main-layout">
    <NavBarComponent />

    <main class="content">
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
import FooterComponent from '../components/FooterComponent.vue';
import NavBarComponent from '../components/NavBarComponent.vue';
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