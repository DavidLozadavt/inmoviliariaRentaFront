<template>
  <main class="not-found">
    <!-- Background Elements -->
    <div class="page-background" aria-hidden="true">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="grid-overlay"></div>
    </div>

    <div class="not-found__container">
      <div class="not-found__visual">
        <div class="not-found__code" aria-hidden="true">404</div>
        <div class="not-found__glow"></div>
      </div>

      <div class="not-found__content">
        <div class="not-found__badge">Oups</div>
        <h1 class="not-found__title">Página no encontrada</h1>
        <p class="not-found__description">
          Lo sentimos, no pudimos encontrar la página que buscas. Puede que haya sido eliminada, 
          haya cambiado de nombre o esté temporalmente inaccesible.
        </p>

        <div class="not-found__actions">
          <button class="btn btn-ghost" type="button" @click="goBack">
            <font-awesome-icon icon="arrow-left" class="btn-icon" aria-hidden="true" />
            Volver atrás
          </button>
          <RouterLink to="/" class="btn btn-primary">
            <font-awesome-icon icon="home" class="btn-icon" aria-hidden="true" />
            Ir al inicio
          </RouterLink>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';

useHead({
  title: '404 — Página no encontrada | Rentus',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});

const router = useRouter();
const goBack = () => router.go(-1);
</script>

<style scoped>
.not-found {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #fafafa;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Background & Texture */
.page-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  animation: floatOrb 15s ease-in-out infinite alternate;
}

.orb-1 {
  top: -10%;
  left: 10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, rgba(79, 70, 229, 0) 70%);
}

.orb-2 {
  bottom: -10%;
  right: 10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(201, 145, 92, 0.2) 0%, rgba(201, 145, 92, 0) 70%);
  animation-delay: -5s;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at center, black, transparent 80%);
  -webkit-mask-image: radial-gradient(circle at center, black, transparent 80%);
}

@keyframes floatOrb {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 30px) scale(1.1); }
}

/* Container */
.not-found__container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 540px;
  width: 100%;
  animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeUp {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Visuals */
.not-found__visual {
  position: relative;
  margin-bottom: 2rem;
}

.not-found__code {
  font-size: clamp(8rem, 25vw, 12rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.05em;
  background: linear-gradient(135deg, #111827 0%, #4b5563 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  user-select: none;
}

.not-found__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 60%);
  filter: blur(40px);
  z-index: -1;
  pointer-events: none;
}

/* Content Typography */
.not-found__badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  background: rgba(17, 24, 39, 0.05);
  color: #374151;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(17, 24, 39, 0.1);
}

.not-found__title {
  font-size: clamp(2rem, 5vw, 2.5rem);
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.03em;
  margin-bottom: 1rem;
}

.not-found__description {
  color: #6b7280;
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
  max-width: 460px;
  margin-left: auto;
  margin-right: auto;
}

/* Actions */
.not-found__actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  border: 1px solid transparent;
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-primary {
  background: #111827;
  color: #ffffff;
  box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background: #1f2937;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.btn-ghost {
  background: #ffffff;
  color: #374151;
  border-color: #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-ghost:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

@media (max-width: 640px) {
  .not-found__actions {
    flex-direction: column;
    width: 100%;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
