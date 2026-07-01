<template>
  <div class="full-page-wrapper">
    <NavBarComponent />

    <!-- Mobile Mobile Action Buttons -->
    <div class="mobile-map-actions" v-if="isMobile">
       <button class="m-toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed">
         <font-awesome-icon :icon="['fas', sidebarCollapsed ? 'list' : 'map']" />
         {{ sidebarCollapsed ? 'Ver Lista' : 'Ver Mapa' }}
       </button>
    </div>

    <main class="explorer-root" :class="{ 'map-dark-mode': mapStyle === 'dark' }">

      <!-- ══════════════════════════════════════
           SIDEBAR
      ══════════════════════════════════════ -->
      <aside class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">

        <!-- Header -->
        <div class="sidebar-header">
          <div class="sidebar-header__top">
            <button class="back-btn" @click="goBack" title="Volver">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div class="sidebar-header__titles">
              <h1 class="sidebar-title">Explorar Propiedades</h1>
              <span class="sidebar-count">
                <template v-if="isLoading">
                  <span class="loading-dots">Sincronizando<span>.</span><span>.</span><span>.</span></span>
                </template>
                <template v-else>
                  <span class="count-number">{{ filteredProperties.length }}</span>
                  {{ filteredProperties.length === 1 ? 'disponible' : 'disponibles' }}
                  <span v-if="hasActiveFilters" class="active-filter-dot"></span>
                </template>
              </span>
            </div>
            <button class="collapse-btn" @click="sidebarCollapsed = true" title="Cerrar panel">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Filters Panel -->
        <div class="filters-panel">
          <div class="filters-scroll-area">

            <div class="filters-section-title">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Búsqueda Geográfica
            </div>

            <!-- DIRECCIÓN / BÚSQUEDA -->
            <div class="filter-group relative" ref="searchContainerRef">
              <label class="filter-label">
                Dirección específica
                <Transition name="fade">
                  <span v-if="searchResultType" class="search-precision-badge" :class="`sbadge--${searchResultType}`">
                    {{ searchPrecisionLabel }}
                  </span>
                </Transition>
              </label>
              <div class="search-input-wrapper">
                <input v-model="filters.address" type="text" placeholder="Ej: Cartagena, Calle 10, Cl 10 #5-20..."
                  class="filter-input search-input" :class="{
                    'search-input--error': searchState === 'error',
                    'search-input--success': searchState === 'success',
                  }" @input="onAddressInput" @keyup.enter="searchAddressOnMap" @focus="onAddressFocus" />
                <button class="search-map-btn" :class="{
                  'searching': searchState === 'searching',
                  'search-map-btn--error': searchState === 'error',
                  'search-map-btn--success': searchState === 'success',
                }" @click="searchAddressOnMap">
                  <svg v-if="searchState === 'idle' || searchState === 'success'" width="15" height="15"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <svg v-else-if="searchState === 'error'" width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <div v-else class="btn-spinner"></div>
                </button>
              </div>

              <!-- Autocomplete -->
              <small style="color:#999;font-size:10px">DBG: {{ localGeoSuggestions.length }} sugs, show: {{
                showSuggestions
                }}</small>
              <div v-if="showSuggestions && (localGeoSuggestions.length > 0 || addressSuggestions.length > 0)"
                class="suggestions-dropdown">
                <!-- Local geo matches (cities/departments) -->
                <div v-if="localGeoSuggestions.length > 0" class="sug-section-label">Ciudades y Departamentos</div>
                <div v-for="(sug, idx) in localGeoSuggestions" :key="'local-' + idx"
                  class="suggestion-item suggestion-item--local" @mousedown.prevent="selectLocalGeoSuggestion(sug)">
                  <span class="sug-type-icon">{{ sug.type === 'city' ? '🏙️' : '📍' }}</span>
                  <div class="sug-body">
                    <span class="sug-main">{{ sug.name }}</span>
                    <span class="sug-sub">{{ sug.type === 'city' ? sug.department : 'Departamento' }}</span>
                  </div>
                  <span class="sug-type-badge" :class="sug.type === 'city' ? 'stb--city' : 'stb--dept'">{{ sug.type
                    === 'city'
                    ? 'Ciudad' : 'Depto' }}</span>
                </div>
                <!-- Nominatim results -->
                <div v-if="addressSuggestions.length > 0 && localGeoSuggestions.length > 0" class="sug-section-label">
                  Direcciones</div>
                <div v-for="(sug, idx) in addressSuggestions" :key="'nom-' + idx" class="suggestion-item"
                  @mousedown.prevent="selectSuggestion(sug)">
                  <span class="sug-type-icon">{{ getSuggestionIconFn(sug) }}</span>
                  <div class="sug-body">
                    <span class="sug-main">{{ sug._mainText }}</span>
                    <span class="sug-sub">{{ sug._subText }}</span>
                  </div>
                </div>
              </div>

              <!-- Error State -->
              <Transition name="fade">
                <div v-if="searchState === 'error'" class="search-error-panel">
                  <div class="sep-icon">{{ searchErrorType === 'gibberish' ? '🤔' : '🔍' }}</div>
                  <div class="sep-body">
                    <p class="sep-title">{{ searchErrorMessage }}</p>
                    <p class="sep-hint">{{ searchErrorHint }}</p>
                  </div>
                  <div class="sep-actions">
                    <button v-if="searchErrorType === 'not_found' || searchErrorType === 'gibberish'"
                      @click="locateUser" class="sep-btn sep-btn--primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" style="margin-right:6px">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Usar mi ubicación real
                    </button>
                    <button v-if="searchErrorType === 'not_found'" @click="searchBroader"
                      class="sep-btn sep-btn--ghost">Buscar
                      más amplio</button>
                    <button v-else @click="clearSearch" class="sep-btn sep-btn--ghost">Nueva búsqueda</button>
                  </div>
                </div>
              </Transition>

              <!-- Success info -->
              <Transition name="fade">
                <div v-if="searchState === 'success' && searchResultInfo" class="search-success-panel">
                  <span class="ssp-icon">{{ searchResultInfo.icon }}</span>
                  <div class="ssp-body">
                    <p class="ssp-title">{{ searchResultInfo.title }}</p>
                    <p class="ssp-sub">{{ searchResultInfo.sub }}</p>
                  </div>
                  <button class="ssp-clear" @click="clearSearch">✕</button>
                </div>
              </Transition>

              <p v-if="searchState === 'idle'" class="filter-hint">Escribe una ciudad, dirección o calle. <strong>Usa
                  mayúscula
                  inicial</strong> (Ej: Cartagena)</p>
            </div>

            <!-- DEPARTAMENTO -->
            <div class="filter-group">
              <label class="filter-label">Departamento</label>
              <div class="select-wrapper">
                <select v-model="filters.department" class="filter-select" @change="onDepartmentChange">
                  <option value="">Selecciona Departamento</option>
                  <option v-for="dep in departmentList" :key="dep" :value="dep">{{ dep }}</option>
                </select>
                <svg class="select-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <!-- CIUDAD -->
            <Transition name="filter-slide">
              <div v-if="filters.department" class="filter-group">
                <label class="filter-label">Ciudad / Municipio</label>
                <div class="select-wrapper">
                  <select v-model="filters.city" class="filter-select" @change="onCityChange">
                    <option value="">Selecciona Ciudad</option>
                    <option v-for="city in cityList" :key="city" :value="city">{{ city }}</option>
                  </select>
                  <svg class="select-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </Transition>

            <!-- BARRIO / COMUNA -->
            <Transition name="filter-slide">
              <div v-if="filters.city && neighborhoodList.length > 0" class="filter-group">
                <label class="filter-label">Barrio o Comuna</label>
                <div class="select-wrapper">
                  <select v-model="filters.neighborhood" class="filter-select" @change="onNeighborhoodChange">
                    <option value="">Todos los sectores</option>
                    <option v-for="nb in neighborhoodList" :key="nb" :value="nb">{{ nb }}</option>
                  </select>
                  <svg class="select-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </Transition>

            <!-- ZONA (Norte, Sur, etc.) -->
            <Transition name="filter-slide">
              <div v-if="filters.city" class="filter-group">
                <label class="filter-label">Zonificación — {{ filters.city || anchorCity || 'esta ubicación' }}</label>
                <div class="zone-btns">
                  <button v-for="z in zoneOptionsList" :key="z.value" class="zone-btn"
                    :class="{ 'zone-btn--active': filters.zone === z.value }" :style="`--z-color:${z.color}`"
                    @click="selectZone(z.value)">
                    <span class="zone-btn__icon">{{ z.icon }}</span>
                    <div class="zone-btn__info">
                      <span class="zone-btn__label">{{ z.label }}</span>
                      <span class="zone-btn__count" v-if="zoneStats[z.value]">{{ zoneStats[z.value] }} props</span>
                    </div>
                  </button>
                </div>

                <!-- ZONE RECOMMENDATIONS -->
                <div v-if="!filters.zone && recommendedZones.length > 0" class="zone-recommendations">
                  <p class="recommend-title">Zonas recomendadas:</p>
                  <div class="recommend-pills">
                    <button v-for="rz in recommendedZones" :key="rz.value" class="recommend-pill"
                      @click="selectZone(rz.value)">
                      <span class="rp-dot" :style="{ background: rz.color }"></span>
                      {{ rz.label }} ({{ zoneStats[rz.value] }})
                    </button>
                  </div>
                </div>

                <p v-if="filters.zone" class="zone-active-hint"
                  :style="`color:${zoneOptionsList.find(z => z.value === filters.zone)?.color}`">
                  Sector <strong>{{ filters.zone }}</strong> detectado con precisión
                </p>
              </div>
            </Transition>




            <div class="filters-section-title mt-4">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20V10M6 20V4M18 20v-4" />
              </svg>
              Preferencias
            </div>

            <!-- ESTADO -->
            <div class="filter-group">
              <label class="filter-label">Estado de la propiedad</label>
              <div class="status-pills">
                <button v-for="s in statusOptionsList" :key="s.value" class="status-pill"
                  :class="{ 'status-pill--active': filters.status === s.value, [`status-pill--${s.value}`]: true }"
                  @click="toggleStatus(s.value)">
                  <span class="pill-dot"></span>{{ s.label }}
                </button>
              </div>
            </div>

            <!-- PRECIO -->
            <div class="filter-group">
              <label class="filter-label">Precio Mensual (COP)</label>
              <div class="price-range-row">
                <div class="price-input-wrap">
                  <span class="price-sign">$</span>
                  <input v-model.number="filters.min_price" type="number" placeholder="Mínimo" class="filter-input"
                    min="0" @input="debouncedApplyFilters" />
                </div>
                <div class="price-separator">—</div>
                <div class="price-input-wrap">
                  <span class="price-sign">$</span>
                  <input v-model.number="filters.max_price" type="number" placeholder="Máximo" class="filter-input"
                    min="0" @input="debouncedApplyFilters" />
                </div>
              </div>

              <!-- PANEL DE PROXIMIDAD (Radar al final) -->
              <div class="prox-panel-container">
                <div class="filters-section-title mt-4">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                  Radar de Proximidad
                </div>

                <div class="prox-panel">
                  <div class="prox-header">
                    <div class="prox-sonar">
                      <div class="ps-ring ps-ring--1"></div>
                      <div class="ps-ring ps-ring--2"></div>
                      <div class="ps-ring ps-ring--3"></div>
                      <div class="ps-sweep"></div>
                      <div class="ps-dot"></div>
                    </div>
                    <div class="prox-header__text">
                      <p class="prox-header__pill">
                        <span class="php-dot"></span>
                        {{ proximityHeaderLabel }}
                      </p>
                      <div class="prox-header__city-row">
                        <p class="prox-header__city">
                          {{ anchorCity || filters.city || "Zona actual" }}
                          <span v-if="proximityBuckets.total > 0" class="phc-badge">{{ proximityBuckets.total }}</span>
                        </p>
                        <!-- DEPARTMENT SKETCH (Visual Context) -->
                        <div v-if="currentDepartment" class="dept-sketch" :title="currentDepartment">
                          <svg viewBox="0 0 100 130" class="ds-svg">
                            <!-- Simplified Colombia Outline -->
                            <path
                              d="M45 5 L65 15 L85 10 L95 30 L80 60 L70 90 L80 110 L60 125 L40 120 L20 100 L10 70 L5 40 L25 15 Z"
                              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
                            <!-- Scanning Pulse (Dynamic highlight) -->
                            <circle cx="50" cy="65" r="5" fill="#C4976A">
                              <animate attributeName="r" from="2" to="15" dur="2s" repeatCount="indefinite" />
                              <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="50" cy="65" r="3" fill="#C4976A" />
                          </svg>
                          <span class="ds-label">{{ currentDepartment }}</span>
                        </div>
                      </div>
                      <p v-if="proximityHeaderSub && proximityBuckets.total > 0" class="prox-header__sub">
                        {{ proximityHeaderSub }}
                      </p>
                    </div>
                    <button class="prox-close" @click="clearSearch">✕</button>
                  </div>

                  <div v-if="proximityBuckets.total === 0" class="prox-void">
                    <div class="pv-orb">
                      <div class="pv-orb__ring pv-orb__ring--1"></div>
                      <div class="pv-orb__ring pv-orb__ring--2"></div>
                      <div class="pv-orb__core">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.7)"
                          stroke-width="1.5">
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          <path d="M9 22V12h6v10" />
                        </svg>
                      </div>
                    </div>
                    <p class="pv-title">{{ proximityNoResultsTitle }}</p>
                    <p class="pv-sub">{{ proximityNoResultsSub }}</p>
                    <button v-if="!userLatLng && !searchAnchorLatLng" class="pv-btn pv-btn--gps" @click="locateUser">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="2" x2="12" y2="5" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="5" y2="12" />
                        <line x1="19" y1="12" x2="22" y2="12" />
                      </svg>
                      Usar mi ubicación
                    </button>
                    <button v-else class="pv-btn" @click="clearSearch">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                      Explorar otras ciudades
                    </button>
                  </div>

                  <div v-else class="prox-body">
                    <!-- Radar concéntrico -->
                    <div class="prox-concentric">
                      <div class="pc-sweep-pro"></div>
                      <div class="pc-ring pc-ring--4">
                        <div class="pc-ring pc-ring--3">
                          <div class="pc-ring pc-ring--2">
                            <div class="pc-ring pc-ring--1">
                              <div class="pc-pin">
                                <div class="pc-pin__dot"></div>
                                <div class="pc-pin__pulse"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-for="(p, i) in propertiesInAnchorCity.slice(0, 20)" :key="p.id" class="pc-prop-dot"
                        :class="[`pc-prop-dot--${p._dist < 0.3 ? 'ultra' : p._dist < 1 ? 'near' : p._dist < 3 ? 'medium' : 'far'}`, { 'pc-prop-dot--selected': selectedPropertyId === p.id }]"
                        :style="getPropDotStyleFn(p._dist, i, Math.min(propertiesInAnchorCity.length, 20))"
                        @click="selectProperty(p)">
                        <div class="pc-prop-dot__tooltip">
                          <span class="pt-price">{{ formatPriceShortFn(p.monthly_price) }}</span>
                          <span class="pt-title">{{ p.title }}</span>
                        </div>
                      </div>
                      <span class="pc-scale pc-scale--1">300m</span>
                      <span class="pc-scale pc-scale--2">1km</span>
                      <span class="pc-scale pc-scale--3">3km</span>
                    </div>

                    <!-- Tiers -->
                    <div class="prox-tiers">
                      <div v-for="tier in proximityTiers" :key="tier.key" class="prox-tier" :class="{
                        'prox-tier--active': tier.count > 0,
                        'prox-tier--zero': tier.count === 0,
                        'prox-tier--selected': selectedTierKey === tier.key
                      }" @click="tier.count > 0 && toggleTier(tier.key)">
                        <div class="pt-left">
                          <div class="pt-dot" :style="`background:${tier.color};box-shadow:0 0 7px ${tier.color}88`">
                          </div>
                          <div class="pt-info">
                            <span class="pt-range">{{ tier.label }}</span>
                            <span class="pt-desc">{{ tier.desc }}</span>
                          </div>
                        </div>
                        <div class="pt-right">
                          <div class="pt-bar-wrap">
                            <div class="pt-bar-fill"
                              :style="`width:${tier.count > 0 ? Math.min(Math.max(tier.count / Math.max(proximityBuckets.total, 1) * 260, 10), 100) : 0}%;background:${tier.color}`">
                            </div>
                          </div>
                          <span class="pt-count" :style="tier.count > 0 ? `color:${tier.color}` : ''">{{ tier.count
                            }}</span>
                          <svg v-if="tier.count > 0" class="pt-chevron"
                            :class="{ 'pt-chevron--open': selectedTierKey === tier.key }" :style="`color:${tier.color}`"
                            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <!-- Lista reactiva -->
                    <Transition name="prox-list-slide">
                      <div class="prox-nearby-list" :key="selectedTierKey || 'default'">
                        <div class="pnl-header">
                          <span class="pnl-title" :style="selectedTierKey ? `color:${activeTierColor}` : ''">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            </svg>
                            {{ selectedTierKey ? activeTierLabel : 'Más cercanas a ti' }}
                          </span>
                          <div class="pnl-header-right">
                            <span class="pnl-count">{{ visibleProxList.length }} propiedad{{ visibleProxList.length !==
                              1
                              ? 'es' :
                              '' }}</span>
                            <button v-if="selectedTierKey" class="pnl-clear-tier"
                              @click.stop="selectedTierKey = null">✕</button>
                          </div>
                        </div>

                        <div v-for="(p, i) in visibleProxList" :key="p.id" class="pnl-card"
                          :class="{ 'pnl-card--first': i === 0 && !selectedTierKey, 'pnl-card--tier': !!selectedTierKey }"
                          :style="selectedTierKey ? `--tier-color:${activeTierColor}` : ''" @click="selectProperty(p)">
                          <div class="pnl-rank" :class="!selectedTierKey && i === 0 ? '' : 'pnl-rank--num'">
                            {{ !selectedTierKey && i === 0 ? '🏆' : `#${i + 1}` }}
                          </div>
                          <div class="pnl-img-wrap">
                            <img :src="getPropertyImage(p)" class="pnl-img" @error="handleImgError" />
                            <span class="pnl-status-dot" :class="`psd--${p.status}`"></span>
                          </div>
                          <div class="pnl-info">
                            <div class="pnl-top-row">
                              <p class="pnl-name">{{ p.title }}</p>
                              <span class="pnl-dist-short">{{ p._dist < 1 ? Math.round(p._dist * 1000) + 'm' :
                                p._dist.toFixed(1) + 'km' }}</span>
                            </div>
                            <div class="pnl-meta">
                              <span class="pnl-zone" :style="`--zc:${zoneColorFn(getPointZone(p.lat, p.lng, p.city))}`">
                                {{ p.city }} • {{ getPointZone(p.lat, p.lng, p.city) || 'Zona Centro' }}
                              </span>
                              <span class="pnl-price">{{ formatPriceShortFn(p.monthly_price) }}</span>
                            </div>
                          </div>
                        </div>

                        <button class="pnl-explore-btn" :style="selectedTierKey ? `--btn-color:${activeTierColor}` : ''"
                          @click="flyToTierOrAll">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4l3 3" />
                          </svg>
                          {{ selectedTierKey ? `Ver ${visibleProxList.length} en el mapa` : 'Explorar todas en el mapa'
                          }}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Locate nearby button -->
          <div class="locate-nearby-section">
            <button class="locate-nearby-btn" :class="{ 'locate-nearby-btn--active': isLocating }" @click="locateUser">
              <div class="lnb-icon-wrap">
                <svg v-if="!isLocating" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                </svg>
                <div v-else class="lnb-spinner"></div>
              </div>
              <div class="lnb-text">
                <span class="lnb-title">{{ isLocating ? 'Ubicando…' : '📍 Ubicar propiedades cercanas' }}</span>
                <span class="lnb-sub">{{ userLatLng ? '✓ Ubicación activa' : 'Accede a tu GPS para ver las más cercanas'
                  }}</span>
              </div>
            </button>
          </div>

          <!-- Active filters footer -->
          <div v-if="hasActiveFilters" class="active-filters-footer">
            <button class="clear-all-btn" @click="clearFilters">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Restablecer filtros
            </button>
          </div>
        </div>

      </aside>

      <!-- ══════════════════════════════════════
           MAP AREA
      ══════════════════════════════════════ -->
      <div class="map-area">

        <!-- Open sidebar btn -->
        <Transition name="fade">
          <button v-if="sidebarCollapsed" class="sidebar-open-btn" @click="sidebarCollapsed = false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
            Panel
          </button>
        </Transition>

        <!-- COMPASS UI -->
        <div class="map-compass" @click="resetMapNorth" title="Orientar al Norte">
          <div class="compass-inner" :style="{ transform: `rotate(${mapRotation}deg)` }">
            <svg width="40" height="40" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="rgba(61, 35, 20, 0.1)" stroke="var(--brand)" stroke-width="2" />
              <path d="M50 10 L60 50 L50 90 L40 50 Z" fill="var(--gold)" />
              <path d="M50 10 L60 50 L50 50 L40 50 Z" fill="#f43f5e" />
              <text x="50" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="900"
                style="text-shadow: 0 1px 2px black;">N</text>
            </svg>
          </div>
        </div>

        <!-- STREET VIEW PIP (Mini Window) -->
        <Transition name="fade-slide-up">
          <div v-if="showStreetViewPip && pipLocation" class="street-view-pip">
            <div class="pip-header">
              <span>Vista 360 • Mini</span>
              <button @click="showStreetViewPip = false" class="pip-close">✕</button>
            </div>
            <div class="pip-body">
              <iframe width="100%" height="100%" frameborder="0" style="border:0"
                :src="`https://www.google.com/maps?q=${pipLocation.lat},${pipLocation.lng}&layer=c&cbll=${pipLocation.lat},${pipLocation.lng}&cbp=11,0,0,0,0&output=svembed`"
                allow="accelerometer; gyroscope; magnetometer" allowfullscreen>
              </iframe>
            </div>
            <button class="pip-expand" @click="expandStreetView">Expandir</button>
          </div>
        </Transition>

        <!-- MAP ACTIONS CONSOLIDATED (Right Side FAB) -->
        <div class="map-fab-container" :class="{ 'fab--open': isMapActionsOpen }">
          <TransitionGroup name="fab-menu">
            <div v-if="isMapActionsOpen" class="fab-menu" key="menu">
              <!-- Geolocation -->
              <button class="fab-item" @click="locateUser" :class="{ 'fab-item--active': isLocating }"
                title="Mi Ubicación" :style="{ transitionDelay: '0ms' }">
                <div class="fab-icon">
                  <svg v-if="!isLocating" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke-linecap="round" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  <div v-else class="brand-spinner small"></div>
                </div>
                <span class="fab-label">GPS</span>
              </button>

              <!-- Draw Mode -->
              <button class="fab-item" @click="toggleDrawMode" :class="{ 'fab-item--active': isDrawMode }"
                :style="{ transitionDelay: '60ms' }">
                <div class="fab-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.5 1.5" />
                  </svg>
                </div>
                <span class="fab-label">ÁREA</span>
              </button>

              <!-- Heatmap -->
              <button class="fab-item" @click="toggleHeatmapMode" :class="{ 'fab-item--active': isHeatmapMode }"
                :style="{ transitionDelay: '120ms' }">
                <div class="fab-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 2v20M2 12h20M7 7l10 10M17 7L7 10" stroke-linecap="round" />
                  </svg>
                </div>
                <span class="fab-label">TERMAL</span>
              </button>

              <!-- Map Styles (Capas) -->
              <div class="map-style-dropdown-container" :style="{ transitionDelay: '180ms' }">
                <button class="fab-item" @click="showMapStyleDropdown = !showMapStyleDropdown">
                  <div class="fab-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span class="fab-label">CAPAS</span>
                </button>
                <Transition name="fade-slide-up">
                  <div v-if="showMapStyleDropdown" class="fab-expand-menu">
                    <button class="fab-style-opt" :class="{ 'fso-active': mapStyle === 'voyager' }"
                      @click="setMapStyle('voyager')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <circle cx="12" cy="12" r="5" />
                        <path
                          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                      </svg>
                      Claro
                    </button>
                    <button class="fab-style-opt" :class="{ 'fso-active': mapStyle === 'dark' }"
                      @click="setMapStyle('dark')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      Noche
                    </button>
                    <button class="fab-style-opt" :class="{ 'fso-active': mapStyle === 'satellite' }"
                      @click="setMapStyle('satellite')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      Satélite
                    </button>
                  </div>
                </Transition>
              </div>
            </div>
          </TransitionGroup>

          <button class="map-fab-trigger" @click="isMapActionsOpen = !isMapActionsOpen"
            :class="{ 'trigger--active': isMapActionsOpen }">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path v-if="!isMapActionsOpen" d="M12 5v14M5 12h14" />
              <path v-else d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Stats bar -->
        <div class="map-stats-bar" v-if="!isLoading">
          <div class="stat-item">
            <span class="stat-num">{{ allProperties.length }}</span>
            <span class="stat-lbl">total</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num available-num">{{ countByStatus('available') }}</span>
            <span class="stat-lbl">disponibles</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num rented-num">{{ countByStatus('rented') }}</span>
            <span class="stat-lbl">arrendadas</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num visible-num">{{ visibleCount }}</span>
            <span class="stat-lbl">en vista</span>
          </div>
        </div>

        <!-- Draw mode overlay -->
        <Transition name="fade-slide">
          <div v-if="isDrawMode" class="draw-mode-overlay">
            <div class="dmo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              </svg>
            </div>
            <div class="dmo-content">
              <h4>Buscador de Área Inteligente</h4>
              <p v-if="!drawnPolygon">Dibuja una zona en el mapa para descubrir las propiedades en ese sector exacto.
              </p>
              <p v-else><b>¡Trazo completado!</b> Hemos filtrado los resultados dentro del área seleccionada.</p>
            </div>
            <div class="dmo-actions">
              <button v-if="drawnPolygon" class="dmo-btn dmo-btn--reset" @click="clearDrawLayer">Reiniciar</button>
              <button class="dmo-btn" @click="toggleDrawMode">Confirmar</button>
            </div>
          </div>
        </Transition>

        <!-- Street View Preparation Overlay -->
        <Transition name="fade-slide">
          <div v-if="isStreetViewPreloading" class="draw-mode-overlay svm-alert-overlay">
            <div class="dmo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 6v6l4 2" />
                <path d="M16.24 7.76a6 6 0 1 0 0 8.48" />
              </svg>
            </div>
            <div class="dmo-content">
              <h4>Preparando Vista 360</h4>
              <p>Estamos conectando con el entorno. <b>Usa el mouse</b> para recorrer la zona cuando se abra.</p>
            </div>
            <div class="dmo-actions">
              <button class="dmo-btn" @click="startStreetView">Entendido</button>
            </div>
          </div>
        </Transition>

        <!-- Street View Picking Mode Overlay -->
        <Transition name="fade-slide">
          <div v-if="isStreetViewPicking" class="draw-mode-overlay street-picker-overlay">
            <div class="dmo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
              </svg>
            </div>
            <div class="dmo-content">
              <h4>Explorador de Entorno 360</h4>
              <p>Haz clic en cualquier punto del mapa para ver una previsualización de la fachada o el barrio.</p>
            </div>
            <div class="dmo-actions">
              <button class="dmo-btn" @click="toggleStreetViewPicking">Cancelar</button>
            </div>
          </div>
        </Transition>

        <!-- Street View Modal Overlay -->
        <Transition name="fade-backdrop">
          <div v-if="isStreetViewVisible" class="street-view-modal" @click.self="isStreetViewVisible = false">
            <div class="svm-container">
              <div class="svm-header">
                <h3>Vistas 360 • Fachada y Entorno</h3>
                <button class="svm-close" @click="isStreetViewVisible = false">✕</button>
              </div>
              <div class="svm-body">
                <iframe v-if="streetViewCoords" width="100%" height="100%" frameborder="0" style="border:0"
                  :src="`https://www.google.com/maps?q=${streetViewCoords.lat},${streetViewCoords.lng}&layer=c&cbll=${streetViewCoords.lat},${streetViewCoords.lng}&cbp=11,0,0,0,0&output=svembed`"
                  allow="accelerometer; gyroscope; magnetometer" allowfullscreen>
                </iframe>
              </div>
              <div class="svm-footer">
                <p>Usa el mouse para navegar por el vecindario del inmueble</p>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Heatmap mode overlay -->
        <Transition name="fade-slide">
          <div v-if="isHeatmapMode" class="draw-mode-overlay heatmap-mode-overlay">
            <div class="dmo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0c0-5-5-10-5-10z"></path>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            <div class="dmo-content">
              <h4>Análisis Térmico de Mercado</h4>
              <p>Visualizando la densidad de precios en tiempo real. Las zonas <b>doradas y rojas</b> representan mayor
                valorización y exclusividad.</p>
            </div>
            <div class="dmo-actions">
              <button class="dmo-btn" @click="toggleHeatmapMode">Desactivar</button>
            </div>
          </div>
        </Transition>

        <div ref="mapEl" class="map-canvas" :class="{ 'map-satellite-mode': mapStyle === 'satellite' }"></div>

        <!-- Loading overlay -->
        <Transition name="fade">
          <div v-if="isLoading" class="map-loading">
            <div class="brand-spinner large">
              <div class="spinner-ring"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#4D2F24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
            </div>
            <span>Cargando mapa de propiedades…</span>
          </div>
        </Transition>

        <!-- Geo accuracy indicator -->
        <Transition name="fade">
          <div v-if="geoAccuracy !== null" class="geo-accuracy-badge" :class="geoAccuracyClass">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            Precisión: ±{{ Math.round(geoAccuracy) }}m
          </div>
        </Transition>

        <!-- Property List Panel (right side) -->
        <div class="property-list-panel">
          <div class="property-list-panel__header">
            <div class="plp-header-left">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <path d="M9 22V12h6v10" />
              </svg>
              <h2 class="plp-title">Propiedades</h2>
            </div>
            <template v-if="!isLoading">
              <div class="plp-header-right">
                <span class="plp-count">{{ allProperties.length }}</span>
              </div>
            </template>
            <div class="skeleton-pill" v-else></div>
          </div>

          <div class="property-list-panel__body">
            <!-- Loading State: Skeleton Loaders -->
            <div v-if="isLoading" class="property-cards property-cards--skeletons">
              <div v-for="i in 5" :key="i" class="card-skeleton">
                <div class="skel-img"></div>
                <div class="skel-content">
                  <div class="skel-line skel-title"></div>
                  <div class="skel-line skel-text"></div>
                  <div class="skel-footer">
                    <div class="skel-pill"></div>
                    <div class="skel-btn"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="allProperties.length === 0" class="list-state list-state--empty">
              <div class="empty-icon">🏠</div>
              <p>No hay propiedades<br>disponibles aquí</p>
              <button class="clear-filters-btn" @click="clearFilters">Explorar todo</button>
            </div>

            <!-- Real Cards -->
            <div v-else class="property-cards">
              <MapPropertyCard v-for="property in allProperties" :key="property.id" :property="property"
                :is-selected="selectedPropertyId === property.id"
                :distance-from="searchAnchorLatLng && !userLatLng ? 'search' : 'user'" @select="selectProperty"
                @detail="goToDetail" />
            </div>
          </div>
        </div>

        <!-- Property Preview Card -->
        <Transition name="slide-up">
          <div v-if="selectedProperty" class="preview-card">
            <button class="preview-card__close" @click="closePreview">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div class="preview-card__inner">
              <div class="preview-card__img-section">
                <img :src="getPropertyImage(selectedProperty)" :alt="selectedProperty.title"
                  @error="handleImgError($event)" />
                <div class="preview-card__img-overlay"></div>
                <div class="preview-card__top-badges">
                  <span class="preview-card__status-badge" :class="`status--${selectedProperty.status}`">
                    <span class="s-dot"></span>{{ statusLabelFn(selectedProperty.status) }}
                  </span>
                  <button class="preview-card__360-btn" @click.stop="handleStreetViewOpen">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.5">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="M12 6v6l4 2" />
                      <path d="M16.24 7.76a6 6 0 1 0 0 8.48" />
                    </svg>
                    <span>360</span>
                    <span class="btn-hint">Ver fachada</span>
                  </button>
                </div>
              </div>
              <div class="preview-card__content">
                <div class="preview-card__header">
                  <h3 class="preview-card__title">{{ selectedProperty.title }}</h3>
                  <p class="preview-card__location">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </svg>
                    {{ getPointZone(selectedProperty.lat, selectedProperty.lng, selectedProperty.city) ? `Zona
                    ${getPointZone(selectedProperty.lat, selectedProperty.lng, selectedProperty.city)} • ` : '' }}
                    {{ selectedProperty.city || selectedProperty.address }}
                  </p>
                </div>
                <div class="preview-card__features">
                  <div v-if="selectedProperty.num_bedrooms" class="p-feat">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 9V5a2 2 0 012-2h14a2 2 0 012 2v4M3 9h18M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9" />
                    </svg>
                    <span>{{ selectedProperty.num_bedrooms }}</span>
                  </div>
                  <div v-if="selectedProperty.num_bathrooms" class="p-feat">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 12h16a1 1 0 011 1v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-3a1 1 0 011-1z" />
                      <path d="M6 12V5a2 2 0 012-2h3v2.25" />
                    </svg>
                    <span>{{ selectedProperty.num_bathrooms }}</span>
                  </div>
                  <div v-if="selectedProperty.area_m2" class="p-feat">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                    </svg>
                    <span>{{ selectedProperty.area_m2 }}m²</span>
                  </div>
                </div>
                <div class="preview-card__footer">
                  <div class="preview-price">
                    <span class="p-val">{{ formatPriceFullFn(selectedProperty.monthly_price) }}</span>
                    <span class="p-period">/mes</span>
                  </div>
                  <button class="preview-cta" @click="goToDetail(selectedProperty.id)">
                    Explorar
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      stroke-width="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </main>
    <FooterComponent />
  </div>
