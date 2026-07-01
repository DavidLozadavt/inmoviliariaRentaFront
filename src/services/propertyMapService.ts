/**
 * @file propertyMapService.ts
 * @description Core service for geographic intelligence, geocoding, and property proximity logic.
 * This service handles interactions with OSM (Photon), distance calculations, and geographic constants for Colombia.
 */
import api from './api';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export interface MapProperty {
  id: number;
  title: string;
  monthly_price: number;
  status: string;
  approval_status: string;
  visibility: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  num_bedrooms: string | number;
  num_bathrooms: string | number;
  area_m2: number;
  image_url: string | null;
  images?: { image_url: string; order: number; is_main: boolean }[];
  user?: { id: number; name: string; email: string; photo?: string };
  _zone?: string;
  _dist?: number | null;
  _normalizedCity?: string;
  _normalizedAddress?: string;
}

export interface MapFilters {
  status?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
}

export interface PropertyCluster {
  lat: number;
  lng: number;
  count: number;
  properties: MapProperty[];
  avgPrice: number;
}

export interface ProximityBuckets {
  ultra: MapProperty[];
  near: MapProperty[];
  medium: MapProperty[];
  far: MapProperty[];
  total: number;
  closest: MapProperty | null;
}

export interface SearchResultInfo {
  icon: string;
  title: string;
  sub: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  mainText: string;
  subText: string;
  type: 'exact' | 'street' | 'area';
  boundingBox?: { s: number; n: number; w: number; e: number };
  raw: any;
}

export interface GeocodeSuggestion {
  lat: number;
  lng: number;
  mainText: string;
  subText: string;
  icon: string;
  type: string;
  class: string;
  raw: any;
}

export interface ReverseGeoResult {
  city: string;
  department: string;
  neighborhood: string;
  country: string;
  raw: any;
}

export type SearchState = 'idle' | 'searching' | 'error' | 'success';
export type SearchResultType = 'exact' | 'street' | 'area' | null;
export type SearchErrorType = 'not_found' | 'too_vague' | 'gibberish' | 'network' | null;

// ─────────────────────────────────────────────
// CITY CENTERS - Known coordinates for primary Colombian cities
// ─────────────────────────────────────────────
export const CITY_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Bogotá': { lat: 4.7110, lng: -74.0721, zoom: 12 },
  'Medellín': { lat: 6.2442, lng: -75.5812, zoom: 12 },
  'Bello': { lat: 6.3386, lng: -75.5575, zoom: 13 },
  'Envigado': { lat: 6.1752, lng: -75.5905, zoom: 13 },
  'Itagüí': { lat: 6.1844, lng: -75.5990, zoom: 13 },
  'Sabaneta': { lat: 6.1514, lng: -75.6158, zoom: 13 },
  'Rionegro': { lat: 6.1548, lng: -75.3737, zoom: 13 },
  'Apartadó': { lat: 7.8825, lng: -76.6270, zoom: 13 },
  'Turbo': { lat: 8.0968, lng: -76.7280, zoom: 13 },
  'Caucasia': { lat: 7.9869, lng: -75.1950, zoom: 13 },
  'Caldas': { lat: 6.0953, lng: -75.6387, zoom: 13 },
  'La Estrella': { lat: 6.1561, lng: -75.6414, zoom: 13 },
  'Barranquilla': { lat: 10.9685, lng: -74.7813, zoom: 12 },
  'Soledad': { lat: 10.9179, lng: -74.7668, zoom: 13 },
  'Puerto Colombia': { lat: 10.9956, lng: -74.9552, zoom: 13 },
  'Malambo': { lat: 10.8572, lng: -74.7680, zoom: 13 },
  'Sabanalarga': { lat: 10.6271, lng: -74.9222, zoom: 13 },
  'Cartagena': { lat: 10.3910, lng: -75.4794, zoom: 12 },
  'Magangué': { lat: 9.2416, lng: -74.7542, zoom: 13 },
  'Mompox': { lat: 9.2441, lng: -74.4263, zoom: 13 },
  'Tunja': { lat: 5.5353, lng: -73.3678, zoom: 13 },
  'Duitama': { lat: 5.8265, lng: -73.0295, zoom: 13 },
  'Sogamoso': { lat: 5.7141, lng: -72.9259, zoom: 13 },
  'Chiquinquirá': { lat: 5.6149, lng: -73.8196, zoom: 13 },
  'Villa de Leyva': { lat: 5.6345, lng: -73.5254, zoom: 13 },
  'Manizales': { lat: 5.0689, lng: -75.5174, zoom: 12 },
  'La Dorada': { lat: 5.4514, lng: -74.6680, zoom: 13 },
  'Florencia': { lat: 1.6144, lng: -75.6062, zoom: 13 },
  'Yopal': { lat: 5.3378, lng: -72.3959, zoom: 13 },
  'Aguazul': { lat: 5.1735, lng: -72.5508, zoom: 13 },
  'Popayán': { lat: 2.4419, lng: -76.6063, zoom: 14 },
  'Valledupar': { lat: 10.4631, lng: -73.2532, zoom: 12 },
  'Montería': { lat: 8.7479, lng: -75.8814, zoom: 12 },
  'Soacha': { lat: 4.5793, lng: -74.2170, zoom: 13 },
  'Facatativá': { lat: 4.8141, lng: -74.3568, zoom: 13 },
  'Zipaquirá': { lat: 5.0232, lng: -74.0068, zoom: 13 },
  'Fusagasugá': { lat: 4.3426, lng: -74.3641, zoom: 13 },
  'Chía': { lat: 4.8618, lng: -74.0608, zoom: 13 },
  'Mosquera': { lat: 4.7069, lng: -74.2312, zoom: 13 },
  'Girardot': { lat: 4.3033, lng: -74.8028, zoom: 13 },
  'Neiva': { lat: 2.9273, lng: -75.2819, zoom: 12 },
  'Pitalito': { lat: 1.8520, lng: -76.0510, zoom: 13 },
  'Riohacha': { lat: 11.5444, lng: -72.9072, zoom: 13 },
  'Santa Marta': { lat: 11.2408, lng: -74.2110, zoom: 12 },
  'Villavicencio': { lat: 4.1420, lng: -73.6266, zoom: 12 },
  'Pasto': { lat: 1.2136, lng: -77.2811, zoom: 12 },
  'Tumaco': { lat: 1.8096, lng: -78.7598, zoom: 13 },
  'Cúcuta': { lat: 7.8899, lng: -72.4966, zoom: 12 },
  'Ibagué': { lat: 4.4389, lng: -75.2322, zoom: 12 },
  'Cali': { lat: 3.4516, lng: -76.5320, zoom: 14 },
  'Buenaventura': { lat: 3.8801, lng: -77.0311, zoom: 13 },
  'Palmira': { lat: 3.5394, lng: -76.3035, zoom: 13 },
  'Tulúa': { lat: 4.0840, lng: -76.1978, zoom: 13 },
  'Bucaramanga': { lat: 7.1193, lng: -73.1227, zoom: 12 },
  'Floridablanca': { lat: 7.0641, lng: -73.0885, zoom: 13 },
  'Girón': { lat: 7.0742, lng: -73.1683, zoom: 13 },
  'Pereira': { lat: 4.8133, lng: -75.6961, zoom: 12 },
  'Dosquebradas': { lat: 4.8388, lng: -75.6644, zoom: 13 },
  'Armenia': { lat: 4.5339, lng: -75.6811, zoom: 12 },
  'Sincelejo': { lat: 9.3047, lng: -75.3978, zoom: 13 },
  'Leticia': { lat: -4.2153, lng: -69.9406, zoom: 13 },
  'San Andrés': { lat: 12.5547, lng: -81.7185, zoom: 13 },
  'Piendamó': { lat: 2.6738, lng: -76.5278, zoom: 13 },
  'Jamundí': { lat: 3.2611, lng: -76.5350, zoom: 13 },
  'Santander de Quilichao': { lat: 3.0094, lng: -76.4847, zoom: 13 },
  'Puerto Tejada': { lat: 3.2322, lng: -76.4172, zoom: 14 },
  'Quibdó': { lat: 5.6947, lng: -76.6611, zoom: 13 },
  'Mocoa': { lat: 1.1468, lng: -76.6468, zoom: 13 },
  'Inírida': { lat: 3.8653, lng: -67.9239, zoom: 13 },
  'San José del Guaviare': { lat: 2.5668, lng: -72.6459, zoom: 13 },
  'Mitú': { lat: 1.1983, lng: -70.1733, zoom: 13 },
  'Puerto Carreño': { lat: 6.1890, lng: -67.4850, zoom: 13 },
  'Yumbo': { lat: 3.5828, lng: -76.4950, zoom: 13 },
  'Candelaria': { lat: 3.4078, lng: -76.3475, zoom: 13 },
  'Cajicá': { lat: 4.9189, lng: -74.0270, zoom: 13 },
  'Espinal': { lat: 4.1489, lng: -74.8872, zoom: 13 },
  'Barrancabermeja': { lat: 7.0653, lng: -73.8547, zoom: 13 },
  'Piedecuesta': { lat: 6.9872, lng: -73.0494, zoom: 13 },
  'Guachené': { lat: 3.2183, lng: -76.3933, zoom: 14 },
  'Caloto': { lat: 3.0181, lng: -76.4086, zoom: 14 }
};

