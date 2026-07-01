<!-- src/components/VoiceAssistant.vue -->
<template>
  <div class="va-root">
    <!-- ═══════════════════════════════════════
         FLOATING BUTTON
    ═══════════════════════════════════════ -->
    <Transition name="va-fab-enter">
      <button v-if="!isOpen" class="va-fab" :class="{
        'va-fab--listening': isListening,
        'va-fab--processing': isProcessing,
        'va-fab--speaking': isSpeaking,
      }" @click="togglePanel" :aria-label="fabAriaLabel" :title="fabAriaLabel">
        <div class="va-fab__pulse" v-if="isListening || isSpeaking"></div>
        <div class="va-fab__icon">
          <!-- Idle: microphone -->
          <svg v-if="!isListening && !isProcessing && !isSpeaking" width="42" height="42" viewBox="0 0 24 24" fill="none" class="lyra-unified-core">
            <circle cx="12" cy="12" r="10" stroke="var(--va-brand)" stroke-width="0.5" stroke-dasharray="2 2" class="core-ring-outer" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--va-gold)" stroke-width="1.2" stroke-linecap="round" class="core-ring-spin" />
            <path d="M12 6l3 1.7v3.5L12 13l-3-1.7V7.7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" class="core-pulse" />
          </svg>
          <!-- Listening: animated waves -->
          <div v-else-if="isListening" class="va-waves">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <!-- Processing: spinner -->
          <div v-else-if="isProcessing" class="va-spinner"></div>
          <!-- Speaking: sound wave -->
          <svg v-else-if="isSpeaking" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        </div>
      </button>
    </Transition>

    <!-- ═══════════════════════════════════════
         EXPANDED PANEL
    ═══════════════════════════════════════ -->
    <Transition name="va-panel">
      <div v-if="isOpen" 
        class="va-panel" 
        ref="vaPanelRef"
        :class="{ 
          'va-panel--minimized': isMinimized,
          'va-panel--pulse': showPulse 
        }"
        role="dialog" 
        aria-label="Asistente de voz Rentus">
        
        <!-- Panel Header -->
        <div class="va-panel__header" @click="isMinimized ? isMinimized = false : null">
          <div class="va-panel__header-info">
            <div class="va-panel__avatar">
              <span class="lyra-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="lyra-unified-core">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.3" />
                  <path d="M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
                  <circle cx="12" cy="12" r="2.5" fill="var(--va-gold)" />
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" stroke-width="1" opacity="0.5" />
                </svg>
              </span>
            </div>
            <div>
              <div v-if="isMinimized && lastAssistantMessage" class="va-panel__mini-msg">
                {{ lastAssistantMessage.content }}
              </div>
              <div v-else-if="!isMinimized">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <h3 class="va-panel__title">Lyra</h3>
                  <!-- Indicador de escucha en miniatura -->
                  <div v-if="isListening" class="va-waves va-waves--mini">
                    <span></span><span></span><span></span>
                  </div>
                </div>
                <span class="va-panel__status">{{ statusText }}</span>
              </div>
            </div>
          </div>
          
          <div class="va-panel__actions" style="display: flex; gap: 8px;">
            <!-- Stop Speaking (Item 3) -->
            <button v-if="isSpeaking" class="va-panel__close va-panel__close--stop" @click.stop="stopSpeaking" title="Detener voz">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
            <!-- Toggle Minimize -->
            <button class="va-panel__close" @click.stop="isMinimized = !isMinimized" :title="isMinimized ? 'Expandir' : 'Minimizar'">
              <svg v-if="!isMinimized" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 14h6v6m10-10h-6V4"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 3v5H3m13-5v5h5m0 11h-5v5m-13 0v-5h5"/></svg>
            </button>
            <button class="va-panel__close" @click="togglePanel" aria-label="Cerrar asistente">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Floating Chips (when Minimized) -->
        <Transition name="va-fade-up">
          <div v-if="isMinimized && suggestedChips.length > 0 && !isStreaming && !isProcessing" 
            class="va-chips va-chips--floating">
            <button v-for="chip in suggestedChips" :key="chip.label" class="va-chip" @click="submitText(chip.label, chip.action)">
              {{ chip.label }}
            </button>
          </div>
        </Transition>

        <!-- Panel Body -->
        <div v-show="!isMinimized" class="va-panel__body" ref="panelBodyRef">
          <!-- Maintenance screen -->
          <div v-if="isMaintenance" class="va-maintenance">
            <div class="va-maintenance__icon">🔧</div>
            <h4>Lyra está en mantenimiento</h4>
            <p>{{ maintenanceMessage || 'Estamos mejorando el asistente. Vuelve pronto.' }}</p>
          </div>

          <!-- Welcome message -->
          <div v-else-if="!assistantMessage && !transcript && !error" class="va-welcome">
            <div class="va-welcome__icon">
              <!-- IA Unified Core: Inspired by JARVIS (Blue), FRIDAY (Red), EDITH (Tactical) -->
              <div class="stark-core-container">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" class="stark-unified-core">
                  <!-- EDITH Layer: Tactical Hexagons & Data -->
                  <path d="M12 2l8.6 5v10L12 22l-8.6-5V7L12 2z" stroke="var(--va-brand)" stroke-width="0.5" opacity="0.3" />
                  <path d="M12 5l6 3.5v7L12 19l-6-3.5v-7L12 5z" stroke="currentColor" stroke-width="1" stroke-dasharray="2 1" />
                  
                  <!-- FRIDAY Layer: Dynamic Orbital Rings -->
                  <circle cx="12" cy="12" r="11" stroke="#f87171" stroke-width="0.5" stroke-dasharray="4 4" class="ring-friday" />
                  
                  <!-- JARVIS Layer: Central Soul -->
                  <circle cx="12" cy="12" r="3" fill="#60a5fa" class="core-jarvis">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                  
                  <!-- Data Lines -->
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="0.8" opacity="0.6" />
                </svg>
              </div>
            </div>
            <h4>Hola, soy Lyra</h4>
            <p>Tu guía inteligente en RentUs. ¿En qué ciudad buscamos hoy? Puedes decirme:</p>
            <div class="va-welcome__examples">
              <button class="va-example" @click="submitText('Busco un apartamento en Santa Marta cerca al mar')">
                "Busco un apartamento en Santa Marta cerca al mar"
              </button>
              <button class="va-example" @click="submitText('Casas amplias en Medellín por menos de 4 millones')">
                "Casas amplias en Medellín por menos de 4 millones"
              </button>
              <button class="va-example" @click="submitText('Un estudio amueblado en Chapinero, Bogotá')">
                "Un estudio amueblado en Chapinero, Bogotá"
              </button>
            </div>
          </div>

          <!-- Conversation -->
          <div v-if="conversationHistory.length > 0 || isProcessing" class="va-conversation" ref="messagesContainer">
            <template v-for="(msg, index) in conversationHistory" :key="index">
              <!-- User message -->
              <div v-if="msg.role === 'user'" class="va-msg va-msg--user">
                <div class="va-msg__bubble">
                  <span class="va-msg__role">Tú</span>
                  <p>{{ msg.content }}</p>
                </div>
              </div>

              <!-- Assistant response -->
              <div v-else-if="msg.role === 'assistant'" class="va-msg va-msg--assistant">
                <div class="va-msg__bubble" :class="{ 'va-msg__bubble--streaming': msg.streaming }">
                  <span class="va-msg__role">Lyra</span>
                  <p>{{ msg.content }}</p>

                  <!-- Suggested Chips (Only on the very last assistant message) -->
                  <div v-if="index === conversationHistory.length - 1 && suggestedChips.length > 0 && !isStreaming && !isProcessing" 
                    class="va-chips">
                    <button v-for="chip in suggestedChips" :key="chip.label" class="va-chip" @click="submitText(chip.label, chip.action)">
                      {{ chip.label }}
                    </button>
                  </div>

                  <!-- Result count: only on the last message if applicable -->
                  <div v-if="index === conversationHistory.length - 1 && propertiesCount > 0 && !isProcessing"
                    class="va-result-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    {{ propertiesCount }} propiedad{{ propertiesCount > 1 ? 'es' : '' }} encontrada{{ propertiesCount >
                      1 ? 's' : '' }}
                  </div>
                  <!-- Clarification indicator: only on the last message if applicable -->
                  <div v-if="index === conversationHistory.length - 1 && needsClarification && !isProcessing"
                    class="va-clarification">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>Lyra necesita más información</span>
                  </div>
                  <!-- Navigate to map suggestion -->
                  <button v-if="index === conversationHistory.length - 1 && shouldSuggestMap && !isProcessing"
                    class="va-goto-map" @click="navigateToMap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    Ver en el mapa
                  </button>
                </div>
              </div>
            </template>

            <!-- Current User Message (if process has started but not finished, add it to history manually later, or display transcript here) -->
            <div v-if="transcript && isProcessing" class="va-msg va-msg--user">
              <div class="va-msg__bubble">
                <span class="va-msg__role">Tú</span>
                <p>{{ transcript }}</p>
              </div>
            </div>

            <!-- Assistant typing indicator -->
            <div v-if="isProcessing" class="va-msg va-msg--assistant">
              <div class="va-msg__bubble va-msg__bubble--typing">
                <span class="va-msg__role">Lyra</span>
                <div class="va-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="error" class="va-error" :class="{ 'va-error--maintenance': isMaintenance }">
            <svg v-if="!isMaintenance" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Panel Footer -->
        <div v-show="!isMinimized" class="va-panel__footer">
          <!-- Text fallback input -->
          <div class="va-input-row">
            <input ref="textInputRef" v-model="textInput" class="va-text-input" type="text"
              :placeholder="speechSupported ? 'Escribe o usa el micrófono...' : 'Escribe tu consulta...'"
              @keydown.enter="submitText(textInput)" :disabled="isProcessing || isMaintenance" aria-label="Escribe tu consulta" />
            <button v-if="speechSupported" class="va-mic-btn" :class="{
              'va-mic-btn--active': isListening,
              'va-mic-btn--disabled': isProcessing || isMaintenance,
            }" @click="toggleListening" :disabled="isProcessing || isMaintenance"
              :aria-label="isListening ? 'Dejar de escuchar' : 'Hablar'">
              <svg v-if="!isListening" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <div v-else class="va-waves va-waves--small">
                <span></span><span></span><span></span>
              </div>
            </button>
            <button class="va-send-btn" @click="submitText(textInput)" :disabled="isProcessing || !textInput.trim() || isMaintenance"
              aria-label="Enviar consulta">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>

          <!-- Live transcript -->
          <Transition name="va-fade">
            <div v-if="isListening && liveTranscript" class="va-live-transcript">
              <div class="va-live-dot"></div>
              {{ liveTranscript }}
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- Modal de visita controlado por Lyra -->
    <RequestVisitModal
      v-if="showVisitModal && visitModalProperty"
      :open="showVisitModal"
      :property="visitModalProperty"
      @close="showVisitModal = false"
      @success="showVisitModal = false"
      @visit-confirmed="handleVisitConfirmed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import api from '@/services/api';
