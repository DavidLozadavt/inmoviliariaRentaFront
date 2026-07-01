<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  intent: any;
  propertiesFound?: number;
}

const props = defineProps<Props>();

const metrics = computed(() => [
  { label: 'Intent principal', value: props.intent.intent, class: 'tk-val-intent' },
  { label: 'Confianza', value: `${(props.intent.confidence * 100).toFixed(1)}%`, class: props.intent.confidence > 0.8 ? 'tk-val-ok' : 'tk-val-low' },
  { label: 'Ciudad detectada', value: props.intent.city || '—', show: true },
  { label: 'Tipo propiedad', value: props.intent.property_type || '—', show: !!props.intent.property_type },
  { label: 'Presupuesto máx', value: props.intent.max_price ? `$${Number(props.intent.max_price).toLocaleString()}` : '—', show: !!props.intent.max_price },
  { label: 'Dormitorios', value: props.intent.bedrooms || '—', show: !!props.intent.bedrooms },
  { label: 'Barrio/Zona', value: props.intent.neighborhood || '—', show: !!props.intent.neighborhood },
  { label: 'Resultados DB', value: props.propertiesFound !== undefined ? `${props.propertiesFound} propiedades` : '—', class: 'tk-val-results' }
]);
</script>

<template>
  <div class="thinking-panel">
    <div class="thinking-grid">
      <div 
        v-for="m in metrics" 
        :key="m.label" 
        class="thinking-row" 
        v-show="m.show !== false"
      >
        <span class="tk-label">{{ m.label }}</span>
        <span class="tk-val" :class="m.class">{{ m.value }}</span>
      </div>
    </div>
    
    <div class="thinking-entities" v-if="intent.raw_entities">
      <p class="entities-title">Entidades Crudas (Regex/NLP)</p>
      <div class="entities-list">
        <div v-for="(val, key) in intent.raw_entities" :key="key" class="entity-item">
          <span class="entity-key">{{ key }}</span>
          <span class="entity-val">{{ val }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thinking-panel {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 0.5rem;
  font-family: 'DM Mono', monospace;
  font-size: 0.8rem;
  color: var(--admin-text-secondary);
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.2);
}

.thinking-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.thinking-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
  padding-bottom: 0.25rem;
}

.tk-label {
  color: var(--admin-text-secondary);
}

.tk-val {
  color: var(--white);
  font-weight: 500;
}

.tk-val-intent {
  color: var(--accent);
  text-transform: uppercase;
  font-weight: 700;
}

.tk-val-ok { color: var(--success); }
.tk-val-low { color: var(--warning); }
.tk-val-results { color: #818cf8; }

.thinking-entities {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 0.75rem;
}

.entities-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  opacity: 0.6;
}

.entities-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.entity-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.entity-key {
  color: var(--accent);
  margin-right: 0.5rem;
}

.entity-val {
  color: var(--white);
}
</style>
