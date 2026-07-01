<template>
  <transition name="modal-fade">
    <div v-if="open" class="overlay" @click.self="close">
      <transition name="modal-scale">
        <div class="modal">
          <!-- Decorative particles -->
          <div class="particles">
            <div v-for="i in 6" :key="i" class="particle" :style="{ '--delay': i * 0.4 + 's' }"></div>
          </div>

          <!-- HEADER -->
          <header class="modal-header">
            <div class="header-content">
              <div class="icon-badge">
                <font-awesome-icon icon="home" class="header-icon" />
              </div>
              <div class="title-box">
                <h2>{{ t('requests.title') }}</h2>
                <p class="subtitle">{{ t('requests.subtitle') }}</p>
              </div>
            </div>
            <button class="btn-close" @click="close">
              <font-awesome-icon icon="times" />
            </button>
          </header>

          <!-- BODY -->
          <section class="modal-body">
            <!-- LOADING -->
            <div v-if="loading" class="loading">
              <div class="spinner-wrapper">
                <font-awesome-icon icon="spinner" class="spinner" spin />
              </div>
              <p>{{ t('requests.loading') }}</p>
            </div>

            <!-- SOLICITUDES -->
            <transition-group v-else-if="solicitudes.length > 0" name="request-list" tag="div"
              class="requests-container">
              <div class="request-item" v-for="solicitud in solicitudes" :key="solicitud.id">
                <div class="request-glow"></div>

                <!-- IMAGEN PROPIEDAD -->
                <div class="property-image">
                  <img :src="solicitud.property?.image_url" :alt="solicitud.property?.title" />
                  <div class="image-overlay">
                    <font-awesome-icon icon="home" />
                  </div>
                </div>

                <div class="request-details">
                  <!-- INFO PROPIEDAD -->
                  <div class="property-info">
                    <h4>{{ solicitud.property?.title }}</h4>
                    <p class="address">
                      <font-awesome-icon icon="map-marker-alt" class="icon-small" />
                      {{ solicitud.property?.address }}
                    </p>
                  </div>

                  <!-- INFO INQUILINO -->
                  <div class="tenant-info">
                    <div class="tenant-avatar-wrapper">
                      <img :src="solicitud.user?.photo || '/img/default.webp'" class="tenant-avatar"
                        :alt="solicitud.user?.name" />
                      <div class="avatar-ring"></div>
                    </div>
                    <div class="tenant-details">
                      <p class="tenant-name">{{ solicitud.user?.name }}</p>
                      <div class="rating">
                        <font-awesome-icon icon="star" class="star-icon" />
                        {{ solicitud.user?.rating || t('requests.rating.none') }}
                      </div>
                    </div>
                  </div>

                  <!-- FECHA SOLICITADA -->
                  <div class="date-info">
                    <div class="date-label">
                      <font-awesome-icon icon="calendar" class="icon-small" />
                      <span>{{ t('requests.property.requestedDate') }}</span>
                    </div>
                    <div class="date-value">
                      <span class="date">{{ formatDate(solicitud.requested_date) }}</span>
                      <span class="time">
                        <font-awesome-icon icon="clock" class="icon-tiny" />
                        {{ solicitud.requested_time }}
                      </span>
                    </div>
                  </div>

                  <!-- CONTRA-PROPUESTA -->
                  <div v-if="solicitud.status === 'counter_proposed' && solicitud.counter_date"
                    class="counter-proposal">
                    <div class="counter-header">
                      <font-awesome-icon icon="calendar-alt" class="counter-icon" />
                      <span class="counter-title">
                        {{ t('requests.property.proposedDate') }}
                      </span>
                    </div>
                    <div class="counter-value">
                      <span class="date">{{ formatDate(solicitud.counter_date) }}</span>
                      <span class="time">
                        <font-awesome-icon icon="clock" class="icon-tiny" />
                        {{ solicitud.counter_time }}
                      </span>
                    </div>
                  </div>

                  <!-- ESTADO -->
                  <div class="status-badge" :class="solicitud.status">
                    <span class="status-dot"></span>
                    {{ getStatusText(solicitud.status) }}
                  </div>

                  <!-- ACCIONES -->
                  <div class="actions">
                    <template v-if="solicitud.status === 'pending'">
                      <button class="btn success" @click="openReviewModal(solicitud)">
                        <font-awesome-icon icon="eye" />
                        <span>{{ t('requests.actions.review') }}</span>
                      </button>
                      <button class="btn danger" @click="rechazarDirecto(solicitud.id)">
                        <font-awesome-icon icon="times" />
                        <span>{{ t('requests.actions.reject') }}</span>
                      </button>
                    </template>

                    <template v-else-if="solicitud.status === 'accepted'">
                      <div v-if="isVisitPassed(solicitud)" class="actions-full">
                        <button class="btn primary-full" @click="openContractModal(solicitud)">
                          <font-awesome-icon icon="check-circle" />
                          <span>{{ t('requests.actions.continue') }}</span>
                        </button>
                        <button class="btn danger-outline" @click="finalizarProceso(solicitud.id)">
                          <font-awesome-icon icon="times-circle" />
                          <span>{{ t('requests.actions.finish') }}</span>
                        </button>
                      </div>
                      <div v-else class="info-message">
                        <font-awesome-icon icon="clock" class="info-icon" />
                        <span>
                          {{ t('requests.messages.visitScheduled', {
                            date: formatDate(solicitud.requested_date),
                            time: solicitud.requested_time
                          }) }}
                        </span>
                      </div>
                    </template>

                    <template v-else-if="solicitud.status === 'counter_proposed'">
                      <div class="info-message pending">
                        <font-awesome-icon icon="spinner" class="info-icon" spin />
                        <span>{{ t('requests.messages.waitingTenant') }}</span>
                      </div>
                    </template>

                    <template v-else-if="solicitud.status === 'rejected'">
                      <div class="info-message rejected">
                        <font-awesome-icon icon="times-circle" class="info-icon" />
                        <span>{{ t('requests.messages.requestRejected') }}</span>
                      </div>
                    </template>

                    <template v-else-if="solicitud.status === 'contract_sent'">
                      <div class="info-message success">
                        <font-awesome-icon icon="file-alt" class="info-icon" />
                        <span>{{ t('requests.messages.contractWaiting') }}</span>
                      </div>
                    </template>

                    <template v-else-if="solicitud.status === 'visit_completed'">
                      <div class="info-message">
                        <font-awesome-icon icon="check" class="info-icon" />
                        <span>{{ t('requests.messages.visitCompleted') }}</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </transition-group>

            <!-- VACÍO -->
            <div v-else class="empty">
              <div class="empty-icon-wrapper">
                <font-awesome-icon icon="home" class="empty-icon" />
                <div class="empty-circle"></div>
              </div>
              <h3>{{ t('requests.empty.title') }}</h3>
              <p>{{ t('requests.empty.description') }}</p>
            </div>
          </section>
        </div>
      </transition>
  <!-- MODAL DE REVISIÓN -->
      <transition name="modal-fade">
        <div v-if="showReviewModal" class="overlay overlay-nested" @click.self="closeReviewModal">
          <transition name="modal-scale">
            <div class="review-modal">
              <div class="modal-particles">
                <div v-for="i in 4" :key="i" class="particle" :style="{ '--delay': i * 0.5 + 's' }"></div>
              </div>

              <header class="modal-header secondary">
                <div class="header-content">
                  <div class="icon-badge secondary">
                    <font-awesome-icon icon="search" />
                  </div>
                  <div class="title-box">
                    <h3>Revisar Solicitud</h3>
                  </div>
                </div>
                <button class="btn-close" @click="closeReviewModal">
                  <font-awesome-icon icon="times" />
                </button>
              </header>

              <div class="review-content" v-if="selectedRequest">
                <div class="review-property">
                  <div class="property-img-wrapper">
                    <img :src="selectedRequest.property?.image_url" />
                    <div class="img-overlay"></div>
                  </div>
                  <div class="property-text">
                    <h4>{{ selectedRequest.property?.title }}</h4>
                    <p>
                      <font-awesome-icon icon="map-marker-alt" class="icon-small" />
                      {{ selectedRequest.property?.address }}
                    </p>
                  </div>
                </div>

                <div class="review-tenant">
                  <div class="tenant-img-wrapper">
                    <img :src="selectedRequest.user?.photo || '/img/default.webp'" />
                    <div class="tenant-ring"></div>
                  </div>
                  <div class="tenant-text">
                    <p class="name">{{ selectedRequest.user?.name }}</p>
                    <p class="rating">
                      <font-awesome-icon icon="star" />
                      {{ selectedRequest.user?.rating || 'N/A' }}
                    </p>
                    <p class="contact">
                      <font-awesome-icon icon="envelope" class="icon-tiny" />
                      {{ selectedRequest.user?.email }}
                    </p>
                    <p class="contact">
                      <font-awesome-icon icon="phone" class="icon-tiny" />
                      {{ selectedRequest.user?.phone }}
                    </p>
                  </div>
                </div>

                <div class="review-date">
                  <div class="date-header">
                    <font-awesome-icon icon="calendar-check" />
                    <strong>Fecha solicitada</strong>
                  </div>
                  <p class="date-detail">
                    <font-awesome-icon icon="calendar" class="icon-small" />
                    {{ formatDate(selectedRequest.requested_date) }}
                  </p>
                  <p class="date-detail">
                    <font-awesome-icon icon="clock" class="icon-small" />
                    {{ selectedRequest.requested_time }}
                  </p>
                </div>

                <div class="review-actions">
                  <button class="btn success-full" @click="aceptarSolicitud">
                    <font-awesome-icon icon="check" />
                    <span>Aceptar solicitud</span>
                  </button>
                  <button class="btn warning-full" @click="toggleCounterForm">
                    <font-awesome-icon icon="calendar-alt" />
                    <span>{{ showCounterForm ? 'Cancelar propuesta' : 'Proponer otra fecha' }}</span>
                  </button>
                  <button class="btn danger-full" @click="rechazarSolicitud">
                    <font-awesome-icon icon="times" />
                    <span>Rechazar solicitud</span>
                  </button>
                </div>

                <!-- FORMULARIO CONTRA-PROPUESTA -->
                <transition name="fade">
                  <div v-if="showCounterForm" class="counter-form">
                    <div class="form-header">
                      <font-awesome-icon icon="calendar-alt" class="form-icon" />
                      <h4>Proponer nueva fecha y hora</h4>
                    </div>
                    <div class="form-group">
                      <label>
                        <font-awesome-icon icon="calendar" class="label-icon" />
                        Nueva fecha
                      </label>
                      <input type="date" v-model="counterDate" :min="getTodayDate()" />
                    </div>
                    <div class="form-group">
                      <label>
                        <font-awesome-icon icon="clock" class="label-icon" />
                        Nueva hora
                      </label>
                      <input type="time" v-model="counterTime" />
                    </div>
                    <div class="form-actions">
                      <button class="btn primary" @click="enviarContraPropuesta">
                        <font-awesome-icon icon="paper-plane" />
                        <span>Enviar propuesta</span>
                      </button>
                      <button class="btn secondary" @click="showCounterForm = false">
                        <font-awesome-icon icon="times" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </transition>
        </div>
      </transition>

      <!-- MODAL DE CONTRATO -->
      <transition name="modal-fade">
        <div v-if="showContractModal" class="overlay overlay-nested" @click.self="closeContractModal">
          <transition name="modal-scale">
            <div class="contract-modal">
              <div class="modal-particles">
                <div v-for="i in 4" :key="i" class="particle" :style="{ '--delay': i * 0.5 + 's' }"></div>
              </div>

              <header class="modal-header tertiary">
                <div class="header-content">
                  <div class="icon-badge tertiary">
                    <font-awesome-icon icon="file-alt" />
                  </div>
                  <div class="title-box">
                    <h3>Enviar Términos del Contrato</h3>
                  </div>
                </div>
                <button class="btn-close" @click="closeContractModal">
                  <font-awesome-icon icon="times" />
                </button>
              </header>

              <div class="contract-content" v-if="selectedRequest">
                <div class="contract-section">
                  <div class="section-title">
                    <font-awesome-icon icon="calendar-check" />
                    <span>Período del contrato</span>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>
                        <font-awesome-icon icon="calendar" class="label-icon" />
                        Fecha de inicio
                      </label>
                      <input type="date" v-model="contractData.start_date" :min="getTodayDate()" />
                    </div>
                    <div class="form-group">
                      <label>
                        <font-awesome-icon icon="calendar" class="label-icon" />
                        Fecha de finalización
                      </label>
                      <input type="date" v-model="contractData.end_date" :min="contractData.start_date" />
                    </div>
                  </div>
                </div>

                <div class="contract-section">
                  <div class="section-title">
                    <font-awesome-icon icon="dollar-sign" />
                    <span>Información financiera</span>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>
                        <font-awesome-icon icon="dollar-sign" class="label-icon" />
                        Precio mensual ($)
                      </label>
                      <input type="number" v-model.number="contractData.monthly_price"
                        :placeholder="selectedRequest.property?.monthly_price" />
                    </div>
                    <div class="form-group">
                      <label>
                        <font-awesome-icon icon="shield-alt" class="label-icon" />
                        Depósito/Garantía ($)
                      </label>
                      <input type="number" v-model.number="contractData.deposit" />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>
                        <font-awesome-icon icon="calendar-check" class="label-icon" />
                        Día de pago (1-31)
                      </label>
                      <input type="number" v-model.number="contractData.payment_day" min="1" max="31" />
                    </div>
                    <div class="form-group">
                      <label>
                        <font-awesome-icon icon="exclamation-triangle" class="label-icon" />
                        Multa por retraso ($)
                      </label>
                      <input type="number" v-model.number="contractData.late_fee" />
                    </div>
                  </div>
                </div>

                <div class="contract-section">
                  <div class="section-title">
                    <font-awesome-icon icon="list-check" />
                    <span>Servicios y términos</span>
                  </div>
                  <div class="form-group">
                    <label>
                      <font-awesome-icon icon="lightbulb" class="label-icon" />
                      Servicios incluidos
                    </label>
                    <input type="text" v-model="utilitiesInput" placeholder="Agua, Luz, Internet, Gas" />
                    <span class="input-hint">Separados por coma</span>
                  </div>
                  <div class="form-group">
                    <label>
                      <font-awesome-icon icon="file-alt" class="label-icon" />
                      Cláusulas del contrato
                    </label>
                    <textarea v-model="clausesInput" rows="5"
                      placeholder="Ejemplo: No se permiten mascotas, No fumar dentro del inmueble, etc."></textarea>
                    <span class="input-hint">Una por línea</span>
                  </div>
                  <div class="form-group">
                    <label>
                      <font-awesome-icon icon="info-circle" class="label-icon" />
                      Condiciones especiales (opcional)
                    </label>
                    <textarea v-model="contractData.special_conditions" rows="3"
                      placeholder="Condiciones adicionales..."></textarea>
                  </div>
                </div>

                <div class="form-actions">
                  <button class="btn success-full" @click="enviarContrato">
                    <font-awesome-icon icon="paper-plane" />
                    <span>Enviar contrato</span>
                  </button>
                  <button class="btn secondary" @click="closeContractModal">
                    <font-awesome-icon icon="times" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </div>
  </transition>
