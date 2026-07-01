<template>
  <div class="pv-page">
    <div class="pv-bg" aria-hidden="true">
      <div class="pv-bg__orb pv-bg__orb--1"></div>
      <div class="pv-bg__orb pv-bg__orb--2"></div>
    </div>

    <div class="pv-shell">

      <!-- ── Header ── -->
      <header class="pv-header">
        <div class="pv-header__left">
          <span class="pv-eyebrow"><span class="ew-pip"></span>{{ $t('payments.eyebrow') }}</span>
          <h1 class="pv-title" v-html="$t('payments.title')"></h1>
          <p class="pv-subtitle">{{ $t('payments.subtitle') }}</p>
        </div>
        <div class="pv-header__right">
          <!-- Botón de Pago (Simulación) -->
          <div v-if="pendingContracts.length > 0" class="pv-pay-action">
            <button class="btn-pay-now" @click="openPaymentModal(pendingContracts[0])">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ $t('payments.actions.payNow') }}
            </button>
          </div>

          <div class="pv-actions">
            <button class="btn-manage-methods" @click="showManageMethodsModal = true">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M3 10h18M7 15h1m4 0h3m-7 0a1 1 0 01-1-1V6a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ $t('payments.actions.manageMethods') }}
            </button>
            <div class="pv-counters">
              <div class="pv-counter">
                <span class="pv-counter__val">{{ displayPayments.length }}</span>
                <span class="pv-counter__lbl">{{ $t('payments.counters.records') }}</span>
              </div>
              <div class="pv-counter-sep"></div>
              <div class="pv-counter">
                <span class="pv-counter__val">{{ pendingCount }}</span>
                <span class="pv-counter__lbl">{{ $t('payments.counters.pending') }}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- ── Panel ── -->
      <div class="pv-panel">

        <!-- Toolbar -->
        <div class="pv-toolbar">
          <div class="pv-search">
            <svg viewBox="0 0 20 20" fill="none" width="14" height="14" class="pv-search__ico">
              <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
              <path d="M15 15l-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="$t('payments.searchPlaceholder')"
              @input="handleSearch"
            />
          </div>
          <select v-model="statusFilter" class="pv-select" @change="fetchPayments">
            <option value="">{{ $t('payments.filters.all') }}</option>
            <option value="paid">{{ $t('payments.filters.paid') }}</option>
            <option value="pending">{{ $t('payments.filters.pending') }}</option>
            <option value="failed">{{ $t('payments.filters.failed') }}</option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="pv-state">
          <div class="pv-spinner"></div>
          <p>{{ $t('payments.states.loading') }}</p>
        </div>

        <!-- Empty -->
        <div v-else-if="payments.length === 0" class="pv-state">
          <div class="pv-empty-icon">
            <svg viewBox="0 0 48 48" fill="none" width="26" height="26">
              <rect x="6" y="12" width="36" height="26" rx="4" stroke="currentColor" stroke-width="1.5"/>
              <path d="M6 20h36" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="16" cy="32" r="2" fill="currentColor"/>
              <path d="M24 32h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h3>{{ $t('payments.states.empty.title') }}</h3>
          <p>{{ $t('payments.states.empty.description') }}</p>
        </div>

        <!-- Table -->
        <div v-else class="pv-table-wrap">
          <table class="pv-table">
            <thead>
              <tr>
                <th>{{ $t('payments.table.headers.id') }}</th>
                <th>{{ $t('payments.table.headers.date') }}</th>
                <th>{{ $t('payments.table.headers.amount') }}</th>
                <th>{{ $t('payments.table.headers.status') }}</th>
                <th>{{ $t('payments.table.headers.type') }}</th>
                <th>{{ $t('payments.table.headers.contract') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in filteredPayments" :key="payment.id" 
                :class="['pv-row', { 
                  'pv-row--pending': payment.status === 'pending', 
                  'pv-row--virtual': payment.isVirtual,
                  'pv-row--clickable': payment.status === 'completed' || payment.status === 'paid'
                }]"
                @click="payment.status === 'completed' || payment.status === 'paid' ? openDetailModal(payment) : null"
              >
                <td>
                  <span v-if="payment.isVirtual" class="badge-new">{{ $t('payments.badges.new') }}</span>
                  <span v-else class="cell-id">#{{ payment.id }}</span>
                </td>
                <td><span class="cell-muted">{{ formatDate(payment.created_at) }}</span></td>
                <td><span class="cell-amount">{{ formatPrice(payment.amount) }}</span></td>
                <td>
                  <span :class="['pay-status', `pay-status--${payment.status}`, { 'pay-status--pulse': payment.status === 'pending' }]">
                    {{ payment.isVirtual ? $t('payments.status.unpaid') : translateStatus(payment.status) }}
                  </span>
                </td>
                <td><span class="cell-type">{{ translateType(payment.type) }}</span></td>
                <td>
                  <span v-if="payment.contract" class="cell-contract">
                    <span class="contract-dot"></span>
                    {{ $t('payments.table.contractId') }}{{ payment.contract.id }}
                  </span>
                  <span v-else class="cell-na">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="meta && meta.last_page > 1 && !statusFilter" class="pv-pager">
          <button
            :disabled="meta.current_page === 1"
            @click="changePage(meta.current_page - 1)"
            class="pager-arrow"
          >
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M10 4L6 8l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ $t('payments.pagination.prev') }}
          </button>
          <span class="pager-info">{{ $t('payments.pagination.info', { page: meta.current_page, total: meta.last_page }) }}</span>
          <button
            :disabled="meta.current_page === meta.last_page"
            @click="changePage(meta.current_page + 1)"
            class="pager-arrow"
          >
            {{ $t('payments.pagination.next') }}
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>

      </div>
    </div>

    <!-- ── MODAL DE PAGO ── -->
    <Transition name="px-fade">
      <div v-if="showPaymentModal" class="px-modal-overlay" @click.self="showPaymentModal = false">
        <div class="px-modal-card">
          <header class="px-modal-header">
            <div class="header-info">
              <h3>{{ isAddingCardOnly ? $t('payments.modals.methods.newCard') : $t('payments.modals.payment.title') }}</h3>
              <p v-if="selectedContract && !isAddingCardOnly">{{ $t('payments.table.contractId') }}{{ selectedContract.id }} - {{ selectedContract.property?.title }}</p>
            </div>
            <button class="btn-close" @click="showPaymentModal = false">&times;</button>
          </header>

          <div class="px-modal-body">
            <!-- Resumen del Pago (Ocultar si solo agregamos tarjeta) -->
            <div v-if="!isAddingCardOnly" class="pay-summary">
              <span class="summary-label">{{ $t('payments.modals.payment.amountToPay') }}</span>
              <span class="summary-value">{{ formatPrice(selectedContract?.deposit || 0) }}</span>
            </div>

            <!-- Selección de Método (Ocultar si solo agregamos tarjeta) -->
            <div v-if="!isAddingCardOnly" class="pay-methods-grid">
              <button 
                v-if="savedCards.length > 0"
                :class="['method-tab', { active: selectedMethod === 'saved' }]"
                @click="selectedMethod = 'saved'"
              >
                {{ $t('payments.modals.payment.savedCard') }}
              </button>
              <button 
                :class="['method-tab', { active: selectedMethod === 'new' }]"
                @click="selectedMethod = 'new'"
              >
                {{ $t('payments.modals.payment.newCard') }}
              </button>
            </div>

            <!-- Tarjetas Guardadas -->
            <div v-if="selectedMethod === 'saved'" class="saved-cards-list">
              <label v-for="card in savedCards" :key="card.id" class="card-option">
                <input type="radio" v-model="selectedCardId" :value="card.id" name="saved_card">
                <div class="card-option-content">
                  <div class="card-brand-icon">
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 10h18M7 15h1m4 0h3m-7 0a1 1 0 01-1-1V6a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                  <div class="card-info">
                    <span class="card-number">**** **** **** {{ card.last_four }}</span>
                    <span class="card-expiry">{{ $t('payments.modals.methods.vence', { date: card.expiry_date }) }}</span>
                  </div>
                  <div v-if="card.is_default" class="card-badge">Default</div>
                </div>
              </label>
            </div>

            <!-- Formulario Nueva Tarjeta -->
            <div v-if="selectedMethod === 'new'" class="new-card-form">
              <div class="rx-input-group">
                <label>{{ $t('payments.modals.payment.holderName') }}</label>
                <input v-model="paymentForm.holder_name" type="text" :placeholder="$t('payments.modals.payment.holderPlaceholder')">
              </div>
              <div class="rx-input-group">
                <label>{{ $t('payments.modals.payment.cardNumber') }}</label>
                <div class="input-with-icon">
                  <input v-model="paymentForm.card_number" type="text" :placeholder="$t('payments.modals.payment.cardPlaceholder')" maxlength="19">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" class="input-icon"><path d="M3 10h18M7 15h1m4 0h3m-7 0a1 1 0 01-1-1V6a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
              <div class="rx-row">
                <div class="rx-input-group half">
                  <label>{{ $t('payments.modals.payment.expiryDate') }}</label>
                  <input v-model="paymentForm.expiry_date" type="text" :placeholder="$t('payments.modals.payment.expiryPlaceholder')" maxlength="5">
                </div>
                <div class="rx-input-group half">
                  <label>{{ $t('payments.modals.payment.cvv') }}</label>
                  <input v-model="paymentForm.cvv" type="password" :placeholder="$t('payments.modals.payment.cvvPlaceholder')" maxlength="4">
                </div>
              </div>
              <label class="rx-checkbox">
                <input type="checkbox" v-model="paymentForm.save_card">
                <span>{{ $t('payments.modals.payment.saveCard') }}</span>
              </label>
            </div>
          </div>

          <footer class="px-modal-footer">
            <button class="btn-cancel" @click="showPaymentModal = false">{{ $t('payments.modals.payment.cancel') }}</button>
            <button class="btn-submit" :disabled="isProcessing" @click="processPayment">
              <div v-if="isProcessing" class="mini-spinner"></div>
              <template v-else>
                <span v-if="isAddingCardOnly">{{ $t('common.save') }}</span>
                <span v-else>{{ $t('payments.modals.payment.confirm', { amount: formatPrice(selectedContract?.deposit || 0) }) }}</span>
              </template>
            </button>
          </footer>
        </div>
      </div>
    </Transition>

    <!-- ── MODAL GESTIONAR MÉTODOS DE PAGO ── -->
    <Transition name="px-fade">
      <div v-if="showManageMethodsModal" class="px-modal-overlay" @click.self="showManageMethodsModal = false">
        <div class="px-modal-card">
          <header class="px-modal-header">
            <div class="header-info">
              <h3>{{ $t('payments.modals.methods.title') }}</h3>
              <p>{{ $t('payments.modals.methods.subtitle') }}</p>
            </div>
            <button class="btn-close" @click="showManageMethodsModal = false">&times;</button>
          </header>

          <div class="px-modal-body">
            <div v-if="savedCards.length === 0" class="methods-empty">
              <div class="empty-icon-mini">
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M3 10h18M7 15h1m4 0h3m-7 0a1 1 0 01-1-1V6a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <p>{{ $t('payments.modals.methods.empty') }}</p>
            </div>
            <div v-else class="methods-list">
              <div v-for="card in savedCards" :key="card.id" class="method-item">
                <div class="method-brand">
                  <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 10h18M7 15h1m4 0h3m-7 0a1 1 0 01-1-1V6a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div class="method-info">
                  <span class="method-number">**** **** **** {{ card.last_four }}</span>
                  <span class="method-expiry">{{ $t('payments.modals.methods.expiring', { date: card.expiry_date }) }}</span>
                </div>
                <div class="method-actions">
                  <button class="btn-delete-method" title="Eliminar" @click="deletePaymentMethod(card.id)">
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <footer class="px-modal-footer dual">
            <button class="btn-add-method-modal" @click="openAddCardModal">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
              {{ $t('payments.modals.methods.newCard') }}
            </button>
            <button class="btn-done" @click="showManageMethodsModal = false">{{ $t('common.close') }}</button>
          </footer>
        </div>
      </div>
    </Transition>

    <!-- ── MODAL DE DETALLE DE PAGO ── -->
    <Transition name="px-fade">
      <div v-if="showDetailModal" class="px-modal-overlay" @click.self="showDetailModal = false">
        <div class="px-modal-card">
          <header class="px-modal-header">
            <div class="header-info">
              <h3>{{ $t('payments.modals.detail.title') }}</h3>
              <p>{{ $t('payments.modals.detail.transactionId') }} #{{ selectedPayment?.id }}</p>
            </div>
            <button class="btn-close" @click="showDetailModal = false">&times;</button>
          </header>

          <div class="px-modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">{{ $t('payments.modals.detail.status') }}</span>
                <span :class="['pay-status', `pay-status--${selectedPayment?.status}`]">
                  {{ translateStatus(selectedPayment?.status) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('payments.modals.detail.amount') }}</span>
                <span class="detail-value text-accent">{{ formatPrice(selectedPayment?.amount) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('payments.modals.detail.date') }}</span>
                <span class="detail-text">{{ formatDate(selectedPayment?.created_at) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">{{ $t('payments.modals.detail.type') }}</span>
                <span class="detail-text">{{ translateType(selectedPayment?.type) }}</span>
              </div>
              <div class="detail-item full">
                <span class="detail-label">{{ $t('payments.modals.detail.reference') }}</span>
                <span class="detail-text" v-if="selectedPayment?.contract">
                   {{ $t('payments.table.contractId') }}{{ selectedPayment.contract.id }} - {{ selectedPayment.contract.property?.title }}
                </span>
              </div>
              <div class="detail-item full" v-if="selectedPayment?.card_last_four">
                <span class="detail-label">{{ $t('payments.modals.detail.method') }}</span>
                <div class="detail-method">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M3 10h18M7 15h1m4 0h3m-7 0a1 1 0 01-1-1V6a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <span>{{ $t('payments.modals.detail.cardEnding', { lastFour: selectedPayment.card_last_four }) }}</span>
                </div>
              </div>
            </div>
          </div>

          <footer class="px-modal-footer">
            <button class="btn-receipt-full" @click="generatePDFFromPayment(selectedPayment)">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ $t('payments.modals.detail.download') }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>

    <!-- ── MODAL DE ÉXITO ── -->
    <Transition name="px-fade">
      <div v-if="showSuccessModal" class="px-modal-overlay">
        <div class="px-modal-card success-card">
          <div class="success-icon-wrap">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          
          <div class="success-content">
            <h3>{{ $t('payments.modals.success.title') }}</h3>
            <p>{{ $t('payments.modals.success.description') }}</p>
            
            <div class="receipt-preview">
              <div class="receipt-row"><span>{{ $t('payments.modals.receipt.labels.id') }}</span> <strong>#{{ lastPaymentResult?.id }}</strong></div>
              <div class="receipt-row"><span>{{ $t('payments.modals.receipt.labels.date') }}</span> <strong>{{ formatDate(lastPaymentResult?.created_at) }}</strong></div>
              <div class="receipt-row"><span>{{ $t('payments.modals.receipt.labels.amount') }}</span> <strong class="text-accent">{{ formatPrice(lastPaymentResult?.amount) }}</strong></div>
              <div class="receipt-row"><span>{{ $t('payments.modals.receipt.labels.contract') }}</span> <strong>#{{ lastPaymentResult?.contract_id }}</strong></div>
              <div class="receipt-row"><span>{{ $t('payments.modals.receipt.labels.card') }}</span> <strong>**** {{ lastPaymentResult?.card_last_four }}</strong></div>
              <div class="receipt-row"><span>{{ $t('payments.modals.receipt.labels.status') }}</span> <span class="badge-success">{{ $t('payments.status.paid') }}</span></div>
            </div>
          </div>

          <footer class="px-modal-footer dual">
            <button class="btn-receipt" @click="downloadReceipt">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ $t('payments.modals.detail.download') }}
            </button>
            <button class="btn-done" @click="showSuccessModal = false">{{ $t('payments.modals.success.done') }}</button>
          </footer>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAlerts } from '@/composables/useAlerts';
