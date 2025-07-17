import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { EmailJobType, EmailJobStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (Vercel uses Authorization header for cron jobs)
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    
    // Check both possible authentication methods
    const isValidVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
    const isValidCustomCron = cronSecret === process.env.CRON_SECRET
    
    if (!isValidVercelCron && !isValidCustomCron) {
      console.log('❌ Unauthorized cron request')
      console.log('Auth header:', authHeader ? 'present' : 'missing')
      console.log('Cron secret header:', cronSecret ? 'present' : 'missing')
      console.log('Expected secret configured:', !!process.env.CRON_SECRET)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('✅ Cron authentication successful')

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    console.log('🔔 Starting reminder check process...')
    console.log('Current time:', now.toISOString())

    // Find reminders that need notification
    const remindersToNotify = await prisma.reminder.findMany({
      where: {
        isActive: true,
        isCompleted: false,
        OR: [
          {
            // Reminders due today or tomorrow (based on notifyDaysBefore setting)
            dueDate: {
              gte: now,
              lte: tomorrow
            },
            OR: [
              {
                lastNotified: null
              },
              {
                lastNotified: {
                  lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Not notified in last 24 hours
                }
              }
            ]
          },
          {
            // Overdue reminders that haven't been notified recently
            dueDate: {
              lt: now
            },
            OR: [
              {
                lastNotified: null
              },
              {
                lastNotified: {
                  lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Not notified in last 24 hours
                }
              }
            ]
          }
        ]
      },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            members: {
              where: {
                isActive: true
              },
              include: {
                user: {
                  select: {
                    email: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        category: {
          select: {
            name: true,
            color: true,
            icon: true
          }
        }
      }
    })

    console.log(`📋 Found ${remindersToNotify.length} reminders to process`)

    let emailJobsCreated = 0
    let errors = 0

    for (const reminder of remindersToNotify) {
      try {
        const daysUntilDue = Math.ceil((reminder.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        // Check if we should notify based on notifyDaysBefore setting
        const shouldNotify = daysUntilDue <= reminder.notifyDaysBefore || daysUntilDue < 0

        if (!shouldNotify) {
          console.log(`⏭️  Skipping reminder "${reminder.title}" - not yet time to notify (${daysUntilDue} days until due, notify ${reminder.notifyDaysBefore} days before)`)
          continue
        }

        console.log(`📧 Processing reminder: "${reminder.title}" for family "${reminder.family.name}"`)
        console.log(`   Due date: ${reminder.dueDate.toISOString()}`)
        console.log(`   Reminder time: ${reminder.reminderTime || 'Not set'}`)
        console.log(`   Days until due: ${daysUntilDue}`)
        console.log(`   Family members: ${reminder.family.members.length}`)
        
        // Check if we should respect the specific reminder time
        if (reminder.reminderTime && daysUntilDue === 0) {
          const [hours, minutes] = reminder.reminderTime.split(':').map(Number)
          const reminderDateTime = new Date(reminder.dueDate)
          reminderDateTime.setHours(hours, minutes, 0, 0)
          
          // If reminder time hasn't passed yet today, skip
          if (reminderDateTime > now) {
            console.log(`   ⏭️  Skipping - reminder time ${reminder.reminderTime} hasn't arrived yet`)
            continue
          }
        }

        // Create email jobs for all active family members
        for (const member of reminder.family.members) {
          try {
            // Check if we already have a pending email job for this reminder and user today
            const existingJob = await prisma.emailJob.findFirst({
              where: {
                type: EmailJobType.REMINDER_EMAIL,
                to: member.user.email,
                status: {
                  in: [EmailJobStatus.PENDING, EmailJobStatus.PROCESSING]
                },
                createdAt: {
                  gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Today
                },
                data: {
                  path: ['reminderId'],
                  equals: reminder.id
                }
              }
            })

            if (existingJob) {
              console.log(`   ⏭️  Skipping ${member.user.email} - email job already exists (ID: ${existingJob.id})`)
              continue
            }

            // Create email job
            await prisma.emailJob.create({
              data: {
                type: EmailJobType.REMINDER_EMAIL,
                to: member.user.email,
                status: EmailJobStatus.PENDING,
                data: {
                  reminderId: reminder.id,
                  familyName: reminder.family.name,
                  reminderTitle: reminder.title,
                  reminderDescription: reminder.description || undefined,
                  amount: reminder.amount ? Number(reminder.amount) : undefined,
                  dueDate: reminder.dueDate.toISOString(),
                  reminderTime: reminder.reminderTime || undefined,
                  daysUntilDue,
                  priority: reminder.priority,
                  isRecurring: reminder.isRecurring,
                  category: reminder.category || undefined
                },
                attempts: 0
              }
            })

            emailJobsCreated++
            console.log(`   ✅ Email job created for ${member.user.email}`)
          } catch (emailError) {
            console.error(`   ❌ Failed to create email job for ${member.user.email}:`, emailError)
            errors++
          }
        }

        // Update lastNotified timestamp and mark as completed if not recurring
        const updateData: any = { lastNotified: now }
        
        // If it's not a recurring reminder, mark it as completed after notification
        if (!reminder.isRecurring) {
          updateData.isCompleted = true
          updateData.completedAt = now
        }

        await prisma.reminder.update({
          where: { id: reminder.id },
          data: updateData
        })

        const statusMessage = reminder.isRecurring 
          ? `Updated lastNotified for recurring reminder "${reminder.title}"`
          : `Marked non-recurring reminder "${reminder.title}" as completed after notification`
        
        console.log(`   ✅ ${statusMessage}`)

      } catch (reminderError) {
        console.error(`❌ Error processing reminder "${reminder.title}":`, reminderError)
        errors++
      }
    }

    const summary = {
      timestamp: now.toISOString(),
      remindersProcessed: remindersToNotify.length,
      emailJobsCreated,
      errors,
      success: true
    }

    console.log('🎉 Reminder check completed!')
    console.log('Summary:', summary)

    return NextResponse.json(summary)

  } catch (error) {
    console.error('💥 Critical error in reminder check process:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: 'Failed to process reminders',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

// Optional: Add POST method for manual trigger
export async function POST(request: NextRequest) {
  return GET(request)
}