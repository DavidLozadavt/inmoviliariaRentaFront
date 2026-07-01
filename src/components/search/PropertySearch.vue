<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { mapsService } from "../../services/mapsService";

const { t } = useI18n();

/* Props / Emits */
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  properties: {
    type: Array,
    default: () => []
  },
  filteredCount: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(["update:modelValue", "search-explore", "go-map"]);

/* Local state */
const localFilters = ref({ ...props.modelValue });
const locationSuggestions = ref([]);
const showSuggestions = ref(false);
const loadingSuggestions = ref(false);
const showAdvancedFilters = ref(false);
const selectedIndex = ref(-1); // Keyboard navigation index
let debounceTimeout = null;

const propertyCategories = [
  { id: 'casa', label: 'home.search.fields.type.house', icon: 'home' },
  { id: 'apartamento', label: 'home.search.fields.type.apartment', icon: 'building' },
  { id: 'local', label: 'home.search.fields.type.commercial', icon: 'store' },
  { id: 'finca', label: 'home.search.fields.type.farm', icon: 'leaf' }
];

const zoneOptions = [
  { value: 'Norte', label: 'Norte', icon: '↑' },
  { value: 'Sur', label: 'Sur', icon: '↓' },
  { value: 'Centro', label: 'Centro', icon: '⊙' },
  { value: 'Este', label: 'Este', icon: '→' },
  { value: 'Oeste', label: 'Oeste', icon: '←' },
];


/* Sync with parent */
watch(
  () => props.modelValue,
  (val) => {
    localFilters.value = { ...val };
  }
);

/* ===========================
   ACCURATE CALCULATIONS
   =========================== */

const categoryCounts = computed(() => {
  const counts = { casa: 0, apartamento: 0, local: 0, finca: 0 };
  props.properties.forEach(p => {
    const title = p.title.toLowerCase();
    if (title.includes('casa')) counts.casa++;
    else if (title.includes('apartamento') || title.includes('apto')) counts.apartamento++;
    else if (title.includes('local')) counts.local++;
    else if (title.includes('finca')) counts.finca++;
  });
  return counts;
});

const availablePriceRange = computed(() => {
  if (!props.properties || props.properties.length === 0) return { min: 0, max: 20000000 };
  const prices = props.properties.map(p => Number(p.monthly_price)).filter(p => !isNaN(p) && p > 0);
  if (prices.length === 0) return { min: 0, max: 20000000 };

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  // Add 10% buffer to max to make the slider feel better
  return {
    min: Math.floor(min / 100000) * 100000, // Round down to nearest 100k
    max: Math.ceil((max * 1.1) / 100000) * 100000 // Round up to nearest 100k with buffer
  };
});

/* ===========================
   COMPUTED
   =========================== */

const hasActiveFilters = computed(() => {
  const f = localFilters.value;
  return f.search || f.city || f.type || f.maxPrice;
});

/* ===========================
   METHODS
   =========================== */

const emitFilters = () => {
  emit("update:modelValue", { ...localFilters.value });
};

const setCategory = (typeId) => {
  localFilters.value.type = localFilters.value.type === typeId ? '' : typeId;
  emitFilters();
};

const setZone = (zoneVal) => {
  localFilters.value.zone = localFilters.value.zone === zoneVal ? '' : zoneVal;
  emitFilters();
};

const clearFilters = () => {
  localFilters.value = {
    search: "",
    city: "",
    type: "",
    zone: "",
    maxPrice: null,
    rating: null,
    rooms: null
  };
  emitFilters();
};

const formatPrice = (price) => {
  if (!price) return "";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(price);
};

const selectSuggestion = (s) => {
  if (!s) return;
  localFilters.value.search = s.description;
  // Sync to city for backend/parent logic that might still check this field
  localFilters.value.city = s.description;
  showSuggestions.value = false;
  locationSuggestions.value = [];
  selectedIndex.value = -1;
  emitFilters();

  // Give it a tiny delay to ensure state is updated before triggering deep search
  setTimeout(() => {
    emit("search-explore");
  }, 100);
};

