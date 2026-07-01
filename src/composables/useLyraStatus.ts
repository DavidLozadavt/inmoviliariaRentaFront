import { ref, onMounted, onUnmounted } from 'vue'
import echo from '@/plugins/echo'
import api from '@/services/api'

/**
 * Composable para el estado de Lyra en tiempo real (clientes)
 */
export function useLyraStatus() {
    const status = ref<'online' | 'maintenance'>('online')
    const message = ref('')
    const loading = ref(false)

    // Cargar estado inicial desde la API — una sola vez al montar
    const fetchInitialStatus = async () => {
        loading.value = true
        try {
            // Usar el nuevo endpoint público
            const res = await api.get('/lyra/status')
            status.value = res.data.data.status
        } catch {
            // Si falla, asumir online para no bloquear al usuario
            status.value = 'online'
        } finally {
            loading.value = false
        }
    }

    // Suscripción al canal — recibe cambios en tiempo real sin polling
    const subscribeToStatus = () => {
        const channel = echo.channel('lyra.status')

        channel.listen('.status.changed', (data: { status: 'online' | 'maintenance'; message: string }) => {
            console.log('[Lyra] Real-time status update:', data)
            status.value = data.status
            message.value = data.message ?? ''
        });
    }

    onMounted(() => {
        fetchInitialStatus()
        subscribeToStatus()
    })

    onUnmounted(() => {
        echo.leaveChannel('lyra.status')
    })

    return { status, message, loading }
}
