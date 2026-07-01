<template>
  <AdminModal
    :model-value="show"
    title="Detalles de Propiedad"
    subtitle="Información completa"
    :icon="['fas', 'home']"
    maxWidth="900px"
    @close="closeModal"
  >
    <div v-if="loading" class="pdm-loading">
      <font-awesome-icon :icon="['fas', 'spinner']" spin class="pdm-spinner" />
      <p>Cargando detalles…</p>
    </div>

    <div v-else-if="property" class="pdm-content">
      <!-- Image -->
      <div class="pdm-image-wrap">
        <img :src="getPropertyImage(property)" :alt="property.title" class="pdm-image" @error="handleImageError" />
        <div class="pdm-image-badges">
          <span class="rx-badge" :style="{ color: getStatusConfig(property.status).color, background: getStatusConfig(property.status).bg }">
            <font-awesome-icon :icon="['fas', getStatusConfig(property.status).icon]" /> {{ getStatusConfig(property.status).label }}
          </span>
          <span class="rx-badge" :style="{ color: getApprovalConfig(property.approval_status).color, background: getApprovalConfig(property.approval_status).bg }">
            <font-awesome-icon :icon="['fas', getApprovalConfig(property.approval_status).icon]" /> {{ getApprovalConfig(property.approval_status).label }}
          </span>
        </div>
      </div>

      <!-- Info -->
      <div class="pdm-section">
        <h3 class="pdm-section__title"><font-awesome-icon :icon="['fas', 'info-circle']" /> Información General</h3>
        <div class="rx-detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
          <div class="rx-detail-item"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;">Título</label><p style="font-weight: 600; color: var(--admin-text-primary);">{{ property.title }}</p></div>
          <div class="rx-detail-item"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;">ID</label><p>#{{ property.id }}</p></div>
          <div class="rx-detail-item"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;"><font-awesome-icon :icon="['fas', 'map-marker-alt']" /> Ciudad</label><p>{{ property.city }}</p></div>
          <div class="rx-detail-item"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;">Dirección</label><p>{{ property.address }}</p></div>
        </div>
      </div>

      <!-- Description -->
      <div class="pdm-section">
        <h3 class="pdm-section__title"><font-awesome-icon :icon="['fas', 'align-left']" /> Descripción</h3>
        <div class="rx-description-box" style="white-space: pre-wrap; line-height: 1.6;">{{ property.description }}</div>
      </div>

      <!-- Specs -->
      <div class="pdm-section">
        <h3 class="pdm-section__title"><font-awesome-icon :icon="['fas', 'th-list']" /> Características</h3>
        <div class="pdm-specs">
          <div class="pdm-spec"><font-awesome-icon :icon="['fas', 'bed']" class="pdm-spec__ico" /><div><span class="pdm-spec__label">Habitaciones</span><span class="pdm-spec__val">{{ property.num_bedrooms }}</span></div></div>
          <div class="pdm-spec"><font-awesome-icon :icon="['fas', 'bath']" class="pdm-spec__ico" /><div><span class="pdm-spec__label">Baños</span><span class="pdm-spec__val">{{ property.num_bathrooms }}</span></div></div>
          <div class="pdm-spec"><font-awesome-icon :icon="['fas', 'ruler-combined']" class="pdm-spec__ico" /><div><span class="pdm-spec__label">Área</span><span class="pdm-spec__val">{{ property.area_m2 }}m²</span></div></div>
          <div class="pdm-spec"><font-awesome-icon :icon="['fas', 'eye']" class="pdm-spec__ico" /><div><span class="pdm-spec__label">Vistas</span><span class="pdm-spec__val">{{ property.views || 0 }}</span></div></div>
        </div>
      </div>

      <!-- Price -->
      <div class="pdm-section">
        <h3 class="pdm-section__title"><font-awesome-icon :icon="['fas', 'dollar-sign']" /> Precio</h3>
        <div class="pdm-price"><span class="pdm-price__amount">{{ formatPrice(property.monthly_price) }}</span><span class="pdm-price__period">/mes</span></div>
      </div>

      <!-- Services -->
      <div v-if="property.included_services && property.included_services.length > 0" class="pdm-section">
        <h3 class="pdm-section__title"><font-awesome-icon :icon="['fas', 'list-check']" /> Servicios Incluidos</h3>
        <div class="pdm-services"><span v-for="(service, i) in property.included_services" :key="i" class="pdm-service-tag"><font-awesome-icon :icon="['fas', 'check']" /> {{ service }}</span></div>
      </div>

      <!-- Owner -->
      <div v-if="property.user" class="pdm-section">
        <h3 class="pdm-section__title"><font-awesome-icon :icon="['fas', 'user']" /> Propietario</h3>
        <div class="rx-modal-person" style="display: flex; align-items: center; gap: 1rem;">
          <div v-if="property.user.photo" class="pdm-owner-photo"><img :src="property.user.photo" :alt="property.user.name" /></div>
          <div v-else class="rx-avatar rx-avatar--lg rx-avatar--landlord" style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #ede9fe; color: #7c3aed; font-size: 1.25rem;"><font-awesome-icon :icon="['fas', 'user']" /></div>
          <div>
            <div class="rx-person-name" style="font-weight: 600; color: var(--admin-text-primary); font-size: 1.1rem;">{{ property.user.name }}</div>
            <div class="rx-person-meta" style="font-size: 0.85rem; color: var(--admin-text-muted);"><font-awesome-icon :icon="['fas', 'envelope']" /> {{ property.user.email }}</div>
            <div v-if="property.user.phone" class="rx-person-meta" style="font-size: 0.85rem; color: var(--admin-text-muted);"><font-awesome-icon :icon="['fas', 'phone']" /> {{ property.user.phone }}</div>
          </div>
        </div>
      </div>

      <!-- Dates -->
      <div class="pdm-section">
        <h3 class="pdm-section__title"><font-awesome-icon :icon="['fas', 'calendar']" /> Fechas</h3>
        <div class="rx-detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
          <div class="rx-detail-item"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;">Publicación</label><p>{{ formatDate(property.publication_date) }}</p></div>
          <div class="rx-detail-item"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;">Creación</label><p>{{ formatDate(property.created_at) }}</p></div>
          <div class="rx-detail-item rx-detail-item--full"><label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 0.5rem;">Última actualización</label><p>{{ formatDate(property.updated_at) }}</p></div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="rx-btn rx-btn--ghost" @click="closeModal" style="padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.875rem; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-secondary); cursor: pointer;"><font-awesome-icon :icon="['fas', 'times']" /> Cerrar</button>
      <button class="rx-btn rx-btn--accent" @click="editProperty" style="padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.875rem; border: none; background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; cursor: pointer; box-shadow: 0 2px 10px rgba(99,102,241,.25);"><font-awesome-icon :icon="['fas', 'pen']" /> Editar Propiedad</button>
    </template>
  </AdminModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AdminModal from '@/admin/components/AdminModal.vue';
