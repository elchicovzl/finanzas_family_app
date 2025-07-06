import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'

export async function GET(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    if (!familyContext?.family?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    const where: any = {
      familyId: familyContext.family.id,
      isActive: true
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        category: {
          select: {
            name: true,
            color: true,
            icon: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    // Format reminders for react-big-calendar
    const calendarEvents = reminders.map(reminder => ({
      id: reminder.id,
      title: reminder.title,
      start: reminder.dueDate,
      end: reminder.dueDate,
      allDay: true,
      resource: {
        id: reminder.id,
        description: reminder.description,
        amount: reminder.amount ? Number(reminder.amount) : null,
        formattedAmount: reminder.amount ? new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        }).format(Number(reminder.amount)) : null,
        priority: reminder.priority,
        isCompleted: reminder.isCompleted,
        isRecurring: reminder.isRecurring,
        recurrenceType: reminder.recurrenceType,
        category: reminder.category,
        isNotified: !!reminder.lastNotified,
        daysUntilDue: Math.ceil((reminder.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }
    }))

    return NextResponse.json({
      events: calendarEvents,
      summary: {
        total: reminders.length,
        completed: reminders.filter(r => r.isCompleted).length,
        pending: reminders.filter(r => !r.isCompleted).length,
        notified: reminders.filter(r => !!r.lastNotified).length,
        recurring: reminders.filter(r => r.isRecurring).length
      }
    })

  } catch (error) {
    console.error('Error fetching calendar reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar reminders' },
      { status: 500 }
    )
  }
}