import api from '@/services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const { error, success, danger: dangerAlert } = useAlerts();

const payments    = ref<any[]>([]);
const contracts   = ref<any[]>([]);
const loading     = ref(true);
const meta        = ref<any>(null);
const searchQuery  = ref('');
const statusFilter = ref('');
const currentPage  = ref(1);
let searchTimeout: any = null;

// Modales y Simulación
const showPaymentModal       = ref(false);
const showSuccessModal       = ref(false);
const showManageMethodsModal = ref(false);
const showDetailModal        = ref(false);
const isProcessing           = ref(false);
const isAddingCardOnly       = ref(false);

const selectedContract = ref<any>(null);
const selectedPayment  = ref<any>(null);

// Body Scroll Lock
const anyModalOpen = computed(() => 
  showPaymentModal.value || showSuccessModal.value || showManageMethodsModal.value || showDetailModal.value
);

watch(anyModalOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

const savedCards       = ref<any[]>([]);
const selectedMethod   = ref('saved'); // 'saved' | 'new'
const selectedCardId   = ref<number | null>(null);

const paymentForm = ref({
  holder_name: '',
  card_number: '',
  expiry_date: '',
  cvv: '',
  save_card: true
});

// UX: Auto-formateo de Tarjeta (0000 0000 0000 0000)
watch(() => paymentForm.value.card_number, (val) => {
  let v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length > 16) v = v.substring(0, 16);
  const parts = v.match(/.{1,4}/g);
  paymentForm.value.card_number = parts ? parts.join(' ') : v;
});