import { eventBus, EVENTS } from '@/events/eventBus';
import { useLyraStatus } from '@/composables/useLyraStatus';
import { authService } from '@/services/auth';
import RequestVisitModal from '@/components/modals/ModalRequest/RequestVisitModal.vue';

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const isOpen = ref(false);
const isListening = ref(false);
const isProcessing = ref(false);
const isSpeaking = ref(false);
const isMinimized = ref(false); 
const showPulse = ref(false); 
const lastResponsesBlacklist = ref<string[]>([]); // ITEM 2: Blacklist de eco

// Helper para similarity (ITEM 2)
function getSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function editDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// ── ITEM 3: Sanitización de Markdown para Voz ───────────────────────
function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2')    // italic
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // links
    .replace(/#{1,6}\s+(.+)/g, '$1')    // headers
    .replace(/`([^`]+)`/g, '$1');       // inline code
}

const router = useRouter();
const route = useRoute();

watch(route, () => {
  // ITEM 2: Minimizar al navegar
  if (isOpen.value) {
    isMinimized.value = true;
  }
});

watch(isMinimized, (val) => {
  if (!val) showPulse.value = false;
});
const transcript = ref('');
const liveTranscript = ref('');
const assistantMessage = ref('');
const textInput = ref('');
const error = ref<string | null>(null);

const { status: lyraStatus, message: maintenanceMessage } = useLyraStatus();
const isMaintenance = computed(() => lyraStatus.value === 'maintenance');
const propertiesCount = ref(0);
const activeFilters = ref<Record<string, any>>({});
const needsClarification = ref(false);
const suggestedChips = ref<{ label: string; action: string | null }[]>([]);
const streamingMessage = ref('');
const isStreaming = ref(false);
const sessionId = sessionStorage.getItem('lyra_sessionId') || `va_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
sessionStorage.setItem('lyra_sessionId', sessionId);

const showVisitModal = ref(false);
const visitModalProperty = ref<any>(null);
const pendingSuggestion = ref<boolean | null>(null); // FLAG: ¿Hay una ciudad sugerida esperando confirmación?
const suggestedCity = ref<string | null>(null); // DATA: Ciudad sugerida
const lastSearchedCity = ref<string | null>(null); // DATA: Última ciudad con resultados
const userCoordinates = ref<{ lat: number; lng: number } | null>(null); // DATA: Coordenadas GPS

const conversationHistory = ref<{ role: string; content: string; streaming?: boolean }[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);
const vaPanelRef = ref<HTMLElement | null>(null);
const textInputRef = ref<HTMLInputElement | null>(null);
const silenceTimer = ref<any>(null);
const autoSpeechEnabled = ref(false); // Voz desactivada por defecto para más rapidez

