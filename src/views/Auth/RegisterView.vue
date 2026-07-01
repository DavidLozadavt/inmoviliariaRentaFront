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
                    <button v-for="(_, index) in messages" :key="index" @click="currentMessageIndex = index"
                        class="indicator-dot" :class="{ active: currentMessageIndex === index }"
                        :aria-label="`Ver mensaje ${index + 1}`"></button>
                </div>
            </div>

            <div class="floating-form-modal">
                <div class="form-container">
                    <button @click="goBack" class="btn-back" type="button">
                        <span class="back-icon">←</span>
                        <span class="back-text">Volver</span>
                    </button>

                    <div class="tabs-container">
                        <button class="tab-btn" :class="{ active: activeTab === 'login' }" @click="setTab('login')"
                            type="button">
                            Iniciar Sesión
                        </button>
                        <button class="tab-btn" :class="{ active: activeTab === 'register' }"
                            @click="setTab('register')" type="button">
                            Registrarse
                        </button>


                    </div>

                    <div class="form-header">
                        <h2 class="form-title">Crea tu cuenta</h2>
                        <p class="form-subtitle">Completa tus datos para comenzar</p>
                    </div>

                    <transition name="fade">
                        <div v-if="errorMessage" class="alert-error" role="alert">
                            <svg class="alert-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span class="alert-text">{{ errorMessage }}</span>
                        </div>
                    </transition>

                    <form class="register-form" @submit.prevent="handleRegister" novalidate>
                        <!-- Nombre completo -->
                        <div class="form-group">
                            <label for="name" class="form-label"></label>
                            <div class="input-wrapper">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <input id="name" v-model.trim="formData.name" type="text" class="form-input"
                                    :class="{ 'input-error': validationErrors.name }" placeholder="Nombre completo"
                                    autocomplete="name" @blur="validateField('name')" @input="clearFieldError('name')"
                                    required />
                            </div>
                            <span v-if="validationErrors.name" class="error-text">
                                {{ validationErrors.name }}
                            </span>
                        </div>

                        <!-- Email -->
                        <div class="form-group">
                            <label for="email" class="form-label"></label>
                            <div class="input-wrapper">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <path d="m2 7 10 7 10-7" />
                                </svg>
                                <input id="email" v-model.trim="formData.email" type="email" class="form-input"
                                    :class="{ 'input-error': validationErrors.email }" placeholder="Correo electrónico"
                                    autocomplete="email" @blur="validateField('email')"
                                    @input="clearFieldError('email')" required />
                            </div>
                            <span v-if="validationErrors.email" class="error-text">
                                {{ validationErrors.email }}
                            </span>
                        </div>

                        <!-- Teléfono -->
                        <div class="form-group">
                            <label for="phone" class="form-label"></label>
                            <div class="input-wrapper">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path
                                        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                                <input id="phone" v-model.trim="formData.phone" type="tel" class="form-input"
                                    :class="{ 'input-error': validationErrors.phone }" placeholder="Teléfono"
                                    autocomplete="tel" @blur="validateField('phone')" @input="clearFieldError('phone')"
                                    required />
                            </div>
                            <span v-if="validationErrors.phone" class="error-text">
                                {{ validationErrors.phone }}
                            </span>
                        </div>

                        <!-- Documento de identidad -->
                        <div class="form-group">
                            <label for="id_documento" class="form-label"></label>
                            <div class="input-wrapper">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                    <line x1="7" y1="10" x2="17" y2="10" />
                                    <line x1="7" y1="14" x2="13" y2="14" />
                                </svg>
                                <input id="id_documento" v-model.trim="formData.id_documento" type="text"
                                    class="form-input" :class="{ 'input-error': validationErrors.id_documento }"
                                    placeholder="Documento de identidad" @blur="validateField('id_documento')"
                                    @input="clearFieldError('id_documento')" required />
                            </div>
                            <span v-if="validationErrors.id_documento" class="error-text">
                                {{ validationErrors.id_documento }}
                            </span>
                        </div>

                        <!-- Dirección -->
                        <div class="form-group">
                            <label for="address" class="form-label"></label>
                            <div class="input-wrapper">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <input id="address" v-model.trim="formData.address" type="text" class="form-input"
                                    :class="{ 'input-error': validationErrors.address }" placeholder="Dirección"
                                    autocomplete="street-address" @blur="validateField('address')"
                                    @input="clearFieldError('address')" required />
                            </div>
                            <span v-if="validationErrors.address" class="error-text">
                                {{ validationErrors.address }}
                            </span>
                        </div>

                        <!-- Contraseña -->
                        <div class="form-group">
                            <label for="password" class="form-label"></label>
                            <div class="input-wrapper">
                                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input id="password" v-model="formData.password"
                                    :type="showPassword ? 'text' : 'password'" class="form-input"
                                    :class="{ 'input-error': validationErrors.password }" placeholder="Contraseña"
                                    autocomplete="new-password" @blur="validateField('password')"
                                    @input="clearFieldError('password')" required />
                                <button type="button" class="toggle-password" @click="showPassword = !showPassword"
                                    :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                                    <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round">
                                        <path
                                            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                </button>
                            </div>
                            <span v-if="validationErrors.password" class="error-text">
                                {{ validationErrors.password }}
                            </span>
                            <!-- Indicador de fortaleza de contraseña 
              <div v-if="formData.password" class="password-strength">
                <div class="strength-bar">
                  <div 
                    class="strength-fill" 
                    :class="`strength-${passwordStrength.level}`"
                    :style="{ width: `${passwordStrength.percentage}%` }"
                  ></div>
                </div>
                <span class="strength-text" :class="`text-${passwordStrength.level}`">
                  {{ passwordStrength.text }}
                </span>
              </div>-->
                        </div>

                        <div class="form-options">
                            <label class="checkbox-wrapper">
                                <input type="checkbox" v-model="acceptTerms" id="terms-checkbox" />
                                <span class="checkbox-label">
                                    Acepto el
                                    <router-link to="/aviso-legal" class="link-terms">Aviso Legal</router-link>
                                    y la
                                    <router-link to="/politica-privacidad" class="link-terms">Política de Privacidad</router-link>
                                </span>
                            </label>
                        </div>

                        <button type="submit" class="btn-submit" :disabled="isLoading || !isFormValid">
                            <span v-if="!isLoading" class="btn-content">
                                <span class="btn-text">Crear Cuenta</span>
                                <svg class="btn-arrow" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </span>
                            <span v-else class="btn-loader">
                                <div class="spinner"></div>
                                <span>Registrando...</span>
                            </span>
                        </button>
                    </form>

                    <div class="divider">
                        <span class="divider-line"></span>
                        <span class="divider-text">O regístrate con</span>
                        <span class="divider-line"></span>
                    </div>

                    <div class="social-buttons">
                        <button class="social-btn" @click="socialRegister('google')" type="button">
                            <img src="https://img.icons8.com/color/48/google-logo.png" alt="Google" />
                            <span>Google</span>
                        </button>
                    </div>

                    <p class="form-footer">
                        ¿Ya tienes una cuenta?
                        <button @click="setTab('login')" class="link-register" type="button">
                            Inicia sesión aquí
                        </button>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { authService } from "../../services/auth";
