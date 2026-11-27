<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BuildingViewer from '@/components/visor3d/BuildingViewer.vue'
import { errorMessage, visor3dService } from '@/services/visor3dService'
import { useAlerts } from '@/composables/useAlerts'
import type { BuildingPayload, CommercialStatus } from '@/types/visor3d'

const route = useRoute()
const router = useRouter()
const alerts = useAlerts()
const id = Number(route.params.id)

const payload = ref<BuildingPayload | null>(null)
const loading = ref(true)
const error = ref('')

async function load() {
  error.value = ''
  try {
    payload.value = await visor3dService.config(id)
  } catch (e) {
    error.value = errorMessage(e, 'No se pudo cargar el edificio')
  } finally {
    loading.value = false
  }
}

async function refresh() {
  try {
    payload.value = await visor3dService.config(id)
  } catch { /* se reintenta en el siguiente ciclo */ }
}

const loadTour = (unitId: number) => visor3dService.tour(id, unitId)

async function saveUnit(unitId: number, data: { commercial_status: CommercialStatus; monthly_price: number }) {
  try {
    await visor3dService.updateUnit(id, unitId, data)
    await load()
    alerts.success('Unidad actualizada')
  } catch (e) {
    alerts.error(errorMessage(e))
  }
}

onMounted(load)

// Refresco "en vivo": cada 30 s mientras la pestaña está visible (la respuesta viene de caché en el backend)
const LIVE_MS = 30000
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    if (document.visibilityState === 'visible' && payload.value) refresh()
  }, LIVE_MS)
})
onBeforeUnmount(() => clearInterval(timer))

</script>

<template>
  <div class="page">
    <header class="head">
      <button type="button" class="link" @click="router.push({ name: 'Visor3dList' })">← Edificios</button>
      <button v-if="payload" type="button" class="secondary" @click="router.push({ name: 'Visor3dEdit', params: { id } })">Editar edificio</button>
    </header>
    <div v-if="loading" class="state">Cargando edificio…</div>
    <div v-else-if="error" class="state err">{{ error }}</div>
    <BuildingViewer v-else-if="payload" :payload="payload" :load-tour="loadTour" :save-unit="saveUnit" live />
  </div>
</template>

<style scoped>
.page { max-width: 1400px; margin: 96px auto 40px; background: var(--v3d-card); border: 1px solid var(--v3d-border); color: var(--v3d-text); border-radius: 18px; padding: 16px 16px 40px; color: var(--v3d-text); }
.head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.link { background: none; border: 0; color: var(--v3d-accent); cursor: pointer; font-size: 14px; }
.secondary { color: var(--v3d-text); background: var(--v3d-surface-2); border: 1px solid var(--v3d-border); border-radius: 8px; padding: 8px 14px; cursor: pointer; }
.state { padding: 60px 16px; text-align: center; color: var(--v3d-muted); }
.state.err { color: #f87171; }
</style>
