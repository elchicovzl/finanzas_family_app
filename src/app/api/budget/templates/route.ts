import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { getFamilyContext } from '@/lib/family-context'

const templateCategorySchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  monthlyLimit: z.number().positive('Monthly limit must be positive'),
  enableRollover: z.boolean().default(true),
})

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  alertThreshold: z.number().min(0).max(100).optional(),
  autoGenerate: z.boolean().default(true),
  categories: z.array(templateCategorySchema).min(1, 'At least one category is required'),
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
        categories: {
          include: {
            category: {
              select: {
                name: true,
                color: true,
                icon: true
              }
            }
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
      totalBudget: Number(template.totalBudget),
      period: template.period,
      alertThreshold: template.alertThreshold ? Number(template.alertThreshold) : 80,
      autoGenerate: template.autoGenerate,
      lastGenerated: template.lastGenerated,
      isRunning: runningTemplateIds.has(template.id),
      formattedTotalBudget: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(template.totalBudget)),
      categories: template.categories.map(cat => ({
        ...cat,
        monthlyLimit: Number(cat.monthlyLimit),
        formattedLimit: new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        }).format(Number(cat.monthlyLimit))
      }))
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

    // Check if template already exists for this family with same name
    const existingTemplate = await prisma.budgetTemplate.findFirst({
      where: {
        familyId: familyContext.family.id,
        name: validatedData.name,
        isActive: true
      }
    })

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Budget template already exists with this name' },
        { status: 409 }
      )
    }

    // Validar que todas las categorías existan
    const categoryIds = validatedData.categories.map(cat => cat.categoryId)
    const existingCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } }
    })

    if (existingCategories.length !== categoryIds.length) {
      return NextResponse.json({ error: 'One or more categories not found' }, { status: 404 })
    }

    // Calcular el presupuesto total
    const totalBudget = validatedData.categories.reduce((sum, cat) => sum + cat.monthlyLimit, 0)

    // Crear el template y las categorías en una transacción
    const template = await prisma.$transaction(async (tx) => {
      // Crear el template principal
      const newTemplate = await tx.budgetTemplate.create({
        data: {
          familyId: familyContext.family.id,
          createdByUserId: familyContext.user.id,
          name: validatedData.name,
          totalBudget,
          period: validatedData.period,
          alertThreshold: validatedData.alertThreshold || 80,
          autoGenerate: validatedData.autoGenerate
        }
      })

      // Crear las categorías del template
      const templateCategories = await Promise.all(
        validatedData.categories.map(cat => 
          tx.budgetTemplateCategory.create({
            data: {
              templateId: newTemplate.id,
              categoryId: cat.categoryId,
              monthlyLimit: cat.monthlyLimit,
              enableRollover: cat.enableRollover,
            }
          })
        )
      )

      return { ...newTemplate, categories: templateCategories }
    })

    // Obtener el template completo con las categorías para la respuesta
    const completeTemplate = await prisma.budgetTemplate.findUnique({
      where: { id: template.id },
      include: {
        categories: {
          include: {
            category: {
              select: {
                name: true,
                color: true,
                icon: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      id: completeTemplate!.id,
      name: completeTemplate!.name,
      totalBudget: Number(completeTemplate!.totalBudget),
      period: completeTemplate!.period,
      alertThreshold: completeTemplate!.alertThreshold ? Number(completeTemplate!.alertThreshold) : 80,
      autoGenerate: completeTemplate!.autoGenerate,
      lastGenerated: completeTemplate!.lastGenerated,
      formattedTotalBudget: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(completeTemplate!.totalBudget)),
      categories: completeTemplate!.categories.map(cat => ({
        ...cat,
        monthlyLimit: Number(cat.monthlyLimit),
        formattedLimit: new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        }).format(Number(cat.monthlyLimit))
      }))
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