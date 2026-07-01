<template>
  <AdminModal
    :model-value="show"
    :title="isCreateMode ? 'Crear Nueva Propiedad' : 'Editar Propiedad'"
    :subtitle="isCreateMode ? 'Completa los datos de la nueva propiedad' : 'Modifica los datos de la propiedad'"
    :icon="['fas', 'pen']"
    maxWidth="900px"
    @close="closeModal"
  >
    <form @submit.prevent="submitForm" class="pem-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
      <!-- Info Básica -->
      <div class="pem-section">
        <h3 class="pem-section__title"><font-awesome-icon :icon="['fas', 'info-circle']" /> Información Básica</h3>
        <div class="rx-form__grid">
          <div v-if="isCreateMode" class="rx-form__group rx-form__group--full">
            <label><font-awesome-icon :icon="['fas', 'user']" /> Asignar a Usuario *</label>
            <select v-model="formData.user_id" required><option value="">Selecciona un usuario</option><option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }} - {{ user.email }}</option></select>
            <small v-if="loadingUsers"><font-awesome-icon :icon="['fas', 'spinner']" spin /> Cargando usuarios...</small>
          </div>
          <div class="rx-form__group rx-form__group--full"><label><font-awesome-icon :icon="['fas', 'heading']" /> Título *</label><input v-model="formData.title" type="text" placeholder="Ej: Casa moderna de 3 habitaciones" required /></div>
          <div class="rx-form__group rx-form__group--full"><label><font-awesome-icon :icon="['fas', 'align-left']" /> Descripción *</label><textarea v-model="formData.description" placeholder="Describe los detalles de la propiedad..." rows="4" required></textarea></div>
        </div>
      </div>

      <!-- Ubicación -->
      <div class="pem-section">
        <h3 class="pem-section__title"><font-awesome-icon :icon="['fas', 'map-marker-alt']" /> Ubicación y Tipo</h3>
        <div class="rx-form__grid">
          <div class="rx-form__group"><label><font-awesome-icon :icon="['fas', 'home']" /> Tipo de Propiedad *</label><select v-model="formData.type" required><option value="">Selecciona un tipo</option><option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="local">Local Comercial</option><option value="finca">Finca</option><option value="otro">Otro</option></select></div>
          <div class="rx-form__group"><label><font-awesome-icon :icon="['fas', 'city']" /> Ciudad *</label><input v-model="formData.city" type="text" placeholder="Ej: Popayán" required /></div>
          <div class="rx-form__group rx-form__group--full"><label><font-awesome-icon :icon="['fas', 'map']" /> Dirección *</label><input v-model="formData.address" type="text" placeholder="Ej: Calle 5 #10-20" required /></div>
        </div>
      </div>

      <!-- Características -->
      <div class="pem-section">
        <h3 class="pem-section__title"><font-awesome-icon :icon="['fas', 'th-list']" /> Características</h3>
        <div class="rx-form__grid">
          <div class="rx-form__group"><label><font-awesome-icon :icon="['fas', 'bed']" /> Habitaciones *</label><input v-model.number="formData.num_bedrooms" type="number" placeholder="0" min="0" required /></div>
          <div class="rx-form__group"><label><font-awesome-icon :icon="['fas', 'bath']" /> Baños *</label><input v-model.number="formData.num_bathrooms" type="number" placeholder="0" min="0" required /></div>
          <div class="rx-form__group"><label><font-awesome-icon :icon="['fas', 'ruler-combined']" /> Área (m²) *</label><input v-model.number="formData.area_m2" type="number" placeholder="0" min="0" step="0.01" required /></div>
          <div class="rx-form__group"><label><font-awesome-icon :icon="['fas', 'dollar-sign']" /> Precio Mensual *</label><input v-model="displayPrice" type="text" placeholder="0" @input="handlePriceInput" @blur="formatPriceOnBlur" required /><small>{{ formattedPrice }}</small></div>
        </div>
      </div>

      <!-- Estado -->
      <div class="pem-section">
        <h3 class="pem-section__title"><font-awesome-icon :icon="['fas', 'cog']" /> Estado y Configuración</h3>
        <div class="rx-form__grid">
          <div class="rx-form__group"><label><font-awesome-icon :icon="['fas', 'toggle-on']" /> Disponibilidad</label><select v-model="formData.status"><option value="available">Disponible</option><option value="rented">Rentada</option><option value="maintenance">Mantenimiento</option></select></div>
          <div class="rx-form__group"><label><font-awesome-icon :icon="['fas', 'eye']" /> Visibilidad</label><select v-model="formData.visibility"><option value="published">Publicada</option><option value="hidden">Oculta</option></select></div>
        </div>
      </div>

      <!-- Imagen -->
      <div class="pem-section">
        <h3 class="pem-section__title"><font-awesome-icon :icon="['fas', 'image']" /> Imagen de la Propiedad</h3>
        <div class="rx-form__grid">
          <div class="rx-form__group rx-form__group--full">
            <label><font-awesome-icon :icon="['fas', 'upload']" /> Subir Imagen (Opcional)</label>
            <div class="pem-upload">
              <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/jpg,image/webp" class="pem-upload__input" @change="handleImageUpload" />
              <button type="button" class="pem-upload__btn" @click="triggerFileInput"><font-awesome-icon :icon="['fas', 'cloud-upload-alt']" /> Seleccionar Imagen</button>
              <div v-if="imageFileName" class="pem-upload__file"><font-awesome-icon :icon="['fas', 'check-circle']" class="pem-upload__ok" /> {{ imageFileName }}<button type="button" class="pem-upload__remove" @click="removeImage"><font-awesome-icon :icon="['fas', 'times']" /></button></div>
            </div>
            <small>Formatos: JPG, PNG, WEBP. Máximo 10MB</small>
          </div>
          <div v-if="imagePreview || formData.image_url" class="rx-form__group rx-form__group--full">
            <label>Vista Previa</label>
            <div class="pem-preview"><img :src="imagePreview || formData.image_url" alt="Preview" @error="handleImageError" /></div>
          </div>
        </div>
      </div>

      <!-- Servicios -->
      <div class="pem-section">
        <h3 class="pem-section__title"><font-awesome-icon :icon="['fas', 'list-check']" /> Servicios Incluidos</h3>
        <div class="pem-svc">
          <div class="pem-svc__input"><input v-model="newService" type="text" placeholder="Agregar servicio (ej: Agua, Luz, Internet...)" @keypress.enter.prevent="addService" /><button type="button" class="rx-btn rx-btn--accent" @click="addService" :disabled="!newService.trim()"><font-awesome-icon :icon="['fas', 'plus']" /> Agregar</button></div>
          <div v-if="formData.included_services.length > 0" class="pem-svc__list"><div v-for="(service, index) in formData.included_services" :key="index" class="pem-svc__tag"><span>{{ service }}</span><button type="button" class="pem-svc__remove" @click="removeService(index)"><font-awesome-icon :icon="['fas', 'times']" /></button></div></div>
          <p v-else class="pem-svc__empty">No hay servicios agregados.</p>
        </div>
      </div>
    </form>

    <template #footer>
      <button type="button" class="rx-btn rx-btn--ghost" @click="closeModal" :disabled="saving" style="padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.875rem; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-secondary); cursor: pointer;"><font-awesome-icon :icon="['fas', 'times']" /> Cancelar</button>
      <button type="button" class="rx-btn rx-btn--accent" @click="submitForm" :disabled="saving" style="padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.875rem; border: none; background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; cursor: pointer; box-shadow: 0 2px 10px rgba(99,102,241,.25);"><font-awesome-icon :icon="['fas', saving ? 'spinner' : 'save']" :spin="saving" /> {{ saving ? 'Guardando...' : (isCreateMode ? 'Continuar →' : 'Guardar Cambios') }}</button>
    </template>
  </AdminModal>

  <PropertyLocationModal :show="showLocationModal" :property-data="{ title: formData.title, city: formData.city, address: formData.address }" @confirm="handleLocationConfirm" @close="handleLocationCancel" />
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import AdminModal from '@/admin/components/AdminModal.vue';
import { propertyManagementService } from '../../../services/propertyManagementService';
import { userManagementService } from '../../../services/userManagementService';
import { useAlerts } from '../../../composables/useAlerts';
import PropertyLocationModal from './PropertyLocationModal.vue';
import type {
  Property,
  PropertyAvailabilityStatus,
  PropertyVisibility,
} from '../../../types/property';