</template>
<script setup lang="ts">
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { onMounted, onUnmounted, ref, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMapFilters } from './composables/useMapFilters';
import NavBarComponent from '../../components/NavBarComponent.vue';
import FooterComponent from '../../components/FooterComponent.vue';
import MapPropertyCard from './components/MapPropertyCard.vue';
import {
  propertyMapService,
  fetchAutocompleteSuggestions,
  clusterProperties,
  formatPriceShort,
  formatPriceFull,
  statusLabel,
  normalize,
  getDistance,
  getZoneByCoords,
  geocodeAddress,
  getDepartmentByCity,
  zoneColor,
  buildSectorPoints,
  classifyQuery,
  getSuggestionIcon,
  parseSuggestion,
  getPropDotStyle,
  getCityZoneConfig,
  CITY_CENTERS,
  COLOMBIA_GEO,
  ZONE_COLORS,
  ZONE_OPTIONS,
  ZONE_SECTOR_ANGLES,
  STATUS_OPTIONS,
  TIER_META,
  COLOMBIA_CENTER,
  DEFAULT_ZOOM,
  reverseGeocode,
  type MapProperty,
  type SearchResultInfo,
  type SearchState,
  type SearchResultType,
  type SearchErrorType,
} from '../../services/propertyMapService';
import { getPropertyImage as getPropertyImageUtil } from '../../utils/propertyUtils';
import { eventBus, EVENTS } from '@/events/eventBus';

