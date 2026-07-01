<template>
  <div class="background-layer" aria-hidden="true">
    <canvas ref="canvasEl" class="bg-canvas"></canvas>
  </div>

  <div class="auth-container">
    <div class="content-wrapper">
      <!-- Brand Section -->
      <div class="brand-section">
        <div class="logo-wrapper">
          <img src="/favicon-dark.png" alt="Logo RentUs" class="logo-icon" />
          <h1 class="brand-name">
            <span class="brand-rent">Rent</span>
            <span class="brand-us">Us</span>
          </h1>
        </div>
      </div>

      <!-- Dynamic Message Section -->
      <div class="dynamic-text-section">
        <div class="dynamic-message">
          <h2 class="welcome-title">{{ currentStep === 'request' ? '¿Olvidaste tu contraseña?' : 'Restablece tu contraseña' }}</h2>
          <p class="welcome-text">
            {{ currentStep === 'request' ? 'No te preocupes, te enviaremos instrucciones para restablecerla' : 'Ingresa tu nueva contraseña y el código de verificación' }}
          </p>
        </div>
      </div>

      <!-- Password Reset Form -->
      <div class="floating-form-modal">
        <div class="form-container">
          <button @click="goBack" class="btn-back" type="button">
            <span class="back-icon">←</span>
            <span class="back-text">Volver</span>
          </button>

          <div class="form-header">
            <h2 class="form-title">
              {{ currentStep === 'request' ? 'Recuperar Contraseña' : 'Nueva Contraseña' }}
            </h2>
            <p class="form-subtitle">
              {{ currentStep === 'request' ? 'Ingresa tu correo electrónico registrado' : 'Crea una contraseña segura' }}
            </p>
          </div>

          <!-- Alert Messages -->
          <transition name="fade">
            <div v-if="successMessage" class="alert-success" role="alert">
              <svg
                class="alert-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span class="alert-text">{{ successMessage }}</span>
            </div>
          </transition>

          <transition name="fade">
            <div v-if="errorMessage" class="alert-error" role="alert">
              <svg
                class="alert-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span class="alert-text">{{ errorMessage }}</span>
            </div>
          </transition>

          <!-- Step 1: Request Reset -->
          <form v-if="currentStep === 'request'" @submit.prevent="handleRequestReset" novalidate>
            <div class="form-group">
              <label for="email" class="form-label">Correo electrónico</label>
              <div class="input-wrapper">
                <svg
                  class="input-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m2 7 10 7 10-7" />
                </svg>
                <input
                  id="email"
                  v-model.trim="email"
                  type="email"
                  class="form-input"
                  :class="{ 'input-error': validationErrors.email }"
                  placeholder="rentus@gmail.com"
                  autocomplete="email"
                  @blur="validateField('email')"
                  @input="clearFieldError('email')"
                  required
                />
              </div>
              <span v-if="validationErrors.email" class="error-text">
                {{ validationErrors.email }}
              </span>
            </div>

            <button type="submit" class="btn-submit" :disabled="isLoading">
              <span v-if="!isLoading" class="btn-content">
                <span class="btn-text">Enviar Código</span>
                <svg
                  class="btn-arrow"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
              <span v-else class="btn-loader">
                <div class="spinner"></div>
                <span>Enviando...</span>
              </span>
            </button>
          </form>

          <!-- Step 2: Reset Password -->
          <form v-else @submit.prevent="handleResetPassword" novalidate>
            <!-- Código OTP -->
            <div class="form-group">
              <label for="code" class="form-label">Código de verificación</label>
              <div class="input-wrapper">
                <svg
                  class="input-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="code"
                  v-model.trim="resetCode"
                  type="text"
                  class="form-input"
                  :class="{ 'input-error': validationErrors.code }"
                  placeholder="123456"
                  maxlength="6"
                  @blur="validateField('code')"
                  @input="clearFieldError('code')"
                  required
                />
              </div>
              <span v-if="validationErrors.code" class="error-text">
                {{ validationErrors.code }}
              </span>
            </div>

            <!-- Nueva Contraseña -->
            <div class="form-group">
              <label for="password" class="form-label">Nueva contraseña</label>
              <div class="input-wrapper">
                <svg
                  class="input-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  v-model="newPassword"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{ 'input-error': validationErrors.password }"
                  placeholder="••••••••"
                  autocomplete="new-password"
                  @blur="validateField('password')"
                  @input="clearFieldError('password')"
                  required
                />
                <button
                  type="button"
                  class="toggle-password"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  <svg
                    v-if="!showPassword"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
              <span v-if="validationErrors.password" class="error-text">
                {{ validationErrors.password }}
              </span>
            </div>

            <!-- Confirmar Contraseña -->
            <div class="form-group">
              <label for="password_confirmation" class="form-label">Confirmar contraseña</label>
              <div class="input-wrapper">
                <svg
                  class="input-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password_confirmation"
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-input"
                  :class="{ 'input-error': validationErrors.password_confirmation }"
                  placeholder="••••••••"
                  autocomplete="new-password"
                  @blur="validateField('password_confirmation')"
                  @input="clearFieldError('password_confirmation')"
                  required
                />
                <button
                  type="button"
                  class="toggle-password"
                  @click="showConfirmPassword = !showConfirmPassword"
                  :aria-label="showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                >
                  <svg
                    v-if="!showConfirmPassword"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                    />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
              <span v-if="validationErrors.password_confirmation" class="error-text">
                {{ validationErrors.password_confirmation }}
              </span>
            </div>

            <button type="submit" class="btn-submit" :disabled="isLoading">
              <span v-if="!isLoading" class="btn-content">
                <span class="btn-text">Restablecer Contraseña</span>
                <svg
                  class="btn-arrow"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
              <span v-else class="btn-loader">
                <div class="spinner"></div>
                <span>Restableciendo...</span>
              </span>
            </button>
          </form>

          <p class="form-footer">
            ¿Recordaste tu contraseña?
            <router-link to="/login" class="link-register">
              Inicia sesión aquí
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import api from "../../services/api";

