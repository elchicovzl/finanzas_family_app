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