// ─────────────────────────────────────────────
// COMPONENT CONSTANTS & UTILS
// ─────────────────────────────────────────────
const formatPriceShortFn = formatPriceShort;
const formatPriceFullFn = formatPriceFull;
const statusLabelFn = statusLabel;
const zoneColorFn = zoneColor;
const getSuggestionIconFn = getSuggestionIcon;
const getPropDotStyleFn = getPropDotStyle;

// Listas de opciones del servicio
const zoneOptionsList = ZONE_OPTIONS;
const statusOptionsList = STATUS_OPTIONS;

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const DEFAULT_IMAGE = '/img/default.webp';
const DEBOUNCE_DELAY = 400;

// ─────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────
const router = useRouter();
const route = useRoute();

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const isMobile = ref(window.innerWidth <= 768);
const updateMobile = () => { isMobile.value = window.innerWidth <= 768; };
onMounted(() => {
  window.addEventListener('resize', updateMobile);
});
onUnmounted(() => window.removeEventListener('resize', updateMobile));

const mapEl = ref<HTMLElement | null>(null);
const isLoading = ref(true);
// ─────────────────────────────────────────────
// STATE - REVISIONS & FILTERS
// ─────────────────────────────────────────────
const sidebarCollapsed = ref(window.innerWidth <= 768);
const allProperties = ref<MapProperty[]>([]);
const selectedPropertyId = ref<number | null>(null);
const visibleCount = ref(0);
const isLocating = ref(false);
const geoAccuracy = ref<number | null>(null);
const userLocationMarker = ref<L.Marker | L.CircleMarker | null>(null);
const userAccuracyCircle = ref<L.Circle | null>(null);
const isSyncingFilters = ref(false); // To prevent recursion during sync
const userLatLng = ref<L.LatLng | null>(null);
const userCity = ref<string>('');
const anchorCity = ref<string>('');
const searchAnchorLatLng = ref<{ lat: number; lng: number } | null>(null);
const addressSuggestions = ref<any[]>([]);
const localGeoSuggestions = ref<any[]>([]); // Initialize localGeoSuggestions as ref
const showSuggestions = ref(false);
const searchState = ref<SearchState>('idle');
const searchResultType = ref<SearchResultType>(null);
const searchErrorType = ref<SearchErrorType>(null);
const searchResultInfo = ref<SearchResultInfo | null>(null);
const selectedTierKey = ref<string | null>(null);
const mapStyle = ref<'voyager' | 'satellite' | 'dark'>('satellite');
const showMapStyleDropdown = ref(false);
const isStreetViewVisible = ref(false);
const isStreetViewPreloading = ref(false);
const isMapActionsOpen = ref(false);
const isStreetViewPicking = ref(false);
const showStreetViewPip = ref(false);
const pipLocation = ref<{ lat: number; lng: number } | null>(null);
const mapRotation = ref(0);
const isScanning = ref(false);
let suggestionTimer: any = null;

const {
  filters,
  departmentList,
  cityList,
  neighborhoodList,
  hasActiveFilters,
  clearFilters: clearFiltersState
} = useMapFilters();


// ─────────────────────────────────────────────
// LEAFLET
// ─────────────────────────────────────────────
let map: L.Map | null = null;
let currentTileLayer: L.TileLayer | null = null;
let labelsTileLayer: L.TileLayer | null = null;
let markersLayerGroup: L.LayerGroup | null = null;
let geoBoundariesLayerGroup: L.LayerGroup | null = null;
let zoneOverlayLayer: L.LayerGroup | null = null;
let searchOverlayLayer: L.LayerGroup | null = null;
let proximityOverlayLayer: L.LayerGroup | null = null;
const activeMarkers = new Map<string, L.Marker | L.CircleMarker>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let proximityFaderTimer: ReturnType<typeof setTimeout> | null = null;
let zoneCircle: L.Circle | null = null;
let zoneLabel: L.Marker | null = null;
let activeLocateWatchId: number | null = null;

// Draw mode state
const isDrawMode = ref(false);
const isDrawing = ref(false);
const drawnPolygon = ref<L.LatLng[] | null>(null);
let drawnPolygonLayer: L.Polygon | null = null;
let currentPolyline: L.Polyline | null = null;

// Heatmap state
const isHeatmapMode = ref(false);
let heatLayer: any = null;

// ─────────────────────────────────────────────
// COMPUTED
// ─────────────────────────────────────────────
// Pre-computed filter tokens — recalculated only when filter values change
const _filterTokens = computed(() => {
  const nb = normalize(filters.value.neighborhood);
  const city = normalize(filters.value.city);
  const dept = filters.value.department;
  const deptCities = dept
    ? Object.keys(COLOMBIA_GEO[dept] || {}).map(c => normalize(c))
    : [];
  const zoneCenter = (filters.value.zone && filters.value.city)
    ? getCityCenter(filters.value.city)
    : null;
  return { nb, city, dept, deptCities, zoneCenter };
});

const filteredProperties = computed<MapProperty[]>(() => {
  const { nb, city, dept, deptCities, zoneCenter } = _filterTokens.value;
  const { zone, status, min_price, max_price } = filters.value;

  const filteredArray = allProperties.value.filter(p => {
    // Use pre-normalized fields set by the service (_normalizedCity, _normalizedAddress)
    const pCity = p._normalizedCity ?? normalize(p.city || '');
    const pAddr = p._normalizedAddress ?? normalize(p.address || '');

    if (nb) {
      if (!pAddr.includes(nb) && !pCity.includes(nb)) return false;
    } else if (city) {
      if (!pCity.includes(city) && !pAddr.includes(city)) return false;
    } else if (dept && deptCities.length) {
      if (!deptCities.some(dc => pCity.includes(dc))) return false;
    }

    if (zone && zoneCenter) {
      if (getZoneByCoords(p.lat, p.lng, zoneCenter.lat, zoneCenter.lng, filters.value.city) !== zone) return false;
    }

    if (drawnPolygon.value && drawnPolygon.value.length > 2) {
      if (!isInsidePolygon({ lat: p.lat, lng: p.lng }, drawnPolygon.value)) return false;
    }

    if (status && p.status !== status) return false;
    // @ts-ignore
    if (min_price !== undefined && min_price !== null && String(min_price) !== '' && p.monthly_price < Number(min_price)) return false;
    // @ts-ignore
    if (max_price !== undefined && max_price !== null && String(max_price) !== '' && p.monthly_price > Number(max_price)) return false;
    return true;
  });

  // Sort primarily by distance if there's a reference point (search or user location)
  const anchor = searchAnchorLatLng.value || userLatLng.value;
  if (anchor) {
    const safeAnchor = anchor; // for TS
    const getDist = (p: MapProperty): number => {
      // Calculate inline if not in _anchorDistances yet (though it should be eventually)
      const cached = _anchorDistances.value?.get(p.id);
      return cached !== undefined ? cached : getDistance(safeAnchor.lat, safeAnchor.lng, p.lat, p.lng);
    };

    filteredArray.sort((a, b) => getDist(a) - getDist(b));
  }

  return filteredArray;
});

// A broader filter for the map markers so they don't disappear when panning to other cities
const mapFilteredProperties = computed<MapProperty[]>(() => {
  const { status, min_price, max_price } = filters.value;

  return allProperties.value.filter(p => {
    if (status && p.status !== status) return false;
    // @ts-ignore
    if (min_price !== undefined && min_price !== null && String(min_price) !== '' && p.monthly_price < Number(min_price)) return false;
    // @ts-ignore
    if (max_price !== undefined && max_price !== null && String(max_price) !== '' && p.monthly_price > Number(max_price)) return false;

    if (drawnPolygon.value && drawnPolygon.value.length > 2) {
      if (!isInsidePolygon({ lat: p.lat, lng: p.lng }, drawnPolygon.value)) return false;
    }
    return true;
  });
});


// Single source of truth for distances — shared by propertiesWithDistance, nearestProperty,
// propertiesInAnchorCity and proximityBuckets to avoid calling getDistance() multiple times.
const _anchorDistances = computed<Map<number, number>>(() => {
  // Priority: If user has a GPS fix, that is the primary reference for "Nearby" experience
  // especially for sorting the list.
  const anchor = userLatLng.value || searchAnchorLatLng.value;
  const result = new Map<number, number>();
  if (!anchor) return result;
  for (const p of allProperties.value) {
    result.set(p.id, getDistance(anchor.lat, anchor.lng, p.lat, p.lng));
  }
  return result;
});

const propertiesWithDistance = computed(() => {
  const dists = _anchorDistances.value;
  const hasAnchor = dists.size > 0;
  return filteredProperties.value.map(p => ({
    ...p,
    // _zone already pre-computed by the service; fallback to runtime for edge cases
    _zone: p._zone ?? getPointZone(p.lat, p.lng, p.city),
    _dist: hasAnchor ? (dists.get(p.id) ?? null) : null,
  })).sort((a, b) => (a._dist !== null && b._dist !== null) ? a._dist - b._dist : 0);
});


const selectedProperty = computed<MapProperty | null>(() =>
  selectedPropertyId.value ? allProperties.value.find(p => p.id === selectedPropertyId.value) || null : null
);

const streetViewCoords = computed(() => {
  if (pipLocation.value) return pipLocation.value;
  if (selectedProperty.value) return { lat: selectedProperty.value.lat, lng: selectedProperty.value.lng };
  return null;
});

const searchPrecisionLabel = computed(() => {
  switch (searchResultType.value) {
    case 'exact': return '📍 Dirección exacta';
    case 'street': return '🛣️ Calle / vía';
    case 'area': return '📌 Zona aproximada';
    default: return '';
  }
});

const searchErrorMessage = computed(() => {
  switch (searchErrorType.value) {
    case 'not_found': return 'No encontramos propiedades aquí';
    case 'gibberish': return 'Dirección no reconocida';
    case 'too_vague': return 'Búsqueda muy general';
    case 'network': return 'Sin conexión al servidor';
    default: return 'Error al buscar';
  }
});

const searchErrorHint = computed(() => {
  switch (searchErrorType.value) {
    case 'not_found': return 'No encontramos ninguna propiedad en esta dirección exacta, pero puedes explorar lo más cercano usando tu GPS.';
    case 'gibberish': return 'Sé más específico con tu dirección para ayudarte a encontrar el hogar ideal. Intenta agregar la ciudad.';
    case 'too_vague': return 'Selecciona primero un departamento y ciudad. Usa mayúscula inicial para ciudades y departamentos.';
    case 'network': return 'Verifica tu conexión e inténtalo de nuevo.';
    default: return 'Verifica la dirección e inténtalo de nuevo. Las ciudades y departamentos deben escribirse con su letra inicial en mayúscula.';
  }
});

const geoAccuracyClass = computed(() => {
  if (geoAccuracy.value === null) return '';
  if (geoAccuracy.value <= 10) return 'geo-accuracy--excellent';
  if (geoAccuracy.value <= 30) return 'geo-accuracy--good';
  if (geoAccuracy.value <= 80) return 'geo-accuracy--fair';
  return 'geo-accuracy--poor';
});


const cityCenters = computed(() => {
  const centers: Record<string, { lat: number; lng: number; count: number }> = {};
  allProperties.value.forEach(p => {
    const city = p.city || 'Unknown';
    if (!centers[city]) centers[city] = { lat: 0, lng: 0, count: 0 };
    centers[city].lat += p.lat;
    centers[city].lng += p.lng;
    centers[city].count++;
  });
  Object.keys(centers).forEach(city => {
    centers[city].lat /= centers[city].count;
    centers[city].lng /= centers[city].count;
  });
  return centers;
});

/**
 * PROXIMITY RADAR LOGIC
 * Calculates which properties are closest to the 'anchor' (GPS or Search results).
 * Categorizes results into tiers (300m, 1km, 3km, etc).
 */
const propertiesInAnchorCity = computed(() => {
  const anchor = searchAnchorLatLng.value || userLatLng.value;
  if (!anchor) return [];
  const dists = _anchorDistances.value;

  // RADAR LOGIC:
  // 1. If we have active geographic filters (City/Dept), we should show ALL matches first.
  // 2. If we are in "Discovery" mode (no geo filters, just GPS or a point), we show the Top 20 nearest.
  const { city, department, status, min_price, max_price } = filters.value;
  const hasGeoFilter = !!(city || department);

  // Use the pre-filtered array if geo filters are active
  if (hasGeoFilter) {
    return filteredProperties.value
      .map(p => ({
        ...p,
        _dist: dists.get(p.id) ?? getDistance(anchor.lat, anchor.lng, p.lat, p.lng)
      }));
  }

  // Fallback to Discovery mode (Top 20 closest)
  const discoverySource = allProperties.value.filter(p => {
    if (status && p.status !== status) return false;
    // @ts-ignore
    if (min_price && p.monthly_price < Number(min_price)) return false;
    // @ts-ignore
    if (max_price && p.monthly_price > Number(max_price)) return false;

    if (drawnPolygon.value && drawnPolygon.value.length > 2) {
      if (!isInsidePolygon({ lat: p.lat, lng: p.lng }, drawnPolygon.value)) return false;
    }
    return true;
  });

  return discoverySource
    .map(p => ({
      ...p,
      _dist: dists.get(p.id) ?? getDistance(anchor.lat, anchor.lng, p.lat, p.lng)
    }))
    .sort((a, b) => a._dist - b._dist)
    .slice(0, 20); // Discovery Top 20
});