import { getPropertyImage as getPropertyImageUtil } from '../../../utils/propertyUtils';
import { propertyManagementService } from '../../../services/propertyManagementService';
import type { Property, PropertyApprovalStatus } from '../../../types/property';

interface Props {
  show: boolean;
  propertyId: number | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'edit', property: Property): void;
}>();

const property = ref<Property | null>(null);
const loading = ref(false);

watch(() => props.show, async (newShow) => {
  if (newShow && props.propertyId) {
    await loadPropertyDetails();
  }
});

const loadPropertyDetails = async () => {
  if (!props.propertyId) return;
  loading.value = true;
  try {
    const response = await propertyManagementService.getProperty(props.propertyId);
    property.value = response;
  } catch (error: any) {
    console.error('Error cargando detalles:', error);
  } finally {
    loading.value = false;
  }
};

const closeModal = () => { emit('close'); };
const editProperty = () => { if (property.value) emit('edit', property.value); };
const handleImageError = (event: Event) => { (event.target as HTMLImageElement).style.display = 'none'; };
const getPropertyImage = (property: any) => getPropertyImageUtil(property);
const formatPrice = (price: number) => propertyManagementService.formatPrice(price);
const formatDate = (date: string) => { if (!date) return 'N/A'; return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }); };

const getStatusConfig = (status: string) => {
  const config = propertyManagementService.getStatusConfig(status as any);
  const iconMap: Record<string, string> = { '✓': 'check-circle', '⏸': 'pause-circle', '🔧': 'wrench' };
  return { ...config, icon: iconMap[config.icon] || 'circle' };
};

