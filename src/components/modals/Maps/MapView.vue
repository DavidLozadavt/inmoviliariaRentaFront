<template>
  <div class="map-container">

    <!-- ===== BARRA DE BÚSQUEDA POR BARRIOS (solo en modo edición) ===== -->
    <div v-if="canEdit" class="map-search-bar">
      <div class="search-input-wrapper">
        <span class="search-prefix-icon">🔍</span>
        <input
          v-model="neighborhoodQuery"
          type="text"
          placeholder="Buscar barrio, dirección o sector..."
          class="search-neighborhood-input"
          @input="onNeighborhoodInput"
          @keydown.escape="closeSuggestions"
          @keydown.enter.prevent="selectFirstSuggestion"
          autocomplete="off"
        />
        <button
          v-if="neighborhoodQuery"
          class="search-clear-btn"
          @click="clearNeighborhoodSearch"
          title="Limpiar búsqueda"
        >✕</button>
      </div>

      <!-- Sugerencias desplegables -->
      <ul v-if="neighborhoodSuggestions.length > 0" class="neighborhood-suggestions">
        <li
          v-for="(s, i) in neighborhoodSuggestions"
          :key="i"
          class="suggestion-item"
          @mousedown.prevent="selectNeighborhood(s)"
        >
          <span class="suggestion-type-icon">{{ s.isNeighborhood ? '🏘️' : '📍' }}</span>
          <div class="suggestion-texts">
            <span class="suggestion-name">{{ s.name }}</span>
            <span class="suggestion-city">{{ s.city }}</span>
          </div>
        </li>
      </ul>
    </div>
    <!-- ===== FIN BARRA DE BÚSQUEDA ===== -->

    <div id="map"></div>

    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Guardando ubicación...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { onMounted, onUnmounted, ref, watch, computed, nextTick } from "vue";
import api from "../../../services/api";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Configurar iconos de Leaflet
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Props {
  id?: number | string;
  lat?: number | string;
  lng?: number | string;
  readonly?: boolean;
  ownerId?: number | string;
  owner_id?: number | string;
  user_id?: number | string;
  title?: string;
  address?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

// CONSTANTES
const POPAYAN_CENTER = { lat: 2.4448, lng: -76.6147 } as const;
const GOOD_ACCURACY = 100 as const;
const MAX_ACCEPTABLE_ACCURACY = 5000 as const;

// REFs
const isLoading = ref(false);
const currentUserId = ref<number | null>(null);
const propertyAccuracy = ref<number>(50);
const mapReady = ref(false);

// ===== REFs PARA BÚSQUEDA DE BARRIOS =====
const neighborhoodQuery = ref('');
const neighborhoodSuggestions = ref<Array<{
  name: string;
  city: string;
  lat: number;
  lng: number;
  isNeighborhood: boolean;
}>>([]);
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Instancias Leaflet
let map: L.Map;
let userMarker: L.Marker | null = null;
let accuracyCircle: L.Circle | null = null;
let watchId: number | null = null;
let locateControl: L.Control | null = null;

// COMPUTED
const propertyId = computed(() => {
  const id = props.id;
  return id ? Number(id) : null;
});

const propOwnerId = computed(() => {
  const raw = props.ownerId ?? props.owner_id ?? props.user_id ?? null;
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
});

const isOwner = computed(() => {
  if (!currentUserId.value || propOwnerId.value === null) return false;
  return Number(currentUserId.value) === Number(propOwnerId.value);
});

const canEdit = computed(() => {
  return !props.readonly && isOwner.value && propertyId.value !== null;
});

// UTILIDADES
function isInColombia(lat: number, lng: number): boolean {
  return lat >= -5 && lat <= 14 && lng >= -80 && lng <= -65;
}

function formatAccuracy(accuracy: number): string {
  return accuracy > 1000 
    ? `${(accuracy / 1000).toFixed(1)} km` 
    : `${Math.round(accuracy)} m`;
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy <= GOOD_ACCURACY) return "#27ae60";
  if (accuracy > 1000) return "#e74c3c";
  return "#f39c12";
}