export const DEPARTMENT_CENTERS: Record<string, { lat: number; lng: number }> = {
  'Antioquia': { lat: 6.2442, lng: -75.5812 },
  'Atlántico': { lat: 10.9685, lng: -74.7813 },
  'Bogotá D.C.': { lat: 4.6097, lng: -74.0817 },
  'Bolívar': { lat: 10.3910, lng: -75.4794 },
  'Boyacá': { lat: 5.5353, lng: -73.3678 },
  'Caldas': { lat: 5.0689, lng: -75.5174 },
  'Caquetá': { lat: 1.6144, lng: -75.6062 },
  'Casanare': { lat: 5.3378, lng: -72.3959 },
  'Cauca': { lat: 2.4448, lng: -76.6147 },
  'Cesar': { lat: 10.4631, lng: -73.2532 },
  'Córdoba': { lat: 8.7479, lng: -75.8814 },
  'Cundinamarca': { lat: 4.6097, lng: -74.0817 },
  'Huila': { lat: 2.9273, lng: -75.2819 },
  'La Guajira': { lat: 11.5444, lng: -72.9072 },
  'Magdalena': { lat: 11.2408, lng: -74.2110 },
  'Meta': { lat: 4.1420, lng: -73.6266 },
  'Nariño': { lat: 1.2136, lng: -77.2811 },
  'Norte de Santander': { lat: 7.8899, lng: -72.4966 },
  'Quindío': { lat: 4.5339, lng: -75.6811 },
  'Risaralda': { lat: 4.8133, lng: -75.6961 },
  'Santander': { lat: 7.1193, lng: -73.1227 },
  'Sucre': { lat: 9.3047, lng: -75.3978 },
  'Tolima': { lat: 4.4389, lng: -75.2322 },
  'Valle del Cauca': { lat: 3.4516, lng: -76.5320 },
  'Vaupés': { lat: 1.1983, lng: -70.1733 },
  'Vichada': { lat: 6.1890, lng: -67.4850 },
  'Guainía': { lat: 3.8653, lng: -67.9239 },
  'Guaviare': { lat: 2.5668, lng: -72.6459 },
  'Chocó': { lat: 5.6947, lng: -76.6611 },
  'Putumayo': { lat: 1.1468, lng: -76.6468 },
  'Arauca': { lat: 7.0847, lng: -70.7554 },
  'San Andrés y Providencia': { lat: 12.5847, lng: -81.7005 },
};