</template>


<script setup>
import { ref, watch } from "vue";
import { rentalRequestService } from "../../../services/rentalRequestService";
import { useAlerts } from "../../../composables/useAlerts";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  open: Boolean,
});

const emit = defineEmits(["close"]);

const { success, error, confirm } = useAlerts();

// Bloquear scroll del body cuando el modal está abierto
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

// Cleanup al desmontar
import { onUnmounted } from 'vue';
onUnmounted(() => {
  document.body.style.overflow = '';
});

// STATE
const solicitudes = ref([]);
const loading = ref(false);
const showReviewModal = ref(false);
const showCounterForm = ref(false);
const showContractModal = ref(false);
const selectedRequest = ref(null);

// Bloquear scroll también para modales anidados
watch([showReviewModal, showContractModal], ([review, contract]) => {
  if (review || contract) {
    document.body.style.overflow = 'hidden';
  } else if (props.open) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

// CONTRA-PROPUESTA
const counterDate = ref("");
const counterTime = ref("");

// CONTRATO
const contractData = ref({
  start_date: "",
  end_date: "",
  monthly_price: 0,
  deposit: 0,
  payment_day: 1,
  late_fee: 0,
  special_conditions: ""
});
const utilitiesInput = ref("");
const clausesInput = ref("");

// MÉTODOS
const close = () => emit("close");

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await loadRequests();
  }
});

