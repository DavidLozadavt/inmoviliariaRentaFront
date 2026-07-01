<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LyraHeader from '../components/lyra/LyraHeader.vue';
import LyraDashboard from '../components/lyra/LyraDashboard.vue';
import LyraConversations from '../components/lyra/LyraConversations.vue';
import LyraVersions from '../components/lyra/LyraVersions.vue';
import LyraHealth from '../components/lyra/LyraHealth.vue';
import LyraSettings from '../components/lyra/LyraSettings.vue';

import { useLyraAlerts } from '../composables/useLyraAlerts';

// Tabs management
const activeTab = ref('dashboard');
const { pendingAlerts, markAsRead } = useLyraAlerts();

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart-pie' },
  { id: 'conversations', label: 'Conversaciones', icon: 'comments' },
  { id: 'versions', label: 'Versiones', icon: 'code-branch' },
  { id: 'health', label: 'Salud del Sistema', icon: 'heartbeat' },
  { id: 'settings', label: 'Configuración', icon: 'cog' }
];

onMounted(() => {
  // Check URL hash for tab
  const hash = window.location.hash.replace('#', '');
  if (tabs.find(t => t.id === hash)) {
    activeTab.value = hash;
  }
});

const changeTab = (id: string) => {
  activeTab.value = id;
  window.location.hash = id;
};

</script>

<template>
  <div class="lyra-admin-container">
    <!-- Header -->
    <LyraHeader />

    <!-- Admin Alerts Banner -->
    <transition-group name="alert-slide">
      <div 
        v-for="alert in pendingAlerts" 
        :key="alert.id" 
        class="admin-alert-banner"
      >
        <div class="alert-content">
          <font-awesome-icon :icon="['fas', 'exclamation-triangle']" class="alert-icon" />
          <span class="alert-message">{{ alert.message }}</span>
          <span class="alert-time">{{ new Date(alert.created_at).toLocaleTimeString() }}</span>
        </div>
        <button class="alert-close" @click="markAsRead(alert.id)">
          Entendido
        </button>
      </div>
    </transition-group>

    <!-- Tabs Navigation -->
    <nav class="lyra-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="changeTab(tab.id)"
      >
        <font-awesome-icon :icon="['fas', tab.icon]" />
        {{ tab.label }}
      </button>
    </nav>

    <!-- Content Area -->
    <div class="lyra-content">
      <transition name="tab-fade" mode="out-in">
        <div :key="activeTab" class="tab-pane">
          <LyraDashboard v-if="activeTab === 'dashboard'" />
          <LyraConversations v-if="activeTab === 'conversations'" />
          <LyraVersions v-if="activeTab === 'versions'" />
          <LyraHealth v-if="activeTab === 'health'" />
          <LyraSettings v-if="activeTab === 'settings'" />
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700;800&display=swap');

.lyra-admin-container {
  font-family: 'DM Sans', sans-serif;
  color: var(--white);
  padding: 0.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

.lyra-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  margin-bottom: 2rem;
  border: 1px solid var(--admin-border);
  backdrop-filter: blur(10px);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border: none;
  background: transparent;
  color: var(--admin-text-secondary);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--white);
}

.tab-btn.active {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.lyra-content {
  position: relative;
  min-height: 600px;
}

/* Admin Alert Banner */
.admin-alert-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: linear-gradient(90deg, #f43f5e, #e11d48);
  border-radius: 12px;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);
  animation: pulse-border 2s infinite;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.alert-icon {
  font-size: 1.25rem;
  color: white;
}

.alert-message {
  font-weight: 600;
  color: white;
}

.alert-time {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.alert-close {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.alert-close:hover {
  background: white;
  color: #e11d48;
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(225, 29, 72, 0); }
  100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
}

/* Transitions */
.alert-slide-enter-active,
.alert-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-slide-enter-from,
.alert-slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Shared styles for all tabs */
:deep(.lyra-card) {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 20px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

:deep(.lyra-card-header) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--white);
}

:deep(.lyra-card-header i), 
:deep(.lyra-card-header .fa-icon) {
  color: var(--accent);
}
</style>