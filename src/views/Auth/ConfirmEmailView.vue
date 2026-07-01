<template>
  <div class="background-layer" aria-hidden="true">
    <canvas ref="canvasEl" class="bg-canvas"></canvas>
  </div>

  <div class="auth-container">
    <div class="content-wrapper confirm-wrapper">

      <!-- Confirm Email Form -->
      <div class="floating-form-modal confirm-modal">
        <div class="form-container">
          <!-- Success Icon -->
          <div class="success-icon-wrapper">
            <div class="icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mail-icon">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 7 10 7 10-7" />
              </svg>
            </div>
          </div>

          <div class="form-header">
            <h2 class="form-title">Verifica tu correo</h2>
            <p class="form-subtitle">
              Hemos enviado un código de 6 dígitos a<br />
              <strong>{{ userEmail }}</strong>
            </p>
          </div>

          <!-- Alert Messages -->
          <transition name="fade">
            <div v-if="successMessage" class="alert-success" role="alert">
              <svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span class="alert-text">{{ successMessage }}</span>
            </div>
          </transition>

          <transition name="fade">
            <div v-if="errorMessage" class="alert-error" role="alert">
              <svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span class="alert-text">{{ errorMessage }}</span>
            </div>
          </transition>

          <!-- OTP Input -->
          <form @submit.prevent="handleVerify" novalidate>
            <div class="otp-container">
              <label class="otp-label">Código de verificación</label>
              <div class="otp-inputs">
                <input v-for="(_, index) in otpDigits" :key="index"
                  :ref="(el) => (otpInputs[index] = el as HTMLInputElement)" v-model="otpDigits[index]" type="text"
                  inputmode="numeric" maxlength="1" class="otp-input" :class="{ 'input-error': validationError }"
                  @input="handleOtpInput(index, $event)" @keydown="handleOtpKeydown(index, $event)"
                  @paste="handleOtpPaste" :disabled="isLoading" />
              </div>
              <span v-if="validationError" class="error-text">
                {{ validationError }}
              </span>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn-submit" :disabled="isLoading || !isOtpComplete">
              <span v-if="!isLoading" class="btn-content">
                <span class="btn-text">Verificar Código</span>
                <svg class="btn-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
              <span v-else class="btn-loader">
                <div class="spinner"></div>
                <span>Verificando...</span>
              </span>
            </button>
          </form>

          <!-- Resend Code -->
          <div class="resend-section">
            <p class="resend-text">
              ¿No recibiste el código?
              <button @click="handleResendCode" class="resend-btn" :disabled="cooldownSeconds > 0 || isResending"
                type="button">
                <span v-if="cooldownSeconds > 0">
                  Reenviar en {{ cooldownSeconds }}s
                </span>
                <span v-else-if="isResending" class="resending-text">
                  <div class="mini-spinner"></div>
                  Reenviando...
                </span>
                <span v-else>Reenviar código</span>
              </button>
            </p>
          </div>

          <!-- Alternative Login -->
          <div class="alternative-section">
            <p class="alternative-text">
              ¿Problemas con la verificación?
              <router-link to="/login" class="link-register">
                Intentar de nuevo
              </router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { authService } from "../../services/auth";
import { useUserStore } from "../../stores/useUserStore";
import { eventBus, EVENTS } from '@/events/eventBus';

const userStore = useUserStore();

const router = useRouter();
const route = useRoute();

// ==================== ESTADO ====================
const otpDigits = ref<string[]>(["", "", "", "", "", ""]);
const otpInputs = ref<HTMLInputElement[]>([]);
const isLoading = ref(false);
const isResending = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const validationError = ref("");
const cooldownSeconds = ref(0);

// Email del usuario (desde query params o localStorage)
const userEmail = computed(() => {
  return (route.query.email as string) || localStorage.getItem("pending_email") || "tu correo";
});

// Verificar si el OTP está completo
const isOtpComplete = computed(() => {
  return otpDigits.value.every((digit) => digit !== "");
});

// ==================== MANEJO DE OTP ====================

/**
 * Manejar input en campo OTP
 */
const handleOtpInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  // Solo permitir números
  if (value && !/^\d$/.test(value)) {
    otpDigits.value[index] = "";
    return;
  }

  // Limpiar errores
  validationError.value = "";
  errorMessage.value = "";

  // Mover al siguiente campo automáticamente
  if (value && index < 5) {
    otpInputs.value[index + 1]?.focus();
  }
};

/**
 * Manejar teclas especiales (Backspace, Arrow keys)
 */
const handleOtpKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === "Backspace") {
    if (!otpDigits.value[index] && index > 0) {
      // Si el campo está vacío, ir al anterior
      otpInputs.value[index - 1]?.focus();
    }
  } else if (event.key === "ArrowLeft" && index > 0) {
    otpInputs.value[index - 1]?.focus();
  } else if (event.key === "ArrowRight" && index < 5) {
    otpInputs.value[index + 1]?.focus();
  }
};

/**
 * Manejar pegado de código completo
 */
const handleOtpPaste = (event: ClipboardEvent) => {
  event.preventDefault();
  const pastedData = event.clipboardData?.getData("text");

  if (pastedData && /^\d{6}$/.test(pastedData)) {
    const digits = pastedData.split("");
    otpDigits.value = digits;

    // Enfocar el último campo
    otpInputs.value[5]?.focus();

    // Limpiar errores
    validationError.value = "";
    errorMessage.value = "";
  }
};

// ==================== VERIFICACIÓN ====================

/**
 * Verificar código OTP
 */