import type { RegisterData } from "../../services/auth";

const router = useRouter();

// Estado del formulario
const formData = ref<RegisterData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    id_documento: "",
    status: "active",
});

const errorMessage = ref("");
const showPassword = ref(false);
const acceptTerms = ref(false);
const isLoading = ref(false);
const activeTab = ref("register");
const validationErrors = ref<Record<string, string>>({});

// Mensajes dinámicos
const currentMessageIndex = ref(0);
const messages = [
    { title: "Únete a RentUs", text: "Crea tu cuenta y accede a miles de propiedades en tu ciudad." },
    { title: "Proceso rápido", text: "Solo te tomará un minuto completar tu registro y comenzar." },
    { title: "100% Seguro", text: "Tus datos están protegidos con encriptación de nivel bancario." },
    { title: "Soporte 24/7", text: "Nuestro equipo está listo para ayudarte cuando lo necesites." }
];
const currentMessage = computed(() => messages[currentMessageIndex.value]);

// ==================== Validaciones ====================

const validateName = (name: string): string | null => {
    if (!name) return "El nombre es obligatorio";
    if (name.length < 2) return "El nombre debe tener al menos 2 caracteres";
    if (name.length > 100) return "El nombre es demasiado largo";
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) return "El nombre solo puede contener letras";
    return null;
};

