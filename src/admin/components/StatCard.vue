<template>
  <div class="stat-card" :class="[variant, { loading }]">
    <div class="stat-content">
      <!-- Icon -->
      <div class="stat-icon" :style="{ background: iconBg }">
        <font-awesome-icon v-if="isFontAwesome" :icon="icon as [string, string]" class="fa-icon" />

        <span v-else class="icon-emoji">
          {{ icon }}
        </span>

      </div>

      <!-- Info -->
      <div class="stat-info">
        <p class="stat-label">{{ label }}</p>
        <div class="stat-value-container">
          <h3 class="stat-value">{{ formattedValue }}</h3>
          <div v-if="change !== undefined" class="stat-change" :class="changeType">
            <span class="change-icon">{{ changeIcon }}</span>
            <span class="change-value">{{ Math.abs(change) }}%</span>
          </div>
        </div>
        <p v-if="subtitle" class="stat-subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <!-- Progress Bar (optional) -->
    <div v-if="progress !== undefined" class="stat-progress">
      <div class="progress-bar" :style="{ width: `${progress}%`, background: progressColor }"></div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <!-- Hover Effect -->
    <div class="card-glow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string;
  value: number | string;
  icon: string | [string, string];
  iconBg?: string;
  change?: number;
  subtitle?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  progress?: number;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  iconBg: 'linear-gradient(135deg, #3b251d 0%, #8b6f47 100%)',
  variant: 'default',
  loading: false,
});

// Detectar si el icono es de Font Awesome
const isFontAwesome = computed(() => Array.isArray(props.icon));


// Formatear valor
const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    // Si es un número grande, formatearlo con separadores de miles
    if (props.value >= 1000) {
      return props.value.toLocaleString('es-ES');
    }
    return props.value.toString();
  }
  return props.value;
});

// Tipo de cambio (positivo/negativo)
const changeType = computed(() => {
  if (props.change === undefined || props.change === null) return '';
  
  // Convertir a número si es string
  const changeValue = typeof props.change === 'string' 
    ? parseFloat(props.change) 
    : props.change;
  
  if (changeValue >= 0 || changeValue > -10) {
    return 'positive';
  }
  
  return 'negative';
});

// Icono de cambio
const changeIcon = computed(() => {
  if (props.change === undefined) return '';
  
  if (props.change >= 0 || props.change > -10) {
    return '↗';
  }
  
  return '↘';
});

// Color de la barra de progreso
const progressColor = computed(() => {
  const colors: Record<string, string> = {
    default: 'linear-gradient(90deg, #3b251d 0%, #8b6f47 100%)',
    primary: 'linear-gradient(90deg, #3b86f7 0%, #1e40af 100%)',
    success: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
    danger: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
    info: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)',
  };
  return colors[props.variant] || colors.default;
});
</script>

<style scoped>
.stat-card {
  position: relative;
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  border-color: #d1d5db;
}

.stat-card.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Variants */
.stat-card.primary {
  border-color: rgba(59, 134, 247, 0.2);
}

.stat-card.success {
  border-color: rgba(16, 185, 129, 0.2);
}

.stat-card.warning {
  border-color: rgba(245, 158, 11, 0.2);
}

.stat-card.danger {
  border-color: rgba(239, 68, 68, 0.2);
}

.stat-card.info {
  border-color: rgba(6, 182, 212, 0.2);
}

/* Content */
.stat-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

/* Icon */
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 37, 29, 0.15);
  transition: transform 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}

.icon-emoji {
  font-size: 1.75rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* Info */
.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value-container {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 900;
  color: #1f2937;
  margin: 0;
  line-height: 1;
  letter-spacing: -1px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.6rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
}

.stat-change.positive {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.stat-change.negative {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.change-icon {
  font-size: 1rem;
}

.stat-subtitle {
  font-size: 0.85rem;
  color: #9ca3af;
  margin: 0;
  font-weight: 500;
}

/* Progress Bar */
.stat-progress {
  margin-top: 1rem;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b251d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Glow Effect */
.card-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #3b251d, #8b6f47);
  opacity: 0;
  border-radius: 16px;
  transition: opacity 0.3s ease;
  z-index: -1;
  filter: blur(20px);
}

.stat-card:hover .card-glow {
  opacity: 0.15;
}

/* Responsive */
@media (max-width: 768px) {
  .stat-card {
    padding: 1.25rem;
  }

  .stat-content {
    gap: 0.75rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }

  .icon-emoji {
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .stat-label {
    font-size: 0.8rem;
  }
}

@media (max-width: 576px) {
  .stat-value-container {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .stat-change {
    align-self: flex-start;
  }
}
</style>
