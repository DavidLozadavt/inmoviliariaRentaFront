<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLyraVersions } from '../../composables/useLyraVersions';
import VersionTimeline from './shared/VersionTimeline.vue';

const { 
  versions, currentVersion, loadingVersions, rollback, performingRollback,
  showCreateModal, createVersion, creatingVersion 
} = useLyraVersions();

const showRollbackModal = ref(false);
const selectedVersion = ref<any>(null);

// MODIFIED: estado del formulario de nueva versión
const newVersion = ref({
    version: '',
    changelog: '',
    activate: true,
    metrics: { success_rate: null as number | null, avg_response_ms: null as number | null }
})

const versionError = ref('')

const confirmRollback = (version: any) => {
  selectedVersion.value = version;
  showRollbackModal.value = true;
};

const executeRollback = async () => {
  if (selectedVersion.value) {
    await rollback(selectedVersion.value.id);
    showRollbackModal.value = false;
  }
};

const submitNewVersion = async () => {
    // Validar formato
    versionError.value = ''
    if (!/^v\d+\.\d+(\.\d+)?$/.test(newVersion.value.version)) {
        versionError.value = 'Formato inválido. Usa v2.2.0'
        return
    }

    await createVersion({
        version:   newVersion.value.version,
        changelog: newVersion.value.changelog,
        activate:  newVersion.value.activate,
        metrics: {
            success_rate:    newVersion.value.metrics.success_rate ?? undefined,
            avg_response_ms: newVersion.value.metrics.avg_response_ms ?? undefined,
        }
    })

    // Limpiar formulario si fue exitoso
    newVersion.value = { version: '', changelog: '', activate: true, metrics: { success_rate: null, avg_response_ms: null } }
}

const currentVersionData = computed(() => {
  return versions.value.find(v => v.version === currentVersion.value);
});
</script>

