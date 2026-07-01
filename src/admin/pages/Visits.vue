<template>
  <div class="rx-visits">
    <!-- ═══════ TOP BAR ═══════ -->
    <header class="rx-topbar">
      <div class="rx-topbar__left">
        <div class="rx-topbar__icon">
          <font-awesome-icon :icon="['fas', 'chart-area']" />
        </div>
        <div>
          <h1 class="rx-topbar__title">Análisis de Visitas</h1>
          <p class="rx-topbar__sub">Monitorea el tráfico y el interés en las propiedades</p>
        </div>
      </div>
    </header>

    <!-- ═══════ KPI STRIP ═══════ -->
    <section class="rx-kpi-strip" v-if="stats && !loadingStats">
      <div class="rx-kpi" style="--kpi-hue: 230">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'eye']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.total_views || 0 }}</span>
          <span class="rx-kpi__label">Vistas Totales</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 35">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'arrow-trend-up']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.max_views || 0 }}</span>
          <span class="rx-kpi__label">Máx. en una Propiedad</span>
        </div>
      </div>
      <div class="rx-kpi" style="--kpi-hue: 155">
        <div class="rx-kpi__icon"><font-awesome-icon :icon="['fas', 'chart-line']" /></div>
        <div class="rx-kpi__body">
          <span class="rx-kpi__val">{{ stats.avg_views || 0 }}</span>
          <span class="rx-kpi__label">Promedio por Propiedad</span>
        </div>
      </div>
    </section>

    <!-- ═══════ ANALYTICS CONTENT ═══════ -->
    <section class="rx-analytics-grid">
      <!-- Top 10 Properties -->
      <div class="rx-panel">
        <div class="rx-panel__header">
          <div class="rx-panel__header-left">
            <div class="rx-panel__ico rx-panel__ico--hot"><font-awesome-icon :icon="['fas', 'fire']" /></div>
            <h3 class="rx-panel__title">Top 10 Propiedades Más Vistas</h3>
          </div>
          <span class="rx-panel__count">{{ topProperties.length }} propiedades</span>
        </div>

        <div v-if="loadingTop" class="rx-panel__loading">
          <div class="rx-spinner"></div>
          <p>Cargando datos…</p>
        </div>
        <div v-else-if="topProperties.length === 0" class="rx-panel__empty">
          <font-awesome-icon :icon="['fas', 'chart-bar']" />
          <p>No hay datos de vistas disponibles</p>
        </div>
        <div v-else class="rx-ranking">
          <div
            v-for="(prop, index) in topProperties"
            :key="prop.property_id"
            class="rx-rank-item"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div class="rx-rank-item__left">
              <span class="rx-rank-pos" :class="{ 'rx-rank-pos--top': index < 3 }">
                <template v-if="index === 0">🥇</template>
                <template v-else-if="index === 1">🥈</template>
                <template v-else-if="index === 2">🥉</template>
                <template v-else>#{{ index + 1 }}</template>
              </span>
              <div class="rx-rank-item__info">
                <span class="rx-rank-item__title">{{ truncate(prop.title, 32) }}</span>
                <span class="rx-rank-item__city">
                  <font-awesome-icon :icon="['fas', 'map-marker-alt']" />
                  {{ prop.city || 'Desconocida' }}
                </span>
              </div>
            </div>
            <div class="rx-rank-item__right">
              <div class="rx-rank-bar-wrap">
                <div class="rx-rank-bar" :style="{ width: getBarWidth(prop.view_count, topProperties[0]?.view_count) }"></div>
              </div>
              <span class="rx-rank-views">
                <font-awesome-icon :icon="['fas', 'eye']" />
                {{ prop.view_count }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Views by City -->
      <div class="rx-panel">
        <div class="rx-panel__header">
          <div class="rx-panel__header-left">
            <div class="rx-panel__ico rx-panel__ico--city"><font-awesome-icon :icon="['fas', 'city']" /></div>
            <h3 class="rx-panel__title">Tráfico por Ciudad</h3>
          </div>
          <span class="rx-panel__count">{{ cityViews.length }} ciudades</span>
        </div>

        <div v-if="loadingCity" class="rx-panel__loading">
          <div class="rx-spinner"></div>
          <p>Cargando datos…</p>
        </div>
        <div v-else-if="cityViews.length === 0" class="rx-panel__empty">
          <font-awesome-icon :icon="['fas', 'map']" />
          <p>No hay datos de ciudades disponibles</p>
        </div>
        <div v-else class="rx-ranking">
          <div
            v-for="(city, index) in cityViews"
            :key="city.city"
            class="rx-rank-item rx-rank-item--city"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div class="rx-rank-item__left">
              <span class="rx-rank-pos" :class="{ 'rx-rank-pos--top': index < 3 }">
                <template v-if="index === 0">🥇</template>
                <template v-else-if="index === 1">🥈</template>
                <template v-else-if="index === 2">🥉</template>
                <template v-else>#{{ index + 1 }}</template>
              </span>
              <span class="rx-rank-item__title">{{ city.city || 'Desconocida' }}</span>
            </div>
            <div class="rx-rank-item__right">
              <div class="rx-rank-bar-wrap">
                <div class="rx-rank-bar rx-rank-bar--city" :style="{ width: getBarWidth(city.total_views, cityViews[0]?.total_views) }"></div>
              </div>
              <span class="rx-rank-views rx-rank-views--city">
                <font-awesome-icon :icon="['fas', 'users']" />
                {{ city.total_views }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { viewService } from '@/services/viewService';
import { useNotificationStore } from '@/stores/useNotificationStore';

const notificationStore = useNotificationStore();
const stats = ref<any>(null);
const topProperties = ref<any[]>([]);
const cityViews = ref<any[]>([]);
const loadingStats = ref(true);
const loadingTop = ref(true);
const loadingCity = ref(true);

onMounted(async () => { await fetchStats(); await fetchTopProperties(); await fetchCityViews(); });

const fetchStats = async () => { loadingStats.value = true; try { stats.value = await viewService.getAdminViewStats(); } catch (e) { console.error(e); } finally { loadingStats.value = false; } };
const fetchTopProperties = async () => { loadingTop.value = true; try { topProperties.value = await viewService.getAdminTopProperties(10); } catch (e: any) { notificationStore.addNotification(e.message || 'Error', 'error'); } finally { loadingTop.value = false; } };
const fetchCityViews = async () => { loadingCity.value = true; try { cityViews.value = await viewService.getAdminViewsByCity(); } catch (e: any) { notificationStore.addNotification(e.message || 'Error', 'error'); } finally { loadingCity.value = false; } };

const truncate = (text: string, len = 30) => (!text ? '' : text.length > len ? text.substring(0, len) + '…' : text);
const getBarWidth = (value: number, max: number) => max > 0 ? Math.round((value / max) * 100) + '%' : '0%';
</script>

<style scoped>
.rx-visits {
  --surface: var(--admin-surface, #fff);
  --surface-alt: var(--admin-surface-elevated, #f8fafc);
  --txt: var(--admin-text-primary, #0f172a);
  --txt2: var(--admin-text-secondary, #475569);
  --txt3: var(--admin-text-muted, #94a3b8);
  --brd: var(--admin-border, #e2e8f0);
  --accent-color: var(--accent, #6366f1);
  --radius: 14px;
  --shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03);
  max-width: 1560px; margin: 0 auto; color: var(--txt);
  animation: rxFade .4s ease;
}
@keyframes rxFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

/* ─── TOP BAR ─── */
.rx-topbar { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; margin-bottom: .5rem; }
.rx-topbar__left { display: flex; align-items: center; gap: 1rem; }
.rx-topbar__icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #06b6d4, #0891b2); color: #fff; font-size: 1.2rem; box-shadow: 0 4px 14px rgba(6,182,212,.3); }
.rx-topbar__title { font-size: 1.5rem; font-weight: 800; letter-spacing: -.02em; margin: 0; color: var(--txt); }
.rx-topbar__sub { font-size: .875rem; color: var(--txt3); margin: .15rem 0 0; }

/* ─── KPI ─── */
.rx-kpi-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
.rx-kpi { background: var(--surface); border: 1px solid var(--brd); border-radius: var(--radius); padding: 1.15rem 1.25rem; display: flex; align-items: center; gap: 1rem; transition: all .25s; box-shadow: var(--shadow); }
.rx-kpi:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.06); }
.rx-kpi__icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: hsl(var(--kpi-hue) 80% 95%); color: hsl(var(--kpi-hue) 70% 50%); font-size: 1rem; flex-shrink: 0; }
.rx-kpi__body { display: flex; flex-direction: column; }
.rx-kpi__val { font-size: 1.4rem; font-weight: 800; letter-spacing: -.02em; color: var(--txt); }
.rx-kpi__label { font-size: .78rem; color: var(--txt3); font-weight: 500; }

/* ─── ANALYTICS GRID ─── */
.rx-analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.rx-panel { background: var(--surface); border: 1px solid var(--brd); border-radius: var(--radius); padding: 1.5rem; box-shadow: var(--shadow); display: flex; flex-direction: column; }
.rx-panel__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; padding-bottom: .75rem; border-bottom: 1px solid var(--brd); }
.rx-panel__header-left { display: flex; align-items: center; gap: .65rem; }
.rx-panel__ico { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: .85rem; }
.rx-panel__ico--hot { background: #fef2f2; color: #ef4444; }
.rx-panel__ico--city { background: #ede9fe; color: #7c3aed; }
.rx-panel__title { font-size: .95rem; font-weight: 700; margin: 0; color: var(--txt); }
.rx-panel__count { font-size: .72rem; color: var(--txt3); font-weight: 500; background: var(--surface-alt); padding: .2rem .6rem; border-radius: 6px; border: 1px solid var(--brd); }
.rx-panel__loading, .rx-panel__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; color: var(--txt3); text-align: center; flex: 1; gap: .5rem; }
.rx-panel__empty svg { font-size: 2rem; margin-bottom: .5rem; }
.rx-spinner { width: 32px; height: 32px; border: 3px solid var(--brd); border-top-color: var(--accent-color); border-radius: 50%; animation: rxSpin .7s linear infinite; }
@keyframes rxSpin { to { transform: rotate(360deg); } }

/* ─── RANKING ─── */
.rx-ranking { display: flex; flex-direction: column; gap: .5rem; max-height: 480px; overflow-y: auto; padding-right: .25rem; }
.rx-ranking::-webkit-scrollbar { width: 5px; }
.rx-ranking::-webkit-scrollbar-track { background: transparent; }
.rx-ranking::-webkit-scrollbar-thumb { background: var(--brd); border-radius: 3px; }

.rx-rank-item { display: flex; align-items: center; justify-content: space-between; padding: .85rem 1rem; border-radius: 10px; background: var(--surface-alt); border: 1px solid var(--brd); transition: all .2s; animation: rxFade .4s ease backwards; gap: .75rem; }
.rx-rank-item:hover { transform: translateX(4px); border-color: var(--accent-color); background: var(--surface); }

.rx-rank-item__left { display: flex; align-items: center; gap: .75rem; flex: 1; min-width: 0; }
.rx-rank-pos { font-size: .85rem; font-weight: 800; color: var(--txt3); min-width: 32px; text-align: center; }
.rx-rank-pos--top { font-size: 1.1rem; }
.rx-rank-item__info { display: flex; flex-direction: column; min-width: 0; }
.rx-rank-item__title { font-weight: 600; font-size: .85rem; color: var(--txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rx-rank-item__city { font-size: .72rem; color: var(--txt3); display: flex; align-items: center; gap: .25rem; margin-top: .1rem; }

.rx-rank-item__right { display: flex; align-items: center; gap: .75rem; flex-shrink: 0; }
.rx-rank-bar-wrap { width: 80px; height: 6px; background: var(--brd); border-radius: 99px; overflow: hidden; }
.rx-rank-bar { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #3b82f6, #6366f1); transition: width .6s ease; }
.rx-rank-bar--city { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }

.rx-rank-views { font-size: .78rem; font-weight: 700; color: #3b82f6; background: #eff6ff; padding: .25rem .65rem; border-radius: 7px; display: flex; align-items: center; gap: .3rem; border: 1px solid #bfdbfe; white-space: nowrap; }
.rx-rank-views--city { color: #7c3aed; background: #f5f3ff; border-color: #ddd6fe; }
/* ─── RESPONSIVE ─── */
@media (max-width: 1024px) {
  .rx-panels, .rx-analytics-grid { grid-template-columns: 1fr; }
  .rx-detail-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .rx-topbar { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .rx-topbar__left, .rx-topbar__right { width: 100%; display: flex; flex-direction: column; align-items: flex-start; }
  .rx-topbar__right .rx-btn { width: 100%; justify-content: center; margin-top: 0.5rem; }
  .rx-kpi-strip { grid-template-columns: 1fr 1fr; }
  .rx-toolbar { flex-direction: column; align-items: stretch; gap: 1rem; }
  .rx-search { width: 100%; }
  .rx-search__input { width: 100%; }
  .rx-filters { width: 100%; flex-direction: column; align-items: stretch; gap: 0.5rem; }
  .rx-select { width: 100%; }
  .rx-filters .rx-btn { width: 100%; justify-content: center; }
  .rx-form__grid { grid-template-columns: 1fr; }
  .rx-modal__footer { flex-direction: column; gap: 0.5rem; }
  .rx-modal__footer .rx-btn { width: 100%; margin: 0; }
}
@media (max-width: 480px) {
  .rx-kpi-strip { grid-template-columns: 1fr; }
  .rx-topbar__title { font-size: 1.25rem; }
  .rx-topbar__icon { width: 40px; height: 40px; font-size: 1rem; }
}
</style>
