<template>
  <Teleport to="body">
    <Transition name="admin-modal-fade">
      <div v-if="modelValue" class="admin-modal-overlay" @click.self="close">
        <Transition name="admin-modal-scale" appear>
          <div v-if="modelValue" class="admin-modal" :style="{ maxWidth: maxWidth }">
            
            <!-- Modal Header -->
            <div class="admin-modal__header">
              <div class="admin-modal__title-wrapper">
                <div v-if="icon" class="admin-modal__icon">
                  <font-awesome-icon :icon="icon" />
                </div>
                <div>
                  <h2 class="admin-modal__title">{{ title }}</h2>
                  <p v-if="subtitle" class="admin-modal__subtitle">{{ subtitle }}</p>
                </div>
              </div>
              <div class="admin-modal__header-actions">
                <slot name="header-extra"></slot>
                <button class="admin-modal__close-btn" @click="close" aria-label="Close">
                  <font-awesome-icon :icon="['fas', 'times']" />
                </button>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="admin-modal__body">
              <slot></slot>
            </div>

            <!-- Modal Footer -->
            <div v-if="$slots.footer" class="admin-modal__footer">
              <slot name="footer"></slot>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  icon: { type: Array as () => string[], default: null },
  maxWidth: { type: String, default: '600px' }
});

const emit = defineEmits(['update:modelValue', 'close']);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<style>
/* Global CSS for the Admin Modal transitions */
.admin-modal-fade-enter-active,
.admin-modal-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.admin-modal-fade-enter-from,
.admin-modal-fade-leave-to {
  opacity: 0;
}

.admin-modal-scale-enter-active,
.admin-modal-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.admin-modal-scale-enter-from,
.admin-modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>

<style scoped>
/* Scoped Premium modal styles */
.admin-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

:global(body.dark-mode) .admin-modal-overlay {
  background-color: rgba(0, 0, 0, 0.75);
}

.admin-modal {
  width: 100%;
  background-color: var(--admin-surface, #ffffff);
  border-radius: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 3rem);
  overflow: hidden;
  border: 1px solid var(--admin-border, #e2e8f0);
}

:global(body.dark-mode) .admin-modal {
  background-color: var(--admin-surface, #1e293b);
  border-color: var(--admin-border, #334155);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.admin-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--admin-border, #e2e8f0);
  background: var(--admin-surface-elevated, #f8fafc);
}

:global(body.dark-mode) .admin-modal__header {
  background: var(--admin-surface-elevated, #0f172a);
}

.admin-modal__title-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.admin-modal__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--accent, #6366f1), #818cf8);
  color: #ffffff;
  font-size: 1.25rem;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
  flex-shrink: 0;
}

:global(body.dark-mode) .admin-modal__icon {
  background: linear-gradient(135deg, var(--accent, #6366f1), #4f46e5);
}

.admin-modal__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--admin-text-primary, #0f172a);
  line-height: 1.2;
}

.admin-modal__subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--admin-text-muted, #64748b);
}

.admin-modal__header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.admin-modal__close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--admin-text-muted, #64748b);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.admin-modal__close-btn:hover {
  background: var(--admin-surface-hover, #e2e8f0);
  color: var(--admin-text-primary, #0f172a);
  transform: rotate(90deg);
}

:global(body.dark-mode) .admin-modal__close-btn:hover {
  background: var(--admin-surface-hover, #334155);
}

.admin-modal__body {
  padding: 2rem;
  overflow-y: auto;
  color: var(--admin-text-secondary, #334155);
  font-size: 0.95rem;
  line-height: 1.6;
}

:global(body.dark-mode) .admin-modal__body {
  color: var(--admin-text-secondary, #cbd5e1);
}

.admin-modal__body::-webkit-scrollbar {
  width: 6px;
}
.admin-modal__body::-webkit-scrollbar-track {
  background: transparent;
}
.admin-modal__body::-webkit-scrollbar-thumb {
  background: var(--admin-border, #cbd5e1);
  border-radius: 10px;
}

:global(body.dark-mode) .admin-modal__body::-webkit-scrollbar-thumb {
  background: var(--admin-border, #475569);
}

.admin-modal__footer {
  padding: 1.25rem 2rem;
  border-top: 1px solid var(--admin-border, #e2e8f0);
  background: var(--admin-surface-elevated, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

:global(body.dark-mode) .admin-modal__footer {
  background: var(--admin-surface-elevated, #0f172a);
}

@media (max-width: 640px) {
  .admin-modal-overlay {
    padding: 1rem;
    align-items: flex-end;
  }
  .admin-modal {
    max-height: calc(100vh - 2rem);
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .admin-modal__header {
    padding: 1.25rem 1.5rem;
  }
  .admin-modal__body {
    padding: 1.5rem;
  }
  .admin-modal__footer {
    padding: 1.25rem 1.5rem;
    flex-direction: column-reverse;
  }
  .admin-modal__footer > * {
    width: 100%;
    justify-content: center;
  }
}
</style>
