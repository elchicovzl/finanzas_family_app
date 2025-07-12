import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendReminderEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    console.log('🔍 Manual reminder test triggered at:', now.toISOString())

    // Find all active reminders due today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const remindersToday = await prisma.reminder.findMany({
      where: {
        isActive: true,
        isCompleted: false,
        dueDate: {
          gte: today,
          lt: tomorrow
        }
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

    console.log(`📋 Found ${remindersToday.length} reminders due today`)

    const results = []

    for (const reminder of remindersToday) {
      const reminderInfo = {
        id: reminder.id,
        title: reminder.title,
        dueDate: reminder.dueDate.toISOString(),
        lastNotified: reminder.lastNotified?.toISOString() || null,
        isCompleted: reminder.isCompleted,
        isRecurring: reminder.isRecurring,
        notifyDaysBefore: reminder.notifyDaysBefore,
        familyName: reminder.family.name,
        familyMembers: reminder.family.members.length,
        shouldNotify: false,
        emailsSent: 0,
        errors: []
      }

      // Check if we should notify
      const daysUntilDue = Math.ceil((reminder.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const shouldNotify = daysUntilDue <= reminder.notifyDaysBefore || daysUntilDue < 0

      // Check if already notified recently
      const alreadyNotified = reminder.lastNotified && 
        (now.getTime() - reminder.lastNotified.getTime()) < (24 * 60 * 60 * 1000)

      reminderInfo.shouldNotify = shouldNotify && !alreadyNotified

      console.log(`📧 Reminder "${reminder.title}":`)
      console.log(`   Days until due: ${daysUntilDue}`)
      console.log(`   Notify days before: ${reminder.notifyDaysBefore}`)
      console.log(`   Should notify: ${reminderInfo.shouldNotify}`)
      console.log(`   Already notified: ${alreadyNotified}`)
      console.log(`   Last notified: ${reminder.lastNotified?.toISOString() || 'Never'}`)

      if (reminderInfo.shouldNotify) {
        // Send test email to family members
        for (const member of reminder.family.members) {
          try {
            await sendReminderEmail({
              to: member.user.email,
              familyName: reminder.family.name,
              reminderTitle: reminder.title,
              reminderDescription: reminder.description || undefined,
              amount: reminder.amount ? Number(reminder.amount) : undefined,
              dueDate: reminder.dueDate,
              daysUntilDue,
              priority: reminder.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
              isRecurring: reminder.isRecurring,
              category: reminder.category || undefined,
              locale: 'es'
            })

            reminderInfo.emailsSent++
            console.log(`   ✅ Test email sent to ${member.user.email}`)
          } catch (emailError) {
            console.error(`   ❌ Failed to send email to ${member.user.email}:`, emailError)
            reminderInfo.errors.push(`Failed to send to ${member.user.email}: ${emailError}`)
          }
        }

        // Update lastNotified for testing
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { lastNotified: now }
        })
      }

      results.push(reminderInfo)
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      totalReminders: remindersToday.length,
      results,
      success: true
    })

  } catch (error) {
    console.error('💥 Error in test reminders:', error)
    return NextResponse.json({
      error: 'Failed to test reminders',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}