<template>
  <div class="lyra-versions">
    
    <!-- Hero Stats for Versions -->
    <div class="versions-hero">
      <div class="current-version-card">
        <div class="v-card-glow"></div>
        <div class="v-card-content">
          <span class="v-label">Versión Actual en Producción</span>
          <div class="v-main">
            <h1 class="v-number">{{ currentVersion || 'v2.1.3' }}</h1>
            <span class="v-badge v-badge-stable">ESTABLE</span>
          </div>
          <div class="v-meta">
            <span>
              <font-awesome-icon :icon="['fas', 'calendar-check']" />
              Desplegada el {{ currentVersionData ? new Date(currentVersionData.deployed_at).toLocaleDateString() : '—' }}
            </span>
            <span>
              <font-awesome-icon :icon="['fas', 'user-shield']" />
              Por: {{ currentVersionData?.deployed_by || 'Admin' }}
            </span>
          </div>
        </div>
      </div>

      <div class="version-stats-grid">
        <div class="v-mini-card">
          <span class="vm-label">Tasa de Éxito NLP</span>
          <span class="vm-val">{{ currentVersionData?.metrics?.success_rate || 87.5 }}%</span>
          <div class="vm-trend trend-up">+1.2% vs v2.0</div>
        </div>
        <div class="v-mini-card">
          <span class="vm-label">Intents Totales</span>
          <span class="vm-val">{{ (currentVersionData?.metrics as any)?.total_intents || 42 }}</span>
          <div class="vm-trend">7 nuevos en esta versión</div>
        </div>
      </div>
    </div>

    <!-- Timeline Area -->
    <div class="timeline-container lyra-card">
      <div class="lyra-card-header">
        <div class="header-left">
          <font-awesome-icon :icon="['fas', 'history']" />
          Historial de Despliegues y Cambios
        </div>
        <button class="btn-new-version" @click="showCreateModal = true">
          <font-awesome-icon :icon="['fas', 'plus']" />
          Nueva Versión
        </button>
      </div>
      
      <div v-if="loadingVersions" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando historial de versiones...</p>
      </div>

      <VersionTimeline 
        v-else
        :versions="versions" 
        :currentVersion="currentVersion ?? undefined" 
        @rollback="confirmRollback"
      />
    </div>

    <!-- Rollback Confirmation Modal -->
    <transition name="modal-fade">
      <div class="rollback-modal-overlay" v-if="showRollbackModal" @click.self="showRollbackModal = false">
        <div class="rollback-modal">
          <div class="modal-header">
            <div class="modal-warn-icon">
              <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
            </div>
            <h2>Confirmar Rollback</h2>
          </div>
          <div class="modal-body">
            <p>Estás a punto de revertir Lyra a la versión <strong>{{ selectedVersion?.version }}</strong>.</p>
            <div class="rollback-diff">
              <div class="diff-side">
                <span class="diff-label">Versión Actual</span>
                <span class="diff-val">{{ currentVersion }}</span>
              </div>
              <div class="diff-separator">
                <font-awesome-icon :icon="['fas', 'arrow-right']" />
              </div>
              <div class="diff-side">
                <span class="diff-label">Nueva Versión</span>
                <span class="diff-val">{{ selectedVersion?.version }}</span>
              </div>
            </div>
            <p class="modal-desc">Este cambio afectará a todos los usuarios en tiempo real. Los modelos NLP locales se recargarán con la configuración de dicha versión.</p>
          </div>
          <div class="modal-footer">
            <button class="modal-btn-cancel" @click="showRollbackModal = false" :disabled="performingRollback">Cancelar</button>
            <button class="modal-btn-confirm" @click="executeRollback" :disabled="performingRollback">
              <font-awesome-icon :icon="['fas', 'history']" v-if="!performingRollback" />
              <font-awesome-icon :icon="['fas', 'spinner']" class="fa-spin" v-else />
              {{ performingRollback ? 'Ejecutando...' : 'Confirmar Reversión' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal: Nueva Versión -->
    <transition name="modal-fade">
        <div class="rollback-modal-overlay" v-if="showCreateModal" @click.self="showCreateModal = false">
            <div class="rollback-modal create-modal">
                <div class="modal-header">
                    <div class="modal-icon-create">
                        <font-awesome-icon :icon="['fas', 'rocket']" />
                    </div>
                    <h2>Registrar Nueva Versión</h2>
                </div>

                <div class="modal-body">
                    <!-- Número de versión -->
                    <div class="field-group">
                        <label>Número de versión <span class="hint">formato: v2.2.0</span></label>
                        <input 
                            v-model="newVersion.version"
                            placeholder="v2.2.0"
                            class="modal-input"
                            :class="{ error: versionError }"
                        />
                        <span class="field-error" v-if="versionError">{{ versionError }}</span>
                    </div>

                    <!-- Changelog -->
                    <div class="field-group">
                        <label>Changelog <span class="hint">qué cambió en esta versión</span></label>
                        <textarea 
                            v-model="newVersion.changelog"
                            placeholder="• Nuevo intent: agendar_visita&#10;• Mejora en detección de ciudad&#10;• Fix en búsqueda por barrio"
                            class="modal-textarea"
                            rows="5"
                        />
                    </div>

                    <!-- Métricas opcionales -->
                    <div class="metrics-row">
                        <div class="field-group">
                            <label>Tasa de éxito NLP (%)</label>
                            <input 
                                v-model.number="newVersion.metrics.success_rate"
                                type="number" min="0" max="100" step="0.1"
                                placeholder="92.5"
                                class="modal-input"
                            />
                        </div>
                        <div class="field-group">
                            <label>Tiempo respuesta (ms)</label>
                            <input 
                                v-model.number="newVersion.metrics.avg_response_ms"
                                type="number" min="0"
                                placeholder="420"
                                class="modal-input"
                            />
                        </div>
                    </div>

                    <!-- Activar inmediatamente -->
                    <label class="toggle-row">
                        <input type="checkbox" v-model="newVersion.activate" />
                        <span class="toggle-label">
                            Activar como versión actual inmediatamente
                            <small>Si no, quedará registrada pero inactiva</small>
                        </span>
                    </label>
                </div>

                <div class="modal-footer">
                    <button class="modal-btn-cancel" @click="showCreateModal = false" :disabled="creatingVersion">
                        Cancelar
                    </button>
                    <button class="modal-btn-confirm btn-create" @click="submitNewVersion" :disabled="creatingVersion || !newVersion.version || !newVersion.changelog">
                        <font-awesome-icon :icon="['fas', 'spinner']" class="fa-spin" v-if="creatingVersion" />
                        <font-awesome-icon :icon="['fas', 'rocket']" v-else />
                        {{ creatingVersion ? 'Creando...' : 'Crear Versión' }}
                    </button>
                </div>
            </div>
        </div>
    </transition>

  </div>
</template>

<style scoped>
.lyra-versions {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: fadeIn 0.4s ease-out;
}

.versions-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.current-version-card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.v-card-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.current-version-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--accent);
}

