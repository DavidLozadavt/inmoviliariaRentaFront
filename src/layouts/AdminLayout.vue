<template>
  <div class="admin-layout">
    <!-- Admin Sidebar -->
    <aside class="admin-layout__sidebar" :class="{ 'is-collapsed': sidebarCollapsed }">
      <slot name="sidebar" />
    </aside>

    <!-- Admin Main Content -->
    <div class="admin-layout__content">
      <!-- Admin Topbar -->
      <header class="admin-layout__topbar">
        <button
          class="admin-layout__toggle"
          type="button"
          :aria-label="sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <font-awesome-icon :icon="sidebarCollapsed ? 'chevron-right' : 'chevron-left'" aria-hidden="true" />
        </button>
        <slot name="topbar" />
      </header>

      <!-- Page content -->
      <main class="admin-layout__main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const sidebarCollapsed = ref(false);
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
}

.admin-layout__sidebar {
  width: 260px;
  flex-shrink: 0;
  transition: width 0.25s ease;
  background: #1e1b4b;
  color: #ffffff;
}

.admin-layout__sidebar.is-collapsed {
  width: 68px;
  overflow: hidden;
}

.admin-layout__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-layout__topbar {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1.5rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.admin-layout__toggle {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.15s ease;
  border: none;
  background: none;
}

.admin-layout__toggle:hover {
  background: #f3f4f6;
  color: #111827;
}

.admin-layout__main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  .admin-layout__sidebar {
    width: 100%;
    height: auto;
  }
}
</style>
