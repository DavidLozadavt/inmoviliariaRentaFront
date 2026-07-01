<template>
  <div class="background-layer" aria-hidden="true">
    <canvas ref="canvasEl" class="bg-canvas"></canvas>
  </div>

  <div class="auth-container">
    <div class="content-wrapper">
      <div class="brand-section">
        <div class="logo-wrapper">
          <img src="/favicon-dark.png" alt="Logo RentUs" class="logo-icon" />
          <h1 class="brand-name">
            <span class="brand-rent">Rent</span>
            <span class="brand-us">Us</span>
          </h1>
        </div>
      </div>

      <div class="dynamic-text-section">
        <transition name="slide-fade" mode="out-in">
          <div :key="currentMessageIndex" class="dynamic-message">
            <h2 class="welcome-title">{{ currentMessage.title }}</h2>
            <p class="welcome-text">{{ currentMessage.text }}</p>
          </div>
        </transition>

        <div class="message-indicators">
          <button v-for="(_, index) in messages" :key="index" @click="currentMessageIndex = index" class="indicator-dot"
            :class="{ active: currentMessageIndex === index }" :aria-label="`Ver mensaje ${index + 1}`"></button>
        </div>
      </div>

      <div class="floating-form-modal">
        <div class="form-container">
          <button @click="goBack" class="btn-back" type="button">
            <span class="back-icon">←</span>
            <span class="back-text">Volver</span>
          </button>

          <div class="tabs-container">
            <button class="tab-btn" :class="{ active: activeTab === 'login' }" @click="setTab('login')" type="button">
              Iniciar Sesión
            </button>
            <button class="tab-btn" :class="{ active: activeTab === 'register' }" @click="setTab('register')"
              type="button">
              Registrarse
            </button>
          </div>

          <div class="form-header">
            <h2 class="form-title">Accede a tu cuenta</h2>
            <p class="form-subtitle">Ingresa tus credenciales para continuar</p>
          </div>

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

          <form class="login-form" @submit.prevent="handleLogin" novalidate>
            <div class="form-group">
              <label for="email" class="form-label">Correo electrónico</label>
              <div class="input-wrapper">
                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m2 7 10 7 10-7" />
                </svg>
                <input id="email" v-model.trim="email" type="email" class="form-input"
                  :class="{ 'input-error': validationErrors.email }" placeholder="rentus@gmail.com" autocomplete="email"
                  @blur="validateField('email')" @input="clearFieldError('email')" required />
              </div>
              <span v-if="validationErrors.email" class="error-text">
                {{ validationErrors.email }}
              </span>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Contraseña</label>
              <div class="input-wrapper">
                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" class="form-input"
                  :class="{ 'input-error': validationErrors.password }" placeholder="••••••••"
                  autocomplete="current-password" @blur="validateField('password')" @input="clearFieldError('password')"
                  required />
                <button type="button" class="toggle-password" @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
              <span v-if="validationErrors.password" class="error-text">
                {{ validationErrors.password }}
              </span>
            </div>

            <div class="form-options">
              <label class="checkbox-wrapper">
                <input type="checkbox" v-model="rememberMe" id="remember-checkbox" />
                <span class="checkbox-label">Recordarme</span>
              </label>
              <a href="#" class="link-forgot" @click.prevent="forgotPassword">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" class="btn-submit" :disabled="isLoading || !isFormValid">
              <span v-if="!isLoading" class="btn-content">
                <span class="btn-text">Iniciar Sesión</span>
                <svg class="btn-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
              <span v-else class="btn-loader">
                <div class="spinner"></div>
                <span>Iniciando...</span>
              </span>
            </button>
          </form>

          <div class="divider">
            <span class="divider-line"></span>
            <span class="divider-text">O continúa con</span>
            <span class="divider-line"></span>
          </div>

          <div class="social-buttons">
            <!-- Google OAuth coming soon -->
            <button class="social-btn" type="button" disabled title="Próximamente">
              <img src="https://img.icons8.com/color/48/google-logo.png" alt="" aria-hidden="true" />
              <span>Google (próximamente)</span>
            </button>
          </div>

          <p class="form-footer">
            ¿No tienes una cuenta?
            <button @click="setTab('register')" class="link-register" type="button">
              Regístrate gratis
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { authService } from "@/services/auth";
import { useHead } from '@unhead/vue';
import { eventBus, EVENTS } from '@/events/eventBus';

useHead({
  title: 'Iniciar Sesión | RentUs',
  meta: [{ name: 'description', content: 'Accede a tu cuenta Rentus para gestionar tus propiedades e inquilinos.' }],
});

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const showPassword = ref(false);
const rememberMe = ref(false);
const isLoading = ref(false);
const activeTab = ref("login");
const validationErrors = ref<Record<string, string>>({});

const router = useRouter();
const route = useRoute();