// ─────────────────────────────────────────────
// COLOMBIA GEO DATA
// ─────────────────────────────────────────────
export const COLOMBIA_GEO: Record<string, Record<string, string[]>> = {
  'Amazonas': {
    'Leticia': ['Centro', 'El Progreso', 'La Victoria', 'San José', 'La Esperanza'],
    'Puerto Nariño': ['Centro', 'San Francisco'],
    'Tarapacá': ['Centro']
  },
  'Antioquia': {
    'Medellín': ['El Poblado', 'Laureles', 'Belén', 'Robledo', 'Aranjuez', 'Buenos Aires', 'Castilla', 'Manrique', 'San Javier', 'Villa Hermosa', 'La Candelaria', 'Guayabal', 'El Estadio', 'Conquistadores', 'Calasanz', 'Los Colores', 'Florida Nueva', 'Suramericana', 'Simón Bolívar'],
    'Bello': ['Centro', 'Niquía', 'Zamora', 'Madera', 'Cabañas', 'Santa Ana', 'Pérez'],
    'Envigado': ['El Dorado', 'La Magnolia', 'Loma del Escobero', 'Las Vegas', 'Zúñiga', 'Jardines'],
    'Itagüí': ['Centro', 'Ditaires', 'Santa María', 'La Gloria', 'San Pío'],
    'Sabaneta': ['Aves María', 'La Doctora', 'San José', 'Centro', 'Calle Larga'],
    'Rionegro': ['Centro', 'Llanogrande', 'San Antonio', 'El Porvenir', 'Guayabito'],
    'Apartadó': ['Centro', 'La Chinita', 'Zungo', 'La Esperanza'],
    'Turbo': ['Centro', 'El Dos', 'Nueva Colonia', 'La Playa'],
    'Caucasia': ['Centro', 'La Unión', 'El Jardín', 'Clemente Arrieta'],
    'La Estrella': ['Centro', 'La Tablaza', 'Santa Catalina'],
    'Caldas': ['Centro', 'La Inmaculada', 'La Locería'],
    'Girardota': ['Centro', 'San Juan', 'El Llano'],
    'Barbosa': ['Centro', 'Buenos Aires', 'San Luis'],
    'Copacabana': ['Centro', 'Villa Roca', 'San Juan'],
    'Guarne': ['Centro', 'Bereda La Honda'],
    'Marinilla': ['Centro', 'La Inmaculada'],
    'La Ceja': ['Centro', 'Fátima', 'La Aldea'],
    'El Carmen de Viboral': ['Centro', 'Villa de Leyva'],
    'Santa Fe de Antioquia': ['Centro', 'Paso Real']
  },
  'Arauca': {
    'Arauca': ['Centro', 'Fundadores', 'Cristo Rey', 'La Esperanza'],
    'Tame': ['Centro', 'Sucre', 'San Luis'],
    'Saravena': ['Centro', 'Modelia'],
    'Arauquita': ['Centro']
  },
  'Atlántico': {
    'Barranquilla': ['El Prado', 'Alto Prado', 'Boston', 'Bella Vista', 'Los Alpes', 'Riomar', 'Ciudad Jardín', 'Modelo', 'La Victoria', 'Recreo', 'Las Delicias', 'El Porvenir', 'La Manga', 'Los Andes', 'Betania', 'Barranquillita', 'El Silencio', 'Miramar', 'Villa Santos', 'Buenavista', 'Las Américas', 'San José', 'Los Olivos', 'Concepción', 'San Francisco'],
    'Soledad': ['Centro', 'Los Girasoles', 'Villa Estadio', 'Costa Hermosa', 'El Parque', 'Hipódromo'],
    'Puerto Colombia': ['Pradomar', 'Sabanilla', 'Centro', 'Miramar', 'Villas de Santa Teresita'],
    'Malambo': ['Centro', 'El Campito', 'La Esperanza'],
    'Sabanalarga': ['Centro', 'Los Rosales', 'San Antonio'],
    'Galapa': ['Centro', 'Villa Olímpica'],
    'Baranoa': ['Centro', 'La Esperanza'],
    'Santo Tomás': ['Centro', '7 de Agosto'],
    'Palmar de Varela': ['Centro']
  },
  'Bogotá D.C.': {
    'Bogotá': ['Usaquén', 'Chapinero', 'Santa Fe', 'San Cristóbal', 'Usme', 'Tunjuelito', 'Bosa', 'Kennedy', 'Fontibón', 'Engativá', 'Suba', 'Barrios Unidos', 'Teusaquillo', 'Los Mártires', 'Antonio Nariño', 'Puente Aranda', 'La Candelaria', 'Rafael Uribe', 'Ciudad Bolívar', 'El Chico', 'Cedritos', 'Niza', 'Santa Bárbara', 'Modelia', 'Hayuelos', 'Salitre', 'La Castellana', 'Rosales', 'Colina Campestre', 'Palermo', 'Pasadena', 'Alhambra', 'Mazurén', 'Lagos de Córdoba']
  },
  'Bolívar': {
    'Cartagena': ['Bocagrande', 'Castillogrande', 'El Laguito', 'Manga', 'Pie de Popa', 'El Centro Histórico', 'Getsemaní', 'Crespo', 'San Diego', 'Torices', 'Ternera', 'La Boquilla', 'Zona Norte', 'Olaya Herrera', 'Nuevo Bosque', 'El Cabrero', 'Marbella', 'Santa Lucía'],
    'Magangué': ['Centro', 'El Yucal', 'San Pablo'],
    'Mompox': ['Centro', 'San Agustín', 'La Concepción'],
    'Turbaco': ['Centro', 'Plan Parejo', 'Bonanza'],
    'Arjona': ['Centro', 'Las Nieves'],
    'El Carmen de Bolívar': ['Centro', 'Gambote']
  },
  'Boyacá': {
    'Tunja': ['Centro', 'San Ignacio', 'Las Quintas', 'Santa Inés', 'La Florida', 'Muiscas'],
    'Duitama': ['Centro', 'Boyacá Real', 'Camilo Torres'],
    'Sogamoso': ['Centro', 'El Sena', 'La Pradera'],
    'Chiquinquirá': ['Centro', 'El Triunfo', 'La Esperanza'],
    'Villa de Leyva': ['Centro', 'El Común', 'La Reforma'],
    'Paipa': ['Centro', 'El Lago'],
    'Nobsa': ['Centro', 'Nazareth'],
    'Moniquirá': ['Centro'],
    'Puerto Boyacá': ['Centro', '10 de Enero']
  },
  'Caldas': {
    'Manizales': ['Centro', 'La Enea', 'Chipre', 'Palermo', 'Versalles', 'El Cable', 'Milán', 'Alta Suiza', 'Bosques del Norte', 'Villamaría', 'Sancancio'],
    'La Dorada': ['Centro', 'Villa del Río', 'Las Ferias'],
    'Chinchiná': ['Centro', 'La Esmeralda'],
    'Riosucio': ['Centro', 'San Sebastián'],
    'Anserma': ['Centro']
  },
  'Caquetá': {
    'Florencia': ['Centro', 'Las Brisas', 'El Cunduy', 'La Castellana', 'Juan XXIII'],
    'San Vicente del Caguán': ['Centro', 'La Libertad'],
    'Puerto Rico': ['Centro'],
    'Curillo': ['Centro']
  },
  'Casanare': {
    'Yopal': ['Centro', 'El Remanso', 'Los Laureles', 'Unicentro', 'San Martín'],
    'Aguazul': ['Centro', 'Los Olivos', 'La Pradera'],
    'Paz de Ariporo': ['Centro', 'Palmarito'],
    'Villanueva': ['Centro']
  },
  'Cauca': {
    'Popayán': ['Centro Histórico', 'La Esmeralda', 'El Libertador', 'Bolívar', 'Los Comuneros', 'La Colina', 'La Paz', 'Pubenza', 'Las Palmas', 'El Lago', 'Yanaconas', 'Camilo Torres', 'El Uvo', 'La Estancia', 'Pomona', 'Alfonso López', 'Lomas de Pomona', 'El Recuerdo', 'Los Sauces', 'La Floresta', 'Bello Horizonte', 'Villas del Viento', 'Campamento'],
    'Santander de Quilichao': ['Centro', 'Los Andes', 'Nariño', 'Olaya Herrera'],
    'Puerto Tejada': ['Centro', 'El Vergel', 'La Esperanza'],
    'Piendamó': ['Centro', 'Tunia', 'Los Pinos'],
    'Guachené': ['Centro', 'Jorge Eliécer Gaitán'],
    'Caloto': ['Centro', 'El Porvenir'],
    'Morales': ['Centro', 'La Estación'],
    'Silvia': ['Centro', 'Guambia'],
    'Timbío': ['Centro', 'El Arado'],
    'Patía (El Bordo)': ['Centro', 'La Ermita'],
    'Miranda': ['Centro'],
    'Corinto': ['Centro']
  },
  'Cesar': {
    'Valledupar': ['Centro', 'El Prado', 'Noválito', 'San José', 'La Nevada', 'La Esperanza', 'Villa Taxi', 'Arizona', 'Los Cortijos'],
    'Aguachica': ['Centro', 'La Unión', '7 de Agosto'],
    'Codazzi': ['Centro', 'Las Palmas'],
    'Bosconia': ['Centro', 'El Carmen'],
    'El Paso': ['Centro', 'La Loma']
  },
  'Chocó': {
    'Quibdó': ['Centro', 'La Yesca', 'Kennedy', 'Niño Jesús', 'Huapango'],
    'Istmina': ['Centro', 'San Juan'],
    'Tadó': ['Centro', 'Obrero'],
    'Condoto': ['Centro'],
    'Bahía Solano': ['Centro']
  },
  'Córdoba': {
    'Montería': ['Centro', 'La Granja', 'Cantaclaro', 'El Recreo', 'Monteverde', 'La Castellana', 'Pasatiempo', 'Buenavista'],
    'Lorica': ['Centro', 'El Pilón', 'San Carlos'],
    'Cereté': ['Centro', 'Venus', 'Escolar'],
    'Montelíbano': ['Centro', 'Obrero'],
    'Sahagún': ['Centro', 'Venecia'],
    'Planeta Rica': ['Centro', 'Los Laureles'],
    'Tierralta': ['Centro']
  },
  'Cundinamarca': {
    'Soacha': ['Centro', 'Ciudad Verde', 'San Mateo', 'La Despensa', 'Compartir', 'Hogares Soacha'],
    'Chía': ['Centro', 'La Balsa', 'Fonquetá', 'Bojacá', 'Guaymaral', 'Mercedes de Calahorra'],
    'Zipaquirá': ['Centro', 'San Isidro', 'Algarrón'],
    'Facatativá': ['Centro', 'Manablanca'],
    'Fusagasugá': ['Centro', 'La Palma', 'Ciudad Jardín'],
    'Mosquera': ['Centro', 'La Florida', 'Planadas'],
    'Girardot': ['Centro', 'Ricaurte', 'La Magdalena'],
    'Cajicá': ['Centro', 'Capellanía', 'Canelón'],
    'Madrid': ['Centro', 'La Prosperidad'],
    'Funza': ['Centro', 'México'],
    'Tocancipá': ['Centro', 'Verganzo'],
    'Sopó': ['Centro', 'Briceño'],
    'La Calera': ['Centro', 'San Isidro'],
    'Sibaté': ['Centro'],
    'Villeta': ['Centro']
  },
  'Guainía': {
    'Inírida': ['Centro', 'Los Libertadores', 'La Primavera', 'Galán']
  },
  'Guaviare': {
    'San José del Guaviare': ['Centro', 'La Esperanza', 'El Porvenir', 'Modelo']
  },
  'Huila': {
    'Neiva': ['Centro', 'Timanco', 'La Gaitana', 'Cándido Leguízamo', 'Los Guaduales', 'Ipanema', 'Buganviles'],
    'Pitalito': ['Centro', 'La Paz', 'Solarte'],
    'Garzón': ['Centro', 'Sartenejo'],
    'Rivera': ['Centro', 'Termales'],
    'Campoalegre': ['Centro'],
    'Gigante': ['Centro'],
    'San Agustín': ['Centro']
  },
  'La Guajira': {
    'Riohacha': ['Centro', 'El Prado', 'Los Olivos', 'Coquivacoa'],
    'Maicao': ['Centro', 'El Bosque', 'Santander'],
    'Uribia': ['Centro', 'Princesa del Desierto'],
    'Manaure': ['Centro'],
    'San Juan del Cesar': ['Centro']
  },
  'Magdalena': {
    'Santa Marta': ['El Rodadero', 'Bello Horizonte', 'Taganga', 'Centro', 'Mamatoco', 'Pozos Colorados', 'Bavaria', 'Gaira', 'Pozos Colorados'],
    'Ciénaga': ['Centro', 'Alicia', 'Mar de Plata'],
    'Fundación': ['Centro', 'La Esperanza'],
    'El Banco': ['Centro', 'La Playa'],
    'Plato': ['Centro']
  },
  'Meta': {
    'Villavicencio': ['Centro', 'El Barzal', 'Siete de Agosto', 'La Esperanza', 'Porfía', 'La Ceiba', 'Cofrem', 'Villacentro'],
    'Acacías': ['Centro', 'Las Flores', 'La Independencia'],
    'Granada': ['Centro', 'San Juan'],
    'Puerto López': ['Centro'],
    'San Martín': ['Centro']
  },
  'Nariño': {
    'Pasto': ['Centro', 'San Ignacio', 'Las Cuadras', 'Torobajo', 'Maridíaz', 'Lorenzo', 'Samaniego', 'Fátima', 'Anganoy'],
    'Tumaco': ['Centro', 'El Morro', 'La Ciudadela', 'Pradomar'],
    'Ipiales': ['Centro', 'Obrero', 'Puente del Común'],
    'La Unión': ['Centro'],
    'Samaniego': ['Centro']
  },
  'Norte de Santander': {
    'Cúcuta': ['Centro', 'Atalaya', 'Los Patios', 'El Llano', 'La Libertad', 'Caobos', 'Prados del Este', 'San Luis', 'Lleras'],
    'Ocaña': ['Centro', 'La Esperanza', 'San Francisco'],
    'Pamplona': ['Centro', 'El Carmen'],
    'Villa del Rosario': ['Centro', 'La Parada']
  },
  'Putumayo': {
    'Mocoa': ['Centro', 'José Homero', 'La Esmeralda'],
    'Puerto Asís': ['Centro', 'El Carmen'],
    'Valle del Guamuez': ['Centro'],
    'Orito': ['Centro'],
    'Sibundoy': ['Centro']
  },
  'Quindío': {
    'Armenia': ['Centro', 'El Bosque', 'La Castellana', 'Norte', 'Los Quindos', 'Granada', 'La Florida'],
    'Calarcá': ['Centro', 'La Herradura', 'Versalles'],
    'Montenegro': ['Centro', 'La Esperanza'],
    'Quimbaya': ['Centro'],
    'Salento': ['Centro', 'La Explanada'],
    'Circasia': ['Centro'],
    'La Tebaida': ['Centro']
  },
  'Risaralda': {
    'Pereira': ['Centro', 'Pinares', 'Circunvalar', 'Cuba', 'El Jardín', 'Álamos', 'Cerritos', 'Dosquebradas', 'Parque Industrial'],
    'Dosquebradas': ['Centro', 'La Pradera', 'Frailes', 'Santa Mónica', 'La Capilla'],
    'Santa Rosa de Cabal': ['Centro', 'La Hermosa', 'La Eugenia'],
    'La Virginia': ['Centro'],
    'Belén de Umbría': ['Centro']
  },
  'San Andrés y Providencia': {
    'San Andrés': ['North End', 'San Luis', 'La Loma', 'Sound Bay', 'El Cove', 'Haines Bight'],
    'Providencia': ['Santa Isabel', 'Southwest Bay', 'Bottom House']
  },
  'Santander': {
    'Bucaramanga': ['Centro', 'Cabecera del Llano', 'El Prado', 'Sotomayor', 'Estadio', 'Provenza', 'Pan de Azúcar', 'La Concordia', 'Real de Minas', 'La Victoria', 'Lagos del Cacique'],
    'Floridablanca': ['Centro', 'Cañaveral', 'Lagos', 'Ruitoque', 'Bucarica', 'La Cumbre'],
    'Girón': ['Centro', 'El Poblado', 'Villamil'],
    'Piedecuesta': ['Centro', 'La Candelaria', 'San Telmo', 'Paseo del Puente', 'La Colina'],
    'Barrancabermeja': ['Centro', 'El Recreo', 'Galán', 'Parnaso'],
    'San Gil': ['Centro', 'San Juan de Dios'],
    'Socorro': ['Centro', 'La Esmeralda'],
    'Barbosa': ['Centro'],
    'Zapatoca': ['Centro']
  },
  'Sucre': {
    'Sincelejo': ['Centro', 'La Ford', 'Venecia', 'Las Delicias', 'Boston', 'La Pajuela'],
    'Corozal': ['Centro', 'San Juan'],
    'Tolú': ['Centro', 'El Francés', 'Palo Blanco'],
    'Sampués': ['Centro'],
    'San Onofre': ['Centro']
  },
  'Tolima': {
    'Ibagué': ['Centro', 'El Vergel', 'Piedrapintada', 'La Pola', 'Cádiz', 'Jordán', 'El Salado', 'Santa Ana', 'Interlaken', 'Belén'],
    'Espinal': ['Centro', 'La Esperanza'],
    'Melgar': ['Centro', 'Residencial', 'La Herradura'],
    'Mariquita': ['Centro'],
    'Honda': ['Centro'],
    'Cajamarca': ['Centro'],
    'Líbano': ['Centro']
  },
  'Valle del Cauca': {
    'Cali': ['El Peñón', 'Granada', 'San Antonio', 'El Ingenio', 'Chipichape', 'Ciudad Jardín', 'La Flora', 'San Fernando', 'Valle del Lili', 'Versalles', 'Pance', 'Tequendama', 'Capri', 'Limonar', 'Santa Teresita', 'Cristobal Colón', 'Aguacatal', 'Mena', 'Menga', 'Juanambú', 'El Lido'],
    'Buenaventura': ['Centro', 'El Cristal', 'La Playita', 'Lleras'],
    'Palmira': ['Centro', 'El Bosque', 'La Emilia', 'Zamora'],
    'Tulúa': ['Centro', 'Alvernia', 'Victoria'],
    'Buga': ['Centro', 'El Carmelo', 'Santa Bárbara'],
    'Cartago': ['Centro', 'El Prado'],
    'Jamundí': ['Centro', 'Alfaguara', 'Terranova', 'Sachamate', 'Poblado Pance', 'Bonanza'],
    'Yumbo': ['Centro', 'La Estancia', 'Belalcázar'],
    'Candelaria': ['Centro', 'Poblado Campestre'],
    'Florida': ['Centro'],
    'Pradera': ['Centro'],
    'Ginebra': ['Centro'],
    'Guacarí': ['Centro'],
    'Roldanillo': ['Centro']
  },
  'Vaupés': {
    'Mitú': ['Centro', 'Las Vegas', 'La Loma']
  },
  'Vichada': {
    'Puerto Carreño': ['Centro', 'Simón Bolívar', 'La Primavera'],
    'La Primavera': ['Centro'],
    'Santa Rosalía': ['Centro']
  }
};

