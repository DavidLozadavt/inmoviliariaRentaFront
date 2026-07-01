<script setup lang="ts">
import { ref, onMounted } from 'vue';
import lyraService from '../../../services/lyraService';
import { useAlerts } from '../../../composables/useAlerts';

const { success, error: showError } = useAlerts();

const config = ref({
  maintenance_message: '',
  confidence_threshold: 0.7,
  enabled_cities: [] as string[],
  enabled_intents: [] as string[],
  cache_ttl: 3600,
  debug_mode: false
});

const saving = ref(false);
const loading = ref(true);

const error = ref<string | null>(null);

const fetchConfig = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await lyraService.getConfig();
    config.value = { ...config.value, ...data };
  } catch (err) {
    console.error('Error fetching config:', err);
    error.value = 'Error al cargar la configuración.';
  } finally {
    loading.value = false;
  }
};

const saveConfig = async () => {
  saving.value = true;
  try {
    await lyraService.updateConfig(config.value);
    success('Configuración de Lyra guardada correctamente');
  } catch (err) {
    showError('Error al guardar la configuración');
  } finally {
    saving.value = false;
  }
};

const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Pereira', 'Manizales'];
const intents = [
  { id: 'buscar_propiedad', label: 'Búsqueda de propiedades' },
  { id: 'consulta_analitica', label: 'Análisis de mercado' },
  { id: 'saludo', label: 'Saludos y cortesía' },
  { id: 'fuera_de_contexto', label: 'Detección de fuera de contexto' },
  { id: 'recomendacion', label: 'Recomendaciones personalizadas' }
];

const toggleCity = (city: string) => {
  const index = config.value.enabled_cities.indexOf(city);
  if (index === -1) config.value.enabled_cities.push(city);
  else config.value.enabled_cities.splice(index, 1);
};

const toggleIntent = (id: string) => {
  const index = config.value.enabled_intents.indexOf(id);
  if (index === -1) config.value.enabled_intents.push(id);
  else config.value.enabled_intents.splice(index, 1);
};

onMounted(fetchConfig);
</script>

<template>
  <div class="lyra-settings">
    
    <div v-if="error" class="lyra-card error-state-full" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; padding: 3rem; gap: 1rem;">
      <font-awesome-icon :icon="['fas', 'triangle-exclamation']" style="font-size: 2rem; color: var(--danger);" />
      <p>{{ error }}</p>
      <button class="mini-btn" @click="fetchConfig">Reintentar</button>
    </div>

    <div v-else class="settings-grid">
      
      <!-- General Config -->
      <div class="lyra-card settings-card">
        <div class="lyra-card-header">
          <font-awesome-icon :icon="['fas', 'sliders-h']" />
          Comportamiento del Motor
        </div>
        
        <div class="form-group">
          <label>Mensaje de Mantenimiento</label>
          <p class="field-desc">Lo que los usuarios verán cuando Lyra esté en modo pausa.</p>
          <textarea 
            v-model="config.maintenance_message" 
            placeholder="Ej: Hola, estoy recibiendo mantenimiento ahora mismo. Estaré contigo pronto."
          ></textarea>
          <div class="preview-wrap">
            <span class="preview-label">Preview en Chat:</span>
            <div class="chat-preview">{{ config.maintenance_message || '...' }}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Umbral de Confianza NLP ({{ Math.round(config.confidence_threshold * 100) }}%)</label>
            <p class="field-desc">Si el score es menor, preguntaré clarificación.</p>
            <div class="slider-wrap">
              <span>0%</span>
              <input type="range" v-model.number="config.confidence_threshold" min="0" max="1" step="0.05" />
              <span>100%</span>
            </div>
          </div>
          
          <div class="form-group">
            <label>TTL del Caché (segundos)</label>
            <p class="field-desc">Tiempo de vida del contexto de usuario.</p>
            <input type="number" v-model.number="config.cache_ttl" />
          </div>
        </div>

        <div class="form-group toggle-group">
          <div class="toggle-content">
            <label>Modo DEBUG para Administradores</label>
            <p class="field-desc">Muestra detalles del pensamiento de Lyra en el chat (solo para admins).</p>
          </div>
          <button class="toggle-switch" :class="{ isActive: config.debug_mode }" @click="config.debug_mode = !config.debug_mode">
            <span class="switch-dot"></span>
          </button>
        </div>
      </div>

      <!-- Cities & Intents -->
      <div class="lyra-card list-config-card">
        <div class="lyra-card-header">
          <font-awesome-icon :icon="['fas', 'globe-americas']" />
          Ciudades Habilitadas
        </div>
        <div class="tag-list">
          <button 
            v-for="city in cities" 
            :key="city" 
            class="tag-item"
            :class="{ active: config.enabled_cities.includes(city) }"
            @click="toggleCity(city)"
          >
            {{ city }}
          </button>
          <!-- PENDING_ENDPOINT: POST /admin/lyra/config/cities — funcionalidad de agregar ciudad no implementada -->
          <button class="add-tag" style="opacity: 0.5; cursor: not-allowed">+ Agregar nueva (Próximamente)</button>
        </div>

        <div class="lyra-card-header section-header">
          <font-awesome-icon :icon="['fas', 'brain']" />
          Intents Activos en Producción
        </div>
        <div class="intent-checks">
          <div 
            v-for="intent in intents" 
            :key="intent.id" 
            class="intent-check-row"
            @click="toggleIntent(intent.id)"
          >
            <div class="check-box" :class="{ isChecked: config.enabled_intents.includes(intent.id) }">
              <font-awesome-icon :icon="['fas', 'check']" />
            </div>
            <div class="intent-check-meta">
              <span class="im-label">{{ intent.label }}</span>
              <span class="im-id">{{ intent.id }}</span>
            </div>
            <span class="intent-status-tag" :class="config.enabled_intents.includes(intent.id) ? 'tag-on' : 'tag-off'">
              {{ config.enabled_intents.includes(intent.id) ? 'ACTIVO' : 'PAUSADO' }}
            </span>
          </div>
        </div>
      </div>

    </div>

    <!-- Floating Action Bar -->
    <div class="settings-actions">
      <div class="actions-content">
        <p class="save-hint">
          <font-awesome-icon :icon="['fas', 'info-circle']" />
          Recomienda precaución: estos cambios afectan el núcleo de Lyra.
        </p>
        <div class="action-buttons">
          <button class="reset-btn" @click="fetchConfig">Descartar</button>
          <button class="save-btn" @click="saveConfig" :disabled="saving">
            <font-awesome-icon :icon="['fas', 'save']" v-if="!saving" />
            <font-awesome-icon :icon="['fas', 'spinner']" class="fa-spin" v-else />
            {{ saving ? 'Guardando...' : 'Aplicar Cambios' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.lyra-settings {
  padding-bottom: 6rem;
  animation: fadeIn 0.4s ease-out;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--white);
}

.field-desc {
  font-size: 0.8rem;
  color: var(--admin-text-secondary);
  margin-bottom: 0.25rem;
}

textarea {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--admin-border);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  min-height: 100px;
  outline: none;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s;
}

