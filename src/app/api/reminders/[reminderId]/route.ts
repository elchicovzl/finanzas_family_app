import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'
import { z } from 'zod'

const updateReminderSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().transform((str) => new Date(str)).refine((date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }, { message: 'Due date cannot be in the past' }).optional(),
  reminderTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM (24-hour format)').optional(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']).optional(),
  recurrenceInterval: z.number().positive().optional(),
  recurrenceEndDate: z.string().transform((str) => new Date(str)).optional(),
  categoryId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  notifyDaysBefore: z.number().min(0).max(30).optional(),
  isCompleted: z.boolean().optional()
}).refine((data) => {
  // If both dueDate and recurrenceEndDate are provided, end date must be after due date
  if (data.dueDate && data.recurrenceEndDate) {
    return data.recurrenceEndDate > data.dueDate
  }
  return true
}, { 
  message: 'Recurrence end date must be after due date',
  path: ['recurrenceEndDate']
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  try {
    const { reminderId } = await params
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        familyId: familyContext.family.id,
        isActive: true
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

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const formattedReminder = {
      ...reminder,
      formattedAmount: reminder.amount ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(reminder.amount)) : null,
      formattedDueDate: new Intl.DateTimeFormat('es-CO').format(reminder.dueDate),
      formattedReminderTime: reminder.reminderTime ? reminder.reminderTime : null,
      isNotified: !!reminder.lastNotified,
      daysUntilDue: Math.ceil((reminder.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json(formattedReminder)

  } catch (error) {
    console.error('Error fetching reminder:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  try {
    const { reminderId } = await params
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check write permission
    if (familyContext.family.role === 'VIEWER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    
    // Special validation for editing: if only completing, don't validate date
    let validatedData
    if (body.isCompleted === true && Object.keys(body).length === 1) {
      // Only completing, skip date validation
      validatedData = { isCompleted: true }
    } else {
      validatedData = updateReminderSchema.parse(body)
    }

    // Check if reminder exists and belongs to family
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        familyId: familyContext.family.id,
        isActive: true
      }
    })

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    // Calculate next due date if updating recurring settings
    let nextDueDate = existingReminder.nextDueDate
    if (validatedData.dueDate && validatedData.isRecurring && validatedData.recurrenceType) {
      nextDueDate = calculateNextDueDate(validatedData.dueDate, validatedData.recurrenceType, validatedData.recurrenceInterval)
    }

    // Handle completion logic for recurring reminders
    const updateData: Record<string, unknown> = { ...validatedData }
    
    if (validatedData.isCompleted && !existingReminder.isCompleted && existingReminder.isRecurring) {
      // If marking a recurring reminder as completed, create next occurrence
      if (existingReminder.nextDueDate && (!existingReminder.recurrenceEndDate || existingReminder.nextDueDate <= existingReminder.recurrenceEndDate)) {
        await prisma.reminder.create({
          data: {
            familyId: existingReminder.familyId,
            createdByUserId: existingReminder.createdByUserId,
            title: existingReminder.title,
            description: existingReminder.description,
            amount: existingReminder.amount,
            dueDate: existingReminder.nextDueDate,
            reminderTime: existingReminder.reminderTime,
            isRecurring: existingReminder.isRecurring,
            recurrenceType: existingReminder.recurrenceType,
            recurrenceInterval: existingReminder.recurrenceInterval,
            recurrenceEndDate: existingReminder.recurrenceEndDate,
            categoryId: existingReminder.categoryId,
            priority: existingReminder.priority,
            notifyDaysBefore: existingReminder.notifyDaysBefore,
            nextDueDate: calculateNextDueDate(existingReminder.nextDueDate, existingReminder.recurrenceType!, existingReminder.recurrenceInterval)
          }
        })
      }
      updateData.completedAt = new Date()
    }

    if (nextDueDate) {
      updateData.nextDueDate = nextDueDate
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id: reminderId },
      data: updateData,
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

    return NextResponse.json(updatedReminder)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reminderId: string }> }
) {
  try {
    const { reminderId } = await params
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permission for deletion
    if (familyContext.family.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    // Check if reminder exists and belongs to family
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        familyId: familyContext.family.id,
        isActive: true
      }
    })

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.reminder.update({
      where: { id: reminderId },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
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