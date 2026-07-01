<template>
  <div class="properties-view">

    <!-- ══════════════════════════════════════════════
         ESTADO: CARGANDO
         status === 'loading'
    ══════════════════════════════════════════════ -->
    <div v-if="status === 'loading'" class="state-container loading-state">
      <div class="loader-ring">
        <svg class="loader-svg" viewBox="0 0 80 80">
          <circle class="loader-track" cx="40" cy="40" r="34" />
          <circle class="loader-fill" cx="40" cy="40" r="34" />
        </svg>
        <div class="loader-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round" />
            <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
      </div>
      <p class="state-title loading-title">{{ $t('property.loading.title') }}</p>
      <p class="state-message">{{ $t('property.loading.message') }}</p>
      <div class="skeleton-grid">
        <div class="skeleton-card" v-for="n in 6" :key="n">
          <div class="skeleton-img shimmer"></div>
          <div class="skeleton-body">
            <div class="skeleton-line wide shimmer"></div>
            <div class="skeleton-line medium shimmer"></div>
            <div class="skeleton-line short shimmer"></div>
            <div class="skeleton-chips">
              <div class="skeleton-chip shimmer"></div>
              <div class="skeleton-chip shimmer"></div>
              <div class="skeleton-chip shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         ESTADO: ERROR
         status === 'error'
    ══════════════════════════════════════════════ -->
    <div v-else-if="status === 'error'" class="state-container error-state">
      <div class="state-icon-wrapper error-icon-wrapper">
        <div class="icon-pulse"></div>
        <svg class="state-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </div>
      <h3 class="state-title error-title">{{ $t('property.error.title') }}</h3>
      <p class="state-message">{{ errorMessage }}</p>
      <button @click="retryLoad" class="btn-state btn-retry">
        <svg viewBox="0 0 24 24" fill="none" class="btn-icon-svg">
          <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
          <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ $t('property.error.retryButton') }}
      </button>
    </div>

    <!-- ══════════════════════════════════════════════
         ESTADO: VACÍO (API respondió pero sin datos)
         status === 'empty'
    ══════════════════════════════════════════════ -->
    <div v-else-if="status === 'empty'" class="state-container no-properties-state">
      <div class="no-props-illustration">
        <div class="no-props-rings">
          <div class="np-ring np-ring-1"></div>
          <div class="np-ring np-ring-2"></div>
          <div class="np-ring np-ring-3"></div>
        </div>
        <svg class="no-props-icon" viewBox="0 0 64 64" fill="none">
          <path d="M8 26L32 6l24 20v28a4 4 0 01-4 4H12a4 4 0 01-4-4V26z" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round" />
          <path d="M24 58V36h16v22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
            stroke-linejoin="round" />
          <path d="M20 20h4M40 20h4M32 14v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            opacity="0.4" />
        </svg>
      </div>
      <h3 class="state-title no-props-title">{{ $t('properties.empty.title') }}</h3>
      <p class="state-message">{{ $t('properties.empty.message') }}</p>
      <div class="no-props-actions">
        <button @click="retryLoad" class="btn-state btn-ghost">
          <svg viewBox="0 0 24 24" fill="none" class="btn-icon-svg">
            <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ $t('property.error.retryButton') }}
        </button>
        <router-link v-if="isAuthenticated" to="/properties/create" class="btn-state btn-create">
          <svg viewBox="0 0 24 24" fill="none" class="btn-icon-svg">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
          {{ $t('properties.section.addProperty') }}
        </router-link>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         ESTADO: ÉXITO — carrusel + buscador + grid
         status === 'success'
    ══════════════════════════════════════════════ -->
    <template v-else-if="status === 'success'">

      <PropertyCarousel :properties="properties" />
      <PropertySearch v-model="filters" :properties="properties" :filtered-count="filteredProperties.length" />

      <div class="main-container">
        <section class="properties-section">

          <div class="section-header">
            <div class="header-left">
              <h2 class="section-title">{{ $t('properties.section.title') }}</h2>
              <p class="section-subtitle">
                <span class="results-count">{{ filteredProperties.length }}</span>
                {{ filteredProperties.length === 1
                  ? $t('properties.section.results.single')
                  : $t('properties.section.results.multiple')
                }}
              </p>
            </div>

            <transition name="fade-slide">
              <router-link v-if="isAuthenticated" to="/properties/create" class="btn-add-property">
                <div class="btn-icon-wrapper">
                  <svg class="btn-plus-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                  </svg>
                </div>
                <span class="btn-text">{{ $t('properties.section.addProperty') }}</span>
                <div class="btn-shine"></div>
              </router-link>
            </transition>
          </div>

          <!-- Grid de propiedades -->
          <transition-group v-if="paginatedProperties.length" name="stagger" tag="div" class="properties-grid">
            <article v-for="(property, index) in paginatedProperties" :key="(property as any).id" class="property-card"
              :style="{ animationDelay: (index * 0.1) + 's' }" @click="goToDetail((property as any).id)">
              <div class="card-glow"></div>

              <div class="card-image-section">
                <div class="image-wrapper">
                  <img :src="getPropertyImage(property)" :alt="property.title" class="property-img"
                    @error="handleImageError" />
                  <div class="image-gradient"></div>
                </div>

                <div class="status-badge" :class="property.status">
                  <span class="status-pulse"></span>
                  <span class="status-text">{{ friendlyStatus(property.status) }}</span>
                </div>

                <div v-if="(authUser as any)?.id === (property as any).user_id" class="action-buttons">
                  <router-link :to="{ name: 'PropertyEdit', params: { id: (property as any).id } }"
                    class="action-btn edit-btn" :title="$t('properties.card.edit')" @click.stop>
                    <span class="btn-icon">✏️</span>
                    <div class="btn-bg"></div>
                  </router-link>
                  <button @click.stop="deleteProperty(property.id)" class="action-btn delete-btn"
                    :title="$t('properties.card.delete')">
                    <span class="btn-icon">🗑️</span>
                    <div class="btn-bg"></div>
                  </button>
                </div>

                <div class="type-tag">
                  <font-awesome-icon :icon="['fas', getTypeIcon(property.title)]" />
                  <span class="type-text">{{ detectTypeTranslated(property.title) }}</span>
                </div>
              </div>

              <div class="card-content">
                <div class="card-header">
                  <div class="card-header-left">
                    <h3 class="card-title">{{ property.title }}</h3>
                    <div class="card-location">
                      <font-awesome-icon :icon="['fas', 'map-marker-alt']" />
                      <span class="location-text">{{ property.city }}</span>
                    </div>
                  </div>
                  <div class="card-header-right">
                    <span class="price-label-small">{{ $t('properties.card.priceLabel') }}</span>
                    <span class="price-value-header">{{ formatPrice(property.monthly_price) }}</span>
                    <span class="price-period-small">{{ $t('properties.card.perMonth') }}</span>
                  </div>
                </div>

                <div class="features-container">
                  <div class="feature-item">
                    <div class="feature-modern">
                      <font-awesome-icon :icon="['fas', 'ruler-combined']" />
                    </div>
                    <div class="feature-content">
                      <span class="feature-label">{{ $t('properties.card.features.area') }}</span>
                      <span class="feature-value">{{ property.area_m2 }} m²</span>
                    </div>
                  </div>
                  <div v-if="property.num_bedrooms" class="feature-item">
                    <div class="feature-modern">
                      <font-awesome-icon :icon="['fas', 'bed']" />
                    </div>
                    <div class="feature-content">
                      <span class="feature-label">{{ $t('properties.card.features.bedrooms') }}</span>
                      <span class="feature-value">{{ property.num_bedrooms }}</span>
                    </div>
                  </div>
                  <div v-if="property.num_bathrooms" class="feature-item">
                    <div class="feature-modern">
                      <font-awesome-icon :icon="['fas', 'bath']" />
                    </div>
                    <div class="feature-content">
                      <span class="feature-label">{{ $t('properties.card.features.bathrooms') }}</span>
                      <span class="feature-value">{{ property.num_bathrooms }}</span>
                    </div>
                  </div>
                </div>

                <p class="card-description">{{ truncateDescription(property.description) }}</p>

                <div class="card-footer">
                  <button class="btn-view-details" @click.stop="goToDetail(property.id)">
                    <span class="btn-text">{{ $t('properties.card.viewDetails') }}</span>
                    <span class="btn-arrow">→</span>
                    <div class="btn-hover-effect"></div>
                  </button>
                </div>
              </div>

              <div class="card-border-effect"></div>
            </article>
          </transition-group>

          <!-- Sin resultados por filtros -->
          <div v-if="!paginatedProperties.length" class="state-container filter-empty-state">
            <div class="state-icon-wrapper filter-icon-wrapper">
              <div class="icon-pulse filter-pulse"></div>
              <svg class="state-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.8" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M8 11h6M11 8v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                  opacity="0.5" />
              </svg>
            </div>
            <h3 class="state-title filter-title">{{ $t('properties.empty.titleFiltered') }}</h3>
            <p class="state-message">{{ $t('properties.empty.messageFiltered') }}</p>
            <button @click="clearFilters" class="btn-state btn-reset">
              <svg viewBox="0 0 24 24" fill="none" class="btn-icon-svg">
                <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ $t('properties.empty.resetButton') }}
            </button>
          </div>

          <Pagination v-if="filteredProperties.length > itemsPerPage" :current-page="currentPage"
            :total-pages="totalPages" :total-items="filteredProperties.length" :items-per-page="itemsPerPage"
            @update:page="handlePageChange" />

        </section>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { getPropertyImage as getPropertyImageUtil } from "../../utils/propertyUtils";
