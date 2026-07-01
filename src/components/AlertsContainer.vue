<template>
  <Teleport to="body">
    <div class="alerts-container">
      <TransitionGroup name="alert-stack">
        <div v-for="(alert, index) in alerts" :key="alert.id" :class="['alert', `alert-${alert.type}`]"
          :style="getAlertStyle(index)" @mouseenter="pauseAlert(alert.id)" @mouseleave="resumeAlert(alert.id)">
          <!-- Efecto de brillo animado -->
          <div class="alert-shine"></div>

          <!-- Contenido principal -->
          <div class="alert-main">
            <!-- Ícono animado -->
            <div class="alert-icon-wrapper">
              <div class="icon-container">
                <FontAwesomeIcon :icon="getIconComponent(alert.type).icon" class="icon" />
              </div>
              <div class="icon-glow"></div>
            </div>

            <!-- Contenido de texto -->
            <div class="alert-content">
              <h4 v-if="alert.title" class="alert-title">{{ alert.title }}</h4>
              <p class="alert-message">{{ alert.message }}</p>
            </div>

            <!-- Botón cerrar (Solo si no es de confirmación) -->
            <button v-if="alert.type !== 'confirm' && alert.type !== 'danger'" @click="removeAlert(alert.id)" class="alert-close"
              aria-label="Cerrar alerta">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>

          </div>

          <!-- Barra de progreso -->
          <div v-if="showTimer(alert)" class="alert-progress"
            :style="{ animationDuration: `${alert.duration || 4000}ms` }"></div>

          <!-- Botones de confirmación -->
          <div v-if="alert.type === 'confirm' || alert.type === 'danger'" class="alert-actions">
            <button @click="handleAction(alert, 'cancel')" class="btn-cancel">
              {{ alert.cancelText || 'Cancelar' }}
            </button>
            <button @click="handleAction(alert, 'confirm')" class="btn-confirm">
              {{ alert.confirmText || 'Confirmar' }}
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useAlerts } from '../composables/useAlerts'
import type { Alert } from '../composables/useAlerts'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCheckCircle, faTimesCircle, faExclamationTriangle, faInfoCircle, faQuestionCircle, faTrash } from '@fortawesome/free-solid-svg-icons'

type IconType = "success" | "error" | "warning" | "info" | "confirm" | "danger";

const { alerts, remove } = useAlerts()

// Funciones optimizadas
const getAlertStyle = (index: number) => ({
  transform: `translateY(${index * -8}px)`,
  zIndex: 9999 - index,
  opacity: Math.max(0.3, 1 - index * 0.2)
})

const showTimer = (alert: Alert) => alert.type !== 'confirm' && alert.duration !== 0

const getIconComponent = (type: IconType) => {
  const icons: Record<IconType, { component: any; icon: any }> = {
    success: { component: FontAwesomeIcon, icon: faCheckCircle },
    error: { component: FontAwesomeIcon, icon: faTimesCircle },
    warning: { component: FontAwesomeIcon, icon: faExclamationTriangle },
    info: { component: FontAwesomeIcon, icon: faInfoCircle },
    confirm: { component: FontAwesomeIcon, icon: faQuestionCircle },
    danger: { component: FontAwesomeIcon, icon: faTrash }, 
  };
  return icons[type]
}

const handleAction = (alert: Alert, action: 'confirm' | 'cancel') => {
  if (action === 'confirm') {
    alert.onConfirm?.()
  } else {
    alert.onCancel?.()
  }
  removeAlert(alert.id)
}

const removeAlert = (id: string) => {
  remove(id)
}

const pauseAlert = (id: string) => {
  const alerts = document.querySelectorAll('.alert')
  alerts.forEach(alertEl => {
    if (alertEl.querySelector(`[data-id="${id}"]`)) {
      const progress = alertEl.querySelector('.alert-progress') as HTMLElement
      if (progress) progress.style.animationPlayState = 'paused'
    }
  })
}

const resumeAlert = (id: string) => {
  const alerts = document.querySelectorAll('.alert')
  alerts.forEach(alertEl => {
    if (alertEl.querySelector(`[data-id="${id}"]`)) {
      const progress = alertEl.querySelector('.alert-progress') as HTMLElement
      if (progress) progress.style.animationPlayState = 'running'
    }
  })
}
</script>

<style scoped>
@import "../assets/css/components/AlertsContainer.css";
</style>