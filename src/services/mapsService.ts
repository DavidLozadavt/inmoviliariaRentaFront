// mapsService.ts - Servicio de mapas con soporte para barrios y lugares


export interface SearchResult {
  description: string;
  lat?: number;
  lng?: number;
  place_id?: string;
  type: 'place' | 'neighborhood';
}

// ============================================================
// Barrios colombianos locales por ciudad (para búsqueda offline)
// ============================================================
const NEIGHBORHOODS_BY_CITY: Record<string, Array<{ name: string; lat: number; lng: number }>> = {
  'popayán': [
    { name: 'Centro Histórico', lat: 2.4413, lng: -76.6053 },
    { name: 'El Bolívar', lat: 2.4412, lng: -76.6089 },
    { name: 'La Esmeralda', lat: 2.4562, lng: -76.6203 },
    { name: 'Pandiguando', lat: 2.4478, lng: -76.6234 },
    { name: 'Alfonso López', lat: 2.4389, lng: -76.6312 },
    { name: 'La Paz', lat: 2.4501, lng: -76.6178 },
    { name: 'Lomas de Granada', lat: 2.4523, lng: -76.6145 },
    { name: 'El Recuerdo', lat: 2.4456, lng: -76.6267 },
    { name: 'Camilo Torres', lat: 2.4434, lng: -76.6198 },
    { name: 'Las Palmas', lat: 2.4478, lng: -76.6101 },
    { name: 'El Portal', lat: 2.4534, lng: -76.6089 },
    { name: 'Las Américas', lat: 2.4398, lng: -76.6156 },
    { name: 'El Cadillal', lat: 2.4567, lng: -76.6312 },
    { name: 'Antonio Nariño', lat: 2.4345, lng: -76.6234 },
    { name: 'Los Comuneros', lat: 2.4612, lng: -76.6189 },
    { name: 'Urbanización Valencia', lat: 2.4489, lng: -76.6167 },
    { name: 'Santa Helena', lat: 2.4423, lng: -76.6278 },
    { name: 'El Uvo', lat: 2.4378, lng: -76.6345 },
    { name: 'Seminario', lat: 2.4401, lng: -76.6123 },
    { name: 'La Pamba', lat: 2.4467, lng: -76.6056 },
  ],
  'bogotá': [
    { name: 'Chapinero', lat: 4.6486, lng: -74.0613 },
    { name: 'Usaquén', lat: 4.7010, lng: -74.0317 },
    { name: 'Suba', lat: 4.7423, lng: -74.0814 },
    { name: 'Engativá', lat: 4.7041, lng: -74.1122 },
    { name: 'Kennedy', lat: 4.6278, lng: -74.1345 },
    { name: 'Bosa', lat: 4.5978, lng: -74.1867 },
    { name: 'Fontibón', lat: 4.6734, lng: -74.1198 },
    { name: 'Puente Aranda', lat: 4.6201, lng: -74.1045 },
    { name: 'Teusaquillo', lat: 4.6512, lng: -74.0923 },
    { name: 'Los Mártires', lat: 4.6089, lng: -74.0823 },
    { name: 'Santa Fe', lat: 4.6012, lng: -74.0645 },
    { name: 'La Candelaria', lat: 4.5978, lng: -74.0756 },
  ],
  'medellín': [
    { name: 'El Poblado', lat: 6.2006, lng: -75.5661 },
    { name: 'Laureles', lat: 6.2367, lng: -75.5923 },
    { name: 'Envigado', lat: 6.1751, lng: -75.5920 },
    { name: 'Belén', lat: 6.2301, lng: -75.6042 },
    { name: 'Robledo', lat: 6.2934, lng: -75.5889 },
    { name: 'Aranjuez', lat: 6.2678, lng: -75.5534 },
    { name: 'Manrique', lat: 6.2712, lng: -75.5423 },
    { name: 'Buenos Aires', lat: 6.2389, lng: -75.5567 },
    { name: 'La América', lat: 6.2423, lng: -75.5812 },
    { name: 'Castilla', lat: 6.2834, lng: -75.5712 },
  ],
  'cali': [
    { name: 'El Peñón', lat: 3.4389, lng: -76.5423 },
    { name: 'Ciudad Jardín', lat: 3.3978, lng: -76.5445 },
    { name: 'Granada', lat: 3.4456, lng: -76.5367 },
    { name: 'San Fernando', lat: 3.4201, lng: -76.5534 },
    { name: 'Aguablanca', lat: 3.3834, lng: -76.4945 },
    { name: 'Siloé', lat: 3.4378, lng: -76.5612 },
    { name: 'Chipichape', lat: 3.4812, lng: -76.5178 },
    { name: 'Los Álamos', lat: 3.4623, lng: -76.5312 },
  ],
}