const handleKeydown = (e) => {
  if (!showSuggestions.value || !locationSuggestions.value.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % locationSuggestions.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value - 1 + locationSuggestions.value.length) % locationSuggestions.value.length;
  } else if (e.key === 'Enter') {
    if (selectedIndex.value >= 0) {
      e.preventDefault();
      selectSuggestion(locationSuggestions.value[selectedIndex.value]);
    }
  } else if (e.key === 'Escape') {
    showSuggestions.value = false;
  }
};

const hideSuggestions = () => {
  setTimeout(() => (showSuggestions.value = false), 200);
};

/* ===========================
   AUTOCOMPLETE LOCATION
   =========================== */
watch(
  () => localFilters.value.search,
  (val) => {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    if (val && val.length > 1) {
      debounceTimeout = setTimeout(async () => {
        loadingSuggestions.value = true;
        try {
          locationSuggestions.value = await mapsService.autocompletePlace(val);
          showSuggestions.value = locationSuggestions.value.length > 0;
          selectedIndex.value = -1; // Reset selection on new results
        } catch (e) {
          locationSuggestions.value = [];
        } finally {
          loadingSuggestions.value = false;
        }
      }, 300); // 300ms debounce
    } else {
      showSuggestions.value = false;
      locationSuggestions.value = [];
    }
  }
);
</script>