// ─────────────────────────────────────────────
// SPEECH RECOGNITION
// ─────────────────────────────────────────────
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let speechSupported = false;
if (SpeechRecognition) {
  try {
    new SpeechRecognition();
    speechSupported = true;
  } catch (e) {
    speechSupported = false;
  }
}
let recognition: any = null;

if (speechSupported) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'es-CO';
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let interim = '';
    let finalSelection = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalSelection = t;
      } else {
        interim += t;
      }
    }
    
    const currentText = (finalSelection || interim).trim();
    if (currentText.length > 1) {
      // ── ITEM 3: Deshabilitar interrupción por voz ──────────────────
      if (isSpeaking.value) {
        // Modo sordo absoluto: no procesamos nada mientras Lyra habla
        return; 
      }

      // ── ITEM 2: Blacklist de frases propias ────────────────────────
      const isEcho = lastResponsesBlacklist.value.some(phrase => {
        return getSimilarity(currentText, phrase) > 0.6;
      });

      if (isEcho) {
        console.log('[Lyra] Blacklist match detected (echo), ignoring:', currentText);
        return;
      }

      liveTranscript.value = currentText;
      
      if (silenceTimer.value) clearTimeout(silenceTimer.value);
      silenceTimer.value = setTimeout(() => {
        const textToSubmit = liveTranscript.value;
        if (textToSubmit.trim().length > 1) {
          submitText(textToSubmit);
          liveTranscript.value = '';
          transcript.value = '';
        }
      }, 1200);
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error === 'no-speech') return;
    console.warn('[VoiceAssistant] recognition error:', event.error);
    isListening.value = false;
    liveTranscript.value = '';
  };

  recognition.onend = () => {
    if (isListening.value && !isSpeaking.value) {
      try {
        recognition.start();
      } catch { /* ignore */ }
    }
  };
}

// ─────────────────────────────────────────────
// SPEECH SYNTHESIS
// ─────────────────────────────────────────────
const synth = window.speechSynthesis;

let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked || !synth) return;
  const utterance = new SpeechSynthesisUtterance('');
  utterance.volume = 0;
  synth.speak(utterance);
  audioUnlocked = true;
}

let cachedVoice: SpeechSynthesisVoice | null = null;

async function getBestVoice(): Promise<SpeechSynthesisVoice | null> {
  if (cachedVoice) return cachedVoice;

  let voices = synth.getVoices();
  
  if (voices.length === 0) {
    await new Promise<void>(resolve => {
      let resolved = false;
      const fallback = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          synth.onvoiceschanged = null;
          resolve();
        }
      }, 500);
      
      synth.onvoiceschanged = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(fallback);
          synth.onvoiceschanged = null;
          resolve();
        }
      };
    });
    voices = synth.getVoices();
  }

  if (voices.length === 0) return null;

  const exactMatches = [
    'Google español',
    'Google US Spanish',
    'Microsoft Sabina',
    'Microsoft Dalia'
  ];

  for (const name of exactMatches) {
    const match = voices.find(v => v.name === name);
    if (match) {
      cachedVoice = match;
      return match;
    }
  }

  const googleVoice = voices.find(v => v.name.includes('Google'));
  if (googleVoice) {
    cachedVoice = googleVoice;
    return googleVoice;
  }

  const msVoice = voices.find(v => v.name.includes('Microsoft'));
  if (msVoice) {
    cachedVoice = msVoice;
    return msVoice;
  }

  const esVoice = voices.find(v => v.lang.toLowerCase().startsWith('es'));
  if (esVoice) {
    cachedVoice = esVoice;
    return esVoice;
  }

  cachedVoice = voices[0];
  return cachedVoice;
}

function playSound(type: 'start' | 'process' | 'success') {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'start') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  } else if (type === 'process') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  }

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

async function speak(text: string) {
  if (!synth || !text) return;

  // Interrumpir cualquier habla previa
  if (synth.speaking) synth.cancel();

  // ── CAPA 1: Mute del micrófono mientras Lyra habla ──────────────
  if (isListening.value && recognition) {
    try { recognition.stop(); } catch(e) {}
  }

  isSpeaking.value = true;
  assistantMessage.value = text;

  // ── ITEM 2: Blacklist (mantener últimas 3) ──────────────────────
  lastResponsesBlacklist.value.unshift(text);
  if (lastResponsesBlacklist.value.length > 3) {
    lastResponsesBlacklist.value.pop();
  }

  // ── ITEM 3: Sanitización de Markdown ────────────────────────────
  const cleanText = stripMarkdown(text);
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;

  const bestVoice = await getBestVoice();
  if (bestVoice) {
    utterance.voice = bestVoice;
    utterance.lang = bestVoice.lang || 'es-CO';
  } else {
    utterance.lang = 'es-CO';
  }

  utterance.onend = () => {
    isSpeaking.value = false;
    
    // ── ITEM 2: Silence Buffer Dinámico (Resuelve eco y naturalidad) ──
    const wordCount = text.split(/\s+/).length || 1;
    const dynamicBuffer = Math.min(Math.max(wordCount * 50, 800), 2000);
    
    console.log(`[Lyra] Speech ended (${wordCount} words). Waiting ${dynamicBuffer}ms for eco dissipation...`);
    
    setTimeout(() => {
      if (isListening.value && recognition && !isSpeaking.value) {
        try { recognition.start(); } catch(e) {}
      }
    }, dynamicBuffer);
  };

  utterance.onerror = () => {
    isSpeaking.value = false;
    setTimeout(() => {
      if (isListening.value && recognition && !isSpeaking.value) {
        try { recognition.start(); } catch(e) {}
      }
    }, 1000);
  };

  synth.speak(utterance);
}

function stopSpeaking() {
  if (synth.speaking) {
    synth.cancel();
    isSpeaking.value = false;
    // Forzamos reinicio tras parada manual
    if (isListening.value && recognition) {
      setTimeout(() => {
        try { recognition.start(); } catch(e) {}
      }, 500);
    }
  }
}

// ─────────────────────────────────────────────
// COMPUTED
// ─────────────────────────────────────────────
const statusText = computed(() => {
  if (isMaintenance.value) return '🛠️ En mantenimiento';
  if (isListening.value) return '🎙️ Escuchando...';
  if (isProcessing.value) return '🔍 Procesando...';
  if (isSpeaking.value) return '🔊 Hablando...';
  return '💬 Listo para ayudarte';
});

const fabAriaLabel = computed(() => {
  if (isListening.value) return 'Asistente escuchando';
  if (isProcessing.value) return 'Asistente procesando';
  if (isSpeaking.value) return 'Asistente hablando';
  return 'Abrir asistente de voz';
});

const isOnMapView = computed(() => {
  return route.path === '/mapa' || route.name === 'MapExplorer';
});