// ==================== BÚSQUEDA POR BARRIOS ====================

const POPAYAN_NEIGHBORHOODS = [
  { name: 'Centro Histórico',       city: 'Popayán', lat: 2.4413,  lng: -76.6053 },
  { name: 'El Bolívar',             city: 'Popayán', lat: 2.4412,  lng: -76.6089 },
  { name: 'La Esmeralda',           city: 'Popayán', lat: 2.4562,  lng: -76.6203 },
  { name: 'Pandiguando',            city: 'Popayán', lat: 2.4478,  lng: -76.6234 },
  { name: 'Alfonso López',          city: 'Popayán', lat: 2.4389,  lng: -76.6312 },
  { name: 'La Paz',                 city: 'Popayán', lat: 2.4501,  lng: -76.6178 },
  { name: 'Lomas de Granada',       city: 'Popayán', lat: 2.4523,  lng: -76.6145 },
  { name: 'El Recuerdo',            city: 'Popayán', lat: 2.4456,  lng: -76.6267 },
  { name: 'Camilo Torres',          city: 'Popayán', lat: 2.4434,  lng: -76.6198 },
  { name: 'Las Palmas',             city: 'Popayán', lat: 2.4478,  lng: -76.6101 },
  { name: 'El Portal',              city: 'Popayán', lat: 2.4534,  lng: -76.6089 },
  { name: 'Las Américas',           city: 'Popayán', lat: 2.4398,  lng: -76.6156 },
  { name: 'El Cadillal',            city: 'Popayán', lat: 2.4567,  lng: -76.6312 },
  { name: 'Antonio Nariño',         city: 'Popayán', lat: 2.4345,  lng: -76.6234 },
  { name: 'Los Comuneros',          city: 'Popayán', lat: 2.4612,  lng: -76.6189 },
  { name: 'Urbanización Valencia',  city: 'Popayán', lat: 2.4489,  lng: -76.6167 },
  { name: 'Santa Helena',           city: 'Popayán', lat: 2.4423,  lng: -76.6278 },
  { name: 'El Uvo',                 city: 'Popayán', lat: 2.4378,  lng: -76.6345 },
  { name: 'Seminario',              city: 'Popayán', lat: 2.4401,  lng: -76.6123 },
  { name: 'La Pamba',               city: 'Popayán', lat: 2.4467,  lng: -76.6056 },
  { name: 'Pubenza',                city: 'Popayán', lat: 2.4356,  lng: -76.6189 },
  { name: 'Las Delicias',           city: 'Popayán', lat: 2.4590,  lng: -76.6267 },
  { name: 'El Canelo',              city: 'Popayán', lat: 2.4612,  lng: -76.6098 },
  { name: 'Yanaconas',              city: 'Popayán', lat: 2.4289,  lng: -76.6145 },
  { name: 'La Estancia',            city: 'Popayán', lat: 2.4512,  lng: -76.6312 },
];

function onNeighborhoodInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  const q = neighborhoodQuery.value.trim();
  if (q.length < 2) { neighborhoodSuggestions.value = []; return; }
  searchDebounceTimer = setTimeout(() => performNeighborhoodSearch(q), 350);
}

