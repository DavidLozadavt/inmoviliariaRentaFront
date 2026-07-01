<template>
  <div class="faq-container">
    <!-- Background Decoration -->
    <div class="faq-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
    </div>

    <!-- Main Content -->
    <div class="faq-content">
      <!-- Header -->
      <header class="faq-header animate-in">
        <span class="faq-eyebrow">{{ $t('faq.title') }}</span>
        <h1 class="faq-title">{{ $t('faq.subtitle') }}</h1>
        <div class="faq-header-line"></div>
      </header>

      <!-- Questions Accordion -->
      <div class="faq-accordion-list">
        <div 
          v-for="(_, key) in filteredQuestions" 
          :key="key" 
          class="faq-item"
          :class="{ 'is-active': activeKey === String(key) }"
        >
          <button 
            @click="toggleAccordion(String(key))" 
            class="faq-question-btn"
            :aria-expanded="activeKey === String(key)"
          >
            <span class="question-text">{{ $t(`faq.questions.${String(key)}.question`) }}</span>
            <span class="question-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-chevron">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>
          
          <div 
            class="faq-answer-wrapper"
            :style="activeKey === String(key) ? { maxHeight: contentHeights[String(key)] + 'px' } : { maxHeight: '0px' }"
          >
            <div :ref="el => setItemRef(el, String(key))" class="faq-answer-content">
              <p>{{ $t(`faq.questions.${String(key)}.answer`) }}</p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="Object.keys(filteredQuestions).length === 0" class="faq-empty">
          <h3>{{ $t('faq.empty.title') }}</h3>
          <p>{{ $t('faq.empty.description') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { tm } = useI18n();

const activeKey = ref<string | null>(null);
const contentHeights = ref<Record<string, number>>({});
const itemRefs = ref<Record<string, HTMLElement>>({});

// Get questions from i18n
const filteredQuestions = computed(() => {
  const questions = (tm as any)('faq.questions');
  if (!questions || typeof questions !== 'object') return {};
  return questions;
});

const setItemRef = (el: any, key: string) => {
  if (el) itemRefs.value[key] = el;
};

const toggleAccordion = (key: string) => {
  if (activeKey.value === key) {
    activeKey.value = null;
  } else {
    activeKey.value = key;
    calculateHeight(key);
  }
};

const calculateHeight = (key: string) => {
  nextTick(() => {
    if (itemRefs.value[key]) {
      contentHeights.value[key] = itemRefs.value[key].scrollHeight;
    }
  });
};

onMounted(() => {
  window.addEventListener('resize', () => {
    if (activeKey.value) {
      calculateHeight(activeKey.value);
    }
  });
});
</script>

<style scoped>
/* 
  FAQ VIEW STYLES
  Design: Premium Dark Mode
  Palette: Brown #1a120b, Gold #da9c5f
*/

.faq-container {
  position: relative;
  min-height: 100vh;
  background-color: #1a120b;
  color: #f0e5db;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* --- Background Decoration --- */
.faq-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: float 20s infinite alternate ease-in-out;
}

.blob-1 {
  width: 500px;
  height: 500px;
  background: #da9c5f;
  top: -100px;
  right: -100px;
}

.blob-2 {
  width: 400px;
  height: 400px;
  background: #3b251d;
  bottom: -50px;
  left: -50px;
  animation-delay: -5s;
}

.blob-3 {
  width: 300px;
  height: 300px;
  background: #da9c5f;
  top: 40%;
  left: 10%;
  opacity: 0.1;
  animation-delay: -10s;
}

.blob-4 {
  width: 600px;
  height: 600px;
  background: #2e1d17;
  top: 20%;
  right: 20%;
  opacity: 0.1;
}

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 30px) scale(1.1); }
}

/* --- Content Layout --- */
.faq-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 8rem 2rem 6rem;
}

/* --- Header Styles --- */
.faq-header {
  text-align: center;
  margin-bottom: 5rem;
}

.faq-eyebrow {
  display: inline-block;
  color: #da9c5f;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 4px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.faq-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.1;
  background: linear-gradient(135deg, #f0e5db 0%, #da9c5f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
}

.faq-header-line {
  width: 80px;
  height: 4px;
  background: #da9c5f;
  margin: 0 auto;
  border-radius: 2px;
  box-shadow: 0 0 15px rgba(218, 156, 95, 0.4);
}

/* --- Accordion Styles --- */
.faq-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.faq-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(218, 156, 95, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.faq-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(218, 156, 95, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.faq-item.is-active {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(218, 156, 95, 0.5);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.faq-question-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: none;
  border: none;
  color: #f0e5db;
  font-size: 1.15rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  outline: none;
  transition: color 0.3s ease;
}

.faq-item.is-active .faq-question-btn {
  color: #da9c5f;
}

.question-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(218, 156, 95, 0.1);
  border-radius: 50%;
  transition: all 0.4s ease;
  color: #da9c5f;
}

.faq-item.is-active .question-icon {
  background: #da9c5f;
  color: #1a120b;
  transform: rotate(180deg);
}

.icon-chevron {
  width: 18px;
  height: 18px;
}

.faq-answer-wrapper {
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.faq-answer-content {
  padding: 0 2rem 1.5rem;
}

.faq-answer-content p {
  color: rgba(240, 229, 219, 0.8);
  line-height: 1.7;
  font-size: 1.05rem;
}

/* --- Empty State --- */
.faq-empty {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  border: 1px dashed rgba(218, 156, 95, 0.2);
}

.faq-empty h3 {
  color: #da9c5f;
  margin-bottom: 1rem;
}

/* --- CTA Section --- */
.faq-cta {
  margin-top: 6rem;
}

.cta-card {
  position: relative;
  background: linear-gradient(135deg, #2e1d17 0%, #1a120b 100%);
  padding: 4rem 2rem;
  border-radius: 24px;
  text-align: center;
  border: 1px solid rgba(218, 156, 95, 0.2);
  overflow: hidden;
}

.cta-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(218, 156, 95, 0.15) 0%, transparent 70%);
  z-index: 0;
}

.cta-card h2 {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 2.5rem;
  position: relative;
  z-index: 1;
}

.cta-button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: #da9c5f;
  color: #1a120b;
  padding: 1.25rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px rgba(218, 156, 95, 0.3);
}

.cta-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 35px rgba(218, 156, 95, 0.4);
  background: #e4ae78;
}

/* --- Footer Transition --- */
.faq-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  background: linear-gradient(to bottom, transparent, #1a120b);
  z-index: 2;
  pointer-events: none;
}

/* --- Animations --- */
.animate-in {
  animation: fadeIn 0.8s ease-out forwards;
}

.delay-2 {
  animation-delay: 0.3s;
  opacity: 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Responsive --- */
@media (max-width: 768px) {
  .faq-content {
    padding: 6rem 1.5rem 4rem;
  }

  .faq-header {
    margin-bottom: 3rem;
  }

  .faq-question-btn {
    padding: 1.25rem 1.5rem;
    font-size: 1.05rem;
  }

  .faq-answer-content {
    padding: 0 1.5rem 1.25rem;
  }

  .cta-card {
    padding: 3rem 1.5rem;
  }

  .cta-card h2 {
    font-size: 1.8rem;
  }
}

@media (max-width: 480px) {
  .faq-title {
    font-size: 2.2rem;
  }

  .faq-eyebrow {
    font-size: 0.75rem;
    letter-spacing: 2px;
  }

  .cta-button {
    padding: 1rem 2rem;
    width: 100%;
    justify-content: center;
  }
}
</style>
