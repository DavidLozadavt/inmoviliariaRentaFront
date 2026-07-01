<script setup lang="ts">
import { ref } from 'vue';
import ThinkingPanel from './ThinkingPanel.vue';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  intent?: any;
  timestamp: string;
  propertiesFound?: number;
}

defineProps<Props>();
const showThinking = ref(false);

const formatTime = (time: string) => {
  return new Date(time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
  <div class="chat-message" :class="`msg-${role}`">
    <div class="msg-avatar" v-if="role === 'assistant'">L</div>
    
    <div class="msg-content">
      <div class="msg-bubble">
        <p>{{ content }}</p>
        <span class="msg-time">{{ formatTime(timestamp) }}</span>
      </div>
      
      <!-- Special UI for properties links (if any) -->
      <div class="properties-links" v-if="propertiesFound && propertiesFound > 0">
        <button class="view-listings-btn">
          <font-awesome-icon :icon="['fas', 'external-link-alt']" />
          Ver {{ propertiesFound }} propiedades
        </button>
      </div>

      <!-- Thinking Toggle -->
      <div class="msg-thinking-wrap" v-if="intent">
        <button class="thinking-toggle" @click="showThinking = !showThinking" :class="{ active: showThinking }">
          <font-awesome-icon :icon="['fas', 'brain']" />
          Proceso Interno
          <font-awesome-icon :icon="['fas', showThinking ? 'chevron-up' : 'chevron-down']" />
        </button>
        
        <transition name="expand">
          <ThinkingPanel v-if="showThinking" :intent="intent" :propertiesFound="propertiesFound" />
        </transition>
      </div>
    </div>
    
    <div class="msg-avatar msg-avatar-user" v-if="role === 'user'">
      <font-awesome-icon :icon="['fas', 'user']" />
    </div>
  </div>
</template>

<style scoped>
.chat-message {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  max-width: 85%;
}

.msg-assistant {
  align-self: flex-start;
}

.msg-user {
  align-self: flex-end;
  flex-direction: row;
}

.msg-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.msg-avatar-user {
  background: var(--admin-border);
  color: var(--admin-text-secondary);
}

.msg-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.msg-bubble {
  padding: 1rem 1.25rem;
  border-radius: 18px;
  position: relative;
  font-size: 0.95rem;
  line-height: 1.5;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.msg-assistant .msg-bubble {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  color: #ffffff;
  border-top-left-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

:global(.dark-admin) .msg-assistant .msg-bubble {
  background: #4f46e5;
  color: #fff;
}


.msg-user .msg-bubble {
  background: #4f46e5;
  color: rgb(255, 255, 255);
  border-top-right-radius: 4px;
}

.msg-time {
  font-size: 0.7rem;
  opacity: 0.6;
  position: absolute;
  bottom: -1.2rem;
}

.msg-assistant .msg-time { left: 4px; }
.msg-user .msg-time { right: 4px; }

.properties-links {
  margin: 0.5rem 0;
}

.view-listings-btn {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.view-listings-btn:hover {
  background: var(--success);
  color: white;
}

.thinking-toggle {
  background: transparent;
  border: none;
  color: var(--admin-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  transition: color 0.2s;
}

.thinking-toggle:hover, .thinking-toggle.active {
  color: var(--accent);
}

/* Animations */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 500px;
  overflow: hidden;
}

.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}
</style>
