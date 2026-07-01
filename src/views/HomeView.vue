<template>
  <div class="container">
    <!-- Partículas de fondo animadas -->
    <div class="particles-background">
      <div class="particle" v-for="n in 20" :key="n" :style="getParticleStyle(n)"></div>
    </div>

    <!-- Hero Section Moderna -->
    <section class="modern-hero">
      <div class="hero-background">
        <div class="gradient-orb orb-1"></div>
        <div class="gradient-orb orb-2"></div>
        <div class="gradient-orb orb-3"></div>
      </div>

      <div class="hero-content-wrapper">
        <div class="hero-text-section" data-aos="fade-right">
          <div class="hero-badge">
            <font-awesome-icon :icon="['fas', 'star']" class="badge-icon" />
            <span>{{ $t('home.hero.badge') }}</span>
          </div>

          <h1 class="hero-title">
            {{ $t('home.hero.title') }}
            <span class="gradient-text"> {{ $t('home.hero.titleHighlight') }}</span>
            <br />{{ $t('home.hero.titleEnd') }}
          </h1>

          <p class="hero-description">
            {{ $t('home.hero.description') }}
          </p>

          <!-- Stats en el hero -->
          <div class="hero-stats-inline">
            <div class="stat-inline-item">
              <div class="stat-inline-icon">
                <font-awesome-icon :icon="['fas', 'home']" />
              </div>
              <div class="stat-inline-content">
                <div class="stat-inline-number">
                  <template v-if="loadingProperties">
                    <div class="mini-loader"></div>
                  </template>
                  <template v-else>{{ propertyCount.toLocaleString() }}+</template>
                </div>
                <div class="stat-inline-label">{{ $t('home.hero.stats.properties') }}</div>
              </div>
            </div>

            <div class="stat-inline-item">
              <div class="stat-inline-icon">
                <font-awesome-icon :icon="['fas', 'check-circle']" />
              </div>
              <div class="stat-inline-content">
                <div class="stat-inline-number">
                  <template v-if="loadingProperties">
                    <div class="mini-loader"></div>
                  </template>
                  <template v-else>{{ activeClientsCount.toLocaleString() }}+</template>
                </div>
                <div class="stat-inline-label">{{ $t('home.hero.stats.clients') }}</div>
              </div>
            </div>

            <div class="stat-inline-item">
              <div class="stat-inline-icon">
                <font-awesome-icon :icon="['fas', 'star']" />
              </div>
              <div class="stat-inline-content">
                <div class="stat-inline-number">1+</div>
                <div class="stat-inline-label">{{ $t('home.hero.stats.experience') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Imagen decorativa con mapa integrado -->
        <div class="hero-image-section mobile-force-map">
          <div class="floating-card card-1">
            <font-awesome-icon :icon="['fas', 'home']" class="card-icon" />
            <div class="card-text">{{ $t('home.hero.floatingCards.verified') }}</div>
          </div>
          <div class="floating-card card-2">
            <font-awesome-icon :icon="['fas', 'star']" class="card-icon" />
            <div class="card-text">{{ $t('home.hero.floatingCards.rated') }}</div>
          </div>

          <!-- Mini Mapa Preview -->
          <div class="hero-image-placeholder map-preview-wrapper" @click="handleMapClick">
            <div ref="miniMapEl" class="mini-map"></div>

            <!-- Mini Card Preview (Visible al cargar) -->
            <!-- <Transition name="fade-up">
                <div v-if="selectedMiniProperty" class="map-mini-card" @click.stop="viewPropertyDetails(selectedMiniProperty)">
                  <div class="mini-card-img">
                    <img :src="getPropertyImage(selectedMiniProperty)" :alt="selectedMiniProperty.title" />
                  </div>
                  <div class="mini-card-content">
                    <div class="mini-card-price">{{ formatPrice(selectedMiniProperty.monthly_price) }}</div>
                    <div class="mini-card-title">{{ truncateDescription(selectedMiniProperty.title, 35) }}</div>
                    <div class="mini-card-city">
                      <font-awesome-icon :icon="['fas', 'map-marker-alt']" />
                      {{ selectedMiniProperty.city }}
                    </div>
                  </div>
                  <button class="mini-card-btn">
                    <font-awesome-icon :icon="['fas', 'arrow-right']" />
                  </button>
                </div>
              </Transition> -->

            <!-- Overlay con CTA -->
            <div class="map-overlay" @click="router.push({ name: 'MapExplorer' })">
              <div class="map-overlay-content">
                <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="map-overlay-icon" />
                <span>
                  {{ t('home.hero.map.explore') || 'Explorar en mapa' }}
                </span>
              </div>
            </div>

            <!-- Pulse animado en esquina -->
            <div class="map-live-badge">
              <span class="live-dot"></span>
              <span class="live-text">En vivo</span>
            </div>

            <div v-if="topCityName" class="map-topcity-badge">
              <font-awesome-icon :icon="['fas', 'fire']" class="hot-icon" />
              <div class="hot-text">
                <span class="city-name-highlight">{{ topCityName }}</span> 
                <span class="city-stats-info"> • {{ topCityCount }} {{ $t('home.hero.map.properties') || 'propiedades' }}</span>
                <span class="trend-label"> • 🔥 {{ $t('home.hero.map.trend') || 'Tendencia' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Scroll Indicator -->
      <div class="hero-scroll-indicator" @click="scrollNext">
        <div class="mouse-scroll">
          <span class="scroll-dot"></span>
        </div>
        <div class="scroll-arrow">
          <font-awesome-icon :icon="['fas', 'chevron-down']" />
        </div>
      </div>
    </section>

    <!-- Buscador Moderno Flotante -->
    <PropertySearch v-model="filters" @search-explore="handleExploreSearch" @go-map="handleDirectMapExploration"
      :properties="properties" />

    <!-- Search Notification Chimba -->
    <Transition name="notification-slide">
      <div v-if="searchAlert.show" class="search-floating-alert" :class="`alert--${searchAlert.type}`">
        <div class="alert-glass-bg"></div>
        <div class="alert-content">
          <div class="alert-icon-box">
            <font-awesome-icon v-if="searchAlert.type === 'found'" :icon="['fas', 'check-circle']"
              class="icon-main f-check" />
            <font-awesome-icon v-else-if="searchAlert.type === 'nearby'" :icon="['fas', 'map-location-dot']"
              class="icon-main f-map" />
            <font-awesome-icon v-else-if="searchAlert.type === 'none'" :icon="['fas', 'exclamation-circle']"
              class="icon-main f-search" />
            <font-awesome-icon v-else :icon="['fas', 'search']" class="icon-main f-search" />
          </div>
          <div class="alert-text">
            <h4 class="alert-title">{{ searchAlert.title }}</h4>
            <p class="alert-sub">
              {{ searchAlert.sub }}
              <a href="javascript:void(0)" class="alert-action-link" @click="goToMapWithQuery">
                ¡Míralas ahora!
              </a>
            </p>
          </div>
          <div class="alert-actions">
            <button class="alert-btn-map" @click="goToMapWithQuery">
              <font-awesome-icon :icon="['fas', 'map-location-dot']" class="btn-icon" />
              Explorar en el mapa
            </button>
            <button class="alert-btn-close" @click="searchAlert.show = false">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Propiedades Section -->
    <section class="properties-modern-section">
      <div class="properties-container">
        <div class="section-header-modern" data-aos="fade-up">
          <div class="header-content">
            <span class="section-subtitle-badge">
              <font-awesome-icon :icon="['fas', 'star']" />
              {{ $t('home.properties.badge') }}
            </span>
            <h2 class="section-title-modern">
              {{ $t('home.properties.title') }}
              <span class="gradient-text">{{ $t('home.properties.titleHighlight') }}</span>
            </h2>
            <p class="section-description">
              {{ $t('home.properties.description') }}
            </p>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingProperties" class="loading-modern" data-aos="fade-up">
          <div class="loading-spinner-modern"></div>
          <p>{{ $t('home.properties.loading') }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="errorProperties" class="error-modern" data-aos="fade-up">
          <font-awesome-icon :icon="['fas', 'times-circle']" class="error-icon" />
          <p>{{ errorProperties }}</p>
          <button @click="fetchAllData" class="retry-btn-modern">
            <font-awesome-icon :icon="['fas', 'arrow-right']" />
            {{ $t('home.properties.retry') }}
          </button>
        </div>

        <!-- Grid de propiedades moderno -->
        <div v-else-if="displayedProperties.length > 0" class="properties-grid">
          <article v-for="(property, index) in displayedProperties" :key="property.id" class="property-card"
            :style="{ animationDelay: (index * 0.1) + 's' }" :data-aos="'fade-up'" :data-aos-delay="index * 100"
            @click="viewPropertyDetails(property)">
            <!-- Card Glow Effect -->
            <div class="card-glow"></div>

            <!-- Image Section -->
            <div class="card-image-section">
              <div class="image-wrapper">
                <img :src="getPropertyImage(property)" :alt="property.title" class="property-img" @error="onImgError" />
                <div class="image-gradient"></div>
              </div>

              <!-- Status Badge -->
              <div class="status-badge" :class="property.status">
                <span class="status-pulse"></span>
                <span class="status-text">{{ getStatusText(property.status) }}</span>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <button class="action-btn fav-btn" @click.stop="toggleFavorite(property)"
                  :class="{ 'active': property.is_favorite }" :title="$t('home.properties.card.favorite')">
                  <span class="btn-icon">
                    <font-awesome-icon :icon="['fas', 'star']" />
                  </span>
                  <div class="btn-bg"></div>
                </button>
                <button class="action-btn share-btn" @click.stop="shareProperty(property)"
                  :title="$t('home.properties.card.share')">
                  <span class="btn-icon">
                    <font-awesome-icon :icon="['fas', 'arrow-right']" />
                  </span>
                  <div class="btn-bg"></div>
                </button>
              </div>

              <!-- Type Tag -->
              <div class="type-tag">
                <font-awesome-icon :icon="['fas', getTypeIcon(property.title)]" />
                <span class="type-text">{{ detectTypeTranslated(property.title) }}</span>
              </div>
            </div>

            <!-- Card Content -->
            <div class="card-content">
              <!-- Header -->
              <div class="card-header">
                <div class="card-header-left">
                  <h3 class="card-title">{{ property.title || 'Propiedad exclusiva' }}</h3>
                  <div class="card-location">
                    <font-awesome-icon :icon="['fas', 'map-marker-alt']" />
                    <span class="location-text">{{ property.city }}</span>
                  </div>
                </div>
                <div class="card-header-right">
                  <span class="price-label-small">{{ $t('home.properties.card.priceLabel') }}</span>
                  <span class="price-value-header">
                    {{ formatPrice(property.monthly_price) }}
                  </span>
                  <span class="price-period-small">{{ $t('home.properties.card.perMonth') }}</span>
                </div>
              </div>

              <!-- Features -->
              <div class="features-container">
                <div class="feature-item">
                  <div class="feature-modern">
                    <font-awesome-icon :icon="['fas', 'ruler-combined']" />
                  </div>
                  <div class="feature-content">
                    <span class="feature-label">{{ $t('home.properties.card.features.area') }}</span>
                    <span class="feature-value">{{ property.area_m2 }} m²</span>
                  </div>
                </div>
                <div v-if="property.num_bedrooms" class="feature-item">
                  <div class="feature-modern">
                    <font-awesome-icon :icon="['fas', 'bed']" />
                  </div>
                  <div class="feature-content">
                    <span class="feature-label">{{ $t('home.properties.card.features.bedrooms') }}</span>
                    <span class="feature-value">{{ property.num_bedrooms }}</span>
                  </div>
                </div>
                <div v-if="property.num_bathrooms" class="feature-item">
                  <div class="feature-modern">
                    <font-awesome-icon :icon="['fas', 'bath']" />
                  </div>
                  <div class="feature-content">
                    <span class="feature-label">{{ $t('home.properties.card.features.bathrooms') }}</span>
                    <span class="feature-value">{{ property.num_bathrooms }}</span>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <p class="card-description">
                {{ truncateDescription(property.description) }}
              </p>

              <!-- Card Footer -->
              <div class="card-footer">
                <button class="btn-view-details" @click.stop="viewPropertyDetails(property)">
                  <span class="btn-text">{{ $t('home.properties.card.viewDetails') }}</span>
                  <span class="btn-arrow">→</span>
                  <div class="btn-hover-effect"></div>
                </button>
              </div>
            </div>

            <!-- Card Border Effect -->
            <div class="card-border-effect"></div>
          </article>
        </div>

        <!-- Empty State Premium -->
        <div v-else class="empty-state-premium" data-aos="zoom-in">
          <div class="empty-glass-card">
            <div class="empty-illustration">
              <img src="../assets/images/no-results.png" alt="No results" class="illustration-img" @error="onImgError" />
              <div class="illustration-glow"></div>
            </div>
            <div class="empty-content">
              <h3 class="empty-title">{{ $t('home.properties.empty.title') }}</h3>
              <p class="empty-description">{{ $t('home.properties.empty.description') }}</p>
              
              <div class="empty-suggestions">
                <span class="suggestion-label">Prueba con:</span>
                <div class="suggestion-tags">
                  <button @click="quickSearch('Apartamento')" class="sug-tag">Apartamentos</button>
                  <button @click="quickSearch('Casa')" class="sug-tag">Casas</button>
                  <button @click="quickSearch('Popayán')" class="sug-tag">Popayán</button>
                </div>
              </div>

              <div class="empty-actions">
                <button @click="clearFilters" class="btn-reset-premium">
                  <font-awesome-icon :icon="['fas', 'sync-alt']" />
                  <span>{{ $t('home.properties.empty.clearFilters') }}</span>
                </button>
                <button @click="router.push({ name: 'MapExplorer' })" class="btn-explore-map">
                  <font-awesome-icon :icon="['fas', 'map-location-dot']" />
                  <span>Ver mapa global</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Ver más -->
        <div v-if="!loadingProperties && filteredProperties.length > PROPERTIES_LIMIT" class="view-more-modern"
          data-aos="fade-up">
          <div class="view-more-info">
            <p>
              {{ $t('home.properties.viewMore.showing') }} <strong>{{ displayedProperties.length }}</strong> {{
                $t('home.properties.viewMore.of') }}
              <strong>{{ filteredProperties.length }}</strong> {{ $t('home.properties.viewMore.properties') }}
            </p>
          </div>
          <button @click="goToProperties" class="view-all-btn-modern">
            <span>{{ $t('home.properties.viewMore.button') }}</span>
            <font-awesome-icon :icon="['fas', 'arrow-right']" />
          </button>
        </div>
      </div>
    </section>

    <!-- CTA Section Moderna -->
    <section class="cta-modern-section" data-aos="fade-up">
      <div class="cta-background">
        <div class="cta-orb cta-orb-1"></div>
        <div class="cta-orb cta-orb-2"></div>
      </div>
      <div class="cta-content">
        <font-awesome-icon :icon="['fas', 'star']" class="cta-icon" />
        <h2>{{ $t('home.cta.title') }}</h2>
        <p>{{ $t('home.cta.description') }}</p>
        <div class="cta-buttons">
          <button class="cta-btn primary" @click="goToProperties">
            <span>{{ $t('home.cta.viewProperties') }}</span>
            <font-awesome-icon :icon="['fas', 'arrow-right']" />
          </button>
          <button class="cta-btn secondary">
            <font-awesome-icon :icon="['fas', 'phone']" />
            <span>{{ $t('home.cta.contact') }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Modal -->
    <Transition name="modal">
      <div v-if="modalOpen && selectedProperty" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box" @click.stop>
          <button class="modal-close" @click="closeModal" type="button">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>

          <div class="modal-header">
            <div class="property-status-badge" :class="selectedProperty.status || 'available'">
              <span class="status-dot" :class="selectedProperty.status || 'available'"></span>
              {{ friendlyStatus(selectedProperty.status) }}
            </div>
            <h2 class="modal-title">{{ selectedProperty.title || 'Propiedad' }}</h2>
            <div class="property-price-highlight">
              <span class="price-amount">{{ formatPrice(selectedProperty.monthly_price) }}</span>
              <span class="price-period">{{ $t('home.properties.card.perMonth') }}</span>
            </div>
          </div>

          <div class="modal-gallery">
            <img :src="getPropertyImage(selectedProperty)" class="modal-main-image" :alt="selectedProperty.title"
              @error="onImgError" />
            <div class="image-badge">
              <font-awesome-icon :icon="['fas', 'camera']" class="badge-icon" />
              <span class="badge-text">{{ $t('home.modal.gallery') }}</span>
            </div>
          </div>

          <div class="modal-details-grid">
            <div class="detail-card location-card">
              <div class="card-icon">
                <font-awesome-icon :icon="['fas', 'map-marker-alt']" />
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ $t('home.modal.sections.location.title') }}</h3>
                <p class="card-text">{{ selectedProperty.address || $t('home.modal.sections.location.notAvailable') }}
                </p>
                <p class="card-subtext">{{ selectedProperty.city || '' }}</p>
              </div>
            </div>

            <div class="detail-card features-card">
              <div class="card-icon">
                <font-awesome-icon :icon="['fas', 'ruler-combined']" />
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ $t('home.modal.sections.features.title') }}</h3>
                <div class="features-list">
                  <div class="feature">
                    <span class="feature-label">{{ $t('home.modal.sections.features.area') }}</span>
                    <span class="feature-value">{{ selectedProperty.area_m2 || 0 }} m²</span>
                  </div>
                  <div class="feature" v-if="selectedProperty.num_bedrooms">
                    <span class="feature-label">{{ $t('home.modal.sections.features.bedrooms') }}</span>
                    <span class="feature-value">{{ selectedProperty.num_bedrooms }}</span>
                  </div>
                  <div class="feature" v-if="selectedProperty.num_bathrooms">
                    <span class="feature-label">{{ $t('home.modal.sections.features.bathrooms') }}</span>
                    <span class="feature-value">{{ selectedProperty.num_bathrooms }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-card services-card">
              <div class="card-icon">
                <font-awesome-icon :icon="['fas', 'check-circle']" />
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ $t('home.modal.sections.services.title') }}</h3>
                <div class="services-tags" v-if="getServicesArray(selectedProperty.included_services).length > 0">
                  <span v-for="service in getServicesArray(selectedProperty.included_services)" :key="service"
                    class="service-tag">
                    {{ service.trim() }}
                  </span>
                </div>
                <p v-else class="no-services">{{ $t('home.modal.sections.services.none') }}</p>
              </div>
            </div>

            <div class="detail-card publication-card">
              <div class="card-icon">
                <font-awesome-icon :icon="['fas', 'calendar']" />
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ $t('home.modal.sections.publication.title') }}</h3>
                <p class="card-text">{{ formatModalDate(selectedProperty.publication_date) }}</p>
                <p class="card-subtext">{{ $t('home.modal.sections.publication.publishedAgo') }} {{
                  timeAgo(selectedProperty.publication_date) }}</p>
              </div>
            </div>
          </div>

          <div class="description-section">
            <h3 class="section-title">{{ $t('home.modal.sections.description.title') }}</h3>
            <p class="description-text">{{ selectedProperty.description ||
              $t('home.modal.sections.description.notAvailable') }}</p>
          </div>

          <div v-if="selectedProperty.lat && selectedProperty.lng" class="location-section">
            <div class="section-header">
              <h3 class="section-title">
                <font-awesome-icon :icon="['fas', 'map-marker-alt']" />
                {{ $t('home.modal.sections.map.title') }}
              </h3>
              <button class="btn-map-preview" @click="viewOnMap(selectedProperty)" type="button">
                <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="btn-icon" />
                <span class="btn-text">{{ $t('home.modal.sections.map.viewFullMap') }}</span>
              </button>
            </div>
            <div class="coordinates-display">
              <div class="coordinate">
                <span class="coordinate-label">{{ $t('home.modal.sections.map.latitude') }}</span>
                <span class="coordinate-value">{{ Number(selectedProperty.lat).toFixed(6) }}</span>
              </div>
              <div class="coordinate">
                <span class="coordinate-label">{{ $t('home.modal.sections.map.longitude') }}</span>
                <span class="coordinate-value">{{ Number(selectedProperty.lng).toFixed(6) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="no-location-section">
            <div class="no-location-icon">
              <font-awesome-icon :icon="['fas', 'map-marker-alt']" />
            </div>
            <p class="no-location-text">{{ $t('home.modal.sections.map.notRegistered') }}</p>
          </div>

          <div class="modal-actions">
            <button v-if="selectedProperty.status === 'available'" class="btn-request-visit"
              @click="openRequestVisitModal(selectedProperty)" type="button">
              <font-awesome-icon :icon="['fas', 'calendar']" class="btn-icon" />
              <span class="btn-text">{{ $t('home.modal.sections.actions.requestVisit') }}</span>
            </button>

            <div v-else class="unavailable-notice">
              <div class="notice-icon">
                <font-awesome-icon :icon="['fas', 'times-circle']" />
              </div>
              <div class="notice-content">
                <h4>{{ $t('home.modal.sections.actions.unavailable.title') }}</h4>
                <p>{{ $t('home.modal.sections.actions.unavailable.description') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <RequestVisitModal :open="showRequestModal" :property="propertyForRequest" @close="showRequestModal = false"
      @success="handleVisitRequestSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, computed, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import RequestVisitModal from "../components/modals/ModalRequest/RequestVisitModal.vue";
import PropertySearch from '../components/search/PropertySearch.vue';
import { usePropertyTypes } from '../types/usePropertyTypes';
import api from "../services/api";
import { getPropertyImage as getPropertyImageUtil } from "../utils/propertyUtils";
import { geocodeAddress, getDistance, getDepartmentByCity } from "../services/propertyMapService";

const DEFAULT_PROPERTY_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2Yzc1N2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=";

// ==================== Composables ====================
const { t } = useI18n();
const router = useRouter();
const {
  detectTypeNormalized,
  detectTypeTranslated,
  getTypeIcon
} = usePropertyTypes();

// ==================== State ====================
const properties = ref<any[]>([]);
const selectedProperty = ref<any>(null);
const selectedMiniProperty = ref<any>(null);
const propertyForRequest = ref<any>(null);
const showRequestModal = ref(false);
const loadingProperties = ref(false);
const errorProperties = ref<string | null>(null);
const activeClientsCount = ref(0);
const propertyCount = ref(0);
const modalOpen = ref(false);
const topCityName = ref(""); // City with most properties
const topCityCount = ref(0);

// ── Search & Alerts ──
const searchAlert = ref({
  show: false,
  type: 'info',
  title: '',
  sub: '',
  btnText: 'Ver en mapa',
  coords: null as { lat: number, lng: number } | null,
  zoom: '15',
  city: '',
  dept: '',
  propertyId: null as number | null,
  propertiesFound: 0
});
const isDeepSearching = ref(false);

const miniMapEl = ref<HTMLElement | null>(null);

const miniMap = shallowRef<L.Map | null>(null);
const miniMarkersAdded = ref(false);

const PROPERTIES_LIMIT = 4;

const filters = ref({
  search: '',
  city: '',
  type: '',
  maxPrice: null as number | null,
  rating: null as number | null,
  rooms: null as number | null
});

// ==================== Computed ====================
const filteredProperties = computed(() => {
  return properties.value.filter((p) => {
    const typeFromTitle = detectTypeNormalized(p.title);

    // Búsqueda de texto (Título, descripción, ciudad, dirección)
    const matchSearch =
      !filters.value.search ||
      (p.title || '').toLowerCase().includes(filters.value.search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(filters.value.search.toLowerCase()) ||
      (p.city || '').toLowerCase().includes(filters.value.search.toLowerCase()) ||
      filters.value.search.toLowerCase().includes((p.city || '').toLowerCase()) ||
      (p.address || '').toLowerCase().includes(filters.value.search.toLowerCase()) ||
      filters.value.search.toLowerCase().includes((p.address || '').toLowerCase());

    // Ciudad/Ubicación exacta
    const matchCity =
      !filters.value.city ||
      (p.city || '').toLowerCase().includes(filters.value.city.toLowerCase()) ||
      filters.value.city.toLowerCase().includes((p.city || '').toLowerCase());

    // Tipo de propiedad (Basado en Título como pidió el usuario)
    const matchType =
      !filters.value.type || filters.value.type === typeFromTitle;

    // Presupuesto (Mejorado para ser más estricto)
    const rawMax = filters.value.maxPrice;
    const pPrice = Number(p.monthly_price);
    const matchPrice = !rawMax || (pPrice > 0 && pPrice <= rawMax);

    // Valoración (Rating)
    const matchRating = !filters.value.rating || (p.rating || 4.5) >= filters.value.rating;

    // Habitaciones
    const pBedrooms = Number(p.num_bedrooms || p.bedrooms || 0);
    const matchRooms = !filters.value.rooms || pBedrooms >= filters.value.rooms;

    return matchSearch && matchCity && matchType && matchPrice && matchRating && matchRooms;
  });
});

const displayedProperties = computed(() => {
  const featured = filteredProperties.value.filter(p => p.featured);
  const regular = filteredProperties.value.filter(p => !p.featured);
  return [...featured, ...regular].slice(0, PROPERTIES_LIMIT);
});

// ==================== Mini Mapa ====================
function handleMapClick() {
  router.push({ name: 'MapExplorer' });
}

function initMiniMap() {
  if (!miniMapEl.value) return;

  miniMap.value = L.map(miniMapEl.value, {
    center: [4.5709, -74.2973],
    zoom: 6,
    zoomControl: false,
    dragging: true,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    attributionControl: false,
    touchZoom: true
  });

  L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 21,
    maxNativeZoom: 21,
    crossOrigin: true,
    attribution: '&copy; Google Maps'
  }).addTo(miniMap.value);
}

// Agregar marcadores al mini mapa cuando las propiedades estén listas
watchEffect(() => {
  const map = miniMap.value;
  if (map && properties.value.length > 0 && !miniMarkersAdded.value) {
    console.log("📍 Inicializando marcadores en mini-mapa...", properties.value.length);
    miniMarkersAdded.value = true;

    // Asegurar que el mapa conoce su tamaño real
    map.invalidateSize();

    // 📍 Lógica de ranking: Ciudad con más propiedades
    const cityCounts: Record<string, number> = {};
    properties.value.forEach(p => {
      if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
    });

    const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
    const topCity = sortedCities[0]?.[0];
    topCityName.value = topCity || "";
    topCityCount.value = sortedCities[0]?.[1] || 0;

    if (topCity) {
      const bestProp = properties.value.find(p =>
        p.city === topCity &&
        p.lat && p.lng &&
        !isNaN(parseFloat(p.lat)) && parseFloat(p.lat) !== 0
      );

      if (bestProp) {
        console.log(`🏠 Ciudad con más propiedades: ${topCity}. Preview en:`, bestProp.title);
        selectedMiniProperty.value = bestProp;
        map.setView([parseFloat(bestProp.lat), parseFloat(bestProp.lng)], 13);

        // Add a "Hotspot" City label to the map
        const cityIcon = L.divIcon({
          className: 'city-label-icon',
          html: `<div class="hotcity-badge">
                   <span class="hotcity-dot"></span>
                   <span class="hotcity-name">${topCity}</span>
                 </div>`,
          iconSize: [120, 40],
          iconAnchor: [60, 20]
        });
        L.marker([parseFloat(bestProp.lat), parseFloat(bestProp.lng)], { icon: cityIcon, zIndexOffset: 1000 }).addTo(map);
      }
    }

    properties.value
      .filter(p => p.lat && p.lng && !isNaN(parseFloat(p.lat)) && parseFloat(p.lat) !== 0)
      .slice(0, 30)
      .forEach(p => {
        const isSelected = selectedMiniProperty.value?.id === p.id;

        const marker = L.circleMarker([parseFloat(p.lat), parseFloat(p.lng)], {
          radius: isSelected ? 10 : 7,
          fillColor: isSelected ? '#3b82f6' : '#1e40af',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(map);
        marker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          selectedMiniProperty.value = p;
          map.flyTo([parseFloat(p.lat), parseFloat(p.lng)], 14);
        });
      });
  }
});

// ==================== Deep Search & Map Redirection ====================
async function handleExploreSearch() {
  const query = filters.value.city || filters.value.search;
  if (!query || query.length < 3) return;

  isDeepSearching.value = true;
  searchAlert.value.show = false;

  try {
    const geo = await geocodeAddress(query, {});
    if (!geo) {
      // Fallback: If geocoding fails, maybe it's just words. Show generic alert.
      searchAlert.value = {
        show: true,
        type: 'none',
        title: 'Buscando en el mapa...',
        sub: `No ubicamos "${query}" exactamente, pero puedes explorar todo el catálogo en el mapa mundial.`,
        btnText: 'Ir al mapa global',
        coords: null,
        zoom: '12',
        city: '',
        dept: '',
        propertyId: null,
        propertiesFound: 0
      };
      return;
    }

    const props = properties.value;
    const matches = props.map(p => ({
      ...p,
      _dist: getDistance(geo.lat, geo.lng, parseFloat(p.lat), parseFloat(p.lng))
    })).sort((a, b) => (a._dist ?? 999) - (b._dist ?? 999));

    // FLEXIBLE COVERAGE: Check both distance AND city name identity
    const geoCityNorm = (geo.mainText || '').toLowerCase().trim();
    const exactMatches = matches.filter(m =>
      (m._dist ?? 999) < 0.5 ||
      (m.city && m.city.toLowerCase().trim() === geoCityNorm)
    );
    const nearbyMatches = matches.filter(m => (m._dist ?? 999) < 5);

    if (exactMatches.length === 1) {
      const p = exactMatches[0];
      searchAlert.value = {
        show: true,
        type: 'found',
        title: `¡Tu próximo hogar!`,
        sub: `Encontramos "${p.title}" en ${p.city}. ¡Es justo lo que buscabas!`,
        btnText: 'Ir a la propiedad',
        coords: { lat: parseFloat(p.lat), lng: parseFloat(p.lng) },
        zoom: '18',
        city: p.city,
        dept: p.department || getDepartmentByCity(p.city),
        propertyId: p.id,
        propertiesFound: 1
      };
    } else if (exactMatches.length > 1) {
      searchAlert.value = {
        show: true,
        type: 'found',
        title: `¡Excelentes noticias!`,
        sub: `Encontramos ${exactMatches.length} propiedades en ${geo.mainText || query}.`,
        btnText: 'Ver en el mapa',
        coords: { lat: geo.lat, lng: geo.lng },
        zoom: '15',
        city: geo.mainText || query,
        dept: (geo.subText || '').split(',')[0].trim(),
        propertyId: null,
        propertiesFound: exactMatches.length
      };
    } else if (nearbyMatches.length > 0) {
      const closest = nearbyMatches[0];
      const dist = closest._dist ?? 0;
      const distStr = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
      searchAlert.value = {
        show: true,
        type: 'nearby',
        title: `Cerca de tu búsqueda...`,
        sub: `No hay en ese punto exacto, pero hay ${nearbyMatches.length} muy cerca (a ${distStr}).`,
        btnText: 'Explorar zona vinculada',
        coords: { lat: geo.lat, lng: geo.lng },
        zoom: '14',
        city: geo.mainText || query,
        dept: (geo.subText || '').split(',')[0].trim(),
        propertyId: null,
        propertiesFound: nearbyMatches.length
      };
    } else {
      const closestGlobal = matches[0];
      if (closestGlobal) {
        const dist = closestGlobal._dist ?? 0;
        const distStr = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
        searchAlert.value = {
          show: true,
          type: 'nearby',
          title: `Sin cobertura en ${geo.mainText || query}`,
          sub: `No hay propiedades allí por ahora, pero la más cercana está en ${closestGlobal.city} (a ${distStr}).`,
          btnText: `Ir a lo más cercano (${closestGlobal.city})`,
          coords: { lat: parseFloat(closestGlobal.lat), lng: parseFloat(closestGlobal.lng) },
          zoom: '14',
          city: closestGlobal.city,
          dept: closestGlobal.department || getDepartmentByCity(closestGlobal.city),
          propertyId: null,
          propertiesFound: 1
        };
      } else {
        searchAlert.value = {
          show: true,
          type: 'none',
          title: 'Aún estamos creciendo...',
          sub: `No tenemos propiedades en "${query}" por ahora. ¿Qué tal si exploras nuestras ciudades con más oferta?`,
          btnText: 'Explorar zonas activas',
          coords: null,
          zoom: '12',
          city: '',
          dept: '',
          propertyId: null,
          propertiesFound: 0
        };
      }
    }
  } catch (e) {
    console.warn('Explore search error:', e);
  } finally {
    isDeepSearching.value = false;
  }
}

async function handleDirectMapExploration(query?: string) {
  if (!query || query.length < 3) {
    router.push({ name: 'MapExplorer' });
    return;
  }

  try {
    const geo = await geocodeAddress(query, {});
    if (!geo) {
      router.push({ name: 'MapExplorer', query: { q: query } });
      return;
    }

    // Smart logic for direct exploration: 
    // Check if there's exactly one property near this point
    const geoCityNorm = (geo.mainText || '').toLowerCase().trim();
    const exactMatches = properties.value.filter(p => {
      const dist = getDistance(geo.lat, geo.lng, parseFloat(p.lat), parseFloat(p.lng));
      return dist < 0.5 || (p.city && p.city.toLowerCase().trim() === geoCityNorm);
    });

    if (exactMatches.length === 1) {
      const p = exactMatches[0];
      router.push({
        name: 'MapExplorer',
        query: {
          mapLat: p.lat.toString(),
          mapLng: p.lng.toString(),
          mapZoom: '18',
          city: p.city,
          dept: p.department || getDepartmentByCity(p.city),
          id: p.id.toString()
        }
      });
    } else {
      const subParts = geo.subText.split(',').map(s => s.trim());
      router.push({
        name: 'MapExplorer',
        query: {
          mapLat: geo.lat.toString(),
          mapLng: geo.lng.toString(),
          mapZoom: exactMatches.length > 0 ? '13' : '12',
          city: geo.mainText || query,
          dept: subParts[0] || ''
        }
      });
    }
  } catch (e) {
    router.push({ name: 'MapExplorer', query: { q: query } });
  }
}

function goToMapWithQuery() {
  const alert = searchAlert.value as any;
  if (alert.coords) {
    router.push({
      name: 'MapExplorer',
      query: {
        mapLat: alert.coords.lat.toString(),
        mapLng: alert.coords.lng.toString(),
        mapZoom: alert.zoom || '15',
        city: alert.city || '',
        dept: alert.dept || '',
        id: alert.propertyId ? alert.propertyId.toString() : undefined
      }
    });
  } else {
    // Si no hay coordenadas, ir al mapa general pero con un zoom que muestre cobertura
    router.push({ 
      name: 'MapExplorer',
      query: {
         mapZoom: '6',
         mapLat: '4.5709',
         mapLng: '-74.2973'
      }
    });
  }
  searchAlert.value.show = false;
}

const quickSearch = (term: string) => {
  clearFilters();
  filters.value.search = term;
  scrollNext();
};

// ==================== Methods ====================
function onImgError(event: Event) {
  const img = event.target as HTMLImageElement;
  if (img && img.src !== DEFAULT_PROPERTY_IMAGE) {
    img.src = DEFAULT_PROPERTY_IMAGE;
    img.onerror = null;
  }
}

const clearFilters = () => {
  filters.value = {
    search: "",
    city: "",
    type: "",
    maxPrice: null,
    rating: null,
    rooms: null
  };
};

const openRequestVisitModal = (property: any) => {
  if (!property) return;
  propertyForRequest.value = property;
  showRequestModal.value = true;
  closeModal();
};

const handleVisitRequestSuccess = () => {
  showRequestModal.value = false;
  console.log('Solicitud de visita enviada con éxito');
};

const closeModal = () => {
  modalOpen.value = false;
  selectedProperty.value = null;
  document.body.classList.remove("modal-open");
};

const viewOnMap = (property: any) => {
  closeModal();
  router.push({ name: 'MapView', params: { id: property.id } });
};

const friendlyStatus = (s: string) => {
  if (!s) return t('home.properties.card.status.available');
  const statusKey = s.toString().trim().toLowerCase();

  const statusMap: Record<string, string> = {
    available: t('home.properties.card.status.available'),
    rented: t('home.properties.card.status.rented'),
    reserved: t('home.properties.card.status.reserved'),
    sold: t('home.properties.card.status.sold'),
    maintenance: t('home.properties.card.status.maintenance'),
  };

  return statusMap[statusKey] || t('home.properties.card.status.available');
};

const formatModalDate = (dateString: string) => {
  if (!dateString) return t('home.modal.sections.location.notAvailable');
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const timeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'hoy';
  if (diffInDays === 1) return 'ayer';
  if (diffInDays < 7) return `hace ${diffInDays} días`;
  if (diffInDays < 30) return `hace ${Math.floor(diffInDays / 7)} semanas`;
  if (diffInDays < 365) return `hace ${Math.floor(diffInDays / 30)} meses`;
  return `hace ${Math.floor(diffInDays / 365)} años`;
};

async function fetchAllData() {
  loadingProperties.value = true;
  errorProperties.value = null;

  try {
    // Pedimos 500 propiedades para que las alertas de búsqueda funcionen en cualquier ciudad (como Cali)
    const propRes = await api.get("/properties", { params: { per_page: 500 } });

    if (propRes.data && Array.isArray(propRes.data)) {
      properties.value = propRes.data;
    } else if (propRes.data && propRes.data.data && Array.isArray(propRes.data.data)) {
      properties.value = propRes.data.data;
    } else {
      properties.value = [];
    }

    propertyCount.value = properties.value.length;
    activeClientsCount.value = 150; // Mocked or removed if not used

  } catch (error) {
    console.error("Error cargando datos:", error);
    errorProperties.value = t('home.properties.error');
    propertyCount.value = 0;
    activeClientsCount.value = 0;
  } finally {
    loadingProperties.value = false;
  }
}

function formatPrice(price: number) {
  if (!price) return "Consultar precio";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0
  }).format(price);
}

function truncateDescription(description: string, maxLength: number = 120) {
  if (!description) return t('home.modal.sections.description.notAvailable');
  return description.length > maxLength
    ? description.substring(0, maxLength) + "..."
    : description;
}

function getStatusText(status: string) {
  if (!status) return t('home.properties.card.status.available');
  const key = status.toString().trim().toLowerCase();

  const map: Record<string, string> = {
    "disponible": t('home.properties.card.status.available'),
    "ocupado": t('home.properties.card.status.reserved'),
    "en mantenimiento": t('home.properties.card.status.maintenance'),
    "vendido": t('home.properties.card.status.sold'),
    "arrendada": t('home.properties.card.status.rented'),
    "available": t('home.properties.card.status.available'),
    "reserved": t('home.properties.card.status.reserved'),
    "sold": t('home.properties.card.status.sold'),
    "rented": t('home.properties.card.status.rented'),
    "maintenance": t('home.properties.card.status.maintenance')
  };

  return map[key] || t('home.properties.card.status.available');
}

function getServicesArray(services: any) {
  if (!services) return [];
  if (Array.isArray(services)) return services;
  if (typeof services === 'string') {
    return services.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
  return [];
}

function getPropertyImage(property: any) {
  return getPropertyImageUtil(property, DEFAULT_PROPERTY_IMAGE);
}

function viewPropertyDetails(property: any) {
  router.push({ name: 'PropertyDetail', params: { id: property.id } });
}

function scrollNext() {
  window.scrollTo({
    top: window.innerHeight * 0.65,
    behavior: 'smooth'
  });
}

function goToProperties() {
  router.push("/propiedades");
}

function toggleFavorite(property: any) {
  property.is_favorite = !property.is_favorite;
}

function shareProperty(property: any) {
  console.log("Compartir", property.title);
}

function getParticleStyle(_n: number) {
  const duration = 15 + Math.random() * 20;
  const delay = Math.random() * 5;
  const size = 4 + Math.random() * 8;

  return {
    left: `${Math.random() * 100}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    width: `${size}px`,
    height: `${size}px`
  };
}

// ==================== Lifecycle ====================
onMounted(() => {
  fetchAllData();
  initMiniMap();
  // Asegurar que el mapa ocupe su espacio real en móviles tras el renderizado inicial
  setTimeout(() => {
    if (miniMap.value) miniMap.value.invalidateSize();
  }, 500);
});

onUnmounted(() => {
  if (miniMap.value) {
    miniMap.value.remove();
    miniMap.value = null;
  }
  miniMarkersAdded.value = false;
});
</script>

<style scoped>
@import "../assets/css/HomeView.css";

/* ── Mini Mapa Hero ── */
.map-preview-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
  min-height: 320px;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.map-preview-wrapper:hover {
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.32);
  transform: translateY(-4px);
}

.mini-map {
  width: 100%;
  height: 100%;
  min-height: 320px;
  border-radius: 18px;
  display: block;
}

/* Mini Card Preview UI */
.map-mini-card {
  position: absolute;
  top: 14px;
  left: 14px;
  width: calc(100% - 28px);
  max-width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 10px;
  display: flex;
  gap: 12px;
  z-index: 20;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  animation: slide-in-top 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.map-mini-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  background: #ffffff;
}

.mini-card-img {
  width: 70px;
  height: 70px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.mini-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.mini-card-price {
  font-size: 15px;
  font-weight: 800;
  color: #1e40af;
  margin-bottom: 2px;
}

.mini-card-title {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.mini-card-city {
  font-size: 10px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-card-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  align-self: center;
  transition: all 0.2s;
}

.map-mini-card:hover .mini-card-btn {
  background: #3b82f6;
  color: white;
}

@keyframes slide-in-top {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Overlay degradado + CTA */
.map-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom,
      transparent 35%,
      rgba(10, 20, 50, 0.6) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 28px;
  border-radius: 18px;
  transition: background 0.3s ease;
}

.map-preview-wrapper:hover .map-overlay {
  background: linear-gradient(to bottom,
      rgba(10, 20, 50, 0.08) 0%,
      rgba(10, 20, 50, 0.72) 100%);
}

.map-overlay-content {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 22px;
  border-radius: 50px;
  letter-spacing: 0.02em;
  transition: all 0.25s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.map-preview-wrapper:hover .map-overlay-content {
  background: rgba(255, 255, 255, 0.24);
  transform: scale(1.04);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.3);
}

.map-overlay-icon {
  font-size: 15px;
}

/* Badge "En vivo" */
.map-live-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50px;
  padding: 5px 12px;
  z-index: 10;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
  animation: live-pulse 2s ease-in-out infinite;
}

.live-text {
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

@keyframes live-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
  }

  50% {
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
  }
}

/* Insignia de Ciudad Top (Tendencia) */
.map-topcity-badge {
  position: absolute;
  bottom: 14px;
  left: 14px;
  right: 14px;
  background: rgba(45, 24, 12, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid rgba(212, 168, 83, 0.4);
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 20;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  animation: badge-in-bottom 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hot-icon {
  color: #e67e22;
  font-size: 16px;
  filter: drop-shadow(0 0 5px rgba(230, 126, 34, 0.4));
  animation: flame-pulse 1.5s ease-in-out infinite;
}

.hot-text {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.city-name-highlight {
  color: #D4A853;
  font-weight: 850;
  font-size: 14px;
  text-transform: uppercase;
}

.city-stats-info {
  color: rgba(255, 255, 255, 0.9);
}

.trend-label {
  color: #e67e22;
  font-weight: 700;
}

@keyframes flame-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
}

@keyframes badge-in-bottom {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Asegurar que Leaflet no tape los floating cards */
:deep(.leaflet-pane),
:deep(.leaflet-tile-pane) {
  z-index: 1 !important;
}

/* ============================================================ 
   CRITICAL MOBILE FIX (MAP & LAYOUT)
   ============================================================ */
@media (max-width: 767px) {
  .modern-hero {
    padding: 110px 0 30px !important; /* Más espacio arriba */
    background: #2e1d17 !important;
    display: flex !important;
    flex-direction: column !important;
    height: auto !important; /* CRITICAL: Prevent truncation */
    min-height: auto !important;
    overflow: visible !important; /* Permitir que se vea todo */
  }

  .hero-content-wrapper {
    display: flex !important;
    flex-direction: column !important;
    padding: 0 1.5rem !important;
    width: 100% !important;
    gap: 0 !important;
  }

  .hero-text-section {
    width: 100% !important;
    text-align: center !important; /* Centrado para mejor balance en móvil */
    margin-bottom: 35px !important;
  }

  .hero-badge {
    margin: 0 auto 15px !important;
    display: inline-flex !important;
  }

  .hero-title {
    font-size: 2.2rem !important;
    line-height: 1.1 !important;
    color: #fff !important;
    margin-bottom: 18px !important;
    font-weight: 900 !important;
    letter-spacing: -0.5px !important;
    text-shadow: 0 4px 15px rgba(0,0,0,0.4);
  }

  .hero-description {
    font-size: 1.05rem !important;
    color: rgba(255, 255, 255, 0.85) !important;
    margin-bottom: 35px !important;
    line-height: 1.6 !important;
    max-width: 100% !important;
  }

  /* Stats: Centrado en móviles */
  .hero-stats-inline {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 12px !important;
    margin-bottom: 35px !important;
  }

  .stat-inline-item {
    background: rgba(255, 255, 255, 0.08) !important;
    padding: 12px 15px !important;
    border-radius: 16px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    text-align: center !important;
    min-width: 90px !important;
  }

  .stat-inline-icon {
    display: none !important;
  }

  .stat-inline-number {
    font-size: 1.25rem !important;
    color: #da9c5f !important; /* Color RentUs Gold */
    font-weight: 800 !important;
  }

  .stat-inline-label {
    font-size: 0.6rem !important;
    text-transform: uppercase !important;
    color: rgba(255, 255, 255, 0.6) !important;
    letter-spacing: 0.5px !important;
  }

  /* 🛡️ RENTUS MOBILE MAP VISIBILITY CRITICAL FIX */
  .modern-hero .hero-content-wrapper .hero-image-section.mobile-force-map {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    height: 420px !important;
    min-height: 420px !important;
    width: 100% !important;
    margin: 30px 0 !important; /* Espacio real para que el recuadro respire */
    border-radius: 24px !important;
    overflow: hidden !important;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5) !important;
    background: #1a1a1a !important;
    z-index: 99 !important; /* Salir de cualquier capa inferior */
    border: 4px solid #da9c5f !important;
    position: relative !important;
  }

  /* Asegurar que el envoltorio interno también sea visible y tenga altura */
  .modern-hero .hero-content-wrapper .hero-image-section.mobile-force-map .map-preview-wrapper,
  .modern-hero .hero-content-wrapper .hero-image-section.mobile-force-map .mini-map {
    height: 100% !important;
    width: 100% !important;
    min-height: 420px !important;
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    border: none !important;
    background: #1a1a1a !important;
    z-index: 100 !important;
  }

  /* BLOQUEO TOTAL DE CUALQUIER COSA ENCIMA */
  .map-overlay,
  .map-mini-card,
  .floating-card,
  .map-live-badge,
  .map-topcity-badge,
  .hotcity-badge,
  .hero-scroll-indicator {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* Search bar (Asegurar que empiece JUSTO después del mapa) */
  :deep(.modern-search-section) {
    padding: 0 0 50px !important;
    margin: -10px 0 0 0 !important; /* Ajuste para pegarse elegantemente */
    background: transparent !important;
    z-index: 110 !important;
    width: 100% !important;
    position: relative !important;
  }

  :deep(.search-container) {
    border-radius: 20px !important;
    padding: 25px 20px !important;
    background: #ffffff !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
    border: 1px solid rgba(218, 156, 95, 0.3) !important;
    width: 92% !important;
    margin: 0 auto !important;
  }

  :deep(.search-grid) {
    display: flex !important;
    flex-direction: column !important;
    gap: 15px !important;
  }

  :deep(.search-field input),
  :deep(.search-field select) {
    height: 52px !important;
    border-radius: 12px !important;
    font-size: 16px !important;
  }

  :deep(.search-btn-modern) {
    height: 56px !important;
    width: 100% !important;
    border-radius: 12px !important;
    background: linear-gradient(135deg, #3b251d 0%, #2e1d17 100%) !important;
    font-weight: 800 !important;
    font-size: 17px !important;
  }

  /* Optimize Property Grid for Mobile */
  .properties-modern-section {
    padding: 40px 1rem !important;
  }

  .properties-grid {
    grid-template-columns: 1fr !important; /* Una sola columna en móvil */
    gap: 1.25rem !important;
  }

  .property-card {
    border-radius: 22px !important;
    overflow: hidden !important;
  }

  .card-image-section {
    height: 220px !important;
  }

  .card-content {
    padding: 18px !important;
  }

  .card-title {
    font-size: 1.2rem !important;
  }

  .price-value-header {
    font-size: 1.1rem !important;
  }

  .features-container {
    padding: 12px 0 !important;
    gap: 10px !important;
  }

  .feature-modern {
    width: 36px !important;
    height: 36px !important;
    font-size: 0.9rem !important;
  }
}

.hotcity-badge {
  display: flex;
  align-items: center;
  background: rgba(25, 12, 5, 0.85);
  backdrop-filter: blur(8px);
  padding: 6px 14px;
  border-radius: 40px;
  border: 1.5px solid var(--gold);
  color: white;
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  animation: badge-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hotcity-dot {
  width: 10px;
  height: 10px;
  background: var(--gold);
  border-radius: 50%;
  margin-right: 8px;
  box-shadow: 0 0 10px var(--gold);
  animation: pulse-gold 2s infinite;
}

@keyframes badge-pop {
  from {
    transform: scale(0.5);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse-gold {
  0% {
    transform: scale(0.9);
    opacity: 0.7;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }

  100% {
    transform: scale(0.9);
    opacity: 0.7;
  }
}

.city-label-icon {
  background: none !important;
  border: none !important;
}

.map-topcity-badge {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(var(--brand-rgb, 61, 35, 20), 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid var(--gold);
  border-radius: 12px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  z-index: 10;
  animation: slide-in-bottom 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.map-topcity-badge .hot-icon {
  color: #ff4500;
  filter: drop-shadow(0 0 5px #ff4500);
  animation: flicker 1.5s infinite;
}

@keyframes slide-in-bottom {
  from {
    transform: translateY(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes flicker {
  0% {
    opacity: 0.8;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.1);
  }

  100% {
    opacity: 0.8;
    transform: scale(1);
  }
}

/* SEARCH FLOATING ALERT - CHIMBA STYLES */
.search-floating-alert {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 95%;
  max-width: 620px;
  display: flex;
  padding: 0;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(188, 143, 44, 0.4);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  animation: notify-in 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.alert-glass-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(20, 10, 5, 0.9);
  backdrop-filter: blur(30px) saturate(150%);
  z-index: -1;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  padding: 16px 24px;
}

.alert-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(var(--brand-rgb, 61, 35, 20), 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.f-check {
  color: #10b981;
}

.f-map {
  color: var(--gold);
}

.f-search {
  color: #f97316;
}

/* SEARCH FLOATING ALERT - REDISEÑO ULTRA PREMIUM */
.search-floating-alert {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: auto;
  min-width: 580px;
  max-width: 850px;
  display: flex;
  padding: 0;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(188, 143, 44, 0.4);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.7),
    0 0 30px rgba(188, 143, 44, 0.15);
  animation: notify-in 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.alert-glass-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 8, 4, 0.92);
  backdrop-filter: blur(35px) saturate(180%);
  z-index: -1;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 25px;
  width: 100%;
  padding: 20px 32px;
}

.alert-icon-box {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: rgba(188, 143, 44, 0.15);
  border: 1px solid rgba(188, 143, 44, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.alert-text {
  flex-grow: 1;
}

.alert-title {
  color: white;
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 4px 0;
}

.alert-sub {
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

.alert-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.alert-action-link {
  color: var(--gold);
  font-weight: 800;
  text-decoration: none;
  margin-left: 5px;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.alert-action-link:hover {
  border-bottom-color: var(--gold);
  text-shadow: 0 0 12px rgba(188, 143, 44, 0.6);
}

.alert-btn-map {
  background: var(--gold);
  background: linear-gradient(135deg, #bc8f2c 0%, #e67e22 100%);
  color: white !important;
  border: none;
  padding: 14px 28px;
  border-radius: 18px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  white-space: nowrap;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow:
    0 10px 25px rgba(188, 143, 44, 0.4),
    inset 0 -4px 0 rgba(0, 0, 0, 0.1);
  visibility: visible !important;
  opacity: 1 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.alert-btn-map:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 35px rgba(188, 143, 44, 0.6);
  filter: brightness(1.1);
}

.alert-btn-map:active {
  transform: translateY(-1px);
}

.alert-btn-map:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 25px rgba(188, 143, 44, 0.4);
}

.alert-btn-map .btn-icon {
  font-size: 1.1em;
}

.alert-btn-close {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.alert-btn-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

/* Tipos de alerta específicos */
.alert--found {
  border-left: 5px solid #10b981;
}

.alert--nearby {
  border-left: 5px solid var(--gold);
}

.alert--none {
  border-left: 5px solid #f97316;
  background: rgba(20, 15, 10, 0.95);
}

.alert--none .alert-icon-box {
  background: rgba(249, 115, 22, 0.15);
  border-color: rgba(249, 115, 22, 0.3);
}

.notification-slide-enter-active {
  animation: notify-in 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.notification-slide-leave-active {
  animation: notify-in 0.4s reverse cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes notify-in {
  from {
    transform: translate(-50%, 50px);
    opacity: 0;
  }

  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@media (max-width: 992px) {
  .search-floating-alert {
    min-width: 90%;
    max-width: 95%;
  }
}

@media (max-width: 768px) {
  .search-floating-alert {
    flex-direction: column;
    padding: 0;
    bottom: 20px;
    width: 95%;
    border-radius: 20px;
  }

  .alert-content {
    flex-direction: column;
    text-align: center;
    gap: 15px;
    padding: 20px;
  }

  .alert-actions {
    width: 100%;
    justify-content: center;
    gap: 15px;
  }

  .alert-btn-map {
    width: 100%;
    padding: 14px;
  }

  .alert-btn-close {
    position: absolute;
    top: 10px;
    right: 10px;
  }
}
</style>