async function performNeighborhoodSearch(query: string) {
  const q = query.toLowerCase();

  const localResults = POPAYAN_NEIGHBORHOODS
    .filter(n => n.name.toLowerCase().includes(q))
    .map(n => ({ name: n.name, city: n.city, lat: n.lat, lng: n.lng, isNeighborhood: true }));

  neighborhoodSuggestions.value = localResults;

  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query + ' Colombia')}&format=json&limit=5&countrycodes=co&addressdetails=1&accept-language=es`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    if (!res.ok) return;

    const data = await res.json();
    const apiResults = data
      .filter((r: any) => r.lat && r.lon)
      .map((r: any) => {
        const addr = r.address || {};
        const isNeighborhood = !!(addr.neighbourhood || addr.suburb || addr.quarter);
        const name = addr.neighbourhood || addr.suburb || addr.quarter
          || addr.road || addr.amenity || r.display_name.split(',')[0];
        const city = addr.city || addr.town || addr.municipality || addr.county || 'Colombia';
        return { name, city, lat: parseFloat(r.lat), lng: parseFloat(r.lon), isNeighborhood };
      });

    const combined = [...localResults];
    apiResults.forEach((r: any) => {
      if (!combined.find(c => c.name.toLowerCase() === r.name.toLowerCase())) {
        combined.push(r);
      }
    });
    neighborhoodSuggestions.value = combined.slice(0, 8);

  } catch (err) {
    console.warn('Nominatim no disponible, usando solo resultados locales');
  }
}

function selectNeighborhood(s: typeof neighborhoodSuggestions.value[0]) {
  neighborhoodQuery.value = s.name;
  neighborhoodSuggestions.value = [];
  placeMarker(s.lat, s.lng, 150);
}

function selectFirstSuggestion() {
  if (neighborhoodSuggestions.value.length > 0) {
    selectNeighborhood(neighborhoodSuggestions.value[0]);
  }
}

function closeSuggestions() {
  neighborhoodSuggestions.value = [];
}

function clearNeighborhoodSearch() {
  neighborhoodQuery.value = '';
  neighborhoodSuggestions.value = [];
}

// ==================== FIN BÚSQUEDA POR BARRIOS ====================

// API FUNCTIONS
async function savePropertyPoint(propId: number, lat: number, lng: number, accuracy: number) {
  try {
    isLoading.value = true;
    
    console.log(`📤 Guardando ubicación - ID: ${propId}, Lat: ${lat}, Lng: ${lng}, Precisión: ${accuracy}m`);

    const response = await api.post(`/properties/${propId}/point`, {
      lat,
      lng,
      accuracy
    });

    console.log(`✅ Ubicación guardada exitosamente`);
    propertyAccuracy.value = accuracy;
    
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("❌ Error guardando ubicación:", error);
    
    let errorMsg = "Error desconocido";
    
    if (error.response?.status === 403) {
      errorMsg = "⛔ No tienes permiso para actualizar esta propiedad.\n\n🔒 Solo el dueño puede modificar la ubicación.";
    } else if (error.response?.status === 401) {
      errorMsg = "Tu sesión expiró. Por favor inicia sesión nuevamente.";
    } else if (error.response?.status === 404) {
      errorMsg = "Propiedad no encontrada.";
    } else if (error.response?.status === 422) {
      errorMsg = `Error de validación:\n${JSON.stringify(error.response?.data?.errors || error.response?.data?.message)}`;
    } else {
      errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    }

    alert(`❌ Error al guardar ubicación:\n\n${errorMsg}`);
    throw error;
  } finally {
    isLoading.value = false;
  }
}

// GEOLOCATION FUNCTIONS
function getPreciseLocation(): Promise<{ lat: number; lng: number; acc: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("❌ Geolocalización no disponible");
      resolve(null);
      return;
    }

    console.log("🔍 Obteniendo ubicación GPS de alta precisión...");

    let bestLocation: { lat: number; lng: number; acc: number } | null = null;
    let attempts = 0;
    const maxAttempts = 5;
    const targetAccuracy = 50;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      
      if (bestLocation && bestLocation.acc < MAX_ACCEPTABLE_ACCURACY) {
        console.log(`⏱️ Timeout alcanzado. Usando mejor ubicación: ${Math.round(bestLocation.acc)}m`);
        resolve(bestLocation);
      } else {
        console.warn("⏱️ Timeout sin ubicación válida");
        resolve(null);
      }
    }, 30000);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        attempts++;
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        console.log(`📍 Intento ${attempts}: Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}, Precisión ${Math.round(accuracy)}m`);

        if (!isInColombia(lat, lng)) {
          console.warn(`⚠️ Ubicación fuera de Colombia en intento ${attempts}`);
          if (attempts >= maxAttempts) {
            cleanup();
            clearTimeout(timeoutId);
            resolve(null);
          }
          return;
        }

        if (accuracy > MAX_ACCEPTABLE_ACCURACY) {
          console.warn(`⚠️ Precisión muy mala: ${Math.round(accuracy)}m`);
          if (attempts >= maxAttempts) {
            cleanup();
            clearTimeout(timeoutId);
            resolve(bestLocation && bestLocation.acc < MAX_ACCEPTABLE_ACCURACY ? bestLocation : null);
          }
          return;
        }

        if (!bestLocation || accuracy < bestLocation.acc) {
          bestLocation = { lat, lng, acc: accuracy };
          console.log(`✨ Nueva mejor ubicación: ${Math.round(accuracy)}m`);
        }

        if (accuracy <= targetAccuracy) {
          console.log(`✅ Precisión objetivo alcanzada: ${Math.round(accuracy)}m`);
          cleanup();
          clearTimeout(timeoutId);
          resolve(bestLocation);
          return;
        }

        if (attempts >= maxAttempts) {
          cleanup();
          clearTimeout(timeoutId);
          console.log(`✓ Usando mejor ubicación después de ${maxAttempts} intentos: ${Math.round(bestLocation.acc)}m`);
          resolve(bestLocation);
        }
      },
      (error) => {
        console.error(`❌ Error GPS (intento ${attempts + 1}):`, error.message);
        attempts++;

        if (attempts >= maxAttempts) {
          cleanup();
          clearTimeout(timeoutId);
          resolve(bestLocation && bestLocation.acc < MAX_ACCEPTABLE_ACCURACY ? bestLocation : null);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

// MARKER FUNCTIONS
function clearExistingLayers() {
  if (userMarker) {
    try { 
      userMarker.off();
      map.removeLayer(userMarker); 
    } catch (e) { /* ignore */ }
    userMarker = null;
  }
  
  if (accuracyCircle) {
    try { map.removeLayer(accuracyCircle); } catch (e) { /* ignore */ }
    accuracyCircle = null;
  }
}

function setupMarkerEvents() {
  if (!userMarker || !canEdit.value) return;

  userMarker.off("dragend");
  userMarker.on("dragend", (e) => {
    const marker = e.target as L.Marker;
    const pos = marker.getLatLng();
    
    if (!isInColombia(pos.lat, pos.lng)) {
      alert("⚠️ Ubicación fuera de Colombia. El marcador se reposicionará.");
      placeMarker(POPAYAN_CENTER.lat, POPAYAN_CENTER.lng, propertyAccuracy.value || 50);
      return;
    }

    if (accuracyCircle) {
      accuracyCircle.setLatLng(pos);
    }

    updatePopupContent(pos.lat, pos.lng, propertyAccuracy.value);
    
    console.log("📍 Marcador arrastrado a:", pos.lat.toFixed(6), pos.lng.toFixed(6));
  });
}

async function placeMarker(lat: number, lng: number, accuracy: number, fromProps: boolean = false) {
  lat = Number(lat);
  lng = Number(lng);
  accuracy = Number(accuracy);

  if (isNaN(lat) || isNaN(lng)) {
    console.error("❌ Coordenadas inválidas:", { lat, lng });
    lat = POPAYAN_CENTER.lat;
    lng = POPAYAN_CENTER.lng;
    accuracy = 999;
  }

  if (!isInColombia(lat, lng)) {
    console.warn(`⚠️ Coordenadas fuera de Colombia: ${lat}, ${lng}`);
    if (!fromProps) {
      lat = POPAYAN_CENTER.lat;
      lng = POPAYAN_CENTER.lng;
      accuracy = 999;
    }
  }

  if (fromProps) {
    propertyAccuracy.value = accuracy;
  }

  clearExistingLayers();

  const isDraggable = canEdit.value;
  console.log("🔍 placeMarker -> canEdit:", canEdit.value, "draggable:", isDraggable);

  userMarker = L.marker([lat, lng], {
    draggable: isDraggable,
    autoPan: true
  }).addTo(map);

  if (userMarker.dragging) {
    if (isDraggable) {
      userMarker.dragging.enable();
    } else {
      userMarker.dragging.disable();
    }
  }

  const circleColor = getAccuracyColor(accuracy);
  accuracyCircle = L.circle([lat, lng], {
    radius: accuracy,
    color: circleColor,
    fillColor: circleColor,
    fillOpacity: 0.15,
    weight: 2
  }).addTo(map);

  const zoomLevel = accuracy <= GOOD_ACCURACY ? 18 : 16;
  map.flyTo([lat, lng], zoomLevel, { duration: 1 });

  if (canEdit.value) {
    createEditablePopup(lat, lng, accuracy);
  } else {
    createReadonlyPopup(lat, lng, accuracy);
  }

  setupMarkerEvents();

  nextTick(() => {
    const element = userMarker?.getElement?.();
    if (element) {
      element.style.cursor = isDraggable ? "grab" : "default";
    }
  });
}

// POPUP FUNCTIONS
function updatePopupContent(lat: number, lng: number, accuracy: number) {
  if (!userMarker) return;
  
  const popup = userMarker.getPopup();
  if (!popup) return;

  const content = popup.getContent();
  if (typeof content === "string") {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    
    const coordsEl = tempDiv.querySelector(".popup-coordinates");
    const precisionEl = tempDiv.querySelector(".popup-precision");
    
    if (coordsEl) {
      coordsEl.innerHTML = `<strong>Lat:</strong> ${lat.toFixed(6)}<br><strong>Lng:</strong> ${lng.toFixed(6)}`;
    }
    
    if (precisionEl) {
      const color = getAccuracyColor(accuracy);
      precisionEl.innerHTML = `<span style="font-weight: 700; color: ${color};">±${formatAccuracy(accuracy)}</span>`;
      precisionEl.setAttribute("style", `font-weight: 700; color: ${color};`);
    }
    
    popup.setContent(tempDiv.innerHTML);
  }
}

function createEditablePopup(lat: number, lng: number, accuracy: number) {
  const isAccurate = accuracy <= GOOD_ACCURACY;
  const accuracyColor = getAccuracyColor(accuracy);
  const formattedAccuracy = formatAccuracy(accuracy);

  const popupHtml = `
    <div style="min-width: 250px; font-family: Arial, sans-serif;">
      <div style="border-bottom: 2px solid #3498db; padding-bottom: 8px; margin-bottom: 10px;">
        <strong style="color: #2c3e50; font-size: 14px;">📍 Ubicación de la Propiedad</strong>
        <div style="font-size: 11px; color: #7f8c8d; margin-top: 4px;">
          🔓 Modo Edición (Dueño)
        </div>
      </div>
      
      <div style="margin-bottom: 10px;">
        <strong style="color: #7f8c8d;">Radio de Precisión:</strong> 
        <span class="popup-precision" style="font-weight: 700; color: ${accuracyColor};">
          ±${formattedAccuracy}
        </span>
      </div>

      <div class="popup-coordinates" style="background: #ecf0f1; padding: 8px; border-radius: 6px; margin-bottom: 10px; font-size: 12px;">
        <strong>Lat:</strong> ${lat.toFixed(6)}<br>
        <strong>Lng:</strong> ${lng.toFixed(6)}
      </div>
      
      ${!isAccurate
        ? `<div style="background: ${accuracy > 1000 ? '#f8d7da' : '#fff3cd'}; color: ${accuracy > 1000 ? '#721c24' : '#856404'}; padding: 8px; border-radius: 6px; margin-bottom: 10px; font-size: 12px;">
              ${accuracy > 1000 ? '❌ Precisión muy baja' : '⚠️ Precisión media'}<br>
              <small>El círculo muestra el área de incertidumbre</small>
             </div>`
        : `<div style="background: #d4edda; color: #155724; padding: 8px; border-radius: 6px; margin-bottom: 10px; font-size: 12px;">
              ✓ Excelente precisión GPS<br>
              <small>La ubicación es muy exacta</small>
             </div>`
      }

      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button id="savePointBtn" class="popup-btn save-btn">
          💾 Guardar
        </button>
        <button id="retryPointBtn" class="popup-btn retry-btn">
          🔄 Actualizar GPS
        </button>
      </div>
      
      <div style="margin-top: 10px; font-size: 11px; color: #7f8c8d; text-align: center;">
        💡 Arrastra el marcador para ajustar manualmente
      </div>
    </div>
  `;

  // ✅ FIX: Eliminar listeners previos de popupopen antes de registrar uno nuevo
  userMarker!.off("popupopen");
  userMarker!.bindPopup(popupHtml, { 
    maxWidth: 350,
    closeOnClick: false
  }).openPopup();

  // ✅ FIX: Usar 'on' en lugar de 'once' para que funcione siempre,
  // no solo la primera vez que se abre el popup
  userMarker!.on("popupopen", () => {
    setTimeout(() => setupPopupEvents(), 50);
  });
}

// ✅ FIX PRINCIPAL: setupPopupEvents ahora siempre reemplaza y re-adjunta
// los eventos correctamente, sin importar si el marcador fue arrastrado o no
function setupPopupEvents() {
  const saveBtn = document.getElementById("savePointBtn");
  const retryBtn = document.getElementById("retryPointBtn");

  if (saveBtn) {
    const newSaveBtn = saveBtn.cloneNode(true) as HTMLElement;
    saveBtn.parentNode?.replaceChild(newSaveBtn, saveBtn);
    L.DomEvent.addListener(newSaveBtn, "click", async () => {
      await handleSaveLocation();
    });
  }

  if (retryBtn) {
    const newRetryBtn = retryBtn.cloneNode(true) as HTMLElement;
    retryBtn.parentNode?.replaceChild(newRetryBtn, retryBtn);
    L.DomEvent.addListener(newRetryBtn, "click", async () => {
      await handleRetryGPS(newRetryBtn as HTMLButtonElement);
    });
  }
}

async function handleSaveLocation() {
  if (!propertyId.value || !userMarker) {
    alert("❌ Error: No hay ID de propiedad para guardar");
    return;
  }

  const pos = userMarker.getLatLng();
  
  if (!isInColombia(pos.lat, pos.lng)) {
    alert("❌ Error: La ubicación debe estar en Colombia.");
    return;
  }

  try {
    await savePropertyPoint(propertyId.value, pos.lat, pos.lng, propertyAccuracy.value);
    
    const successHtml = `
      <div style="text-align: center; padding: 15px; font-family: Arial, sans-serif;">
        <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
        <strong style="color: #27ae60; font-size: 16px;">¡Ubicación Guardada!</strong>
        <div style="margin-top: 10px; font-size: 12px; color: #7f8c8d;">
          <strong>Coordenadas:</strong><br>
          Lat: ${pos.lat.toFixed(6)}<br>
          Lng: ${pos.lng.toFixed(6)}<br><br>
          <strong>Precisión:</strong> ±${formatAccuracy(propertyAccuracy.value)}
        </div>
      </div>
    `;
    
    // ✅ FIX: Limpiar listener antes de mostrar el popup de éxito
    userMarker!.off("popupopen");
    userMarker.bindPopup(successHtml, { maxWidth: 280 }).openPopup();
    
    setTimeout(() => {
      if (userMarker) {
        createEditablePopup(pos.lat, pos.lng, propertyAccuracy.value);
        userMarker.openPopup();
      }
    }, 3000);
    
  } catch (error) {
    console.error("Error al guardar:", error);
  }
}

async function handleRetryGPS(button: HTMLButtonElement) {
  const originalText = button.innerHTML;
  button.innerHTML = "⏳";
  button.disabled = true;
  
  const loc = await getPreciseLocation();
  
  button.innerHTML = originalText;
  button.disabled = false;
  
  if (loc) {
    placeMarker(loc.lat, loc.lng, loc.acc);
  } else {
    alert("❌ No se pudo obtener tu ubicación actual.");
  }
}

function createReadonlyPopup(lat: number, lng: number, accuracy: number) {
  const isAccurate = accuracy <= GOOD_ACCURACY;
  const formattedAccuracy = formatAccuracy(accuracy);
  
  const canEditMsg = !isOwner.value && propertyId.value 
    ? '<div style="background: #fff3cd; color: #856404; padding: 6px; border-radius: 4px; margin-top: 8px; font-size: 11px;">🔒 Solo el dueño puede editar la ubicación</div>' 
    : '';

  const popupHtml = `
    <div style="min-width: 220px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 10px;">
        <div style="font-size: 30px; margin-bottom: 8px;">📍</div>
        <strong style="color: #2c3e50; font-size: 14px;">Ubicación de la Propiedad</strong>
      </div>
      
      <div style="background: ${isAccurate ? '#d4edda' : accuracy > 1000 ? '#f8d7da' : '#fff3cd'}; 
            color: ${isAccurate ? '#155724' : accuracy > 1000 ? '#721c24' : '#856404'}; 
            padding: 8px; border-radius: 6px; margin-bottom: 10px; font-size: 12px; text-align: center;">
        <strong>Radio de Precisión:</strong><br>
        <span style="font-size: 16px; font-weight: 700;">
          ±${formattedAccuracy}
        </span><br>
        <small style="font-size: 10px;">
          ${isAccurate ? '✓ Ubicación muy exacta' : accuracy > 1000 ? '⚠️ Área aproximada' : '⚠️ Precisión media'}
        </small>
      </div>
      
      <div style="background: #ecf0f1; padding: 8px; border-radius: 6px; font-size: 11px; text-align: center;">
        <strong>Coordenadas:</strong><br>
        ${lat.toFixed(6)}, ${lng.toFixed(6)}
      </div>
      
      ${canEditMsg}
      
      <div style="margin-top: 8px; font-size: 10px; color: #7f8c8d; text-align: center;">
        💡 El círculo muestra el área de precisión
      </div>
    </div>
  `;

  userMarker!.bindPopup(popupHtml, { maxWidth: 280 }).openPopup();
}

// MAP CONTROLS
function addLocateButton() {
  if (locateControl !== null) {
    try {
      map.removeControl(locateControl);
    } catch (e) {
      console.warn("⚠️ Error al remover locate control:", e);
    }
    locateControl = null;
  }
  
  if (!canEdit.value) return;

  locateControl = (L as any).control({ position: "topleft" });
  const control = locateControl as L.Control;
  
  control.onAdd = (): HTMLElement => {
    const container = L.DomUtil.create("div", "locate-control-container");
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 8px;
    `;

    const btn = L.DomUtil.create("button", "locate-btn", container);
    btn.innerHTML = `
      <span class="locate-icon">🎯</span>
      
    `;
    btn.title = "Ir a mi ubicación actual";
    btn.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37,99,235,0.45);
      transition: all 0.25s ease;
      white-space: nowrap;
      font-family: Arial, sans-serif;
    `;

    btn.addEventListener("mouseenter", () => {
      if (!btn.disabled) {
        btn.style.transform = "translateY(-2px)";
        btn.style.boxShadow = "0 6px 16px rgba(37,99,235,0.55)";
      }
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "0 4px 12px rgba(37,99,235,0.45)";
    });

    L.DomEvent.disableClickPropagation(btn);
    
    const clickHandler = async () => {
      if (btn.disabled) return;
      
      btn.disabled = true;
      btn.innerHTML = `<span>⏳</span><span class="locate-label">Localizando...</span>`;
      btn.style.opacity = "0.7";

      const loc = await getPreciseLocation();

      btn.disabled = false;
      btn.innerHTML = `<span class="locate-icon">🎯</span><span class="locate-label">Mi ubicación</span>`;
      btn.style.opacity = "1";

      if (loc) {
        placeMarker(loc.lat, loc.lng, loc.acc);
      } else {
        alert("❌ No se pudo obtener tu ubicación. Intenta:\n• Activar GPS de alta precisión\n• Ir a un lugar abierto\n• Verificar permisos de ubicación");
        placeMarker(POPAYAN_CENTER.lat, POPAYAN_CENTER.lng, 999);
      }
    };

    L.DomEvent.addListener(btn, "click", clickHandler);

    return container;
  };

  control.addTo(map);
}

// INITIALIZATION
async function initializeMap() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      currentUserId.value = user.id ?? user.user_id ?? null;
      console.log(`👤 Usuario actual: ${user.name || user.email} (ID: ${currentUserId.value})`);
    } catch (e) {
      console.warn("⚠️ No se pudo parsear usuario");
    }
  }

  map = L.map("map", {
    zoomControl: true,
    attributionControl: true,
    center: [POPAYAN_CENTER.lat, POPAYAN_CENTER.lng],
    zoom: 14
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  mapReady.value = true;
  console.log("🗺️ Mapa inicializado");

  if (props.lat !== undefined && props.lng !== undefined) {
    const lat = Number(props.lat);
    const lng = Number(props.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      placeMarker(lat, lng, 50, true);
    } else {
      console.error("❌ Coordenadas inválidas en props");
      showDefaultLocation();
    }
  } else {
    showDefaultLocation();
  }
}

function showDefaultLocation() {
  if (canEdit.value) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;
        
        if (isInColombia(lat, lng)) {
          placeMarker(lat, lng, acc);
        } else {
          placeMarker(POPAYAN_CENTER.lat, POPAYAN_CENTER.lng, 999);
        }
      },
      () => {
        placeMarker(POPAYAN_CENTER.lat, POPAYAN_CENTER.lng, 999);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  } else {
    placeMarker(POPAYAN_CENTER.lat, POPAYAN_CENTER.lng, 999);
  }
}

// WATCHERS
watch(() => [props.lat, props.lng], ([newLat, newLng]) => {
  if (mapReady.value && newLat !== undefined && newLng !== undefined) {
    const lat = Number(newLat);
    const lng = Number(newLng);

    if (!isNaN(lat) && !isNaN(lng)) {
      placeMarker(lat, lng, 50, true);
    }
  }
}, { immediate: true });

watch(() => canEdit.value, (newValue) => {
  if (mapReady.value) {
    addLocateButton();
    
    if (userMarker) {
      const pos = userMarker.getLatLng();
      const accuracy = propertyAccuracy.value;
      
      if (newValue) {
        createEditablePopup(pos.lat, pos.lng, accuracy);
      } else {
        createReadonlyPopup(pos.lat, pos.lng, accuracy);
      }
      
      if (userMarker.dragging) {
        if (newValue) {
          userMarker.dragging.enable();
        } else {
          userMarker.dragging.disable();
        }
      }
    }
  }
});

// LIFECYCLE
onMounted(async () => {
  await initializeMap();
  addLocateButton();
});

onUnmounted(() => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
  
  if (locateControl !== null) {
    try {
      map.removeControl(locateControl);
    } catch (e) {
      console.warn("⚠️ Error al remover locate control en unmount:", e);
    }
  }
  
  if (map) {
    map.remove();
  }
});
</script>

<style>
@import '../../../assets/css/components/MapView.css';

/* ===== BARRA DE BÚSQUEDA POR BARRIOS ===== */
.map-search-bar {
  position: relative;
  padding: 10px 12px 0;
  background: #fff;
  z-index: 1000;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 10px;
  gap: 8px;
  transition: border-color 0.2s, background 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
}

.search-prefix-icon {
  font-size: 15px;
  color: #94a3b8;
  flex-shrink: 0;
}

.search-neighborhood-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 9px 0;
  font-size: 0.875rem;
  color: #1e293b;
  outline: none;
}

.search-neighborhood-input::placeholder {
  color: #94a3b8;
}

.search-clear-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 13px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  line-height: 1;
  transition: color 0.15s, background 0.15s;
}
.search-clear-btn:hover {
  color: #475569;
  background: #e2e8f0;
}

/* Sugerencias */
.neighborhood-suggestions {
  position: absolute;
  top: calc(100% - 2px);
  left: 12px;
  right: 12px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 10px 10px;
  list-style: none;
  margin: 0;
  padding: 4px 0;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  max-height: 210px;
  overflow-y: auto;
  z-index: 2000;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.suggestion-item:hover {
  background: #f8fafc;
}

.suggestion-type-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.suggestion-texts {
  display: flex;
  flex-direction: column;
}

.suggestion-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.suggestion-city {
  font-size: 0.75rem;
  color: #64748b;
}
</style>