<template>
  <div class="auth-layout">
    <slot />
  </div>
</template>

<script setup lang="ts">
// AuthLayout: minimal wrapper for login, register, reset-password views.
// No NavBar or Footer — keeps the auth flow distraction-free.
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