// Final list source — prioritized for the right-side panel
const propertiesForList = computed(() => {
  const hasAnchor = !!(searchAnchorLatLng.value || userLatLng.value);
  if (hasAnchor) {
    return propertiesInAnchorCity.value;
  }
  return propertiesWithDistance.value;
});

const proximityBuckets = computed(() => {
  const props = propertiesInAnchorCity.value;
  return {
    ultra: props.filter(p => p._dist < 0.3),
    near: props.filter(p => p._dist >= 0.3 && p._dist < 1),
    medium: props.filter(p => p._dist >= 1 && p._dist < 3),
    far: props.filter(p => p._dist >= 3),
    total: props.length,
    closest: props[0] ?? null,
  };
});

const proximityLabel = computed(() => {
  const anchor = searchAnchorLatLng.value || userLatLng.value;
  if (!anchor) return 'default';
  return searchAnchorLatLng.value && !userLatLng.value ? 'búsqueda' : 'ubicación';
});

const proximityHeaderLabel = computed(() => {
  if (proximityLabel.value === 'ubicación') return 'Cerca de ti';
  if (proximityLabel.value === 'búsqueda') return 'Desde la búsqueda';
  return 'Explorar zona';
});

const proximityHeaderSub = computed(() => {
  const closest = proximityBuckets.value.closest;
  if (!closest) return '';
  const dist = closest._dist;
  const distStr = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  return `Tu próximo hogar está muy cerca: a solo ${distStr}`;
});

const proximityNoResultsTitle = computed(() => {
  if (!userLatLng.value && !searchAnchorLatLng.value) return 'Descubre lo cercano';
  if (filters.value.neighborhood) return `No hay resultados en ${filters.value.neighborhood}`;
  if (filters.value.city) return `Explora más allá de ${filters.value.city}`;
  return 'Sin propiedades aquí';
});

const proximityNoResultsSub = computed(() => {
  if (!userLatLng.value && !searchAnchorLatLng.value) {
    return 'Activa tu GPS o busca una dirección para ver qué hay cerca.';
  }
  const city = filters.value.city || anchorCity.value;
  const sector = filters.value.neighborhood;
  
  if (sector && city) {
    return `Actualmente no tenemos propiedades disponibles específicamente en el sector de ${sector}. ¿Qué tal si exploramos zonas aledañas en ${city}?`;
  }
  if (city) {
    return `No encontramos propiedades con tus filtros actuales en ${city}. Intenta ampliar tu rango de precio o cambiar el tipo de propiedad.`;
  }
  return 'No hay propiedades que coincidan con tus filtros en esta zona específica.';
});

const currentDepartment = computed(() => filters.value.department || '');

const proximityTiers = computed(() => [
  { key: 'ultra', label: '< 300 m', desc: 'A pasos', color: '#D4A853', count: proximityBuckets.value.ultra.length },
  { key: 'near', label: '300m – 1km', desc: 'Muy cerca', color: '#A67C52', count: proximityBuckets.value.near.length },
  { key: 'medium', label: '1 – 3 km', desc: 'Zona cercana', color: '#8B5A42', count: proximityBuckets.value.medium.length },
  { key: 'far', label: '> 3 km', desc: 'Misma ciudad', color: '#4D2F24', count: proximityBuckets.value.far.length },
]);

const activeTierColor = computed(() =>
  selectedTierKey.value ? TIER_META[selectedTierKey.value as keyof typeof TIER_META].color : '#6366f1'
);

const zoneStats = computed(() => {
  const city = filters.value.city || anchorCity.value;
  if (!city) return {} as Record<string, number>;
  const stats: Record<string, number> = {};
  allProperties.value.forEach(p => {
    const pCity = (p.city || '').toLowerCase();
    const cName = city.toLowerCase();
    if (pCity.includes(cName) || cName.includes(pCity)) {
      const z = getPointZone(p.lat, p.lng, city);
      if (z) stats[z] = (stats[z] || 0) + 1;
    }
  });
  return stats;
});

const recommendedZones = computed(() => {
  if (!filters.value.city) return [];
  return zoneOptionsList
    .filter((z: { value: string }) => (zoneStats.value[z.value] || 0) > 0)
    .sort((a: { value: string }, b: { value: string }) => (zoneStats.value[b.value] || 0) - (zoneStats.value[a.value] || 0));
});
const activeTierLabel = computed(() =>
  proximityTiers.value.find(t => t.key === selectedTierKey.value)?.label ?? ''
);

const visibleProxList = computed(() => {
  if (selectedTierKey.value) return (proximityBuckets.value as any)[selectedTierKey.value] as any[];
  return propertiesInAnchorCity.value.slice(0, 20); // Top 20 as requested
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getPropertyImage(property: MapProperty): string {
  return getPropertyImageUtil(property, DEFAULT_IMAGE);
}
function handleImgError(e: Event) {
  (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
}
// Count by status in a single pass — uses the active list context for consistency

function getCityCenter(city: string): { lat: number; lng: number } | null {
  if (CITY_CENTERS[city]) return CITY_CENTERS[city];
  const cc = cityCenters.value[city];
  if (cc && cc.count > 0) return cc;
  return null;
}
function getPointZone(lat: number, lng: number, city?: string): string {
  if (!city) return '';
  const center = getCityCenter(city);
  if (!center) return '';
  return getZoneByCoords(lat, lng, center.lat, center.lng, city);
}

// ─────────────────────────────────────────────
// TIER ACTIONS
// ─────────────────────────────────────────────
function toggleTier(key: string) {
  selectedTierKey.value = selectedTierKey.value === key ? null : key;
}

function flyToTierOrAll() {
  if (!map) return;
  const anchor = searchAnchorLatLng.value || userLatLng.value;
  const props = visibleProxList.value;
  if (!props.length && !anchor) return;
  const allPts = [...(anchor ? [anchor] : []), ...props.map(p => ({ lat: p.lat, lng: p.lng }))];
  const lats = allPts.map(p => p.lat);
  const lngs = allPts.map(p => p.lng);
  const bounds = L.latLngBounds(
    [Math.min(...lats) - 0.003, Math.min(...lngs) - 0.003],
    [Math.max(...lats) + 0.003, Math.max(...lngs) + 0.003]
  );
  map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 16, duration: 1.3 });
}

// ─────────────────────────────────────────────
// ZONE OVERLAY
// ─────────────────────────────────────────────
function clearZoneOverlay() {
  if (zoneCircle && map) { map.removeLayer(zoneCircle as any); zoneCircle = null; }
  if (zoneLabel && map) { map.removeLayer(zoneLabel); zoneLabel = null; }
  if (zoneOverlayLayer && map) { map.removeLayer(zoneOverlayLayer); zoneOverlayLayer = null; }
}

function showZoneOverlay(zone: string, cityName: string) {
  if (!map) return;
  clearZoneOverlay();
  const center = getCityCenter(cityName);
  if (!center) return;
  const cfg = getCityZoneConfig(cityName);
  const col = ZONE_COLORS[zone];
  if (!col) return;
  const color = col.stroke;
  const angles = ZONE_SECTOR_ANGLES[zone] ?? { start: 0, end: 360 };
  const isFullC = zone === 'Centro';

  zoneOverlayLayer = L.layerGroup().addTo(map);
  const sectorPts = buildSectorPoints(center.lat, center.lng, angles.start, angles.end, cfg.radiusM);
  const sectorPoly = L.polygon(sectorPts as any, { color, fillColor: color, fillOpacity: 0, weight: 0 }).addTo(zoneOverlayLayer);
  const arcPts = isFullC ? sectorPts : sectorPts.slice(1, -1);
  const arcLine = L.polyline(arcPts as any, { color, weight: 2.5, dashArray: '10 6', opacity: 0 }).addTo(zoneOverlayLayer);

  if (!isFullC) {
    const toEdge = (bearing: number): [number, number] => {
      const rad = (bearing * Math.PI) / 180;
      const lat1 = (center.lat * Math.PI) / 180;
      const lon1 = (center.lng * Math.PI) / 180;
      const d = cfg.radiusM / 6371000;
      const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(rad));
      const lon2 = lon1 + Math.atan2(Math.sin(rad) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
      return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
    };
    L.polyline([[center.lat, center.lng], toEdge(angles.start)] as any, { color, weight: 1.5, dashArray: '4 7', opacity: 0.45 }).addTo(zoneOverlayLayer);
    L.polyline([[center.lat, center.lng], toEdge(angles.end)] as any, { color, weight: 1.5, dashArray: '4 7', opacity: 0.45 }).addTo(zoneOverlayLayer);
  }

  const off = cfg.offset;
  const zOffMap: Record<string, { lat: number; lng: number }> = {
    'Norte': { lat: off * 0.55, lng: 0 },
    'Sur': { lat: -off * 0.55, lng: 0 },
    'Centro': { lat: 0, lng: 0 },
    'Este': { lat: 0, lng: off * 0.55 },
    'Oeste': { lat: 0, lng: -off * 0.55 },
  };
  const zOff = zOffMap[zone] ?? { lat: 0, lng: 0 };
  const zIcon = { Norte: '↑', Sur: '↓', Centro: '⊙', Este: '→', Oeste: '←' }[zone] ?? '';
  const labelIcon = L.divIcon({
    className: '',
    html: `<div class="zone-overlay-label" style="--zone-color:${color}">
             <span class="zone-overlay-icon">${zIcon}</span>
             <div class="zone-overlay-text">
               <span class="zone-overlay-name">${col.label}</span>
               <span class="zone-overlay-city">${cityName}</span>
             </div>
           </div>`,
    iconSize: [170, 52], iconAnchor: [85, 26],
  });
  zoneLabel = L.marker([center.lat + zOff.lat, center.lng + zOff.lng], { icon: labelIcon, interactive: false, zIndexOffset: -100 }).addTo(zoneOverlayLayer as any);

  let fillOp = 0, lineOp = 0;
  const fadeIn = setInterval(() => {
    fillOp = Math.min(fillOp + 0.008, 0.13);
    lineOp = Math.min(lineOp + 0.04, 0.80);
    sectorPoly.setStyle({ fillOpacity: fillOp });
    arcLine.setStyle({ opacity: lineOp });
    if (fillOp >= 0.13 && lineOp >= 0.80) clearInterval(fadeIn);
  }, 20);

  let pulseDir = -1, pulseOp = 0.13;
  const pulse = setInterval(() => {
    if (!zoneOverlayLayer) { clearInterval(pulse); return; }
    pulseOp += pulseDir * 0.003;
    if (pulseOp <= 0.06) pulseDir = 1;
    if (pulseOp >= 0.14) pulseDir = -1;
    sectorPoly.setStyle({ fillOpacity: pulseOp });
  }, 60);
  setTimeout(() => { clearInterval(pulse); if (zoneOverlayLayer) sectorPoly.setStyle({ fillOpacity: 0.10 }); }, 12000);
}

function flyToZone(zone: string, cityName: string) {
  if (!map || !zone || !cityName) return;
  const center = getCityCenter(cityName);
  if (!center) return;
  const cfg = getCityZoneConfig(cityName);
  const off = cfg.offset;
  const zoneOffsetMap: Record<string, { lat: number; lng: number }> = {
    'Norte': { lat: off, lng: 0 },
    'Sur': { lat: -off, lng: 0 },
    'Centro': { lat: 0, lng: 0 },
    'Este': { lat: 0, lng: off },
    'Oeste': { lat: 0, lng: -off },
  };
  const zOff = zoneOffsetMap[zone] ?? { lat: 0, lng: 0 };
  const baseZoom = CITY_CENTERS[cityName]?.zoom ?? 13;
  const zoneZoom = zone === 'Centro' ? Math.min(baseZoom + 1, 15) : baseZoom;
  map.flyTo([center.lat + zOff.lat, center.lng + zOff.lng], zoneZoom, { duration: 1.4 });
  setTimeout(() => showZoneOverlay(zone, cityName), 450);
}

// ── Geo Helpers ──


// ─────────────────────────────────────────────
// GEOLOCATION
// ─────────────────────────────────────────────
async function reverseGeocodeUser(lat: number, lng: number) {
  try {
    const data = await reverseGeocode(lat, lng);
    if (data?.city) {
      userCity.value = data.city;
      anchorCity.value = data.city;
    }
  } catch (e) { console.error('Reverse geocoding error:', e); }
}

async function syncFiltersFromAddress(lat: number, lng: number, nominatimResult?: any, forceUpdate = false, keepSelection = false) {
  try {
    isSyncingFilters.value = true;
    let data = nominatimResult;
    // Robust Photon Feature detection
    if (data && data.properties) {
      data = {
        city: data.properties.city || data.properties.town || data.properties.village || data.properties.county || '',
        department: data.properties.state || '',
        neighborhood: data.properties.district || data.properties.street || ''
      };
    }

    // Attempt to fill missing info if data is weak or absent
    if (!data || (!data.city && !data.department)) {
      data = await reverseGeocode(lat, lng);
    }
    if (!data) return;

    const city = data.city || '';
    let dept = data.department || '';

    // AUTHORITY OVERRIDE: Prioritize our local GEO data over external geocoders
    // This is the "Nuclear Option" to fix Cali -> Cauca once and for all.
    const localDept = city ? getDepartmentByCity(city) : '';
    if (localDept) {
      dept = localDept;
    }

    // Update Dept with strict exact match priority
    if (dept && (forceUpdate || !filters.value.department)) {
      const matchedDep = departmentList.value.find(d => normalize(d) === normalize(dept));
      if (matchedDep) {
        filters.value.department = matchedDep;
      } else {
        const fuzzyDep = departmentList.value.find(d => normalize(dept).includes(normalize(d)));
        if (fuzzyDep) filters.value.department = fuzzyDep;
      }
    }

    if (city && (forceUpdate || !filters.value.city)) {
      // If we matched a department, ensure city also matches strictly within that department
      const currentDept = filters.value.department;
      if (!currentDept) {
        const localDeptMatch = getDepartmentByCity(city);
        if (localDeptMatch) filters.value.department = localDeptMatch;
      }

      const cities = filters.value.department ? Object.keys(COLOMBIA_GEO[filters.value.department] || {}) : [];
      const matched = cities.find(c => normalize(c) === normalize(city) || normalize(city).includes(normalize(c)));

      if (matched) {
        filters.value.city = matched;
        anchorCity.value = matched; // Force anchor early
        filters.value.neighborhood = '';
        filters.value.zone = '';
      } else if (forceUpdate) {
        // Force cleanup if geocoder city doesn't match local database
        filters.value.city = '';
        filters.value.neighborhood = '';
        filters.value.zone = '';
      }

      // NEIGHBORHOOD DETECTION: Try to match the neighborhood from geocoder
      const neighborhood = data.neighborhood || '';
      if (neighborhood && filters.value.city) {
        const neighborhoods = COLOMBIA_GEO[filters.value.department]?.[filters.value.city] || [];
        const nbMatch = neighborhoods.find(n => normalize(n) === normalize(neighborhood) || normalize(neighborhood).includes(normalize(n)));
        if (nbMatch) filters.value.neighborhood = nbMatch;
      }
    } else if (forceUpdate) {
      filters.value.neighborhood = '';
      filters.value.zone = '';
    }
    if (city) anchorCity.value = city;
    applyFilters(keepSelection);
  } catch (e) {
    console.error('Sync filters error:', e);
  } finally {
    // Reset flag after a tick to allow watchers to settle
    nextTick(() => isSyncingFilters.value = false);
  }
}

function locateUser() {
  if (!navigator.geolocation) { alert('Tu navegador no soporta geolocalización.'); return; }
  if (!map) return;

  // -- UI STATE --
  isLocating.value = true;
  isScanning.value = true;
  geoAccuracy.value = null;

  if (activeLocateWatchId !== null) { navigator.geolocation.clearWatch(activeLocateWatchId); activeLocateWatchId = null; }

  let hasLockedInitial = false;
  let stabilityCount = 0;
  let sampleCount = 0;
  let bestAccuracy = Infinity;
  let bestPoint: { lat: number; lng: number } | null = null;
  const startTime = Date.now();

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 30000,      // Increased timeout for slower devices/cold starts
    maximumAge: 0      // Force fresh data to bypass stale cache on some browsers
  };

  // Helper to create a premium marker
  function _createProUserMarker(lat: number, lng: number, accuracy: number) {
    if (!map) return;
    if (userLocationMarker.value) map.removeLayer(userLocationMarker.value as unknown as L.Layer);
    if (userAccuracyCircle.value) map.removeLayer(userAccuracyCircle.value as unknown as L.Layer);

    const cappedAccuracy = Math.min(accuracy, 800);

    userAccuracyCircle.value = L.circle([lat, lng], {
      radius: cappedAccuracy, color: '#D4A853', fillColor: '#D4A853',
      fillOpacity: 0.15, weight: 1.5, dashArray: '4,4', opacity: 0.6,
    }).addTo(map);

    const userIcon = L.divIcon({
      className: '',
      html: `<div class="user-location-marker pro-marker ${isScanning.value ? 'marker-scanning' : ''}">
                 <div class="ulm-radar-scan"></div>
                 <div class="ulm-core">
                   <div class="ulm-core__glow"></div>
                   <div class="ulm-core__inner"></div>
                 </div>
               </div>`,
      iconSize: [40, 40], iconAnchor: [20, 20],
    });
    userLocationMarker.value = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
  }

  const finalize = (finalPoint: { lat: number; lng: number } | null) => {
    if (activeLocateWatchId !== null) { navigator.geolocation.clearWatch(activeLocateWatchId); activeLocateWatchId = null; }
    isLocating.value = false;
    isScanning.value = false;

    if (userLocationMarker.value) {
      const el = (userLocationMarker.value as L.Marker).getElement();
      if (el) {
        const markerDiv = el.querySelector('.pro-marker');
        if (markerDiv) markerDiv.classList.remove('marker-scanning');
      }
    }

    if (finalPoint) {
      reverseGeocodeUser(finalPoint.lat, finalPoint.lng);
      syncFiltersFromAddress(finalPoint.lat, finalPoint.lng, null, true);
      // Ensure anchor city is set after sync to trigger radar correctly
      setTimeout(() => {
        if (!anchorCity.value && filters.value.city) anchorCity.value = filters.value.city;
      }, 500);
    }
    setTimeout(() => { if (!isLocating.value) geoAccuracy.value = null; }, 8000);
  };

  const updateUI = (pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    sampleCount++;

    // Filter out obviously trash hits if we already have something better
    if (sampleCount > 1 && accuracy > bestAccuracy * 2 && accuracy > 1000) return;

    const isQualityHigh = accuracy < 20;
    const isQualityDecent = accuracy < 100;

    geoAccuracy.value = accuracy;
    userLatLng.value = L.latLng(lat, lng);

    if (userLocationMarker.value && (userLocationMarker.value as L.Marker).setLatLng) {
      (userLocationMarker.value as L.Marker).setLatLng([lat, lng]);
      if (userAccuracyCircle.value) userAccuracyCircle.value.setLatLng([lat, lng]).setRadius(accuracy);
    } else {
      _createProUserMarker(lat, lng, accuracy);
    }

    const elapsed = Date.now() - startTime;

    if (!hasLockedInitial) {
      // Fast first jump
      let targetZoom = 17;
      if (accuracy > 500) targetZoom = 14;
      else if (accuracy > 150) targetZoom = 16;

      map?.flyTo([lat, lng], targetZoom, { duration: 1.2 });
      hasLockedInitial = true;
      bestPoint = { lat, lng };
      bestAccuracy = accuracy;

      if (isQualityDecent) syncFiltersFromAddress(lat, lng, null, false);
    } else {
      const diff = Math.abs(bestAccuracy - accuracy);
      // Multi-stage refinement
      if (accuracy < bestAccuracy || diff > 40) {
        const moveDuration = elapsed < 3000 ? 0.6 : 1.2;
        if (isQualityHigh && map?.getZoom()! < 18) {
          map?.flyTo([lat, lng], 18, { duration: moveDuration });
        } else if (isQualityDecent && map?.getZoom()! < 17) {
          map?.flyTo([lat, lng], 17, { duration: moveDuration });
        } else {
          map?.panTo([lat, lng], { animate: true, duration: 0.8 });
        }
        bestPoint = { lat, lng };
        bestAccuracy = Math.min(bestAccuracy, accuracy);

        // INSTANT RADAR UPDATE: Update anchor and filters immediately during refinement
        // so the user doesn't wait 20s to see the radar filling up.
        if (isQualityDecent || elapsed > 3000) {
          searchAnchorLatLng.value = L.latLng(lat, lng);
          // Force filter update so sidebar matches new location
          syncFiltersFromAddress(lat, lng, null, true);
        }
      }
    }

    // Stability logic: For devices without GPS, we wait for the browser signal to "settle"
    if (accuracy < bestAccuracy + 5) stabilityCount++;
    else stabilityCount = 0;

    // Terminate early only if we hit gold standard, otherwise wait for refinement
    if (accuracy < 12 || (stabilityCount >= 5 && isQualityDecent) || elapsed > 18000) {
      finalize(bestPoint || { lat, lng });
    }
  };

  const handleError = (err: GeolocationPositionError) => {
    console.warn('Geolocation Refinement Info:', err.code, err.message);
    // If we have a decent point already, don't show error, just finalize
    if (bestPoint) {
      finalize(bestPoint);
    } else {
      isLocating.value = false;
      isScanning.value = false;
      // Precision fallback for desktop: Use search address if GPS fails entirely
      if (filters.value.address && !hasLockedInitial) {
        searchAddressOnMap();
      } else {
        alert(`No pudimos obtener tu ubicación exacta. Asegúrate de dar permisos de GPS en tu navegador.`);
      }
    }
  };

  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización.');
    isLocating.value = false;
    isScanning.value = false;
    return;
  }

  // Kickoff refinement loop
  activeLocateWatchId = navigator.geolocation.watchPosition(updateUI, handleError, options);

  // Hard safety limit increased to 22s to allow slower Wi-Fi triangulation to settle
  setTimeout(() => { if (isLocating.value) finalize(bestPoint); }, 22000);
}