/**
 * Maps a city name to its parent Department
 */
export function getDepartmentByCity(city: string): string {
  if (!city) return '';
  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const norm = normalize(city);

  // 0. EXPLICIT OVERRIDES (Authoritative truths for common geocoder errors)
  if (norm === 'cali') return 'Valle del Cauca';
  if (norm === 'popayan') return 'Cauca';
  if (norm === 'cartagena') return 'Bolívar';
  if (norm === 'barranquilla') return 'Atlántico';
  if (norm === 'santa marta') return 'Magdalena';

  // 1. Precise match in keys
  for (const [dept, cities] of Object.entries(COLOMBIA_GEO)) {
    if (Object.keys(cities).some(c => normalize(c) === norm)) return dept;
  }

  // 2. Loose match (if geocoder returns slightly different name)
  for (const [dept, cities] of Object.entries(COLOMBIA_GEO)) {
    if (Object.keys(cities).some(c => normalize(c).includes(norm) || norm.includes(normalize(c)))) return dept;
  }

  return '';
}

// ─────────────────────────────────────────────
// CITY ZONE CONFIG
// ─────────────────────────────────────────────
export const CITY_ZONE_CONFIG: Record<string, { radiusM: number; offset: number; threshold: number }> = {
  'Bogotá': { radiusM: 7500, offset: 0.12, threshold: 0.022 },
  'Medellín': { radiusM: 5200, offset: 0.08, threshold: 0.015 },
  'Cali': { radiusM: 5000, offset: 0.08, threshold: 0.015 },
  'Barranquilla': { radiusM: 4500, offset: 0.07, threshold: 0.014 },
  'Cúcuta': { radiusM: 4000, offset: 0.065, threshold: 0.012 },
  'Cartagena': { radiusM: 4200, offset: 0.065, threshold: 0.012 },
  'Bucaramanga': { radiusM: 3800, offset: 0.06, threshold: 0.011 },
  'Pereira': { radiusM: 3500, offset: 0.055, threshold: 0.010 },
  'Ibagué': { radiusM: 3500, offset: 0.055, threshold: 0.010 },
  'Santa Marta': { radiusM: 3200, offset: 0.05, threshold: 0.009 },
  'Pasto': { radiusM: 3200, offset: 0.05, threshold: 0.009 },
  'Manizales': { radiusM: 3000, offset: 0.05, threshold: 0.009 },
  'Villavicencio': { radiusM: 3200, offset: 0.05, threshold: 0.009 },
  'Neiva': { radiusM: 3000, offset: 0.048, threshold: 0.009 },
  'Armenia': { radiusM: 2800, offset: 0.045, threshold: 0.008 },
  'Valledupar': { radiusM: 3000, offset: 0.048, threshold: 0.009 },
  'Montería': { radiusM: 3000, offset: 0.048, threshold: 0.009 },
  'Sincelejo': { radiusM: 2500, offset: 0.04, threshold: 0.008 },
  'Popayán': { radiusM: 2500, offset: 0.04, threshold: 0.008 },
  'Soledad': { radiusM: 2800, offset: 0.045, threshold: 0.008 },
  'Bello': { radiusM: 2800, offset: 0.045, threshold: 0.008 },
  'Itagüí': { radiusM: 2200, offset: 0.035, threshold: 0.007 },
  'Envigado': { radiusM: 2200, offset: 0.035, threshold: 0.007 },
  'Tunja': { radiusM: 2200, offset: 0.035, threshold: 0.007 },
  'Riohacha': { radiusM: 2500, offset: 0.04, threshold: 0.008 },
  'Florencia': { radiusM: 2500, offset: 0.04, threshold: 0.008 },
  'Yopal': { radiusM: 2500, offset: 0.04, threshold: 0.008 },
  'Sabaneta': { radiusM: 1800, offset: 0.028, threshold: 0.006 },
  'Dosquebradas': { radiusM: 2200, offset: 0.035, threshold: 0.007 },
  'Palmira': { radiusM: 2800, offset: 0.045, threshold: 0.008 },
  'Buenaventura': { radiusM: 3000, offset: 0.048, threshold: 0.009 },
};

