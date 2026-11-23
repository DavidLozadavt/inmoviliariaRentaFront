  <template>
    <router-view />
    <AlertsContainer />
    <!-- El visor 3D público (enlace compartido / iframe) va sin asistente -->
    <VoiceAssistant v-if="route.name !== 'Visor3dPublic'" />
  </template>

  <script setup lang="ts">
  import './assets/css/styles.css';
  import './assets/css/visor3d.css';
  import AlertsContainer from './components/AlertsContainer.vue'
  import VoiceAssistant from './components/VoiceAssistant.vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  </script>
