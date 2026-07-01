<template>
  <transition name="fade">
    <div v-if="open" class="overlay" @click.self="close">
      <transition name="modal">
        <div class="modal">
          <header class="modal-header">
            <div class="title-box">
              <h2>{{ t('visitRequest.title') }}</h2>
              <p class="subtitle">{{ property?.title }}</p>
            </div>
            <button class="btn-close" @click="close">✕</button>
          </header>

          <section class="modal-body">
            <!-- Imagen de la propiedad -->
            <div class="property-preview">
              <img :src="property?.image_url" :alt="property?.title" />
              <div class="property-info">
                <p class="address">📍 {{ property?.address }}</p>
                <p class="price">
                  💰 {{ formatPrice(property?.monthly_price) }}/{{ t('common.month') }}
                </p>
              </div>
            </div>

            <!-- Formulario -->
            <form @submit.prevent="submitRequest" class="request-form">
              <div class="form-group">
                <label>📅 {{ t('visitRequest.form.date') }}</label>
                <input v-model="form.requested_date" type="date" :min="minDate" class="input" required />
              </div>

              <div class="form-group">
                <label>🕐 {{ t('visitRequest.form.time') }}</label>
                <input v-model="form.requested_time" type="time" class="input" required />
              </div>

              <div class="info-box">
                <i class="fas fa-info-circle"></i>
                <div class="visit-instructions">
                  <p>{{ t('visitRequest.info') }}</p>
                  <p class="text-xs mt-1 opacity-80">
                    📅 Selecciona la fecha y hora en que deseas visitar la propiedad. 
                    El propietario recibirá tu solicitud y confirmará disponibilidad.
                  </p>
                </div>
              </div>

              <div class="actions">
                <button type="button" class="btn secondary" @click="close">
                  {{ t('common.cancel') }}
                </button>
                <button type="submit" class="btn primary" :disabled="loading">
                  <span v-if="!loading">{{ t('visitRequest.actions.send') }}</span>
                  <span v-else>{{ t('visitRequest.actions.sending') }}</span>
                </button>
              </div>
            </form>

            <!-- Mensaje de éxito -->
            <div v-if="success" class="success-message">
              <i class="fas fa-check-circle"></i>
              <p>{{ t('visitRequest.success') }}</p>
            </div>

            <!-- Mensaje de error -->
            <div v-if="error" class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              <p>{{ error }}</p>
            </div>
          </section>
        </div>
      </transition>
    </div>
  </transition>
</template>


<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { rentalRequestService } from "../../../services/rentalRequestService";
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();


interface Property {
  id: number;
  title: string;
  address: string;
  image_url: string;
  monthly_price: number;
}

const props = defineProps<{
  open: boolean;
  property: Property | null;
}>();

const emit = defineEmits(["close", "success", "visit-confirmed"]);

const form = ref({
  requested_date: "",
  requested_time: "",
});

const loading = ref(false);
const success = ref(false);
const error = ref("");

// Fecha mínima (hoy)
const minDate = computed(() => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
});



// Reset form when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      requested_date: "",
      requested_time: "",
    };
    success.value = false;
    error.value = "";
  }
});

const formatPrice = (price?: number) => {
  if (!price) return t('common.na', 'N/A');

  const currencyMap: Record<string, string> = {
    es: 'COP',
    en: 'USD'
  };

  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currencyMap[locale.value] || 'USD',
    minimumFractionDigits: 0
  }).format(price);
};


const submitRequest = async () => {
  if (!props.property) return;

  loading.value = true;
  error.value = "";

  try {
    await rentalRequestService.createRequest({
      property_id: props.property.id,
      requested_date: form.value.requested_date,
      requested_time: form.value.requested_time,
    });

    success.value = true;

    // ✅ Notificar al chat que la visita fue confirmada
    emit('visit-confirmed', {
      property: props.property,
      date:     form.value.requested_date,
      time:     form.value.requested_time,
    });

    setTimeout(() => {
      emit("success");
      close();
    }, 2000);
  } catch (err: any) {
    const backendCode = err.response?.data?.code;

    error.value = backendCode
      ? t(`visitRequest.errors.${backendCode}`)
      : t('visitRequest.errors.sendRequest');
  } finally {
    loading.value = false;
  }
};


const close = () => {
  emit("close");
};
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(25, 25, 25, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
}

.modal {
  width: 500px;
  max-height: 90vh;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 24px;
  background: #f9f9f9;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-box h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
}

.subtitle {
  font-size: 13px;
  color: #6d6d6d;
  margin-top: 4px;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #555;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #111;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.property-preview {
  margin-bottom: 24px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.property-preview img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.property-info {
  padding: 12px 16px;
  background: #f8f8f8;
}

.address {
  font-size: 14px;
  color: #555;
  margin: 0 0 6px;
}

.price {
  font-size: 16px;
  font-weight: 700;
  color: #2e7d32;
  margin: 0;
}

.request-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.input {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.info-box {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 8px;
  font-size: 13px;
  color: #1565c0;
}

.info-box i {
  font-size: 16px;
  margin-top: 2px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.secondary {
  background: #e0e0e0;
  color: #555;
}

.btn.secondary:hover {
  background: #d0d0d0;
}

.btn.primary {
  background: #3498db;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message,
.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  margin-top: 16px;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active {
  animation: pop 0.25s;
}

@keyframes pop {
  from {
    transform: scale(0.95);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .modal {
    width: 90%;
    max-width: 500px;
  }

  .actions {
    flex-direction: column;
  }
}
</style>