const shouldSuggestMap = computed(() => {
  return propertiesCount.value > 0 && !isOnMapView.value;
});

const lastAssistantMessage = computed(() => {
  return [...conversationHistory.value].reverse().find(m => m.role === 'assistant');
});

// ─────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────
function togglePanel() {
  unlockAudio();
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      textInputRef.value?.focus();
    });
  } else {
    // Stop everything when closing
    stopListening();
    synth?.cancel();
    isSpeaking.value = false;
  }
}

function toggleListening() {
  unlockAudio();
  if (isListening.value) {
    stopListening();
  } else {
    startListening();
  }
}

function startListening() {
  if (!recognition) return;
  playSound('start');
  error.value = null;
  liveTranscript.value = '';
  isListening.value = true;
  try {
    recognition.start();
  } catch (e) {
    console.warn('[VoiceAssistant] recognition start error:', e);
    isListening.value = false;
  }
}

function stopListening() {
  if (!recognition) return;
  isListening.value = false;
  liveTranscript.value = '';
  try {
    recognition.stop();
  } catch { /* already stopped */ }
}


function submitText(text: string, chipAction: string | null = null) {
  unlockAudio();
  const trimmed = (text || '').trim();
  if (!trimmed || isProcessing.value) return;
  
  if (isListening.value) {
    playSound('process');
  }

  transcript.value = trimmed;
  textInput.value = '';
  error.value = null;
  processQuery(trimmed, false, chipAction);
}

let retryCount = 0;

async function streamAssistantMessage(fullText: string) {
  isStreaming.value = true;
  streamingMessage.value = '';
  
  // Añadir al historial marcador de streaming
  const msgIndex = conversationHistory.value.length;
  conversationHistory.value.push({ role: 'assistant', content: '', streaming: true });

  const words = fullText.split(' ');
  for (let i = 0; i < words.length; i++) {
    streamingMessage.value += (i === 0 ? '' : ' ') + words[i];
    conversationHistory.value[msgIndex].content = streamingMessage.value;
    
    // Auto-scroll
    scrollToBottom();
    
    // Delay natural
    await new Promise(resolve => setTimeout(resolve, 40 + Math.random() * 30));
  }

  conversationHistory.value[msgIndex].streaming = false;
  isStreaming.value = false;
}

