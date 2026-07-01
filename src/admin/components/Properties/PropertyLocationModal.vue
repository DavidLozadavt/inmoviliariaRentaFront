<template>
  <AdminModal
    :model-value="show"
    title="Confirmar Ubicación"
    subtitle="Ajusta el marcador para la ubicación exacta"
    :icon="['fas', 'map-marker-alt']"
    maxWidth="900px"
    @close="handleCancel"
  >
    <!-- Property info bar -->
    <div class="plm-info-bar" style="display: flex; gap: 1.5rem; padding: 0.75rem 1.5rem; background: var(--admin-surface-elevated, #f8fafc); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 12px; margin-bottom: 1.25rem; flex-wrap: wrap;">
      <div class="plm-info" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--admin-text-primary); font-weight: 600;"><font-awesome-icon :icon="['fas', 'home']" style="color: var(--admin-text-muted);" /> {{ propertyData.title }}</div>
      <div class="plm-info" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--admin-text-primary); font-weight: 600;"><font-awesome-icon :icon="['fas', 'city']" style="color: var(--admin-text-muted);" /> {{ propertyData.city }}</div>
      <div class="plm-info" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--admin-text-primary); font-weight: 600;"><font-awesome-icon :icon="['fas', 'map']" style="color: var(--admin-text-muted);" /> {{ propertyData.address }}</div>
    </div>

    <!-- Map section -->
    <div class="plm-map-section" style="display: flex; flex-direction: column; gap: 0.85rem;">
      <div id="location-confirm-map" class="plm-map" style="width: 100%; height: 420px; border-radius: 14px; overflow: hidden; border: 1px solid var(--admin-border, #e2e8f0);"></div>

      <div class="plm-help" style="display: flex; gap: 1.25rem; padding: 0.75rem 1rem; background: rgba(59,130,246,0.06); border-radius: 10px; border: 1px solid rgba(59,130,246,0.15); flex-wrap: wrap;">
        <div class="plm-help__item" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #2563eb;"><font-awesome-icon :icon="['fas', 'mouse-pointer']" style="color: #3b82f6;" /> <span>Arrastra el marcador para ajustar la ubicación</span></div>
        <div class="plm-help__item" style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #2563eb;"><font-awesome-icon :icon="['fas', 'search-location']" style="color: #3b82f6;" /> <span>Usa la búsqueda para encontrar la dirección exacta</span></div>
      </div>

      <button class="plm-locate" :disabled="locating || saving" @click="useCurrentLocation" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.15rem; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.3); transition: all 0.2s; width: fit-content;">
        <font-awesome-icon :icon="['fas', locating ? 'spinner' : 'crosshairs']" :spin="locating" />
        {{ locating ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual' }}
      </button>

      <!-- Address search -->
      <div class="plm-search" style="position: relative;">
        <input v-model="searchQuery" type="text" class="plm-search__input" placeholder="Buscar dirección específica..." @input="handleAddressSearch" style="width: 100%; padding: 0.7rem 1rem; border: 1px solid var(--admin-border, #e2e8f0); border-radius: 10px; font-size: 0.85rem; font-weight: 500; background: var(--admin-surface, #fff); color: var(--admin-text-primary, #0f172a); box-sizing: border-box;" />
        <div v-if="searchResults.length > 0" class="plm-search__results" style="position: absolute; top: 100%; left: 0; right: 0; margin-top: 0.35rem; background: var(--admin-surface, #fff); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-height: 260px; overflow-y: auto; z-index: 10;">
          <div v-for="result in searchResults" :key="result.place_id" class="plm-search__item" @click="selectSearchResult(result)" style="padding: 0.7rem 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; border-bottom: 1px solid var(--admin-border, #e2e8f0); font-size: 0.82rem; color: var(--admin-text-primary);">
            <font-awesome-icon :icon="['fas', 'map-pin']" style="color: var(--accent, #6366f1); flex-shrink: 0;" /> {{ result.description }}
          </div>
        </div>
      </div>

      <!-- Coordinates -->
      <div class="plm-coords" style="display: flex; gap: 1.5rem; padding: 0.75rem 1rem; background: var(--admin-surface-elevated, #f8fafc); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 10px; flex-wrap: wrap;">
        <div class="plm-coord" style="display: flex; gap: 0.35rem; font-size: 0.82rem;"><strong style="color: var(--admin-text-muted); font-weight: 700;">Latitud:</strong> <span style="color: var(--admin-text-primary); font-weight: 600;">{{ currentLat.toFixed(6) }}</span></div>
        <div class="plm-coord" style="display: flex; gap: 0.35rem; font-size: 0.82rem;"><strong style="color: var(--admin-text-muted); font-weight: 700;">Longitud:</strong> <span style="color: var(--admin-text-primary); font-weight: 600;">{{ currentLng.toFixed(6) }}</span></div>
        <div class="plm-coord" style="display: flex; gap: 0.35rem; font-size: 0.82rem;"><strong style="color: var(--admin-text-muted); font-weight: 700;">Precisión:</strong> <span :style="{ color: getAccuracyColor(), fontWeight: 600 }">±{{ formatAccuracy(currentAccuracy) }}</span></div>
      </div>
    </div>

    <template #footer>
      <button class="rx-btn rx-btn--ghost" @click="handleCancel" :disabled="saving" style="padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.875rem; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text-secondary); cursor: pointer;"><font-awesome-icon :icon="['fas', 'times']" /> Cancelar</button>
      <button class="rx-btn rx-btn--accent" @click="handleConfirm" :disabled="saving" style="padding: 0.65rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.875rem; border: none; background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; cursor: pointer; box-shadow: 0 2px 10px rgba(99,102,241,.25);"><font-awesome-icon :icon="['fas', saving ? 'spinner' : 'check']" :spin="saving" /> {{ saving ? 'Guardando...' : 'Confirmar Ubicación' }}</button>
    </template>
  </AdminModal>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue';
import AdminModal from '@/admin/components/AdminModal.vue';
import api from '@/services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl, iconRetinaUrl, shadowUrl,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

interface Props {
  show: boolean;
  propertyData: { title: string; city: string; address: string; };
}

interface LocationData { lat: number; lng: number; accuracy: number; }

const props = defineProps<Props>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'confirm', data: LocationData): void; }>();

