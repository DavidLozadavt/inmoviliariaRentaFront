<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Pagination from '@/components/navigation/PaginationControls.vue'
import { useRouter } from 'vue-router'
import { errorMessage, visor3dService } from '@/services/visor3dService'
import { mediaUrl } from '@/utils/visor3d/device'
import type { BuildingSummary } from '@/types/visor3d'

const router = useRouter()
const buildings = ref<BuildingSummary[]>([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    buildings.value = await visor3dService.list()
  } catch (e) {
    error.value = errorMessage(e, 'No se pudieron cargar los edificios')
  } finally {
    loading.value = false
  }
}

const pct = (b: BuildingSummary) => (b.units_count ? Math.round((b.available_count / b.units_count) * 100) : 0)
const cover = (b: BuildingSummary) => mediaUrl(b.cover_url ?? b.preview_url)

// ── Buscador, filtros, orden y paginado (como en Propiedades)
const search = ref('')
const city = ref('')
const avail = ref<'' | 'with' | 'without'>('')
const towersF = ref<'' | 'one' | 'many'>('')
const sort = ref<'recent' | 'old' | 'name' | 'units' | 'available'>('recent')
const page = ref(1)
const perPage = 9

const cities = computed(() => [...new Set(buildings.value.map((b) => b.city).filter(Boolean) as string[])].sort())
const norm = (t?: string | null) => (t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const filtered = computed(() => {
  const q = norm(search.value.trim())
  const list = buildings.value.filter((b) =>
    (!q || norm(`${b.name} ${b.address} ${b.city}`).includes(q))
    && (!city.value || b.city === city.value)
    && (!avail.value || (avail.value === 'with' ? b.available_count > 0 : b.available_count === 0))
    && (!towersF.value || (towersF.value === 'one' ? b.towers <= 1 : b.towers > 1)))
  const time = (b: BuildingSummary) => new Date(b.created_at ?? b.updated_at).getTime()
  const sorters: Record<typeof sort.value, (a: BuildingSummary, b: BuildingSummary) => number> = {
    recent: (a, b) => time(b) - time(a),
    old: (a, b) => time(a) - time(b),
    name: (a, b) => a.name.localeCompare(b.name),
    units: (a, b) => b.units_count - a.units_count,
    available: (a, b) => b.available_count - a.available_count,
  }
  return [...list].sort(sorters[sort.value])
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))
const anyFilter = computed(() => !!(search.value || city.value || avail.value || towersF.value))
watch([search, city, avail, towersF, sort], () => { page.value = 1 })
function resetFilters() {
  search.value = ''; city.value = ''; avail.value = ''; towersF.value = ''; sort.value = 'recent'
}
function onPage(p: number) {
  page.value = p
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const isNew = (b: BuildingSummary) => Date.now() - new Date(b.created_at ?? b.updated_at).getTime() < 7 * 864e5

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="head">
      <div>
        <span class="eyebrow">Visor 3D</span>
        <h1>Edificios 3D</h1>
        <p>Torres y conjuntos en 3D: disponibilidad, cartera y PQRS por unidad, con recorrido de cada espacio.</p>
      </div>
      <button type="button" class="primary" @click="router.push({ name: 'Visor3dNew' })">+ Nuevo edificio</button>
    </header>

    <div v-if="loading" class="grid">
      <div v-for="i in 3" :key="i" class="item skeleton" />
    </div>
    <div v-else-if="error" class="state err">{{ error }} <button type="button" class="link" @click="load">Reintentar</button></div>
    <div v-else-if="!buildings.length" class="state empty">
      <div class="empty-ico">🏢</div>
      <h3>Todavía no tienes edificios</h3>
      <p>Sube la foto del conjunto o la torre, indica torres, pisos y unidades, y el 3D se genera solo.</p>
      <button type="button" class="primary" @click="router.push({ name: 'Visor3dNew' })">Crear el primero</button>
    </div>
    <template v-else>
    <div class="toolbar">
      <div class="search">
        <span aria-hidden="true">🔍</span>
        <input v-model="search" type="search" placeholder="Buscar por nombre, dirección o ciudad…" aria-label="Buscar edificios" />
      </div>
      <select v-model="city" aria-label="Ciudad">
        <option value="">Todas las ciudades</option>
        <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="avail" aria-label="Disponibilidad">
        <option value="">Toda disponibilidad</option>
        <option value="with">Con unidades disponibles</option>
        <option value="without">Sin disponibles</option>
      </select>
      <select v-model="towersF" aria-label="Torres">
        <option value="">Torres: todas</option>
        <option value="one">Una torre</option>
        <option value="many">Conjuntos (varias)</option>
      </select>
      <select v-model="sort" aria-label="Ordenar">
        <option value="recent">Más recientes</option>
        <option value="old">Más antiguos</option>
        <option value="name">Nombre (A-Z)</option>
        <option value="units">Más unidades</option>
        <option value="available">Más disponibles</option>
      </select>
    </div>
    <p class="count">{{ filtered.length }} edificio(s){{ anyFilter ? ' con estos filtros' : '' }}
      <button v-if="anyFilter" type="button" class="link" @click="resetFilters">Limpiar filtros</button></p>

    <div v-if="!filtered.length" class="state empty">
      <div class="empty-ico">🔎</div>
      <h3>Ningún edificio coincide</h3>
      <button type="button" class="primary" @click="resetFilters">Limpiar filtros</button>
    </div>
    <ul v-else class="grid">
      <li v-for="b in paged" :key="b.id" class="item" @click="router.push({ name: 'Visor3dView', params: { id: b.id } })">
        <div class="cover">
          <img v-if="cover(b)" :src="cover(b)" :alt="b.name" loading="lazy" />
          <div v-else class="cover-empty"><span>🏢</span><small>Sin foto ni vista previa</small></div>
          <span v-if="isNew(b)" class="new">Nuevo</span>
          <span v-if="b.cover_url" class="tag">Foto del edificio</span>
          <span v-else-if="b.preview_url" class="tag">Modelo 3D</span>
          <span class="avail"><i />{{ b.available_count }} disponibles</span>
        </div>
        <div class="body">
          <h3>{{ b.name }}</h3>
          <p class="muted">📍 {{ [b.address, b.city].filter(Boolean).join(', ') || 'Sin dirección' }}</p>
          <dl class="stats">
            <div><dt>Torres</dt><dd>{{ b.towers }}</dd></div>
            <div><dt>Pisos</dt><dd>{{ b.max_floors }}</dd></div>
            <div><dt>Unidades</dt><dd>{{ b.units_count }}</dd></div>
          </dl>
          <div class="bar" :title="`${pct(b)} % disponible`"><span :style="{ width: pct(b) + '%' }" /></div>
          <div class="actions" @click.stop>
            <button type="button" class="primary" @click="router.push({ name: 'Visor3dView', params: { id: b.id } })">Ver en 3D</button>
            <button type="button" class="secondary" @click="router.push({ name: 'Visor3dEdit', params: { id: b.id } })">Editar</button>
          </div>
        </div>
      </li>
    </ul>
    <Pagination v-if="filtered.length > perPage" :current-page="page" :total-pages="totalPages" :total-items="filtered.length"
      :items-per-page="perPage" @update:page="onPage" />
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 1240px; margin: 96px auto 40px; padding: 28px 20px 40px; border-radius: 20px; background: var(--v3d-card); border: 1px solid var(--v3d-border); color: var(--v3d-text); }
.head { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 24px; }
.eyebrow { font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--v3d-accent); }
h1 { font-size: 30px; margin-top: 4px; }
.head p { color: var(--v3d-muted); margin-top: 6px; max-width: 620px; }
.toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
.search { flex: 1 1 280px; display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,.25); border: 1px solid var(--v3d-border);
  border-radius: 12px; padding: 0 14px; transition: border-color .2s; }
