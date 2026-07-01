// composables/useAlerts.ts
import { ref, computed } from 'vue'

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'danger'

export interface Alert {
  id: string
  type: AlertType
  title?: string
  message: string
  duration?: number
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

const alerts = ref<Alert[]>([])
const maxAlerts = 3 // Máximo de alertas visibles al mismo tiempo
let alertIdCounter = 0

export function useAlerts() {
  const show = (options: Omit<Alert, 'id'>) => {
    // Si es tipo confirm, solo permitir una a la vez
    if (options.type === 'confirm') {
      const existingConfirm = alerts.value.find(a => a.type === 'confirm')
      if (existingConfirm) {
        return existingConfirm.id
      }
    }

    // Verificar si ya existe una alerta similar (mismo tipo y mensaje)
    const duplicate = alerts.value.find(
      a => a.type === options.type && a.message === options.message
    )

    if (duplicate) {
      // Si existe, no crear una nueva, solo resetear su duración
      return duplicate.id
    }

    const id = `alert-${alertIdCounter++}`
    const alert: Alert = { id, ...options }

    // Si hay demasiadas alertas, remover la más antigua (que no sea confirm)
    if (alerts.value.length >= maxAlerts) {
      const nonConfirmAlerts = alerts.value.filter(a => a.type !== 'confirm')
      if (nonConfirmAlerts.length > 0) {
        remove(nonConfirmAlerts[0].id)
      }
    }

    alerts.value.push(alert)

    // Auto-remove después de duration (si no es confirmación)
    if (options.type !== 'confirm' && options.duration !== 0) {
      const duration = options.duration || 4000
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  const remove = (id: string) => {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index !== -1) {
      alerts.value.splice(index, 1)
    }
  }

  const success = (message: string, title?: string, duration?: number) => {
    return show({ type: 'success', message, title, duration })
  }

  const error = (message: string, title?: string, duration?: number) => {
    return show({ type: 'error', message, title, duration })
  }

  const warning = (message: string, title?: string, duration?: number) => {
    return show({ type: 'warning', message, title, duration })
  }

  const info = (message: string, title?: string, duration?: number) => {
    return show({ type: 'info', message, title, duration })
  }

  const confirm = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: {
      title?: string
      confirmText?: string
      cancelText?: string
    }
  ) => {
    return show({
      type: 'confirm',
      message,
      title: options?.title,
      confirmText: options?.confirmText || 'Confirmar',
      cancelText: options?.cancelText || 'Cancelar',
      onConfirm,
      onCancel,
      duration: 0
    })
  }

  const danger = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: {
      title?: string
      confirmText?: string
      cancelText?: string
    }
  ) => {
    return show({
      type: 'danger',
      message,
      title: options?.title,
      confirmText: options?.confirmText || 'Eliminar',
      cancelText: options?.cancelText || 'Cancelar',
      onConfirm,
      onCancel,
      duration: 0
    })
  }

  const clear = () => {
    alerts.value = []
  }

  return {
    alerts: computed(() => alerts.value),
    show,
    remove,
    success,
    error,
    warning,
    info,
    confirm,
    danger,
    clear
  }
}