export function getCityZoneConfig(city: string) {
  return CITY_ZONE_CONFIG[city] ?? { radiusM: 1200, offset: 0.020, threshold: 0.005 };
}

// ─────────────────────────────────────────────
// ZONE COLORS & OPTIONS
// ─────────────────────────────────────────────
export const ZONE_COLORS: Record<string, { stroke: string; fill: string; label: string }> = {
  'Norte': { stroke: '#3b82f6', fill: '#3b82f6', label: '↑ Zona Norte' },
  'Sur': { stroke: '#f97316', fill: '#f97316', label: '↓ Zona Sur' },
  'Centro': { stroke: '#10b981', fill: '#10b981', label: '⊙ Zona Centro' },
  'Este': { stroke: '#8b5cf6', fill: '#8b5cf6', label: '→ Zona Este' },
  'Oeste': { stroke: '#ec4899', fill: '#ec4899', label: '← Zona Oeste' },
};

export const ZONE_OPTIONS = [
  { value: 'Norte', label: 'Norte', icon: '↑', color: '#3b82f6' },
  { value: 'Sur', label: 'Sur', icon: '↓', color: '#f97316' },
  { value: 'Centro', label: 'Centro', icon: '⊙', color: '#10b981' },
  { value: 'Este', label: 'Este', icon: '→', color: '#8b5cf6' },
  { value: 'Oeste', label: 'Oeste', icon: '←', color: '#ec4899' },
];