import api from "../../services/api";
import PropertyCarousel from "./PropertyCarousel.vue";
import PropertySearch from "../../components/search/PropertySearch.vue";
import Pagination from "../../components/navigation/PaginationControls.vue";
import { usePropertyTypes } from "../../types/usePropertyTypes";

const DEFAULT_PROPERTY_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2Yzc1N2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=";

const router = useRouter();
const { t } = useI18n();
const { detectTypeNormalized, detectTypeTranslated, getTypeIcon } = usePropertyTypes();

// ── Estado único y exclusivo ─────────────────────────────
// 'loading' | 'error' | 'empty' | 'success'
// Arranca en 'loading' para que solo el spinner se muestre al entrar
const status = ref('loading');
const errorMessage = ref('');

const authUser = ref<any>(null);
const properties = ref<any[]>([]);
const currentPage = ref(1);
const itemsPerPage = ref(9);

const filters = ref({ search: "", city: "", type: "", maxPrice: null as number | null, rating: null as number | null, rooms: null as number | null });

// ── Watchers ─────────────────────────────────────────────
watch(filters, () => { currentPage.value = 1; }, { deep: true });

// ── Computed ─────────────────────────────────────────────
const filteredProperties = computed(() =>
  properties.value.filter((p) => {
    const typeFromTitle = detectTypeNormalized(p.title);
    const s = filters.value;
    const matchSearch = !s.search ||
      p.title.toLowerCase().includes(s.search.toLowerCase()) ||
      p.description?.toLowerCase().includes(s.search.toLowerCase()) ||
      p.city.toLowerCase().includes(s.search.toLowerCase());
    const matchCity = !s.city || p.city.toLowerCase().includes(s.city.toLowerCase()) || s.city.toLowerCase().includes(p.city.toLowerCase());
    const matchType = !s.type || s.type === typeFromTitle;
    const matchPrice = !s.maxPrice || Number((p as any).monthly_price) <= s.maxPrice;

    const matchRating = !s.rating || (p.rating || 4.5) >= s.rating;
    const matchRooms = !s.rooms || Number(p.bedrooms || 0) >= s.rooms;

    return matchSearch && matchCity && matchType && matchPrice && matchRating && matchRooms;
  })
);

