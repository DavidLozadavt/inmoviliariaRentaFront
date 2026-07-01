<template>
  <div class="pd-page">
    <div class="pd-bg" aria-hidden="true">
      <div class="pd-bg__orb pd-bg__orb--1"></div>
      <div class="pd-bg__orb pd-bg__orb--2"></div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="pd-state">
      <div class="pd-spinner"></div>
      <p>{{ t('property.loadingDetails') }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="pd-state pd-state--error">
      <div class="pd-state__icon"><font-awesome-icon :icon="['fas', 'triangle-exclamation']" /></div>
      <h2>{{ t('property.notFound') }}</h2>
      <p>{{ error }}</p>
      <button @click="router.push('/')" class="pd-btn-back">
        <font-awesome-icon :icon="['fas', 'arrow-left']" />
        {{ t('property.backHome') }}
      </button>
    </div>

    <!-- Content -->
    <div v-else-if="property" class="pd-shell">

      <!-- ── Breadcrumb ── -->
      <nav class="pd-breadcrumb">
        <router-link to="/" class="pd-bc-item"><font-awesome-icon :icon="['fas', 'house']" /></router-link>
        <font-awesome-icon :icon="['fas', 'chevron-right']" class="pd-bc-sep" />
        <router-link to="/propiedades" class="pd-bc-item">{{ t('property.properties') }}</router-link>
        <font-awesome-icon :icon="['fas', 'chevron-right']" class="pd-bc-sep" />
        <span class="pd-bc-current">{{ property.title }}</span>
      </nav>

      <!-- ── Gallery ── -->
      <div class="pd-gallery">

        <!-- Main image -->
        <div class="pd-gallery__main">
          <Transition name="img-fade" mode="out-in">
            <img :key="currentImageIndex" :src="currentImage" :alt="property.title" @error="onImgError"
              class="pd-gallery__hero" />
          </Transition>

          <!-- Nav arrows -->
          <div class="pd-gallery__nav" v-if="propertyImages.length > 1">
            <button class="pd-nav-btn" :disabled="currentImageIndex === 0" @click="previousImage">
              <font-awesome-icon :icon="['fas', 'chevron-left']" />
            </button>
            <button class="pd-nav-btn" :disabled="currentImageIndex === propertyImages.length - 1" @click="nextImage">
              <font-awesome-icon :icon="['fas', 'chevron-right']" />
            </button>
          </div>

          <!-- Counter -->
          <div class="pd-gallery__counter">
            <font-awesome-icon :icon="['fas', 'images']" />
            {{ currentImageIndex + 1 }} / {{ propertyImages.length }}
          </div>

          <!-- Status badge -->
          <div :class="['pd-status-badge', `pd-status-badge--${property.status}`]">
            <font-awesome-icon :icon="getStatusIcon(property.status)" />
            {{ t(`property.status.${property.status}`) }}
          </div>
        </div>

        <!-- Thumbnails -->
        <div class="pd-thumbs" v-if="propertyImages.length > 1">
          <button v-for="(img, idx) in propertyImages" :key="idx"
            :class="['pd-thumb', { 'pd-thumb--active': currentImageIndex === idx }]" @click="currentImageIndex = idx">
            <img :src="img" :alt="`Foto ${idx + 1}`" @error="onImgError" />
          </button>
        </div>
      </div>

      <!-- ── Main Grid ── -->
      <div class="pd-grid">

        <!-- ── Left / Main column ── -->
        <div class="pd-main">

          <!-- Property Header -->
          <div class="pd-card pd-prop-header">
            <div class="pd-tags">
              <span class="pd-tag pd-tag--type">
                <font-awesome-icon :icon="['fas', getTypeIcon(property)]" />
                {{ getTypeTranslated(property) }}
              </span>
              <span v-if="property.featured" class="pd-tag pd-tag--gold">
                <font-awesome-icon :icon="['fas', 'star']" />
                {{ t('property.featured') }}
              </span>
              <span v-if="property.new_construction" class="pd-tag pd-tag--blue">
                <font-awesome-icon :icon="['fas', 'helmet-safety']" />
                {{ t('property.new') }}
              </span>
              <span v-if="property.pet_friendly" class="pd-tag pd-tag--green">
                <font-awesome-icon :icon="['fas', 'paw']" />
                {{ t('property.petFriendly') }}
              </span>
            </div>

            <h1 class="pd-prop-title">{{ property.title }}</h1>

            <div class="pd-location">
              <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="pd-location__ico" />
              <span>{{ property.address }}<span v-if="property.city">, {{ property.city }}</span></span>
            </div>

            <div class="pd-price-banner">
              <div class="pd-price-main">
                <span class="pd-price-label">{{ t('property.monthlyPrice') }}</span>
                <span class="pd-price-amount">{{ formatPrice(property.monthly_price) }}</span>
              </div>
              <div v-if="property.deposit_amount" class="pd-price-deposit">
                <span class="pd-deposit-label">{{ t('property.deposit') }}</span>
                <span class="pd-deposit-amount">{{ formatPrice(property.deposit_amount) }}</span>
              </div>
            </div>
          </div>

          <!-- Features Grid -->
          <div class="pd-card">
            <h2 class="pd-card__title">
              <font-awesome-icon :icon="['fas', 'list-check']" />
              {{ t('property.mainFeatures') }}
            </h2>
            <div class="pd-features-grid">
              <div class="pd-feature" v-if="property.area_m2">
                <div class="pd-feature__ico"><font-awesome-icon :icon="['fas', 'ruler-combined']" /></div>
                <div class="pd-feature__body">
                  <span class="pd-feature__val">{{ property.area_m2 }}</span>
                  <span class="pd-feature__lbl">{{ t('property.areaM2') }}</span>
                </div>
              </div>
              <div class="pd-feature" v-if="property.num_bedrooms">
                <div class="pd-feature__ico"><font-awesome-icon :icon="['fas', 'bed']" /></div>
                <div class="pd-feature__body">
                  <span class="pd-feature__val">{{ property.num_bedrooms }}</span>
                  <span class="pd-feature__lbl">{{ t('property.bedrooms') }}</span>
                </div>
              </div>
              <div class="pd-feature" v-if="property.num_bathrooms">
                <div class="pd-feature__ico"><font-awesome-icon :icon="['fas', 'bath']" /></div>
                <div class="pd-feature__body">
                  <span class="pd-feature__val">{{ property.num_bathrooms }}</span>
                  <span class="pd-feature__lbl">{{ t('property.bathrooms') }}</span>
                </div>
              </div>
              <div class="pd-feature" v-if="property.parking_spaces">
                <div class="pd-feature__ico"><font-awesome-icon :icon="['fas', 'square-parking']" /></div>
                <div class="pd-feature__body">
                  <span class="pd-feature__val">{{ property.parking_spaces }}</span>
                  <span class="pd-feature__lbl">{{ t('property.parkingSpaces') }}</span>
                </div>
              </div>
              <div class="pd-feature" v-if="property.floor_number">
                <div class="pd-feature__ico"><font-awesome-icon :icon="['fas', 'building']" /></div>
                <div class="pd-feature__body">
                  <span class="pd-feature__val">{{ t('property.floor', { number: property.floor_number }) }}</span>
                  <span class="pd-feature__lbl">{{ t('property.floorLabel') }}</span>
                </div>
              </div>
              <div class="pd-feature" v-if="property.year_built">
                <div class="pd-feature__ico"><font-awesome-icon :icon="['fas', 'calendar-days']" /></div>
                <div class="pd-feature__body">
                  <span class="pd-feature__val">{{ property.year_built }}</span>
                  <span class="pd-feature__lbl">{{ t('property.yearBuilt') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="pd-card">
            <h2 class="pd-card__title">
              <font-awesome-icon :icon="['fas', 'file-lines']" />
              {{ t('property.description') }}
            </h2>
            <p class="pd-description">{{ property.description || t('property.noDescription') }}</p>
          </div>

          <!-- Services -->
          <div class="pd-card" v-if="getServicesArray(property.included_services).length > 0">
            <h2 class="pd-card__title">
              <font-awesome-icon :icon="['fas', 'circle-check']" />
              {{ t('property.includedServices') }}
            </h2>
            <div class="pd-services-grid">
              <div v-for="service in getServicesArray(property.included_services)" :key="service"
                class="pd-service-item">
                <font-awesome-icon :icon="['fas', getServiceIcon(service)]" class="pd-service-ico" />
                <span>{{ service }}</span>
              </div>
            </div>
          </div>

          <!-- Map -->
          <div class="pd-card" v-if="property.lat && property.lng">
            <h2 class="pd-card__title">
              <font-awesome-icon :icon="['fas', 'map']" />
              {{ t('property.mapLocation') }}
            </h2>
            <div class="pd-map-wrap">
              <MapView :id="(property as any).id" :lat="(property as any).lat" :lng="(property as any).lng"
                :owner-id="(property as any).user_id" :title="property.title" :address="property.address" />
            </div>
            <div class="pd-coords">
              <font-awesome-icon :icon="['fas', 'location-dot']" />
              <span>{{ Number(property.lat).toFixed(6) }}, {{ Number(property.lng).toFixed(6) }}</span>
            </div>
          </div>

        </div>

        <!-- ── Sidebar ── -->
        <aside class="pd-sidebar">
          <div class="pd-contact-card">

            <!-- Owner actions -->
            <template
              v-if="(authUser as any)?.id && (property as any)?.user_id && (authUser as any).id === (property as any).user_id">
              <div class="pd-owner-chip">
                <font-awesome-icon :icon="['fas', 'crown']" />
                {{ t('property.contact.ownerProperty') }}
              </div>
              <div class="pd-owner-actions">
                <button class="pd-action-btn pd-action-btn--edit" @click="editProperty">
                  <font-awesome-icon :icon="['fas', 'pen-to-square']" />
                  {{ t('property.contact.editProperty') }}
                </button>
                <button class="pd-action-btn pd-action-btn--del" @click="deleteProperty">
                  <font-awesome-icon :icon="['fas', 'trash-can']" />
                  {{ t('property.contact.deleteProperty') }}
                </button>
              </div>
            </template>

            <!-- Visitor actions -->
            <template v-else>
              <div class="pd-contact-head">
                <h3>{{ t('property.contact.header') }}</h3>
                <p>{{ t('property.contact.subHeader') }}</p>
              </div>

              <button v-if="property?.status === 'available' && isAuthenticated" @click="openRequestVisitModal"
                class="pd-action-btn pd-action-btn--primary">
                <font-awesome-icon :icon="['fas', 'calendar-check']" />
                {{ t('property.contact.requestVisit') }}
              </button>

              <button v-else-if="property?.status === 'available' && !isAuthenticated" @click="openRequestVisitModal"
                class="pd-action-btn pd-action-btn--login">
                <font-awesome-icon :icon="['fas', 'right-to-bracket']" />
                {{ t('property.contact.login') }}
              </button>

              <div v-else class="pd-unavailable">
                <font-awesome-icon :icon="['fas', 'ban']" />
                <div>
                  <strong>{{ t('property.contact.notAvailable') }}</strong>
                  <p>{{ t('property.contact.notAvailableDesc') }}</p>
                </div>
              </div>
            </template>

            <button class="pd-action-btn pd-action-btn--phone" @click="contactAgent">
              <font-awesome-icon :icon="['fas', 'phone']" />
              {{ t('property.contact.contactAgent') }}
            </button>

            <div class="pd-secondary-btns">
              <button :class="['pd-icon-btn', { 'pd-icon-btn--active': isFavorite }]" @click="toggleFavorite">
                <font-awesome-icon :icon="isFavorite ? ['fas', 'heart'] : ['far', 'heart']" />
                <span>{{ isFavorite ? t('property.contact.saved') : t('property.contact.save') }}</span>
              </button>
              <button class="pd-icon-btn" @click="shareProperty">
                <font-awesome-icon :icon="['fas', 'share-nodes']" />
                <span>{{ t('property.contact.share') }}</span>
              </button>
            </div>

            <!-- Meta -->
            <div class="pd-meta">
              <div class="pd-meta-row">
                <font-awesome-icon :icon="['fas', 'clock']" />
                <span>{{ t('property.meta.published') }} {{ timeAgo(property.publication_date) }}</span>
              </div>
              <div class="pd-meta-row">
                <font-awesome-icon :icon="['fas', 'eye']" />
                <span>{{ property.views || 0 }} {{ t('property.meta.views') }}</span>
              </div>
              <div class="pd-meta-row">
                <font-awesome-icon :icon="['fas', 'hashtag']" />
                <span>{{ t('property.meta.id') }}: {{ (property as any).id }}</span>
              </div>
            </div>
          </div>

          <!-- ── Sidebar Mini Gallery ── -->
          <div class="pd-sidebar-gallery" v-if="propertyImages.length > 0">
            <div class="pd-sidebar-gallery__header">
              <font-awesome-icon :icon="['fas', 'images']" />
              <span>Explora los espacios</span>
            </div>
            <div class="pd-s-carousel">
              <div class="pd-s-carousel__track" :style="{ transform: `translateX(-${sidebarCarouselIndex * 100}%)` }">
                <div v-for="(img, idx) in propertyImages" :key="idx" class="pd-s-slide" @click="openLightbox(idx)">
                  <img :src="img" :alt="`Vista ${idx + 1}`" @error="onImgError" />
                  <div class="pd-s-slide-overlay">
                    <font-awesome-icon :icon="['fas', 'expand']" />
                  </div>
                </div>
              </div>

              <div class="pd-s-nav" v-if="propertyImages.length > 1">
                <button class="pd-s-nav-btn" @click="prevSidebarImg" :disabled="sidebarCarouselIndex === 0">
                  <font-awesome-icon :icon="['fas', 'chevron-left']" />
                </button>
                <div class="pd-s-dots">
                  <span v-for="(_, i) in propertyImages.slice(0, 5)" :key="i"
                    :class="['pd-s-dot', { 'pd-s-dot--active': sidebarCarouselIndex === i }]"></span>
                </div>
                <button class="pd-s-nav-btn" @click="nextSidebarImg"
                  :disabled="sidebarCarouselIndex === propertyImages.length - 1">
                  <font-awesome-icon :icon="['fas', 'chevron-right']" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Visit Modal -->
    <RequestVisitModal :open="showRequestModal" :property="property" @close="showRequestModal = false"
      @success="handleVisitRequestSuccess" />

    <!-- Immersive Lightbox -->
    <Transition name="lb-fade">
      <div v-if="showLightbox" class="pd-lightbox" @click.self="closeLightbox">
        <button class="lb-close" @click="closeLightbox">
          <font-awesome-icon :icon="['fas', 'times']" />
        </button>

        <div class="lb-content">
          <button class="lb-nav lb-nav--prev" @click="prevLightboxImg" v-if="propertyImages.length > 1">
            <font-awesome-icon :icon="['fas', 'chevron-left']" />
          </button>

          <div class="lb-main">
            <img :src="propertyImages[lightboxIndex]" :alt="property.title" class="lb-img" />
            <div class="lb-caption">
              <span>{{ property.title }}</span>
              <small>{{ lightboxIndex + 1 }} / {{ propertyImages.length }}</small>
            </div>
          </div>

          <button class="lb-nav lb-nav--next" @click="nextLightboxImg" v-if="propertyImages.length > 1">
            <font-awesome-icon :icon="['fas', 'chevron-right']" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import RequestVisitModal from '../../components/modals/ModalRequest/RequestVisitModal.vue'
import MapView from '../../components/modals/Maps/MapView.vue'
import api from '../../services/api'
import { useI18n } from 'vue-i18n'
import { getPropertyImages as getPropertyImagesUtil } from '../../utils/propertyUtils'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

const property = ref<any>(null)
const loading = ref(true)
const error = ref(null)
const currentImageIndex = ref(0)
const isFavorite = ref(false)
const showRequestModal = ref(false)
const authUser = ref<any>(null)

// Carousel & Lightbox State
const sidebarCarouselIndex = ref(0)
const showLightbox = ref(false)
const lightboxIndex = ref(0)

const DEFAULT_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMWEwZTBhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNkYTljNWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TaW4gaW1hZ2VuPC90ZXh0Pjwvc3ZnPg=="

const isAuthenticated = computed(() => !!(localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")))

const propertyImages = computed((): string[] => {
  return getPropertyImagesUtil(property.value, DEFAULT_IMAGE)
})

const currentImage = computed(() => propertyImages.value[currentImageIndex.value] || DEFAULT_IMAGE)

function checkAuthentication() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
  if (userStr) { try { authUser.value = JSON.parse(userStr) } catch { authUser.value = null } }
}

async function fetchProperty() {
  loading.value = true; error.value = null
  try {
    const response = await api.get(`/properties/${route.params.id}`)
    if (response.data.success && response.data.data) property.value = response.data.data
    else if (response.data.data) property.value = response.data.data
    else property.value = response.data
    await api.post(`/properties/${route.params.id}/views`)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'No se pudo cargar la propiedad'
  } finally {
    loading.value = false
  }
}

// Sidebar Carousel
function prevSidebarImg() { if (sidebarCarouselIndex.value > 0) sidebarCarouselIndex.value-- }
function nextSidebarImg() { if (sidebarCarouselIndex.value < propertyImages.value.length - 1) sidebarCarouselIndex.value++ }

// Lightbox
function openLightbox(index: number) {
  lightboxIndex.value = index
  showLightbox.value = true
  document.body.style.overflow = 'hidden'
}
function closeLightbox() {
  showLightbox.value = false
  document.body.style.overflow = 'auto'
}
function prevLightboxImg() {
  if (lightboxIndex.value > 0) lightboxIndex.value--
  else lightboxIndex.value = propertyImages.value.length - 1
}
function nextLightboxImg() {
  if (lightboxIndex.value < propertyImages.value.length - 1) lightboxIndex.value++
  else lightboxIndex.value = 0
}

function onImgError(event: any) { event.target.src = DEFAULT_IMAGE }
function previousImage() { if (currentImageIndex.value > 0) currentImageIndex.value-- }
function nextImage() { if (currentImageIndex.value < propertyImages.value.length - 1) currentImageIndex.value++ }

function openRequestVisitModal() {
  if (!isAuthenticated.value) {
    if (confirm(t('property.contact.loginRequired'))) {
      localStorage.setItem('redirectAfterLogin', route.fullPath)
      router.push({ name: 'Login' })
    }
    return
  }
  showRequestModal.value = true
}

const detectType = (p: any) => {
  if (!p) return 'otro'
  if (p.type) return p.type
  const title = (p.title || '').toLowerCase()
  if (title.includes('casa')) return 'casa'
  if (title.includes('apartamento') || title.includes('apto')) return 'apartamento'
  if (title.includes('local')) return 'local'
  if (title.includes('finca')) return 'finca'
  return 'otro'
}
const getTypeTranslated = (p: any) => {
  const type = detectType(p)
  const map: Record<string, string> = { casa: t('property.type.casa'), apartamento: t('property.type.apartamento'), local: t('property.type.local'), finca: t('property.type.finca'), otro: t('property.type.otro') }
  return map[type] || t('property.type.otro')
}
const getTypeIcon = (p: any) => {
  const type = p?.type || detectType(p)
  const map: Record<string, string> = { casa: 'house', apartamento: 'building', local: 'store', finca: 'tree', otro: 'house' }
  return map[type] || 'house'
}

function getStatusIcon(status: any): [string, string] {
  const map: Record<string, [string, string]> = {
    available: ['fas', 'circle-check'],
    rented: ['fas', 'circle-xmark'],
    reserved: ['fas', 'clock'],
    sold: ['fas', 'lock'],
    maintenance: ['fas', 'screwdriver-wrench'],
  }
  return map[status] || ['fas', 'circle-info']
}

function getServicesArray(services: any): string[] {
  if (!services) return []
  if (Array.isArray(services)) return services
  if (typeof services === 'string') return services.split(',').map((s: string) => s.trim()).filter(Boolean)
  return []
}

// Mapeo de valores de servicio a icono FA
function getServiceIcon(service: string): string {
  const map: Record<string, string> = {
    water: 'droplet', electricity: 'bolt', gas: 'fire', internet: 'wifi',
    cableTv: 'tv', cable_tv: 'tv', security: 'shield-halved', parking: 'square-parking',
    gym: 'dumbbell', pool: 'person-swimming', bbqArea: 'fire-burner', bbq_area: 'fire-burner',
    laundry: 'jug-detergent', elevator: 'elevator',
    Agua: 'droplet', Electricidad: 'bolt', Gas: 'fire', Internet: 'wifi',
    'Cable TV': 'tv', Seguridad: 'shield-halved', Parqueadero: 'square-parking',
    Gimnasio: 'dumbbell', Piscina: 'person-swimming', 'Zona BBQ': 'fire-burner',
    Lavandería: 'jug-detergent', Ascensor: 'elevator',
  }
  return map[service] || 'circle-check'
}

function handleVisitRequestSuccess() { showRequestModal.value = false; alert(t('visitRequest.success')) }
function contactAgent() { alert(t('property.contact.agentContact')) }
function toggleFavorite() { isFavorite.value = !isFavorite.value }
function shareProperty() {
  if (navigator.share && property.value) {
    navigator.share({ title: property.value.title, text: t('property.contact.shareText', { title: property.value.title }), url: window.location.href }).catch(() => { })
  } else {
    navigator.clipboard.writeText(window.location.href)
    alert(t('property.contact.linkCopied'))
  }
}
function editProperty() { router.push({ name: 'PropertyEdit', params: { id: property.value.id } }) }
async function deleteProperty() {
  if (!confirm(t('property.contact.deleteConfirm'))) return
  if (!confirm(t('property.contact.deleteFinalConfirm'))) return
  try {
    loading.value = true
    await api.delete(`/properties/${property.value.id}`)
    alert(t('property.contact.deleteSuccess'))
    router.push({ name: 'PropertyView' })
  } catch (err: any) {
    let msg = t('property.contact.deleteError')
    if (err.response?.status === 403) msg = t('property.contact.deleteNoPermission')
    else if (err.response?.status === 404) msg = t('property.contact.deleteNotFound')
    alert(msg)
  } finally {
    loading.value = false
  }
}
function formatPrice(price: any) {
  if (!price) return t('property.askPrice')
  const isEN = locale.value.startsWith('en')
  return new Intl.NumberFormat(isEN ? 'en-US' : 'es-CO', { style: 'currency', currency: isEN ? 'USD' : 'COP', minimumFractionDigits: 0 }).format(price)
}
function timeAgo(dateString: any) {
  if (!dateString) return ''
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000)
  if (diff === 0) return t('time.today')
  if (diff === 1) return t('time.yesterday')
  if (diff < 7) return t('time.daysAgo', diff)
  if (diff < 30) return t('time.weeksAgo', Math.floor(diff / 7))
  if (diff < 365) return t('time.monthsAgo', Math.floor(diff / 30))
  return t('time.yearsAgo', Math.floor(diff / 365))
}

onMounted(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); checkAuthentication(); fetchProperty() })
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   PROPERTY DETAIL VIEW
   • padding-top: 65px  →  navbar fixed
   • Paleta: #1a0e0a / #2e1d17 / #3b2416 + #da9c5f
   ══════════════════════════════════════════════════════════════ */
.pd-page {
  min-height: calc(100vh - 65px);
  padding-top: 65px;
  position: relative;
  overflow-x: hidden;
  background: linear-gradient(135deg, #1a0e0a 0%, #2e1d17 50%, #3b2416 100%);
}

.pd-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(26, 14, 10, 0.4) 0%, rgba(46, 29, 23, 0.4) 100%);
  opacity: 0.5;
  filter: blur(7px);
  pointer-events: none;
  z-index: 0;
}

