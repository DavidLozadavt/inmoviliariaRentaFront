  <template>
    <router-view />
    <AlertsContainer />
    <VoiceAssistant />
  </template>

  <script setup lang="ts">
  import './assets/css/styles.css';
  import AlertsContainer from './components/AlertsContainer.vue'
  import VoiceAssistant from './components/VoiceAssistant.vue'
  </script>
