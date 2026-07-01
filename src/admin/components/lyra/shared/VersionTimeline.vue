<script setup lang="ts">
import { computed } from 'vue';
import type { LyraVersion } from '../../../../services/lyraService';

interface Props {
  versions: LyraVersion[];
  currentVersion?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['rollback']);

const sortedVersions = computed(() => {
  return [...props.versions].sort((a, b) => 
    new Date(b.deployed_at).getTime() - new Date(a.deployed_at).getTime()
  );
});

const getStatus = (v: any) => {
  if (v.is_current) return 'current';
  return 'stable';
};

const getChangelog = (changelog: any) => {
  if (Array.isArray(changelog)) return changelog;
  if (typeof changelog === 'string') {
    return changelog.split('\n').map(s => s.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
  }
  return [];
};

const formatDate = (iso: string) => {
  if (!iso) return 'Pending';
  return new Date(iso).toLocaleDateString('es-CO', { 
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

const statusClass = (status: string) => {
  const map: any = {
    current: 'status-current',
    stable: 'status-stable',
    deprecated: 'status-deprecated',
    beta: 'status-beta'
  };
  return map[status] || 'status-generic';
};
</script>

<template>
  <div class="version-timeline">
    <div class="timeline-item" v-for="v in sortedVersions" :key="v.id" :class="{ 'is-current': v.is_current }">
      <div class="timeline-meta">
        <div class="version-tag">
          <span class="v-num">{{ v.version }}</span>
          <span class="v-status" :class="statusClass(getStatus(v))">{{ getStatus(v).toUpperCase() }}</span>
        </div>
        <span class="v-date">{{ formatDate(v.deployed_at) }}</span>
      </div>
      
      <div class="timeline-line">
        <div class="line-dot"></div>
      </div>
      
      <div class="timeline-content">
        <div class="v-header">
          <span class="v-author">
            <font-awesome-icon :icon="['fas', 'user-cog']" />
            Por: {{ v.deployed_by }}
          </span>
          <div class="v-actions">
            <button 
              v-if="!v.is_current" 
              class="rollback-btn"
              @click="$emit('rollback', v)"
            >
              <font-awesome-icon :icon="['fas', 'history']" />
              Rollback
            </button>
          </div>
        </div>
        
        <div class="v-changelog">
          <p class="changelog-title">Cambios Clave:</p>
          <ul>
            <li v-for="(change, i) in getChangelog(v.changelog)" :key="i">{{ change }}</li>
          </ul>
        </div>
        
        <div class="v-metrics-grid">
          <div class="mini-metric">
            <span class="mm-label">Éxito</span>
            <span class="mm-val">{{ v.metrics?.success_rate || 0 }}%</span>
          </div>
          <div class="mini-metric">
            <span class="mm-label">Latencia</span>
            <span class="mm-val">{{ v.metrics?.avg_response_ms || 0 }}ms</span>
          </div>
          <div class="mini-metric">
            <span class="mm-label">Autor</span>
            <span class="mm-val">{{ v.deployed_by }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.version-timeline {
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
}

.timeline-item {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
}

.timeline-meta {
  width: 140px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  flex-shrink: 0;
}

.version-tag {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.v-num {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--white);
  font-family: 'DM Mono', monospace;
}

.v-status {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-current { background: var(--accent); color: white; }
.status-stable { background: var(--success); color: white; }
.status-deprecated { background: var(--error); color: white; }
.status-beta { background: var(--warning); color: white; }

.v-date {
  font-size: 0.75rem;
  color: var(--admin-text-secondary);
  opacity: 0.8;
}

.timeline-line {
  position: relative;
  display: flex;
  justify-content: center;
  width: 20px;
}

.timeline-line::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: -2rem;
  width: 2px;
  background: var(--admin-border);
}

.timeline-item:last-child .timeline-line::before {
  bottom: 0;
}

.line-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--admin-border);
  z-index: 2;
  margin-top: 8px;
  border: 2px solid var(--admin-surface);
}

.is-current .line-dot {
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}

.timeline-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--admin-border);
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s;
}

.timeline-item:hover .timeline-content {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.v-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.v-author {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--admin-text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rollback-btn {
  background: transparent;
  border: 1px solid var(--admin-border);
  color: var(--admin-text-secondary);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.rollback-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(99, 102, 241, 0.05);
}

.v-changelog {
  margin-bottom: 1.25rem;
}

.changelog-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--admin-text-secondary);
  margin-bottom: 0.5rem;
  letter-spacing: 0.5px;
}

.v-changelog ul {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.v-changelog li {
  font-size: 0.85rem;
  color: var(--admin-text-secondary);
}

.v-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--admin-border);
}

.mini-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mm-label {
  font-size: 0.65rem;
  color: var(--admin-text-secondary);
  text-transform: uppercase;
}

.mm-val {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--white);
  font-family: 'DM Mono', monospace;
}
</style>
