import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  optimizeDeps: {
    include: ['leaflet.heat']
  },

  // ── Dev server ───────────────────────────────────────────────────────────
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'), // déjalo igual si tu backend ya tiene /api
      },
    },
  },


  // ── Production preview (Railway) ─────────────────────────────────────────
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    // Replace with your actual domain(s) — never use `true` in production
    allowedHosts: [
      'rentusco.com',
      'www.rentusco.com',
      // Railway generates a *.up.railway.app subdomain — add yours here
      // 'frontend-rentus-production.up.railway.app',
    ],
  },

  // ── Build optimisations ──────────────────────────────────────────────────
  build: {
    // Warn when a chunk exceeds 600 kB
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        /**
         * Split heavy vendors into separate chunks so that cached bundles
         * don't bust when unrelated code changes.
         */
        manualChunks: {
          // Vue ecosystem
          'chunk-vue': ['vue', 'vue-router', 'pinia'],
          // Maps & geospatial
          'chunk-leaflet': ['leaflet'],
          // Charts
          'chunk-charts': ['chart.js', 'vue-chartjs'],
          // Utilities
          'chunk-utils': ['axios', '@vueuse/core', 'date-fns', 'vue-i18n'],
          // Icon library (FontAwesome SVG core is large on its own)
          'chunk-icons': [
            '@fortawesome/fontawesome-svg-core',
            '@fortawesome/free-solid-svg-icons',
            '@fortawesome/free-regular-svg-icons',
            '@fortawesome/free-brands-svg-icons',
            '@fortawesome/vue-fontawesome',
          ],
        },
      },
    },
  },
})