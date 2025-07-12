import { prisma } from './db'
import { EmailJobType } from '@prisma/client'

interface CreateWelcomeEmailJobParams {
  to: string
  userName: string
  isGoogleSignup?: boolean
  loginUrl: string
}

interface CreateFamilyInvitationJobParams {
  to: string
  familyName: string
  invitedByName: string
  invitationUrl: string
  expiresAt: Date
}

interface CreateReminderEmailJobParams {
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

export async function createWelcomeEmailJob({
  to,
  userName,
  isGoogleSignup = false,
  loginUrl
}: CreateWelcomeEmailJobParams) {
  console.log('📝 Creating welcome email job for:', to)
  
  const job = await prisma.emailJob.create({
    data: {
      type: EmailJobType.WELCOME_EMAIL,
      to,
      data: {
        userName,
        isGoogleSignup,
        loginUrl
      }
    }
  })

  console.log('✅ Welcome email job created with ID:', job.id)
  return job
}

export async function createFamilyInvitationJob({
  to,
  familyName,
  invitedByName,
  invitationUrl,
  expiresAt
}: CreateFamilyInvitationJobParams) {
  console.log('📝 Creating family invitation email job for:', to)
  
  const job = await prisma.emailJob.create({
    data: {
      type: EmailJobType.FAMILY_INVITATION,
      to,
      data: {
        familyName,
        invitedByName,
        invitationUrl,
        expiresAt: expiresAt.toISOString()
      }
    }
  })

  console.log('✅ Family invitation email job created with ID:', job.id)
  return job
}

export async function createReminderEmailJob({
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
}: CreateReminderEmailJobParams) {
  console.log('📝 Creating reminder email job for:', to)
  
  const job = await prisma.emailJob.create({
    data: {
      type: EmailJobType.REMINDER_EMAIL,
      to,
      data: {
        familyName,
        reminderTitle,
        reminderDescription,
        amount,
        dueDate: dueDate.toISOString(),
        daysUntilDue,
        priority,
        isRecurring,
        category
      }
    }
  })

  console.log('✅ Reminder email job created with ID:', job.id)
  return job
}