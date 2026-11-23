<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { errorMessage, visor3dService } from '@/services/visor3dService'
import { useAlerts } from '@/composables/useAlerts'
import type { PublicLink } from '@/types/visor3d'

const props = defineProps<{ buildingId: number }>()
const alerts = useAlerts()

const link = ref<PublicLink>({ active: false })
const expires = ref<number | ''>('')
const busy = ref(false)

async function load() {
  try {
    link.value = await visor3dService.publicLink(props.buildingId)
  } catch (e) {
    alerts.error(errorMessage(e))
  }
}

async function create() {
  busy.value = true
  try {
    link.value = await visor3dService.createPublicLink(props.buildingId, expires.value === '' ? null : expires.value)
    alerts.success('Enlace creado. Los enlaces anteriores dejaron de funcionar.')
  } catch (e) {
    alerts.error(errorMessage(e))
  } finally {
    busy.value = false
  }
}

function revoke() {
  alerts.danger('¿Desactivar el enlace público? Quien lo tenga (o lo tenga incrustado) dejará de ver el visor.', async () => {
    await visor3dService.revokePublicLink(props.buildingId)
    link.value = { active: false }
  }, undefined, { confirmText: 'Desactivar' })
}

async function copy(text?: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    alerts.success('Copiado')
  } catch {
    alerts.warning('No se pudo copiar; selecciónalo a mano.')
  }
}

onMounted(load)
</script>

<template>
  <section class="panel">
    <p class="muted">
      El enlace muestra el visor en <b>modo inmobiliaria</b>, sin iniciar sesión: solo número, área, habitaciones, baños,
      precio y estado. Nunca cartera, inquilinos ni PQRS.
    </p>

    <div class="row">
      <select v-model="expires">
        <option value="">Sin vencimiento</option>
        <option :value="7">Vence en 7 días</option>
        <option :value="30">Vence en 30 días</option>
        <option :value="90">Vence en 90 días</option>
        <option :value="365">Vence en 1 año</option>
      </select>
      <button type="button" class="primary" :disabled="busy" @click="create">
        {{ link.active ? 'Generar enlace nuevo' : 'Crear enlace público' }}
      </button>
      <button v-if="link.active" type="button" class="link danger" @click="revoke">Desactivar</button>
    </div>

    <template v-if="link.active">
      <label>Enlace
        <div class="copy">
          <input :value="link.url" readonly @focus="($event.target as HTMLInputElement).select()" />
          <button type="button" class="secondary" @click="copy(link.url)">Copiar</button>
          <a class="secondary" :href="link.url" target="_blank" rel="noopener">Abrir</a>
        </div>
      </label>
      <label>Código para incrustar en la web del cliente (iframe)
        <div class="copy">
          <textarea :value="link.iframe" readonly rows="3" @focus="($event.target as HTMLTextAreaElement).select()" />
          <button type="button" class="secondary" @click="copy(link.iframe)">Copiar</button>
        </div>
      </label>
      <p class="muted">{{ link.expires_at ? `Vence el ${new Date(link.expires_at).toLocaleString('es-CO')}.` : 'No vence.' }} Generar uno nuevo invalida el anterior.</p>
    </template>
  </section>
</template>

<style scoped>
.panel { display: flex; flex-direction: column; gap: 12px; }
.row, .copy { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--v3d-muted); }
.copy input, .copy textarea { flex: 1; min-width: 220px; padding: 8px 10px; border: 1px solid var(--v3d-border); border-radius: 8px; font-family: ui-monospace, monospace; font-size: 12px; background: var(--v3d-surface-2); }
select { padding: 8px 10px; border: 1px solid var(--v3d-border); border-radius: 8px; }
.muted { color: var(--v3d-muted); font-size: 13px; line-height: 1.5; }
.primary { background: var(--v3d-accent); color: var(--v3d-on-accent); border: 0; border-radius: 8px; padding: 9px 14px; cursor: pointer; font-weight: 600; }
.secondary { background: var(--v3d-surface-2); border: 1px solid var(--v3d-border); border-radius: 8px; padding: 8px 12px; cursor: pointer; color: var(--v3d-text); text-decoration: none; font-size: 14px; }
.link { background: none; border: 0; color: var(--v3d-accent); cursor: pointer; }
.danger { color: #f87171; }
</style>