async function processQuery(text: string, skipHistory = false, chipAction: string | null = null) {
  if (isMaintenance.value) {
    handleError(maintenanceMessage.value || 'Lyra está en mantenimiento en este momento. Vuelve pronto.');
    return;
  }

  isProcessing.value = true;
  error.value = null;
  assistantMessage.value = '';
  propertiesCount.value = 0;
  activeFilters.value = {};
  needsClarification.value = false;
  suggestedChips.value = []; // Reset chips

  let userLat: number | null = null;
  let userLng: number | null = null;

  const lowerText = text.toLowerCase();
  const locationPhrases = [
    'mi ubicación', 'mi ubicacion', 'cerca de mí', 'cerca de mi', 'donde estoy',
    'propiedades cercanas', 'cerca de acá', 'cerca de aca', 
    'algo cerca', 'qué hay cerca', 'que hay cerca', 'por aquí', 'por aqui',
    'por acá', 'por aca', 'cerca a mi', 'mi zona', 'mi sector'
  ];
  const affirmationPhrases = ['si', 'sí', 'claro', 'dale', 'ya esta', 'ya está', 'activo', 'listo', 'hazlo'];
  
  const needsLocation = locationPhrases.some(phrase => lowerText.includes(phrase)) || 
                       (localStorage.getItem('lyra_awaiting_gps') === 'true' && affirmationPhrases.some(phrase => lowerText.includes(phrase)));

  if (needsLocation) {
    if (!navigator.geolocation) {
      handleError('Tu navegador no soporta geolocalización. ¿En qué ciudad deseas buscar?');
      isProcessing.value = false;
      localStorage.removeItem('lyra_awaiting_gps');
      return;
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true });
      });
      userLat = pos.coords.latitude;
      userLng = pos.coords.longitude;
      userCoordinates.value = { lat: userLat, lng: userLng };
      localStorage.removeItem('lyra_awaiting_gps');
    } catch (err) {
      handleError('Para mostrarte propiedades cercanas necesito tu ubicación. ¿Puedes activar el GPS en tu navegador?');
      isProcessing.value = false;
      return;
    }
  }

  try {
    const response = await api.post('/lyra/interpret', {
      text,
      session_id: sessionId,
      user_lat: userLat,
      user_lng: userLng,
      pending_suggestion: pendingSuggestion.value ?? null,
      suggested_city: suggestedCity.value ?? null,
      chip_action: chipAction,
      context: {
        last_city: lastSearchedCity.value,
        coordinates: userCoordinates.value
      }
    });

    const data = response.data;

    if (data.success) {
      // ── MAPA: PINES UNO A UNO (Canal paralelo) ───────────────────────
      if (data.properties && data.properties.length > 0) {
        // Emitir uno a uno con delay para el efecto visual
        const props = [...data.properties];
        propertiesCount.value = props.length;
        
        // Empezamos a soltar pines incluso antes de terminar de procesar el texto
        (async () => {
          for (let i = 0; i < props.length; i++) {
            eventBus.emit(EVENTS.VOICE_PROPERTIES_FOUND, [props[i]]);
            await new Promise(r => setTimeout(r, 150));
          }
        })();
      }

      // ── FILTROS Y MAPA ──────────────────────────────────────────────
      if (data.filters_applied) {
        eventBus.emit(EVENTS.VOICE_FILTERS_APPLIED, data.filters_applied);
        if (data.filters_applied.city) {
          lastSearchedCity.value = data.filters_applied.city;
        }
      }
      if (data.map_center) {
        if (!isOnMapView.value) {
          router.push({ name: 'MapExplorer' });
          setTimeout(() => {
            eventBus.emit(EVENTS.VOICE_MAP_CENTER, data.map_center);
          }, 800);
        } else {
          eventBus.emit(EVENTS.VOICE_MAP_CENTER, data.map_center);
        }
      }

      // ── TEXTO: STREAMING (Canal conversación) ────────────────────────
      isProcessing.value = false; // Paramos el spinner de carga para mostrar el streaming
      suggestedChips.value = data.suggested_chips || [];
      needsClarification.value = data.needs_clarification || false;
      
      // Actualizar estado de sugerencia pendiente basado en la respuesta
      pendingSuggestion.value = data.pending_suggestion || false;
      suggestedCity.value = data.suggested_city || null;
      
      // Si la respuesta fue exitosa y ya procesamos la sugerencia, limpiamos el flag
      if (data.success && !data.pending_suggestion) {
        pendingSuggestion.value = false;
        suggestedCity.value = null;
      }
      
      // Añadir mensaje del usuario al historial antes del streaming (si no es un evento automático)
      if (!skipHistory) {
        conversationHistory.value.push({ role: 'user', content: text });
      }
      
      await streamAssistantMessage(data.response_text || 'Listo.');

      // Feedback visual si Lyra responde mientras está minimizada
      if (isMinimized.value) {
        showPulse.value = true;
        setTimeout(() => showPulse.value = false, 3000);
      }

      // ── VOZ (Opcional por texto primero) ───────────────────────────
      if (autoSpeechEnabled.value) {
        speak(data.response_text || '');
      }

      // ── VOICE ACTIONS ───────────────────────────────────────────────
      if (data.voice_action) {
        const payload = data.voice_action_payload ?? {};

        switch (data.voice_action) {
          case 'auto_minimize':
            setTimeout(() => {
              isMinimized.value = true;
            }, data.auto_minimize_delay || 3000);
            break;

          case 'view_property':
            if (payload.id) {
              eventBus.emit(EVENTS.LYRA_VIEW_PROPERTY, { id: payload.id });
              if (!isOnMapView.value) {
                setTimeout(() => router.push({ name: 'PropertyDetail', params: { id: payload.id } }), 800);
              }
            }
            break;

          case 'open_visit_modal':
            if (payload && payload.id) {
              visitModalProperty.value = payload;
              showVisitModal.value = true;
              eventBus.emit(EVENTS.LYRA_OPEN_VISIT_MODAL, payload);
            }
            break;

          case 'auth_resume':
            const resumePayload = data.voice_action_payload ?? {};
            // ── ITEM: Persistir contexto completo y redirigir ─────────────
            sessionStorage.setItem('lyra_pending_auth_context', JSON.stringify({
              timestamp: Date.now(),
              property: resumePayload.property || visitModalProperty.value || (data.properties ? data.properties[0] : null),
              fecha: resumePayload.fecha || '',
              hora: resumePayload.hora || '',
              lastPath: route.fullPath
            }));
            localStorage.setItem('lyra_pending_resume_flag', 'true');
            
            router.push({ name: 'Login', query: { redirect: route.fullPath } });
            break;

          case 'enable_gps_tracking':
            eventBus.emit(EVENTS.LYRA_ENABLE_GPS);
            break;
        }
      }

      // ── REQUIRES LOCATION: auto GPS re-send ─────────────────────
      if (data.requires_location) {
        let gpsSuccess = false;
        // Auto-capture GPS and re-send the same request with coordinates
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 8000,
              enableHighAccuracy: true,
            });
          });
          // Re-send with coordinates
          const retryResponse = await api.post('/lyra/interpret', {
            text,
            session_id: sessionId,
            user_lat: pos.coords.latitude,
            user_lng: pos.coords.longitude,
            pending_suggestion: pendingSuggestion.value ?? null,
            suggested_city: suggestedCity.value ?? null,
            chip_action: chipAction
          });
          const retryData = retryResponse.data;
          
          if (retryData.success && retryData.response_text) {
            gpsSuccess = true;
            // Update the last assistant message with the retry result
            if (conversationHistory.value.length > 0) {
              conversationHistory.value[conversationHistory.value.length - 1].content = retryData.response_text;
            }
            assistantMessage.value = retryData.response_text;
            propertiesCount.value = retryData.properties?.length ?? 0;
            activeFilters.value = retryData.filters_applied || {};

            if (retryData.properties && retryData.properties.length > 0) {
              eventBus.emit(EVENTS.VOICE_PROPERTIES_FOUND, retryData.properties);
            }
            if (retryData.filters_applied) {
              eventBus.emit(EVENTS.VOICE_FILTERS_APPLIED, retryData.filters_applied);
            }
            if (retryData.map_center) {
              if (!isOnMapView.value) {
                router.push({ name: 'MapExplorer' });
                setTimeout(() => eventBus.emit(EVENTS.VOICE_MAP_CENTER, retryData.map_center), 800);
              } else {
                eventBus.emit(EVENTS.VOICE_MAP_CENTER, retryData.map_center);
              }
            }
            
            // Handle actions from retry
            if (retryData.voice_action === 'enable_gps_tracking') {
              eventBus.emit(EVENTS.LYRA_ENABLE_GPS);
            }

            speak(retryData.response_text || '');
          }
        } catch {
          // GPS failed — fall back to original message
        }
        
        if (!gpsSuccess) {
          speak(data.response_text || '');
        }
      } else {
        // Normal flow (no location prompt)
        speak(data.response_text || '');
      }
      
      localStorage.removeItem('lyra_awaiting_gps');
      retryCount = 0;
    } else {
      handleError('No pude procesar tu solicitud. Inténtalo de nuevo.');
    }

  } catch (err: any) {
    console.error('[VoiceAssistant] API error:', err);

    // NUEVO: Manejo específico de mantenimiento (503)
    if (err.response?.status === 503 && err.response?.data?.maintenance) {
      retryCount = 0;
      isProcessing.value = false;
      handleError(err.response.data.message || 'Lyra está en mantenimiento en este momento. Vuelve pronto.');
      return;
    }

    // Retry once on network error
    if (retryCount < 1) {
      retryCount++;
      setTimeout(() => processQuery(text), 1500);
      return;
    }

    retryCount = 0;

    if (err.response?.status === 429) {
      handleError('Has hecho muchas consultas seguidas. Espera un momento e intenta de nuevo.');
    } else if (err.response?.status === 422) {
      handleError('No pude entender tu consulta. Intenta con otras palabras.');
    } else {
      handleError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    }
  } finally {
    isProcessing.value = false;
    scrollToBottom();
  }
}

function handleError(msg: string) {
  error.value = msg;
  assistantMessage.value = '';
}


function navigateToMap() {
  router.push({ name: 'MapExplorer' });
  // Emit after a brief delay so the map component has time to mount
  setTimeout(() => {
    eventBus.emit(EVENTS.VOICE_NAVIGATE_MAP, true);
  }, 800);
}

const handleVisitConfirmed = ({ property: _property, date, time }: any) => {
    showVisitModal.value = false;
    
    // Formatear para enviar a Lyra y cerrar el flujo de cache
    const dateObj = new Date(date + 'T12:00:00');
    const dateFormatted = dateObj.toLocaleDateString('es-CO', {
        weekday: 'long', day: 'numeric', month: 'long'
    });
    const timeFormatted = time.substring(0, 5); // "10:00"
    
    // Enviar al backend de Lyra para que limpie los estados de cache
    submitText(`visita confirmada para el ${dateFormatted} a las ${timeFormatted}`);
};

const scrollToBottom = () => {
  if (!messagesContainer.value) return
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }, 150)
}
watch(() => conversationHistory.value.length, scrollToBottom)

// ─────────────────────────────────────────────
// KEYBOARD SHORTCUT
// ─────────────────────────────────────────────
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    togglePanel();
  }
}