const totalPages = computed(() =>
  Math.ceil(filteredProperties.value.length / itemsPerPage.value)
);

const paginatedProperties = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredProperties.value.slice(start, start + itemsPerPage.value);
});

const isAuthenticated = computed(() =>
  !!localStorage.getItem("auth_token") ||
  !!sessionStorage.getItem("auth_token") ||
  !!authUser.value
);

// ── Methods ───────────────────────────────────────────────
const handlePageChange = (page: number) => {
  currentPage.value = page;
  // Scroll al inicio de la sección de propiedades, no del documento entero
  const section = document.querySelector(".properties-section");
  if (section) {
    const top = section.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  }
};

const formatPrice = (price: any) => {
  if (!price && price !== 0) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);
};

const loadAuthUser = async () => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const { data } = await api.get("/auth/me");
      authUser.value = data.success && data.user ? data.user : data.id ? data : null;
    }
  } catch { authUser.value = null; }
};

const loadProperties = async () => {
  // 1️⃣ Primero: activar loading. Solo el spinner es visible.
  status.value = 'loading';
  errorMessage.value = '';
  properties.value = [];

  try {
    const { data } = await api.get("/properties");

    const list = Array.isArray(data.data) ? data.data
      : Array.isArray(data) ? data
        : [];

    properties.value = list;

    // 2️⃣ Según la respuesta: success o empty
    status.value = list.length > 0 ? 'success' : 'empty';

  } catch (err: any) {
    // 3️⃣ Si falla: error con mensaje legible
    if (!navigator.onLine) errorMessage.value = t("properties.error.offline");
    else if (err.response?.status >= 500) errorMessage.value = t("properties.error.server");
    else if (err.response?.status === 404) errorMessage.value = t("properties.error.notFound");
    else errorMessage.value = t("properties.error.generic");

    status.value = 'error';
  }
  // ✅ No hay finally: el status siempre se asigna explícitamente en cada rama
};

