import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    
    // Get all reminders for debugging
    const allReminders = await prisma.reminder.findMany({
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
                    id: true,
                    email: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        category: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    // Get email jobs related to reminders
    const emailJobs = await prisma.emailJob.findMany({
      where: {
        type: 'REMINDER_EMAIL'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Filter reminders that should be notified
    const remindersToNotify = allReminders.filter(reminder => {
      if (!reminder.isActive || reminder.isCompleted) return false
      
      const daysUntilDue = Math.ceil((reminder.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const shouldNotify = daysUntilDue <= reminder.notifyDaysBefore || daysUntilDue < 0
      const wasNotifiedRecently = reminder.lastNotified && 
        (now.getTime() - reminder.lastNotified.getTime()) < (24 * 60 * 60 * 1000)
      
      return shouldNotify && !wasNotifiedRecently
    })

    return NextResponse.json({
      currentTime: now.toISOString(),
      totalReminders: allReminders.length,
      activeReminders: allReminders.filter(r => r.isActive && !r.isCompleted).length,
      remindersToNotify: remindersToNotify.length,
      recentEmailJobs: emailJobs.length,
      reminders: allReminders.map(reminder => ({
        id: reminder.id,
        title: reminder.title,
        dueDate: reminder.dueDate.toISOString(),
        daysUntilDue: Math.ceil((reminder.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        notifyDaysBefore: reminder.notifyDaysBefore,
        shouldNotify: remindersToNotify.some(r => r.id === reminder.id),
        isActive: reminder.isActive,
        isCompleted: reminder.isCompleted,
        lastNotified: reminder.lastNotified?.toISOString() || null,
        familyMembers: reminder.family.members.length,
        familyName: reminder.family.name
      })),
      emailJobs: emailJobs.map(job => ({
        id: job.id,
        type: job.type,
        to: job.to,
        status: job.status,
        attempts: job.attempts,
        createdAt: job.createdAt.toISOString(),
        error: job.error,
        data: job.data
      }))
    })

  } catch (error) {
    console.error('Debug reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to debug reminders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}