onMounted(() => {
  localStorage.removeItem('lyra_awaiting_gps');
  document.addEventListener('keydown', handleKeydown);
  if (synth) synth.getVoices();

  // VisualViewport logic for Mobile Keyboard
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize);
  }

  // Bug 1 Fix: Limpiar estilos inline al volver a desktop
  window.addEventListener('resize', handleWindowResize);

  // ── ITEM: Suscripción a Pusher para auto-retomar (Item 2) ────────
  const echo = (window as any).Echo;
  if (echo) {
    // Escuchamos en un canal público basado en la sesión para el evento de auth
    echo.channel(`lyra-auth-${sessionId}`)
      .listen('.user.authenticated', (data: any) => {
        console.log('[Lyra] Pusher: Usuario autenticado detectado!', data);
        handlePostLoginResume();
      });
  }

  // ── Escuchar evento de login interno ───────────────────────────
  eventBus.on(EVENTS.USER_LOGGED_IN, handlePostLoginResume);

  // ── Si el usuario acaba de volver del login ───────────────────
  const hasPendingResume = localStorage.getItem('lyra_pending_resume_flag');
  if (hasPendingResume && authService.isAuthenticated()) {
    localStorage.removeItem('lyra_pending_resume_flag');
    resumeAfterAuth();
  }
});
async function resumeAfterAuth() {
  const contextRaw = sessionStorage.getItem('lyra_pending_auth_context');
  if (!contextRaw) return;

  const context = JSON.parse(contextRaw);
  const now = Date.now();

  // ── ITEM 1: TTL 10 minutos ─────────────────────────────────────
  if (now - (context.timestamp || 0) > 600000) {
    console.log('[Lyra] Contexto expirado (>10m). limpieza.');
    sessionStorage.removeItem('lyra_pending_auth_context');
    localStorage.removeItem('lyra_pending_resume_flag');
    return;
  }

  console.log('[Lyra] Bypass NLP: Ejecutando acción directa post-login.');

  // Preparar UI
  isOpen.value = true;
  isMinimized.value = false;
  isProcessing.value = true;

  try {
    const response = await api.post('/lyra/execute', {
      action: 'agendar_visita',
      session_id: sessionId,
      payload: {
        property: context.property,
        fecha: context.fecha,
        hora: context.hora
      }
    });

    const data = response.data;
    
    // Simular que Lyra habla y muestra el mensaje técnico como respuesta final
    conversationHistory.value.push({
      role: 'assistant',
      content: data.response_text
    });

    if (data.response_speech) {
      speak(data.response_speech);
    }

    // Limpiar banderas
    sessionStorage.removeItem('lyra_pending_auth_context');
    localStorage.removeItem('lyra_pending_resume_flag');

  } catch (error) {
    console.error('[Lyra] Error en ejecución directa:', error);
    conversationHistory.value.push({
      role: 'assistant',
      content: 'Hubo un problema al enviar tu solicitud automáticamente. Por favor, dime de nuevo: "Agendar visita".'
    });
  } finally {
    isProcessing.value = false;
  }
}

function handlePostLoginResume() {
  const hasPendingResume = localStorage.getItem('lyra_pending_resume_flag');
  if (hasPendingResume) {
    localStorage.removeItem('lyra_pending_resume_flag');
    resumeAfterAuth();
  }
}

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  eventBus.off(EVENTS.USER_LOGGED_IN, handlePostLoginResume);
  
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportResize);
  }

  window.removeEventListener('resize', handleWindowResize);
  
  stopListening();
  synth?.cancel();
});

const handleViewportResize = () => {
  if (!window.visualViewport || !vaPanelRef.value) return;
  
  // Bug 1 Fix: ignorar en desktop
  if (window.innerWidth > 768) return;

  // Solo en móvil (max-width 480px)
  if (window.innerWidth <= 480) {
    const alturaDisponible = window.visualViewport.height;
    
    if (isOpen.value && !isMinimized.value) {
      // Ajustar altura a 65vh del visual viewport (o lo que quede disponible)
      vaPanelRef.value.style.height = `${alturaDisponible * 0.65}px`;
      vaPanelRef.value.style.bottom = `0px`;
      
      // Auto-scroll al último mensaje para que no quede bajo el teclado
      scrollToBottom();
    } else if (isMinimized.value) {
      vaPanelRef.value.style.height = '56px';
      vaPanelRef.value.style.bottom = '0px';
    }
  }
};

const handleWindowResize = () => {
  if (window.innerWidth > 768 && vaPanelRef.value) {
    // Bug 1 Fix: Limpiar estilos inline para que el CSS de desktop tome el control
    vaPanelRef.value.style.cssText = '';
  }
};
</script>

<style scoped>
/* ═══════════════════════════════════════════════
   CSS VARIABLES (matching Rentus brand)
═══════════════════════════════════════════════ */
.va-root {
  --va-brand: #3D2314;
  --va-brand-mid: #6B3D2A;
  --va-brand-light: #C4976A;
  --va-brand-pale: #F5EDE4;
  --va-gold: #D4A853;
  --va-surface: #FEFDFB;
  --va-surface-alt: #F9F5F0;
  --va-border: #EDE5DA;
  --va-text: #1C1008;
  --va-text-secondary: #6B5B4E;
  --va-text-muted: #A8978A;
  --va-success: #059669;
  --va-error: #DC2626;

  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  font-family: 'Inter Tight', 'DM Sans', system-ui, sans-serif;
}

/* ═══════════════════════════════════════════════
   FLOATING ACTION BUTTON
═══════════════════════════════════════════════ */
.va-fab {
  position: relative;
  width: 74px;
  height: 74px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--va-brand) 0%, var(--va-brand-mid) 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 20px rgba(61, 35, 20, 0.35),
    0 0 0 0 rgba(212, 168, 83, 0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.va-fab:hover {
  transform: scale(1.08);
  box-shadow:
    0 6px 28px rgba(61, 35, 20, 0.45),
    0 0 0 4px rgba(212, 168, 83, 0.15);
}

.va-fab:active {
  transform: scale(0.95);
}

.va-fab--listening {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  animation: va-glow-green 2s ease-in-out infinite;
}

.va-fab--processing {
  background: linear-gradient(135deg, #6B3D2A 0%, #C4976A 100%);
}

.va-fab--speaking {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  animation: va-glow-blue 2s ease-in-out infinite;
}

@keyframes va-glow-green {

  0%,
  100% {
    box-shadow: 0 4px 20px rgba(5, 150, 105, 0.4), 0 0 0 0 rgba(16, 185, 129, 0.3);
  }

  50% {
    box-shadow: 0 4px 20px rgba(5, 150, 105, 0.4), 0 0 0 12px rgba(16, 185, 129, 0);
  }
}

@keyframes va-glow-blue {

  0%,
  100% {
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4), 0 0 0 0 rgba(59, 130, 246, 0.3);
  }

  50% {
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4), 0 0 0 12px rgba(59, 130, 246, 0);
  }
}

.va-fab__pulse {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0.4;
  animation: va-pulse-ring 1.8s ease-out infinite;
}