// ─────────────────────────────────────────────
// MAP OVERLAYS & ANNOTATIONS
// ─────────────────────────────────────────────
/**
 * Draws a high-precision pin for an exact address match.
 */
function drawExactPin(lat: number, lng: number, label: string) {
  clearSearchOverlay();
  if (!map) return;
  searchOverlayLayer = L.layerGroup().addTo(map);
  L.circle([lat, lng], { radius: 70, color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.10, weight: 0 }).addTo(searchOverlayLayer);
  L.circle([lat, lng], { radius: 70, color: '#7c3aed', fillColor: 'transparent', fillOpacity: 0, weight: 2, dashArray: '6 4', opacity: 0.75 }).addTo(searchOverlayLayer);
  const short = label.length > 22 ? label.slice(0, 22) + '…' : label;
  const pinIcon = L.divIcon({
    className: '',
    html: `<div class="srch-pin srch-pin--exact">
             <div class="srch-pin__pulse"></div>
             <div class="srch-pin__head"><svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>
             <div class="srch-pin__tip"></div>
             <div class="srch-pin__label">${short}</div>
           </div>`,
    iconSize: [30, 46], iconAnchor: [15, 46],
  });
  L.marker([lat, lng], { icon: pinIcon, zIndexOffset: -40 }).addTo(searchOverlayLayer);
}

function drawStreetOverlay(result: any, mode: 'street' | 'area' = 'street') {
  clearSearchOverlay();
  if (!map) return;
  searchOverlayLayer = L.layerGroup().addTo(map);

  let lat: number, lng: number, bb: any[] | undefined, name: string;
  if (result.geometry && result.geometry.coordinates) {
    lng = parseFloat(result.geometry.coordinates[0]);
    lat = parseFloat(result.geometry.coordinates[1]);
    const ext = result.properties?.extent;
    if (ext) { bb = [ext[1], ext[3], ext[0], ext[2]]; } // [s, n, w, e]
    name = result.properties?.name || result.properties?.city || result._mainText || 'Zona';
  } else {
    lat = parseFloat(result.lat);
    lng = parseFloat(result.lon);
    bb = result.boundingbox;
    name = (result._mainText || result.display_name || '').split(',')[0].trim();
  }

  if (bb && mode === 'street') {
    const s = parseFloat(bb[0]), n = parseFloat(bb[1]);
    const w = parseFloat(bb[2]), e = parseFloat(bb[3]);
    const dLat = Math.abs(n - s), dLng = Math.abs(e - w);
    if (dLat > 0.0003 || dLng > 0.0003) {
      const isHoriz = dLng > dLat;
      const midLat = (s + n) / 2, midLng = (w + e) / 2;
      const ptA: [number, number] = isHoriz ? [midLat, w] : [s, midLng];
      const ptB: [number, number] = isHoriz ? [midLat, e] : [n, midLng];
      L.polyline([ptA, ptB], { color: '#f59e0b', weight: 18, opacity: 0.08, lineCap: 'round' }).addTo(searchOverlayLayer);
      L.polyline([ptA, ptB], { color: '#f59e0b', weight: 4.5, opacity: 0.9, lineCap: 'round' }).addTo(searchOverlayLayer);
      [ptA, ptB].forEach(pt => L.circleMarker(pt, { radius: 6, color: 'white', fillColor: '#f59e0b', fillOpacity: 1, weight: 2.5 }).addTo(searchOverlayLayer!));
      const lbl = L.divIcon({ className: '', html: `<div class="srch-street-label"><span class="ssl-icon">🛣️</span><span class="ssl-name">${name}</span></div>`, iconSize: [180, 28], iconAnchor: [90, 14] });
      L.marker([midLat, midLng], { icon: lbl, interactive: false, zIndexOffset: -50 }).addTo(searchOverlayLayer);
      return;
    }
  }

  const color = mode === 'street' ? '#f59e0b' : '#10b981';
  // Dynamic radius based on bounds if area, else fallback
  let radius = mode === 'area' ? 250 : 120;
  if (mode === 'area' && bb) {
    const s = parseFloat(bb[0]), n = parseFloat(bb[1]);
    radius = Math.max(250, Math.abs(n - s) * 111000 * 0.4); // approx 40% of height in meters
  }

  L.circle([lat, lng], { radius, color, fillColor: color, fillOpacity: 0.10, weight: 2, dashArray: '8 5' }).addTo(searchOverlayLayer);
  const lbl = L.divIcon({ className: '', html: `<div class="srch-area-label" style="--ac:${color}"><span>${name}</span></div>`, iconSize: [160, 26], iconAnchor: [80, 13] });
  L.marker([lat, lng], { icon: lbl, interactive: false, zIndexOffset: -50 }).addTo(searchOverlayLayer);
}


// ─────────────────────────────────────────────
// ADDRESS SEARCH
// ─────────────────────────────────────────────
function clearSearchOverlay() {
  if (searchOverlayLayer && map) { map.removeLayer(searchOverlayLayer); searchOverlayLayer = null; }
}

function clearSearch() {
  filters.value.address = '';
  filters.value.city = '';
  filters.value.department = '';
  filters.value.neighborhood = '';
  filters.value.zone = '';
  searchState.value = 'idle';
  searchResultType.value = null;
  searchResultInfo.value = null;
  searchErrorType.value = null;
  searchAnchorLatLng.value = null;
  anchorCity.value = '';
  selectedTierKey.value = null;
  clearSearchOverlay();
  clearProximityOverlay();
}

function onAddressInput() {
  showSuggestions.value = true;

  // Clear sub-context (neighborhood) when typing a new address to avoid stickiness
  // if the user is typing, he probably wants a different specific place.
  if (filters.value.neighborhood) {
    filters.value.neighborhood = '';
  }

  debouncedApplyFilters();
  autoAssociateFilters();
  if (searchState.value === 'error' || searchState.value === 'success') {
    searchState.value = 'idle'; searchResultType.value = null; searchResultInfo.value = null; searchErrorType.value = null; clearSearchOverlay();
  }
  if (suggestionTimer) clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(fetchSuggestions, 300);
}

// ── Click-outside to close suggestions ──
const searchContainerRef = ref<HTMLElement | null>(null);

function onAddressFocus() {
  showSuggestions.value = true;
}

function _handleGlobalClick(e: MouseEvent) {
  if (searchContainerRef.value && !searchContainerRef.value.contains(e.target as Node)) {
    showSuggestions.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', _handleGlobalClick);
});
onUnmounted(() => {
  document.removeEventListener('mousedown', _handleGlobalClick);
});

// Cached normalized geo tokens — built once, reused on every keystroke
const _normalizedDepts = computed(() => departmentList.value.map(d => ({ raw: d, norm: normalize(d) })));
const _normalizedCitiesForDept = computed(() => {
  const dept = filters.value.department;
  if (!dept) return [] as { raw: string; norm: string }[];
  return Object.keys(COLOMBIA_GEO[dept] || {}).map(c => ({ raw: c, norm: normalize(c) }));
});

function autoAssociateFilters() {
  const text = normalize(filters.value.address);
  if (text.length < 3) return;
  for (const { raw, norm } of _normalizedDepts.value) {
    if (text.includes(norm) && filters.value.department !== raw) filters.value.department = raw;
  }
  if (filters.value.department) {
    for (const { raw, norm } of _normalizedCitiesForDept.value) {
      if (text.includes(norm) && filters.value.city !== raw) filters.value.city = raw;
    }
  }
  const zoneKw: Record<string, string> = { norte: 'Norte', sur: 'Sur', centro: 'Centro', este: 'Este', oriente: 'Este', oeste: 'Oeste', occidente: 'Oeste' };
  for (const [kw, zone] of Object.entries(zoneKw)) {
    if (text.includes(kw)) { filters.value.zone = zone; break; }
  }
  if (filters.value.city) {
    for (const nb of neighborhoodList.value) {
      if (text.includes(normalize(nb)) && filters.value.neighborhood !== nb) filters.value.neighborhood = nb;
    }
  }
}

async function fetchSuggestions() {
  const q = filters.value.address?.trim();
  if (!q || q.length < 2) {
    addressSuggestions.value = [];
    localGeoSuggestions.value = [];
    return;
  }

  // 1. Local search (Cities & Depts)
  const qNorm = normalize(q);
  const localRes: { name: string; type: 'city' | 'department'; department: string }[] = [];
  for (const dept of departmentList.value) {
    if (normalize(dept).includes(qNorm)) localRes.push({ name: dept, type: 'department', department: dept });
    const cities = Object.keys(COLOMBIA_GEO[dept] || {});
    for (const city of cities) {
      if (normalize(city).includes(qNorm)) localRes.push({ name: city, type: 'city', department: dept });
    }
  }
  localGeoSuggestions.value = localRes.slice(0, 6);

  // 2. Optimized search (Google Places + Nominatim via Service)
  if (q.length >= 3) {
    try {
      const results = await fetchAutocompleteSuggestions(q, {
        neighborhood: filters.value.neighborhood,
        city: filters.value.city,
        department: filters.value.department
      });
      // Convert GeocodeSuggestion to the format expected by the template
      addressSuggestions.value = results.map(s => ({
        ...s,
        _mainText: s.mainText,
        _subText: s.subText
      }));
    } catch (e) {
      console.warn('Error fetching address suggestions:', e);
      addressSuggestions.value = [];
    }
  } else {
    addressSuggestions.value = [];
  }
  showSuggestions.value = true;
}

// ── Local autocomplete for cities/departments (computed for guaranteed reactivity) ──
// const localGeoSuggestions = computed(() => { // This was a computed, now it's a ref and updated in fetchSuggestions
//   const q = filters.value.address?.trim();
//   if (!q || q.length < 2) return [];
//   const qNorm = normalize(q);
//   const results: { name: string; type: 'city' | 'department'; department: string }[] = [];
//   // Search departments
//   for (const dept of departmentList.value) {
//     if (normalize(dept).includes(qNorm)) {
//       results.push({ name: dept, type: 'department', department: dept });
//     }
//   }
//   // Search cities across all departments
//   for (const dept of departmentList.value) {
//     const cities = Object.keys(COLOMBIA_GEO[dept] || {});
//     for (const city of cities) {
//       if (normalize(city).includes(qNorm)) {
//         results.push({ name: city, type: 'city', department: dept });
//       }
//     }
//   }
//   return results.slice(0, 6);
// });

