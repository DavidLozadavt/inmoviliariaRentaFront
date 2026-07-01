// src/composables/usePropertyTypes.ts
import { useI18n } from 'vue-i18n';

/**
 * Composable para manejar tipos de propiedades de forma consistente
 * en toda la aplicación, con soporte para i18n
 */
export function usePropertyTypes() {
  const { t } = useI18n();

  /**
   * Detecta el tipo de propiedad desde el título (SIN traducir)
   * Retorna valores normalizados en español para comparaciones
   * 
   * @param title - Título de la propiedad
   * @returns Tipo normalizado: "casa" | "apartamento" | "local" | "finca" | ""
   */
  const detectTypeNormalized = (title: string): string => {
    if (!title) return "";
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes("casa")) return "casa";
    if (titleLower.includes("apartamento") || titleLower.includes("apto")) return "apartamento";
    if (titleLower.includes("local")) return "local";
    if (titleLower.includes("finca")) return "finca";
    
    return "";
  };

  /**
   * Detecta el tipo de propiedad Y lo traduce para mostrar en UI
   * 
   * @param title - Título de la propiedad
   * @returns Tipo traducido según el idioma actual
   */
  const detectTypeTranslated = (title: string): string => {
    if (!title) return t('home.search.fields.type.all');
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes("casa")) return t('home.search.fields.type.house');
    if (titleLower.includes("apartamento") || titleLower.includes("apto")) return t('home.search.fields.type.apartment');
    if (titleLower.includes("local")) return t('home.search.fields.type.commercial');
    if (titleLower.includes("finca")) return t('home.search.fields.type.farm');
    
    return t('home.search.fields.type.all');
  };

  /**
   * Obtiene el icono de FontAwesome según el tipo de propiedad
   * 
   * @param title - Título de la propiedad
   * @returns Nombre del icono de FontAwesome
   */
  const getTypeIcon = (title: string): string => {
    if (!title) return "home";
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes("casa")) return "home";
    if (titleLower.includes("apartamento") || titleLower.includes("apto")) return "building";
    if (titleLower.includes("local")) return "store";
    if (titleLower.includes("finca")) return "tree";
    
    return "home";
  };

  /**
   * Mapa de tipos normalizados a sus traducciones i18n keys
   */
  const typeLabels: Record<string, string> = {
    casa: "home.search.fields.type.house",
    apartamento: "home.search.fields.type.apartment",
    local: "home.search.fields.type.commercial",
    finca: "home.search.fields.type.farm",
  };

  /**
   * Normaliza términos de búsqueda en inglés a español
   */
  const searchTermNormalizer: Record<string, string> = {
    "house": "casa",
    "apartment": "apartamento",
    "commercial": "local",
    "commercial space": "local",
    "farm": "finca",
    "apt": "apartamento",
    "store": "local",
    "shop": "local",
    "houses": "casa",
    "apartments": "apartamento",
    "farms": "finca",
  };

  /**
   * Normaliza un término de búsqueda al valor esperado por el backend
   * 
   * @param search - Término de búsqueda
   * @returns Término normalizado en español
   */
  const normalizeSearchTerm = (search: string): string => {
    if (!search) return "";
    
    const searchLower = search.toLowerCase().trim();
    
    // Busca coincidencias completas primero
    if (searchTermNormalizer[searchLower]) {
      return searchTermNormalizer[searchLower];
    }

    // Busca si alguna palabra clave está contenida en el texto
    for (const [englishTerm, spanishTerm] of Object.entries(searchTermNormalizer)) {
      if (searchLower.includes(englishTerm)) {
        return searchLower.replace(englishTerm, spanishTerm);
      }
    }

    return searchLower;
  };

  return {
    detectTypeNormalized,
    detectTypeTranslated,
    getTypeIcon,
    typeLabels,
    searchTermNormalizer,
    normalizeSearchTerm,
  };
}