// UX: Auto-formateo de Fecha (MM/YY)
watch(() => paymentForm.value.expiry_date, (val) => {
  let v = val.replace(/\D/g, '');
  if (v.length > 4) v = v.substring(0, 4);
  
  if (v.length > 2) {
    paymentForm.value.expiry_date = `${v.slice(0, 2)}/${v.slice(2)}`;
  } else {
    paymentForm.value.expiry_date = v;
  }
});
const lastPaymentResult = ref<any>(null);

const pendingContracts = computed(() =>
  contracts.value.filter(c => c.status === 'pending')
);

const displayPayments = computed(() => {
  // Generar "pagos virtuales" de contratos pendientes
  const virtuals = pendingContracts.value.map(c => ({
    id: `temp-${c.id}`,
    isVirtual: true,
    created_at: new Date().toISOString(),
    amount: c.deposit || c.monthly_price || 0,
    status: 'pending',
    type: 'deposit',
    contract: c
  }));

  // Combinar: Virtuales (Acción Requerida) siempre de PRIMERO ABSOLUTO
  // El contrato pendiente será el índice [0] de la lista mostrada en la página 1.
  return [...virtuals, ...payments.value];
});

const filteredPayments = computed(() => {
  if (!statusFilter.value) return displayPayments.value;
  
  return displayPayments.value.filter(p => {
    if (statusFilter.value === 'pending') {
      return p.status === 'pending';
    }
    // Para otros estados (completed, failed, etc)
    return p.status === statusFilter.value;
  });
});

