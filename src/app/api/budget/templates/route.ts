import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getFamilyContext } from '@/lib/family-context'

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  monthlyLimit: z.number().positive('Monthly limit must be positive'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  alertThreshold: z.number().min(0).max(100).optional(),
  autoGenerate: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    if (!familyContext?.family?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.budgetTemplate.findMany({
      where: {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get current month boundaries to check for running budgets
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get all active budgets for current period to check which templates are running
    const activeBudgets = await prisma.budget.findMany({
      where: {
        familyId: familyContext.family.id,
        startDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        categoryId: true,
        templateId: true
      }
    })

    const runningTemplateIds = new Set(activeBudgets
      .filter(budget => budget.templateId)
      .map(budget => budget.templateId)
    )

    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      monthlyLimit: Number(template.monthlyLimit),
      period: template.period,
      alertThreshold: template.alertThreshold ? Number(template.alertThreshold) : 80,
      autoGenerate: template.autoGenerate,
      lastGenerated: template.lastGenerated,
      isRunning: runningTemplateIds.has(template.id),
      formattedLimit: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(template.monthlyLimit)),
      category: template.category
    }))

    return NextResponse.json(formattedTemplates)

  } catch (error) {
    console.error('Error fetching budget templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget templates' },
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

    const body = await request.json()
    const validatedData = createTemplateSchema.parse(body)

    // Check if template already exists for this family and category
    const existingTemplate = await prisma.budgetTemplate.findUnique({
      where: {
        familyId_categoryId: {
          familyId: familyContext.family.id,
          categoryId: validatedData.categoryId
        }
      }
    })

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Budget template already exists for this category' },
        { status: 409 }
      )
    }

    const template = await prisma.budgetTemplate.create({
      data: {
        familyId: familyContext.family.id,
        createdByUserId: familyContext.user.id,
        categoryId: validatedData.categoryId,
        name: validatedData.name,
        monthlyLimit: validatedData.monthlyLimit,
        period: validatedData.period,
        alertThreshold: validatedData.alertThreshold || 80,
        autoGenerate: validatedData.autoGenerate
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

    return NextResponse.json({
      id: template.id,
      name: template.name,
      monthlyLimit: Number(template.monthlyLimit),
      period: template.period,
      alertThreshold: template.alertThreshold ? Number(template.alertThreshold) : 80,
      autoGenerate: template.autoGenerate,
      lastGenerated: template.lastGenerated,
      formattedLimit: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(template.monthlyLimit)),
      category: template.category
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    
    console.error('Error creating budget template:', error)
    return NextResponse.json(
      { error: 'Failed to create budget template' },
      { status: 500 }
    )
  }
}