// Mensajes dinámicos
const currentMessageIndex = ref(0);
const messages = [
  { title: "Bienvenido de nuevo", text: "Retoma tu búsqueda donde la dejaste y sigue construyendo tu futuro hogar." },
  { title: "Encuentra tu hogar ideal", text: "Accede a miles de propiedades disponibles en tu ciudad y comienza tu búsqueda hoy mismo." },
  { title: "Transacciones seguras", text: "Tu seguridad es nuestra prioridad. Realiza todas tus gestiones con total confianza." },
  { title: "Búsqueda inteligente", text: "Usa nuestros filtros avanzados para encontrar exactamente lo que necesitas en segundos." }
];
const currentMessage = computed(() => messages[currentMessageIndex.value]);

// Validación en tiempo real
const isFormValid = computed(() => {
  return email.value.trim() !== "" &&
    password.value.length >= 6 &&
    Object.keys(validationErrors.value).length === 0;
});

// Validar email
const validateEmail = (email: string): string | null => {
  if (!email) return "El correo es obligatorio";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Ingresa un correo válido";
  return null;
};

// Validar contraseña
const validatePassword = (password: string): string | null => {
  if (!password) return "La contraseña es obligatoria";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  return null;
};

// Validar campo específico
const validateField = (field: string) => {
  if (field === "email") {
    const error = validateEmail(email.value);
    if (error) {
      validationErrors.value.email = error;
    } else {
      delete validationErrors.value.email;
    }
  } else if (field === "password") {
    const error = validatePassword(password.value);
    if (error) {
      validationErrors.value.password = error;
    } else {
      delete validationErrors.value.password;
    }
  }
};

// Limpiar error de campo
const clearFieldError = (field: string) => {
  delete validationErrors.value[field];
  errorMessage.value = "";
};

// Manejar login
// En LoginView.vue, modifica la función handleLogin
const handleLogin = async () => {
  errorMessage.value = '';
  validationErrors.value = {};

  const emailError = validateEmail(email.value);
  const passwordError = validatePassword(password.value);
  if (emailError) validationErrors.value.email = emailError;
  if (passwordError) validationErrors.value.password = passwordError;
  if (Object.keys(validationErrors.value).length > 0) {
    errorMessage.value = 'Por favor corrige los errores en el formulario';
    return;
  }

  isLoading.value = true;

  try {
    const response = await authService.login({
      email: email.value,
      password: password.value,
      remember: rememberMe.value,
    });

    if (response.success && response.token) {
      const user = await authService.getMe();

      // Determine redirect destination
      const savedRedirect = localStorage.getItem('redirectAfterLogin');
      const queryRedirect = route.query.redirect as string | undefined;
      localStorage.removeItem('redirectAfterLogin');

      const redirectUrl =
        savedRedirect ||
        queryRedirect ||
        (user.role === 'admin' || user.role === 'support' ? '/admin/dashboard' : '/');

      // Await navigation directly — no fragile setTimeout
      await router.push(redirectUrl);

      // Emitir evento para que VoiceAssistant retome visita pendiente
      eventBus.emit(EVENTS.USER_LOGGED_IN, user);
    } else {
      errorMessage.value = response.message || 'Correo o contraseña incorrectos';
    }
  } catch (err: unknown) {
    errorMessage.value =
      err instanceof Error ? err.message : 'Error al iniciar sesión. Intenta nuevamente';
  } finally {
    isLoading.value = false;
  }
};

const setTab = (tab: string) => {
  activeTab.value = tab;
  if (tab === "register") router.push("/register");
  if (tab === "login") router.push("/login");
};

const goBack = () => router.push("/");
// socialLogin: to be implemented with OAuth2 (Google, etc.)
// const socialLogin = (provider: string) => { ... };
const forgotPassword = () => router.push("/forgot-password");

// Animación de mensajes
let messageInterval: number | null = null;

// Canvas animation variables — declared here to share between onMounted/onUnmounted
const canvasEl = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;
let particles: Particle[] = [];
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
    g.addColorStop(1, 'rgba(255,255,255,0)');
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
  // ── Message rotation ────────────────────────────────────────────────────
  if (localStorage.getItem('auth_token')) rememberMe.value = true;
  messageInterval = window.setInterval(() => {
    currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.length;
  }, 5000);

  // ── Canvas particle animation ────────────────────────────────────────────
  const canvas = canvasEl.value;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  let { w, h, dpr } = resize(canvas);

  particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle(w, h, dpr));

  const onResize = () => {
    const r = resize(canvas);
    w = r.w; h = r.h; dpr = r.dpr;
    particles.forEach((p) => p.reset());
  };
  window.addEventListener('resize', onResize);

  // Pause animation when the tab is not visible (saves CPU/battery)
  const onVisibilityChange = () => {
    if (document.hidden) {
      if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    } else {
      if (!animationId) animationId = requestAnimationFrame(animate);
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  let last = performance.now();
  const animate = (now: number) => {
    const delta = Math.min(50, now - last);
    last = now;
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => { p.update(delta); p.draw(); });
    animationId = requestAnimationFrame(animate);
  };
  animationId = requestAnimationFrame(animate);

  onUnmounted(() => {
    if (messageInterval) clearInterval(messageInterval);
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });
});
</script>

<style scoped>
@import '../../assets/css/Auth/auth.css';
</style>