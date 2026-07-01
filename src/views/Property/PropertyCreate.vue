<template>
  <div class="cp-page">
    <!-- Background -->
    <div class="cp-bg" aria-hidden="true">
      <div class="cp-bg__orb cp-bg__orb--1"></div>
      <div class="cp-bg__orb cp-bg__orb--2"></div>
    </div>

    <main class="cp-shell">

      <!-- ── Header ── -->
      <header class="cp-header">
        <span class="cp-eyebrow">
          <span class="ew-pip"></span>
          {{ t('property.create.eyebrow') }}
        </span>
        <h1 class="cp-title" v-html="t('property.create.title')"></h1>
        <p class="cp-subtitle">{{ t('property.create.subtitle') }}</p>
      </header>

      <!-- ── Alerts ── -->
      <Transition name="alert-slide">
        <div v-if="success" class="cp-alert cp-alert--success">
          <font-awesome-icon :icon="['fas', 'circle-check']" />
          <span>{{ t('property.create.success') }}</span>
        </div>
      </Transition>
      <Transition name="alert-slide">
        <div v-if="errorMessage" class="cp-alert cp-alert--error">
          <font-awesome-icon :icon="['fas', 'circle-exclamation']" />
          <span>{{ errorMessage }}</span>
        </div>
      </Transition>

      <!-- ── Form ── -->
      <form @submit.prevent="openLocationModal" class="cp-form">

        <!-- Información Básica -->
        <div class="cp-section">
          <div class="cp-section__head">
            <div class="cp-section__icon">
              <font-awesome-icon :icon="['fas', 'circle-info']" />
            </div>
            <div>
              <h2 class="cp-section__title">{{ t('property.create.basicInfo') }}</h2>
              <p class="cp-section__desc">{{ t('property.create.basicInfoDesc') }}</p>
            </div>
          </div>

          <div class="cp-grid">
            <div class="cp-field cp-field--full">
              <label for="title">
                {{ t('property.fields.title') }}
                <span class="req">*</span>
              </label>
              <input id="title" v-model="form.title" type="text" :placeholder="t('property.placeholders.title')"
                maxlength="255" required />
            </div>

            <div class="cp-field cp-field--full">
              <label for="description">
                {{ t('property.fields.description') }}
                <span class="req">*</span>
              </label>
              <textarea id="description" v-model="form.description" rows="5"
                :placeholder="t('property.placeholders.description')" required></textarea>
            </div>

            <div class="cp-field">
              <label for="status">{{ t('property.fields.status') }}</label>
              <select id="status" v-model="form.status">
                <option value="available">{{ t('property.status.available') }}</option>
                <option value="rented">{{ t('property.status.rented') }}</option>
                <option value="maintenance">{{ t('property.status.maintenance') }}</option>
              </select>
            </div>

            <div class="cp-field">
              <label for="publication_date">{{ t('property.fields.publicationDate') }}</label>
              <input id="publication_date" v-model="form.publication_date" type="date" />
            </div>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="cp-section">
          <div class="cp-section__head">
            <div class="cp-section__icon">
              <font-awesome-icon :icon="['fas', 'map-location-dot']" />
            </div>
            <div>
              <h2 class="cp-section__title">{{ t('property.create.location') }}</h2>
              <p class="cp-section__desc">{{ t('property.create.locationDesc') }}</p>
            </div>
          </div>

          <div class="cp-grid">
            <div class="cp-field">
              <label for="address">
                {{ t('property.fields.address') }}
                <span class="req">*</span>
              </label>
              <input id="address" v-model="form.address" type="text" :placeholder="t('property.placeholders.address')"
                required />
            </div>

            <div class="cp-field">
              <label for="city">{{ t('property.fields.city') }}</label>
              <input id="city" v-model="form.city" type="text" :placeholder="t('property.placeholders.city')"
                maxlength="120" />
            </div>
          </div>

          <div class="cp-info-banner">
            <font-awesome-icon :icon="['fas', 'lightbulb']" />
            <span>{{ t('property.create.locationExactHint') }}</span>
          </div>
        </div>

        <!-- Características -->
        <div class="cp-section">
          <div class="cp-section__head">
            <div class="cp-section__icon">
              <font-awesome-icon :icon="['fas', 'sliders']" />
            </div>
            <div>
              <h2 class="cp-section__title">{{ t('property.create.features') }}</h2>
              <p class="cp-section__desc">{{ t('property.create.featuresDesc') }}</p>
            </div>
          </div>

          <div class="cp-grid">
            <div class="cp-field">
              <label for="monthly_price">
                {{ t('property.fields.monthlyPrice') }}
                <span class="req">*</span>
              </label>
              <div class="cp-input-addon">
                <span class="cp-addon cp-addon--left">$</span>
                <input id="monthly_price" v-model="displayPrice" type="text"
                  :placeholder="t('property.placeholders.price')" required @input="handlePriceInput"
                  @blur="formatPriceOnBlur" />
              </div>
              <span class="cp-help">{{ formattedPrice }}</span>
            </div>

            <div class="cp-field">
              <label for="area_m2">{{ t('property.fields.area') }}</label>
              <div class="cp-input-addon">
                <input id="area_m2" v-model.number="form.area_m2" type="number" step="0.01" min="0"
                  :placeholder="t('property.placeholders.area')" />
                <span class="cp-addon cp-addon--right">m²</span>
              </div>
            </div>

            <div class="cp-field">
              <label for="num_bedrooms">{{ t('property.fields.bedrooms') }}</label>
              <div class="cp-icon-input">
                <font-awesome-icon :icon="['fas', 'bed']" class="cp-input-ico" />
                <input id="num_bedrooms" v-model.number="form.num_bedrooms" type="number" min="0"
                  :placeholder="t('property.placeholders.bedrooms')" />
              </div>
            </div>

            <div class="cp-field">
              <label for="num_bathrooms">{{ t('property.fields.bathrooms') }}</label>
              <div class="cp-icon-input">
                <font-awesome-icon :icon="['fas', 'bath']" class="cp-input-ico" />
                <input id="num_bathrooms" v-model.number="form.num_bathrooms" type="number" min="0"
                  :placeholder="t('property.placeholders.bathrooms')" />
              </div>
            </div>
          </div>
        </div>

        <!-- Servicios -->
        <div class="cp-section">
          <div class="cp-section__head">
            <div class="cp-section__icon">
              <font-awesome-icon :icon="['fas', 'square-check']" />
            </div>
            <div>
              <h2 class="cp-section__title">{{ t('property.create.services') }}</h2>
              <p class="cp-section__desc">{{ t('property.create.servicesDesc') }}</p>
            </div>
          </div>

          <div class="cp-services-grid">
            <label v-for="service in AVAILABLE_SERVICES" :key="service.value"
              :class="['cp-service', { 'cp-service--on': form.included_services.includes(service.value) }]">
              <input type="checkbox" :value="service.value" v-model="form.included_services"
                class="cp-service__native" />
              <span class="cp-service__check">
                <font-awesome-icon :icon="form.included_services.includes(service.value)
                  ? ['fas', 'circle-check']
                  : ['far', 'circle']" />
              </span>
              <span class="cp-service__ico">
                <font-awesome-icon :icon="['fas', service.faIcon]" />
              </span>
              <span class="cp-service__name">{{ t(service.labelKey) }}</span>
            </label>
          </div>

          <div v-if="form.included_services.length > 0" class="cp-services-summary">
            <span>
              <font-awesome-icon :icon="['fas', 'check']" />
              {{ form.included_services.length }}
              {{ form.included_services.length === 1 ? t('property.create.serviceSelected') :
                t('property.create.servicesSelected') }}
            </span>
            <button type="button" class="cp-btn-clear" @click="form.included_services = []">
              {{ t('property.create.clearSelection') }}
            </button>
          </div>
          <div v-else class="cp-services-hint">
            <font-awesome-icon :icon="['fas', 'circle-info']" />
            <span>{{ t('property.create.noServicesSelected') }}</span>
          </div>
        </div>

        <!-- Imágenes -->
        <div class="cp-section">
          <div class="cp-section__head">
            <div class="cp-section__icon">
              <font-awesome-icon :icon="['fas', 'images']" />
            </div>
            <div>
              <h2 class="cp-section__title">{{ t('property.create.imagesTitle') }}</h2>
              <p class="cp-section__desc">{{ t('property.create.imagesDesc') }}</p>
            </div>
          </div>

          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple class="cp-file-hidden"
            @change="handleImageSelection" />

          <div :class="['cp-dropzone', { 'cp-dropzone--dragging': isDragging }]" @click="triggerFileInput"
            @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop">
            <font-awesome-icon :icon="['fas', 'cloud-arrow-up']" class="cp-dropzone__ico" />
            <h4>{{ t('property.create.dropzoneTitle') }}</h4>
            <p>{{ t('property.create.dropzoneDesc', { current: images.length }) }}</p>
          </div>

          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="cp-progress">
            <div class="cp-progress__bar" :style="{ width: uploadProgress + '%' }"></div>
            <span>{{ uploadProgress }}%</span>
          </div>

          <!-- Grid de imágenes -->
          <TransitionGroup name="img-list" tag="div" class="cp-images-grid">
            <div v-for="(image, index) in images" :key="image.id"
              :class="['cp-img-card', { 'cp-img-card--main': index === 0 }]">
              <div class="cp-img-preview">
                <img :src="image.preview" :alt="`Imagen ${index + 1}`" />
                <div v-if="index === 0" class="cp-img-badge">
                  <font-awesome-icon :icon="['fas', 'star']" />
                  {{ t('property.create.mainImage') }}
                </div>
                <div class="cp-img-overlay">
                  <button v-if="index !== 0" type="button" class="cp-img-btn" :title="t('property.create.setAsMain')"
                    @click="setAsMain(index)">
                    <font-awesome-icon :icon="['fas', 'star']" />
                  </button>
                  <button type="button" class="cp-img-btn cp-img-btn--del" :title="t('property.create.deleteImage')"
                    @click="removeImage(index)">
                    <font-awesome-icon :icon="['fas', 'trash']" />
                  </button>
                </div>
              </div>
              <div class="cp-img-footer">
                <span class="cp-img-num">#{{ index + 1 }}</span>
                <span class="cp-img-size">{{ formatFileSize(image.size) }}</span>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="images.length === 0" class="cp-no-images">
            <font-awesome-icon :icon="['fas', 'image']" class="cp-no-images__ico" />
            <h4>{{ t('property.create.noImagesTitle') }}</h4>
            <p>{{ t('property.create.noImagesDesc') }}</p>
          </div>
        </div>

        <!-- Acciones -->
        <div class="cp-actions">
          <button type="button" class="cp-btn-secondary" :disabled="loading" @click="cancelForm">
            <font-awesome-icon :icon="['fas', 'xmark']" />
            {{ t('common.cancel') }}
          </button>
          <button type="submit" class="cp-btn-primary" :disabled="loading || images.length === 0">
            <font-awesome-icon :icon="loading ? ['fas', 'spinner'] : ['fas', 'map-location-dot']" :spin="loading" />
            {{ loading ? t('property.create.processing') : t('property.create.continueLocation') }}
          </button>
        </div>

      </form>
    </main>

    <!-- Modal ubicación -->
    <PropertyLocationModal :show="showLocationModal"
      :property-data="{ title: form.title, city: form.city, address: form.address }" @confirm="handleLocationConfirm"
      @close="handleLocationCancel" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'