<template>
  <section class="ultra-search-section sticky-search-bar" data-aos="fade-up">

    <div class="search-main-container">
      <div class="search-top-row">
        <!-- Text/Location Fields -->
        <div class="input-group">
          <div class="search-input-wrapper main-unified-search">
            <font-awesome-icon :icon="['fas', 'search']" class="icon" />
            <input type="text" placeholder="¿Dónde quieres vivir? (Ciudad, barrio o nombre)"
              v-model="localFilters.search" @focus="localFilters.search.length > 1 && (showSuggestions = true)"
              @blur="hideSuggestions" @input="emitFilters" @keydown="handleKeydown" />


            <div v-if="showSuggestions && locationSuggestions.length" class="suggestions-dropdown">
              <div v-for="(s, index) in locationSuggestions" :key="s.place_id" class="suggestion-item"
                :class="{ 'suggestion-selected': index === selectedIndex }"
                @mousedown="selectSuggestion(s)"
                @mouseover="selectedIndex = index">
                <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="suggestion-icon" />
                <div class="suggestion-content">
                  <span class="suggestion-main">{{ s.description.split(',')[0] }}</span>
                  <span class="suggestion-sub">{{ s.description.split(',').slice(1).join(',') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="action-group">
          <button class="search-btn-primary" @click="emitFilters(); $emit('search-explore')">
            <font-awesome-icon :icon="['fas', 'search']" />
            <span>Buscar</span>
          </button>

          <button class="search-btn-explore-map" @click="$emit('go-map', localFilters.search)">
            <font-awesome-icon :icon="['fas', 'map-location-dot']" />
            <span>Explorar</span>
          </button>
        </div>
      </div>

      <!-- Category Chips Row (UI Precisa) -->
      <div class="categories-row">
        <button v-for="cat in propertyCategories" :key="cat.id" class="category-chip"
          :class="{ active: localFilters.type === cat.id }" @click="setCategory(cat.id)">
          <font-awesome-icon :icon="['fas', cat.icon]" class="cat-icon" />
          <span class="cat-label">{{ t(cat.label) }}</span>
          <span class="cat-count">{{ categoryCounts[cat.id] }}</span>
        </button>
      </div>

      <!-- Advanced Filters Section (Precisión Máxima) -->
      <Transition name="expand">
        <div v-if="showAdvancedFilters" class="advanced-panel">
          <div class="advanced-grid">
            <!-- Zone Filter -->
            <div class="adv-field" v-if="localFilters.city">
              <label>Zona en {{ localFilters.city.split(',')[0] }}</label>
              <div class="distance-options">
                <button v-for="z in zoneOptions" :key="z.value" class="dist-opt"
                  :class="{ active: localFilters.zone === z.value }" @click="setZone(z.value)">
                  {{ z.icon }} {{ z.label }}
                </button>
              </div>
            </div>

            <!-- Price Range Precise -->
            <div class="adv-field">
              <label>Presupuesto Máximo: <strong>{{ formatPrice(localFilters.maxPrice || availablePriceRange.max)
              }}</strong></label>
              <div class="slider-container">
                <input type="range" :min="availablePriceRange.min" :max="availablePriceRange.max" step="100000"
                  v-model.number="localFilters.maxPrice" @change="emitFilters" @input="emitFilters"
                  class="ultra-slider" />
                <div class="slider-labels">
                  <span>{{ formatPrice(availablePriceRange.min) }}</span>
                  <span>{{ formatPrice(availablePriceRange.max) }}</span>
                </div>
              </div>
            </div>

            <!-- Habitaciones Filter (Simple as requested) -->
            <div class="adv-field">
              <label>Habitaciones (Mínimo)</label>
              <div class="distance-options">
                <button class="dist-opt" :class="{ active: localFilters.rooms === 1 }"
                  @click="localFilters.rooms = 1; emitFilters()">1+</button>
                <button class="dist-opt" :class="{ active: localFilters.rooms === 2 }"
                  @click="localFilters.rooms = 2; emitFilters()">2+</button>
                <button class="dist-opt" :class="{ active: localFilters.rooms === 3 }"
                  @click="localFilters.rooms = 3; emitFilters()">3+</button>
                <button class="dist-opt" :class="{ active: localFilters.rooms === 4 }"
                  @click="localFilters.rooms = 4; emitFilters()">4+</button>
                <button class="dist-opt" :class="{ active: !localFilters.rooms }"
                  @click="localFilters.rooms = null; emitFilters()">Todas</button>
              </div>
            </div>

            <!-- Rating Filter -->
            <div class="adv-field">
              <label>Valoración Mínima</label>
              <div class="rating-stars">
                <font-awesome-icon v-for="i in 5" :key="i" :icon="['fas', 'star']"
                  :class="{ filled: (localFilters.rating || 0) >= i }"
                  @click="localFilters.rating = i; emitFilters()" />
              </div>
            </div>
          </div>

          <div class="advanced-footer">
            <button class="reset-btn" @click="clearFilters">Limpiar todo</button>
            <p v-if="filteredCount === 0" class="error-msg">Ninguna propiedad cumple estos criterios exactos. Prueba
              ajustando los rangos.</p>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
@import "../../assets/css/Properties/PropertyView.css";

.input-group {
  flex: 1;
  display: flex;
}

.search-input-wrapper.full-width {
  width: 100%;
  flex: 1;
}

.search-input-wrapper.full-width input {
  width: 100%;
  border-radius: 16px;
  background: #f8f9fa;
  border: 2px solid #eee;
  padding-left: 50px;
  font-size: 1.05rem;
  transition: all 0.3s ease;
}

.search-input-wrapper.full-width input:focus {
  border-color: var(--gold);
  background: white;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.action-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Standardize all 3 buttons */
.advanced-btn,
.search-btn-primary,
.search-btn-explore-map {
  height: 54px;
  min-width: 140px;
  border-radius: 18px;
  border: none;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  white-space: nowrap;
  font-size: 0.95rem;
  letter-spacing: 0.6px;
  padding: 0 28px;
  text-transform: capitalize;
}

.advanced-btn {
  background: white;
  color: #3b251d;
  border: 2px solid #edeff2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.search-btn-primary,
.search-btn-explore-map {
  background: linear-gradient(135deg, #3b251d 0%, #1a100d 100%);
  color: white;
  box-shadow: 0 10px 20px rgba(59, 37, 29, 0.25);
}

.search-btn-primary:hover,
.search-btn-explore-map:hover,
.advanced-btn:hover {
  transform: translateY(-4px) scale(1.03);
}

.search-btn-primary:hover,
.search-btn-explore-map:hover {
  box-shadow: 0 15px 30px rgba(59, 37, 29, 0.4);
  filter: brightness(1.15);
}

.advanced-btn:hover {
  border-color: #bc8f2c;
  background: #fffcf8;
  color: #bc8f2c;
  box-shadow: 0 8px 20px rgba(188, 143, 44, 0.1);
}

.search-btn-primary:active,
.search-btn-explore-map:active,
.advanced-btn:active {
  transform: translateY(-1px) scale(0.98);
}
</style>