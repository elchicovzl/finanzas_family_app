import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWelcomeEmail, sendInvitationEmail, sendReminderEmail } from '@/lib/email'
import { EmailJobStatus, EmailJobType } from '@prisma/client'

export async function GET(request: NextRequest) {
  // Verify cron secret for security (Vercel uses Authorization header for cron jobs)
  const authHeader = request.headers.get('authorization')
  const cronSecret = request.headers.get('x-cron-secret')
  
  // Check both possible authentication methods
  const isValidVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isValidCustomCron = cronSecret === process.env.CRON_SECRET
  
  if (!isValidVercelCron && !isValidCustomCron) {
    console.log('❌ Unauthorized process-emails cron request')
    console.log('Auth header:', authHeader ? 'present' : 'missing')
    console.log('Cron secret header:', cronSecret ? 'present' : 'missing')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log('✅ Process-emails cron authentication successful')

  console.log('🔄 Starting email jobs processing...')

  try {
    // Get pending email jobs (max 10 per run to avoid timeouts)
    const pendingJobs = await prisma.emailJob.findMany({
      where: {
        status: EmailJobStatus.PENDING,
        attempts: {
          lt: 3 // Less than max attempts
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 10
    })

    console.log(`📊 Found ${pendingJobs.length} pending email jobs`)

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const job of pendingJobs) {
      console.log(`🔄 Processing job ${job.id} (type: ${job.type})`)
      
      // Mark as processing
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: EmailJobStatus.PROCESSING,
          attempts: { increment: 1 }
        }
      })

      try {
        let emailResult
        
        switch (job.type) {
          case EmailJobType.WELCOME_EMAIL:
            const welcomeData = job.data as any
            emailResult = await sendWelcomeEmail({
              to: job.to,
              userName: welcomeData.userName,
              isGoogleSignup: welcomeData.isGoogleSignup || false,
              loginUrl: welcomeData.loginUrl
            })
            break

          case EmailJobType.FAMILY_INVITATION:
            const invitationData = job.data as any
            emailResult = await sendInvitationEmail({
              to: job.to,
              familyName: invitationData.familyName,
              invitedByName: invitationData.invitedByName,
              invitationUrl: invitationData.invitationUrl,
              expiresAt: new Date(invitationData.expiresAt)
            })
            break

          case EmailJobType.REMINDER_EMAIL:
            const reminderData = job.data as any
            emailResult = await sendReminderEmail({
              to: job.to,
              familyName: reminderData.familyName,
              reminderTitle: reminderData.reminderTitle,
              reminderDescription: reminderData.reminderDescription,
              amount: reminderData.amount,
              dueDate: new Date(reminderData.dueDate),
              reminderTime: reminderData.reminderTime,
              daysUntilDue: reminderData.daysUntilDue,
              priority: reminderData.priority,
              isRecurring: reminderData.isRecurring,
              category: reminderData.category
            })
            break

          default:
            throw new Error(`Unknown email job type: ${job.type}`)
        }

        // Mark as completed
        await prisma.emailJob.update({
          where: { id: job.id },
          data: {
            status: EmailJobStatus.COMPLETED,
            processedAt: new Date(),
            error: null
          }
        })

        console.log(`✅ Job ${job.id} completed successfully`)
        results.succeeded++

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Job ${job.id} failed:`, errorMessage)

        // Determine if this is the final attempt
        const isFinalAttempt = job.attempts >= 2 // Since we already incremented

        await prisma.emailJob.update({
          where: { id: job.id },
          data: {
            status: isFinalAttempt ? EmailJobStatus.FAILED : EmailJobStatus.PENDING,
            error: errorMessage,
            processedAt: isFinalAttempt ? new Date() : undefined
          }
        })

        results.failed++
        results.errors.push(`Job ${job.id}: ${errorMessage}`)
      }

      results.processed++
    }

    console.log(`✅ Email jobs processing completed:`, results)

    return NextResponse.json({
      success: true,
      message: 'Email jobs processed',
      results
    })

  } catch (error) {
    console.error('❌ Error processing email jobs:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}