<template>
  <div class="pagination-wrapper">
    <div class="pagination-container">
      
      <!-- Info Section -->
      <div class="pagination-info">
        <p class="results-text">
          Mostrando 
          <strong>{{ startItem }}-{{ endItem }}</strong> 
          de 
          <strong>{{ totalItems }}</strong> 
          {{ totalItems === 1 ? 'propiedad' : 'propiedades' }}
        </p>
      </div>

      <!-- Navigation -->
      <nav class="pagination-nav" v-if="totalPages > 1">
        
        <!-- Previous Button -->
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="nav-button prev-button"
          :class="{ disabled: currentPage === 1 }"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="nav-text">Anterior</span>
        </button>

        <!-- Page Numbers -->
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="page !== '...' && goToPage(page)"
            :disabled="page === '...'"
            class="page-button"
            :class="{ 
              active: page === currentPage,
              dots: page === '...'
            }"
          >
            <span class="page-number">{{ page }}</span>
            <div v-if="page === currentPage" class="active-indicator"></div>
          </button>
        </div>

        <!-- Next Button -->
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="nav-button next-button"
          :class="{ disabled: currentPage === totalPages }"
        >
          <span class="nav-text">Siguiente</span>
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

// ==================== COMPUTED ====================

const startItem = computed(() => {
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.itemsPerPage
  return Math.min(end, props.totalItems)
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const delta = 2 // Páginas a mostrar a cada lado de la actual

  // Siempre mostrar primera página
  pages.push(1)

  // Calcular rango de páginas visibles
  const start = Math.max(2, props.currentPage - delta)
  const end = Math.min(props.totalPages - 1, props.currentPage + delta)

  // Agregar puntos suspensivos si hay gap
  if (start > 2) {
    pages.push('...')
  }

  // Agregar páginas del rango
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  // Agregar puntos suspensivos si hay gap
  if (end < props.totalPages - 1) {
    pages.push('...')
  }

  // Siempre mostrar última página (si hay más de 1)
  if (props.totalPages > 1) {
    pages.push(props.totalPages)
  }

  return pages
})

// ==================== METHODS ====================

const goToPage = (page: number | string) => {
  if (typeof page === 'number' && page >= 1 && page <= props.totalPages) {
    emit('update:page', page)
  }
}
</script>

<style scoped>
/* ==================== WRAPPER ==================== */
.pagination-wrapper {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px solid #f1f5f9;
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

/* ==================== INFO SECTION ==================== */
.pagination-info {
  text-align: center;
}

.results-text {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0;
}

.results-text strong {
  color: #1e293b;
  font-weight: 700;
}

/* ==================== NAVIGATION ==================== */
.pagination-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* ==================== NAV BUTTONS ==================== */
.nav-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-button:hover:not(.disabled) {
  background: linear-gradient(135deg, #3b251d 0%, #8b6f47 100%);
  border-color: #3b251d;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 37, 29, 0.2);
}

.nav-button:active:not(.disabled) {
  transform: translateY(0);
}

.nav-button.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8fafc;
  border-color: #e2e8f0;
}

.nav-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.prev-button:hover:not(.disabled) .nav-icon {
  transform: translateX(-3px);
}

.next-button:hover:not(.disabled) .nav-icon {
  transform: translateX(3px);
}

.nav-text {
  font-weight: 600;
}

/* ==================== PAGE NUMBERS ==================== */
.page-numbers {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.page-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  padding: 0 0.75rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}

.page-button:hover:not(.active):not(.dots) {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.page-button:active:not(.active):not(.dots) {
  transform: translateY(0);
}

.page-button.active {
  background: linear-gradient(135deg, #3b251d 0%, #8b6f47 100%);
  border-color: #3b251d;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 37, 29, 0.3);
  transform: scale(1.05);
}

.page-button.dots {
  cursor: default;
  border-color: transparent;
  background: transparent;
  color: #94a3b8;
}

.page-number {
  position: relative;
  z-index: 2;
}

.active-indicator {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    transparent 100%
  );
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .pagination-wrapper {
    margin-top: 2rem;
    padding-top: 1.5rem;
  }

  .pagination-nav {
    flex-direction: column;
    width: 100%;
    gap: 1rem;
  }

  .nav-button {
    width: 100%;
    justify-content: center;
  }

  .page-numbers {
    justify-content: center;
    flex-wrap: wrap;
  }

  .page-button {
    min-width: 40px;
    height: 40px;
  }

  .nav-text {
    display: none;
  }

  .nav-icon {
    margin: 0;
  }
}

@media (max-width: 480px) {
  .page-numbers {
    gap: 0.375rem;
  }

  .page-button {
    min-width: 36px;
    height: 36px;
    font-size: 0.875rem;
  }

  .results-text {
    font-size: 0.875rem;
  }
}
</style>