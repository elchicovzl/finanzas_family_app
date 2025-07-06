import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'
import { z } from 'zod'

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().transform((str) => new Date(str)).refine((date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }, { message: 'Due date cannot be in the past' }),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
  recurrenceInterval: z.number().positive().optional(),
  recurrenceEndDate: z.string().transform((str) => new Date(str)).optional(),
  categoryId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  notifyDaysBefore: z.number().min(0).max(30).default(1)
}).refine((data) => {
  // If recurring and has end date, end date must be after due date
  if (data.isRecurring && data.recurrenceEndDate) {
    return data.recurrenceEndDate > data.dueDate
  }
  return true
}, { 
  message: 'Recurrence end date must be after due date',
  path: ['recurrenceEndDate']
})

export async function GET(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    if (!familyContext?.family?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const upcoming = searchParams.get('upcoming') === 'true'
    const completed = searchParams.get('completed') === 'true'
    const recurring = searchParams.get('recurring') === 'true'

    const skip = (page - 1) * limit

    const where: any = {
      familyId: familyContext.family.id,
      isActive: true
    }

    if (upcoming) {
      where.dueDate = {
        gte: new Date()
      }
      where.isCompleted = false
    }

    if (completed !== undefined) {
      where.isCompleted = completed
    }

    if (recurring !== undefined) {
      where.isRecurring = recurring
    }

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        include: {
          category: {
            select: {
              name: true,
              color: true,
              icon: true
            }
          },
          createdBy: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { isCompleted: 'asc' },
          { dueDate: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.reminder.count({ where })
    ])

    const formattedReminders = reminders.map(reminder => ({
      ...reminder,
      formattedAmount: reminder.amount ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(reminder.amount)) : null,
      formattedDueDate: new Intl.DateTimeFormat('es-CO').format(reminder.dueDate),
      isNotified: !!reminder.lastNotified,
      daysUntilDue: Math.ceil((reminder.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))

    return NextResponse.json({
      reminders: formattedReminders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    if (!familyContext?.family?.id || !familyContext?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check write permission
    if (familyContext.family.role === 'VIEWER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = reminderSchema.parse(body)

    // Calculate next due date for recurring reminders
    let nextDueDate = null
    if (validatedData.isRecurring && validatedData.recurrenceType) {
      nextDueDate = calculateNextDueDate(validatedData.dueDate, validatedData.recurrenceType, validatedData.recurrenceInterval)
    }

    const reminder = await prisma.reminder.create({
      data: {
        familyId: familyContext.family.id,
        createdByUserId: familyContext.user.id,
        title: validatedData.title,
        description: validatedData.description,
        amount: validatedData.amount,
        dueDate: validatedData.dueDate,
        isRecurring: validatedData.isRecurring,
        recurrenceType: validatedData.recurrenceType,
        recurrenceInterval: validatedData.recurrenceInterval,
        recurrenceEndDate: validatedData.recurrenceEndDate,
        categoryId: validatedData.categoryId,
        priority: validatedData.priority,
        notifyDaysBefore: validatedData.notifyDaysBefore,
        nextDueDate
      },
      include: {
        category: {
          select: {
            name: true,
            color: true,
            icon: true
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(reminder, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    )
  }
}

// Helper function to calculate next due date for recurring reminders
function calculateNextDueDate(currentDate: Date, recurrenceType: string, interval: number = 1): Date {
  const nextDate = new Date(currentDate)
  
  switch (recurrenceType) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + interval)
      break
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + (7 * interval))
      break
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + interval)
      break
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + (3 * interval))
      break
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + interval)
      break
    default:
      return nextDate
  }
  
  return nextDate
}