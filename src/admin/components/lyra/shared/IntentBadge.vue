<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  intent: string;
}

const props = defineProps<Props>();

const intentConfig = computed(() => {
  const map: Record<string, { label: string; icon: string; color: string }> = {
    buscar_propiedad:   { label: 'Búsqueda', icon: 'search', color: '#6366f1' },
    refinar_busqueda:   { label: 'Refinar', icon: 'filter', color: '#06b6d4' },
    consulta_analitica: { label: 'Analítica', icon: 'chart-bar', color: '#10b981' },
    saludo:             { label: 'Saludo', icon: 'hand-sparkles', color: '#f59e0b' },
    fuera_de_contexto:  { label: 'Fuera de', icon: 'ban', color: '#ef4444' },
    recomendacion:      { label: 'Recomendar', icon: 'star', color: '#8b5cf6' },
    ayuda:              { label: 'Ayuda', icon: 'question-circle', color: '#6b7280' },
  };
  return map[props.intent] || { label: props.intent, icon: 'comment', color: '#6b7280' };
});
</script>

<template>
  <span 
    class="intent-badge" 
    :style="{ backgroundColor: `${intentConfig.color}15`, color: intentConfig.color, border: `1px solid ${intentConfig.color}40` }"
  >
    <font-awesome-icon :icon="['fas', intentConfig.icon]" />
    {{ intentConfig.label }}
  </span>
</template>

<style scoped>
.intent-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
</style>