const validateEmail = (email: string): string | null => {
    if (!email) return "El correo es obligatorio";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Ingresa un correo válido";
    return null;
};

const validatePhone = (phone: string): string | null => {
    if (!phone) return "El teléfono es obligatorio";
    const phoneRegex = /^[0-9]{10,20}$/;
    if (!phoneRegex.test(phone)) return "El teléfono debe tener entre 10 y 20 dígitos";
    return null;
};

const validateIdDocumento = (id: string): string | null => {
    if (!id) return "El documento es obligatorio";
    if (id.length < 5) return "El documento debe tener al menos 5 caracteres";
    if (id.length > 50) return "El documento es demasiado largo";
    return null;
};

const validateAddress = (address: string): string | null => {
    if (!address) return "La dirección es obligatoria";
    if (address.length < 5) return "La dirección debe tener al menos 5 caracteres";
    if (address.length > 255) return "La dirección es demasiado larga";
    return null;
};

const validatePassword = (password: string): string | null => {
    if (!password) return "La contraseña es obligatoria";
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[a-z]/.test(password)) return "Debe contener al menos una minúscula";
    if (!/[A-Z]/.test(password)) return "Debe contener al menos una mayúscula";
    if (!/[0-9]/.test(password)) return "Debe contener al menos un número";
    if (!/[!@#$%^&*]/.test(password)) return "Debe contener al menos un símbolo (!@#$%^&*)";
    return null;
};

// const validatePasswordConfirmation = (confirmation: string): string | null => {
//     if (!confirmation) return "Debes confirmar tu contraseña";
//     if (confirmation !== formData.value.password) return "Las contraseñas no coinciden";
//     return null;
// };

const validateField = (field: keyof RegisterData) => {
    let error: string | null = null;

    switch (field) {
        case 'name':
            error = validateName(formData.value.name);
            break;
        case 'email':
            error = validateEmail(formData.value.email);
            break;
        case 'phone':
            error = validatePhone(formData.value.phone);
            break;
        case 'id_documento':
            error = validateIdDocumento(formData.value.id_documento);
            break;
        case 'address':
            error = validateAddress(formData.value.address);
            break;
        case 'password':
            error = validatePassword(formData.value.password);
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

// Fortaleza de contraseña
// const passwordStrength = computed(() => {
//     const pwd = formData.value.password;
//     if (!pwd) return { level: 'weak', percentage: 0, text: '' };

//     let strength = 0;
//     if (pwd.length >= 8) strength += 20;
//     if (pwd.length >= 12) strength += 10;
//     if (/[a-z]/.test(pwd)) strength += 20;
//     if (/[A-Z]/.test(pwd)) strength += 20;
//     if (/[0-9]/.test(pwd)) strength += 15;
//     if (/[!@#$%^&*]/.test(pwd)) strength += 15;

//     if (strength < 40) return { level: 'weak', percentage: strength, text: 'Débil' };
//     if (strength < 70) return { level: 'medium', percentage: strength, text: 'Media' };
//     return { level: 'strong', percentage: strength, text: 'Fuerte' };
// });

// Validar formulario completo
const isFormValid = computed(() => {
    return (
        formData.value.name.trim() !== "" &&
        formData.value.email.trim() !== "" &&
        formData.value.phone.trim() !== "" &&
        formData.value.id_documento.trim() !== "" &&
        formData.value.address.trim() !== "" &&
        formData.value.password.length >= 8 &&
        acceptTerms.value &&
        Object.keys(validationErrors.value).length === 0
    );
});

// ==================== Manejo de registro ====================

// En RegisterView.vue
const handleRegister = async () => {
  errorMessage.value = "";
  validationErrors.value = {};

  // Validar todos los campos
  validateField('name');
  validateField('email');
  validateField('phone');
  validateField('id_documento');
  validateField('address');
  validateField('password');

  if (Object.keys(validationErrors.value).length > 0) {
    errorMessage.value = "Por favor corrige los errores en el formulario";
    return;
  }

  if (!acceptTerms.value) {
    errorMessage.value = "Debes aceptar los términos y condiciones";
    return;
  }

  isLoading.value = true;

  try {
    const response = await authService.register(formData.value);
    console.log('🔍 Respuesta completa del registro:', response);

    if (response.success) {
      // CASO A: Si el backend NO devolvió token (necesita verificación)
      if (!response.token) {
        console.log('📧 Verificación de correo requerida');
        
        // Obtener el token de verificación de la respuesta
        const verificationToken = response.data?.verification_token;
        const userEmail = formData.value.email.trim().toLowerCase();
        
        if (verificationToken) {
          console.log('🔑 Token de verificación recibido:', verificationToken);
          
          // Redirigir a la página de confirmación con el token
          router.push({
            path: '/confirm-email',
            query: { 
              token: verificationToken,
              email: userEmail
            }
          });
        } else {
          console.log('⚠️ No hay token de verificación en la respuesta');
          console.log('📋 Datos de la respuesta:', response.data);
          
          // Intentar obtener el token de otra forma o mostrar mensaje
          router.push({
            path: '/confirm-email',
            query: { 
              email: userEmail,
              error: 'no_token'
            }
          });
        }
      }
      // CASO B: Si el backend SÍ devolvió token (login automático - inusual)
      else if (response.token && response.user) {
        console.warn('⚠️ Login automático después de registro (inusual)');
        
        // Guardar token y usuario
        authService.saveToken(response.token, false);
        authService.saveUser(response.user, false);
        
        // Redirigir según rol
        setTimeout(() => {
          if (response.user?.role === 'admin' || response.user?.role === 'support') {
            console.log('🔐 Admin/support detectado, redirigiendo al dashboard');
            router.push('/admin/dashboard');
          } else {
            console.log('👤 Usuario normal, redirigiendo al home');
            router.push('/');
          }
        }, 500);
      }
      // CASO C: Respuesta inesperada
      else {
        console.warn('⚠️ Respuesta inesperada del registro:', response);
        // Por defecto, ir al home
        router.push('/');
      }
      
    } else {
      errorMessage.value = response.message || "Error al crear la cuenta";
    }
  } catch (err: any) {
    console.error('❌ Error en registro:', err);
    errorMessage.value = err.message || "Error al registrar usuario. Intenta nuevamente";
  } finally {
    isLoading.value = false;
  }
};

// ==================== Funciones de navegación ====================

const setTab = (tab: string) => {
    activeTab.value = tab;
    if (tab === "register") router.push("/register");
    if (tab === "login") router.push("/login");
};

const goBack = () => router.push("/");
const socialRegister = (provider: string) => console.log(`Registro con ${provider}`);

// ==================== Animación de mensajes ====================

let messageInterval: number | null = null;

onMounted(() => {
    messageInterval = window.setInterval(() => {
        currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.length;
    }, 5000);
});

onUnmounted(() => {
    if (messageInterval) clearInterval(messageInterval);
});

// ==================== ANIMACIÓN DE FONDO CON CANVAS ====================

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
    const canvas = canvasEl.value;
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    let { w, h, dpr } = resize(canvas);

    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle(w, h, dpr));

    const onResize = () => {
        const r = resize(canvas);
        w = r.w; h = r.h; dpr = r.dpr;
        particles.forEach(p => p.reset());
    };
    window.addEventListener("resize", onResize);

    let last = performance.now();
    const animate = (now: number) => {
        const delta = Math.min(50, now - last);
        last = now;
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => (p.update(delta), p.draw()));
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
@import '../../assets/css/Auth/auth.css';
</style>