import { useAlerts } from '../../composables/useAlerts'
import { useI18n } from 'vue-i18n'
import PropertyLocationModal from '../../admin/components/Properties/PropertyLocationModal.vue'

interface PropertyImage {
  id: string
  file: File
  preview: string
  size: number
}

interface PropertyForm {
  title: string
  description: string
  address: string
  city: string
  status: string
  monthly_price: number
  area_m2: number | null
  num_bedrooms: number | null
  num_bathrooms: number | null
  included_services: string[]
  publication_date: string
}

// Font Awesome icons por servicio (sin emojis)
const AVAILABLE_SERVICES = [
  { value: 'water', faIcon: 'droplet', labelKey: 'editProperty.services.water' },
  { value: 'electricity', faIcon: 'bolt', labelKey: 'editProperty.services.electricity' },
  { value: 'gas', faIcon: 'fire', labelKey: 'editProperty.services.gas' },
  { value: 'internet', faIcon: 'wifi', labelKey: 'editProperty.services.internet' },
  { value: 'cableTv', faIcon: 'tv', labelKey: 'editProperty.services.cableTv' },
  { value: 'security', faIcon: 'shield-halved', labelKey: 'editProperty.services.security' },
  { value: 'parking', faIcon: 'square-parking', labelKey: 'editProperty.services.parking' },
  { value: 'gym', faIcon: 'dumbbell', labelKey: 'editProperty.services.gym' },
  { value: 'pool', faIcon: 'person-swimming', labelKey: 'editProperty.services.pool' },
  { value: 'bbqArea', faIcon: 'fire-burner', labelKey: 'editProperty.services.bbqArea' },
  { value: 'laundry', faIcon: 'jug-detergent', labelKey: 'editProperty.services.laundry' },
  { value: 'elevator', faIcon: 'elevator', labelKey: 'editProperty.services.elevator' },
]