const pendingCount = computed(() =>
  displayPayments.value.filter(p => p.status === 'pending').length
);

onMounted(() => {
  fetchPayments();
  fetchContracts();
  fetchPaymentMethods();
});

const fetchPayments = async () => {
  loading.value = true;
  try {
    const params: any = { page: currentPage.value };
    if (searchQuery.value) params.search = searchQuery.value;
    
    // Si el filtro es 'pending', no lo enviamos al backend para que nos traiga 
    // todos los registros y nosotros podamos mostrar los virtuales + reales mezclados.
    if (statusFilter.value && statusFilter.value !== 'pending') {
      params.status = statusFilter.value;
    }

    const response = await api.get('/payments', { params });
    const resData = response.data;
    payments.value = resData.data ?? (Array.isArray(resData) ? resData : []);
    meta.value = resData.meta ?? { current_page: 1, last_page: 1 };
  } catch (err: any) {
    error(t('payments.alerts.fetchError'), 'Error');
  } finally {
    loading.value = false;
  }
};

const fetchContracts = async () => {
  try {
    const response = await api.get('/contracts');
    const rawContracts = response.data.data ?? [];
    
    // UX: Ordenar contratos para que los pendientes esten SIEMPRE de primero
    contracts.value = [...rawContracts].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return 0;
    });
  } catch (err) {
    console.error('Error fetching contracts:', err);
  }
};

const fetchPaymentMethods = async () => {
  try {
    const response = await api.get('/payment-methods');
    savedCards.value = response.data.data ?? [];
    if (savedCards.value.length > 0) {
      selectedCardId.value = savedCards.value.find(c => c.is_default)?.id || savedCards.value[0].id;
      selectedMethod.value = 'saved';
    } else {
      selectedMethod.value = 'new';
    }
  } catch (err) {
    console.error('Error fetching payment methods:', err);
  }
};

const resetPaymentForm = () => {
  paymentForm.value = {
    holder_name: '',
    card_number: '',
    expiry_date: '',
    cvv: '',
    save_card: true
  };
};

const openAddCardModal = () => {
  resetPaymentForm();
  isAddingCardOnly.value = true;
  selectedMethod.value = 'new';
  showManageMethodsModal.value = false;
  showPaymentModal.value = true;
};

const openPaymentModal = (contract: any) => {
  selectedContract.value = contract;
  isAddingCardOnly.value = false;
  showPaymentModal.value = true;
  resetPaymentForm();
};

const openDetailModal = (payment: any) => {
  selectedPayment.value = payment;
  showDetailModal.value = true;
};

const processPayment = async () => {
  if (selectedMethod.value === 'new') {
    if (!paymentForm.value.holder_name) {
      error(t('payments.alerts.validation.holder'), t('common.validation'));
      return;
    }
    const cleanNum = paymentForm.value.card_number.replace(/\s/g, '');
    if (!cleanNum || cleanNum.length < 15) {
      error(t('payments.alerts.validation.card'), t('common.validation'));
      return;
    }
    if (!paymentForm.value.cvv || (paymentForm.value.cvv.length < 3)) {
      error(t('payments.alerts.validation.cvv'), t('common.validation'));
      return;
    }
    if (!paymentForm.value.expiry_date || !/^\d{2}\/\d{2}$/.test(paymentForm.value.expiry_date)) {
      error(t('payments.alerts.validation.expiry'), t('common.validation'));
      return;
    }
  } else if (!isAddingCardOnly.value) {
    if (!selectedCardId.value) {
      error(t('payments.alerts.validation.savedCard'), t('common.validation'));
      return;
    }
  }

  isProcessing.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (isAddingCardOnly.value) {
      // SOLO GUARDAR TARJETA
      const lastFour = paymentForm.value.card_number.replace(/\s/g, '').slice(-4);
      
      await api.post('/payment-methods', {
        holder_name: paymentForm.value.holder_name,
        last_four: lastFour,
        expiry_date: paymentForm.value.expiry_date,
      });
      
      await fetchPaymentMethods();
      success(t('payments.alerts.cardSaved'), t('common.success'));
      showPaymentModal.value = false;
      showManageMethodsModal.value = true;
      return;
    }

    // FLUJO NORMAL DE PAGO
    const payload: any = {
      contract_id: selectedContract.value.id,
      amount: selectedContract.value.deposit || 0,
    };

    if (selectedMethod.value === 'saved') {
      const card = savedCards.value.find(c => c.id === selectedCardId.value);
      payload.payment_method_id = selectedCardId.value;
      payload.card_last_four = card?.last_four;
      payload.card_type = card?.type;
    } else {
      payload.card_last_four = paymentForm.value.card_number.replace(/\s/g, '').slice(-4);
      payload.card_type = 'card';

      if (paymentForm.value.save_card) {
        await api.post('/payment-methods', {
          holder_name: paymentForm.value.holder_name,
          last_four: payload.card_last_four,
          expiry_date: paymentForm.value.expiry_date,
        });
        await fetchPaymentMethods();
      }
    }

    const response = await api.post('/payments/simulate', payload);
    if (response.data.success) {
      // Solo activamos el contrato si está pendiente (este es el pago del depósito inicial)
      if (selectedContract.value.status === 'pending') {
        await api.put(`/contracts/${selectedContract.value.id}/accept`);
      }
      
      lastPaymentResult.value = {
        ...response.data.data,
        card_last_four: payload.card_last_four
      };
      
      success(t('payments.alerts.paymentSuccess'), '¡Excelente!');
      showPaymentModal.value = false;
      showSuccessModal.value = true;

      fetchPayments();
      fetchContracts();
    }
  } catch (err: any) {
    error(err.response?.data?.message || 'Error en la operación', 'Error');
  } finally {
    isProcessing.value = false;
  }
};

