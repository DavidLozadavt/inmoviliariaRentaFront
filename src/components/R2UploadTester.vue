<template>
  <div class="r2-upload-tester card p-4 mt-4 shadow-sm">
    <h3 class="mb-3">Configuración de Almacenamiento Persistente (R2)</h3>
    
    <div v-if="uploadUrl" class="alert alert-success mb-3">
      <strong>✓ ¡Subida exitosa!</strong> La imagen ahora es persistente:<br />
      <a :href="uploadUrl" target="_blank" class="text-break">{{ uploadUrl }}</a>
      <div class="mt-2 preview-container">
        <img :src="uploadUrl" alt="R2 Preview" class="img-thumbnail" style="max-height: 200px" />
      </div>
    </div>

    <div v-if="error" class="alert alert-danger mb-3">
      <strong>Error:</strong> {{ error }}
    </div>

    <div class="upload-controls">
      <input 
        type="file" 
        @change="handleFileChange" 
        accept="image/*" 
        class="form-control mb-2"
        :disabled="loading"
      />
      <button 
        @click="uploadFile" 
        class="btn btn-primary" 
        :disabled="!selectedFile || loading"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        {{ loading ? 'Subiendo a R2...' : 'Probar Subida Persistente' }}
      </button>
    </div>

    <div class="mt-3 text-muted small">
      <p>Esta prueba envía un archivo al backend, que lo guarda en Cloudflare R2 y devuelve una URL pública permanente.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'

const selectedFile = ref(null)
const loading = ref(false)
const uploadUrl = ref('')
const error = ref('')

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0]
  error.value = ''
  uploadUrl.value = ''
}

const uploadFile = async () => {
  if (!selectedFile.value) return

  loading.value = true
  error.value = ''
  
  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const response = await api.post('/test-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.success) {
      uploadUrl.value = response.data.url
    }
  } catch (err) {
    console.error('Upload error:', err)
    error.value = err.response?.data?.message || 'Error al conectar con el servidor.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.preview-container {
  max-width: 100%;
  overflow: hidden;
}
</style>