interface Props {
  show: boolean;
  property: Property | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', property: Property): void;
}>();

const { success, error: showError } = useAlerts();

const isCreateMode = computed(() => !props.property);

const formattedPrice = computed(() => {
  if (!formData.value.monthly_price || formData.value.monthly_price === 0) return 'COP $0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(formData.value.monthly_price);
});

const saving = ref(false);
const newService = ref('');
const imageBase64 = ref<string | null>(null);
const imageFileName = ref<string | null>(null);
const imagePreview = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const displayPrice = ref('');
const showLocationModal = ref(false);
const tempPropertyData = ref<any>(null);
const users = ref<Array<{ id: number; name: string; email: string }>>([]);
const loadingUsers = ref(false);

interface PropertyFormData {
  user_id: number | null;
  title: string;
  description: string;
  address: string;
  city: string;
  type: string;
  status: PropertyAvailabilityStatus;
  visibility: PropertyVisibility;
  monthly_price: number;
  area_m2: number;
  num_bedrooms: number;
  num_bathrooms: number;
  included_services: string[];
  image_url: string;
}

const formData = ref<PropertyFormData>({
  user_id: null, title: '', description: '', address: '', city: '', type: 'otro',
  status: 'available', visibility: 'published', monthly_price: 0, area_m2: 0,
  num_bedrooms: 0, num_bathrooms: 0, included_services: [], image_url: '',
});