const saving = ref(false);
const locating = ref(false);
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const currentLat = ref(2.4448);
const currentLng = ref(-76.6147);
const currentAccuracy = ref(100);

let map: L.Map | null = null;
let marker: L.Marker | null = null;
let accuracyCircle: L.Circle | null = null;
let searchTimeout: ReturnType<typeof setTimeout>;

const formatAccuracy = (accuracy: number): string => accuracy > 1000 ? `${(accuracy / 1000).toFixed(1)} km` : `${Math.round(accuracy)} m`;
const getAccuracyColor = (): string => { if (currentAccuracy.value <= 100) return '#27ae60'; if (currentAccuracy.value > 1000) return '#e74c3c'; return '#f39c12'; };

const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const query = `${address}, ${props.propertyData.city}, Colombia`;
    // Usar el proxy del backend (api service) para evitar CORS
    const response = await api.get('/geocoding/search', {
      params: { format: 'json', q: query, limit: 1 }
    });
    const data = response.data;
    if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    return null;
  } catch (error) { console.error('Error en geocoding:', error); return null; }
};

const handleAddressSearch = () => {
  clearTimeout(searchTimeout);
  if (searchQuery.value.length < 3) { searchResults.value = []; return; }
  searchTimeout = setTimeout(async () => {
    try {
      const query = `${searchQuery.value}, ${props.propertyData.city}, Colombia`;
      const response = await api.get('/geocoding/search', {
        params: { format: 'json', q: query, limit: 5 }
      });
      const data = response.data;
      searchResults.value = data.map((item: any) => ({ place_id: item.place_id, description: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) }));
    } catch (error) { console.error('Error buscando direcciones:', error); searchResults.value = []; }
  }, 500);
};

const selectSearchResult = (result: any) => {
  currentLat.value = result.lat; currentLng.value = result.lng;
  if (map && marker) { const newLatLng = L.latLng(result.lat, result.lng); marker.setLatLng(newLatLng); map.setView(newLatLng, 17); if (accuracyCircle) accuracyCircle.setLatLng(newLatLng); }
  searchQuery.value = ''; searchResults.value = [];
};

