# 🏠 Rentus — Frontend

> Modern rental management platform built with Vue 3, TypeScript, Vite, and Pinia.

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Backend API | Running on `VITE_API_URL` |

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/miguelcamilok/frontend-rentus.git
cd frontend-rentus

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your API URL and Google Maps key

# 4. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📦 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend API base URL (e.g. `https://api.rentusco.com/api`) |
| `VITE_GOOGLE_MAPS_API_KEY` | ✅ | Google Maps API key (restricted to your domain) |

See [`.env.example`](.env.example) for the full list.

---

## 🗂️ Project Structure

## 👥 Ownership & Core Technologies

This repository follows a strict ownership model to maintain code quality, security, and architectural consistency. Pull Requests impacting specific domains must be approved by the designated team leads.

### 🛡️ System Ownership (Frontend Platform)

| Domain / Responsibility | Lead Developer | Specific Areas |
|-------------------------|----------------|----------------|
| **Core, Basic Views & Design** | `@miguelcamilok` | Frontend initial setup, structural basic views, overall platform UI design. |
| **Maps, Capabilities & UI/UX** | `@jefermar` | Map Explorer (Leaflet), development of complex functionalities, and specific designs. |

### 🛠️ Core Technologies
*   **Framework:** Vue 3 (Composition API / Setup)
*   **Language:** TypeScript Strict Mode
*   **Build Engine:** Vite 7
*   **State Management:** Pinia
*   **Styling Strategy:** TailwindCSS

```text
frontend-rentus/
├── 📁 node_modules/           # Dependencias instaladas (Auto-generado)
├── 📁 public/                 # Archivos estáticos accesibles públicamente (favicon, logos, etc.)
├── 📁 src/                    # 🟢 NÚCLEO DE LA APLICACIÓN CLIENTE
│   ├── 📁 admin/              # (Admin Team) Panel de administración (páginas, componentes, rutas)
│   ├── 📁 assets/             # Estilos globales (Tailwind), imágenes y fuentes
│   ├── 📁 components/         # Piezas modulares reutilizables de UI (NavBar, Modales, Filtros de Búsqueda)
│   ├── 📁 composables/        # Hooks de Vue para abstraer lógica (useProperties, useAlerts)
│   ├── 📁 events/             # Bus de eventos global para comunicación entre componentes desvinculados
│   ├── 📁 layouts/            # Plantillas maestras de página (MainLayout, AuthLayout, AdminLayout)
│   ├── 📁 locales/            # Archivos de traducción y diccionarios (es, en)
│   ├── 📁 router/             # Configuración del Vue Router y protección de rutas (Guards)
│   ├── 📁 services/           # Capa de comunicación con la API Backend (auth, maps, properties, pdf, etc.)
│   ├── 📁 stores/             # Gestores de estado global Pinia (user, alerts, notifications, properties)
│   ├── 📁 tests/              # (QA Team) Pruebas automatizadas (unitarias, integración, e2e)
│   ├── 📁 types/              # Interfaces y tipos estrictos de TypeScript (User, Property, etc.)
│   ├── 📁 utils/              # Funciones genéricas de apoyo (logger, transformadores)
│   ├── 📁 views/              # Vistas principales de usuario (Home, Auth, Property Detail, Map Explorer)
│   ├── 📄 i18n.ts             # Configuración principal de internacionalización (Multi-idioma)
│   ├── 📄 App.vue             # Componente Raíz base de toda la SPA
│   ├── 📄 main.ts             # Punto de entrada de la aplicación (inyección de plugins)
│   └── 📄 style.css           # Estilos maestros globales 
├── 📄 index.html              # Estructura HTML principal donde se monta Vue
├── 📄 package.json            # Gestor de dependencias y scripts de ejecución
└── 📄 vite.config.ts          # Configuración del servidor de desarrollo e hiper-empaquetado Vite
```

---

## 📜 Available Scripts

```bash
npm run dev             # Start Vite dev server
npm run build           # Type-check + production build
npm run preview         # Preview the production build locally
npm run type-check      # Run vue-tsc type checking
npm run test            # Run Vitest unit/integration tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:e2e        # Run Playwright E2E tests
npm run lint            # Lint and auto-fix with ESLint
```

---

## 🧪 Testing

### Unit & Integration Tests (Vitest)

```bash
npm run test
```

Tests are in `src/tests/unit/` and `src/tests/integration/`.

### E2E Tests (Playwright)

```bash
# Start the dev server first
npm run dev

# In another terminal
npm run test:e2e
```

E2E tests are in `src/tests/e2e/`. Configure test credentials in `.env.test`.

---

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Language | TypeScript |
| Build Tool | Vite 7 |
| State Management | Pinia |
| Routing | Vue Router 4 |
| HTTP Client | Axios (with interceptors for JWT refresh) |
| Maps | Leaflet |
| Charts | Chart.js + vue-chartjs |
| Icons | FontAwesome (SVG) + Heroicons |
| i18n | Vue-i18n |
| SEO | @unhead/vue (dynamic meta tags) |
| Testing | Vitest + Vue Test Utils + Playwright |

---

### Code Guidelines

- Use `@/` import alias for all paths
- Use the `logger` utility instead of `console.log` (auto-stripped in production)
- Use Pinia stores for shared state, not module-level `ref()` exports
- All catch blocks must type errors as `unknown` and narrow with `instanceof`
- Add `aria-label` to icon-only buttons for accessibility

---

## 📄 License

**Proprietary Software — All rights reserved.**

The **Rentus Frontend Platform** (including all UI components, views, Vue architecture, graphical assets, and client-side logic) is the exclusive intellectual property of its co-owners:  
**Miguel Camilo** (`@miguelcamilok`), **Alexander Byrush** (`@Alexanderbyrush`) and **Jefer Mar** (`@jefermar`).

Unauthorized copying, modification, distribution, or use of this project, via any medium, is strictly prohibited without explicit permission.
