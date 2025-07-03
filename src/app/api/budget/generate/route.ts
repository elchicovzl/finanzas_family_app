import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const generateBudgetSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  startDate: z.string().optional() // ISO string, defaults to current month
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = generateBudgetSchema.parse(body)

    // Find the template
    const template = await prisma.budgetTemplate.findFirst({
      where: {
        id: validatedData.templateId,
        userId: session.user.id,
        isActive: true
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Budget template not found' },
        { status: 404 }
      )
    }

    // Determine the start date
    const startDate = validatedData.startDate 
      ? new Date(validatedData.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    // Calculate end date based on period
    let endDate: Date
    switch (template.period) {
      case 'WEEKLY':
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'MONTHLY':
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
        break
      case 'QUARTERLY':
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0)
        break
      case 'YEARLY':
        endDate = new Date(startDate.getFullYear() + 1, 0, 0)
        break
      default:
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
    }

    // Check if budget already exists for this period
    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: session.user.id,
        categoryId: template.categoryId,
        startDate: {
          gte: startDate,
          lt: endDate
        }
      }
    })

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget already exists for this period' },
        { status: 409 }
      )
    }

    // Create the budget from template
    const budget = await prisma.budget.create({
      data: {
        userId: session.user.id,
        categoryId: template.categoryId,
        name: template.name,
        monthlyLimit: template.monthlyLimit,
        period: template.period,
        startDate: startDate,
        endDate: endDate,
        alertThreshold: template.alertThreshold,
        templateId: template.id
      },
      include: {
        category: {
          select: {
            name: true,
            color: true,
            icon: true
          }
        }
      }
    })

    // Update template's last generated date
    await prisma.budgetTemplate.update({
      where: { id: template.id },
      data: { lastGenerated: new Date() }
    })

    return NextResponse.json({
      id: budget.id,
      name: budget.name,
      monthlyLimit: Number(budget.monthlyLimit),
      currentSpent: 0,
      remainingBudget: Number(budget.monthlyLimit),
      percentageUsed: 0,
      isOverBudget: false,
      isNearLimit: false,
      startDate: budget.startDate,
      endDate: budget.endDate,
      formattedLimit: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(budget.monthlyLimit)),
      formattedSpent: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(0),
      formattedRemaining: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(budget.monthlyLimit)),
      category: budget.category
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error generating budget from template:', error)
    return NextResponse.json(
      { error: 'Failed to generate budget from template' },
      { status: 500 }
    )
  }
}