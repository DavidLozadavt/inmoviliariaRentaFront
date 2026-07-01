<template>
  <div class="settings-page">
    <div class="page-background"></div>

    <main class="settings-wrapper">
      <div class="settings-container">

        <!-- Panel de navegación lateral -->
        <div class="settings-nav">
          <div v-for="(section, index) in sections" :key="index" class="nav-item"
            :class="{ active: activeSection === section.id }" @click="activeSection = section.id">
            <font-awesome-icon :icon="section.icon" class="nav-icon" />
            <span class="nav-text">{{ $t(section.title) }}</span>
          </div>
        </div>

        <!-- Contenido principal -->
        <div class="settings-content">
          <div class="settings-card">

            <!-- SECCIÓN PERFIL -->
            <div v-if="activeSection === 'profile'" class="section-content">
              <h3 class="section-title">
                <font-awesome-icon :icon="['fas', 'user']" class="section-icon" />
                {{ $t('settings.profile.title') }}
              </h3>

              <div class="profile-header">
                <div class="avatar-container">
                  <div class="avatar-preview">
                    <img :src="userData.photo || defaultAvatar" :alt="$t('settings.profile.avatar')" class="avatar-img"
                      @error="handleImageError" />
                  </div>
                  <div class="avatar-actions">
                    <button class="btn-secondary" @click="triggerFileInput">
                      <font-awesome-icon :icon="['fas', 'camera']" />
                      {{ $t('settings.profile.changeAvatar') }}
                    </button>
                    <input ref="fileInput" type="file" accept="image/*" class="file-input"
                      @change="handlePhotoUpload" />
                    <p class="avatar-hint">{{ $t('settings.profile.avatarHint') }}</p>
                  </div>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label>{{ $t('settings.profile.fullName') }}</label>
                  <input type="text" :placeholder="$t('settings.profile.namePlaceholder')" v-model="userData.name" />
                </div>

                <div class="form-group">
                  <label>{{ $t('settings.profile.email') }}</label>
                  <input type="email" :placeholder="$t('settings.profile.emailPlaceholder')" v-model="userData.email"
                    disabled class="disabled-input" />
                  <span class="field-note">{{ $t('settings.profile.emailNote') }}</span>
                </div>

                <div class="form-group">
                  <label>{{ $t('settings.profile.phone') }}</label>
                  <input type="tel" :placeholder="$t('settings.profile.phonePlaceholder')" v-model="userData.phone" />
                </div>

                <div class="form-group">
                  <label>{{ $t('settings.profile.document') }}</label>
                  <input type="text" :placeholder="$t('settings.profile.documentPlaceholder')"
                    v-model="userData.id_documento" />
                </div>

                <div class="form-group full-width">
                  <label>{{ $t('settings.profile.bio') }}</label>
                  <textarea :placeholder="$t('settings.profile.bioPlaceholder')" v-model="userData.bio"
                    maxlength="200"></textarea>
                  <span class="char-counter">{{ userData.bio?.length || 0 }}/200</span>
                </div>

                <div class="form-group">
                  <label>{{ $t('settings.profile.department') }}</label>
                  <select v-model="userData.department" @change="updateCities">
                    <option value="">{{ $t('settings.profile.selectDepartment') }}</option>
                    <option v-for="dept in departments" :key="dept.name" :value="dept.name">
                      {{ dept.name }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label>{{ $t('settings.profile.city') }}</label>
                  <select v-model="userData.city" :disabled="!userData.department">
                    <option value="">{{ $t('settings.profile.selectCity') }}</option>
                    <option v-for="city in availableCities" :key="city" :value="city">
                      {{ city }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="actions">
                <button class="btn-secondary" @click="resetProfileChanges">
                  {{ $t('common.cancel') }}
                </button>
                <button class="btn-primary" @click="saveProfile" :disabled="!hasProfileChanges || savingProfile">
                  <font-awesome-icon v-if="savingProfile" :icon="['fas', 'spinner']" spin />
                  {{ savingProfile ? $t('common.saving') : $t('common.saveChanges') }}
                </button>
              </div>
            </div>

            <!-- SECCIÓN SEGURIDAD -->
            <div v-if="activeSection === 'security'" class="section-content">
              <h3 class="section-title">
                <font-awesome-icon :icon="['fas', 'lock']" class="section-icon" />
                {{ $t('settings.security.title') }}
              </h3>

              <div class="form-grid">
                <div class="form-group">
                  <label>{{ $t('settings.security.currentPassword') }}</label>
                  <input :type="showCurrentPassword ? 'text' : 'password'" v-model="passwords.current"
                    :placeholder="$t('settings.security.currentPlaceholder')" />
                </div>

                <div class="form-group">
                  <label>{{ $t('settings.security.newPassword') }}</label>
                  <input :type="showNewPassword ? 'text' : 'password'" v-model="passwords.new"
                    :placeholder="$t('settings.security.newPlaceholder')" />
                </div>

                <div class="form-group">
                  <label>{{ $t('settings.security.confirmPassword') }}</label>
                  <input :type="showConfirmPassword ? 'text' : 'password'" v-model="passwords.confirm"
                    :placeholder="$t('settings.security.confirmPlaceholder')" />
                </div>
              </div>

              <div class="password-strength" v-if="passwords.new">
                <div class="strength-bar" :class="passwordStrength.class"></div>
                <span class="strength-text">{{ $t(passwordStrength.text) }}</span>
              </div>

              <div class="password-requirements">
                <h4>{{ $t('settings.security.requirementsTitle') }}</h4>
                <ul>
                  <li>{{ $t('settings.security.minLength') }}</li>
                  <li>{{ $t('settings.security.upperLower') }}</li>
                  <li>{{ $t('settings.security.number') }}</li>
                  <li>{{ $t('settings.security.specialChar') }}</li>
                  <li>{{ $t('settings.security.match') }}</li>
                </ul>
              </div>

              <div class="actions">
                <button class="btn-secondary" @click="resetPasswordFields">
                  {{ $t('common.cancel') }}
                </button>
                <button class="btn-primary" @click="updatePassword" :disabled="!canUpdatePassword || updatingPassword">
                  <font-awesome-icon v-if="updatingPassword" :icon="['fas', 'spinner']" spin />
                  {{ updatingPassword ? $t('common.updating') : $t('settings.security.updatePassword') }}
                </button>
              </div>
            </div>

            <!-- SECCIÓN NOTIFICACIONES -->
            <div v-if="activeSection === 'notifications'" class="section-content">
              <h3 class="section-title">
                <font-awesome-icon :icon="['fas', 'bell']" class="section-icon" />
                {{ $t('settings.notifications.title') }}
              </h3>

              <div class="toggle-section">
                <div class="toggle-item" v-for="(notification, index) in notifications" :key="index">
                  <div class="toggle-info">
                    <span class="toggle-title">{{ $t(notification.title) }}</span>
                    <span class="toggle-description">{{ $t(notification.description) }}</span>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="notification.enabled" />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <div class="actions">
                <button class="btn-secondary" @click="resetNotifications">
                  {{ $t('common.reset') }}
                </button>
                <button class="btn-primary" @click="saveNotifications" :disabled="savingNotifications">
                  <font-awesome-icon v-if="savingNotifications" :icon="['fas', 'spinner']" spin />
                  {{ savingNotifications ? $t('common.saving') : $t('common.savePreferences') }}
                </button>
              </div>
            </div>

            <!-- SECCIÓN PREFERENCIAS -->
            <div v-if="activeSection === 'preferences'" class="section-content">
              <h3 class="section-title">
                <font-awesome-icon :icon="['fas', 'palette']" class="section-icon" />
                {{ $t('settings.preferences.title') }}
              </h3>

              <div class="form-grid">
                <div class="form-group full-width">
                  <label>{{ $t('settings.preferences.theme') }}</label>

                  <div class="theme-selector">
                    <div v-for="theme in themes" :key="theme.id" class="theme-option"
                      :class="{ active: userPreferences.theme === theme.id }" @click="userPreferences.theme = theme.id">
                      <div class="theme-preview" :class="theme.id">
                        <font-awesome-icon :icon="theme.icon" />
                      </div>
                      <span class="theme-name">{{ $t(theme.name) }}</span>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label>{{ $t('settings.language') }}</label>
                  <select v-model="userPreferences.language">
                    <option value="es">{{ $t('languages.es') }}</option>
                    <option value="en">{{ $t('languages.en') }}</option>
                    <option value="fr">{{ $t('languages.fr') }}</option>
                    <option value="de">{{ $t('languages.de') }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>{{ $t('settings.timezone') }}</label>
                  <select v-model="userPreferences.timezone">
                    <option value="America/Bogota">{{ $t('timezones.bogota') }}</option>
                    <option value="Europe/Madrid">{{ $t('timezones.madrid') }}</option>
                    <option value="Europe/London">{{ $t('timezones.london') }}</option>
                    <option value="America/New_York">{{ $t('timezones.newYork') }}</option>
                    <option value="America/Los_Angeles">{{ $t('timezones.losAngeles') }}</option>
                  </select>
                </div>

                <div class="form-group full-width">
                  <label>{{ $t('settings.units') }}</label>

                  <div class="radio-group">
                    <label class="radio-option">
                      <input type="radio" value="metric" v-model="userPreferences.units" />
                      <span class="radio-label">
                        <font-awesome-icon :icon="['fas', 'ruler']" />
                        {{ $t('settings.unitsMetric') }}
                      </span>
                    </label>

                    <label class="radio-option">
                      <input type="radio" value="imperial" v-model="userPreferences.units" />
                      <span class="radio-label">
                        <font-awesome-icon :icon="['fas', 'ruler-combined']" />
                        {{ $t('settings.unitsImperial') }}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="actions">
                <button class="btn-secondary" @click="resetPreferences">
                  {{ $t('common.cancel') }}
                </button>

                <button class="btn-primary" @click="savePreferences" :disabled="savingPreferences">
                  <font-awesome-icon v-if="savingPreferences" :icon="['fas', 'spinner']" spin />
                  {{ savingPreferences ? $t('common.saving') : $t('settings.preferences.save') }}
                </button>
              </div>
            </div>


            <!-- CERRAR SESIÓN -->
            <div class="logout-section">
              <button class="logout-btn" @click="confirmLogout">
                <font-awesome-icon :icon="['fas', 'sign-out-alt']" class="logout-icon" />
                {{ $t('common.logout') }}
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { eventBus, EVENTS } from '../../events/eventBus'

import { useI18n } from 'vue-i18n'

import api from '../../services/api'
import { useAlerts } from '../../composables/useAlerts'

const userPreferences = ref({
  theme: 'light',
  language: 'es',
  timezone: 'America/Bogota',
  units: 'metric'
})

const { locale } = useI18n()

watch(
  () => userPreferences.value.language,
  (newLang) => {
    locale.value = newLang
    localStorage.setItem('lang', newLang)
    // Emitir evento para sincronizar con el navbar
    eventBus.emit(EVENTS.LANGUAGE_CHANGED, newLang)
  }
)

const router = useRouter()
const { success, error: showError, confirm } = useAlerts()

// Interfaz para los datos del usuario
interface UserData {
  id: number
  name: string
  email: string
  phone: string
  photo: string
  bio: string
  department: string
  city: string
  address: string
  id_documento: string
  status: string
}

// Datos del usuario con tipo definido
const userData = ref<UserData>({
  id: 0,
  name: '',
  email: '',
  phone: '',
  photo: '',
  bio: '',
  department: '',
  city: '',
  address: '',
  id_documento: '',
  status: 'active'
})

// Copia original para detectar cambios
const originalUserData = ref<UserData>({
  id: 0,
  name: '',
  email: '',
  phone: '',
  photo: '',
  bio: '',
  department: '',
  city: '',
  address: '',
  id_documento: '',
  status: 'active'
})

// Estado de carga y guardado
const savingProfile = ref(false)
const updatingPassword = ref(false)
const savingNotifications = ref(false)
const savingPreferences = ref(false)

// Contraseñas
const passwords = ref({
  current: '',
  new: '',
  confirm: ''
})

// Estado de visibilidad de contraseñas
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Notificaciones
const notifications = ref([
  {
    title: 'notifications.newsEmails',
    description: 'notifications.newsEmailsDesc',
    enabled: true
  },
  {
    title: 'notifications.propertyAlerts',
    description: 'notifications.propertyAlertsDesc',
    enabled: true
  },
  {
    title: 'notifications.reminders',
    description: 'notifications.remindersDesc',
    enabled: false
  },
  {
    title: 'notifications.specialPromotions',
    description: 'notifications.specialPromotionsDesc',
    enabled: true
  }
])

// Preferencias del usuario


// Secciones con iconos de FontAwesome
const sections = ref([
  { id: 'profile', title: 'settings.sections.profile', icon: ['fas', 'user'] },
  { id: 'security', title: 'settings.sections.security', icon: ['fas', 'lock'] },
  { id: 'notifications', title: 'settings.sections.notifications', icon: ['fas', 'bell'] },
  { id: 'preferences', title: 'settings.sections.preferences', icon: ['fas', 'palette'] }
])

const activeSection = ref('profile')

// Temas disponibles con iconos
const themes = ref([
  { id: 'light', name: 'settings.themes.light', icon: ['fas', 'sun'] },
  { id: 'dark', name: 'settings.themes.dark', icon: ['fas', 'moon'] },
  { id: 'auto', name: 'settings.themes.auto', icon: ['fas', 'adjust'] }
])

// Avatar por defecto
const defaultAvatar = '/img/default.webp'

// Referencia al input de archivo
const fileInput = ref<HTMLInputElement | null>(null)
const departments = ref([
  {
    name: 'Cauca',
    cities: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Piendamó', 'Timbío']
  },
  {
    name: 'Valle del Cauca',
    cities: ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Cartago', 'Buga']
  },
  {
    name: 'Antioquia',
    cities: ['Medellín', 'Envigado', 'Itagüí', 'Bello', 'Rionegro', 'Sabaneta']
  },
  {
    name: 'Cundinamarca',
    cities: ['Bogotá', 'Soacha', 'Chía', 'Zipaquirá', 'Facatativá', 'Fusagasugá']
  },
  {
    name: 'Atlántico',
    cities: ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Puerto Colombia']
  }
])

// Computed
const availableCities = computed(() => {
  const dept = departments.value.find(d => d.name === userData.value.department)
  return dept ? dept.cities : []
})

const hasProfileChanges = computed(() => {
  return JSON.stringify(userData.value) !== JSON.stringify(originalUserData.value)
})

const canUpdatePassword = computed(() => {
  return passwords.value.current &&
    passwords.value.new &&
    passwords.value.confirm &&
    passwords.value.new === passwords.value.confirm &&
    passwords.value.new.length >= 8
})

const passwordStrength = computed(() => {
  const password = passwords.value.new
  if (!password) return { class: '', text: '' }

  let strength = 0

  if (password.length >= 8) strength++
  if (/\d/.test(password)) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  const strengthMap = {
    0: { text: 'Muy débil', class: 'very-weak' },
    1: { text: 'Muy débil', class: 'very-weak' },
    2: { text: 'Débil', class: 'weak' },
    3: { text: 'Media', class: 'medium' },
    4: { text: 'Fuerte', class: 'strong' }
  }

  return strengthMap[strength as keyof typeof strengthMap]
})

// Métodos
const loadUserData = async () => {
  try {
    const userResponse = await api.get('/auth/me')

    if (!userResponse.data.success || !userResponse.data.user) {
      throw new Error('No se pudo obtener la información del usuario')
    }

    const user = userResponse.data.user

    userData.value = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      photo: user.photo || '',
      bio: user.bio || '',
      department: user.department || '',
      city: user.city || '',
      address: user.address || '',
      id_documento: user.id_documento || '',
      status: user.status || 'active'
    }

    originalUserData.value = { ...userData.value }

  } catch (err) {
    console.error('Error cargando datos del usuario:', err)
    showError('Error al cargar los datos del usuario', 'Error de carga')
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handlePhotoUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    showError('La imagen es muy grande. Máximo 5MB', 'Error de tamaño')
    return
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    showError('Formato no válido. Usa JPG, PNG, GIF o WEBP', 'Formato inválido')
    return
  }

  const formData = new FormData()
  formData.append('photo', file)
  formData.append('_method', 'PUT')

  try {
    const reader = new FileReader()
    reader.onload = (e) => {
      userData.value.photo = e.target?.result as string
    }
    reader.readAsDataURL(file)

    const response = await api.post(`/users/${userData.value.id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.user && response.data.user.photo) {
      userData.value.photo = response.data.user.photo
      originalUserData.value.photo = response.data.user.photo
      eventBus.emit(EVENTS.PROFILE_PHOTO_UPDATED, response.data.user.photo)
    }

    success('Foto actualizada correctamente', '¡Éxito!')
  } catch (err: any) {
    console.error('Error al subir la foto:', err)
    showError('Error al subir la foto. Intenta nuevamente', 'Error')
  } finally {
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = defaultAvatar
}

const updateCities = () => {
  userData.value.city = ''
}

const saveProfile = async () => {
  if (!hasProfileChanges.value) return

  savingProfile.value = true
  try {
    await api.put(`/users/${userData.value.id}`, {
      name: userData.value.name,
      phone: userData.value.phone,
      bio: userData.value.bio,
      department: userData.value.department,
      city: userData.value.city,
      id_documento: userData.value.id_documento
    })

    originalUserData.value = { ...userData.value }
    success('Perfil actualizado correctamente', '¡Guardado!')
  } catch (err: any) {
    console.error('Error actualizando perfil:', err)
    showError('Error al actualizar perfil. Intenta nuevamente', 'Error')
  } finally {
    savingProfile.value = false
  }
}

const resetProfileChanges = () => {
  userData.value = { ...originalUserData.value }
}

const updatePassword = async () => {
  if (!canUpdatePassword.value) {
    showError('Por favor completa todos los campos correctamente', 'Campos incompletos')
    return
  }

  // Validar fuerza de contraseña antes de enviar
  if (passwordStrength.value.class === 'very-weak' || passwordStrength.value.class === 'weak') {
    showError('La contraseña es demasiado débil. Usa una contraseña más segura', 'Contraseña débil')
    return
  }

  updatingPassword.value = true
  try {
    // Endpoint correcto según el backend
    await api.put('/auth/password', {
      current_password: passwords.value.current,
      new_password: passwords.value.new,
      new_password_confirmation: passwords.value.confirm
    })

    success('Contraseña actualizada correctamente', '¡Éxito!')
    resetPasswordFields()
  } catch (err: any) {
    console.error('Error actualizando contraseña:', err)

    // Manejar errores específicos del backend
    if (err.response?.status === 401) {
      showError('La contraseña actual es incorrecta', 'Error de autenticación')
    } else if (err.response?.status === 422) {
      const errors = err.response?.data?.errors
      if (errors) {
        // Mostrar el primer error de validación
        const firstErrorKey = Object.keys(errors)[0]
        const firstError = errors[firstErrorKey]
        showError(Array.isArray(firstError) ? firstError[0] : firstError, 'Error de validación')
      } else {
        showError(err.response?.data?.message || 'Los datos ingresados no son válidos', 'Error de validación')
      }
    } else {
      showError(err.response?.data?.message || 'Error al actualizar contraseña. Intenta nuevamente', 'Error')
    }
  } finally {
    updatingPassword.value = false
  }
}

const resetPasswordFields = () => {
  passwords.value = {
    current: '',
    new: '',
    confirm: ''
  }
}

const saveNotifications = async () => {
  savingNotifications.value = true
  try {
    success('Preferencias de notificación guardadas', '¡Guardado!')
  } catch (err) {
    console.error('Error guardando notificaciones:', err)
    showError('Error al guardar preferencias de notificación', 'Error')
  } finally {
    savingNotifications.value = false
  }
}

const resetNotifications = () => {
  notifications.value.forEach(n => {
    if (n.title === 'Correos de novedades' || n.title === 'Alertas de propiedades' || n.title === 'Promociones especiales') {
      n.enabled = true
    } else {
      n.enabled = false
    }
  })
}

const savePreferences = async () => {
  savingPreferences.value = true
  try {
    success('Preferencias guardadas correctamente', '¡Guardado!')
  } catch (err) {
    console.error('Error guardando preferencias:', err)
    showError('Error al guardar preferencias', 'Error')
  } finally {
    savingPreferences.value = false
  }
}

const resetPreferences = () => {
  userPreferences.value = {
    theme: 'light',
    language: 'es',
    timezone: 'America/Bogota',
    units: 'metric'
  }
}

const confirmLogout = () => {
  confirm(
    '¿Estás seguro de que deseas cerrar sesión?',
    () => logoutUser(),
    () => console.log('Logout cancelado'),
    {
      title: 'Cerrar Sesión',
      confirmText: 'Sí, cerrar sesión',
      cancelText: 'Cancelar'
    }
  )
}

const logoutUser = async () => {
  try {
    await api.post('/auth/logout')
    success('Sesión cerrada correctamente', '¡Hasta pronto!')
    setTimeout(() => {
      router.push('/login')
    }, 1000)
  } catch (err) {
    console.error('Error cerrando sesión:', err)
    router.push('/login')
  }
}

// Lifecycle
onMounted(() => {
  loadUserData()

  const savedLang = localStorage.getItem('lang')
  if (savedLang) {
    userPreferences.value.language = savedLang
    locale.value = savedLang
  }
})

</script>

<style scoped>
@import '../../assets/css/Dropdown/SettingsView.css';
</style>