onMounted(async () => { if (isCreateMode.value) await loadUsers(); });

const loadUsers = async () => {
  try {
    loadingUsers.value = true;
    const response = await userManagementService.getUsers({ perPage: 1000 });
    users.value = response.data.map(user => ({ id: user.id, name: user.name, email: user.email }));
  } catch (err: any) { console.error('Error cargando usuarios:', err); showError('Error al cargar usuarios', 'Error'); }
  finally { loadingUsers.value = false; }
};

watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.property) {
      formData.value = {
        user_id: props.property.user_id || null, title: props.property.title || '',
        description: props.property.description || '', address: props.property.address || '',
        city: props.property.city || '', type: props.property.type || 'otro',
        status: props.property.status || 'available', visibility: props.property.visibility || 'published',
        monthly_price: props.property.monthly_price || 0, area_m2: props.property.area_m2 || 0,
        num_bedrooms: props.property.num_bedrooms || 0, num_bathrooms: props.property.num_bathrooms || 0,
        included_services: Array.isArray(props.property.included_services) ? [...props.property.included_services] : [],
        image_url: props.property.image_url || '',
      };
      displayPrice.value = formatNumber(props.property.monthly_price || 0);
    } else { resetForm(); loadUsers(); }
    imageBase64.value = null; imageFileName.value = null; imagePreview.value = null;
  }
});

const resetForm = () => {
  formData.value = { user_id: null, title: '', description: '', address: '', city: '', type: 'otro', status: 'available', visibility: 'published', monthly_price: 0, area_m2: 0, num_bedrooms: 0, num_bathrooms: 0, included_services: [], image_url: '' };
  newService.value = ''; imageBase64.value = null; imageFileName.value = null; imagePreview.value = null; displayPrice.value = '';
};

const addService = () => { const s = newService.value.trim(); if (s && !formData.value.included_services.includes(s)) { formData.value.included_services.push(s); newService.value = ''; } };
const removeService = (index: number) => { formData.value.included_services.splice(index, 1); };
const triggerFileInput = () => { fileInput.value?.click(); };

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement; const file = target.files?.[0]; if (!file) return;
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) { showError('Formato no válido. Usa JPG, PNG, GIF o WEBP', 'Formato inválido'); return; }
  if (file.size > 10 * 1024 * 1024) { showError('La imagen es muy grande. Máximo 10MB', 'Error de tamaño'); return; }
  imageFileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => { const result = e.target?.result as string; imageBase64.value = result; imagePreview.value = result; };
  reader.readAsDataURL(file); formData.value.image_url = '';
};