export const ZONE_SECTOR_ANGLES: Record<string, { start: number; end: number }> = {
  'Norte': { start: -55, end: 55 },
  'Sur': { start: 125, end: 235 },
  'Este': { start: 35, end: 145 },
  'Oeste': { start: 215, end: 325 },
  'Centro': { start: 0, end: 360 },
};

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
export const COLOMBIA_CENTER = { lat: 4.5709, lng: -74.2973 };
export const DEFAULT_ZOOM = 6;
export const GPS_SETTLE_TIME = 8000;

// ─────────────────────────────────────────────
// PHOTON FETCH (Sin límite de rate agresivo como Nominatim)
// ─────────────────────────────────────────────
async function photonFetch(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'es,es-CO;q=0.9,en;q=0.5',
    },
  });
  if (!res.ok) throw new Error(`photon_http_${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────
// CACHE LRU SIMPLE — compartido entre geo y sugerencias
// ─────────────────────────────────────────────
const _geoCache = new Map<string, { data: any; ts: number }>();
const GEO_CACHE_TTL = 10 * 60 * 1000; // 10 min
const GEO_CACHE_MAX = 80;
const SUG_CACHE_TTL = 3 * 60 * 1000; //  3 min

function _cacheGet(key: string): any | null {
  const entry = _geoCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > GEO_CACHE_TTL) { _geoCache.delete(key); return null; }
  return entry.data;
}
function _cacheSet(key: string, data: any, ttl = GEO_CACHE_TTL) {
  if (_geoCache.size >= GEO_CACHE_MAX) {
    const oldest = [..._geoCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    if (oldest) _geoCache.delete(oldest[0]);
  }
  // TTL diferente: guardamos con ts relativo
  _geoCache.set(key, { data, ts: Date.now() - (GEO_CACHE_TTL - ttl) });
}

// ─────────────────────────────────────────────
// CLASSIFY QUERY — Colombia-aware
// ─────────────────────────────────────────────
export function classifyQuery(q: string): 'exact' | 'street' | 'area' {
  const s = q.trim();

  // Dirección exacta: tiene numeración complementaria colombiana
  const exactPatterns = [
    /[#＃]\s*\d+/,                       // # 5 o #5
    /\bno\.?\s*\d+/i,                     // No. 5 o No 5
    /\d+\s*-\s*\d+/,                      // 80-40 complemento colombiano
    /\bbis\b/i,                            // Cll 10 bis
  ];
  if (exactPatterns.some(r => r.test(s))) return 'exact';

  // Calle / vía: abreviatura o nombre completo + número
  const streetPatterns = [
    /\b(calle|carrera|transversal|diagonal|avenida|autopista|variante|bulevar)\s+\d+/i,
    /\b(cl|cll|cra|cr|kra|tv|tr|trans|dg|diag|av|avda|blv)\s*\.?\s*\d+/i,
    /\b(via|vía|carretera|ruta|autopista)\s+/i,
  ];
  if (streetPatterns.some(r => r.test(s))) return 'street';

  return 'area';
}

// ─────────────────────────────────────────────
// BUILD PHOTON QUERIES — de más a menos específico
// ─────────────────────────────────────────────
function buildPhotonQueries(
  raw: string,
  ctx: { neighborhood?: string; city?: string; department?: string },
): string[] {
  const q = raw.trim();
  const parts = [ctx.neighborhood, ctx.city, ctx.department].filter(Boolean) as string[];
  const queries: string[] = [];

  // 1. Query completa con todo el contexto
  if (parts.length > 1) queries.push(`${q} ${parts.join(' ')}`);

  // 2. Ciudad + departamento
  if (ctx.city && ctx.department) queries.push(`${q} ${ctx.city} ${ctx.department}`);

  // 3. Solo ciudad
  if (ctx.city) queries.push(`${q} ${ctx.city}`);

  // 4. Solo departamento
  if (ctx.department) queries.push(`${q} ${ctx.department}`);

  // 5. Fallback puro
  queries.push(q);

  return [...new Set(queries)]; // dedup preservando orden
}

// ─────────────────────────────────────────────
/**
 * Performs geocoding using the Photon API (based on OSM & ElasticSearch).
 * @param rawQuery The text to search (address, city, or landmark)
 * @param ctx Contextual filters like city or neighborhood to refine results
 * @returns GeocodeResult or null if not found
 */
export async function geocodeAddress(
  rawQuery: string,
  ctx: { neighborhood?: string; city?: string; department?: string },
): Promise<GeocodeResult | null> {
  const queries = buildPhotonQueries(rawQuery, ctx);
  const queryType = classifyQuery(rawQuery);

  for (const q of queries) {
    const cacheKey = `geo:${q.toLowerCase()}`;
    let data = _cacheGet(cacheKey);

    if (!data) {
      try {
        const url = new URL('https://photon.komoot.io/api/');
        url.searchParams.set('q', q);
        url.searchParams.set('limit', '4');
        // Usar filtro para limitarlo a ubicaciones en Colombia unicamente
        // El boundary box de Colombia extendido
        url.searchParams.set('bbox', '-82.0,-4.5,-66.5,13.5');

        data = await photonFetch(url.toString());
        if (data && data.features && data.features.length > 0) {
          _cacheSet(cacheKey, data);
        }
      } catch (e: any) {
        if (q === queries[0]) throw new Error('network');
        continue;
      }
    }

    if (!data || !data.features || data.features.length === 0) continue;

    const bestFeature = data.features[0];
    const props = bestFeature.properties;
    const geom = bestFeature.geometry;

    // Photon devuelve [lng, lat]
    const lng = geom.coordinates[0];
    const lat = geom.coordinates[1];

    const mainRaw = [props.name, props.street || props.district || props.city].filter(Boolean);
    const mainParts: string[] = [];
    const mainSeen = new Set<string>();
    for (const p of mainRaw) {
      const n = p.toLowerCase().trim();
      if (!mainSeen.has(n)) {
        mainParts.push(p);
        mainSeen.add(n);
      }
    }

    const subRaw = [props.city || props.county, props.state, props.country].filter(Boolean);
    const subParts: string[] = [];
    for (const p of subRaw) {
      const n = p.toLowerCase().trim();
      if (!mainSeen.has(n)) {
        subParts.push(p);
        mainSeen.add(n);
      }
    }

    return {
      lat,
      lng,
      displayName: props.name || props.city || q,
      mainText: mainParts.join(', '),
      subText: subParts.join(', '),
      type: queryType,
      boundingBox: bestFeature.properties.extent ? {
        w: bestFeature.properties.extent[0],
        s: bestFeature.properties.extent[1],
        e: bestFeature.properties.extent[2],
        n: bestFeature.properties.extent[3],
      } : undefined,
      raw: bestFeature,
    };
  }

  return null;
}

// ─────────────────────────────────────────────
// AUTOCOMPLETE SUGGESTIONS — Usando Photon API
// ─────────────────────────────────────────────
export async function fetchAutocompleteSuggestions(
  query: string,
  ctx: { neighborhood?: string; city?: string; department?: string },
): Promise<GeocodeSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  // Usamos un retraso menor para Photon porque es extremadamente rapido (Type-ahead optimizado)
  // Photon usa bases OSM
  const ctxStr = [ctx.neighborhood, ctx.city, ctx.department].filter(Boolean).join(' ');
  const searchQ = q.includes(',') ? q : `${q} ${ctxStr}`;
  const cacheKey = `sug:${searchQ.toLowerCase()}`;
  const cached = _cacheGet(cacheKey);
  if (cached) return cached as GeocodeSuggestion[];

  try {
    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', searchQ);
    url.searchParams.set('limit', '8');
    // Limite de bbox a Colombia
    url.searchParams.set('bbox', '-82.0,-4.5,-66.5,13.5');

    const data = await photonFetch(url.toString());

    if (!data || !data.features) return [];

    const seen = new Set<string>();
    const results: GeocodeSuggestion[] = data.features
      .filter((f: any) => {
        const props = f.properties;
        const key = `${props.name || ''}-${props.city || ''}`.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6)
      .map((f: any) => {
        const props = f.properties;
        const mainRaw = [props.name, props.street || props.district].filter(Boolean);
        const mainParts: string[] = [];
        const mainSeen = new Set<string>();
        for (const p of mainRaw) {
          const n = p.toLowerCase().trim();
          if (!mainSeen.has(n)) {
            mainParts.push(p);
            mainSeen.add(n);
          }
        }

        const subRaw = [props.city || props.county, props.state, props.country].filter(Boolean);
        const subParts: string[] = [];
        for (const p of subRaw) {
          const n = p.toLowerCase().trim();
          if (!mainSeen.has(n)) {
            subParts.push(p);
            mainSeen.add(n);
          }
        }

        return {
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          mainText: mainParts.length > 0 ? mainParts.join(', ') : (props.city || 'Desconocido'),
          subText: subParts.join(', '),
          icon: getSuggestionIcon({ type: props.osm_value, class: props.osm_key }),
          type: props.osm_value || '',
          class: props.osm_key || '',
          raw: f,
        };
      });

    _cacheSet(cacheKey, results, SUG_CACHE_TTL);
    return results;
  } catch (e) {
    console.warn('[photon-suggestions]', e);
    return [];
  }
}

// ─────────────────────────────────────────────
/**
 * Converts coordinates into a human-readable address/geographic breakdown.
 * @param lat Latitude
 * @param lng Longitude
 * @returns Object with city, department, and neighborhood
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeoResult | null> {
  const cacheKey = `rev:${lat.toFixed(3)},${lng.toFixed(3)}`;
  let data = _cacheGet(cacheKey);

  if (!data) {
    try {
      const url = new URL('https://photon.komoot.io/reverse');
      url.searchParams.set('lat', lat.toString());
      url.searchParams.set('lon', lng.toString());
      url.searchParams.set('radius', '1'); // 1km fallback

      data = await photonFetch(url.toString());
      _cacheSet(cacheKey, data);
    } catch (e) {
      console.warn('[reverseGeo]', e);
      return null;
    }
  }

  if (!data || !data.features || data.features.length === 0) return null;
  const props = data.features[0].properties;

  return {
    city: props.city || props.town || props.village || props.county || '',
    department: props.state || '',
    neighborhood: props.district || props.street || '',
    country: (props.countrycode || '').toUpperCase() || 'CO',
    raw: data,
  };
}

// ─────────────────────────────────────────────
// GEO UTILITY FUNCTIONS
// ─────────────────────────────────────────────
export function normalize(str: string): string {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getZoneByCoords(
  lat: number, lng: number,
  centerLat: number, centerLng: number,
  city?: string,
): string {
  const cfg = city ? getCityZoneConfig(city) : { threshold: 0.010 };
  const dLat = lat - centerLat;
  const dLng = lng - centerLng;

  // 1. Centro check (Square/Radial proximity)
  if (Math.abs(dLat) < cfg.threshold && Math.abs(dLng) < cfg.threshold) return 'Centro';

  // 2. Angular sector check for High Precision
  // atan2 returns angle in radians [-PI, PI]
  // We convert to degrees [0, 360] where 0 is North/Up (+Lat)
  let angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  // Sectors mapping: Tilted for Colombian urban sprawl (often linear N-S)
  // Norte is between 325 and 35
  if (angle >= 325 || angle < 35) return 'Norte';
  // Este is between 35 and 145
  if (angle >= 35 && angle < 145) return 'Este';
  // Sur is between 145 and 215
  if (angle >= 145 && angle < 215) return 'Sur';
  // Oeste is between 215 and 325
  if (angle >= 215 && angle < 325) return 'Oeste';

  return 'Centro';
}

export function zoneColor(zone: string): string {
  const map: Record<string, string> = {
    Norte: '#3b82f6', Sur: '#f97316', Centro: '#10b981', Este: '#8b5cf6', Oeste: '#ec4899',
  };
  return map[zone] ?? '#64748b';
}

export function zoneIcon(zone: string): string {
  return { Norte: '↑', Sur: '↓', Centro: '⊙', Este: '→', Oeste: '←' }[zone] ?? '•';
}

export function buildSectorPoints(
  cLat: number, cLng: number,
  bearingStart: number, bearingEnd: number,
  radiusM: number,
): [number, number][] {
  const R = 6371000;
  const pts: [number, number][] = [];
  const isFullCircle = (bearingEnd - bearingStart) >= 359;
  if (!isFullCircle) pts.push([cLat, cLng]);
  for (let b = bearingStart; b <= bearingEnd; b += 2) {
    const rad = (b * Math.PI) / 180;
    const lat1 = (cLat * Math.PI) / 180;
    const lon1 = (cLng * Math.PI) / 180;
    const d = radiusM / R;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(rad));
    const lon2 = lon1 + Math.atan2(
      Math.sin(rad) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
    pts.push([(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI]);
  }
  if (!isFullCircle) pts.push([cLat, cLng]);
  return pts;
}

export function getSuggestionIcon(sug: { type?: string; class?: string }): string {
  const t = (sug.type || '').toLowerCase();
  const c = (sug.class || '').toLowerCase();
  if (c === 'highway' || ['residential', 'tertiary', 'secondary', 'primary', 'road', 'service'].includes(t)) return '🛣️';
  if (['house', 'building', 'apartments'].includes(t)) return '🏠';
  if (['suburb', 'neighbourhood', 'quarter'].includes(t)) return '🏘️';
  if (['city', 'town', 'municipality'].includes(t)) return '🏙️';
  if (c === 'amenity') return '📍';
  if (t === 'administrative') return '🗺️';
  return '📌';
}

export function parseSuggestion(sug: any): { _mainText: string; _subText: string } {
  const parts = (sug.display_name || '').split(',').map((s: string) => s.trim());
  return { _mainText: parts.slice(0, 2).join(', '), _subText: parts.slice(2, 5).join(', ') };
}

export function getPropDotStyle(dist: number, idx: number, total: number): string {
  const maxR = 86;
  const r = dist < 0.3 ? 14 : dist < 1 ? 28 : dist < 3 ? 54 : Math.min(dist / 6 * maxR, maxR);
  const angle = (idx / Math.max(total, 1)) * 360 + 30;
  const rad = (angle * Math.PI) / 180;
  const x = 50 + r * Math.cos(rad);
  const y = 50 + r * Math.sin(rad);
  return `left:${x}%;top:${y}%;transform:translate(-50%,-50%)`;
}

// ─────────────────────────────────────────────
// CACHÉ EN MEMORIA DE PROPIEDADES (TTL 2 min)
// ─────────────────────────────────────────────
let cachedProperties: MapProperty[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 2 * 60 * 1000;

// ─────────────────────────────────────────────
// CLUSTERING LADO CLIENTE
// ─────────────────────────────────────────────
export function clusterProperties(properties: MapProperty[], zoom: number): PropertyCluster[] {
  const gridSize =
    zoom < 8 ? 4 :
      zoom < 10 ? 2 :
        zoom < 12 ? 0.8 :
          zoom < 13 ? 0.3 : 0;

  if (gridSize === 0) {
    return properties.map(p => ({
      lat: p.lat, lng: p.lng, count: 1, properties: [p], avgPrice: p.monthly_price,
    }));
  }

  const grid: Record<string, PropertyCluster> = {};
  for (const p of properties) {
    const cellLat = Math.floor(p.lat / gridSize) * gridSize;
    const cellLng = Math.floor(p.lng / gridSize) * gridSize;
    const key = `${cellLat}:${cellLng}`;
    if (!grid[key]) grid[key] = { lat: 0, lng: 0, count: 0, properties: [], avgPrice: 0 };
    grid[key].properties.push(p);
    grid[key].count++;
    grid[key].lat += p.lat;
    grid[key].lng += p.lng;
    grid[key].avgPrice += p.monthly_price;
  }

  return Object.values(grid).map(c => ({
    lat: c.lat / c.count,
    lng: c.lng / c.count,
    count: c.count,
    properties: c.properties,
    avgPrice: c.avgPrice / c.count,
  }));
}

// ─────────────────────────────────────────────
// FORMATEO DE PRECIO (COP)
// ─────────────────────────────────────────────
export function formatPriceShort(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}k`;
  return `${price}`;
}