.search:focus-within { border-color: var(--v3d-accent); box-shadow: 0 0 0 3px var(--v3d-accent-soft); }
.search input { flex: 1; border: 0; background: transparent; color: var(--v3d-text); padding: 11px 0; font-size: 14px; outline: none; }
.toolbar select { padding: 10px 12px; border: 1px solid var(--v3d-border); border-radius: 12px; background: rgba(0,0,0,.25); color: var(--v3d-text); font-size: 13px; }
.count { color: var(--v3d-muted); font-size: 13px; margin-bottom: 14px; display: flex; gap: 10px; align-items: center; }
.new { position: absolute; top: 10px; right: 10px; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: #22c55e; color: #052e16; }
:deep(.pagination-container), :deep(nav) { margin-top: 24px; }
.grid { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
.item { border-radius: 16px; overflow: hidden; background: rgba(0, 0, 0, .22); border: 1px solid var(--v3d-border); cursor: pointer; transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease; display: flex; flex-direction: column; }
.item:hover { transform: translateY(-4px); border-color: var(--v3d-accent); box-shadow: 0 14px 34px rgba(0, 0, 0, .35); }
.cover { position: relative; aspect-ratio: 16 / 10; background: radial-gradient(circle at 50% 30%, #3b2519, #1c120e); overflow: hidden; }
.cover img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s ease; }
.item:hover .cover img { transform: scale(1.04); }
.cover-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: var(--v3d-muted); }
.cover-empty span { font-size: 40px; }
.tag, .avail { position: absolute; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; backdrop-filter: blur(8px); }
.tag { top: 10px; left: 10px; background: rgba(28, 18, 14, .75); color: var(--v3d-accent); border: 1px solid var(--v3d-border); }
.avail { bottom: 10px; left: 10px; background: rgba(28, 18, 14, .8); color: #4ade80; display: inline-flex; align-items: center; gap: 6px; }
.avail i { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; }
.body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; }
.body h3 { font-size: 18px; }
.muted { color: var(--v3d-muted); font-size: 13px; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 4px; }
.stats div { background: rgba(0, 0, 0, .22); border-radius: 10px; padding: 6px 10px; }
.stats dt { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--v3d-muted); }
.stats dd { font-size: 18px; font-weight: 700; }
.bar { height: 5px; border-radius: 999px; background: rgba(239, 68, 68, .35); overflow: hidden; }
.bar span { display: block; height: 100%; background: #22c55e; }
.actions { display: flex; gap: 8px; margin-top: 4px; }
.primary { background: linear-gradient(135deg, var(--v3d-accent), var(--v3d-accent-strong)); color: var(--v3d-on-accent); border: 0; border-radius: 10px; padding: 9px 16px; font-weight: 700; cursor: pointer; }
.secondary { background: transparent; color: var(--v3d-text); border: 1px solid var(--v3d-border); border-radius: 10px; padding: 9px 16px; cursor: pointer; }
.secondary:hover { border-color: var(--v3d-accent); }
.skeleton { height: 360px; background: linear-gradient(90deg, rgba(255,255,255,.03), rgba(255,255,255,.08), rgba(255,255,255,.03)); background-size: 200% 100%; animation: shimmer 1.4s infinite; cursor: default; }
@keyframes shimmer { to { background-position: -200% 0; } }
.state { padding: 48px 16px; text-align: center; color: var(--v3d-muted); background: rgba(0, 0, 0, .18); border-radius: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.state.err { color: #f87171; }
.empty-ico { font-size: 44px; }
.state h3 { color: var(--v3d-text); }
.link { background: none; border: 0; color: var(--v3d-accent); cursor: pointer; }
@media (max-width: 640px) { .page { margin-top: 80px; border-radius: 0; } }
</style>