function selectLocalGeoSuggestion(sug: { name: string; type: 'city' | 'department'; department: string }) {
  if (sug.type === 'department') {
    filters.value.department = sug.name;
    filters.value.city = '';
    filters.value.neighborhood = '';
    filters.value.zone = '';
    filters.value.address = sug.name;
  } else {
    filters.value.department = sug.department;
    filters.value.city = sug.name;
    filters.value.neighborhood = '';
    filters.value.zone = '';
    filters.value.address = sug.name;
    // Fly to city if CITY_CENTERS has it (Case-insensitive)
    const matchedKey = Object.keys(CITY_CENTERS).find(k => normalize(k) === normalize(sug.name));
    if (matchedKey && map) {
      const center = CITY_CENTERS[matchedKey];
      map.flyTo([center.lat, center.lng], center.zoom || 13, { duration: 1.2 });
      anchorCity.value = matchedKey;
      searchAnchorLatLng.value = { lat: center.lat, lng: center.lng };
    }
  }
  showSuggestions.value = false;
  addressSuggestions.value = [];
  applyFilters();
}

/**
 * SEARCH SELECTION
 * Handles when a user clicks a suggestion from the address search.
 * It geocodes the point, moves the map, and synchronizes filters.
 */
async function selectSuggestion(sug: any) {
  filters.value.address = sug._mainText || sug.display_name;
  showSuggestions.value = false;

  if (!map || typeof sug.lat !== 'number' || typeof sug.lng !== 'number') {
    searchAddressOnMap();
    return;
  }

  searchState.value = 'searching'; searchResultType.value = null; searchResultInfo.value = null; searchErrorType.value = null; clearSearchOverlay();

  const { lat, lng, _mainText, _subText, type, raw, boundingBox } = sug;

  if (type === 'exact') {
    map.flyTo([lat, lng], 18, { duration: 1.4 });
    drawExactPin(lat, lng, _mainText);
    searchResultType.value = 'exact';
    searchResultInfo.value = { icon: '📍', title: _mainText, sub: _subText };
  } else if (type === 'street') {
    const flyLat = boundingBox ? (boundingBox.s + boundingBox.n) / 2 : lat;
    const flyLng = boundingBox ? (boundingBox.w + boundingBox.e) / 2 : lng;
    map.flyTo([flyLat, flyLng], 16, { duration: 1.4 });
    drawStreetOverlay(raw, 'street');
    searchResultType.value = 'street';
    searchResultInfo.value = { icon: '🛣️', title: _mainText, sub: _subText };
  } else {
    // AREA / CITY INTERCEPT
    const matchedCityKey = Object.keys(CITY_CENTERS).find(k => normalize(k) === normalize(_mainText) || normalize(k) === normalize(sug.display_name));
    if (matchedCityKey) {
      const c = CITY_CENTERS[matchedCityKey];
      // Check if we have properties in this specific city to fit them
      const cityProps = allProperties.value.filter(p => normalize(p.city || '') === normalize(matchedCityKey));

      if (cityProps.length > 1 && cityProps.length <= 15 && map) {
        const bounds = L.latLngBounds(cityProps.map(p => [p.lat, p.lng]));
        map.flyToBounds(bounds, { padding: [80, 80], duration: 1.4 });
      } else {
        map.flyTo([c.lat, c.lng], c.zoom || 14, { duration: 1.4 });
      }
      searchAnchorLatLng.value = { lat: c.lat, lng: c.lng };
      anchorCity.value = matchedCityKey;
      syncFiltersFromAddress(c.lat, c.lng, null, true);
    } else {
      const areaMatches = allProperties.value.filter(p => {
        const pCity = normalize(p.city || '');
        const target = normalize(_mainText || '');
        return pCity.includes(target) || target.includes(pCity);
      });

      if (areaMatches.length > 1 && areaMatches.length <= 15 && map) {
        const bounds = L.latLngBounds(areaMatches.map(p => [p.lat, p.lng]));
        map.flyToBounds(bounds, { padding: [80, 80], duration: 1.4 });
      } else {
        map.flyTo([lat, lng], 14, { duration: 1.4 });
      }
      drawStreetOverlay(raw, 'area');
      searchAnchorLatLng.value = { lat, lng };
      await syncFiltersFromAddress(lat, lng, raw, true);
    }
    searchResultType.value = 'area';
    searchResultInfo.value = { icon: '📌', title: _mainText, sub: _subText };
  }

  searchAnchorLatLng.value = { lat, lng };
  await syncFiltersFromAddress(lat, lng, raw, true);
  searchState.value = 'success';
}


async function searchAddressOnMap() {
  const raw = filters.value.address?.trim();
  if (!raw || !map) return;
  const qType = classifyQuery(raw);
  if (qType === 'street' && !filters.value.city && !filters.value.department) {
    searchState.value = 'error'; searchErrorType.value = 'too_vague'; return;
  }
  searchState.value = 'searching'; searchResultType.value = null; searchResultInfo.value = null; searchErrorType.value = null; showSuggestions.value = false; clearSearchOverlay();

  // NUCLEAR RESET: Clear geographic sub-filters to prevent "sticky" state from previous searches
  // We keep address as it's the current input
  if (classifyQuery(raw) === 'area') {
    filters.value.department = '';
    filters.value.city = '';
    filters.value.neighborhood = '';
    filters.value.zone = '';
  }

  const ctx = {
    neighborhood: filters.value.neighborhood,
    city: filters.value.city,
    department: filters.value.department
  };

  // AUTHORITATIVE INTERCEPT: If it's a known city, fly there immediately.
  const matchedKey = Object.keys(CITY_CENTERS).find(k => normalize(k) === normalize(raw));
  if (matchedKey) {
    const c = CITY_CENTERS[matchedKey];
    map.flyTo([c.lat, c.lng], c.zoom || 14, { duration: 1.4 });
    searchAnchorLatLng.value = { lat: c.lat, lng: c.lng };
    anchorCity.value = matchedKey;
    syncFiltersFromAddress(c.lat, c.lng, null, true);
    searchState.value = 'success';
    return;
  }

  try {
    const res = await geocodeAddress(raw, ctx);
    if (!res) {
      // GIBBERISH DETECTION: Check if input looks like nonsese
      const isGib = (s: string) => s.length > 4 && (!/[aeiouáéíóú]/i.test(s) || (s.length > 10 && !s.includes(' ')));
      if (isGib(raw)) {
        searchState.value = 'error';
        searchErrorType.value = 'gibberish';
        return;
      }

      // SMART FALLBACK: If not found, try to fly to the city they might have mentions
      if (filters.value.city) {
        const center = CITY_CENTERS[filters.value.city];
        if (center) {
          map.flyTo([center.lat, center.lng], 14, { duration: 1.5 });
          searchAnchorLatLng.value = { lat: center.lat, lng: center.lng };
          searchState.value = 'error';
          searchErrorType.value = 'not_found';
          // Help the user understand we are in the city now
          searchResultInfo.value = {
            icon: '🏙️',
            title: filters.value.city,
            sub: `No encontramos propiedades en "${raw}", pero puedes explorar lo más cercano en ${filters.value.city}`
          };
          return;
        }
      }
      searchState.value = 'error';
      searchErrorType.value = 'not_found';
      return;
    }

    const { lat, lng, mainText, subText, type } = res;

    if (type === 'exact') {
      map.flyTo([lat, lng], 18, { duration: 1.4 });
      drawExactPin(lat, lng, mainText);
      searchResultType.value = 'exact';
      searchResultInfo.value = { icon: '📍', title: mainText, sub: subText };
    } else if (type === 'street') {
      const bb = res.boundingBox;
      const flyLat = bb ? (bb.s + bb.n) / 2 : lat;
      const flyLng = bb ? (bb.w + bb.e) / 2 : lng;
      map.flyTo([flyLat, flyLng], 16, { duration: 1.4 });
      drawStreetOverlay(res.raw, 'street');
      searchResultType.value = 'street';
      searchResultInfo.value = { icon: '🛣️', title: mainText, sub: subText };
    } else {
      // AUTHORITATIVE FIT: If we identify this as a city/area search and we have properties there,
      // fit the map to those properties instead of a fixed zoom.
      const areaMatches = allProperties.value.filter(p => {
        const pCity = normalize(p.city || '');
        const target = normalize(mainText);
        return pCity.includes(target) || target.includes(pCity);
      });

      if (areaMatches.length > 1 && areaMatches.length <= 15 && map) {
        const bounds = L.latLngBounds(areaMatches.map(p => [p.lat, p.lng]));
        map.flyToBounds(bounds, { padding: [80, 80], duration: 1.4 });
      } else {
        map.flyTo([lat, lng], 14, { duration: 1.4 });
      }
      drawStreetOverlay(res.raw, 'area');
      searchResultType.value = 'area';
      searchResultInfo.value = { icon: '📌', title: mainText, sub: subText };
    }

    searchAnchorLatLng.value = { lat, lng };
    // Pass raw features to syncFiltersFromAddress; it will extract properties correctly now
    await syncFiltersFromAddress(lat, lng, res.raw, true);
    searchState.value = 'success';

  } catch (e: any) {
    if (e.message === 'network') {
      searchState.value = 'error';
      searchErrorType.value = 'network';
    } else {
      searchState.value = 'error';
      searchErrorType.value = 'not_found';
    }
  }
}

async function searchBroader() {
  const raw = filters.value.address?.trim();
  if (!raw || !map) return;
  searchState.value = 'searching'; searchErrorType.value = null; clearSearchOverlay();
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(raw + ', Colombia')}&limit=3`;
    const data: any[] = await (await fetch(url)).json();
    if (data?.length) {
      const r = { ...data[0], ...parseSuggestion(data[0]) };
      const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
      map.flyTo([lat, lng], 14, { duration: 1.3 }); drawStreetOverlay(r, 'area');
      searchResultType.value = 'area'; searchResultInfo.value = { icon: '📌', title: r._mainText, sub: r.display_name.split(',').slice(1, 3).join(',').trim() };
      searchState.value = 'success';
    } else { searchState.value = 'error'; searchErrorType.value = 'not_found'; }
  } catch { searchState.value = 'error'; searchErrorType.value = 'network'; }
}


// ─────────────────────────────────────────────
// FILTER HANDLERS
// ─────────────────────────────────────────────
function onDepartmentChange() {
  filters.value.city = ''; filters.value.neighborhood = ''; filters.value.zone = '';
  applyFilters();
  if (filters.value.department && map) {
    const deptCities = Object.keys(COLOMBIA_GEO[filters.value.department] || {});
    for (const city of deptCities) {
      if (CITY_CENTERS[city]) { map.flyTo([CITY_CENTERS[city].lat, CITY_CENTERS[city].lng], 10, { duration: 1.2 }); return; }
    }
    const firstMatch = allProperties.value.find(p => deptCities.some(c => (p.city || '').toLowerCase().includes(c.toLowerCase())));
    if (firstMatch) map.flyTo([firstMatch.lat, firstMatch.lng], 10, { duration: 1.2 });
  }
}

function onCityChange() {
  filters.value.neighborhood = '';
  filters.value.zone = '';
  clearZoneOverlay();

  if (filters.value.city) {
    anchorCity.value = filters.value.city;
    // Auto-set department based on city (using authoritative service)
    const dept = getDepartmentByCity(filters.value.city);
    if (dept) {
      filters.value.department = dept;
    }
  }

  applyFilters();

  if (filters.value.city && map) {
    const center = getCityCenter(filters.value.city);
    if (center) {
      map.flyTo([center.lat, center.lng], 13, { duration: 1.2 });
      searchAnchorLatLng.value = { lat: center.lat, lng: center.lng };
      return;
    }
    const cityLower = filters.value.city.toLowerCase();
    const firstMatch = allProperties.value.find(p => (p.city || '').toLowerCase().includes(cityLower));
    if (firstMatch) {
      map.flyTo([firstMatch.lat, firstMatch.lng], 13, { duration: 1.2 });
      searchAnchorLatLng.value = { lat: firstMatch.lat, lng: firstMatch.lng };
    }
  }
}

function selectZone(zone: string) {
  if (filters.value.zone === zone) {
    filters.value.zone = ''; clearZoneOverlay(); applyFilters();
    if (filters.value.city) {
      const center = getCityCenter(filters.value.city);
      if (center && map) map.flyTo([center.lat, center.lng], CITY_CENTERS[filters.value.city]?.zoom ?? 13, { duration: 1.0 });
    }
    return;
  }
  filters.value.zone = zone; applyFilters();
  if (filters.value.city) flyToZone(zone, filters.value.city);
}

function onNeighborhoodChange() {
  applyFilters();
  if (filters.value.neighborhood && filters.value.city && map) {
    const query = `${filters.value.neighborhood}, ${filters.value.city}, Colombia`;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=co`)
      .then(r => r.json())
      .then(data => { if (data?.length && map) map.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 15, { duration: 1.2 }); })
      .catch(console.error);
  }
}

function toggleStatus(val: string) { filters.value.status = filters.value.status === val ? '' : val; applyFilters(); }

function clearFilters() {
  clearFiltersState();
  clearDrawLayer();
  clearZoneOverlay(); clearSearchOverlay();
  searchState.value = 'idle'; searchResultType.value = null; searchResultInfo.value = null; searchErrorType.value = null; searchAnchorLatLng.value = null;
  applyFilters();
}