/* Orbs */
.pd-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.pd-bg__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
}

.pd-bg__orb--1 {
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(218, 156, 95, 0.45), transparent);
  top: -180px;
  right: -180px;
}

.pd-bg__orb--2 {
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(184, 121, 31, 0.3), transparent);
  bottom: 20%;
  left: -140px;
}

/* State screens */
.pd-state {
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

.pd-spinner {
  width: 44px;
  height: 44px;
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

.pd-state p {
  font-size: 0.95rem;
  color: rgba(240, 229, 219, 0.5);
}

.pd-state h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f0e5db;
  margin: 0;
}

.pd-state__icon {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(231, 76, 60, 0.12);
  border: 1px solid rgba(231, 76, 60, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e74c3c;
  font-size: 1.6rem;
}

.pd-btn-back {
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
.pd-shell {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 2rem 5rem;
}

/* Breadcrumb */
.pd-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.pd-bc-item {
  font-size: 0.8rem;
  color: rgba(240, 229, 219, 0.4);
  text-decoration: none;
  transition: color 0.2s;
}

.pd-bc-item:hover {
  color: #da9c5f;
}

.pd-bc-sep {
  font-size: 0.6rem;
  color: rgba(240, 229, 219, 0.2);
}

.pd-bc-current {
  font-size: 0.8rem;
  color: #da9c5f;
  font-weight: 600;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Gallery ──────────────────────────────────────────────────── */
.pd-gallery {
  margin-bottom: 2rem;
}

.pd-gallery__main {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(26, 14, 10, 0.6);
  border: 1px solid rgba(218, 156, 95, 0.2);
  aspect-ratio: 16/7;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.pd-gallery__hero {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.img-fade-enter-active,
.img-fade-leave-active {
  transition: opacity 0.3s ease;
}

.img-fade-enter-from,
.img-fade-leave-to {
  opacity: 0;
}

/* Nav buttons */
.pd-gallery__nav {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  pointer-events: none;
}

.pd-nav-btn {
  pointer-events: all;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(26, 14, 10, 0.75);
  border: 1px solid rgba(218, 156, 95, 0.35);
  color: #f0e5db;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
  font-size: 0.9rem;
}

.pd-nav-btn:not(:disabled):hover {
  background: rgba(218, 156, 95, 0.2);
  border-color: rgba(218, 156, 95, 0.6);
  color: #da9c5f;
  transform: scale(1.05);
}

.pd-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Counter */
.pd-gallery__counter {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.3rem 0.85rem;
  background: rgba(26, 14, 10, 0.8);
  border: 1px solid rgba(218, 156, 95, 0.25);
  border-radius: 100px;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(240, 229, 219, 0.75);
  backdrop-filter: blur(8px);
}

/* Status badge */
.pd-status-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.35rem 0.9rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
}

.pd-status-badge--available {
  background: rgba(46, 204, 113, 0.2);
  border: 1px solid rgba(46, 204, 113, 0.4);
  color: #2ecc71;
}

.pd-status-badge--rented {
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid rgba(231, 76, 60, 0.4);
  color: #e74c3c;
}

.pd-status-badge--maintenance {
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #f59e0b;
}

.pd-status-badge--reserved {
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
}

/* Thumbnails */
.pd-thumbs {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.75rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.pd-thumbs::-webkit-scrollbar {
  display: none;
}

.pd-thumb {
  flex-shrink: 0;
  width: 80px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(218, 156, 95, 0.15);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  background: none;
}

.pd-thumb:hover {
  border-color: rgba(218, 156, 95, 0.5);
  transform: translateY(-2px);
}

.pd-thumb--active {
  border-color: #da9c5f;
  box-shadow: 0 0 0 2px rgba(218, 156, 95, 0.3);
}

.pd-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ── Main Grid ───────────────────────────────────────────────── */
.pd-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: start;
}

/* Cards */
.pd-card {
  background: linear-gradient(135deg, rgba(62, 36, 24, 0.95), rgba(46, 29, 23, 0.95));
  border: 1px solid rgba(218, 156, 95, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.25rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.pd-card__title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #da9c5f;
  margin: 0 0 1.1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgba(218, 156, 95, 0.15);
}

/* Property header card */
.pd-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.pd-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 700;
}

.pd-tag--type {
  background: rgba(218, 156, 95, 0.12);
  border: 1px solid rgba(218, 156, 95, 0.3);
  color: #da9c5f;
}

.pd-tag--gold {
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #fbbf24;
}

.pd-tag--blue {
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.pd-tag--green {
  background: rgba(46, 204, 113, 0.12);
  border: 1px solid rgba(46, 204, 113, 0.3);
  color: #2ecc71;
}

.pd-prop-title {
  font-size: clamp(1.5rem, 3.5vw, 2.2rem);
  font-weight: 800;
  color: #f0e5db;
  line-height: 1.2;
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 12px rgba(218, 156, 95, 0.25);
}

.pd-location {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: rgba(240, 229, 219, 0.55);
  font-size: 0.9rem;
  margin-bottom: 1.25rem;
}

.pd-location__ico {
  color: #da9c5f;
  flex-shrink: 0;
}

.pd-price-banner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.1rem 1.25rem;
  background: rgba(218, 156, 95, 0.08);
  border: 1px solid rgba(218, 156, 95, 0.25);
  border-radius: 12px;
  flex-wrap: wrap;
}

.pd-price-main,
.pd-price-deposit {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pd-price-label,
.pd-deposit-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(240, 229, 219, 0.4);
}

.pd-price-amount {
  font-size: 1.75rem;
  font-weight: 800;
  color: #da9c5f;
  line-height: 1;
  text-shadow: 0 2px 8px rgba(218, 156, 95, 0.4);
}

.pd-deposit-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(240, 229, 219, 0.65);
}

/* Features */
.pd-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.85rem;
}

.pd-feature {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(218, 156, 95, 0.15);
  border-radius: 12px;
  transition: all 0.2s;
}

.pd-feature:hover {
  border-color: rgba(218, 156, 95, 0.35);
  background: rgba(218, 156, 95, 0.06);
}

.pd-feature__ico {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(218, 156, 95, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #da9c5f;
  flex-shrink: 0;
}

.pd-feature__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pd-feature__val {
  font-size: 1.05rem;
  font-weight: 800;
  color: #f0e5db;
  line-height: 1;
}

.pd-feature__lbl {
  font-size: 0.72rem;
  font-weight: 500;
  color: rgba(240, 229, 219, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Description */
.pd-description {
  font-size: 0.92rem;
  color: rgba(240, 229, 219, 0.65);
  line-height: 1.8;
  margin: 0;
}

/* Services */
.pd-services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.6rem;
}

.pd-service-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.9rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(218, 156, 95, 0.15);
  border-radius: 9px;
  font-size: 0.84rem;
  color: rgba(240, 229, 219, 0.65);
}

.pd-service-ico {
  color: #da9c5f;
  font-size: 0.85rem;
  flex-shrink: 0;
}

/* Map */
.pd-map-wrap {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(218, 156, 95, 0.2);
  height: 320px;
  margin-bottom: 0.75rem;
}

.pd-coords {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: rgba(240, 229, 219, 0.35);
}

/* ── Sidebar / Contact Card ──────────────────────────────────── */
.pd-sidebar {
  position: sticky;
  top: calc(65px + 1.5rem);
}

.pd-contact-card {
  background: linear-gradient(135deg, rgba(62, 36, 24, 0.97), rgba(46, 29, 23, 0.97));
  border: 1px solid rgba(218, 156, 95, 0.25);
  border-radius: 18px;
  padding: 1.5rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.pd-contact-head h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f0e5db;
  margin: 0 0 0.25rem;
}

.pd-contact-head p {
  font-size: 0.82rem;
  color: rgba(240, 229, 219, 0.4);
  margin: 0;
}

/* Owner chip */
.pd-owner-chip {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  background: rgba(218, 156, 95, 0.1);
  border: 1px solid rgba(218, 156, 95, 0.3);
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #da9c5f;
}

.pd-owner-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* Action buttons */
.pd-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 0.85rem 1.25rem;
  border-radius: 11px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.pd-action-btn--primary {
  background: linear-gradient(135deg, #da9c5f, #b8791f);
  color: #1a0e0a;
  box-shadow: 0 4px 14px rgba(218, 156, 95, 0.4);
}

.pd-action-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(218, 156, 95, 0.55);
}

.pd-action-btn--login {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(79, 70, 229, 0.8));
  color: #fff;
  border: 1px solid rgba(99, 102, 241, 0.4);
}

.pd-action-btn--login:hover {
  transform: translateY(-2px);
}

.pd-action-btn--phone {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(218, 156, 95, 0.25) !important;
  color: rgba(240, 229, 219, 0.75);
}

.pd-action-btn--phone:hover {
  background: rgba(218, 156, 95, 0.08);
  color: #f0e5db;
  border-color: rgba(218, 156, 95, 0.5);
}

.pd-action-btn--edit {
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.pd-action-btn--edit:hover {
  background: rgba(99, 102, 241, 0.2);
}

.pd-action-btn--del {
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.25);
  color: #e74c3c;
}

.pd-action-btn--del:hover {
  background: rgba(231, 76, 60, 0.2);
}

/* Unavailable */
.pd-unavailable {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.2);
  border-radius: 10px;
  color: #e74c3c;
  font-size: 0.85rem;
}

.pd-unavailable strong {
  display: block;
  font-size: 0.88rem;
  margin-bottom: 0.2rem;
}

.pd-unavailable p {
  margin: 0;
  color: rgba(240, 229, 219, 0.5);
  font-size: 0.8rem;
}

/* Secondary buttons */
.pd-secondary-btns {
  display: flex;
  gap: 0.65rem;
}

.pd-icon-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(218, 156, 95, 0.18);
  border-radius: 10px;
  color: rgba(240, 229, 219, 0.5);
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.pd-icon-btn:hover {
  background: rgba(218, 156, 95, 0.08);
  color: #da9c5f;
  border-color: rgba(218, 156, 95, 0.4);
}

.pd-icon-btn--active {
  color: #e74c3c;
  border-color: rgba(231, 76, 60, 0.3);
  background: rgba(231, 76, 60, 0.07);
}

/* Sidebar Gallery */
.pd-sidebar-gallery {
  margin-top: 1.5rem;
  background: linear-gradient(135deg, rgba(62, 36, 24, 0.97), rgba(46, 29, 23, 0.97));
  border: 1px solid rgba(218, 156, 95, 0.25);
  border-radius: 18px;
  padding: 1rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.pd-sidebar-gallery__header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #da9c5f;
  font-size: 0.82rem;
  font-weight: 700;
  margin-bottom: 0.8rem;
  padding: 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pd-s-carousel {
  position: relative;
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}

.pd-s-carousel__track {
  display: flex;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.pd-s-slide {
  flex: 0 0 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
}

.pd-s-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pd-s-slide-overlay {
  position: absolute;
  inset: 0;
  background: rgba(26, 14, 10, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: #fff;
  font-size: 1.5rem;
}

.pd-s-slide:hover .pd-s-slide-overlay {
  opacity: 1;
}

.pd-s-nav {
  position: absolute;
  bottom: 10px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  pointer-events: none;
}

.pd-s-nav-btn {
  pointer-events: all;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(26, 14, 10, 0.8);
  border: 1px solid rgba(218, 156, 95, 0.4);
  color: #fff;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pd-s-nav-btn:hover:not(:disabled) {
  background: #da9c5f;
  color: #1a0e0a;
}

.pd-s-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pd-s-dots {
  display: flex;
  gap: 4px;
}

.pd-s-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.pd-s-dot--active {
  background: #da9c5f;
  width: 12px;
  border-radius: 10px;
}

/* Lightbox */
.pd-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(10, 5, 3, 0.92);
  backdrop-filter: blur(15px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.lb-close {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 100;
}

.lb-close:hover {
  background: #ef4444;
  transform: rotate(90deg);
}

.lb-content {
  position: relative;
  width: 100%;
  max-width: 1100px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.lb-main {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.lb-img {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(218, 156, 95, 0.2);
}

.lb-caption {
  text-align: center;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lb-caption span {
  font-weight: 700;
  font-size: 1.1rem;
}

.lb-caption small {
  color: #da9c5f;
  font-weight: 600;
}

.lb-nav {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(218, 156, 95, 0.1);
  border: 1px solid rgba(218, 156, 95, 0.3);
  color: #da9c5f;
  font-size: 1.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.lb-nav:hover {
  background: #da9c5f;
  color: #1a0e0a;
  transform: scale(1.1);
}

.lb-fade-enter-active,
.lb-fade-leave-active {
  transition: all 0.4s ease;
}

.lb-fade-enter-from,
.lb-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

/* Meta */
.pd-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(218, 156, 95, 0.12);
}

.pd-meta-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.78rem;
  color: rgba(240, 229, 219, 0.35);
}

.pd-meta-row svg {
  color: rgba(218, 156, 95, 0.5);
  flex-shrink: 0;
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .pd-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .pd-sidebar {
    position: static;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .pd-sidebar-gallery {
    order: -1;
    margin-top: 0;
  }
}

@media (max-width: 768px) {
  .pd-shell {
    padding: 1rem 1rem 4rem;
  }

  .pd-gallery__main {
    aspect-ratio: 16/10;
    border-radius: 12px;
  }

  .pd-prop-title {
    font-size: 1.5rem;
  }

  .pd-price-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem !important;
  }

  .pd-features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .pd-feature {
    padding: 0.85rem;
  }

  .pd-sidebar {
    margin-top: 1rem;
  }

  .pd-contact-card {
    padding: 1.5rem;
    border-radius: 16px;
  }

  /* Sticky contact button for mobile (Adjusted since bottom nav is gone) */
  .pd-action-btn--primary {
    position: fixed;
    bottom: 20px;
    left: 1rem;
    right: 1rem;
    z-index: 100;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    width: calc(100% - 2rem);
  }
}

@media (max-width: 480px) {
  .pd-gallery__main {
    aspect-ratio: 4/3;
  }

  .pd-tags {
    gap: 0.4rem;
  }

  .pd-tag {
    font-size: 0.7rem;
    padding: 0.35rem 0.7rem;
  }

  .pd-price-amount {
    font-size: 1.35rem;
  }

  .pd-description {
    font-size: 0.9rem;
  }

  .pd-sidebar-gallery {
    display: block !important; /* Asegurar que sea visible */
    order: -1 !important;     /* Posicionar arriba en móviles */
    margin-bottom: 1.5rem !important;
  }
}
</style>