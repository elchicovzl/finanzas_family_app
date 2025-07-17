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

    // Get user's current family
    const userFamilyMember = await prisma.familyMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        family: true
      }
    })

    if (!userFamilyMember) {
      return NextResponse.json(
        { error: 'User is not part of any active family' },
        { status: 403 }
      )
    }

    // Find the template with its categories
    const template = await prisma.budgetTemplate.findFirst({
      where: {
        id: validatedData.templateId,
        familyId: userFamilyMember.familyId,
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

    // Check if budget already exists for this period with same name
    const existingBudget = await prisma.budget.findFirst({
      where: {
        familyId: userFamilyMember.familyId,
        name: template.name,
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

    // Create the budget from template with all categories
    const budget = await prisma.$transaction(async (tx) => {
      // Create the budget
      const newBudget = await tx.budget.create({
        data: {
          familyId: userFamilyMember.familyId,
          name: template.name,
          totalBudget: template.totalBudget,
          period: template.period,
          startDate: startDate,
          endDate: endDate,
          alertThreshold: template.alertThreshold,
          templateId: template.id,
          createdByUserId: session.user.id
        }
      })

      // Create budget categories from template categories
      const budgetCategories = await Promise.all(
        template.categories.map(templateCategory =>
          tx.budgetCategory.create({
            data: {
              budgetId: newBudget.id,
              categoryId: templateCategory.categoryId,
              monthlyLimit: templateCategory.monthlyLimit,
              enableRollover: templateCategory.enableRollover,
              // TODO: Aquí implementaremos la lógica de rollover en el futuro
              rolloverAmount: 0
            }
          })
        )
      )

      // Update template's last generated date
      await tx.budgetTemplate.update({
        where: { id: template.id },
        data: { lastGenerated: new Date() }
      })

      return { ...newBudget, categories: budgetCategories }
    })

    // Get complete budget with categories for response
    const completeBudget = await prisma.budget.findUnique({
      where: { id: budget.id },
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
      id: completeBudget!.id,
      name: completeBudget!.name,
      totalBudget: Number(completeBudget!.totalBudget),
      totalSpent: 0,
      totalRemaining: Number(completeBudget!.totalBudget),
      totalPercentage: 0,
      isOverBudget: false,
      isNearLimit: false,
      startDate: completeBudget!.startDate,
      endDate: completeBudget!.endDate,
      formattedTotalBudget: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(completeBudget!.totalBudget)),
      formattedTotalSpent: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(0),
      formattedTotalRemaining: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(completeBudget!.totalBudget)),
      categories: completeBudget!.categories.map(cat => ({
        ...cat,
        currentSpent: 0,
        effectiveLimit: Number(cat.monthlyLimit) + Number(cat.rolloverAmount),
        remainingBudget: Number(cat.monthlyLimit) + Number(cat.rolloverAmount),
        percentageUsed: 0,
        isOverBudget: false,
        isNearLimit: false,
        formattedLimit: new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        }).format(Number(cat.monthlyLimit) + Number(cat.rolloverAmount)),
        formattedSpent: new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        }).format(0),
        formattedRemaining: new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        }).format(Number(cat.monthlyLimit) + Number(cat.rolloverAmount))
      }))
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