const loadRequests = async () => {
  loading.value = true;
  try {
    solicitudes.value = await rentalRequestService.getOwnerRequests();
  } catch (err) {
    console.error("Error cargando solicitudes:", err);
    error("Error al cargar las solicitudes", "Error");
  } finally {
    loading.value = false;
  }
};

const isVisitPassed = (solicitud) => {
  if (!solicitud.visit_end_time) return false;
  const visitEndUTC = new Date(solicitud.visit_end_time + "Z");
  const now = new Date();
  return now >= visitEndUTC;
};

const openReviewModal = (solicitud) => {
  selectedRequest.value = solicitud;
  showReviewModal.value = true;
  showCounterForm.value = false;
  counterDate.value = "";
  counterTime.value = "";
};

const closeReviewModal = () => {
  showReviewModal.value = false;
  selectedRequest.value = null;
  showCounterForm.value = false;
};

const toggleCounterForm = () => {
  showCounterForm.value = !showCounterForm.value;

  // Scroll suave al formulario cuando se abre
  if (showCounterForm.value) {
    setTimeout(() => {
      const formElement = document.querySelector('.counter-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  }
};

const aceptarSolicitud = async () => {
  if (!selectedRequest.value) return;

  try {
    await rentalRequestService.acceptRequest(selectedRequest.value.id);
    success("Solicitud aceptada correctamente", "¡Éxito!");
    closeReviewModal();
    await loadRequests();
  } catch (err) {
    console.error("Error aceptando solicitud:", err);
    error("Error al aceptar la solicitud", "Error");
  }
};

const rechazarSolicitud = async () => {
  if (!selectedRequest.value) return;

  confirm(
    "¿Estás seguro de rechazar esta solicitud?",
    async () => {
      try {
        await rentalRequestService.rejectRequest(selectedRequest.value.id);
        success("Solicitud rechazada", "Proceso completado");
        closeReviewModal();
        await loadRequests();
      } catch (err) {
        console.error("Error rechazando solicitud:", err);
        error("Error al rechazar la solicitud", "Error");
      }
    },
    undefined,
    {
      title: "Confirmar rechazo",
      confirmText: "Sí, rechazar",
      cancelText: "Cancelar"
    }
  );
};

const rechazarDirecto = async (requestId) => {
  confirm(
    "¿Rechazar esta solicitud sin revisarla?",
    async () => {
      try {
        await rentalRequestService.rejectRequest(requestId);
        success("Solicitud rechazada", "Proceso completado");
        await loadRequests();
      } catch (err) {
        console.error("Error rechazando solicitud:", err);
        error("Error al rechazar la solicitud", "Error");
      }
    },
    undefined,
    {
      title: "Confirmar rechazo",
      confirmText: "Sí, rechazar",
      cancelText: "Cancelar"
    }
  );
};

const enviarContraPropuesta = async () => {
  if (!counterDate.value || !counterTime.value) {
    error("Por favor selecciona fecha y hora", "Campos requeridos");
    return;
  }

  try {
    await rentalRequestService.counterPropose(selectedRequest.value.id, {
      counter_date: counterDate.value,
      counter_time: counterTime.value
    });
    success("Contra-propuesta enviada correctamente", "¡Éxito!");
    closeReviewModal();
    await loadRequests();
  } catch (err) {
    console.error("Error enviando contra-propuesta:", err);
    error("Error al enviar contra-propuesta", "Error");
  }
};

const openContractModal = (solicitud) => {
  selectedRequest.value = solicitud;

  contractData.value = {
    start_date: "",
    end_date: "",
    monthly_price: solicitud.property?.monthly_price || 0,
    deposit: (solicitud.property?.monthly_price || 0) * 2,
    payment_day: 1,
    late_fee: 50,
    special_conditions: ""
  };

  utilitiesInput.value = "Agua, Luz, Gas";
  clausesInput.value = `El arrendatario se compromete a pagar el canon de arrendamiento en la fecha establecida.
El arrendatario debe mantener el inmueble en buen estado.
El arrendador debe garantizar el goce pacífico del inmueble.
Cualquier modificación al contrato debe hacerse por escrito.
El incumplimiento de las obligaciones podrá dar lugar a la terminación del contrato.`;

  showContractModal.value = true;
};

const closeContractModal = () => {
  showContractModal.value = false;
  selectedRequest.value = null;
};

const enviarContrato = async () => {
  if (!contractData.value.start_date || !contractData.value.end_date) {
    error("Por favor completa las fechas del contrato", "Campos requeridos");
    return;
  }

  if (contractData.value.monthly_price <= 0) {
    error("El precio mensual debe ser mayor a 0", "Precio inválido");
    return;
  }

  try {
    const utilities = utilitiesInput.value
      .split(",")
      .map(u => u.trim())
      .filter(u => u.length > 0);

    let clauses = clausesInput.value
      .split("\n")
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (clauses.length === 0) {
      clauses = [
        "El arrendatario se compromete a pagar el canon de arrendamiento en la fecha establecida.",
        "El arrendatario debe mantener el inmueble en buen estado.",
        "El arrendador debe garantizar el goce pacífico del inmueble.",
        "Cualquier modificación al contrato debe hacerse por escrito.",
        "El incumplimiento de las obligaciones podrá dar lugar a la terminación del contrato."
      ];
    }

    const payload = {
      rental_request_id: selectedRequest.value.id,
      property_id: selectedRequest.value.property_id,
      tenant_id: selectedRequest.value.user_id,
      landlord_id: selectedRequest.value.owner_id,
      start_date: contractData.value.start_date,
      end_date: contractData.value.end_date,
      monthly_price: parseFloat(contractData.value.monthly_price),
      deposit: parseFloat(contractData.value.deposit),
      clauses: clauses,
      payment_day: parseInt(contractData.value.payment_day),
      late_fee: parseFloat(contractData.value.late_fee),
      utilities_included: utilities,
      special_conditions: contractData.value.special_conditions || ""
    };

    await rentalRequestService.sendContractTerms(payload);
    success("Contrato enviado correctamente al inquilino", "¡Éxito!");
    closeContractModal();
    await loadRequests();
  } catch (err) {
    console.error("Error enviando contrato:", err);

    if (err.response?.data?.message) {
      error(err.response.data.message, "Error");
    } else if (err.response?.data?.errors) {
      const errors = Object.values(err.response.data.errors).flat();
      error(errors.join('\n'), "Errores de validación");
    } else {
      error("Error al enviar el contrato", "Error");
    }
  }
};

const finalizarProceso = async (requestId) => {
  confirm(
    "¿Finalizar el proceso sin generar contrato?",
    async () => {
      try {
        await rentalRequestService.rejectRequest(requestId);
        success("Proceso finalizado", "Completado");
        await loadRequests();
      } catch (err) {
        console.error("Error finalizando proceso:", err);
        error("Error al finalizar el proceso", "Error");
      }
    },
    undefined,
    {
      title: "Confirmar finalización",
      confirmText: "Sí, finalizar",
      cancelText: "Cancelar"
    }
  );
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const getStatusText = (status) => {
  return t(`requests.status.${status}`, status);
};


const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};
</script>

<style scoped>
@import "../../../assets/css/components/RequestsView.css";
</style>