const { t } = useI18n()
const router = useRouter()
const { success: successAlert, error: errorAlert, confirm } = useAlerts()

const form = ref<PropertyForm>({
  title: '', description: '', address: '', city: '',
  status: 'available', monthly_price: 0,
  area_m2: null, num_bedrooms: null, num_bathrooms: null,
  included_services: [], publication_date: '',
})

const images = ref<PropertyImage[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const displayPrice = ref('')
const loading = ref(false)
const errorMessage = ref('')
const success = ref(false)
const showLocationModal = ref(false)
const isDragging = ref(false)
const uploadProgress = ref(0)

const formattedPrice = computed(() => {
  if (!form.value.monthly_price) return 'COP $0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(form.value.monthly_price)
})

const formatNumber = (value: number): string => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const handlePriceInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/[^\d]/g, '')
  const numericValue = parseInt(value) || 0
  form.value.monthly_price = numericValue
  displayPrice.value = formatNumber(numericValue)
  setTimeout(() => input.setSelectionRange(displayPrice.value.length, displayPrice.value.length), 0)
}

const formatPriceOnBlur = () => {
  displayPrice.value = form.value.monthly_price > 0 ? formatNumber(form.value.monthly_price) : ''
}

const triggerFileInput = () => fileInput.value?.click()