const useCurrentLocation = () => {
  if (!navigator.geolocation) { alert('Tu navegador no soporta geolocalización.'); return; }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locating.value = false;
      const { latitude: lat, longitude: lng, accuracy } = position.coords;
      currentLat.value = lat; currentLng.value = lng; currentAccuracy.value = accuracy;
      if (map && marker) {
        const newLatLng = L.latLng(lat, lng); marker.setLatLng(newLatLng); map.flyTo(newLatLng, 17, { duration: 1 });
        if (accuracyCircle) { accuracyCircle.setLatLng(newLatLng); accuracyCircle.setRadius(accuracy); accuracyCircle.setStyle({ color: getAccuracyColor(), fillColor: getAccuracyColor() }); }
      }
    },
    (error) => {
      locating.value = false;
      const msgs: Record<number, string> = { 1: 'Permiso de ubicación denegado.', 2: 'No se pudo obtener la posición.', 3: 'Tiempo de espera agotado.' };
      alert(`❌ ${msgs[error.code] ?? 'Error desconocido al obtener ubicación.'}`);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

const initMap = async () => {
  await nextTick();
  const mapElement = document.getElementById('location-confirm-map');
  if (!mapElement || map) return;
  let initialLat = 2.4448; let initialLng = -76.6147;
  const geocoded = await geocodeAddress(props.propertyData.address);
  if (geocoded) { initialLat = geocoded.lat; initialLng = geocoded.lng; currentLat.value = initialLat; currentLng.value = initialLng; }
  map = L.map('location-confirm-map', { center: [initialLat, initialLng], zoom: 16, zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  marker = L.marker([initialLat, initialLng], { draggable: true, autoPan: true }).addTo(map);
  accuracyCircle = L.circle([initialLat, initialLng], { radius: currentAccuracy.value, color: getAccuracyColor(), fillColor: getAccuracyColor(), fillOpacity: 0.15, weight: 2 }).addTo(map);
  marker.bindPopup(`<div style="text-align:center;padding:10px;"><strong>📍 Ubicación de la Propiedad</strong><br><small>Arrastra el marcador para ajustar</small></div>`).openPopup();
  marker.on('dragend', (e) => {
    const newPos = (e.target as L.Marker).getLatLng(); currentLat.value = newPos.lat; currentLng.value = newPos.lng;
    if (accuracyCircle) accuracyCircle.setLatLng(newPos); map?.setView(newPos, map.getZoom());
  });
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => { currentAccuracy.value = position.coords.accuracy; if (accuracyCircle) { accuracyCircle.setRadius(position.coords.accuracy); accuracyCircle.setStyle({ color: getAccuracyColor(), fillColor: getAccuracyColor() }); } },
      (error) => { console.warn('No se pudo obtener ubicación GPS:', error); },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }
};

const destroyMap = () => { if (marker) { marker.off('dragend'); marker = null; } if (map) { map.remove(); map = null; } accuracyCircle = null; };
const handleCancel = () => { if (!saving.value) { destroyMap(); emit('close'); } };
const handleConfirm = () => { saving.value = true; emit('confirm', { lat: currentLat.value, lng: currentLng.value, accuracy: currentAccuracy.value }); };

watch(() => props.show, async (newShow) => {
  if (newShow) { saving.value = false; searchQuery.value = ''; searchResults.value = []; await nextTick(); setTimeout(() => { initMap(); }, 100); }
  else { destroyMap(); }
});

onUnmounted(() => { destroyMap(); });
</script>

<style scoped>
.plm-info-bar { display: flex; gap: 1.5rem; padding: .75rem 1.5rem; background: var(--admin-surface-elevated, #f8fafc); border-bottom: 1px solid var(--admin-border, #e2e8f0); flex-wrap: wrap; }
.plm-info { display: flex; align-items: center; gap: .4rem; font-size: .82rem; color: var(--admin-text-primary, #0f172a); font-weight: 600; }
.plm-info svg { color: var(--admin-text-muted, #94a3b8); }

.plm-map-section { flex: 1; display: flex; flex-direction: column; padding: 1.25rem; gap: .85rem; overflow-y: auto; }
.plm-map { width: 100%; height: 420px; border-radius: 14px; overflow: hidden; border: 1px solid var(--admin-border, #e2e8f0); }

.plm-help { display: flex; gap: 1.25rem; padding: .75rem 1rem; background: rgba(59,130,246,.06); border-radius: 10px; border: 1px solid rgba(59,130,246,.15); flex-wrap: wrap; }
.plm-help__item { display: flex; align-items: center; gap: .4rem; font-size: .8rem; color: #2563eb; }
.plm-help__item svg { color: #3b82f6; }

.plm-locate { display: flex; align-items: center; gap: .5rem; padding: .7rem 1.15rem; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; border: none; border-radius: 10px; font-size: .85rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,.3); transition: all .2s; width: fit-content; font-family: inherit; }
.plm-locate:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,.4); }
.plm-locate:disabled { opacity: .5; cursor: not-allowed; transform: none; }

.plm-search { position: relative; }
.plm-search__input { width: 100%; padding: .7rem 1rem; border: 1px solid var(--admin-border, #e2e8f0); border-radius: 10px; font-size: .85rem; font-weight: 500; background: var(--admin-surface, #fff); color: var(--admin-text-primary, #0f172a); transition: all .2s; font-family: inherit; box-sizing: border-box; }
.plm-search__input:focus { outline: none; border-color: var(--accent, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
.plm-search__results { position: absolute; top: 100%; left: 0; right: 0; margin-top: .35rem; background: var(--admin-surface, #fff); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,.1); max-height: 260px; overflow-y: auto; z-index: 10; }
.plm-search__item { padding: .7rem 1rem; cursor: pointer; display: flex; align-items: center; gap: .6rem; transition: background .15s; border-bottom: 1px solid var(--admin-border, #e2e8f0); font-size: .82rem; color: var(--admin-text-primary, #0f172a); }
.plm-search__item:last-child { border-bottom: none; }
.plm-search__item:hover { background: var(--admin-surface-elevated, #f8fafc); }
.plm-search__item svg { color: var(--accent, #6366f1); flex-shrink: 0; }

.plm-coords { display: flex; gap: 1.5rem; padding: .75rem 1rem; background: var(--admin-surface-elevated, #f8fafc); border: 1px solid var(--admin-border, #e2e8f0); border-radius: 10px; flex-wrap: wrap; }
.plm-coord { display: flex; gap: .35rem; font-size: .82rem; }
.plm-coord strong { color: var(--admin-text-muted, #94a3b8); font-weight: 700; }
.plm-coord span { color: var(--admin-text-primary, #0f172a); font-weight: 600; }

@media (max-width: 768px) {
  .plm-map { height: 320px; }
  .plm-info-bar, .plm-help, .plm-coords { flex-direction: column; gap: .5rem; }
  .plm-locate { width: 100%; justify-content: center; }
}
</style>