// ============================================================
// Función de búsqueda local de barrios
// ============================================================
function searchLocalNeighborhoods(
  query: string,
  city?: string
): Array<{ description: string; lat: number; lng: number; type: 'neighborhood' }> {
  const q = query.toLowerCase()
  const results: Array<{ description: string; lat: number; lng: number; type: 'neighborhood' }> = []

  const cityKey = city ? normalizeCity(city) : null

  // Si hay ciudad específica, buscar primero ahí
  if (cityKey && NEIGHBORHOODS_BY_CITY[cityKey]) {
    NEIGHBORHOODS_BY_CITY[cityKey]
      .filter(n => n.name.toLowerCase().includes(q))
      .forEach(n => results.push({
        description: `${n.name}, ${city}`,
        lat: n.lat,
        lng: n.lng,
        type: 'neighborhood'
      }))
  }

  // Si no hay suficientes resultados, buscar en todas las ciudades
  if (results.length < 3) {
    Object.entries(NEIGHBORHOODS_BY_CITY).forEach(([cityNorm, neighborhoods]) => {
      if (cityNorm === cityKey) return // ya se buscó
      neighborhoods
        .filter(n => n.name.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach(n => results.push({
          description: `${n.name}, ${capitalize(cityNorm)}`,
          lat: n.lat,
          lng: n.lng,
          type: 'neighborhood'
        }))
    })
  }

  return results.slice(0, 5)
}

function normalizeCity(city: string): string {
  return city.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u')
    .trim()
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}


// ============================================================
// Búsqueda via Photon API (Fast & Free)
// ============================================================
async function searchPhoton(query: string, city?: string): Promise<SearchResult[]> {
  try {
    const q = city ? `${query} ${city} Colombia` : `${query} Colombia`;
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&bbox=-82.0,-4.5,-66.5,13.5`;

    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();

    return data.features.map((f: any) => {
      const p = f.properties;
      const partsRaw = [
        p.name || p.street || p.district,
        p.city || p.town,
        p.state,
        p.country
      ].filter(Boolean);

      const uniqueParts: string[] = [];
      const seen = new Set<string>();
      for (const part of partsRaw) {
        const norm = part.toLowerCase().trim();
        if (!seen.has(norm)) {
          uniqueParts.push(part);
          seen.add(norm);
        }
      }
      const desc = uniqueParts.join(', ');

      return {
        description: desc,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        type: (p.osm_value === 'suburb' || p.osm_value === 'neighbourhood') ? 'neighborhood' : 'place'
      };
    });
  } catch (err) {
    console.warn('Error en Photon:', err);
    return [];
  }
}

export const mapsService = {
  /**
   * Búsqueda combinada: barrios locales + Photon
   */
  searchPlaces: async (query: string, city?: string): Promise<SearchResult[]> => {
    if (query.length < 2) return [];
    const results: SearchResult[] = [];

    // 1. Barrios locales (opcional si Photon es suficiente)
    const local = searchLocalNeighborhoods(query, city);
    local.forEach(n => results.push({
      description: n.description,
      lat: n.lat,
      lng: n.lng,
      type: 'neighborhood'
    }));

    // 2. Photon API
    const photon = await searchPhoton(query, city);
    photon.forEach(p => {
      if (!results.find(r => r.description.toLowerCase() === p.description.toLowerCase())) {
        results.push(p);
      }
    });

    return results.slice(0, 8);
  },

  /**
   * Autocompletado (Photon)
   */
  autocompletePlace: async (input: string): Promise<Array<{ place_id: string; description: string }>> => {
    if (input.length < 2) return getFallbackSuggestions(input);
    const photon = await searchPhoton(input);
    if (photon.length > 0) {
      return photon.map((p, i) => ({
        place_id: `photon-${i}-${p.lat}-${p.lng}`,
        description: p.description
      }));
    }
    return getFallbackSuggestions(input);
  },

  /**
   * Geocodificación (Photon)
   */
  geocode: async (address: string, city?: string): Promise<{ lat: number; lng: number } | null> => {
    const photon = await searchPhoton(address, city);
    if (photon[0]) return { lat: photon[0].lat!, lng: photon[0].lng! };
    return null;
  },

  getNeighborhoods: (city: string): Array<{ name: string; lat: number; lng: number }> => {
    const cityKey = normalizeCity(city);
    return NEIGHBORHOODS_BY_CITY[cityKey] || [];
  }
};

function getFallbackSuggestions(input: string): Array<{ place_id: string; description: string }> {
  // Simplificado y nacionalizado
  const popular = [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta',
    'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Popayán', 'Manizales',
    'Villavicencio', 'Neiva', 'Valledupar', 'Pasto', 'Montería', 'Sincelejo'
  ];
  return popular
    .filter(c => c.toLowerCase().includes(input.toLowerCase()))
    .map((c, i) => ({ place_id: `fallback-${i}`, description: `${c}, Colombia` }));
}