<template>
    <div class="property-card" :class="{ 'property-card--selected': isSelected }" :data-prop-id="property.id"
        @click="$emit('select', property)">
        <div class="property-card__image-wrap">
            <img :src="getPropertyImage(property)" :alt="property.title" loading="lazy"
                @error="handleImgError($event)" />
            <span class="property-card__status" :class="`status--${property.status}`">
                <span class="s-dot"></span>{{ statusLabel(property.status) }}
            </span>
        </div>
        <div class="property-card__body">
            <div class="property-card__main-info">
                <h3 class="property-card__title">{{ property.title }}</h3>
                <p class="property-card__location">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </svg>
                    {{ property._zone ? `Zona ${property._zone}: ` : '' }}{{ property.city || property.address }}
                </p>
            </div>
            <div class="property-card__chips">
                <span v-if="property.num_bedrooms" class="prop-chip">🛏 {{ property.num_bedrooms }}</span>
                <span v-if="property.num_bathrooms" class="prop-chip">🚿 {{ property.num_bathrooms }}</span>
                <span v-if="property.area_m2" class="prop-chip">📐 {{ property.area_m2 }}m²</span>
            </div>
            <div v-if="(property._dist !== undefined && property._dist !== null) || property._zone"
                class="property-dist-row">
                <span v-if="property._zone" class="pdist-zone" :style="`--zc:${zoneColor(property._zone)}`">
                    {{ zoneIcon(property._zone) }} {{ property._zone }}
                </span>
                <span v-if="property._dist !== undefined && property._dist !== null" class="pdist-km">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </svg>
                    {{ property._dist < 1 ? Math.round(property._dist * 1000) + ' m' : property._dist.toFixed(1) + ' km'
                    }} <span class="pdist-from">{{ distanceFrom === 'search' ? 'de la búsqueda' : 'de ti' }}</span>
                </span>
            </div>
            <div class="property-card__bottom">
                <div class="prop-price-pill">
                    <span class="ppp-amount">{{ formatPriceFull(property.monthly_price) }}</span>
                    <span class="ppp-period">mes</span>
                </div>
                <button class="detail-btn-pro" @click.stop="$emit('detail', property.id)">
                    Ver más
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MapProperty } from '@/services/propertyMapService';
import { statusLabel, zoneColor, zoneIcon, formatPriceFull } from '@/services/propertyMapService';
import { getPropertyImage as getPropertyImageUtil } from '@/utils/propertyUtils';

defineProps<{
    property: MapProperty;
    isSelected?: boolean;
    distanceFrom?: 'search' | 'user' | null;
}>();

defineEmits<{
    (e: 'select', property: MapProperty): void;
    (e: 'detail', id: number): void;
}>();

const DEFAULT_IMAGE = '/img/default.webp';

function handleImgError(e: Event) {
    (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
}

function getPropertyImage(p: MapProperty) {
    return getPropertyImageUtil(p);
}
</script>

<style scoped>
/* Las clases de la tarjeta, heredadas de MapExplorerView pero centralizadas aquí */
.property-card {
    display: flex;
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1.5px solid var(--border);
    background: #fff;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    animation: card-slide-in 0.4s ease-out both;
}

@keyframes card-slide-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.property-card:hover {
    background: #faf9f7;
    transform: translateX(-4px);
    z-index: 2;
    box-shadow: -4px 0 15px rgba(61, 35, 20, 0.05);
}

.property-card::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--brand);
    transform: scaleY(0);
    transition: transform 0.2s ease;
}

.property-card:hover::after,
.property-card--selected::after {
    transform: scaleY(1);
}

.property-card--selected {
    background: var(--brand-pale);
    border-bottom-color: var(--brand-light);
}

.property-card__image-wrap {
    width: 88px;
    min-width: 88px;
    height: 90px;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
}

.property-card__image-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.35s ease;
}

.property-card:hover .property-card__image-wrap img {
    transform: scale(1.08);
}

.property-card__status {
    position: absolute;
    top: 6px;
    left: 6px;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 3px;
    backdrop-filter: blur(6px);
    background: currentColor;
}

.s-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
}

.status--available {
    background: rgba(220, 252, 231, 0.95);
    color: var(--available);
}

.status--rented {
    background: rgba(254, 226, 226, 0.95);
    color: var(--rented);
}

.status--maintenance {
    background: rgba(254, 249, 195, 0.95);
    color: var(--maintenance);
}

.property-card__body {
    padding: 10px 12px;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.property-card__title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
}

.property-card__location {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    color: var(--text-muted);
    margin: 0;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.property-card__chips {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: 3px;
}

.prop-chip {
    font-size: 10px;
    color: var(--text-secondary);
    background: var(--surface-alt);
    padding: 2px 7px;
    border-radius: 5px;
    font-weight: 600;
    border: 1px solid var(--border);
}

.property-dist-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 5px;
    flex-wrap: wrap;
}

.pdist-zone {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 20px;
    background: color-mix(in srgb, var(--zc, #64748b) 12%, white);
    color: var(--zc, #64748b);
    border: 1px solid color-mix(in srgb, var(--zc, #64748b) 30%, white);
}

.pdist-km {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-secondary);
}

.pdist-from {
    font-size: 9px;
    font-weight: 500;
    color: var(--text-muted);
    margin-left: 1px;
}

.property-card__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 6px;
}

.prop-price-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--brand-pale);
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid rgba(196, 151, 106, 0.2);
}

.ppp-amount {
    font-size: 14px;
    font-weight: 900;
    color: var(--brand);
    letter-spacing: -0.02em;
}

.ppp-period {
    font-size: 9px;
    font-weight: 700;
    color: var(--brand-mid);
    text-transform: uppercase;
    opacity: 0.7;
}

.detail-btn-pro {
    background: var(--brand);
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 10px rgba(61, 35, 20, 0.15);
}

.detail-btn-pro:hover {
    background: var(--brand-mid);
    transform: translateY(-1.5px);
    box-shadow: 0 6px 15px rgba(61, 35, 20, 0.25);
}
</style>
