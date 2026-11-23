<script setup lang="ts">
// Respaldo 2D (sin WebGL) y también vista de "plano del piso" en el panel.
import { computed } from 'vue'
import type { BuildingLayout, Slot } from '@/utils/visor3d/layout'
import { SPECIAL_COLORS, SPECIAL_LABELS } from '@/utils/visor3d/colors'

const props = defineProps<{
  layout: BuildingLayout
  colors: string[]
  selectedFloor: { tower: string; floor: number } | null
  selectedKey: string | null
  labels: Record<string, string>   // key → texto corto (código)
}>()
const emit = defineEmits<{ pick: [slot: Slot | null]; floor: [sel: { tower: string; floor: number }] }>()

const colorOf = computed(() => new Map(props.layout.slots.map((s, i) => [s.key, props.colors[i]])))

const towers = computed(() =>
  props.layout.towers.map((t) => {
    const levels = []
    for (let lv = t.maxLevel; lv >= t.minLevel; lv--) {
      const special = props.layout.specials.find((s) => s.tower === t.code && s.floor === lv)
      const slots = props.layout.slots.filter((s) => s.tower === t.code && s.floor === lv)
      if (special || slots.length) levels.push({ level: lv, special, slots })
    }
    return { ...t, levels }
  }),
)
</script>

<template>
  <div class="plan">
    <section v-for="t in towers" :key="t.code" class="tower">
      <h4>{{ t.name }}</h4>
      <div
        v-for="lv in t.levels"
        :key="lv.level"
        class="level"
        :class="{ active: selectedFloor?.tower === t.code && selectedFloor?.floor === lv.level }"
      >
        <button class="lv-label" type="button" :disabled="!!lv.special" @click="emit('floor', { tower: t.code, floor: lv.level })">
          {{ lv.level }}
        </button>
        <div v-if="lv.special" class="special" :style="{ background: SPECIAL_COLORS[lv.special.kind] }">
          {{ SPECIAL_LABELS[lv.special.kind] }}
        </div>
        <div v-else class="units" :style="{ gridTemplateColumns: `repeat(${t.cols}, minmax(0, 1fr))` }">
          <button
            v-for="s in lv.slots"
            :key="s.key"
            type="button"
            class="unit"
            :class="{ sel: s.key === selectedKey }"
            :style="{ background: colorOf.get(s.key) }"
            :title="labels[s.key]"
            @click="emit('pick', s)"
          >
            {{ s.unit_code }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.plan { display: flex; gap: 20px; overflow-x: auto; padding: 8px 2px; }
.tower { min-width: 180px; flex: 1; }
.tower h4 { font-size: 13px; color: var(--v3d-muted); margin-bottom: 6px; }
.level { display: flex; gap: 6px; align-items: stretch; margin-bottom: 4px; border-radius: 6px; padding: 2px; }
.level.active { outline: 2px solid var(--v3d-accent); }
.lv-label { width: 30px; border: 0; background: var(--v3d-surface-2); border-radius: 4px; font-size: 11px; color: var(--v3d-muted); cursor: pointer; }
.lv-label:disabled { cursor: default; }
.units { display: grid; gap: 3px; flex: 1; }
.unit { border: 1px solid rgba(0, 0, 0, .25); border-radius: 4px; font-size: 11px; padding: 6px 2px; cursor: pointer; color: #1c120e; font-weight: 600; }
.unit.sel { outline: 2px solid #111827; outline-offset: 1px; }
.special { flex: 1; border-radius: 4px; font-size: 11px; padding: 6px; color: #1f2937; text-align: center; }
</style>