const getApprovalConfig = (status?: PropertyApprovalStatus) => {
  const safeStatus: PropertyApprovalStatus = status ?? 'pending';
  const config = propertyManagementService.getApprovalConfig(safeStatus);
  const iconMap: Record<string, string> = { '⏳': 'clock', '✓': 'check-circle', '✕': 'times-circle' };
  return { ...config, icon: iconMap[config.icon] || 'circle' };
};
</script>

<style scoped>
.pdm-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; gap: .75rem; }
.pdm-spinner { font-size: 2rem; color: var(--accent, #6366f1); }
.pdm-loading p { color: var(--admin-text-muted, #94a3b8); font-size: .875rem; }
.pdm-content { display: flex; flex-direction: column; gap: 1.25rem; }

.pdm-image-wrap { position: relative; width: 100%; height: 300px; border-radius: 14px; overflow: hidden; }
.pdm-image { width: 100%; height: 100%; object-fit: cover; }
.pdm-image-ph { width: 100%; height: 100%; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; font-size: 4rem; color: rgba(255,255,255,.5); }
.pdm-image-badges { position: absolute; top: .85rem; right: .85rem; display: flex; flex-direction: column; gap: .5rem; align-items: flex-end; }

.pdm-section { background: var(--admin-surface-elevated, #f8fafc); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 12px; padding: 1.15rem; }
.pdm-section__title { display: flex; align-items: center; gap: .5rem; font-size: .9rem; font-weight: 700; color: var(--admin-text-primary, #0f172a); margin: 0 0 .85rem; }

.pdm-specs { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: .75rem; }
.pdm-spec { background: var(--admin-surface, #fff); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 10px; padding: .85rem; display: flex; align-items: center; gap: .75rem; transition: all .2s; }
.pdm-spec:hover { border-color: var(--accent, #6366f1); transform: translateY(-1px); }
.pdm-spec__ico { font-size: 1.2rem; color: var(--accent, #6366f1); flex-shrink: 0; }
.pdm-spec__label { font-size: .68rem; font-weight: 600; color: var(--admin-text-muted, #94a3b8); text-transform: uppercase; letter-spacing: .03em; display: block; }
.pdm-spec__val { font-size: 1.15rem; font-weight: 800; color: var(--admin-text-primary, #0f172a); display: block; }

.pdm-price { display: flex; align-items: baseline; gap: .35rem; background: linear-gradient(135deg, #10b981, #059669); color: #fff; padding: 1rem 1.5rem; border-radius: 12px; width: fit-content; }
.pdm-price__amount { font-size: 1.85rem; font-weight: 900; }
.pdm-price__period { font-size: .95rem; font-weight: 600; opacity: .85; }

.pdm-services { display: flex; flex-wrap: wrap; gap: .5rem; }
.pdm-service-tag { display: inline-flex; align-items: center; gap: .35rem; padding: .45rem .85rem; background: var(--admin-surface, #fff); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 8px; font-size: .78rem; font-weight: 600; color: var(--admin-text-primary, #0f172a); }

.pdm-owner-photo { flex-shrink: 0; }
.pdm-owner-photo img { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; border: 2px solid var(--admin-border, #e2e8f0); }

@media (max-width: 768px) { .pdm-image-wrap { height: 200px; } .pdm-specs { grid-template-columns: 1fr 1fr; } }
</style>