const handleVerify = async () => {
  if (!isOtpComplete.value) {
    validationError.value = "Por favor completa el código de 6 dígitos";
    return;
  }
  const token = route.query.token as string; // viene del link en correo
  const code = otpDigits.value.join("");
  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const response = await authService.verifyEmail(
      userEmail.value,
      code,
      token
    );

    if (response.success) {
      successMessage.value = "¡Correo verificado exitosamente!";

      // Actualizar el estado global del usuario
      await userStore.loadMe(true);

      // Limpiar email pendiente
      localStorage.removeItem("pending_email");

      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        eventBus.emit(EVENTS.USER_LOGGED_IN, userStore.user);
        
        // Si hay visita pendiente de Lyra, redirigir al home
        const pendingVisit = localStorage.getItem('lyra_pending_visit_session');
        const redirectUrl = pendingVisit ? '/' : '/';
        router.push(redirectUrl);
      }, 1500);
    }
  } catch (err: any) {
    console.error("❌ Error en verificación:", err);
    errorMessage.value = err.message || "Error al verificar el código. Intenta nuevamente";

    // Limpiar OTP en caso de error
    otpDigits.value = ["", "", "", "", "", ""];
    otpInputs.value[0]?.focus();
  } finally {
    isLoading.value = false;
  }
};

// ==================== REENVÍO ====================

/**
 * Reenviar código OTP
 */
const handleResendCode = async () => {
  if (cooldownSeconds.value > 0 || isResending.value) return;

  isResending.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const response = await authService.resendCode(userEmail.value);

    if (response.success) {
      successMessage.value = "¡Código reenviado! Revisa tu correo";

      // Iniciar cooldown de 2 minutos (120 segundos)
      startCooldown(120);

      // Limpiar OTP
      otpDigits.value = ["", "", "", "", "", ""];
      otpInputs.value[0]?.focus();
    } else {
      errorMessage.value = response.message || "Error al reenviar el código";
    }
  } catch (err: any) {
    console.error("❌ Error al reenviar código:", err);

    // Manejar cooldown desde el backend
    if (err.response?.status === 429) {
      const remainingSeconds = err.response?.data?.remaining_seconds || 120;
      startCooldown(remainingSeconds);
      errorMessage.value = `Debes esperar ${remainingSeconds} segundos antes de reenviar`;
    } else {
      errorMessage.value = err.response?.data?.message || "Error al reenviar el código";
    }
  } finally {
    isResending.value = false;
  }
};

/**
 * Iniciar cooldown visual
 */
let cooldownInterval: number | null = null;

const startCooldown = (seconds: number) => {
  cooldownSeconds.value = seconds;

  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }

  cooldownInterval = window.setInterval(() => {
    cooldownSeconds.value--;

    if (cooldownSeconds.value <= 0) {
      if (cooldownInterval) {
        clearInterval(cooldownInterval);
      }
    }
  }, 1000);
};

// ==================== CICLO DE VIDA ====================

onMounted(() => {
  // Enfocar primer campo automáticamente
  otpInputs.value[0]?.focus();
});

onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }
});

// ==================== ANIMACIÓN DE FONDO ====================
const canvasEl = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;
let particles: any[] = [];
const PARTICLE_COUNT = 45;

class Particle {
  w: number;
  h: number;
  dpr: number;
  x!: number;
  y!: number;
  vx!: number;
  vy!: number;
  radius!: number;
  alpha!: number;
  phase!: number;
  speedPhase!: number;

  constructor(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.w;
    this.y = Math.random() * this.h;
    this.vx = (Math.random() - 0.5) * 0.18;
    this.vy = (Math.random() - 0.5) * 0.25 - 0.08;
    this.radius = (Math.random() * 10 + 4) * this.dpr;
    this.alpha = Math.random() * 0.4 + 0.05;
    this.phase = Math.random() * Math.PI * 2;
    this.speedPhase = 0.002 + Math.random() * 0.003;
  }

  update(delta: number) {
    this.phase += this.speedPhase * delta;
    this.x += this.vx * delta;
    this.y += this.vy * delta + Math.sin(this.phase * 1.2) * 0.02 * delta;
    if (this.x < -50) this.x = this.w + 50;
    if (this.x > this.w + 50) this.x = -50;
    if (this.y < -60) this.y = this.h + 60;
    if (this.y > this.h + 60) this.y = -60;
  }

  draw() {
    if (!ctx) return;
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.5);
    g.addColorStop(0, `rgba(255,255,255,${this.alpha})`);
    g.addColorStop(0.3, `rgba(255,255,255,${this.alpha * 0.3})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.beginPath();
    ctx.fillStyle = g;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function resize(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: rect.width, h: rect.height, dpr };
}

onMounted(async () => {
  const canvas = canvasEl.value;
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  let { w, h, dpr } = resize(canvas);

  particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle(w, h, dpr));

  const onResize = () => {
    const r = resize(canvas);
    w = r.w;
    h = r.h;
    dpr = r.dpr;
    particles.forEach((p) => p.reset());
  };
  window.addEventListener("resize", onResize);

  let last = performance.now();
  const animate = (now: number) => {
    const delta = Math.min(50, now - last);
    last = now;
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => (p.update(delta), p.draw()));
    animationId = requestAnimationFrame(animate);
  };
  animationId = requestAnimationFrame(animate);

  onUnmounted(() => {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener("resize", onResize);
  });

  // Token validation
  const token = route.query.token as string;
  const isValid = await authService.checkToken(token);
  if (!isValid) {
    router.replace({ name: "NotFound" });
  }
});
</script>

<style scoped>
@import "../../assets/css/Auth/auth.css";
@import "../../assets/css/Auth/confirm-email.css";
</style>