<template>
  <div class="legal-container">
    <div class="faq-background">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="blob blob-4"></div>
    </div>

    <div class="legal-content">
      <header class="legal-header animate-in">
        <span class="legal-eyebrow">{{ $t('legal.notice.eyebrow') }}</span>
        <h1 class="legal-title">{{ $t('legal.notice.title') }}</h1>
        <div class="legal-header-line"></div>
      </header>

      <div class="legal-sections animate-in delay-1">
        <section v-for="(section, index) in legalSections" :key="index" class="legal-section">
          <h2 class="section-subtitle">{{ section.title }}</h2>
          <div class="section-body" v-html="section.content"></div>
        </section>
      </div>

      <footer class="legal-footer animate-in delay-2">
        <p>{{ $t('legal.lastUpdated', { date: '23 de febrero de 2026' }) }}</p>
        <router-link to="/" class="back-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          {{ $t('common.backToHome') }}
        </router-link>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const legalSections = computed(() => [
  {
    title: t('legal.notice.sections.identification.title'),
    content: t('legal.notice.sections.identification.content')
  },
  {
    title: t('legal.notice.sections.usage.title'),
    content: t('legal.notice.sections.usage.content')
  },
  {
    title: t('legal.notice.sections.responsibilities.title'),
    content: t('legal.notice.sections.responsibilities.content')
  },
  {
    title: t('legal.notice.sections.liability.title'),
    content: t('legal.notice.sections.liability.content')
  },
  {
    title: t('legal.notice.sections.intellectual.title'),
    content: t('legal.notice.sections.intellectual.content')
  },
  {
    title: t('legal.notice.sections.termination.title'),
    content: t('legal.notice.sections.termination.content')
  }
]);
</script>

<style scoped>
.legal-container {
  position: relative;
  min-height: 100vh;
  background-color: #1a120b;
  color: #f0e5db;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

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

.blob-1 { width: 500px; height: 500px; background: #da9c5f; top: -100px; right: -100px; }
.blob-2 { width: 400px; height: 400px; background: #3b251d; bottom: -50px; left: -50px; animation-delay: -5s; }
.blob-3 { width: 300px; height: 300px; background: #da9c5f; top: 40%; left: 10%; opacity: 0.1; animation-delay: -10s; }
.blob-4 { width: 600px; height: 600px; background: #2e1d17; top: 20%; right: 20%; opacity: 0.1; }

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 30px) scale(1.1); }
}

.legal-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 8rem 2rem 6rem;
}

.legal-header {
  text-align: center;
  margin-bottom: 5rem;
}

.legal-eyebrow {
  display: inline-block;
  color: #da9c5f;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 4px;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.legal-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.1;
  background: linear-gradient(135deg, #f0e5db 0%, #da9c5f 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
}

.legal-header-line {
  width: 80px;
  height: 4px;
  background: #da9c5f;
  margin: 0 auto;
  border-radius: 2px;
  box-shadow: 0 0 15px rgba(218, 156, 95, 0.4);
}

.legal-sections {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.legal-section {
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(218, 156, 95, 0.1);
}

.legal-section:last-child {
  border-bottom: none;
}

.section-subtitle {
  font-size: 1.5rem;
  font-weight: 600;
  color: #da9c5f;
  margin-bottom: 1.25rem;
}

.section-body {
  color: rgba(240, 229, 219, 0.85);
  line-height: 1.8;
  font-size: 1.1rem;
}

.section-body :deep(p) {
  margin-bottom: 1rem;
}

.section-body :deep(ul) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.section-body :deep(li) {
  margin-bottom: 0.5rem;
}

.legal-footer {
  margin-top: 5rem;
  padding-top: 3rem;
  border-top: 1px solid rgba(218, 156, 95, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
}

.legal-footer p {
  color: rgba(240, 229, 219, 0.5);
  font-size: 0.9rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: #da9c5f;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(218, 156, 95, 0.3);
  border-radius: 50px;
}

.back-link:hover {
  background: rgba(218, 156, 95, 0.1);
  border-color: #da9c5f;
  transform: translateX(-5px);
}

.animate-in {
  animation: fadeIn 0.8s ease-out forwards;
}

.delay-1 { animation-delay: 0.2s; opacity: 0; }
.delay-2 { animation-delay: 0.4s; opacity: 0; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .legal-content { padding: 6rem 1.5rem 4rem; }
  .section-subtitle { font-size: 1.3rem; }
}
</style>