const generatePDFFromPayment = (p: any) => {
  if (!p) return;
  
  try {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [218, 156, 95]; // #da9c5f
    const textColor: [number, number, number] = [26, 14, 10]; // #1a0e0a

    doc.setFillColor(26, 14, 10);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RENTUS', 20, 25);
    doc.setFontSize(10);
    doc.text(t('payments.modals.detail.transactionId'), 20, 32);

    doc.setTextColor(218, 156, 95);
    doc.text(`ID: #${p.id}`, 190, 25, { align: 'right' });
    doc.text(`${t('payments.modals.detail.date')}: ${formatDate(p.created_at)}`, 190, 32, { align: 'right' });

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(t('payments.modals.detail.title'), 20, 55);

    autoTable(doc, {
      startY: 65,
      head: [[t('payments.table.headers.type'), t('payments.modals.detail.title')]],
      body: [
        [t('payments.modals.detail.status'), translateStatus(p.status).toUpperCase()],
        [t('payments.modals.detail.reference'), `#${p.contract_id || p.contract?.id}`],
        [t('payments.table.headers.property'), p.contract?.property?.title || 'Property'],
        [t('payments.modals.detail.method'), p.card_last_four ? `**** ${p.card_last_four}` : 'N/A'],
        ['Rentus S.A.S', 'Beneficiario'],
      ],
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(245, 245, 245);
    doc.rect(130, finalY, 60, 25, 'F');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('TOTAL PAGADO', 135, finalY + 10);
    doc.setFontSize(14);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(formatPrice(p.amount), 135, finalY + 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text('Este documento es un comprobante digital generado por Rentus.', 105, 280, { align: 'center' });

    doc.save(`Comprobante_Rentus_${p.id}.pdf`);
    success(t('payments.alerts.pdfSuccess'), 'Success');
  } catch (err) {
    error('Error generating PDF');
  }
};

const downloadReceipt = () => {
  generatePDFFromPayment(lastPaymentResult.value);
};

const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchPayments();
  }, 500);
};

const changePage = (page: number) => {
  currentPage.value = page;
  fetchPayments();
};

const deletePaymentMethod = (id: number) => {
  dangerAlert(
    t('payments.alerts.deleteMethodConfirm'),
    async () => {
      try {
        await api.delete(`/payment-methods/${id}`);
        success(t('payments.alerts.deleteMethodSuccess'), 'Success');
        fetchPaymentMethods();
      } catch (err) {
        error(t('payments.alerts.deleteMethodError'));
      }
    },
    () => {},
    {
      title: t('common.confirm'),
      confirmText: t('common.yes'),
      cancelText: t('common.no')
    }
  );
};

const formatPrice = (price: number) => {
  if (!price) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
  }).format(price);
};

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale.value, { dateStyle: 'medium' });
};

const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    pending: t('payments.status.pending'),
    paid: t('payments.status.paid'),
    failed: t('payments.status.failed'),
    refunded: t('payments.status.refunded')
  };
  return map[status?.toLowerCase()] || status;
};

const translateType = (type: string) => {
  const map: Record<string, string> = {
    rental: t('payments.type.rental'),
    deposit: t('payments.type.deposit'),
    fee: t('payments.type.fee'),
    maintenance: t('payments.type.maintenance')
  };
  return map[type?.toLowerCase()] || type;
};
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════
   USER PAYMENTS VIEW  —  pagos del arrendatario a sus contratos
   • padding-top: 65px  →  navbar fixed (height: 65px)
   • Paleta: #1a0e0a / #2e1d17 / #3b2416 + acento #da9c5f
   ══════════════════════════════════════════════════════════════ */

.pv-page {
  min-height: calc(100vh - 65px);
  padding-top: 65px;
  position: relative;
  overflow-x: hidden;
  background: linear-gradient(135deg, #1a0e0a 0%, #2e1d17 50%, #3b2416 100%);
}
.pv-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("https://i.pinimg.com/1200x/e2/d2/b7/e2d2b7877ffb88a68d6b72e5ea0bd965.jpg") center/cover no-repeat;
  opacity: 0.12;
  filter: blur(7px);
  pointer-events: none;
  z-index: 0;
}

/* Orbs */
.pv-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0; }
.pv-bg__orb { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.2; }
.pv-bg__orb--1 {
  width: 440px; height: 440px;
  background: radial-gradient(circle, rgba(218,156,95,0.45), transparent);
  top: -160px; right: -160px;
}
.pv-bg__orb--2 {
  width: 340px; height: 340px;
  background: radial-gradient(circle, rgba(184,121,31,0.3), transparent);
  bottom: -100px; left: -100px;
}

