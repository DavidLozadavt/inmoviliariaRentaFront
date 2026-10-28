<template>
    <div class="about">
        <div class="page-background"></div>

        <!-- ░░ CANVAS PARTICLES ░░ -->
        <canvas class="about__canvas" ref="canvasRef" aria-hidden="true"></canvas>

        <!-- ░░ HERO ░░ -->
        <section class="hero">
            <div class="hero__inner">
                <div class="hero__kicker reveal reveal--fade">
                    <span class="kicker-line"></span>
                    Sobre NexiLiving
                </div>
                <h1 class="hero__headline reveal reveal--up" style="--delay:.1s">
                    Una nueva forma<br />
                    <em>de encontrar hogar.</em>
                </h1>
                <p class="hero__sub reveal reveal--up" style="--delay:.22s">
                    Nacimos en 2024 con una convicción: arrendar una propiedad
                    debería ser claro, rápido y confiable. Sin letra pequeña,
                    sin intermediarios innecesarios.
                </p>
                <div class="hero__cta reveal reveal--up" style="--delay:.34s">
                    <router-link to="/propiedades" class="btn btn--fill">
                        Ver propiedades
                    </router-link>
                    <a href="#story" class="btn btn--ghost">
                        Nuestra historia
                    </a>
                </div>
            </div>

            <!-- floating badge -->
            <div class="hero__badge reveal reveal--scale" style="--delay:.5s" aria-hidden="true">
                <span class="badge-year">2024</span>
                <span class="badge-label">Fundados</span>
            </div>

            <!-- scroll indicator -->
            <div class="hero__scroll" aria-hidden="true">
                <span class="scroll-text">scroll</span>
                <div class="scroll-track">
                    <div class="scroll-thumb"></div>
                </div>
            </div>
        </section>

        <!-- ░░ STATS BAR ░░ -->
        <div class="stats-bar">
            <div class="stats-bar__inner">
                <div class="stats-bar__item reveal reveal--up" v-for="(s, i) in stats" :key="s.label"
                    :style="`--delay:${i * 0.1}s`">
                    <span class="stats-bar__value">{{ s.display }}</span>
                    <span class="stats-bar__label">{{ s.label }}</span>
                </div>
            </div>
        </div>

        <!-- ░░ STORY ░░ -->
        <section class="story" id="story">
            <div class="story__layout">
                <div class="story__left">
                    <span class="section-label reveal reveal--fade">Nuestra historia</span>
                    <h2 class="section-title reveal reveal--up" style="--delay:.1s">
                        Empezamos<br />con un problema real.
                    </h2>
                    <p class="story__body reveal reveal--up" style="--delay:.2s">
                        Encontrar arriendo en Colombia es complicado, opaco y lleno de
                        fricción. Vimos eso de cerca y decidimos construir la plataforma
                        que nos hubiera gustado tener: una donde propietarios e inquilinos
                        se encuentren de forma directa y segura.
                    </p>
                    <p class="story__body reveal reveal--up" style="--delay:.28s">
                        Somos un equipo pequeño pero comprometido. No prometemos ser los
                        más grandes — prometemos ser los más honestos.
                    </p>
                </div>
                <div class="story__right">
                    <div class="timeline">
                        <div class="tl-entry reveal reveal--slide-right" v-for="(e, i) in timeline" :key="i"
                            :style="`--delay:${i * 0.12}s`">
                            <div class="tl-entry__marker">
                                <div class="tl-entry__dot"></div>
                            </div>
                            <div class="tl-entry__body">
                                <span class="tl-entry__date">{{ e.date }}</span>
                                <p class="tl-entry__text">{{ e.text }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ░░ MISSION / VISION / VALUES ░░ -->
        <section class="mvv">
            <div class="mvv__grid">
                <div class="mvv-card reveal reveal--up" v-for="(card, i) in mvv" :key="card.title"
                    :style="`--delay:${i * 0.12}s`" :class="`mvv-card--${card.accent}`">
                    <div class="mvv-card__icon" v-html="card.icon"></div>
                    <h3 class="mvv-card__title">{{ card.title }}</h3>
                    <p class="mvv-card__text">{{ card.text }}</p>
                    <div class="mvv-card__bar"></div>
                </div>
            </div>
        </section>

        <!-- ░░ DIFFERENTIATORS ░░ -->
        <section class="diff">
            <div class="diff__head">
                <span class="section-label reveal reveal--fade">¿Por qué NexiLiving?</span>
                <h2 class="section-title reveal reveal--up" style="--delay:.1s">
                    Menos fricción.<br /><em>Más confianza.</em>
                </h2>
            </div>
            <div class="diff__grid">
                <div class="diff-item reveal reveal--up" v-for="(d, i) in differentiators" :key="d.title"
                    :style="`--delay:${i * 0.1}s`">
                    <div class="diff-item__num">{{ String(i + 1).padStart(2, '0') }}</div>
                    <div class="diff-item__icon">{{ d.icon }}</div>
                    <h4 class="diff-item__title">{{ d.title }}</h4>
                    <p class="diff-item__desc">{{ d.description }}</p>
                </div>
            </div>
        </section>

        <!-- ░░ PROCESS ░░ -->
        <section class="process">
            <div class="process__head">
                <span class="section-label reveal reveal--fade">Cómo funciona</span>
                <h2 class="section-title reveal reveal--up" style="--delay:.1s">
                    Del interés al contrato,<br />sin vueltas.
                </h2>
            </div>
            <div class="process__track">
                <div class="process-step reveal reveal--up" v-for="(step, i) in processSteps" :key="step.title"
                    :style="`--delay:${i * 0.13}s`">
                    <div class="process-step__bubble">
                        <span class="process-step__n">{{ i + 1 }}</span>
                    </div>
                    <div class="process-step__icon">{{ step.icon }}</div>
                    <h4 class="process-step__title">{{ step.title }}</h4>
                    <p class="process-step__desc">{{ step.description }}</p>
                    <div class="process-step__connector" v-if="i < processSteps.length - 1" aria-hidden="true"></div>
                </div>
            </div>
        </section>

        <!-- ░░ TEAM ░░ -->
        <section class="team">
            <div class="team__head">
                <span class="section-label reveal reveal--fade">El equipo</span>
                <h2 class="section-title reveal reveal--up" style="--delay:.1s">
                    Cuatro personas.<br /><em>Una misma visión.</em>
                </h2>
                <p class="team__sub reveal reveal--up" style="--delay:.2s">
                    Somos desarrolladores que decidieron resolver un problema real.
                    Sin grandes inversores — solo trabajo, iteración y compromiso.
                </p>
            </div>
            <div class="team__grid">
                <div class="team-card reveal reveal--up" v-for="(m, i) in members" :key="m.name"
                    :style="`--delay:${i * 0.1}s`">
                    <div class="team-card__avatar">{{ m.initials }}</div>
                    <span class="team-card__name">{{ m.name }}</span>
                    <span class="team-card__role">{{ m.role }}</span>
                </div>
            </div>
        </section>

        <!-- ░░ TESTIMONIALS ░░ -->
        <section class="testimonials">
            <div class="testimonials__head">
                <span class="section-label reveal reveal--fade">Lo que dicen</span>
                <h2 class="section-title reveal reveal--up" style="--delay:.1s">
                    Experiencias reales.
                </h2>
            </div>
            <div class="testimonials__grid">
                <div class="testi-card reveal reveal--up" v-for="(t, i) in testimonials" :key="t.author"
                    :style="`--delay:${i * 0.1}s`">
                    <div class="testi-card__stars">
                        <span v-for="s in 5" :key="s" class="star">★</span>
                    </div>
                    <p class="testi-card__text">"{{ t.text }}"</p>
                    <div class="testi-card__footer">
                        <div class="testi-card__avatar">{{ t.avatar }}</div>
                        <div>
                            <span class="testi-card__name">{{ t.author }}</span>
                            <span class="testi-card__role">{{ t.role }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ░░ CTA ░░ -->
        <section class="cta">
            <div class="cta__inner reveal reveal--up">
                <div class="cta__glow" aria-hidden="true"></div>
                <span class="section-label">¿Listo?</span>
                <h2 class="cta__title">
                    Encuentra tu próximo<br /><em>hogar hoy mismo.</em>
                </h2>
                <p class="cta__body">
                    Únete a NexiLiving. Sin costos ocultos, sin promesas vacías.
                </p>
                <div class="cta__actions">
                    <router-link to="/propiedades" class="btn btn--fill btn--lg">
                        Explorar propiedades
                    </router-link>
                    <router-link to="/contacto" class="btn btn--outline btn--lg">
                        Contactar soporte
                    </router-link>
                </div>
            </div>
        </section>

    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ── Canvas ref ──────────────────────────────────────────────
const canvasRef = ref(null)
let animFrame = null

// ── Data ────────────────────────────────────────────────────
const stats = [
    { display: '2024', label: 'Año de fundación' },
    { display: '500+', label: 'Propiedades activas' },
    { display: '1K+', label: 'Usuarios registrados' },
    { display: '~1', label: 'Año de experiencia' },
]

const timeline = [
    { date: 'Enero 2024', text: 'Nace NexiLiving: una plataforma pensada para simplificar el arrendamiento en Colombia.' },
    { date: 'Junio 2024', text: 'Lanzamos la primera versión con propiedades en Popayán y los primeros arrendatarios.' },
    { date: 'Octubre 2024', text: 'Superamos 500 usuarios y 200 propiedades verificadas en la plataforma.' },
    { date: 'Hoy', text: 'Seguimos iterando, escuchando y construyendo — semana a semana.' },
]

const mvv = [
    {
        accent: 'a',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        title: 'Misión',
        text: 'Simplificar el acceso a propiedades mediante tecnología accesible, procesos claros y un equipo que responde cuando lo necesitas.',
    },
    {
        accent: 'b',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        title: 'Visión',
        text: 'Ser la plataforma de arrendamiento de referencia en Colombia, expandiéndonos paso a paso con solidez y propósito.',
    },
    {
        accent: 'c',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        title: 'Valores',
        text: 'Transparencia antes que marketing. Honestidad antes que números inflados. Calidad antes que velocidad.',
    },
]

const differentiators = [
    { icon: '🔍', title: 'Búsqueda real', description: 'Filtros que funcionan de verdad. Sin resultados irrelevantes ni propiedades fantasma.' },
    { icon: '✅', title: 'Todo verificado', description: 'Revisamos cada publicación antes de que aparezca. Propietarios e inquilinos validados.' },
    { icon: '📝', title: 'Contratos digitales', description: 'Firma tu contrato desde el celular. Legal, seguro y sin papeleos físicos.' },
    { icon: '💬', title: 'Comunicación directa', description: 'Habla con el propietario o inquilino sin intermediarios que encarezcan el proceso.' },
]

const processSteps = [
    { icon: '🔎', title: 'Busca', description: 'Usa filtros por ciudad, precio y área para encontrar lo que necesitas.' },
    { icon: '📅', title: 'Agenda', description: 'Solicita una visita directamente desde la plataforma, en pocos clics.' },
    { icon: '✅', title: 'Aprueba', description: 'El propietario confirma en menos de 48 h y coordina la visita contigo.' },
    { icon: '📝', title: 'Firma', description: 'Firma el contrato digitalmente. Tu nuevo hogar te espera.' },
]

const members = [
    { name: 'Alexander Camilo', role: 'Scrum Master', initials: 'AC' },
    { name: 'Miguel Camilo', role: 'Developer', initials: 'MC' },
    { name: 'Camila Acosta', role: 'Developer', initials: 'CA' },
    { name: 'Jefferson Martinez', role: 'Developer', initials: 'JM' },
]

const testimonials = [
    { text: 'Encontré mi apartamento en menos de una semana. El proceso fue claro y sin sorpresas.', author: 'María González', role: 'Diseñadora gráfica', avatar: 'MG' },
    { text: 'Como propietario, me da tranquilidad que los inquilinos estén verificados antes de contactarme.', author: 'Roberto Sánchez', role: 'Propietario', avatar: 'RS' },
    { text: 'La firma digital del contrato fue lo mejor. Todo desde mi celular, sin ir a ninguna parte.', author: 'Laura Martínez', role: 'Estudiante', avatar: 'LM' },
    { text: 'Proceso súper transparente. Precios justos, sin comisiones escondidas. Volveré a usar NexiLiving sin dudarlo.', author: 'Diego Fernández', role: 'Ingeniero', avatar: 'DF' },
]

// ── Canvas Particles ────────────────────────────────────────
function initCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W, H, particles

    const resize = () => {
        W = canvas.width = window.innerWidth
        H = canvas.height = window.innerHeight
    }

    const createParticle = () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.3,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        a: Math.random() * 0.45 + 0.1,
    })

    const setup = () => {
        resize()
        particles = Array.from({ length: 65 }, createParticle)
    }

    const draw = () => {
        ctx.clearRect(0, 0, W, H)

        // connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x
                const dy = particles[i].y - particles[j].y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < 125) {
                    ctx.beginPath()
                    ctx.strokeStyle = `rgba(201,145,92,${0.1 * (1 - dist / 125)})`
                    ctx.lineWidth = 0.5
                    ctx.moveTo(particles[i].x, particles[i].y)
                    ctx.lineTo(particles[j].x, particles[j].y)
                    ctx.stroke()
                }
            }
        }

        // dots
        particles.forEach(p => {
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(201,145,92,${p.a})`
            ctx.fill()
            p.x += p.vx
            p.y += p.vy
            if (p.x < 0 || p.x > W) p.vx *= -1
            if (p.y < 0 || p.y > H) p.vy *= -1
        })

        animFrame = requestAnimationFrame(draw)
    }

    setup()
    draw()

    let resizeTimer
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => { setup() }, 200)
    })
}

// ── Scroll Reveal ───────────────────────────────────────────
function initReveal() {
    const io = new IntersectionObserver(
        entries => entries.forEach(e => {
            if (e.isIntersecting) {
                const delay = parseFloat(e.target.style.getPropertyValue('--delay')) || 0
                setTimeout(() => e.target.classList.add('is-visible'), delay * 1000)
                io.unobserve(e.target)
            }
        }),
        { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
}

// ── Lifecycle ───────────────────────────────────────────────
onMounted(() => {
    initCanvas()
    initReveal()
})

onBeforeUnmount(() => {
    if (animFrame) cancelAnimationFrame(animFrame)
})
</script>

<style scoped>
@import '../assets/css/AboutUsView.css';
</style>