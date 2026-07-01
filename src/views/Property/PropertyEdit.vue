<template>
  <div class="ep-page">
    <div class="ep-bg" aria-hidden="true">
      <div class="ep-bg__orb ep-bg__orb--1"></div>
      <div class="ep-bg__orb ep-bg__orb--2"></div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ep-state">
      <div class="ep-spinner"></div>
      <p>{{ $t('editProperty.loading') }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="ep-state ep-state--error">
      <div class="ep-state__icon">
        <font-awesome-icon :icon="['fas', 'triangle-exclamation']" />
      </div>
      <h2>{{ $t('editProperty.errorTitle') }}</h2>
      <p>{{ error }}</p>
      <button @click="router.push('/propiedades')" class="ep-btn-back">
        <font-awesome-icon :icon="['fas', 'arrow-left']" />
        {{ $t('editProperty.backToProperties') }}
      </button>
    </div>

    <!-- Edit content -->
    <div v-else-if="property" class="ep-shell">

      <!-- Header -->
      <header class="ep-header">
        <!-- Breadcrumb -->
        <nav class="ep-breadcrumb">
          <router-link to="/" class="ep-bc-item">
            <font-awesome-icon :icon="['fas', 'house']" />
          </router-link>
          <font-awesome-icon :icon="['fas', 'chevron-right']" class="ep-bc-sep" />
          <router-link to="/propiedades" class="ep-bc-item">{{ $t('editProperty.breadcrumb.properties') }}</router-link>
          <font-awesome-icon :icon="['fas', 'chevron-right']" class="ep-bc-sep" />
          <router-link :to="`/properties/${property.id}`" class="ep-bc-item">{{ property.title }}</router-link>
          <font-awesome-icon :icon="['fas', 'chevron-right']" class="ep-bc-sep" />
          <span class="ep-bc-current">{{ $t('editProperty.breadcrumb.edit') }}</span>
        </nav>

        <div class="ep-header__content">
          <div class="ep-header__left">
            <span class="ep-eyebrow"><span class="ew-pip"></span>{{ t('editProperty.eyebrow') }}</span>
            <h1 class="ep-title">{{ $t('editProperty.title') }}</h1>
            <p class="ep-subtitle">{{ $t('editProperty.subtitle') }}</p>
          </div>
          <div class="ep-header__badge">
            <font-awesome-icon :icon="['fas', 'pen-to-square']" />
          </div>
        </div>
      </header>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="ep-form">

        <!-- Información Básica -->
        <div class="ep-section">
          <div class="ep-section__head">
            <div class="ep-section__ico"><font-awesome-icon :icon="['fas', 'circle-info']" /></div>
            <div>
              <h2 class="ep-section__title">{{ $t('editProperty.sections.basicInfo') }}</h2>
              <p class="ep-section__desc">{{ t('editProperty.sectionDescriptions.basicInfo') }}</p>
            </div>
          </div>

          <div class="ep-grid">
            <div class="ep-field ep-field--full">
              <label for="title">
                <font-awesome-icon :icon="['fas', 'heading']" />
                {{ $t('editProperty.fields.title') }} <span class="req">*</span>
              </label>
              <input type="text" id="title" v-model="form.title" :placeholder="$t('editProperty.placeholders.title')"
                required />
              <span v-if="errors.title" class="ep-error">{{ errors.title }}</span>
            </div>

            <div class="ep-field ep-field--full">
              <label for="description">
                <font-awesome-icon :icon="['fas', 'file-lines']" />
                {{ $t('editProperty.fields.description') }} <span class="req">*</span>
              </label>
              <textarea id="description" v-model="form.description" rows="5"
                :placeholder="$t('editProperty.placeholders.description')" required></textarea>
              <span v-if="errors.description" class="ep-error">{{ errors.description }}</span>
            </div>

            <div class="ep-field">
              <label for="status">
                <font-awesome-icon :icon="['fas', 'toggle-on']" />
                {{ $t('editProperty.fields.status') }} <span class="req">*</span>
              </label>
              <select id="status" v-model="form.status" required>
                <option value="available">{{ $t('editProperty.status.available') }}</option>
                <option value="rented">{{ $t('editProperty.status.rented') }}</option>
                <option value="maintenance">{{ $t('editProperty.status.maintenance') }}</option>
              </select>
            </div>

            <div class="ep-field">
              <label for="monthly_price">
                <font-awesome-icon :icon="['fas', 'dollar-sign']" />
                {{ $t('editProperty.fields.monthlyPrice') }} <span class="req">*</span>
              </label>
              <div class="ep-input-addon">
                <span class="ep-addon">$</span>
                <input type="text" id="monthly_price" v-model="displayPrice" @input="handlePriceInput"
                  @blur="formatPriceOnBlur" placeholder="1.000.000" required />
              </div>
              <span v-if="form.monthly_price > 0" class="ep-price-help">{{ formatCurrency(form.monthly_price) }}</span>
              <span v-if="errors.monthly_price" class="ep-error">{{ errors.monthly_price }}</span>
            </div>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="ep-section">
          <div class="ep-section__head">
            <div class="ep-section__ico"><font-awesome-icon :icon="['fas', 'map-location-dot']" /></div>
            <div>
              <h2 class="ep-section__title">{{ $t('editProperty.sections.location') }}</h2>
              <p class="ep-section__desc">{{ t('editProperty.sectionDescriptions.location') }}</p>
            </div>
          </div>

          <div class="ep-grid">
            <div class="ep-field">
              <label for="address"><font-awesome-icon :icon="['fas', 'road']" /> {{ $t('editProperty.fields.address') }}
                <span class="req">*</span></label>
              <input type="text" id="address" v-model="form.address"
                :placeholder="$t('editProperty.placeholders.address')" required />
            </div>
            <div class="ep-field">
              <label for="city"><font-awesome-icon :icon="['fas', 'city']" /> {{ $t('editProperty.fields.city')
                }}</label>
              <input type="text" id="city" v-model="form.city" :placeholder="$t('editProperty.placeholders.city')" />
            </div>
            <div class="ep-field">
              <label for="lat"><font-awesome-icon :icon="['fas', 'location-dot']" /> {{
                $t('editProperty.fields.latitude') }}</label>
              <input type="number" id="lat" v-model.number="form.lat" step="0.000001" placeholder="2.4448" />
            </div>
            <div class="ep-field">
              <label for="lng"><font-awesome-icon :icon="['fas', 'location-dot']" /> {{
                $t('editProperty.fields.longitude') }}</label>
              <input type="number" id="lng" v-model.number="form.lng" step="0.000001" placeholder="-76.6147" />
            </div>
          </div>
        </div>

        <!-- Características -->
        <div class="ep-section">
          <div class="ep-section__head">
            <div class="ep-section__ico"><font-awesome-icon :icon="['fas', 'sliders']" /></div>
            <div>
              <h2 class="ep-section__title">{{ $t('editProperty.sections.features') }}</h2>
              <p class="ep-section__desc">{{ t('editProperty.sectionDescriptions.features') }}</p>
            </div>
          </div>

          <div class="ep-grid">
            <div class="ep-field">
              <label for="area_m2"><font-awesome-icon :icon="['fas', 'ruler-combined']" /> {{
                $t('editProperty.fields.area') }}</label>
              <div class="ep-input-addon">
                <input type="number" id="area_m2" v-model.number="form.area_m2" min="0" step="1" placeholder="100" />
                <span class="ep-addon ep-addon--right">m²</span>
              </div>
            </div>
            <div class="ep-field">
              <label for="num_bedrooms"><font-awesome-icon :icon="['fas', 'bed']" /> {{
                $t('editProperty.fields.bedrooms') }}</label>
              <input type="number" id="num_bedrooms" v-model.number="form.num_bedrooms" min="0" placeholder="3" />
            </div>
            <div class="ep-field">
              <label for="num_bathrooms"><font-awesome-icon :icon="['fas', 'bath']" /> {{
                $t('editProperty.fields.bathrooms') }}</label>
              <input type="number" id="num_bathrooms" v-model.number="form.num_bathrooms" min="0" placeholder="2" />
            </div>
            <div class="ep-field">
              <label for="parking_spaces"><font-awesome-icon :icon="['fas', 'square-parking']" /> {{
                $t('editProperty.fields.parking') }}</label>
              <input type="number" id="parking_spaces" v-model.number="form.parking_spaces" min="0" placeholder="1" />
            </div>
          </div>
        </div>

        <!-- Gestión de Imágenes -->
        <div class="ep-section">
          <div class="ep-section__head">
            <div class="ep-section__ico"><font-awesome-icon :icon="['fas', 'images']" /></div>
            <div>
              <h2 class="ep-section__title">{{ $t('editProperty.sections.image') }}</h2>
              <p class="ep-section__desc">{{ t('editProperty.sectionDescriptions.images') }}</p>
            </div>
          </div>

          <!-- Imágenes existentes -->
          <div v-if="existingImages.length > 0" class="ep-imgs-block">
            <h3 class="ep-imgs-label">
              <font-awesome-icon :icon="['fas', 'photo-film']" />
              {{ t('editProperty.images.current') }}
              <span class="ep-imgs-count">{{ existingImages.length }}</span>
            </h3>
            <div class="ep-images-grid">
              <div v-for="(image, index) in existingImages" :key="image.id"
                :class="['ep-img-card', { 'ep-img-card--main': image.is_main }]">
                <div class="ep-img-preview">
                  <img :src="image.url" :alt="`Imagen ${index + 1}`" />
                  <div v-if="image.is_main" class="ep-img-badge">
                    <font-awesome-icon :icon="['fas', 'star']" />
                    {{ t('editProperty.images.principal') }}
                  </div>
                  <div class="ep-img-overlay">
                    <button type="button" class="ep-img-btn ep-img-btn--del" @click="removeExistingImage(index)"
                      :title="t('editProperty.images.delete')">
                      <font-awesome-icon :icon="['fas', 'trash']" />
                    </button>
                  </div>
                </div>
                <div class="ep-img-footer">
                  <span class="ep-img-num">#{{ index + 1 }}</span>
                  <span v-if="image.is_main" class="ep-img-main-tag">{{ t('editProperty.images.principal') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Nuevas imágenes -->
          <div class="ep-imgs-block">
            <h3 class="ep-imgs-label">
              <font-awesome-icon :icon="['fas', 'cloud-arrow-up']" />
              {{ t('editProperty.images.add') }}
              <span v-if="newImages.length" class="ep-imgs-count">+{{ newImages.length }}</span>
            </h3>

            <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple class="ep-file-hidden"
              @change="handleImageSelection" />

            <div :class="['ep-dropzone', { 'ep-dropzone--dragging': isDragging }]" @click="triggerFileInput"
              @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop">
              <font-awesome-icon :icon="['fas', 'cloud-arrow-up']" class="ep-dropzone__ico" />
              <h4>{{ t('editProperty.images.dropzone.title') }}</h4>
              <p>{{ t('editProperty.images.dropzone.description') }}</p>
            </div>

            <div v-if="newImages.length > 0" class="ep-images-grid" style="margin-top:1.25rem">
              <div v-for="(image, index) in newImages" :key="image.id" class="ep-img-card">
                <div class="ep-img-preview">
                  <img :src="image.preview" :alt="`Nueva ${index + 1}`" />
                  <div class="ep-img-overlay">
                    <button type="button" class="ep-img-btn ep-img-btn--del" @click="removeNewImage(index)">
                      <font-awesome-icon :icon="['fas', 'trash']" />
                    </button>
                  </div>
                </div>
                <div class="ep-img-footer">
                  <span class="ep-img-num">{{ t('editProperty.images.new') }} #{{ index + 1 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Servicios -->
        <div class="ep-section">
          <div class="ep-section__head">
            <div class="ep-section__ico"><font-awesome-icon :icon="['fas', 'circle-check']" /></div>
            <div>
              <h2 class="ep-section__title">{{ $t('editProperty.sections.services') }}</h2>
              <p class="ep-section__desc">{{ t('editProperty.sectionDescriptions.services') }}</p>
            </div>
          </div>

          <div class="ep-services-grid">
            <label v-for="service in AVAILABLE_SERVICES" :key="service.value"
              :class="['ep-service', { 'ep-service--on': selectedServices.includes(service.value) }]">
              <input type="checkbox" :value="service.value" v-model="selectedServices" class="ep-service__native" />
              <span class="ep-service__check">
                <font-awesome-icon
                  :icon="selectedServices.includes(service.value) ? ['fas', 'circle-check'] : ['far', 'circle']" />
              </span>
              <span class="ep-service__ico">
                <font-awesome-icon :icon="['fas', service.faIcon]" />
              </span>
              <span class="ep-service__name">{{ $t(`editProperty.services.${service.value}`) }}</span>
            </label>
          </div>
        </div>

        <!-- Acciones -->
        <div class="ep-actions">
          <button type="button" class="ep-btn-cancel" @click="cancelEdit">
            <font-awesome-icon :icon="['fas', 'xmark']" />
            {{ $t('editProperty.buttons.cancel') }}
          </button>
          <button type="submit" class="ep-btn-submit" :disabled="isSaving">
            <font-awesome-icon :icon="isSaving ? ['fas', 'spinner'] : ['fas', 'floppy-disk']" :spin="isSaving" />
            {{ isSaving ? $t('editProperty.buttons.saving') : $t('editProperty.buttons.save') }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '../../services/api'

interface PropertyImage { id: number; url: string; is_main: boolean; order: number }
interface NewImage { id: string; file: File; preview: string }
interface PropertyForm {
  title: string; description: string; address: string; city: string; status: string;
  monthly_price: number; area_m2: number | null; num_bedrooms: number | null;
  num_bathrooms: number | null; parking_spaces: number | null; lat: number | null; lng: number | null;
}

const AVAILABLE_SERVICES = [
  { value: 'water', faIcon: 'droplet' },
  { value: 'electricity', faIcon: 'bolt' },
  { value: 'gas', faIcon: 'fire' },
  { value: 'internet', faIcon: 'wifi' },
  { value: 'cableTv', faIcon: 'tv' },
  { value: 'security', faIcon: 'shield-halved' },
  { value: 'parking', faIcon: 'square-parking' },
  { value: 'gym', faIcon: 'dumbbell' },
  { value: 'pool', faIcon: 'person-swimming' },
  { value: 'bbqArea', faIcon: 'fire-burner' },
  { value: 'laundry', faIcon: 'jug-detergent' },
  { value: 'elevator', faIcon: 'elevator' },
]

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const property = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isSaving = ref(false)
const errors = reactive<Record<string, string>>({})
const selectedServices = ref<string[]>([])
const displayPrice = ref('')
const existingImages = ref<PropertyImage[]>([])
const newImages = ref<NewImage[]>([])
const deletedImagesIds = ref<number[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const form = reactive<PropertyForm>({
  title: '', description: '', address: '', city: '', status: 'available',
  monthly_price: 0, area_m2: null, num_bedrooms: null, num_bathrooms: null,
  parking_spaces: null, lat: null, lng: null
})

const formatNumber = (value: number | string) => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const formatCurrency = (value: number) => {
  if (!value) return 'COP $0'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

const handlePriceInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/[^\d]/g, '')
  const numericValue = parseInt(value) || 0
  form.monthly_price = numericValue
  displayPrice.value = formatNumber(numericValue)
  setTimeout(() => { const l = displayPrice.value.length; input.setSelectionRange(l, l) }, 0)
}

const formatPriceOnBlur = () => { displayPrice.value = form.monthly_price > 0 ? formatNumber(form.monthly_price) : '' }

const triggerFileInput = () => fileInput.value?.click()

const handleImageSelection = (event: Event) => {
  const target = event.target as HTMLInputElement
  processFiles(Array.from(target.files || []))
  if (fileInput.value) fileInput.value.value = ''
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  processFiles(Array.from(event.dataTransfer?.files || []))
}

const processFiles = (files: File[]) => {
  files.forEach(file => {
    if (file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) {
      newImages.value.push({ id: Math.random().toString(36).substr(2, 9), file, preview: URL.createObjectURL(file) })
    }
  })
}

const removeExistingImage = (index: number) => {
  deletedImagesIds.value.push(existingImages.value[index].id)
  existingImages.value.splice(index, 1)
}

const removeNewImage = (index: number) => {
  URL.revokeObjectURL(newImages.value[index].preview)
  newImages.value.splice(index, 1)
}

async function fetchProperty() {
  loading.value = true; error.value = null
  try {
    const response = await api.get(`/properties/${route.params.id}`)
    property.value = response.data.data || response.data

    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (!userStr) { error.value = t('editProperty.errors.mustLogin'); return }
    const user = JSON.parse(userStr)
    const isOwner = parseInt(user.id) === parseInt(property.value.user_id)
    const isAdmin = ['admin', 'support'].includes(user.role?.toLowerCase())
    if (!isOwner && !isAdmin) { error.value = t('editProperty.errors.noPermission'); return }

    Object.keys(form).forEach(key => {
      const k = key as keyof PropertyForm
      if (property.value[key] !== undefined && property.value[key] !== null) (form as any)[k] = property.value[key]
    })

    existingImages.value = property.value.images || []
    const priceValue = parseFloat(property.value.monthly_price) || 0
    form.monthly_price = Math.round(priceValue)
    displayPrice.value = formatNumber(form.monthly_price)

    selectedServices.value = []
    if (property.value.included_services) {
      if (Array.isArray(property.value.included_services)) selectedServices.value = [...property.value.included_services]
      else if (typeof property.value.included_services === 'string') {
        try { const p = JSON.parse(property.value.included_services); selectedServices.value = Array.isArray(p) ? p : [] }
        catch { selectedServices.value = property.value.included_services.split(',').map((s: string) => s.trim()).filter(Boolean) }
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || t('editProperty.errors.loadError')
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  Object.keys(errors).forEach(k => delete errors[k])
  isSaving.value = true
  try {
    const fd = new FormData()
    fd.append('_method', 'PUT')
    fd.append('title', form.title)
    fd.append('description', form.description)
    fd.append('address', form.address)
    if (form.city) fd.append('city', form.city)
    fd.append('status', form.status)
    fd.append('monthly_price', form.monthly_price.toString())
    if (form.area_m2) fd.append('area_m2', form.area_m2.toString())
    if (form.num_bedrooms) fd.append('num_bedrooms', form.num_bedrooms.toString())
    if (form.num_bathrooms) fd.append('num_bathrooms', form.num_bathrooms.toString())
    if (form.parking_spaces) fd.append('parking_spaces', form.parking_spaces.toString())
    if (form.lat) fd.append('lat', form.lat.toString())
    if (form.lng) fd.append('lng', form.lng.toString())
    fd.append('included_services', JSON.stringify(selectedServices.value))
    newImages.value.forEach(img => fd.append('images[]', img.file))
    deletedImagesIds.value.forEach(id => fd.append('delete_images[]', id.toString()))

    await api.post(`/properties/${property.value.id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000
    })
    alert(t('editProperty.messages.updateSuccess'))
    router.push(`/properties/${property.value.id}`)
  } catch (err: any) {
    if (err.response?.status === 422) {
      const ve = err.response.data.errors || {}
      Object.keys(ve).forEach(k => { errors[k] = ve[k][0] })
      alert(t('property.create.errors.incompleteFields'))
    } else if (err.response?.status === 403) {
      alert(t('editProperty.messages.noPermission'))
    } else {
      alert(t('editProperty.messages.updateError'))
    }
  } finally {
    isSaving.value = false
  }
}

function cancelEdit() {
  if (confirm(t('editProperty.messages.cancelConfirm'))) router.push(`/properties/${property.value.id}`)
}

onMounted(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); fetchProperty() })
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   EDIT PROPERTY VIEW
   • padding-top: 65px  →  navbar fixed
   • Paleta: #1a0e0a / #2e1d17 / #3b2416 + #da9c5f
   ══════════════════════════════════════════════════════════════ */
.ep-page {
  min-height: calc(100vh - 65px);
  padding-top: 65px;
  position: relative;
  overflow-x: hidden;
  background: linear-gradient(135deg, #1a0e0a 0%, #2e1d17 50%, #3b2416 100%);
}

.ep-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("https://i.pinimg.com/1200x/e2/d2/b7/e2d2b7877ffb88a68d6b72e5ea0bd965.jpg") center/cover no-repeat;
  opacity: 0.1;
  filter: blur(7px);
  pointer-events: none;
  z-index: 0;
}

/* Orbs */
.ep-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.ep-bg__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
}

.ep-bg__orb--1 {
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(218, 156, 95, 0.45), transparent);
  top: -180px;
  right: -180px;
}

.ep-bg__orb--2 {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(184, 121, 31, 0.3), transparent);
  bottom: -120px;
  left: -120px;
}

/* State screens */
.ep-state {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 65px);
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}

.ep-spinner {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid rgba(218, 156, 95, 0.2);
  border-top-color: #da9c5f;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ep-state p {
  font-size: 0.95rem;
  color: rgba(240, 229, 219, 0.5);
}

.ep-state h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #f0e5db;
  margin: 0;
}

.ep-state__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(231, 76, 60, 0.12);
  border: 1px solid rgba(231, 76, 60, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e74c3c;
  font-size: 1.5rem;
}

.ep-btn-back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #da9c5f, #b8791f);
  border: none;
  border-radius: 10px;
  color: #1a0e0a;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.5rem;
}

/* Shell */
.ep-shell {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 2rem 5rem;
}

/* Header */
.ep-header {
  margin-bottom: 2.5rem;
}

.ep-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.ep-bc-item {
  font-size: 0.8rem;
  color: rgba(240, 229, 219, 0.4);
  text-decoration: none;
  transition: color 0.2s;
}

.ep-bc-item:hover {
  color: #da9c5f;
}

.ep-bc-sep {
  font-size: 0.65rem;
  color: rgba(240, 229, 219, 0.2);
}

.ep-bc-current {
  font-size: 0.8rem;
  color: #da9c5f;
  font-weight: 600;
}

.ep-header__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.ep-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #da9c5f;
  margin-bottom: 0.6rem;
}

.ew-pip {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #da9c5f;
  box-shadow: 0 0 8px rgba(218, 156, 95, 0.7);
}

.ep-title {
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  font-weight: 800;
  color: #f0e5db;
  line-height: 1.15;
  margin: 0 0 0.4rem;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 20px rgba(218, 156, 95, 0.35);
}

.ep-subtitle {
  font-size: 0.9rem;
  color: rgba(240, 229, 219, 0.5);
  margin: 0;
}

.ep-header__badge {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(218, 156, 95, 0.2), rgba(184, 121, 31, 0.1));
  border: 1px solid rgba(218, 156, 95, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #da9c5f;
  font-size: 1.3rem;
  flex-shrink: 0;
}

/* Sections */
.ep-section {
  background: linear-gradient(135deg, rgba(62, 36, 24, 0.95), rgba(46, 29, 23, 0.95));
  border: 1px solid rgba(218, 156, 95, 0.2);
  border-radius: 18px;
  padding: 1.75rem;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.ep-section__head {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(218, 156, 95, 0.15);
}

.ep-section__ico {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(218, 156, 95, 0.12);
  border: 1px solid rgba(218, 156, 95, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #da9c5f;
  flex-shrink: 0;
}

.ep-section__title {
  font-size: 1rem;
  font-weight: 700;
  color: #f0e5db;
  margin: 0 0 0.2rem;
}

.ep-section__desc {
  font-size: 0.82rem;
  color: rgba(240, 229, 219, 0.4);
  margin: 0;
}

/* Grid & Fields */
.ep-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.ep-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.ep-field--full {
  grid-column: 1 / -1;
}

.ep-field label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.79rem;
  font-weight: 700;
  color: rgba(240, 229, 219, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.req {
  color: #e74c3c;
}

.ep-field input,
.ep-field textarea,
.ep-field select {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(218, 156, 95, 0.22);
  border-radius: 10px;
  color: #f0e5db;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.2s;
  width: 100%;
}

.ep-field input::placeholder,
.ep-field textarea::placeholder {
  color: rgba(240, 229, 219, 0.25);
}

.ep-field input:focus,
.ep-field textarea:focus,
.ep-field select:focus {
  outline: none;
  border-color: rgba(218, 156, 95, 0.6);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(218, 156, 95, 0.1);
}

.ep-field select {
  cursor: pointer;
}

.ep-field select option {
  background: #2e1d17;
  color: #f0e5db;
}

.ep-field textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
}

.ep-input-addon {
  display: flex;
  align-items: stretch;
  border: 1px solid rgba(218, 156, 95, 0.22);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ep-input-addon:focus-within {
  border-color: rgba(218, 156, 95, 0.6);
  box-shadow: 0 0 0 3px rgba(218, 156, 95, 0.1);
}

.ep-input-addon input {
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  flex: 1;
}

.ep-input-addon input:focus {
  box-shadow: none;
}

.ep-addon {
  display: flex;
  align-items: center;
  padding: 0 0.85rem;
  background: rgba(218, 156, 95, 0.1);
  color: #da9c5f;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

.ep-addon--right {
  border-left: 1px solid rgba(218, 156, 95, 0.15);
}

.ep-price-help {
  font-size: 0.78rem;
  color: #2ecc71;
  font-weight: 600;
}

.ep-error {
  font-size: 0.78rem;
  color: #e74c3c;
  font-weight: 500;
}

/* Images */
.ep-imgs-block {
  margin-bottom: 1.75rem;
}

.ep-imgs-block:last-child {
  margin-bottom: 0;
}

.ep-imgs-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: rgba(240, 229, 219, 0.65);
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(218, 156, 95, 0.12);
}

.ep-imgs-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: rgba(218, 156, 95, 0.2);
  border: 1px solid rgba(218, 156, 95, 0.35);
  border-radius: 6px;
  font-size: 0.72rem;
  color: #da9c5f;
  font-weight: 700;
}

.ep-file-hidden {
  display: none;
}

.ep-dropzone {
  border: 2px dashed rgba(218, 156, 95, 0.28);
  border-radius: 12px;
  padding: 2.5rem 2rem;
  text-align: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s;
}

.ep-dropzone:hover,
.ep-dropzone--dragging {
  border-color: rgba(218, 156, 95, 0.6);
  background: rgba(218, 156, 95, 0.04);
  transform: translateY(-2px);
}

.ep-dropzone__ico {
  font-size: 2.5rem;
  color: rgba(218, 156, 95, 0.45);
  margin-bottom: 0.65rem;
  display: block;
}

.ep-dropzone h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(240, 229, 219, 0.55);
  margin: 0 0 0.3rem;
}

.ep-dropzone p {
  font-size: 0.8rem;
  color: rgba(240, 229, 219, 0.28);
  margin: 0;
}

.ep-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.ep-img-card {
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(218, 156, 95, 0.15);
  transition: all 0.25s;
}

.ep-img-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
}

.ep-img-card--main {
  border-color: #da9c5f;
  box-shadow: 0 0 0 2px rgba(218, 156, 95, 0.3);
}

.ep-img-preview {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.ep-img-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ep-img-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: linear-gradient(135deg, #da9c5f, #b8791f);
  color: #1a0e0a;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-size: 0.67rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ep-img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s;
}

.ep-img-card:hover .ep-img-overlay {
  opacity: 1;
}

.ep-img-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: #1a0e0a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.ep-img-btn--del {
  background: rgba(231, 76, 60, 0.92);
  color: #fff;
}

.ep-img-btn--del:hover {
  background: #e74c3c;
  transform: scale(1.1);
}

.ep-img-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.55rem 0.8rem;
  border-top: 1px solid rgba(218, 156, 95, 0.1);
}

.ep-img-num {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(240, 229, 219, 0.4);
}

.ep-img-main-tag {
  font-size: 0.67rem;
  font-weight: 700;
  color: #da9c5f;
}

/* Services */
.ep-services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 0.65rem;
}

.ep-service {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid rgba(218, 156, 95, 0.18);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.ep-service:hover {
  border-color: rgba(218, 156, 95, 0.4);
  background: rgba(218, 156, 95, 0.06);
  transform: translateY(-1px);
}

.ep-service--on {
  border-color: rgba(218, 156, 95, 0.55);
  background: rgba(218, 156, 95, 0.1);
  box-shadow: 0 0 0 2px rgba(218, 156, 95, 0.12);
}

.ep-service__native {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.ep-service__check {
  color: rgba(240, 229, 219, 0.25);
  font-size: 0.9rem;
  flex-shrink: 0;
  transition: color 0.2s;
}

.ep-service--on .ep-service__check {
  color: #da9c5f;
}

.ep-service__ico {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(240, 229, 219, 0.4);
  font-size: 0.82rem;
  flex-shrink: 0;
  transition: color 0.2s;
}

.ep-service--on .ep-service__ico {
  color: #da9c5f;
}

.ep-service__name {
  font-size: 0.82rem;
  font-weight: 500;
  color: rgba(240, 229, 219, 0.55);
  transition: color 0.2s;
}

.ep-service--on .ep-service__name {
  color: #f0e5db;
  font-weight: 600;
}

/* Actions */
.ep-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.5rem;
}

.ep-btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.8rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(218, 156, 95, 0.25);
  border-radius: 11px;
  color: rgba(240, 229, 219, 0.6);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.ep-btn-cancel:hover {
  background: rgba(218, 156, 95, 0.08);
  color: #f0e5db;
}

.ep-btn-submit {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0.8rem 1.75rem;
  background: linear-gradient(135deg, #da9c5f, #b8791f);
  border: none;
  border-radius: 11px;
  color: #1a0e0a;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(218, 156, 95, 0.4);
}

.ep-btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(218, 156, 95, 0.55);
  background: linear-gradient(135deg, #e0a96a, #c9851f);
}

.ep-btn-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .ep-shell {
    padding: 2rem 1.25rem 4rem;
  }

  .ep-grid {
    grid-template-columns: 1fr;
  }

  .ep-field--full {
    grid-column: 1;
  }

  .ep-actions {
    flex-direction: column;
  }

  .ep-btn-submit,
  .ep-btn-cancel {
    width: 100%;
    justify-content: center;
  }
}
</style>