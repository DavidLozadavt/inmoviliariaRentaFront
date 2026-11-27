import { describe, expect, it } from 'vitest'
import { buildLayout } from '@/utils/visor3d/layout'
import { unitColor } from '@/utils/visor3d/colors'
import type { BuildingConfig, Unit } from '@/types/visor3d'

// Misma regla que app/Services/Visor3d/BuildingLayout.php (BuildingConfigTest/Visor3dFlowTest en el backend)
const config: BuildingConfig = {
  floor_height: 3,
  towers: [
    { code: 'T1', floors: 4, units_per_floor: 2, layout: ['A', 'B'] },
    { code: 'T2', floors: 3, units_per_floor: 5 },
  ],
  special_floors: [{ floor: 1, kind: 'lobby' }, { tower: 'T1', floor: 5, kind: 'terrace' }, { floor: 0, kind: 'parking' }],
}

describe('buildLayout', () => {
  const l = buildLayout(config, ['A', 'B'])

  it('salta los pisos especiales y numera piso*100+posición', () => {
    const t1 = l.slots.filter((s) => s.tower === 'T1')
    expect(t1.map((s) => s.unit_code)).toEqual(['201', '202', '301', '302', '401', '402'])
    expect(l.slots.filter((s) => s.tower === 'T2')).toHaveLength(2 * 5)
  })

  it('asigna el tipo por posición y usa el primer tipo si no hay layout', () => {
    expect(l.slots.find((s) => s.tower === 'T1' && s.unit_code === '302')?.type_code).toBe('B')
    expect(l.slots.find((s) => s.tower === 'T2')?.type_code).toBe('A')
  })

  it('apoya todas las torres en el nivel más bajo (sótano) y no las superpone', () => {
    expect(l.baseLevel).toBe(0)
    const [a, b] = l.towers
    expect(a.x + a.w / 2).toBeLessThan(b.x - b.w / 2)
    expect(l.specials).toHaveLength(2 + 2 + 1) // lobby y parqueadero en dos torres + terraza
  })
})

describe('unitColor', () => {
  const base = { id: 1, tower: 'T1', floor: 2, unit_code: '201', unit_type: 'A', title: '', area_m2: 1, bedrooms: 1, bathrooms: 1, price: 1 }
  it('modo administración: sin contrato es gris y mora > 60 es rojo', () => {
    expect(unitColor({ ...base, commercial_status: 'rented', contract_id: null } as Unit, 'arrears')).toBe('#94a3b8')
    expect(unitColor({ ...base, commercial_status: 'rented', contract_id: 3, arrears_bucket: 'gt60' } as Unit, 'arrears')).toBe('#ef4444')
  })
  it('vendido cuenta como rojo en modo inmobiliaria', () => {
    expect(unitColor({ ...base, commercial_status: 'sold' } as Unit, 'commercial')).toBe('#ef4444')
  })
})

describe('pisos especiales por torre', () => {
  it('la terraza general va encima de cada torre y no quedan losas flotando', () => {
    const l = buildLayout({
      floor_height: 3,
      towers: [{ code: 'T1', floors: 2, units_per_floor: 2 }, { code: 'T2', floors: 8, units_per_floor: 2 }],
      special_floors: [{ floor: 1, kind: 'lobby' }, { floor: 9, kind: 'terrace' }],
    })
    const t1 = l.towers.find((t) => t.code === 'T1')!
    expect(t1.maxLevel).toBe(3)
    expect(l.specials.filter((s) => s.tower === 'T1').map((s) => s.floor).sort()).toEqual([1, 3])
    expect(l.towers.find((t) => t.code === 'T2')!.maxLevel).toBe(9)
  })
})
