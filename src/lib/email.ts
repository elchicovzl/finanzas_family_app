import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD
  }
})

interface SendInvitationEmailParams {
  to: string
  familyName: string
  invitedByName: string
  invitationUrl: string
  expiresAt: Date
}

interface SendReminderEmailParams {
  to: string
  familyName: string
  reminderTitle: string
  reminderDescription?: string
  amount?: number
  dueDate: Date
  daysUntilDue: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isRecurring: boolean
  category?: {
    name: string
    icon: string
    color: string
  }
}

export async function sendInvitationEmail({
  to,
  familyName,
  invitedByName,
  invitationUrl,
  expiresAt
}: SendInvitationEmailParams) {
  console.log('=== EMAIL DEBUG INFO ===')
  console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST)
  console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT)
  console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER)
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM)
  console.log('Sending email to:', to)
  console.log('========================')

  const expirationDate = expiresAt.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Invitación a unirte a la familia "${familyName}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitación a Familia</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border: 1px solid #e9ecef;">
          <h1 style="color: #007bff; text-align: center; margin-bottom: 30px;">
            📊 Finanzas Familiares
          </h1>
          
          <h2 style="color: #495057; margin-bottom: 20px;">
            ¡Has sido invitado a unirte a una familia!
          </h2>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hola,
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${invitedByName}</strong> te ha invitado a unirte a la familia 
            <strong>"${familyName}"</strong> en la aplicación de Finanzas Familiares.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Con esta aplicación podrás:
          </p>
          
          <ul style="font-size: 16px; margin-bottom: 30px; padding-left: 20px;">
            <li>Gestionar transacciones familiares</li>
            <li>Crear y seguir presupuestos compartidos</li>
            <li>Ver análisis financieros de la familia</li>
            <li>Coordinar gastos con otros miembros</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Aceptar Invitación
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>⏰ Importante:</strong> Esta invitación expira el ${expirationDate}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
          </p>
          <p style="font-size: 14px; color: #007bff; word-break: break-all;">
            ${invitationUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6c757d; text-align: center;">
            Si no esperabas esta invitación, puedes ignorar este correo.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
¡Has sido invitado a unirte a una familia!

${invitedByName} te ha invitado a unirte a la familia "${familyName}" en la aplicación de Finanzas Familiares.

Para aceptar la invitación, visita: ${invitationUrl}

Esta invitación expira el ${expirationDate}

Si no puedes hacer clic en el enlace, copia y pega la URL en tu navegador.

Si no esperabas esta invitación, puedes ignorar este correo.
    `.trim()
  }

  try {
    console.log('Attempting to send email...')
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully!')
    console.log('Message ID:', info.messageId)
    console.log('Response:', info.response)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      command: (error as any)?.command
    })
    throw new Error('Failed to send invitation email')
  }
}

export async function sendReminderEmail({
  to,
  familyName,
  reminderTitle,
  reminderDescription,
  amount,
  dueDate,
  daysUntilDue,
  priority,
  isRecurring,
  category
}: SendReminderEmailParams) {
  console.log('=== REMINDER EMAIL DEBUG INFO ===')
  console.log('Sending reminder email to:', to)
  console.log('Reminder:', reminderTitle)
  console.log('Days until due:', daysUntilDue)
  console.log('==================================')

  const formattedDueDate = dueDate.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  const formattedAmount = amount ? new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(amount) : ''

  const priorityColors = {
    LOW: '#10B981',
    MEDIUM: '#F59E0B',
    HIGH: '#EF4444',
    URGENT: '#DC2626'
  }

  const urgencyText = daysUntilDue < 0 
    ? `¡Fecha pasada! (${Math.abs(daysUntilDue)} días después)`
    : daysUntilDue === 0 
    ? '¡ES PARA HOY!'
    : daysUntilDue === 1 
    ? 'Es para mañana'
    : `Es en ${daysUntilDue} días`

  const subject = daysUntilDue < 0 
    ? `🔔 Notificación: ${reminderTitle} (fecha pasada)`
    : daysUntilDue === 0
    ? `⚠️ Notificación para HOY: ${reminderTitle}`
    : daysUntilDue === 1
    ? `⏰ Notificación para MAÑANA: ${reminderTitle}`
    : `📅 Notificación: ${reminderTitle}`

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notificación de Pago</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; padding: 20px 0; border-bottom: 2px solid #eee; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
          .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
          .reminder-card { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid ${priorityColors[priority]}; }
          .reminder-title { font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
          .reminder-details { margin: 15px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #64748b; }
          .detail-value { color: #1e293b; }
          .urgency { font-size: 18px; font-weight: bold; text-align: center; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .overdue { background-color: #fef2f2; color: #dc2626; border: 2px solid #fecaca; }
          .today { background-color: #fef3c7; color: #d97706; border: 2px solid #fde68a; }
          .soon { background-color: #f0f9ff; color: #0369a1; border: 2px solid #bae6fd; }
          .category-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; color: white; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">💰 Finanzas App</div>
            <h1>Notificación de Pago</h1>
            <div class="priority-badge" style="background-color: ${priorityColors[priority]}">
              Prioridad ${priority}
            </div>
          </div>

          <div class="reminder-card">
            <div class="reminder-title">${reminderTitle}</div>
            
            ${reminderDescription ? `<p style="color: #64748b; margin: 10px 0;">${reminderDescription}</p>` : ''}

            <div class="urgency ${daysUntilDue < 0 ? 'overdue' : daysUntilDue === 0 ? 'today' : 'soon'}">
              ${urgencyText}
            </div>

            <div class="reminder-details">
              <div class="detail-row">
                <span class="detail-label">📅 Fecha de vencimiento:</span>
                <span class="detail-value">${formattedDueDate}</span>
              </div>
              
              ${amount ? `
                <div class="detail-row">
                  <span class="detail-label">💵 Monto:</span>
                  <span class="detail-value" style="font-weight: bold; color: #059669;">${formattedAmount}</span>
                </div>
              ` : ''}

              ${category ? `
                <div class="detail-row">
                  <span class="detail-label">🏷️ Categoría:</span>
                  <span class="detail-value">
                    <span class="category-badge" style="background-color: ${category.color}">
                      ${category.icon} ${category.name}
                    </span>
                  </span>
                </div>
              ` : ''}

              <div class="detail-row">
                <span class="detail-label">🔄 Recurrente:</span>
                <span class="detail-value">${isRecurring ? 'Sí' : 'No'}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">👨‍👩‍👧‍👦 Familia:</span>
                <span class="detail-value">${familyName}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b; margin-bottom: 15px;">
              ${daysUntilDue < 0 
                ? '💡 Este recordatorio es para una fecha que ya pasó. Revisa si ya realizaste este pago.'
                : '💡 Este es tu recordatorio automático para mantener tus finanzas organizadas.'
              }
            </p>
            
            ${isRecurring ? `
              <p style="color: #0369a1; font-size: 14px; margin-top: 15px;">
                🔄 Este es un recordatorio recurrente. Se generará automáticamente el próximo recordatorio según la frecuencia configurada.
              </p>
            ` : `
              <p style="color: #059669; font-size: 14px; margin-top: 15px;">
                ✅ Este recordatorio se marca automáticamente como notificado después de enviarse.
              </p>
            `}
          </div>

          <div class="footer">
            <p>Esta es una notificación automática de <strong>Finanzas App</strong></p>
            <p style="font-size: 12px; color: #9ca3af;">
              Si tienes alguna pregunta, contacta al administrador de tu familia.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Notificación de Pago - ${familyName}

${reminderTitle}
${reminderDescription ? reminderDescription + '\n' : ''}

${urgencyText}
Fecha de vencimiento: ${formattedDueDate}
${amount ? `Monto: ${formattedAmount}\n` : ''}
${category ? `Categoría: ${category.name}\n` : ''}
Prioridad: ${priority}
Recurrente: ${isRecurring ? 'Sí' : 'No'}

${daysUntilDue < 0 
  ? 'Este recordatorio es para una fecha que ya pasó. Revisa si ya realizaste este pago.'
  : 'Este es tu recordatorio para mantener tus finanzas organizadas.'
}

${isRecurring 
  ? 'Este es un recordatorio recurrente. Se generará automáticamente el próximo recordatorio según la frecuencia configurada.' 
  : 'Este recordatorio se marca automáticamente como notificado después de enviarse.'
}

---
Finanzas App - Notificación automática
    `.trim()
  }

  try {
    console.log('Attempting to send reminder email...')
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Reminder email sent successfully!')
    console.log('Message ID:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Error sending reminder email:', error)
    throw new Error('Failed to send reminder email')
  }
}