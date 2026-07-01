<template>
  <transition name="modal-fade">
    <div v-if="open" class="overlay" @click.self="close">
      <transition name="modal-scale">
        <div class="modal">
          <!-- Decorative particles -->
          <div class="particles">
            <div v-for="i in 6" :key="i" class="particle" :style="{ '--delay': i * 0.4 + 's' }"></div>
          </div>

          <header class="modal-header">
            <div class="header-content">
              <div class="icon-badge">
                <font-awesome-icon icon="calendar-check" class="header-icon" />
              </div>
              <div class="title-box">
                <h2>{{ $t('myVisits.title') }}</h2>
                <p class="subtitle">{{ $t('myVisits.subtitle') }}</p>
              </div>
            </div>
            <button class="btn-close" @click="close">
              <font-awesome-icon icon="times" />
            </button>
          </header>

          <section class="modal-body">
            <!-- Loading -->
            <div v-if="loading" class="loading">
              <div class="spinner-wrapper">
                <font-awesome-icon icon="spinner" class="spinner" spin />
              </div>
              <p>{{ $t('myVisits.loading') }}</p>
            </div>

            <!-- Solicitudes -->
            <transition-group v-else-if="solicitudes.length > 0" name="request-list" tag="div"
              class="requests-container">
              <div class="request-item" v-for="solicitud in solicitudes" :key="solicitud.id">
                <div class="request-glow"></div>

                <!-- Imagen de la propiedad -->
                <div class="property-image">
                  <img :src="solicitud.property?.image_url" :alt="solicitud.property?.title" />
                  <div class="image-overlay">
                    <font-awesome-icon icon="home" />
                  </div>
                </div>

                <div class="request-details">
                  <!-- Info de la propiedad -->
                  <div class="property-info">
                    <h4>{{ solicitud.property?.title }}</h4>
                    <p class="address">
                      <font-awesome-icon icon="map-marker-alt" class="icon-small" />
                      {{ solicitud.property?.address }}
                    </p>
                  </div>

                  <!-- Fecha solicitada -->
                  <div class="date-info">
                    <div class="date-label">
                      <font-awesome-icon icon="calendar" class="icon-small" />
                      <span>{{ $t('myVisits.requestedDate') }}</span>
                    </div>
                    <div class="date-value">
                      <span class="date">{{ formatDate(solicitud.requested_date) }}</span>
                      <span class="time">
                        <font-awesome-icon icon="clock" class="icon-tiny" />
                        {{ solicitud.requested_time }}
                      </span>
                    </div>
                  </div>

                  <!-- Contra-propuesta (si existe) -->
                  <div v-if="solicitud.status === 'counter_proposed'" class="counter-proposal">
                    <div class="counter-header">
                      <font-awesome-icon icon="calendar-alt" class="counter-icon" />
                      <span class="counter-title">
                        {{ $t('myVisits.counterProposedByOwner') }}
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

                  <!-- Estado -->
                  <div class="status-badge" :class="solicitud.status">
                    <span class="status-dot"></span>
                    {{ getStatusText(solicitud.status) }}
                  </div>

                  <!-- Acciones según estado -->
                  <div class="actions">
                    <!-- Contra-propuesta pendiente -->
                    <template v-if="solicitud.status === 'counter_proposed'">
                      <button class="btn success" @click="acceptCounter(solicitud.id)">
                        <font-awesome-icon icon="check" />
                        <span>{{ $t('myVisits.actions.acceptNewDate') }}</span>
                      </button>
                      <button class="btn danger" @click="rejectCounter(solicitud.id)">
                        <font-awesome-icon icon="times" />
                        <span>{{ $t('common.reject') }}</span>
                      </button>
                    </template>

                    <!-- Aceptada - Esperando visita -->
                    <template v-else-if="solicitud.status === 'accepted'">
                      <div class="info-message success">
                        <font-awesome-icon icon="check-circle" class="info-icon" />
                        <span>{{ $t('myVisits.messages.visitConfirmed') }}</span>
                      </div>
                    </template>

                    <!-- Contrato enviado -->
                    <template v-else-if="solicitud.status === 'contract_sent'">
                      <button class="btn primary-full" @click="viewContract(solicitud)">
                        <font-awesome-icon icon="file-alt" />
                        <span>{{ $t('myVisits.actions.viewContract') }}</span>
                      </button>
                    </template>

                    <!-- Rechazada -->
                    <template v-else-if="solicitud.status === 'rejected'">
                      <div class="info-message rejected">
                        <font-awesome-icon icon="times-circle" class="info-icon" />
                        <span>{{ $t('myVisits.messages.requestRejected') }}</span>
                      </div>
                    </template>

                    <!-- Pendiente -->
                    <template v-else-if="solicitud.status === 'pending'">
                      <div class="info-message pending">
                        <font-awesome-icon icon="clock" class="info-icon" />
                        <span>{{ $t('myVisits.messages.waitingOwner') }}</span>
                      </div>
                      <button class="btn danger-outline" @click="cancelRequest(solicitud.id)">
                        <font-awesome-icon icon="ban" />
                        <span>{{ $t('myVisits.actions.cancelRequest') }}</span>
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </transition-group>

            <!-- Vacío -->
            <div v-else class="empty">
              <div class="empty-icon-wrapper">
                <font-awesome-icon icon="calendar-check" class="empty-icon" />
                <div class="empty-circle"></div>
              </div>
              <h3>{{ $t('myVisits.empty.title') }}</h3>
              <p>{{ $t('myVisits.empty.description') }}</p>
              <button class="btn primary-cta" @click="goToProperties">
                <font-awesome-icon icon="search" />
                <span>{{ $t('myVisits.actions.searchProperties') }}</span>
              </button>
            </div>
          </section>
        </div>
      </transition>
    </div>
  </transition>
