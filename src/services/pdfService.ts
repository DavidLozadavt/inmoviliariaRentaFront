// services/pdfService.ts

const PDF_CO_API_KEY = 'alexandrecamilor@gmail.com_rksbqA0U6kWpEA4aQ9xJpc2XmVSAqCUeIvYa9jNhV4WS98F1bDYy9UD3LzjIngZ3' // Para testing, luego cambia por tu API Key

// Interfaces TypeScript
interface ContractData {
  id: number
  title: string
  status: string
  propertyImage: string
  propertyAddress: string
  startDate: string
  endDate: string
  monthlyPrice: number
  deposit: number

  // Arrendatario
  tenantName: string
  tenantCC: string
  tenantEmail: string

  // Arrendador
  landlordName: string
  landlordCC: string
  landlordEmail: string

  propertyType: string
  area: number
  bedrooms: number
  bathrooms: number
  clauses: string[]
  isNew?: boolean
}

interface PdfCoResponse {
  url: string
  error?: string
}

interface PdfCoRequest {
  html: string
  name: string
  margins: string
  paperSize: string
  orientation: string
}

export const pdfService = {
  // Generar contrato profesional
  generateContract: async (contractData: ContractData): Promise<string> => {
    try {
      const requestBody: PdfCoRequest = {
        html: generateContractHTML(contractData),
        name: `contrato_${contractData.id}.pdf`,
        margins: "10px 20px 10px 20px",
        paperSize: "A4",
        orientation: "Portrait"
      }

      const response = await fetch('https://api.pdf.co/v1/pdf/convert/from/html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': PDF_CO_API_KEY
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Error generando contrato')
      }

      const data: PdfCoResponse = await response.json()
      return data.url // URL del PDF generado

    } catch (error) {
      console.error('Error PDF.co:', error)
      // Fallback: usar imagen local
      return `/img/contrato${contractData.id}.jpg`
    }
  },

  // Aquí puedes agregar getContracts si quieres simular API local
}

// Función para generar HTML profesional del contrato
function generateContractHTML(contract: ContractData): string {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2e1d17;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 { color: #2e1d17; margin: 0; font-size: 24px; }
        .parties { display: flex; justify-content: space-between; margin: 30px 0; }
        .party { flex: 1; padding: 15px; border: 1px solid #ddd; margin: 0 10px; }
        .contract-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .clauses { margin: 30px 0; }
        .clause { margin: 15px 0; padding-left: 20px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
        .signature-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; }
        .highlight { background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; margin: 10px 0; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>CONTRATO DE ARRENDAMIENTO</h1>
        <p>${contract.title}</p>
      </div>

      <div class="parties">
        <div class="party">
          <h3>ARRENDADOR</h3>
          <p><strong>Nombre:</strong> ${contract.landlordName}</p>
          <p><strong>CC:</strong> ${contract.landlordCC}</p>
          <p><strong>Email:</strong> ${contract.landlordEmail}</p>
        </div>
        
        <div class="party">
          <h3>ARRENDATARIO</h3>
          <p><strong>Nombre:</strong> ${contract.tenantName}</p>
          <p><strong>CC:</strong> ${contract.tenantCC}</p>
          <p><strong>Email:</strong> ${contract.tenantEmail}</p>
        </div>
      </div>

      <div class="contract-details">
        <h3>PROPIEDAD ARRENDADA</h3>
        <p><strong>Dirección:</strong> ${contract.propertyAddress}</p>
        <p><strong>Tipo:</strong> ${contract.propertyType}</p>
        <p><strong>Área:</strong> ${contract.area} m²</p>
        <p><strong>Habitaciones:</strong> ${contract.bedrooms}</p>
        <p><strong>Baños:</strong> ${contract.bathrooms}</p>
      </div>

      <div class="contract-details">
        <h3>TÉRMINOS DEL CONTRATO</h3>
        <p><strong>Valor mensual:</strong> ${formatCurrency(contract.monthlyPrice)}</p>
        <p><strong>Depósito de garantía:</strong> ${formatCurrency(contract.deposit)}</p>
        <p><strong>Fecha de inicio:</strong> ${formatDate(contract.startDate)}</p>
        <p><strong>Fecha de finalización:</strong> ${formatDate(contract.endDate)}</p>
        <p><strong>Duración:</strong> 12 meses</p>
      </div>

      <div class="clauses">
        <h3>CLÁUSULAS Y CONDICIONES</h3>
        ${contract.clauses.map((clause: string, index: number) => `
          <div class="clause">
            <strong>${index + 1}.</strong> ${clause}
          </div>
        `).join('')}
      </div>

      <div class="highlight">
        <p><strong>Nota importante:</strong> Este contrato se rige por la Ley 820 de 2003 y el Código Civil Colombiano. Cualquier modificación debe ser por escrito y firmada por ambas partes.</p>
      </div>

      <div class="signatures">
        <div>
          <div class="signature-line"></div>
          <p>${contract.landlordName}</p>
          <p><strong>Arrendador</strong></p>
        </div>
        <div>
          <div class="signature-line"></div>
          <p>${contract.tenantName}</p>
          <p><strong>Arrendatario</strong></p>
        </div>
      </div>

      <div class="footer">
        <p>Documento generado electrónicamente por RentUs • ${new Date().toLocaleDateString('es-ES')}</p>
      </div>
    </body>
    </html>
  `
}

// Exportar interfaces para usar en otros componentes
export type { ContractData, PdfCoResponse, PdfCoRequest }