/* Shell */
.pv-shell {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 2rem 4rem;
}

/* ── Header ──────────────────────────────────────────────────── */
.pv-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.pv-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #da9c5f;
  margin-bottom: 0.6rem;
}
.ew-pip {
  display: block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #da9c5f;
  box-shadow: 0 0 8px rgba(218,156,95,0.7);
}
.pv-title {
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  font-weight: 800;
  color: #f0e5db;
  line-height: 1.15;
  margin: 0 0 0.4rem;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 15px rgba(218,156,95,0.3), 0 0 30px rgba(218,156,95,0.15);
}
.pv-title em { font-style: italic; color: #da9c5f; font-weight: 500; }
.pv-subtitle { font-size: 0.9rem; color: rgba(240,229,219,0.5); margin: 0; }

.pv-header__right { display: flex; align-items: center; gap: 1.5rem; flex-shrink: 0; }
.pv-actions { display: flex; align-items: center; gap: 1rem; }

.btn-manage-methods {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0.7rem 1.1rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(218,156,95,0.3);
  border-radius: 12px;
  color: #da9c5f;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-manage-methods:hover {
  background: rgba(218,156,95,0.1);
  border-color: #da9c5f;
  transform: translateY(-2px);
}

.btn-pay-now {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0.85rem 1.6rem;
  background: linear-gradient(135deg, #da9c5f 0%, #b8791f 100%);
  border: none;
  border-radius: 12px;
  color: #1a0e0a;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: 0 10px 20px rgba(218,156,95,0.25);
}
.btn-pay-now:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(218,156,95,0.35);
  filter: brightness(1.1);
}
.btn-pay-now:active { transform: translateY(-1px); }

.pv-counters {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1.2rem;
  background: linear-gradient(135deg, rgba(62,36,24,0.95), rgba(46,29,23,0.95));
  border: 1px solid rgba(218,156,95,0.25);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07);
}
.pv-counter { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.pv-counter__val { font-size: 1.35rem; font-weight: 800; color: #da9c5f; line-height: 1; }
.pv-counter__lbl {
  font-size: 0.63rem;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: rgba(240,229,219,0.35);
}
.pv-counter-sep { width: 1px; height: 28px; background: rgba(218,156,95,0.2); }

/* ── Panel ───────────────────────────────────────────────────── */
.pv-panel {
  background: linear-gradient(135deg, rgba(62,36,24,0.95), rgba(46,29,23,0.95));
  border: 1px solid rgba(218,156,95,0.2);
  border-radius: 18px;
  overflow: hidden;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
}

/* Toolbar */
.pv-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid rgba(218,156,95,0.12);
  flex-wrap: wrap;
}
.pv-search { position: relative; flex: 1; min-width: 240px; max-width: 420px; }
.pv-search__ico {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(240,229,219,0.3);
  pointer-events: none;
}
.pv-search input {
  width: 100%;
  padding: 0.68rem 0.9rem 0.68rem 2.5rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(218,156,95,0.2);
  border-radius: 9px;
  color: #f0e5db;
  font-family: inherit;
  font-size: 0.88rem;
  transition: all 0.2s;
}
.pv-search input::placeholder { color: rgba(240,229,219,0.28); }
.pv-search input:focus {
  outline: none;
  border-color: rgba(218,156,95,0.55);
  background: rgba(255,255,255,0.07);
  box-shadow: 0 0 0 3px rgba(218,156,95,0.08);
}
.pv-select {
  padding: 0.68rem 0.9rem;
  min-width: 175px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(218,156,95,0.2);
  border-radius: 9px;
  color: rgba(240,229,219,0.7);
  font-family: inherit;
  font-size: 0.83rem;
  cursor: pointer;
}
.pv-select:focus { outline: none; border-color: rgba(218,156,95,0.5); }
.pv-select option { background: #2e1d17; color: #f0e5db; }

/* States */
.pv-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 5rem 2rem;
  text-align: center;
}
.pv-spinner {
  width: 38px; height: 38px;
  border-radius: 50%;
  border: 2px solid rgba(218,156,95,0.2);
  border-top-color: #da9c5f;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.pv-empty-icon {
  width: 68px; height: 68px;
  border-radius: 50%;
  background: rgba(218,156,95,0.08);
  border: 1px solid rgba(218,156,95,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #da9c5f;
}
.pv-state h3 { font-size: 1.15rem; font-weight: 700; color: #f0e5db; margin: 0; }
.pv-state p { font-size: 0.85rem; color: rgba(240,229,219,0.4); max-width: 320px; margin: 0; line-height: 1.65; }

/* ── Tabla ───────────────────────────────────────────────────── */
.pv-table-wrap { overflow-x: auto; }
.pv-table { width: 100%; border-collapse: collapse; }
.pv-table thead tr { border-bottom: 1px solid rgba(218,156,95,0.15); }
.pv-table th {
  padding: 0.9rem 1.25rem;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(240,229,219,0.3);
  text-align: left;
  background: rgba(255,255,255,0.02);
}
.pv-row { border-bottom: 1px solid rgba(218,156,95,0.07); transition: all 0.25s ease; }
.pv-row:last-child { border-bottom: none; }
.pv-row:hover { background: rgba(218,156,95,0.05); }
.pv-row--clickable { cursor: pointer; }
.pv-row--clickable:hover { 
  background: rgba(255, 255, 255, 0.03);
  box-shadow: inset 2px 0 0 #da9c5f;
}

/* Fila Pendiente Resaltada */
.pv-row--pending {
  background: rgba(245, 158, 11, 0.08); /* Fondo ambar sutil */
  border-left: 3px solid #f59e0b;
}

.pv-row--pending:hover {
  background: rgba(245, 158, 11, 0.12);
}

.pv-row--pending td:first-child { padding-left: calc(1.25rem - 3px); }
.pv-table td {
  padding: 1rem 1.25rem;
  font-size: 0.87rem;
  color: rgba(240,229,219,0.65);
  vertical-align: middle;
}

/* Cells */
.cell-id    { font-weight: 700; color: rgba(240,229,219,0.3); font-size: 0.8rem; }
.cell-muted { color: rgba(240,229,219,0.45); font-size: 0.82rem; }
.cell-amount { font-weight: 700; color: #f0e5db; font-size: 0.92rem; }

.badge-new {
  background: #f59e0b;
  color: #1a0e0a;
  font-size: 0.6rem;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
}
.cell-type  { color: rgba(240,229,219,0.5); font-size: 0.84rem; }
.cell-contract {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #da9c5f;
  font-weight: 600;
  font-size: 0.84rem;
}
.contract-dot { width: 5px; height: 5px; border-radius: 50%; background: #da9c5f; flex-shrink: 0; }
.cell-na { color: rgba(240,229,219,0.2); }

/* Status */
.pay-status {
  display: inline-flex;
  align-items: center;
  padding: 0.22rem 0.8rem;
  border-radius: 100px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
}
.pay-status--completed, .pay-status--paid { background: rgba(46,204,113,0.12);  color: #2ecc71; border: 1px solid rgba(46,204,113,0.25); }
.pay-status--pending   { background: rgba(245,158,11,0.12);  color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
.pay-status--failed    { background: rgba(231,76,60,0.12);   color: #e74c3c; border: 1px solid rgba(231,76,60,0.25); }
.pay-status--refunded  { background: rgba(160,174,192,0.08); color: #94a3b8; border: 1px solid rgba(160,174,192,0.15); }

.pay-status--pulse {
  animation: status-pulse 1.5s infinite;
  box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
}

@keyframes status-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

.pv-row--virtual {
  background: linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, transparent 100%) !important;
  animation: row-glow 3s infinite alternate;
}

@keyframes row-glow {
  from { border-left-color: #f59e0b; background: rgba(245, 158, 11, 0.08); }
  to { border-left-color: #da9c5f; background: rgba(245, 158, 11, 0.18); }
}

/* Pagination */
.pv-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(218,156,95,0.1);
}
.pager-arrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(218,156,95,0.2);
  border-radius: 8px;
  color: rgba(240,229,219,0.45);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.pager-arrow:not(:disabled):hover {
  background: rgba(218,156,95,0.1);
  color: #da9c5f;
  border-color: rgba(218,156,95,0.4);
}
.pager-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
.pager-info { font-size: 0.82rem; color: rgba(240,229,219,0.3); }

/* ── MODALES (ESTILOS 2026) ─────────────────────────────────── */
.px-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 14, 10, 0.85);
  backdrop-filter: blur(12px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.px-modal-card {
  background: linear-gradient(165deg, rgba(62, 36, 24, 0.98), rgba(46, 29, 23, 0.98));
  border: 1px solid rgba(218, 156, 95, 0.25);
  border-radius: 28px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 40px 100px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.px-modal-header {
  padding: 1.8rem 2rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.px-modal-header h3 { font-size: 1.4rem; font-weight: 800; color: #f0e5db; margin: 0; }
.px-modal-header p { font-size: 0.85rem; color: rgba(218, 156, 95, 0.6); margin: 0.2rem 0 0; }

.btn-close {
  background: rgba(255,255,255,0.05);
  border: none;
  font-size: 1.5rem;
  color: rgba(240,229,219,0.5);
  width: 32px; height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-close:hover { background: rgba(255,255,255,0.1); color: #f0e5db; }

.px-modal-body {
  padding: 0 2rem 2rem;
  overflow-y: auto;
  max-height: 65vh;
}

.pay-summary {
  background: rgba(218, 156, 95, 0.08);
  border: 1px dashed rgba(218, 156, 95, 0.3);
  border-radius: 16px;
  padding: 1.2rem;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.summary-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(240,229,219,0.4); }
.summary-value { font-size: 1.8rem; font-weight: 900; color: #da9c5f; text-shadow: 0 0 15px rgba(218,156,95,0.3); }

.pay-methods-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 1.5rem;
  background: rgba(0,0,0,0.2);
  padding: 5px;
  border-radius: 14px;
}
.method-tab {
  padding: 0.65rem;
  border: none;
  background: transparent;
  color: rgba(240,229,219,0.5);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s;
}
.method-tab.active {
  background: rgba(218, 156, 95, 0.15);
  color: #da9c5f;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

.saved-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card-option {
  position: relative;
  cursor: pointer;
}
.card-option input { display: none; }
.card-option-content {
  padding: 1rem;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.2s;
}
.card-option input:checked + .card-option-content {
  background: rgba(218, 156, 95, 0.1);
  border-color: rgba(218, 156, 95, 0.4);
}
.card-brand-icon {
  width: 42px; height: 42px;
  background: rgba(240,229,219,0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #da9c5f;
}
.card-info { display: flex; flex-direction: column; }
.card-number { font-size: 0.95rem; font-weight: 700; color: #f0e5db; }
.card-expiry { font-size: 0.75rem; color: rgba(240,229,219,0.4); }
.card-badge {
  margin-left: auto;
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  background: #da9c5f;
  color: #1a0e0a;
  padding: 2px 6px;
  border-radius: 4px;
}

.new-card-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.rx-input-group { display: flex; flex-direction: column; gap: 8px; }
.rx-input-group label { font-size: 0.75rem; font-weight: 700; color: rgba(240,229,219,0.6); margin-left: 4px; }
.rx-input-group input {
  padding: 0.85rem 1rem;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(218, 156, 95, 0.2);
  border-radius: 12px;
  color: #f0e5db;
  font-size: 0.95rem;
  transition: all 0.2s;
}
.rx-input-group input:focus { border-color: #da9c5f; outline: none; background: rgba(0,0,0,0.35); }

.rx-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }

.input-with-icon { position: relative; }
.input-with-icon .input-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(240,229,219,0.3);
}

.rx-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.8rem;
  color: rgba(240,229,219,0.5);
  margin-top: 5px;
}
.rx-checkbox input { accent-color: #da9c5f; width: 16px; height: 16px; }

.px-modal-footer {
  padding: 1.5rem 2rem 2rem;
  display: flex;
  gap: 12px;
}
.btn-cancel {
  flex: 1;
  padding: 0.9rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: rgba(240,229,219,0.65);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover { background: rgba(255,255,255,0.1); }

.btn-submit {
  flex: 2;
  padding: 0.9rem;
  background: linear-gradient(135deg, #da9c5f 0%, #b8791f 100%);
  border: none;
  border-radius: 14px;
  color: #1a0e0a;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(218, 156, 95, 0.3); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.mini-spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(0,0,0,0.1);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Modal Éxito */
.success-card {
  text-align: center;
  padding: 1rem;
}
.success-icon-wrap {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}
.success-icon {
  width: 80px; height: 80px;
  background: rgba(46, 204, 113, 0.15);
  border: 2px solid #2ecc71;
  color: #2ecc71;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes pop-in { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.success-content h3 { font-size: 1.8rem; margin: 1.5rem 0 0.5rem; color: #f0e5db; }
.success-content p { color: rgba(240,229,219,0.5); font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }

.receipt-preview {
  background: rgba(0,0,0,0.2);
  border-radius: 18px;
  padding: 1.5rem;
  margin: 0 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.receipt-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: rgba(240,229,219,0.4);
}
.receipt-row strong { color: #f0e5db; }
.text-accent { color: #da9c5f !important; font-size: 1.1rem; }
.badge-success {
  background: rgba(46, 204, 113, 0.15);
  color: #2ecc71;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 0.7rem;
  text-transform: uppercase;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.px-modal-footer.dual { gap: 15px; }

.btn-receipt {
  flex: 1;
  padding: 0.9rem;
  background: rgba(218, 156, 95, 0.15);
  border: 1px solid rgba(218, 156, 95, 0.3);
  border-radius: 14px;
  color: #da9c5f;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-done {
  flex: 1;
  padding: 0.9rem;
  background: rgba(255,255,255,0.05);
  border: none;
  border-radius: 14px;
  color: #f0e5db;
  font-weight: 700;
  cursor: pointer;
}

.btn-done-full {
  width: 100%;
  padding: 1rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(218,156,95,0.2);
  border-radius: 14px;
  color: #f0e5db;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-done-full:hover { background: rgba(255,255,255,0.1); border-color: #da9c5f; }

/* Manage Methods Modal */
.methods-empty {
  padding: 3rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-icon-mini {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: rgba(240,229,219,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(240,229,219,0.2);
}
.methods-empty p { font-size: 0.9rem; color: rgba(240,229,219,0.4); margin: 0; }

.methods-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.method-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 1rem;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px;
  transition: all 0.2s;
}
.method-item:hover {
  background: rgba(218,156,95,0.05);
  border-color: rgba(218,156,95,0.2);
}
.method-brand {
  width: 40px; height: 40px;
  background: rgba(218,156,95,0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #da9c5f;
}
.method-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.method-number { font-size: 0.9rem; font-weight: 700; color: #f0e5db; }
.method-expiry { font-size: 0.75rem; color: rgba(240,229,219,0.4); }

.btn-delete-method {
  width: 34px; height: 34px;
  border-radius: 10px;
  background: rgba(231,76,60,0.1);
  border: 1px solid rgba(231,76,60,0.2);
  color: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-delete-method:hover {
  background: #e74c3c;
  color: #fff;
  transform: scale(1.05);
}

.btn-add-method-modal {
  flex: 1.5;
  padding: 0.9rem;
  background: rgba(218, 156, 95, 0.1);
  border: 1px solid rgba(218, 156, 95, 0.4);
  color: #da9c5f;
  font-weight: 800;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}
.btn-add-method-modal:hover {
  background: rgba(218, 156, 95, 0.2);
  transform: translateY(-2px);
}

.pv-search:focus-within .pv-search__ico {
  color: #da9c5f;
  transform: translateY(-50%) scale(1.2);
}
.pv-search:focus-within input {
  box-shadow: 0 0 20px rgba(218, 156, 95, 0.15);
}

/* Detail Modal Styles */
.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.detail-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(240, 229, 219, 0.35);
  font-weight: 700;
}
.detail-value {
  font-size: 2rem;
  font-weight: 900;
}
.detail-text {
  font-size: 0.95rem;
  color: #f0e5db;
  font-weight: 500;
}
.detail-method {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(218, 156, 95, 0.1);
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  color: #da9c5f;
  font-weight: 600;
}

.btn-receipt-full {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #da9c5f 0%, #b8791f 100%);
  border: none;
  border-radius: 14px;
  color: #1a0e0a;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-receipt-full:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(218, 156, 95, 0.4);
}

/* Animations */
.px-fade-enter-active, .px-fade-leave-active { transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.px-fade-enter-from, .px-fade-leave-to { opacity: 0; }
.px-fade-enter-active .px-modal-card { animation: slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }

@keyframes slide-up {
  from { transform: translateY(30px) scale(0.95); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 768px) {
  .pv-shell { padding: 2rem 1.25rem 3rem; }
  .pv-header { flex-direction: column; align-items: flex-start; }
  .pv-header__right { width: 100%; flex-direction: column; align-items: stretch; }
  .btn-pay-now { width: 100%; justify-content: center; }
}
@media (max-width: 600px) {
  .pv-shell { padding: 1.5rem 1rem 2.5rem; }
  .pv-counters { display: none; }
  .pv-search { max-width: none; }
  .pv-toolbar { flex-direction: column; align-items: stretch; }
  .pv-select { width: 100%; }
  .px-modal-card { border-radius: 0; position: fixed; bottom: 0; max-width: none; border-bottom: none; }
}
</style>