.v-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--admin-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.v-main {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin: 1.25rem 0;
}

.v-number {
  font-size: 3.5rem;
  font-weight: 900;
  margin: 0;
  color: var(--white);
  font-family: 'DM Mono', monospace;
  line-height: 1;
}

.v-badge {
  padding: 0.4rem 1rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.v-badge-stable {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.v-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem;
  color: var(--admin-text-secondary);
}

.v-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.version-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.v-mini-card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 20px;
  padding: 1.75rem;
}

.vm-label {
  font-size: 0.75rem;
  color: var(--admin-text-secondary);
  text-transform: uppercase;
  font-weight: 700;
  display: block;
}

.vm-val {
  font-size: 2rem;
  font-weight: 800;
  color: var(--white);
  font-family: 'DM Mono', monospace;
  display: block;
  margin: 0.5rem 0;
}

.vm-trend {
  font-size: 0.75rem;
  font-weight: 600;
}

.trend-up { color: var(--success); }

/* Timeline Card */
.lyra-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--admin-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 700;
  color: var(--white);
}

.btn-new-version {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.25rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.2s;
}
.btn-new-version:hover { opacity: 0.85; }

/* Modal Styles */
.rollback-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.rollback-modal {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  padding: 2.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
}

.create-modal {
    max-width: 600px;
}

.modal-warn-icon {
  width: 60px;
  height: 60px;
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin: 0 auto 1.5rem;
}

.modal-icon-create {
    width: 60px;
    height: 60px;
    background: rgba(99, 102, 241, 0.1);
    color: var(--accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    margin: 0 auto 1.5rem;
}

.rollback-modal h2 {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
}

/* Form Styles */
.field-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 1.25rem;
}

.field-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--admin-text-primary);
}

.hint {
    font-weight: 400;
    color: var(--admin-text-secondary);
    margin-left: 0.5rem;
    font-size: 0.75rem;
}

.modal-input, .modal-textarea {
    background: rgba(0,0,0,0.2);
    border: 1px solid var(--admin-border);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    color: var(--white);
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;
}
.modal-input:focus, .modal-textarea:focus { border-color: var(--accent); }
.modal-input.error { border-color: var(--danger); }
.modal-textarea { resize: vertical; font-family: inherit; }

.field-error { font-size: 0.75rem; color: var(--danger); }

.metrics-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.toggle-row {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    padding: 1rem;
    background: rgba(0,0,0,0.15);
    border-radius: 10px;
    border: 1px solid var(--admin-border);
    margin: 1rem 0;
}

.toggle-label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.9rem;
    font-weight: 600;
}

.toggle-label small {
    font-weight: 400;
    color: var(--admin-text-secondary);
    font-size: 0.75rem;
}

.rollback-diff {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  border-radius: 14px;
  margin: 1.5rem 0;
}

.diff-side { text-align: center; }
.diff-label { font-size: 0.7rem; text-transform: uppercase; color: var(--admin-text-secondary); display: block; }
.diff-val { font-size: 1.25rem; font-weight: 800; color: var(--white); font-family: 'DM Mono', monospace; }

.diff-separator { font-size: 1.25rem; color: var(--admin-border); }

.modal-desc {
  font-size: 0.85rem;
  color: var(--admin-text-secondary);
  text-align: center;
  line-height: 1.6;
}

.modal-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 2rem;
}

.modal-btn-cancel {
  padding: 0.8rem;
  background: transparent;
  border: 1px solid var(--admin-border);
  color: var(--white);
  border-radius: 12px;
  cursor: pointer;
}

.modal-btn-confirm {
  padding: 0.8rem;
  background: var(--warning);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.modal-btn-confirm:hover { background: #d97706; }

.btn-create {
    background: var(--accent) !important;
}
.btn-create:hover { opacity: 0.85; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 992px) {
  .versions-hero { grid-template-columns: 1fr; }
}
</style>