const removeImage = () => { imageBase64.value = null; imageFileName.value = null; imagePreview.value = null; if (fileInput.value) fileInput.value.value = ''; };
const formatNumber = (value: number): string => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const handlePriceInput = (event: Event) => {
  const input = event.target as HTMLInputElement; let value = input.value.replace(/[^\d]/g, ''); const numericValue = parseInt(value) || 0;
  formData.value.monthly_price = numericValue; displayPrice.value = formatNumber(numericValue);
  setTimeout(() => { input.setSelectionRange(displayPrice.value.length, displayPrice.value.length); }, 0);
};
const formatPriceOnBlur = () => { displayPrice.value = formData.value.monthly_price > 0 ? formatNumber(formData.value.monthly_price) : ''; };
const handleLocationConfirm = async (locationData: { lat: number; lng: number; accuracy: number }) => { await saveProperty(locationData); };
const handleLocationCancel = () => { showLocationModal.value = false; tempPropertyData.value = null; };
const handleImageError = (event: Event) => { (event.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Imagen+no+disponible'; };
const closeModal = () => { if (!saving.value) emit('close'); };

const submitForm = async () => {
  if (isCreateMode.value && !formData.value.user_id) { showError('Debes seleccionar un usuario para asignar la propiedad', 'Error'); return; }
  if (isCreateMode.value) { tempPropertyData.value = { ...formData.value }; showLocationModal.value = true; return; }
  await saveProperty();
};

const saveProperty = async (locationData?: { lat: number; lng: number; accuracy: number }) => {
  saving.value = true;
  try {
    let savedProperty: Property;
    const dataToSend: any = {
      title: formData.value.title, description: formData.value.description, address: formData.value.address,
      city: formData.value.city, type: formData.value.type, status: formData.value.status, visibility: formData.value.visibility,
      monthly_price: formData.value.monthly_price, area_m2: formData.value.area_m2, num_bedrooms: formData.value.num_bedrooms,
      num_bathrooms: formData.value.num_bathrooms, included_services: JSON.stringify(formData.value.included_services),
    };
    if (isCreateMode.value && formData.value.user_id) dataToSend.user_id = formData.value.user_id;
    if (locationData) { dataToSend.lat = locationData.lat; dataToSend.lng = locationData.lng; dataToSend.accuracy = locationData.accuracy; }
    if (imageBase64.value) { dataToSend.image_url = imageBase64.value; } else if (formData.value.image_url && !imageBase64.value) { dataToSend.image_url = formData.value.image_url; }
    if (isCreateMode.value) { savedProperty = await propertyManagementService.createProperty(dataToSend); success('Propiedad creada exitosamente', 'Éxito'); }
    else { savedProperty = await propertyManagementService.updateProperty(props.property!.id, dataToSend); success('Propiedad actualizada exitosamente', 'Éxito'); }
    emit('saved', savedProperty); emit('close'); showLocationModal.value = false;
  } catch (err: any) { console.error('Error guardando propiedad:', err); const errorMsg = err.response?.data?.message || err.message || 'Error al guardar la propiedad'; showError(errorMsg, 'Error'); }
  finally { saving.value = false; }
};
</script>

<style scoped>
.pem-form { display: flex; flex-direction: column; gap: 1.25rem; }
.pem-section { background: var(--admin-surface-elevated, #f8fafc); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 12px; padding: 1.15rem; }
.pem-section__title { display: flex; align-items: center; gap: .5rem; font-size: .9rem; font-weight: 700; color: var(--admin-text-primary, #0f172a); margin: 0 0 1rem; }

/* Upload */
.pem-upload { display: flex; flex-direction: column; gap: .75rem; }
.pem-upload__input { display: none; }
.pem-upload__btn { display: inline-flex; align-items: center; gap: .6rem; padding: .85rem 1.25rem; background: var(--admin-surface, #fff); border: 2px dashed var(--admin-border, #e2e8f0); border-radius: 10px; font-weight: 600; font-size: .85rem; cursor: pointer; transition: all .2s; color: var(--admin-text-secondary, #475569); font-family: inherit; }
.pem-upload__btn:hover { border-color: var(--accent, #6366f1); color: var(--accent, #6366f1); }
.pem-upload__file { display: flex; align-items: center; gap: .6rem; padding: .7rem .85rem; background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.2); border-radius: 8px; font-size: .82rem; font-weight: 600; color: #059669; }
.pem-upload__ok { color: #10b981; font-size: 1rem; }
.pem-upload__remove { margin-left: auto; width: 22px; height: 22px; border: none; background: #ef4444; color: #fff; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: .65rem; transition: all .2s; }
.pem-upload__remove:hover { background: #dc2626; transform: scale(1.1); }
.pem-preview { max-width: 360px; border: 1px solid var(--admin-border, #e2e8f0); border-radius: 10px; overflow: hidden; }
.pem-preview img { width: 100%; height: auto; display: block; }

/* Services */
.pem-svc { display: flex; flex-direction: column; gap: .75rem; }
.pem-svc__input { display: flex; gap: .6rem; }
.pem-svc__input input { flex: 1; padding: .65rem .85rem; border-radius: 10px; border: 1px solid var(--admin-border, #e2e8f0); background: var(--admin-surface, #fff); color: var(--admin-text-primary, #0f172a); font-size: .85rem; font-family: inherit; }
.pem-svc__input input:focus { outline: none; border-color: var(--accent, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
.pem-svc__list { display: flex; flex-wrap: wrap; gap: .5rem; }
.pem-svc__tag { display: inline-flex; align-items: center; gap: .4rem; padding: .45rem .85rem; background: var(--admin-surface, #fff); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 8px; font-size: .78rem; font-weight: 600; color: var(--admin-text-primary, #0f172a); }
.pem-svc__remove { width: 18px; height: 18px; border: none; background: #ef4444; color: #fff; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: .6rem; transition: all .2s; }
.pem-svc__remove:hover { background: #dc2626; transform: scale(1.1); }
.pem-svc__empty { font-size: .82rem; color: var(--admin-text-muted, #94a3b8); font-style: italic; margin: 0; padding: .85rem; background: var(--admin-surface, #fff); border: 2px dashed var(--admin-border, #e2e8f0); border-radius: 10px; text-align: center; }

@media (max-width: 768px) { .pem-svc__input { flex-direction: column; } }
</style>