import { Resend } from 'resend'
import { render } from '@react-email/render'
import FamilyInvitationEmail from '@/emails/templates/FamilyInvitationEmail'
import ReminderEmail from '@/emails/templates/ReminderEmail'
import WelcomeEmail from '@/emails/templates/WelcomeEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

// Fallback to configured domain or default
const getEmailDomain = () => {
  return process.env.EMAIL_DOMAIN || 'finanzasapp.com'
}

const getFromEmail = () => {
  return process.env.EMAIL_FROM || `FamFinz <noreply@${getEmailDomain()}>`
}

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
    icon?: string
    color?: string
  }
}

interface SendWelcomeEmailParams {
  to: string
  userName: string
  isGoogleSignup?: boolean
  loginUrl: string
}

export async function sendInvitationEmail({
  to,
  familyName,
  invitedByName,
  invitationUrl,
  expiresAt
}: SendInvitationEmailParams) {
  console.log('=== RESEND EMAIL DEBUG INFO ===')
  console.log('RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)
  console.log('EMAIL_FROM:', getFromEmail())
  console.log('Sending email to:', to)
  console.log('===============================')

  try {
    const expirationDate = expiresAt.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })

    const emailHtml = await render(FamilyInvitationEmail({
      familyName,
      invitedByName,
      invitationUrl,
      expirationDate
    }))

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: `Invitación a la familia "${familyName}"`,
      html: emailHtml,
    })

    if (error) {
      console.error('❌ Resend error:', error)
      throw new Error(`Failed to send invitation email: ${error.message}`)
    }

    console.log('✅ Email sent successfully!')
    console.log('Message ID:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('❌ Error sending email:', error)
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

  try {
    const formattedDueDate = dueDate.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })

    const isOverdue = daysUntilDue < 0
    const daysDifference = Math.abs(daysUntilDue)

    const emailHtml = await render(ReminderEmail({
      reminderTitle,
      dueDate: formattedDueDate,
      priority,
      amount,
      category: category?.name,
      familyName,
      isRecurring,
      isOverdue,
      daysDifference
    }))

    // Generate subject based on urgency
    let subject = `📅 Recordatorio: ${reminderTitle}`
    if (isOverdue) {
      subject = `🔔 Recordatorio: ${reminderTitle} (fecha pasada)`
    } else if (daysUntilDue === 0) {
      subject = `⚠️ Recordatorio para HOY: ${reminderTitle}`
    } else if (daysUntilDue === 1) {
      subject = `⏰ Recordatorio para MAÑANA: ${reminderTitle}`
    }

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject,
      html: emailHtml,
    })

    if (error) {
      console.error('❌ Resend error:', error)
      throw new Error(`Failed to send reminder email: ${error.message}`)
    }

    console.log('✅ Reminder email sent successfully!')
    console.log('Message ID:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('❌ Error sending reminder email:', error)
    throw new Error('Failed to send reminder email')
  }
}

export async function sendWelcomeEmail({
  to,
  userName,
  isGoogleSignup = false,
  loginUrl
}: SendWelcomeEmailParams) {
  console.log('=== WELCOME EMAIL DEBUG INFO ===')
  console.log('Sending welcome email to:', to)
  console.log('User name:', userName)
  console.log('Google signup:', isGoogleSignup)
  console.log('=================================')

  try {
    // Render the React component to HTML string
    const emailHtml = await render(WelcomeEmail({
      userName,
      isGoogleSignup,
      loginUrl
    }))

    console.log('Email HTML type:', typeof emailHtml)
    console.log('Email HTML length:', emailHtml?.length || 0)

    // Ensure emailHtml is a string
    if (typeof emailHtml !== 'string') {
      throw new Error('Email HTML rendering failed - not a string')
    }

    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [to],
      subject: '¡Bienvenido a FamFinz! 🎉',
      html: emailHtml,
    })

    if (error) {
      console.error('❌ Resend error:', error)
      throw new Error(`Failed to send welcome email: ${error.message}`)
    }

    console.log('✅ Welcome email sent successfully!')
    console.log('Message ID:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('❌ Error sending welcome email:', error)
    throw new Error('Failed to send welcome email')
  }
}