// ─────────────────────────────────────────────
// DRAW TO SEARCH
// ─────────────────────────────────────────────
function startDraw(e: L.LeafletMouseEvent) {
  if (!isDrawMode.value) return;
  clearDrawLayer();
  isDrawing.value = true;
  currentPolyline = L.polyline([e.latlng], {
    color: '#3D2314',
    weight: 4,
    opacity: 0.9,
    dashArray: '6, 8',
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map!);
}

function onDrawMove(e: L.LeafletMouseEvent) {
  if (!isDrawing.value || !currentPolyline) return;
  currentPolyline.addLatLng(e.latlng);
}

function endDraw(_: L.LeafletMouseEvent) {
  if (!isDrawing.value || !currentPolyline) return;
  isDrawing.value = false;
  const latlngs = currentPolyline.getLatLngs() as L.LatLng[];

  if (latlngs.length > 2) {
    // Cerrar el polígono
    latlngs.push(latlngs[0]);
    drawnPolygonLayer = L.polygon(latlngs, {
      color: '#3D2314',
      fillColor: '#C4976A',
      fillOpacity: 0.25,
      weight: 3,
      dashArray: '6, 8',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map!);
    drawnPolygon.value = latlngs;
    applyFilters(); // Apply filter automatically checking for point in polygon
  }

  if (currentPolyline) {
    map!.removeLayer(currentPolyline);
    currentPolyline = null;
  }

  // Detach listeners so user doesn't start a new draw while the current one is active
  map!.off('mousedown', startDraw);
  map!.off('mousemove', onDrawMove);
  map!.off('mouseup', endDraw);
  map!.getContainer().style.cursor = '';
}

function clearDrawLayer() {
  if (drawnPolygonLayer && map) map.removeLayer(drawnPolygonLayer);
  if (currentPolyline && map) map.removeLayer(currentPolyline);
  drawnPolygonLayer = null;
  currentPolyline = null;
  drawnPolygon.value = null;
  applyFilters(); // Reset property list when drawing cleared
}

function toggleDrawMode() {
  if (!map) return;
  isDrawMode.value = !isDrawMode.value;
  if (isDrawMode.value) {
    if (drawnPolygon.value) clearDrawLayer();
    map.dragging.disable();
    map.on('mousedown', startDraw);
    map.on('mousemove', onDrawMove);
    map.on('mouseup', endDraw);
    map.getContainer().style.cursor = 'crosshair';
  } else {
    map.dragging.enable();
    map.off('mousedown', startDraw);
    map.off('mousemove', onDrawMove);
    map.off('mouseup', endDraw);
    map.getContainer().style.cursor = '';
  }
}

function isInsidePolygon(point: { lat: number, lng: number }, vs: L.LatLng[]) {
  let x = point.lng, y = point.lat;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i].lng, yi = vs[i].lat;
    let xj = vs[j].lng, yj = vs[j].lat;
    let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ─────────────────────────────────────────────
// MARKERS
// ─────────────────────────────────────────────
function clearProximityOverlay() {
  if (proximityFaderTimer) { clearTimeout(proximityFaderTimer); proximityFaderTimer = null; }
  if (proximityOverlayLayer && map) { map.removeLayer(proximityOverlayLayer); proximityOverlayLayer = null; }
}

function drawProximityOverlay(tierKey: string | null) {
  clearProximityOverlay();
  if (!map) return;
  const anchor = searchAnchorLatLng.value || userLatLng.value;
  if (!anchor) return;
  const props: any[] = tierKey ? (proximityBuckets.value as any)[tierKey] : propertiesInAnchorCity.value.slice(0, 5);
  if (!props || props.length === 0) return;
  proximityOverlayLayer = L.layerGroup().addTo(map);

  props.forEach((p, idx) => {
    const tier = p._dist < 0.3 ? 'ultra' : p._dist < 1 ? 'near' : p._dist < 3 ? 'medium' : 'far';
    const meta = TIER_META[tier];
    const color = meta.color;

    L.polyline([[anchor.lat, anchor.lng], [p.lat, p.lng]], { color, weight: 2.2, opacity: 0.6, dashArray: '6 8', lineCap: 'round' }).addTo(proximityOverlayLayer!);
    L.circle([p.lat, p.lng], {
      radius: p._dist < 0.3 ? 28 : p._dist < 1 ? 40 : p._dist < 3 ? 55 : 70,
      color, fillColor: color, fillOpacity: 0.1, weight: 2, dashArray: '5 6', opacity: 0.7,
    }).addTo(proximityOverlayLayer!);

    const rank = idx + 1;
    const beaconIcon = L.divIcon({
      className: '',
      html: `<div class="prox-mini-badge" style="--bc:${color}">
               ${rank === 1 && !tierKey ? '🏆' : rank}
             </div>`,
      iconSize: [24, 24], iconAnchor: [-9, 44],
    });
    L.marker([p.lat, p.lng], { icon: beaconIcon, zIndexOffset: -20 - idx, interactive: true })
      .on('click', () => selectProperty(p))
      .addTo(proximityOverlayLayer!);
  });

  if (searchAnchorLatLng.value) {
    L.circleMarker([anchor.lat, anchor.lng], { radius: 6, color: '#fff', fillColor: '#6366f1', fillOpacity: 1, weight: 2.5 }).addTo(proximityOverlayLayer!);
  }

  // Auto clean up after 8 seconds to avoid cluttering the map forever
  if (proximityFaderTimer) { clearTimeout(proximityFaderTimer); }
  proximityFaderTimer = setTimeout(() => {
    clearProximityOverlay();
  }, 8000);
}

function createImageMarker(property: MapProperty, isSelected: boolean): L.DivIcon {
  const imgSrc = getPropertyImage(property);
  const price = formatPriceShort(property.monthly_price);
  const statusColorMap: Record<string, string> = {
    available: '#10b981', rented: '#f43f5e', maintenance: '#f59e0b',
  };
  const statusColor = statusColorMap[property.status] ?? '#4D2F24';
  const selectedClass = isSelected ? 'marker-modern--selected' : '';
  return L.divIcon({
    className: '',
    html: `<div class="marker-modern ${selectedClass}" style="--accent-color:${statusColor}">
             <div class="marker-modern__glow"></div>
             <div class="marker-modern__wrapper">
               <div class="marker-modern__photo">
                 <img src="${imgSrc}" alt="" onerror="this.src='${DEFAULT_IMAGE}'" />
                 <div class="marker-modern__status-dot" style="background:${statusColor}"></div>
               </div>
               <div class="marker-modern__price-tag">
                 <span class="currency">$</span>${price}
               </div>
             </div>
             <div class="marker-modern__tip"></div>
           </div>`,
    iconAnchor: [54, 38], iconSize: [108, 38],
  });
}

function createClusterMarker(count: number, avgPrice: number): L.DivIcon {
  const price = formatPriceShort(avgPrice);
  const size = count > 50 ? 64 : count > 20 ? 54 : 44;
  return L.divIcon({
    className: '',
    html: `<div class="cluster-modern" style="width:${size}px;height:${size}px">
             <div class="cluster-modern__inner">
               <span class="cluster-modern__count">${count}</span>
               <span class="cluster-modern__price">${price}</span>
             </div>
             <div class="cluster-modern__ring"></div>
           </div>`,
    iconAnchor: [size / 2, size / 2], iconSize: [size, size],
  });
}


function renderAdministrativeBoundaries() {
  if (!map || !geoBoundariesLayerGroup) return;
  geoBoundariesLayerGroup.clearLayers();
  const zoom = map.getZoom();
  const all = mapFilteredProperties.value;

  if (zoom <= 8) {
    // Draw City Clusters on Top level for easy discovery
    const cityMap = new Map<string, { count: number, lat: number, lng: number, price: number }>();
    all.forEach(p => {
      const city = p.city || 'Otros';
      const stats = cityMap.get(city) || { count: 0, lat: 0, lng: 0, price: 0 };
      stats.count++;
      stats.price += p.monthly_price;
      // Use predefined center or average
      const center = CITY_CENTERS[city];
      if (center) { stats.lat = center.lat; stats.lng = center.lng; }
      else { stats.lat = p.lat; stats.lng = p.lng; } // Fallback to first prop location
      cityMap.set(city, stats);
    });

    // Identify trending city (max properties)
    let maxCount = 0;
    let trendingCity = '';
    cityMap.forEach((stats, city) => {
      if (stats.count > maxCount) {
        maxCount = stats.count;
        trendingCity = city;
      }
    });

    cityMap.forEach((stats, city) => {
      const isTrending = city === trendingCity;
      const label = L.divIcon({
        className: 'admin-boundary-label--city',
        html: `<div class="city-aggregate-marker ${isTrending ? 'cam--trending' : ''}">
                 ${isTrending ? '<span class="cam-badge">Destacada</span>' : ''}
                 <span class="cam-name">${city}</span>
                 <span class="cam-count">${stats.count}</span>
               </div>`,
        iconSize: [isTrending ? 140 : 120, 40], iconAnchor: [isTrending ? 70 : 60, 20]
      });
      L.marker([stats.lat, stats.lng], { icon: label, zIndexOffset: isTrending ? 2500 : 2000 }).addTo(geoBoundariesLayerGroup!)
        .on('click', () => { map!.flyTo([stats.lat, stats.lng], 13); });
    });
  }
  else if (zoom >= 8 && zoom <= 12) {
    // Draw City Boundaries (Dashed)
    const cityMap = new Map<string, number>();
    all.forEach(p => cityMap.set(p.city, (cityMap.get(p.city) || 0) + 1));

    cityMap.forEach((_, city) => {
      const center = CITY_CENTERS[city];
      if (!center) return;
      L.circle([center.lat, center.lng], {
        radius: 8000, color: '#64748b', weight: 1.5, dashArray: '6, 10',
        fillColor: '#64748b', fillOpacity: 0.02, interactive: false
      }).addTo(geoBoundariesLayerGroup!);

      const label = L.divIcon({
        className: 'admin-boundary-label admin-boundary-label--city',
        html: `<span>${city}</span>`,
        iconSize: [100, 20], iconAnchor: [50, 10]
      });
      L.marker([center.lat + 0.08, center.lng], { icon: label, interactive: false }).addTo(geoBoundariesLayerGroup!);
    });
  }
}

function renderMarkersForCurrentView() {
  if (!map || !markersLayerGroup) return;
  const zoom = map.getZoom();
  const bounds = map.getBounds();

  renderAdministrativeBoundaries();

  if (isHeatmapMode.value) return;

  // PIN SEPARATION LOGIC: If zoomed out (high distance), only show city aggregates (boundaries)
  // detailed markers are hidden at zoom <= 8 to keep the map clean and performance high.
  if (zoom <= 8) {
    if (markersLayerGroup) {
      markersLayerGroup.clearLayers();
      activeMarkers.clear();
    }
    visibleCount.value = propertiesForList.value.length; // Count all as "in view" for top level
    return;
  }

  // Decouple map markers from proximity logic: 
  // We use mapFilteredProperties to show ALL matching results globally in the area,
  // immune to strict geographical text filters.
  const all = mapFilteredProperties.value;

  // Viewport filtering: only process properties near the current view
  const ext = bounds.pad(0.5);
  const inViewport = all.filter(p => ext.contains(L.latLng(p.lat, p.lng)));

  visibleCount.value = all.filter(p => bounds.contains(L.latLng(p.lat, p.lng))).length;

  const newKeys = new Set<string>();

  // Normal Clustering / Properties at any zoom
  const clusters = clusterProperties(inViewport, zoom);
  for (const cluster of clusters) {
    const isSingle = cluster.count === 1;
    const property = isSingle ? cluster.properties[0] : null;
    const key = isSingle ? `prop-${property!.id}` : `cluster-${cluster.lat.toFixed(4)}:${cluster.lng.toFixed(4)}`;
    newKeys.add(key);

    if (activeMarkers.has(key)) {
      if (isSingle && property) {
        const existing = activeMarkers.get(key) as L.Marker;
        const sel = selectedPropertyId.value === property.id;
        existing.setIcon(createImageMarker(property, sel));
        existing.setZIndexOffset(sel ? 1000 : 0);
      }
      continue;
    }

    if (isSingle && property) {
      const sel = selectedPropertyId.value === property.id;
      const marker = L.marker([cluster.lat, cluster.lng], { icon: createImageMarker(property, sel), zIndexOffset: sel ? 1000 : 0 });
      marker.on('click', () => selectProperty(property));
      marker.addTo(markersLayerGroup!);
      activeMarkers.set(key, marker);
    } else {
      const marker = L.marker([cluster.lat, cluster.lng], { icon: createClusterMarker(cluster.count, cluster.avgPrice) });
      marker.on('click', () => { const z = map!.getZoom(); map!.flyTo([cluster.lat, cluster.lng], Math.min(z + 3, 16), { duration: 0.8 }); });
      marker.addTo(markersLayerGroup!);
      activeMarkers.set(key, marker);
    }
  }

  // ── REMOVE OLD MARKERS ──
  for (const [key, marker] of activeMarkers.entries()) {
    if (!newKeys.has(key)) {
      markersLayerGroup.removeLayer(marker);
      activeMarkers.delete(key);
    }
  }
}

/**
 * PROPERTY SELECTION
 * Focuses the map on a specific property and opens its preview.
 * @param property The MapProperty object to select
 */
function selectProperty(property: MapProperty) {
  // ABORT any ongoing geolocation scan to prevent map from flying back to user
  if (activeLocateWatchId !== null) {
    navigator.geolocation.clearWatch(activeLocateWatchId);
    activeLocateWatchId = null;
    isLocating.value = false;
    isScanning.value = false;
  }

  const prevId = selectedPropertyId.value;
  selectedPropertyId.value = property.id;
  if (map) {
    map.flyTo([property.lat, property.lng], 16, { duration: 1.2, easeLinearity: 0.25 });
  }

  // SMART ANCHORING: If the property is near the user (< 8km), we keep the radar 
  // and sorting anchored to the User's Real GPS to maintain the "Nearby" context.
  // Otherwise, we re-anchor to the property so the user can explore its surroundings.
  const distToUser = (userLatLng.value) ? getDistance(userLatLng.value.lat, userLatLng.value.lng, property.lat, property.lng) : Infinity;
  if (distToUser > 8) {
    searchAnchorLatLng.value = L.latLng(property.lat, property.lng);
  } else if (!userLatLng.value) {
    searchAnchorLatLng.value = L.latLng(property.lat, property.lng);
  }

  // Prevent auto-locking filters strictly to this city so user can still zoom and see other cities
  anchorCity.value = property.city || '';


  // Auto-show mini street view for the selected property
  pipLocation.value = { lat: property.lat, lng: property.lng };
  showStreetViewPip.value = true;

  // Scroll smoothly to the card in the right-side list
  nextTick(() => {
    const el = document.querySelector(`[data-prop-id="${property.id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Update marker icons for selected/unselected properties
  if (prevId !== null) {
    const prevMarker = activeMarkers.get(`prop-${prevId}`) as L.Marker | undefined;
    const prevProp = allProperties.value.find(p => p.id === prevId);
    if (prevMarker && prevProp) { prevMarker.setIcon(createImageMarker(prevProp, false)); prevMarker.setZIndexOffset(0); }
  }
  const newMarker = activeMarkers.get(`prop-${property.id}`) as L.Marker | undefined;
  if (newMarker) { newMarker.setIcon(createImageMarker(property, true)); newMarker.setZIndexOffset(1000); }
}

function closePreview() {
  if (selectedPropertyId.value !== null) {
    const marker = activeMarkers.get(`prop-${selectedPropertyId.value}`) as L.Marker | undefined;
    const prop = allProperties.value.find(p => p.id === selectedPropertyId.value);
    if (marker && prop) { marker.setIcon(createImageMarker(prop, false)); marker.setZIndexOffset(0); }
  }
  selectedPropertyId.value = null;
  showStreetViewPip.value = false;
}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
function goToDetail(propertyId: number) {
  if (!map) return;
  const center = map.getCenter();
  const zoom = map.getZoom();
  router.push({ name: 'PropertyDetail', params: { id: propertyId }, query: { fromMap: '1', mapLat: center.lat.toFixed(6), mapLng: center.lng.toFixed(6), mapZoom: zoom.toString() } });
}

function goBack() {
  window.history.length > 1 ? router.back() : router.push({ name: 'home' });
}

// ─────────────────────────────────────────────
// APPLY FILTERS
// ─────────────────────────────────────────────
function applyFilters(keepSelection = false) {
  if (markersLayerGroup) { markersLayerGroup.clearLayers(); activeMarkers.clear(); }
  if (!keepSelection) selectedPropertyId.value = null;
  if (isHeatmapMode.value && map) {
    if (heatLayer) map.removeLayer(heatLayer);

    // Config Gradient: Red = Exclusivo (alto precio), Blue/Green = Económico (bajo precio)
    // Find min and max price inside viewport
    const all = mapFilteredProperties.value;
    const maxPrice = all.reduce((max, p) => p.monthly_price > max ? p.monthly_price : max, 1);

    // Build Leaflet Heat format [lat, lng, intensity]
    // Intensity is linear to price but scaled to emphasis exclusive areas
    const points = all.map(p => {
      let intensity = (p.monthly_price / maxPrice);
      // Boost the visibility of low price ranges too
      intensity = Math.max(0.15, Math.pow(intensity, 0.6));
      return [p.lat, p.lng, intensity];
    });

    heatLayer = (L as any).heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 15,
      max: 1.0,
      gradient: {
        0.2: '#3b82f6', // Económico (Azul)
        0.5: '#22c55e', // Medio-Económico (Verde)
        0.7: '#eab308', // Medio-Exclusivo (Amarillo)
        0.9: '#ef4444', // Alto (Rojo)
        1.0: '#9f1239'  // Muy Exclusivo (Rojo oscuro)
      }
    }).addTo(map);
  } else {
    if (heatLayer && map) { map.removeLayer(heatLayer); heatLayer = null; }
    renderMarkersForCurrentView();
    setTimeout(renderMarkersForCurrentView, 1600);
  }
}

function toggleHeatmapMode() {
  isHeatmapMode.value = !isHeatmapMode.value;
  applyFilters();
}

function debouncedApplyFilters() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(applyFilters, DEBOUNCE_DELAY);
}

function handleStreetViewOpen() {
  isStreetViewPreloading.value = true;
}

function startStreetView() {
  isStreetViewPreloading.value = false;
  isStreetViewVisible.value = true;
}

function toggleStreetViewPicking() {
  isStreetViewPicking.value = !isStreetViewPicking.value;
  if (isStreetViewPicking.value) {
    if (map) map.getContainer().style.cursor = 'help';
    isMapActionsOpen.value = false;
    showStreetViewPip.value = false;
  } else {
    if (map) map.getContainer().style.cursor = '';
  }
}

function expandStreetView() {
  if (!pipLocation.value) return;
  startStreetView();
  showStreetViewPip.value = false;
}

function resetMapNorth() {
  if (!map) return;
  map.setView(map.getCenter(), map.getZoom());
  mapRotation.value = 0;
}

// ─────────────────────────────────────────────
// MAP INIT
// ─────────────────────────────────────────────
// LIFECYCLE & INITIALIZATION
// ─────────────────────────────────────────────
/**
 * Main map constructor. Initializes Leaflet, sets tile layers, 
 * and restores state from URL parameters.
 */
async function initMap() {
  if (!mapEl.value) return;
  const query = route.query;
  const savedLat = query.mapLat ? parseFloat(query.mapLat as string) : null;
  const savedLng = query.mapLng ? parseFloat(query.mapLng as string) : null;
  const savedZoom = query.mapZoom ? parseInt(query.mapZoom as string) : null;

  // Load filters from URL with strict matching to ensure sidebar dropdowns are populated correctly
  if (query.dept) {
    const rawDept = query.dept as string;
    const match = departmentList.value.find(d => normalize(d) === normalize(rawDept));
    filters.value.department = match || rawDept;

    if (query.city) {
      const rawCity = query.city as string;
      const cMatch = cityList.value.find(c => normalize(c) === normalize(rawCity));
      filters.value.city = cMatch || rawCity;
    }
  } else if (query.city) {
    const rawCity = query.city as string;
    const foundDept = getDepartmentByCity(rawCity);
    if (foundDept) {
      filters.value.department = foundDept;
      const cMatch = cityList.value.find(c => normalize(c) === normalize(rawCity));
      filters.value.city = cMatch || rawCity;
    } else {
      filters.value.city = rawCity;
    }
  }

  if (query.nb) filters.value.neighborhood = query.nb as string;
  if (query.zone) filters.value.zone = query.zone as string;
  if (query.status) filters.value.status = query.status as string;
  if (query.min) filters.value.min_price = query.min as string;
  if (query.max) filters.value.max_price = query.max as string;
  if (query.id) selectedPropertyId.value = parseInt(query.id as string);

  if (savedLat && savedLng && !isNaN(savedLat) && !isNaN(savedLng)) {
    searchAnchorLatLng.value = L.latLng(savedLat, savedLng);
    anchorCity.value = filters.value.city || (query.city as string) || '';
  }

  const center = (savedLat && savedLng && !isNaN(savedLat) && !isNaN(savedLng)) ? { lat: savedLat, lng: savedLng } : COLOMBIA_CENTER;
  const zoom = (savedZoom && !isNaN(savedZoom)) ? savedZoom : DEFAULT_ZOOM;

  map = L.map(mapEl.value, { center: [center.lat, center.lng], zoom, zoomControl: false, preferCanvas: true });
  L.control.zoom({ position: 'bottomleft' }).addTo(map);

  currentTileLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 21,
    maxNativeZoom: 21,
    attribution: '&copy; Google Maps',
    crossOrigin: true,
    updateWhenIdle: false,
    updateWhenZooming: true,
    updateInterval: 50,
    keepBuffer: 16,
    detectRetina: true,
    className: 'map-tiles-optimized'
  }).addTo(map);

  // Create a dedicated pane for labels so they are always below markers (600)
  map.createPane('labelsPane');
  map.getPane('labelsPane')!.style.zIndex = '401'; // Above overlayPane (400), below markerPane (600)

  // PROFESSIONAL HYBRID LABELS LAYER (Cities, Departments, Streets, POIs)
  labelsTileLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=h&x={x}&y={y}&z={z}', {
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    pane: 'labelsPane',
    maxZoom: 21,
    maxNativeZoom: 20,
    opacity: 0.9,
    crossOrigin: true,
    updateWhenIdle: false,
    updateInterval: 50,
    keepBuffer: 16,
    detectRetina: true
  }).addTo(map);
  markersLayerGroup = L.layerGroup().addTo(map);
  geoBoundariesLayerGroup = L.layerGroup().addTo(map);
  zoneOverlayLayer = L.layerGroup().addTo(map);
  let moveTimer: ReturnType<typeof setTimeout> | null = null;
  const onMapChange = () => {
    if (moveTimer) clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      renderMarkersForCurrentView();
      syncUrlParams();
    }, 200);
  };

  // SMART INIT: Fly to properties if they exist and we are currently far away or missing some
  setTimeout(() => {
    if (propertiesForList.value.length > 0 && map) {
      const pts = propertiesForList.value.map(p => L.latLng(p.lat, p.lng));
      const bounds = L.latLngBounds(pts);
      const currentBounds = map.getBounds();
      
      // Calculate how many properties are actually in the current viewport
      const visibleCount = pts.filter(p => currentBounds.contains(p)).length;
      
      // We should fit bounds if:
      // 1. We are zoomed out too far (zoom <= 6)
      // 2. The current view doesn't even intersect where the properties are
      // 3. We have a small set of properties (<= 10) but some are off-screen
      const shouldFit = map.getZoom() <= 7 || 
                        !currentBounds.intersects(bounds) || 
                        (pts.length <= 10 && visibleCount < pts.length);

      if (shouldFit) {
        map.flyToBounds(bounds, { padding: [80, 80], duration: 2.0 });
      }
    }
    renderMarkersForCurrentView();
  }, 1200);

  map.on('moveend', onMapChange);
  map.on('zoomend', onMapChange);
  map.on('move', () => {
    // Basic support for rotation if any plugin is present, otherwise just keep 0
    // @ts-ignore
    if (map.getBearing) mapRotation.value = map.getBearing();
  });

  map.on('click', (e: L.LeafletMouseEvent) => {
    if (isStreetViewPicking.value) {
      isStreetViewPicking.value = false;
      if (map) map.getContainer().style.cursor = '';
    }

    const target = e.originalEvent.target as HTMLElement;
    // Check if clicking map background (not a marker or list item)
    if (!target.closest('.marker-modern') && !target.closest('.cluster-modern') && !target.closest('.fab-container')) {
      closePreview();
      // Show mini street view for the clicked point immediately
      pipLocation.value = { lat: e.latlng.lat, lng: e.latlng.lng };
      showStreetViewPip.value = true;

      // CITY DISCOVERY: If clicking far from markers at low zoom, try to identify the city and zoom in
      if (map && map.getZoom() < 12) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=10`)
          .then(r => r.json())
          .then(data => {
            if (data.address && (data.address.city || data.address.town || data.address.municipality)) {
              map!.flyTo(e.latlng, 13, { duration: 1.5 });
            }
          }).catch(() => { });
      }
    }
  });
}