</template>


<script setup>
import { ref, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { rentalRequestService } from "../../../services/rentalRequestService";
import { useAlerts } from "../../../composables/useAlerts";
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();


const props = defineProps({
  open: Boolean
});

const emit = defineEmits(["close", "view-contract"]);
const router = useRouter();
const { success, error, confirm } = useAlerts();

const solicitudes = ref([]);
const loading = ref(false);

const close = () => emit("close");

// Bloquear scroll del body cuando el modal está abierto
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
    loadRequests();
  } else {
    document.body.style.overflow = '';
  }
});

// Cleanup al desmontar
onUnmounted(() => {
  document.body.style.overflow = '';
});

const loadRequests = async () => {
  loading.value = true;
  try {
    solicitudes.value = await rentalRequestService.getMyRequests();
  } catch (err) {
    console.error("Error cargando solicitudes:", err);
    error("Error al cargar tus solicitudes", "Error");
  } finally {
    loading.value = false;
  }
};

// Aceptar contra-propuesta
const acceptCounter = async (requestId) => {
  try {
    await rentalRequestService.acceptCounterProposal(requestId);
    success("Nueva fecha aceptada correctamente", "¡Confirmado!");
    await loadRequests();
  } catch (err) {
    console.error("Error aceptando contra-propuesta:", err);
    error("Error al aceptar la nueva fecha", "Error");
  }
};

// Rechazar contra-propuesta
const rejectCounter = async (requestId) => {
  confirm(
    "¿Rechazar la fecha propuesta por el dueño?",
    async () => {
      try {
        await rentalRequestService.rejectCounterProposal(requestId);
        success("Contra-propuesta rechazada", "Completado");
        await loadRequests();
      } catch (err) {
        console.error("Error rechazando contra-propuesta:", err);
        error("Error al rechazar la propuesta", "Error");
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

// Cancelar solicitud
const cancelRequest = async (requestId) => {
  confirm(
    "¿Cancelar esta solicitud de visita?",
    async () => {
      try {
        await rentalRequestService.cancelRequest(requestId);
        success("Solicitud cancelada", "Completado");
        await loadRequests();
      } catch (err) {
        console.error("Error cancelando solicitud:", err);
        error("Error al cancelar la solicitud", "Error");
      }
    },
    undefined,
    {
      title: "Confirmar cancelación",
      confirmText: "Sí, cancelar",
      cancelText: "No, mantener"
    }
  );
};

// Ver contrato
const viewContract = (request) => {
  close();
  emit("view-contract", request);
  router.push("/contratos");
};

// Ir a propiedades
const goToProperties = () => {
  close();
  router.push("/propiedades");
};

// Utilidades
const formatDate = (date) => {
  if (!date) return t('common.na', 'N/A');

  return new Date(date).toLocaleDateString(locale.value, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};


const getStatusText = (status) => {
  const map = {
    pending: "Pendiente",
    accepted: "Aceptada",
    rejected: "Rechazada",
    counter_proposed: "Nueva fecha propuesta",
    visit_completed: "Visita completada",
    contract_sent: "Contrato enviado"
  };
  return map[status] || status;
};
</script>

<style scoped>
@import "../../../assets/css/components/MyRequestsModal.css";
</style>