@keyframes va-pulse-ring {
  0% {
    transform: scale(0.9);
    opacity: 0.5;
  }

  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}

.va-fab__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ═══════════════════════════════════════════════
   WAVES (listening animation)
═══════════════════════════════════════════════ */
.va-waves {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 24px;
}

.va-waves span {
  display: block;
  width: 3px;
  height: 8px;
  background: white;
  border-radius: 2px;
  animation: va-wave 1s ease-in-out infinite;
}

.va-waves span:nth-child(1) {
  animation-delay: 0s;
  height: 12px;
}

.va-waves span:nth-child(2) {
  animation-delay: 0.1s;
  height: 18px;
}

.va-waves span:nth-child(3) {
  animation-delay: 0.2s;
  height: 24px;
}

.va-waves span:nth-child(4) {
  animation-delay: 0.3s;
  height: 18px;
}

.va-waves span:nth-child(5) {
  animation-delay: 0.4s;
  height: 12px;
}

.va-waves--small span {
  width: 2px;
  height: 6px;
}

.va-waves--small span:nth-child(1) {
  height: 8px;
}

.va-waves--small span:nth-child(2) {
  height: 12px;
}

.va-waves--small span:nth-child(3) {
  height: 16px;
}

.va-waves--mini {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 14px;
}

.va-waves--mini span {
  width: 2px;
  background: white;
  border-radius: 1px;
  animation: va-wave 1s infinite ease-in-out;
}

.va-waves--mini span:nth-child(1) { height: 6px; animation-delay: 0.1s; }
.va-waves--mini span:nth-child(2) { height: 10px; animation-delay: 0.3s; }
.va-waves--mini span:nth-child(3) { height: 8px; animation-delay: 0.5s; }

@keyframes va-wave {

  0%,
  100% {
    transform: scaleY(0.4);
  }

  50% {
    transform: scaleY(1);
  }
}

/* ═══════════════════════════════════════════════
   SPINNER
═══════════════════════════════════════════════ */
.va-spinner {
  width: 22px;
  height: 22px;
  border: 2.5px solid rgba(255, 255, 255, 0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: va-spin 0.7s linear infinite;
}

@keyframes va-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ═══════════════════════════════════════════════
   PANEL
═══════════════════════════════════════════════ */
.va-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 360px; /* Item 3: Ancho fijo */
  height: 520px; /* Item 3: Alto fijo */
  z-index: 9999; /* Asegurar que esté sobre todo */
  background: var(--va-surface);
  border-radius: 20px;
  box-shadow:
    0 20px 60px rgba(61, 35, 20, 0.22),
    0 0 0 1px rgba(237, 229, 218, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(20px);
  transition: height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2), width 0.3s ease, border-radius 0.3s ease;
}

/* Panel Header */
.va-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: linear-gradient(135deg, var(--va-brand) 0%, #5A2D1A 100%);
  color: white;
  flex-shrink: 0;
}

.va-panel__header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.va-panel__avatar {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--va-gold);
  flex-shrink: 0;
  font-size: 20px;
}

.lyra-icon {
  animation: shiny-star 3s ease-in-out infinite;
  display: block;
}

@keyframes shiny-star {

  0%,
  100% {
    transform: scale(1) rotate(0deg);
    filter: drop-shadow(0 0 0px var(--va-gold));
  }

  50% {
    transform: scale(1.15) rotate(90deg);
    filter: drop-shadow(0 0 12px var(--va-gold));
  }
}

.lyra-unified-core {
  filter: drop-shadow(0 0 4px var(--va-brand-light));
}

.core-ring-spin {
  transform-origin: center;
  animation: core-rotate 4s linear infinite;
}

.core-pulse {
  animation: core-pulse-anim 1.5s ease-in-out infinite;
}

.stark-core-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
}

.stark-unified-core {
  filter: drop-shadow(0 0 15px rgba(96, 165, 250, 0.3));
}

.ring-friday {
  transform-origin: center;
  animation: core-rotate 8s linear infinite reverse;
}

.core-jarvis {
  filter: drop-shadow(0 0 8px #60a5fa);
}

@keyframes core-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes core-pulse-anim {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
}

.va-panel__title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.01em;
}

.va-panel__status {
  font-size: 11px;
  opacity: 0.75;
  font-weight: 500;
}

.va-panel__close {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.va-panel__close:hover {
  background: rgba(255, 255, 255, 0.18);
  color: white;
}

.va-panel__close--stop {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.va-panel__close--stop:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fee2e2;
}

/* Panel Body */
.va-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
  scrollbar-width: thin;
  scrollbar-color: var(--va-border) transparent;
  min-height: 200px;
}

.va-panel__body::-webkit-scrollbar {
  width: 3px;
}

.va-panel__body::-webkit-scrollbar-thumb {
  background: var(--va-border);
  border-radius: 2px;
}

/* Welcome Section */
.va-welcome {
  text-align: center;
  padding: 12px 0;
}

.va-welcome__icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.va-welcome h4 {
  font-size: 15px;
  font-weight: 800;
  color: var(--va-text);
  margin: 0 0 6px;
}

.va-welcome p {
  font-size: 12.5px;
  color: var(--va-text-secondary);
  margin: 0 0 16px;
}

.va-welcome__examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.va-example {
  display: block;
  width: 100%;
  padding: 10px 14px;
  background: var(--va-surface-alt);
  border: 1.5px solid var(--va-border);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--va-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  text-align: left;
  font-style: italic;
}

.va-example:hover {
  background: var(--va-brand-pale);
  border-color: var(--va-brand-light);
  color: var(--va-brand);
  transform: translateX(4px);
}

/* Conversation */
.va-conversation {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.va-msg__bubble {
  padding: 10px 14px;
  border-radius: 14px;
  max-width: 90%;
}

.va-msg__bubble p {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
}

.va-msg--user .va-msg__bubble {
  background: linear-gradient(135deg, var(--va-brand) 0%, var(--va-brand-mid) 100%);
  color: white;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.va-msg--assistant .va-msg__bubble {
  background: var(--va-surface-alt);
  border: 1px solid var(--va-border);
  color: var(--va-text);
  border-bottom-left-radius: 4px;
}

.va-msg__role {
  display: block;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
  opacity: 0.6;
}

/* Typing indicator */
.va-typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.va-typing span {
  width: 7px;
  height: 7px;
  background: var(--va-text-muted);
  border-radius: 50%;
  animation: va-bounce 1.2s ease-in-out infinite;
}

.va-typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.va-typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes va-bounce {

  0%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }

  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* Result badge */
.va-result-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 4px 10px;
  background: rgba(5, 150, 105, 0.1);
  color: var(--va-success);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

/* Active filters pills */
.va-filters-applied {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
  align-items: center;
}

.va-filters-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--va-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-right: 2px;
}

.va-filter-pill {
  display: inline-block;
  padding: 2px 8px;
  background: var(--va-brand-pale);
  border: 1px solid var(--va-border);
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  color: var(--va-brand);
  white-space: nowrap;
}

/* Clarification indicator */
.va-clarification {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #b45309;
}

/* Navigate to map button */
.va-goto-map {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 14px;
  background: var(--va-brand);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  width: 100%;
  justify-content: center;
}

.va-goto-map:hover {
  background: var(--va-brand-mid);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(61, 35, 20, 0.2);
}

/* Error */
.va-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: #fff5f5;
  border: 1.5px solid #fecaca;
  border-radius: 12px;
  color: var(--va-error);
  font-size: 12px;
  font-weight: 600;
  animation: va-shake 0.35s ease;
}