function setMapStyle(style: 'voyager' | 'satellite' | 'dark') {
  if (!map || !currentTileLayer) return;

  mapStyle.value = style;
  showMapStyleDropdown.value = false;

  let url;
  let attribution;

  if (mapStyle.value === 'voyager') {
    url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    attribution = '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>';
  } else if (mapStyle.value === 'dark') {
    url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    attribution = '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>';
  } else {
    url = 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';
    attribution = '&copy; Google Maps';
    currentTileLayer.options.subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];
  }

  currentTileLayer.setUrl(url);
  currentTileLayer.options.maxNativeZoom = mapStyle.value === 'satellite' ? 21 : 19;
  currentTileLayer.options.attribution = attribution;

  // Manage Labels Overlay for Hybrid View
  if (labelsTileLayer && map) {
    if (style === 'satellite') {
      if (!map.hasLayer(labelsTileLayer)) labelsTileLayer.addTo(map);
    } else {
      if (map.hasLayer(labelsTileLayer)) map.removeLayer(labelsTileLayer);
    }
  }

  // Apply performance enhancements to the new style
  currentTileLayer.options.updateWhenIdle = false;
  currentTileLayer.options.updateWhenZooming = true;
  currentTileLayer.options.updateInterval = 50;
  currentTileLayer.options.keepBuffer = 16;
  currentTileLayer.options.detectRetina = true;
}

const _statusCounts = computed(() => {
  const counts: Record<string, number> = {};
  for (const p of allProperties.value) {
    counts[p.status] = (counts[p.status] ?? 0) + 1;
  }
  return counts;
});

function countByStatus(status: string): number {
  return _statusCounts.value[status] ?? 0;
}

/**
 * MAP DATA LOADING
 * Fetches properties from the API and normalizes them for Map use.
 */
async function loadProperties() {
  try {
    isLoading.value = true;
    allProperties.value = await propertyMapService.getAllForMap();
    await nextTick();
    // await new Promise(r => setTimeout(r, 100)); // Removed this artificial delay
    if (map) {
      map.invalidateSize();
      const hasSaved = route.query.mapLat && route.query.mapLng;
      if (!hasSaved && allProperties.value.length > 0) {
        const cityCounts: Record<string, number> = {};
        allProperties.value.forEach(p => { if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1; });
        const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const firstProp = allProperties.value.find(p => p.city === topCity);
        if (firstProp) { 
          map.setView([firstProp.lat, firstProp.lng], 13);
          searchAnchorLatLng.value = L.latLng(firstProp.lat, firstProp.lng);
          anchorCity.value = firstProp.city || '';
        }
      }
      renderMarkersForCurrentView(); // Force a call to renderMarkersForCurrentView after loadProperties
    }
  } catch (err) { console.error('Error cargando propiedades:', err); }
  finally { isLoading.value = false; }
}

// ─────────────────────────────────────────────
// WATCHERS
// ─────────────────────────────────────────────
watch(propertiesForList, () => {
  if (map && !isLoading.value) {
    if (markersLayerGroup) { markersLayerGroup.clearLayers(); activeMarkers.clear(); }
    setTimeout(renderMarkersForCurrentView, 50);
  }
});

watch([selectedTierKey, () => searchAnchorLatLng.value, () => userLatLng.value], () => {
  const hasAnchor = !!(searchAnchorLatLng.value || userLatLng.value);
  if (hasAnchor) drawProximityOverlay(selectedTierKey.value);
  else clearProximityOverlay();
}, { immediate: false });

watch(sidebarCollapsed, async () => {
  await nextTick();
  await new Promise(r => setTimeout(r, 310));
  map?.invalidateSize();
});

function syncUrlParams() {
  if (!map) return;
  const center = map.getCenter();
  const zoom = map.getZoom();

  const query: any = {
    ...route.query,
    mapLat: center.lat.toFixed(6),
    mapLng: center.lng.toFixed(6),
    mapZoom: zoom.toString()
  };

  if (filters.value.department) query.dept = filters.value.department; else delete query.dept;
  if (filters.value.city) query.city = filters.value.city; else delete query.city;
  if (filters.value.neighborhood) query.nb = filters.value.neighborhood; else delete query.nb;
  if (filters.value.zone) query.zone = filters.value.zone; else delete query.zone;
  if (filters.value.status) query.status = filters.value.status; else delete query.status;
  if (filters.value.min_price) query.min = filters.value.min_price.toString(); else delete query.min;
  if (filters.value.max_price) query.max = filters.value.max_price.toString(); else delete query.max;

  router.replace({ query }).catch(() => { });
}

watch(filters, () => {
  syncUrlParams();
}, { deep: true });

// ── SYNC FILTERS -> SEARCH BAR ──
// When city or department is changed manually from the sidebar, update the search input text
watch([() => filters.value.city, () => filters.value.department], ([newCity, newDept]) => {
  if (isSyncingFilters.value) return; // Skip if this change came FROM a search/geocode.

  if (newCity || newDept) {
    // Deduplicate parts in case city or dept name already contains the other
    const rawParts = [newCity, newDept].filter(Boolean);
    const uniqueParts: string[] = [];
    const seen = new Set<string>();
    
    for (const p of rawParts) {
      const norm = p.toLowerCase().trim();
      // Also handle cases where one part is contained in another, e.g. "Medellín, Antioquia" and "Antioquia"
      let isDuplicate = false;
      for (const s of seen) {
        if (norm.includes(s) || s.includes(norm)) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        uniqueParts.push(p);
        seen.add(norm);
      }
    }
    
    const text = uniqueParts.join(', ');
    if (text && filters.value.address !== text) {
      filters.value.address = text;
    }
  }
});

// ─────────────────────────────────────────────
// LIFECYCLE
// ─────────────────────────────────────────────

// ── Voice Assistant Handlers ──
function handleVoiceMapCenter(data: any) {
  if (!map || !data) return;
  const { lat, lng, zoom } = data;
  if (lat && lng) {
    map.flyTo([lat, lng], zoom || 14, { duration: 1.5 });
  }
}

function handleVoiceNavigateMap() {
  setTimeout(() => {
    if (map) {
      map.invalidateSize();
      renderMarkersForCurrentView();
    }
  }, 500);
}

function handleVoiceFiltersApplied(intent: any) {
  if (!intent) return;

  if (intent.city) {
    // Buscar departamento
    let found = false;
    for (const [dep, citiesObj] of Object.entries(COLOMBIA_GEO)) {
      if (Object.keys(citiesObj).includes(intent.city)) {
        filters.value.department = dep;
        nextTick(() => { filters.value.city = intent.city; });
        found = true;
        break;
      }
    }
    if (!found) filters.value.city = intent.city;
  }

  if (intent.neighborhood) filters.value.neighborhood = intent.neighborhood;
  if (intent.min_price) filters.value.min_price = intent.min_price;
  if (intent.max_price) filters.value.max_price = intent.max_price;

  // FIX ZONA: Activar filtro de zona cuando Lyra detecta zona cardinal
  if (intent.zone) {
    const zonaValida = ['Norte', 'Sur', 'Centro', 'Este', 'Oeste'];
    const zona = intent.zone.charAt(0).toUpperCase() + intent.zone.slice(1).toLowerCase();

    if (zonaValida.includes(zona)) {
      // Asegurarse de que hay ciudad activa antes de aplicar zona
      const ciudadActiva = filters.value.city || intent.city || anchorCity.value;

      if (ciudadActiva) {
        // Usar selectZone() — ya existe en el componente
        // Activa el filtro Y el overlay visual del mapa
        selectZone(zona);
      }
    }
  }
}

function handleLyraViewProperty(payload: any) {
  if (payload?.id) {
    goToDetail(payload.id);
  }
}

function handleLyraOpenVisitModal(payload: any) {
  if (payload?.id) {
    selectedPropertyId.value = payload.id;
  }
}

function handleLyraEnableGps() {
  locateUser();
}

onMounted(async () => {
  await initMap();
  await loadProperties();

  eventBus.on(EVENTS.VOICE_MAP_CENTER, handleVoiceMapCenter);
  eventBus.on(EVENTS.VOICE_NAVIGATE_MAP, handleVoiceNavigateMap);
  eventBus.on(EVENTS.VOICE_FILTERS_APPLIED, handleVoiceFiltersApplied);
  eventBus.on(EVENTS.LYRA_VIEW_PROPERTY, handleLyraViewProperty);
  eventBus.on(EVENTS.LYRA_OPEN_VISIT_MODAL, handleLyraOpenVisitModal);
  eventBus.on(EVENTS.LYRA_ENABLE_GPS, handleLyraEnableGps);
});

onUnmounted(() => {
  eventBus.off(EVENTS.VOICE_MAP_CENTER, handleVoiceMapCenter);
  eventBus.off(EVENTS.VOICE_NAVIGATE_MAP, handleVoiceNavigateMap);
  eventBus.off(EVENTS.VOICE_FILTERS_APPLIED, handleVoiceFiltersApplied);
  eventBus.off(EVENTS.LYRA_VIEW_PROPERTY, handleLyraViewProperty);
  eventBus.off(EVENTS.LYRA_OPEN_VISIT_MODAL, handleLyraOpenVisitModal);
  eventBus.off(EVENTS.LYRA_ENABLE_GPS, handleLyraEnableGps);

  if (debounceTimer) clearTimeout(debounceTimer);
  if (map) {
    if (labelsTileLayer) map.removeLayer(labelsTileLayer);
    map.remove();
    map = null;
  }
  markersLayerGroup = null;
  activeMarkers.clear();
});
</script>
<style scoped>
.map-tiles-optimized {
  transition: opacity 0.4s ease, filter 0.4s ease !important;
}

.map-satellite-mode .map-tiles-optimized {
  filter: contrast(1.08) brightness(1.05) saturate(1.1) !important;
}

/* Ensure labels are ultra-sharp */
.map-satellite-mode .leaflet-labelsPane-pane {
  pointer-events: none;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.8));
}
</style>
<style src="./MapExplorer.css"></style>
