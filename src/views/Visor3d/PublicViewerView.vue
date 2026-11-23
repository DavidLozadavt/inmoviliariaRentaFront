<script setup lang="ts">
// Visor público: enlace firmado, sin login, solo datos comerciales. Con ?embed=1 va sin encabezado (iframe).
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import BuildingViewer from '@/components/visor3d/BuildingViewer.vue'
import { visor3dService } from '@/services/visor3dService'
import type { BuildingPayload } from '@/types/visor3d'

const route = useRoute()
const token = String(route.params.token)
const embed = computed(() => route.query.embed === '1')

// La firma cubre expires + signature tal cual los generó el backend
const signedQuery = (() => {
  const q = new URLSearchParams()
  for (const k of ['expires', 'signature']) {
    const v = route.query[k]
    if (typeof v === 'string') q.set(k, v)
  }
  return q.toString()
})()

const payload = ref<BuildingPayload | null>(null)
const loading = ref(true)
const error = ref('')

const loadTour = (unitId: number) => visor3dService.publicTour(token, signedQuery, unitId)

async function refresh() {
  try {
    payload.value = await visor3dService.publicConfig(token, signedQuery)
  } catch { /* se reintenta en el siguiente ciclo */ }
}

// Refresco "en vivo": cada 30 s mientras la pestaña está visible (la respuesta viene de caché en el backend)
const LIVE_MS = 30000
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    if (document.visibilityState === 'visible' && payload.value) refresh()
  }, LIVE_MS)
})
onBeforeUnmount(() => clearInterval(timer))


onMounted(async () => {
  try {
    payload.value = await visor3dService.publicConfig(token, signedQuery)
    document.title = `${payload.value.building.name} · Visor 3D | NexiLiving`
  } catch (e) {
    const status = axios.isAxiosError(e) ? e.response?.status : 0
    error.value =
      status === 410 ? 'Este enlace ya venció. Pide uno nuevo a la inmobiliaria.'
      : status === 404 ? 'Este enlace ya no está disponible.'
      : status === 403 ? 'El enlace no es válido. Revisa que esté completo.'
      : 'No se pudo cargar el visor. Intenta de nuevo más tarde.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="public" :class="{ embed }">
    <header v-if="!embed && payload" class="head">
      <div>
        <h1>{{ payload.building.name }}</h1>
        <p>{{ [payload.building.address, payload.building.city].filter(Boolean).join(', ') }}</p>
      </div>
      <a href="/" class="brand" target="_blank" rel="noopener">NexiLiving</a>
    </header>
    <div v-if="loading" class="state">Cargando visor…</div>
    <div v-else-if="error" class="state err">{{ error }}</div>
    <BuildingViewer v-else-if="payload" :payload="payload" is-public :load-tour="loadTour" live />
  </div>
</template>

<style scoped>
.public { min-height: 100vh; background: radial-gradient(circle at 20% 0%, #4a2c1e, #1c120e 60%); padding: 16px; color: var(--v3d-text); }
.public.embed { padding: 8px; background: #1c120e; min-height: 0; }
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; max-width: 1400px; margin: 0 auto 12px; }
h1 { font-size: 22px; }
.head p { color: var(--v3d-muted); font-size: 14px; }
.brand { color: var(--v3d-accent); font-weight: 700; text-decoration: none; font-size: 14px; }
.state { padding: 80px 16px; text-align: center; color: var(--v3d-muted); }
.state.err { color: #f87171; }
</style>