const handleImageSelection = async (event: Event) => {
  const target = event.target as HTMLInputElement
  await processFiles(Array.from(target.files || []))
  if (fileInput.value) fileInput.value.value = ''
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  await processFiles(Array.from(event.dataTransfer?.files || []))
}

const processFiles = async (files: File[]) => {
  if (!files.length) return
  if (images.value.length + files.length > 10) {
    errorAlert(t('property.create.errors.maxImages'), t('property.create.errors.limitReached')); return
  }
  uploadProgress.value = 0
  let processed = 0
  for (const file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      errorAlert(`${file.name}: ${t('property.create.errors.invalidFormat')}`, t('property.create.errorTitle')); continue
    }
    if (file.size > 2 * 1024 * 1024) {
      errorAlert(`${file.name}: ${t('property.create.errors.maxSize')}`, t('property.create.errorTitle')); continue
    }
    images.value.push({ id: `${Date.now()}-${Math.random()}`, file, preview: URL.createObjectURL(file), size: file.size })
    uploadProgress.value = Math.round((++processed / files.length) * 100)
  }
  setTimeout(() => { uploadProgress.value = 0 }, 1000)
}

const removeImage = (index: number) => {
  URL.revokeObjectURL(images.value[index].preview)
  images.value.splice(index, 1)
}

