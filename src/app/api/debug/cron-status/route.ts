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
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Check recent email jobs
    const recentEmailJobs = await prisma.emailJob.findMany({
      where: {
        createdAt: {
          gte: last24Hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get email job stats
    const emailJobStats = await prisma.emailJob.groupBy({
      by: ['status', 'type'],
      where: {
        createdAt: {
          gte: last7Days
        }
      },
      _count: true
    })

    // Check reminders that should have been processed
    const shouldBeProcessed = await prisma.reminder.findMany({
      where: {
        isActive: true,
        isCompleted: false,
        dueDate: {
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Due within next 24 hours
        }
      },
      include: {
        family: {
          select: {
            name: true,
            members: {
              where: { isActive: true },
              select: { 
                user: { 
                  select: { email: true, name: true } 
                } 
              }
            }
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    // Get recent reminders activity
    const recentReminders = await prisma.reminder.findMany({
      where: {
        OR: [
          {
            lastNotified: {
              gte: last24Hours
            }
          },
          {
            createdAt: {
              gte: last24Hours
            }
          }
        ]
      },
      orderBy: {
        lastNotified: 'desc'
      }
    })

    return NextResponse.json({
      currentTime: now.toISOString(),
      cronConfiguration: {
        checkReminders: "0 9 * * * (Daily at 9 AM)",
        processEmails: "*/2 * * * * (Every 2 minutes)"
      },
      recentActivity: {
        emailJobsLast24h: recentEmailJobs.length,
        remindersProcessedLast24h: recentReminders.length,
        remindersDueSoon: shouldBeProcessed.length
      },
      emailJobStats: emailJobStats.reduce((acc, stat) => {
        const key = `${stat.type}_${stat.status}`
        acc[key] = stat._count
        return acc
      }, {} as Record<string, number>),
      recentEmailJobs: recentEmailJobs.slice(0, 10).map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        to: job.to,
        attempts: job.attempts,
        createdAt: job.createdAt.toISOString(),
        error: job.error
      })),
      remindersDueSoon: shouldBeProcessed.map(reminder => ({
        id: reminder.id,
        title: reminder.title,
        dueDate: reminder.dueDate.toISOString(),
        daysUntilDue: Math.ceil((reminder.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        notifyDaysBefore: reminder.notifyDaysBefore,
        lastNotified: reminder.lastNotified?.toISOString() || null,
        familyMembers: reminder.family.members.length,
        shouldNotify: Math.ceil((reminder.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) <= reminder.notifyDaysBefore
      })),
      troubleshooting: {
        cronSecretConfigured: !!process.env.CRON_SECRET,
        resendConfigured: !!process.env.RESEND_API_KEY,
        emailFromConfigured: !!process.env.EMAIL_FROM,
        lastRemindersCheck: recentReminders.length > 0 ? recentReminders[0].lastNotified?.toISOString() : 'Never'
      }
    })

  } catch (error) {
    console.error('Cron status error:', error)
    return NextResponse.json(
      { error: 'Failed to get cron status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}