const retryLoad = () => loadProperties();

const friendlyStatus = (s: any) => {
  if (!s) return t("properties.card.status.available");
  const map: Record<string, string> = {
    available: t("properties.card.status.available"),
    rented: t("properties.card.status.rented"),
    reserved: t("properties.card.status.reserved"),
    sold: t("properties.card.status.sold"),
    maintenance: t("properties.card.status.maintenance"),
  };
  return map[s.toString().trim().toLowerCase()] || t("properties.card.status.available");
};

const truncateDescription = (d: any, max = 120) =>
  !d ? '' : d.length > max ? d.substring(0, max) + "..." : d;

const getPropertyImage = (property: any) => getPropertyImageUtil(property, DEFAULT_PROPERTY_IMAGE);

const clearFilters = () => {
  filters.value = { search: "", city: "", type: "", maxPrice: null, rating: null, rooms: null };
  currentPage.value = 1;
};

const goToDetail = (id: any) => router.push({ name: "PropertyDetail", params: { id } });
const handleImageError = (e: any) => { e.target.src = DEFAULT_PROPERTY_IMAGE; };

const deleteProperty = async (id: any) => {
  if (!confirm(t("properties.delete.confirm"))) return;
  try {
    await api.delete(`/properties/${id}`);
    properties.value = properties.value.filter((p) => p.id !== id);
    if (properties.value.length === 0) {
      status.value = 'empty';
    } else if (paginatedProperties.value.length === 0 && currentPage.value > 1) {
      currentPage.value--;
    }
    alert(t("properties.delete.success"));
  } catch { alert(t("properties.delete.error")); }
};

onMounted(async () => {
  // Siempre arrancar desde el tope de la página
  window.scrollTo({ top: 0, behavior: 'instant' });
  await loadAuthUser();
  await loadProperties();
});
</script>

<style scoped>
@import "../../assets/css/Properties/PropertyView.css";
</style>