const setAsMain = (index: number) => {
  const img = images.value.splice(index, 1)[0]
  images.value.unshift(img)
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const cancelForm = () => {
  confirm(
    t('property.create.confirmCancel'),
    () => { images.value.forEach(i => URL.revokeObjectURL(i.preview)); router.back() },
    () => { },
    { title: t('property.create.cancelTitle'), confirmText: t('common.yes'), cancelText: t('common.no') }
  )
}

const openLocationModal = () => {
  if (!form.value.title || !form.value.description || !form.value.address) {
    errorAlert(t('property.create.errors.incompleteFields'), t('property.create.errors.incompleteTitle')); return
  }
  if (!form.value.monthly_price) {
    errorAlert(t('property.create.errors.priceRequired'), t('property.create.errors.priceTitle')); return
  }
  if (!images.value.length) {
    errorAlert(t('property.create.errors.imageRequired'), t('property.create.errors.imageTitle')); return
  }
  showLocationModal.value = true
}

const handleLocationConfirm = async (locationData: { lat: number; lng: number; accuracy: number }) => {
  loading.value = true; errorMessage.value = ''; success.value = false
  try {
    const fd = new FormData()
    fd.append('title', form.value.title)
    fd.append('description', form.value.description)
    fd.append('address', form.value.address)
    if (form.value.city) fd.append('city', form.value.city)
    fd.append('status', form.value.status)
    fd.append('monthly_price', form.value.monthly_price.toString())
    if (form.value.area_m2) fd.append('area_m2', form.value.area_m2.toString())
    if (form.value.num_bedrooms) fd.append('num_bedrooms', form.value.num_bedrooms.toString())
    if (form.value.num_bathrooms) fd.append('num_bathrooms', form.value.num_bathrooms.toString())
    if (form.value.included_services.length) fd.append('included_services', JSON.stringify(form.value.included_services))
    if (form.value.publication_date) fd.append('publication_date', form.value.publication_date)
    fd.append('lat', locationData.lat.toString())
    fd.append('lng', locationData.lng.toString())
    fd.append('accuracy', locationData.accuracy.toString())
    images.value.forEach(img => fd.append('images[]', img.file))

    await api.post('/properties', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
      onUploadProgress: (e) => { if (e.total) uploadProgress.value = Math.round((e.loaded * 100) / e.total) }
    })

    success.value = true
    successAlert(t('property.create.successMessage'), t('property.create.successTitle'))
    showLocationModal.value = false
    images.value.forEach(i => URL.revokeObjectURL(i.preview))
    setTimeout(() => router.push('/propiedades'), 1500)
  } catch (err: any) {
    const d = err.response?.data
    if (d?.errors) errorMessage.value = Object.values(d.errors).flat().join(', ')
    else errorMessage.value = d?.message || t('property.create.errorMessage')
    errorAlert(errorMessage.value, t('property.create.errorTitle'))
  } finally {
    loading.value = false
  }
}

const handleLocationCancel = () => { showLocationModal.value = false }
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   CREATE PROPERTY VIEW
   • Paleta: #1a0e0a / #2e1d17 / #3b2416 + #da9c5f
   • Navbar: padding-top 65px
   ══════════════════════════════════════════════════════════════ */

.cp-page {
  min-height: calc(100vh - 65px);
  padding-top: 65px;
  position: relative;
  overflow-x: hidden;
  background: linear-gradient(135deg, #1a0e0a 0%, #2e1d17 50%, #3b2416 100%);
}

.cp-page::before {
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
.cp-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.cp-bg__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
}

.cp-bg__orb--1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(218, 156, 95, 0.5), transparent);
  top: -200px;
  right: -200px;
}

.cp-bg__orb--2 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(184, 121, 31, 0.35), transparent);
  bottom: -120px;
  left: -120px;
}

/* Shell */
.cp-shell {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 2rem 5rem;
}

/* ── Header ──────────────────────────────────────────────────── */
.cp-header {
  margin-bottom: 2.5rem;
}

