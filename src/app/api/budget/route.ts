import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'
import { z } from 'zod'

const budgetCategorySchema = z.object({
  categoryId: z.string(),
  monthlyLimit: z.number().positive(),
  enableRollover: z.boolean().default(true),
})

const budgetSchema = z.object({
  name: z.string().min(1),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  alertThreshold: z.number().min(0).max(100).optional(),
  categories: z.array(budgetCategorySchema).min(1),
})

export async function GET(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family) {
      return NextResponse.json({ error: 'No family context found' }, { status: 401 })
    }

    const budgets = await prisma.budget.findMany({
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
      orderBy: { createdAt: 'desc' }
    })

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        // Calcular gastos por categoría
        const categoriesWithSpending = await Promise.all(
          budget.categories.map(async (budgetCategory) => {
            const spent = await prisma.transaction.aggregate({
              where: {
                familyId: familyContext.family.id,
                categoryId: budgetCategory.categoryId,
                type: 'EXPENSE',
                date: {
                  gte: currentMonth,
                  lt: nextMonth
                }
              },
              _sum: { amount: true }
            })

            const spentAmount = Math.abs(Number(spent._sum.amount || 0))
            const limitAmount = Number(budgetCategory.monthlyLimit) + Number(budgetCategory.rolloverAmount)
            const percentage = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0

            return {
              ...budgetCategory,
              currentSpent: spentAmount,
              effectiveLimit: limitAmount, // Límite base + rollover
              remainingBudget: limitAmount - spentAmount,
              percentageUsed: Math.round(percentage),
              isOverBudget: spentAmount > limitAmount,
              isNearLimit: percentage >= (budget.alertThreshold || 80),
              formattedLimit: new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP'
              }).format(limitAmount),
              formattedSpent: new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP'
              }).format(spentAmount),
              formattedRemaining: new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP'
              }).format(limitAmount - spentAmount)
            }
          })
        )

        // Calcular totales del presupuesto
        const totalSpent = categoriesWithSpending.reduce((sum, cat) => sum + cat.currentSpent, 0)
        const totalLimit = categoriesWithSpending.reduce((sum, cat) => sum + cat.effectiveLimit, 0)
        const totalRemaining = totalLimit - totalSpent
        const totalPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0

        return {
          ...budget,
          categories: categoriesWithSpending,
          totalSpent,
          totalLimit,
          totalRemaining,
          totalPercentage: Math.round(totalPercentage),
          isOverBudget: totalSpent > totalLimit,
          isNearLimit: totalPercentage >= (budget.alertThreshold || 80),
          formattedTotalLimit: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
          }).format(totalLimit),
          formattedTotalSpent: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
          }).format(totalSpent),
          formattedTotalRemaining: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
          }).format(totalRemaining)
        }
      })
    )

    return NextResponse.json(budgetsWithSpending)

  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family) {
      return NextResponse.json({ error: 'No family context found' }, { status: 401 })
    }

    // Check write permission
    if (familyContext.family.role === 'VIEWER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const result = budgetSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }

    const { name, period, alertThreshold, categories } = result.data

    // Validar que todas las categorías existan
    const categoryIds = categories.map(cat => cat.categoryId)
    const existingCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } }
    })

    if (existingCategories.length !== categoryIds.length) {
      return NextResponse.json({ error: 'One or more categories not found' }, { status: 404 })
    }

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    // Verificar si ya existe un presupuesto con el mismo nombre para este mes
    const existingBudget = await prisma.budget.findFirst({
      where: {
        familyId: familyContext.family.id,
        name,
        startDate: currentMonth,
        isActive: true
      }
    })

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget already exists with this name for this month' },
        { status: 400 }
      )
    }

    // Calcular el presupuesto total
    const totalBudget = categories.reduce((sum, cat) => sum + cat.monthlyLimit, 0)

    // Crear el presupuesto y las categorías en una transacción
    const budget = await prisma.$transaction(async (tx) => {
      // Crear el presupuesto principal
      const newBudget = await tx.budget.create({
        data: {
          familyId: familyContext.family.id,
          createdByUserId: familyContext.user.id,
          name,
          totalBudget,
          period,
          alertThreshold,
          startDate: currentMonth,
        }
      })

      // Crear las categorías del presupuesto
      const budgetCategories = await Promise.all(
        categories.map(cat => 
          tx.budgetCategory.create({
            data: {
              budgetId: newBudget.id,
              categoryId: cat.categoryId,
              monthlyLimit: cat.monthlyLimit,
              enableRollover: cat.enableRollover,
            }
          })
        )
      )

      return { ...newBudget, categories: budgetCategories }
    })

    // Obtener el presupuesto completo con las categorías para la respuesta
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

    return NextResponse.json(completeBudget, { status: 201 })

  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    )
  }
}