export function formatPriceFull(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// ─────────────────────────────────────────────
// STATUS HELPERS
// ─────────────────────────────────────────────
export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Disponible',
    rented: 'Arrendada',
    maintenance: 'Mantenimiento',
  };
  return labels[status] ?? status;
}

export const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible' },
  { value: 'rented', label: 'Arrendada' },
  { value: 'maintenance', label: 'Mantenimiento' },
];

export const TIER_META: Record<string, { color: string; label: string; emoji: string }> = {
  ultra: { color: '#D4A853', label: '< 300m', emoji: '🏆' },
  near: { color: '#B08B45', label: '300m–1km', emoji: '🥇' },
  medium: { color: '#8C6D38', label: '1–3km', emoji: '🥈' },
  far: { color: '#6B512A', label: '> 3km', emoji: '🥉' },
};

// ─────────────────────────────────────────────
// SERVICIO PRINCIPAL
// ─────────────────────────────────────────────
export const propertyMapService = {
  async getAllForMap(filters: MapFilters = {}): Promise<MapProperty[]> {
    const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '');
    const now = Date.now();

    if (!hasFilters && cachedProperties && (now - cacheTimestamp) < CACHE_TTL_MS) {
      console.log(`📦 Cache hit: ${cachedProperties.length} propiedades`);
      return cachedProperties;
    }

    const params: Record<string, any> = { per_page: 500 };
    const firstResponse = await api.get('/properties', { params });
    const { data: firstBatch, meta } = firstResponse.data;

    let allItems = [...(firstBatch ?? [])];

    if (meta?.last_page > 1) {
      const pageNumbers = Array.from({ length: meta.last_page - 1 }, (_, i) => i + 2);
      const restResponses = await Promise.all(
        pageNumbers.map(page => api.get('/properties', { params: { ...params, page } })),
      );
      restResponses.forEach(r => allItems.push(...(r.data.data ?? [])));
    }

    const withCoords: MapProperty[] = allItems
      .map((p: any) => {
        const lat = parseFloat(p.lat);
        const lng = parseFloat(p.lng);
        const city = p.city || '';
        const center = CITY_CENTERS[city];
        const zone = center ? getZoneByCoords(lat, lng, center.lat, center.lng, city) : undefined;
        return {
          ...p,
          lat,
          lng,
          monthly_price: parseFloat(p.monthly_price),
          _normalizedCity: normalize(city),
          _normalizedAddress: normalize(p.address || ''),
          _zone: zone,
        };
      })
      .filter((p: MapProperty) => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0);

    if (!hasFilters) {
      cachedProperties = withCoords;
      cacheTimestamp = now;
    }

    return withCoords;
  },

  clearCache() {
    cachedProperties = null;
    cacheTimestamp = 0;
  },
};