.cp-eyebrow {
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

.cp-title {
  font-size: clamp(2rem, 5vw, 2.8rem);
  font-weight: 800;
  color: #f0e5db;
  line-height: 1.15;
  margin: 0 0 0.4rem;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 20px rgba(218, 156, 95, 0.35), 0 0 40px rgba(218, 156, 95, 0.15);
}

.cp-title em {
  font-style: italic;
  color: #da9c5f;
  font-weight: 500;
}

.cp-subtitle {
  font-size: 0.95rem;
  color: rgba(240, 229, 219, 0.5);
  margin: 0;
}

/* ── Alerts ──────────────────────────────────────────────────── */
.cp-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1.25rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.cp-alert--success {
  background: rgba(46, 204, 113, 0.12);
  border: 1px solid rgba(46, 204, 113, 0.3);
  color: #2ecc71;
}

.cp-alert--error {
  background: rgba(231, 76, 60, 0.12);
  border: 1px solid rgba(231, 76, 60, 0.3);
  color: #e74c3c;
}

.alert-slide-enter-active,
.alert-slide-leave-active {
  transition: all 0.3s ease;
}

.alert-slide-enter-from,
.alert-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Sections ────────────────────────────────────────────────── */
.cp-section {
  background: linear-gradient(135deg, rgba(62, 36, 24, 0.95), rgba(46, 29, 23, 0.95));
  border: 1px solid rgba(218, 156, 95, 0.2);
  border-radius: 18px;
  padding: 1.75rem;
  margin-bottom: 1.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.cp-section__head {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(218, 156, 95, 0.15);
}

.cp-section__icon {
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
  font-size: 1rem;
}

.cp-section__title {
  font-size: 1rem;
  font-weight: 700;
  color: #f0e5db;
  margin: 0 0 0.2rem;
}

.cp-section__desc {
  font-size: 0.82rem;
  color: rgba(240, 229, 219, 0.4);
  margin: 0;
}

/* ── Grid & Fields ───────────────────────────────────────────── */
.cp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.cp-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.cp-field--full {
  grid-column: 1 / -1;
}

.cp-field label {
  font-size: 0.79rem;
  font-weight: 700;
  color: rgba(240, 229, 219, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.req {
  color: #e74c3c;
  margin-left: 3px;
}

.cp-field input,
.cp-field textarea,
.cp-field select {
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

.cp-field input::placeholder,
.cp-field textarea::placeholder {
  color: rgba(240, 229, 219, 0.25);
}

.cp-field input:focus,
.cp-field textarea:focus,
.cp-field select:focus {
  outline: none;
  border-color: rgba(218, 156, 95, 0.6);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 0 3px rgba(218, 156, 95, 0.1);
}

.cp-field select {
  cursor: pointer;
}

.cp-field select option {
  background: #2e1d17;
  color: #f0e5db;
}

.cp-field textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
}

.cp-help {
  font-size: 0.78rem;
  color: #2ecc71;
  font-weight: 600;
}

/* Input con addon */
.cp-input-addon {
  display: flex;
  align-items: stretch;
  border: 1px solid rgba(218, 156, 95, 0.22);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: rgba(255, 255, 255, 0.05);
}

.cp-input-addon:focus-within {
  border-color: rgba(218, 156, 95, 0.6);
  box-shadow: 0 0 0 3px rgba(218, 156, 95, 0.1);
}

.cp-input-addon input {
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.cp-input-addon input:focus {
  box-shadow: none;
}

.cp-addon {
  display: flex;
  align-items: center;
  padding: 0 0.85rem;
  background: rgba(218, 156, 95, 0.1);
  color: #da9c5f;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* Input con icon */
.cp-icon-input {
  position: relative;
}

.cp-input-ico {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(218, 156, 95, 0.5);
  pointer-events: none;
  font-size: 0.9rem;
}

.cp-icon-input input {
  padding-left: 2.75rem;
}

/* Banner info */
.cp-info-banner {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  background: rgba(218, 156, 95, 0.08);
  border: 1px solid rgba(218, 156, 95, 0.2);
  border-radius: 10px;
  color: rgba(240, 229, 219, 0.6);
  font-size: 0.84rem;
}

.cp-info-banner svg {
  color: #da9c5f;
  flex-shrink: 0;
}

/* ── Servicios ───────────────────────────────────────────────── */
.cp-services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.cp-service {
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

.cp-service:hover {
  border-color: rgba(218, 156, 95, 0.4);
  background: rgba(218, 156, 95, 0.06);
  transform: translateY(-1px);
}

.cp-service--on {
  border-color: rgba(218, 156, 95, 0.55);
  background: rgba(218, 156, 95, 0.1);
  box-shadow: 0 0 0 2px rgba(218, 156, 95, 0.12);
}

.cp-service__native {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.cp-service__check {
  color: rgba(240, 229, 219, 0.25);
  font-size: 0.9rem;
  flex-shrink: 0;
  transition: color 0.2s;
}

.cp-service--on .cp-service__check {
  color: #da9c5f;
}

.cp-service__ico {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(240, 229, 219, 0.4);
  font-size: 0.85rem;
  flex-shrink: 0;
  transition: color 0.2s;
}

.cp-service--on .cp-service__ico {
  color: #da9c5f;
}

.cp-service__name {
  font-size: 0.82rem;
  font-weight: 500;
  color: rgba(240, 229, 219, 0.55);
  transition: color 0.2s;
}

.cp-service--on .cp-service__name {
  color: #f0e5db;
  font-weight: 600;
}

.cp-services-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  background: rgba(218, 156, 95, 0.08);
  border: 1px solid rgba(218, 156, 95, 0.25);
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #da9c5f;
  gap: 1rem;
}

.cp-btn-clear {
  background: none;
  border: 1px solid rgba(218, 156, 95, 0.3);
  color: rgba(218, 156, 95, 0.7);
  font-family: inherit;
  font-size: 0.78rem;
  padding: 0.3rem 0.8rem;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s;
}

.cp-btn-clear:hover {
  color: #da9c5f;
  border-color: rgba(218, 156, 95, 0.6);
  background: rgba(218, 156, 95, 0.08);
}

.cp-services-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: rgba(240, 229, 219, 0.3);
}

/* ── Imágenes ────────────────────────────────────────────────── */
.cp-file-hidden {
  display: none;
}

.cp-dropzone {
  border: 2px dashed rgba(218, 156, 95, 0.3);
  border-radius: 14px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s;
  margin-bottom: 1.5rem;
}

.cp-dropzone:hover,
.cp-dropzone--dragging {
  border-color: rgba(218, 156, 95, 0.65);
  background: rgba(218, 156, 95, 0.05);
  transform: translateY(-2px);
}

.cp-dropzone__ico {
  font-size: 2.8rem;
  color: rgba(218, 156, 95, 0.5);
  margin-bottom: 0.75rem;
  display: block;
}

.cp-dropzone h4 {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(240, 229, 219, 0.65);
  margin: 0 0 0.4rem;
}

.cp-dropzone p {
  font-size: 0.82rem;
  color: rgba(240, 229, 219, 0.3);
  margin: 0;
}

.cp-progress {
  position: relative;
  height: 7px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 100px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.cp-progress__bar {
  height: 100%;
  background: linear-gradient(90deg, #da9c5f, #b8791f);
  border-radius: 100px;
  transition: width 0.3s;
}

.cp-progress span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.7rem;
  font-weight: 700;
  color: #f0e5db;
}

.cp-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 1.25rem;
}

.cp-img-card {
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(218, 156, 95, 0.15);
  transition: all 0.3s;
}

.cp-img-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.cp-img-card--main {
  border-color: #da9c5f;
  box-shadow: 0 0 0 2px rgba(218, 156, 95, 0.35);
}

.cp-img-preview {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.cp-img-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cp-img-badge {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  background: linear-gradient(135deg, #da9c5f, #b8791f);
  color: #1a0e0a;
  padding: 0.3rem 0.65rem;
  border-radius: 7px;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cp-img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  opacity: 0;
  transition: opacity 0.25s;
}

.cp-img-card:hover .cp-img-overlay {
  opacity: 1;
}

.cp-img-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: none;
  color: #1a0e0a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.cp-img-btn:hover {
  transform: scale(1.1);
}

.cp-img-btn--del {
  background: rgba(231, 76, 60, 0.92);
  color: #fff;
}

.cp-img-btn--del:hover {
  background: #e74c3c;
}

.cp-img-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.85rem;
  border-top: 1px solid rgba(218, 156, 95, 0.12);
}

.cp-img-num {
  font-size: 0.8rem;
  font-weight: 700;
  color: #da9c5f;
}

.cp-img-size {
  font-size: 0.72rem;
  color: rgba(240, 229, 219, 0.35);
}

.cp-no-images {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 2rem;
  border: 2px dashed rgba(218, 156, 95, 0.15);
  border-radius: 14px;
  text-align: center;
}

.cp-no-images__ico {
  font-size: 3.5rem;
  color: rgba(218, 156, 95, 0.2);
}

.cp-no-images h4 {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(240, 229, 219, 0.4);
  margin: 0;
}

.cp-no-images p {
  font-size: 0.85rem;
  color: rgba(240, 229, 219, 0.25);
  margin: 0;
}

/* Transitions */
.img-list-enter-active,
.img-list-leave-active {
  transition: all 0.35s ease;
}

.img-list-enter-from {
  opacity: 0;
  transform: scale(0.85) translateY(16px);
}

.img-list-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(-16px);
}

.img-list-move {
  transition: transform 0.35s ease;
}

/* ── Acciones ────────────────────────────────────────────────── */
.cp-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.5rem;
}

.cp-btn-secondary {
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

.cp-btn-secondary:hover:not(:disabled) {
  background: rgba(218, 156, 95, 0.08);
  color: #f0e5db;
}

.cp-btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cp-btn-primary {
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

.cp-btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(218, 156, 95, 0.55);
  background: linear-gradient(135deg, #e0a96a, #c9851f);
}

.cp-btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 768px) {
  .cp-shell {
    padding: 2rem 1.25rem 4rem;
  }

  .cp-grid {
    grid-template-columns: 1fr;
  }

  .cp-field--full {
    grid-column: 1;
  }

  .cp-images-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .cp-actions {
    flex-direction: column;
  }

  .cp-btn-primary,
  .cp-btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 500px) {
  .cp-shell {
    padding: 1.5rem 1rem 3.5rem;
  }

  .cp-services-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>