textarea:focus { border-color: var(--accent); background: rgba(0, 0, 0, 0.3); }

.preview-wrap {
  margin-top: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px dashed var(--admin-border);
}

.preview-label { font-size: 0.7rem; color: var(--admin-text-secondary); text-transform: uppercase; margin-bottom: 0.5rem; display: block; }
.chat-preview { font-size: 0.9rem; color: var(--white); opacity: 0.8; font-style: italic; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

input[type="number"] {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--admin-border);
  color: white;
  padding: 0.75rem;
  border-radius: 10px;
  outline: none;
}

.slider-wrap {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
  font-family: 'DM Mono', monospace;
  color: var(--admin-text-secondary);
}

input[type="range"] {
  flex: 1;
  accent-color: var(--accent);
}

.toggle-group {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: rgba(99, 102, 241, 0.05);
  padding: 1.25rem;
  border-radius: 16px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.toggle-switch {
  width: 50px;
  height: 26px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  border: none;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
}

.toggle-switch.isActive { background: var(--success); }

.switch-dot {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-switch.isActive .switch-dot { transform: translateX(24px); }

/* Lists Area */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.tag-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--admin-border);
  color: var(--admin-text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.tag-item.active { background: var(--accent); border-color: var(--accent); color: white; }

.add-tag {
  background: transparent;
  border: 1px dashed var(--admin-border);
  color: var(--accent);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.85rem;
  cursor: pointer;
}

.section-header { margin-top: 1rem; }

.intent-checks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.intent-check-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid var(--admin-border);
  cursor: pointer;
  transition: all 0.2s;
}

.intent-check-row:hover { background: rgba(255, 255, 255, 0.05); }

.check-box {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid var(--admin-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: transparent;
  transition: all 0.2s;
}

.check-box.isChecked { background: var(--success); border-color: var(--success); color: white; }

.intent-check-meta { flex: 1; display: flex; flex-direction: column; }
.im-label { font-size: 0.9rem; font-weight: 700; color: var(--white); }
.im-id { font-size: 0.7rem; color: var(--admin-text-secondary); font-family: 'DM Mono', monospace; }

.intent-status-tag { font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
.tag-on { color: var(--success); background: rgba(16, 185, 129, 0.1); }
.tag-off { color: var(--error); background: (239, 68, 68, 0.1); }

/* Sticky Footer */
.settings-actions {
  position: fixed;
  bottom: 1.5rem;
  left: 20rem; /* Adjusted for sidebar, assuming ~sidebar width */
  right: 2rem;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 20px;
  padding: 1.25rem 2rem;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
  z-index: 500;
}

.actions-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.save-hint { font-size: 0.85rem; color: var(--admin-text-secondary); display: flex; align-items: center; gap: 0.75rem; }
.save-hint i { color: var(--warning); }

.action-buttons { display: flex; gap: 1rem; }

.reset-btn {
  background: transparent;
  border: 1px solid var(--admin-border);
  color: var(--admin-text-secondary);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
}

.save-btn {
  background: var(--accent);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 12px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.save-btn:hover { background: #4f46e5; transform: translateY(-2px); }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