const router = useRouter();

// ==================== ESTADO ====================
const currentStep = ref<'request' | 'reset'>('request');
const email = ref("");
const resetCode = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const validationErrors = ref<Record<string, string>>({});

// ==================== VALIDACIONES ====================

const validateEmail = (email: string): string | null => {
  if (!email) return "El correo es obligatorio";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Ingresa un correo válido";
  return null;
};

const validateCode = (code: string): string | null => {
  if (!code) return "El código es obligatorio";
  if (code.length !== 6) return "El código debe tener 6 dígitos";
  if (!/^\d{6}$/.test(code)) return "El código debe contener solo números";
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return "La contraseña es obligatoria";
  if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  return null;
};

const validatePasswordConfirmation = (confirmation: string): string | null => {
  if (!confirmation) return "Debes confirmar tu contraseña";
  if (confirmation !== newPassword.value) return "Las contraseñas no coinciden";
  return null;
};

const validateField = (field: string) => {
  let error: string | null = null;

  switch (field) {
    case 'email':
      error = validateEmail(email.value);
      break;
    case 'code':
      error = validateCode(resetCode.value);
      break;
    case 'password':
      error = validatePassword(newPassword.value);
      break;
    case 'password_confirmation':
      error = validatePasswordConfirmation(confirmPassword.value);
      break;
  }

  if (error) {
    validationErrors.value[field] = error;
  } else {
    delete validationErrors.value[field];
  }
};

const clearFieldError = (field: string) => {
  delete validationErrors.value[field];
  errorMessage.value = "";
};

// ==================== PASO 1: SOLICITAR CÓDIGO ====================

const handleRequestReset = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  validationErrors.value = {};

  // Validar email
  const emailError = validateEmail(email.value);
  if (emailError) {
    validationErrors.value.email = emailError;
    errorMessage.value = "Por favor corrige los errores";
    return;
  }

  isLoading.value = true;

  try {
    const response = await api.post("/auth/forgot-password", {
      email: email.value,
    });

    if (response.data.success) {
      successMessage.value = "¡Código enviado! Revisa tu correo";
      
      // Cambiar al paso 2 después de 1.5 segundos
      setTimeout(() => {
        currentStep.value = 'reset';
        successMessage.value = "";
      }, 1500);
    } else {
      errorMessage.value = response.data.message || "Error al enviar el código";
    }
  } catch (err: any) {
    console.error("❌ Error al solicitar reset:", err);
    
    const responseData = err.response?.data;
    errorMessage.value = responseData?.message || "Error al enviar el código. Intenta nuevamente";
  } finally {
    isLoading.value = false;
  }
};

// ==================== PASO 2: RESTABLECER CONTRASEÑA ====================

const handleResetPassword = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  validationErrors.value = {};

  // Validar todos los campos
  validateField('code');
  validateField('password');
  validateField('password_confirmation');

  if (Object.keys(validationErrors.value).length > 0) {
    errorMessage.value = "Por favor corrige los errores en el formulario";
    return;
  }

  isLoading.value = true;

  try {
    const response = await api.post("/auth/reset-password", {
      email: email.value,
      code: resetCode.value,
      password: newPassword.value,
      password_confirmation: confirmPassword.value,
    });

    if (response.data.success) {
      successMessage.value = "¡Contraseña restablecida exitosamente!";
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      errorMessage.value = response.data.message || "Error al restablecer la contraseña";
    }
  } catch (err: any) {
    console.error("❌ Error al restablecer contraseña:", err);
    
    const responseData = err.response?.data;
    
    // Manejar errores de validación 422
    if (err.response?.status === 422 && responseData?.errors) {
      const validationErrors422 = responseData.errors;
      Object.entries(validationErrors422).forEach(([field, messages]) => {
        validationErrors.value[field] = (messages as string[])[0];
      });
      errorMessage.value = "Por favor corrige los errores en el formulario";
    } else {
      errorMessage.value = responseData?.message || "Error al restablecer la contraseña";
    }
  } finally {
    isLoading.value = false;
  }
};

// ==================== NAVEGACIÓN ====================

const goBack = () => {
  if (currentStep.value === 'reset') {
    currentStep.value = 'request';
    resetCode.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    validationErrors.value = {};
    errorMessage.value = "";
    successMessage.value = "";
  } else {
    router.push("/login");
  }
};

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

onMounted(() => {
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
});
</script>

<style scoped>
@import "../../assets/css/Auth/auth.css";
@import "../../assets/css/Auth/reset-password.css";
</style>