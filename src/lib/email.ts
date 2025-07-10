import nodemailer from 'nodemailer'
import { generateInvitationEmail, generateReminderEmail, formatDate, type Locale } from './email-templates'

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
  locale?: Locale
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
  locale?: Locale
}

export async function sendInvitationEmail({
  to,
  familyName,
  invitedByName,
  invitationUrl,
  expiresAt,
  locale = 'es'
}: SendInvitationEmailParams) {
  console.log('=== EMAIL DEBUG INFO ===')
  console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST)
  console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT)
  console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER)
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM)
  console.log('Sending email to:', to)
  console.log('Locale:', locale)
  console.log('========================')

  try {
    const expirationDate = formatDate(expiresAt, locale)
    
    const { subject, htmlContent, textContent } = await generateInvitationEmail(locale, {
      familyName,
      invitedByName,
      invitationUrl,
      expirationDate
    })

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlContent,
      text: textContent
    }

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
  category,
  locale = 'es'
}: SendReminderEmailParams) {
  console.log('=== REMINDER EMAIL DEBUG INFO ===')
  console.log('Sending reminder email to:', to)
  console.log('Reminder:', reminderTitle)
  console.log('Days until due:', daysUntilDue)
  console.log('Locale:', locale)
  console.log('==================================')

  try {
    const formattedDueDate = dueDate.toLocaleDateString(locale === 'es' ? 'es-CO' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })

    const { subject, htmlContent, textContent } = await generateReminderEmail(locale, {
      reminderTitle,
      familyName,
      reminderDescription,
      amount,
      formattedDueDate,
      daysUntilDue,
      priority,
      isRecurring,
      category
    })

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlContent,
      text: textContent
    }

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