.va-error svg {
  flex-shrink: 0;
  margin-top: 1px;
}

@keyframes va-shake {

  0%,
  100% {
    transform: translateX(0);
  }

  20%,
  60% {
    transform: translateX(-3px);
  }

  40%,
  80% {
    transform: translateX(3px);
  }
}

/* ═══════════════════════════════════════════════
   PANEL FOOTER
═══════════════════════════════════════════════ */
.va-panel__footer {
  padding: 12px 16px;
  border-top: 1px solid var(--va-border);
  background: var(--va-surface);
  flex-shrink: 0;
}

.va-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.va-text-input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid var(--va-border);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--va-text);
  background: var(--va-surface-alt);
  transition: all 0.2s;
  font-family: inherit;
  outline: none;
}

.va-text-input:focus {
  border-color: var(--va-brand-mid);
  background: white;
  box-shadow: 0 0 0 3px rgba(107, 61, 42, 0.08);
}

.va-mic-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1.5px solid var(--va-border);
  background: var(--va-surface-alt);
  color: var(--va-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.va-mic-btn:hover:not(:disabled) {
  background: var(--va-brand-pale);
  border-color: var(--va-brand-light);
  color: var(--va-brand);
}

.va-mic-btn--active {
  background: #059669 !important;
  border-color: #059669 !important;
  color: white !important;
  animation: va-glow-green 2s ease-in-out infinite;
}

.va-mic-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.va-send-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--va-brand);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(61, 35, 20, 0.2);
}

.va-send-btn:hover:not(:disabled) {
  background: var(--va-brand-mid);
  transform: scale(1.05);
}

.va-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Live transcript */
.va-live-transcript {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 12px;
  background: rgba(5, 150, 105, 0.06);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--va-success);
  font-style: italic;
}

.va-live-dot {
  width: 6px;
  height: 6px;
  background: var(--va-success);
  border-radius: 50%;
  animation: va-blink 1s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes va-blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.2;
  }
}

/* ═══════════════════════════════════════════════
   TRANSITIONS
═══════════════════════════════════════════════ */
.va-fab-enter-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.va-fab-enter-leave-active {
  transition: all 0.2s ease-in;
}

.va-fab-enter-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.va-fab-enter-leave-to {
  opacity: 0;
  transform: scale(0.3);
}

.va-panel-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.va-panel-leave-active {
  transition: all 0.2s ease-in;
}

.va-panel-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.va-panel-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.va-fade-enter-active {
  transition: opacity 0.25s ease;
}

.va-fade-leave-active {
  transition: opacity 0.15s ease;
}

.va-fade-enter-from,
.va-fade-leave-to {
  opacity: 0;
}

/* ═══════════════════════════════════════════════
   MOBILE RESPONSIVE
═══════════════════════════════════════════════ */
.va-maintenance {
  text-align: center;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.va-maintenance__icon {
  font-size: 40px;
  animation: va-spin-slow 4s linear infinite;
}

@keyframes va-spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.va-maintenance h4 {
  font-size: 15px;
  font-weight: 800;
  color: var(--va-text);
  margin: 0;
}

.va-maintenance p {
  font-size: 12.5px;
  color: var(--va-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.va-error--maintenance {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
  color: #b45309;
}

/* ═══════════════════════════════════════════════
   ESTADO MINIMIZADO
═══════════════════════════════════════════════ */
.va-panel--minimized {
  height: 56px; /* Item 3: Altura minimizada */
  border-radius: 28px;
  cursor: pointer;
}

.va-panel--minimized .va-panel__header {
  height: 56px;
  border-radius: 28px;
  background: var(--va-brand);
  transition: all 0.3s ease;
}

.va-panel__mini-msg {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px; /* Truncar mensaje largo */
  animation: va-fade-in 0.3s ease;
}

.va-chips--floating {
  position: absolute;
  bottom: 75px;
  right: 0;
  width: auto;
  justify-content: flex-end;
  z-index: 1001;
}

.va-panel--minimized .va-panel__avatar {
  width: 32px;
  height: 32px;
  font-size: 16px;
}

/* Pulse on new message while minimized */
.va-panel--minimized.va-panel--pulse {
  animation: va-mini-pulse 1s ease 3;
}

@keyframes va-mini-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(107, 61, 42, 0.4); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(107, 61, 42, 0); }
  100% { transform: scale(1); }
}

@keyframes va-fade-in {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (max-width: 480px) {
  .va-root {
    bottom: 0px;
    right: 0px;
    left: 0px;
    width: 100%;
  }

  .va-fab {
    width: 48px;
    height: 48px;
    width: 60px;
    height: 60px;
    position: fixed;
    bottom: 24px;
    right: 20px;
  }

  /* Item 1: Bottom Sheet al 65vh */
  .va-panel {
    bottom: 0 !important;
    right: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 65vh;
    max-height: 65vh;
    border-radius: 20px 20px 0 0;
    transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Item 3: Minimizado Full Width Barra Fija */
  .va-panel--minimized {
    height: 56px !important;
    width: 100% !important;
    border-radius: 0 !important;
    bottom: 0 !important;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  }

  .va-panel--minimized .va-panel__header {
    border-radius: 0 !important;
    height: 56px;
    padding: 0 16px;
  }

  .va-panel__mini-msg {
    max-width: 60vw; /* Más espacio para el texto en la barra */
  }

  .va-panel__body {
    min-height: auto;
  }
}


/* ═══════════════════════════════════════════════
   CHIPS SUGGESTIONS
═══════════════════════════════════════════════ */
.va-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  animation: va-fade-up 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.va-chip {
  padding: 8px 16px;
  background: white;
  border: 1.5px solid var(--va-border);
  border-radius: 25px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--va-text-secondary);
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
  font-family: inherit;
  white-space: nowrap;
}

.va-chip:hover {
  background: var(--va-brand);
  color: white;
  border-color: var(--va-brand);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(107, 61, 42, 0.2);
}

.va-chip:active {
  transform: translateY(0);
}

@keyframes va-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Streaming state */
.va-msg__bubble--streaming p::after {
  content: '';
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--va-brand);
  margin-left: 3px;
  vertical-align: middle;
  animation: va-blink 0.8s infinite;
}
</style>
