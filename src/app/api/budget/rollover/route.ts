import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'
import { z } from 'zod'

const rolloverSchema = z.object({
  budgetId: z.string(),
  month: z.string().optional(), // formato YYYY-MM
})

export async function POST(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family) {
      return NextResponse.json({ error: 'No family context found' }, { status: 401 })
    }

    // Check admin permission for rollover operations
    if (familyContext.family.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const result = rolloverSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }

    const { budgetId, month } = result.data

    // Definir el mes para el cálculo del rollover
    const targetMonth = month ? new Date(month + '-01') : new Date()
    targetMonth.setDate(1)
    targetMonth.setHours(0, 0, 0, 0)

    const nextMonth = new Date(targetMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    // Obtener el presupuesto actual con sus categorías
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Verificar que el presupuesto pertenece a la familia
    if (budget.familyId !== familyContext.family.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Procesar rollover para cada categoría
    const rolloverResults = await Promise.all(
      budget.categories.map(async (budgetCategory) => {
        if (!budgetCategory.enableRollover) {
          return {
            categoryId: budgetCategory.categoryId,
            categoryName: budgetCategory.category.name,
            rolloverAmount: 0,
            message: 'Rollover disabled for this category'
          }
        }

        // Calcular gastos actuales de la categoría
        const spent = await prisma.transaction.aggregate({
          where: {
            familyId: familyContext.family.id,
            categoryId: budgetCategory.categoryId,
            type: 'EXPENSE',
            date: {
              gte: targetMonth,
              lt: nextMonth
            }
          },
          _sum: { amount: true }
        })

        const spentAmount = Math.abs(Number(spent._sum.amount || 0))
        const effectiveLimit = Number(budgetCategory.monthlyLimit) + Number(budgetCategory.rolloverAmount)
        const remaining = effectiveLimit - spentAmount

        if (remaining > 0) {
          // Hay dinero sobrante, aplicar rollover
          return {
            categoryId: budgetCategory.categoryId,
            categoryName: budgetCategory.category.name,
            rolloverAmount: remaining,
            message: `Rollover applied: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(remaining)}`
          }
        } else {
          // No hay dinero sobrante o está en déficit
          return {
            categoryId: budgetCategory.categoryId,
            categoryName: budgetCategory.category.name,
            rolloverAmount: 0,
            deficit: Math.abs(remaining),
            message: remaining < 0 ? `Deficit: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Math.abs(remaining))}` : 'No rollover (budget fully used)'
          }
        }
      })
    )

    // Calcular totales
    const totalRollover = rolloverResults.reduce((sum, result) => sum + result.rolloverAmount, 0)
    const totalDeficit = rolloverResults.reduce((sum, result) => sum + (result.deficit || 0), 0)

    return NextResponse.json({
      budgetId,
      month: targetMonth.toISOString().substr(0, 7),
      totalRollover,
      totalDeficit,
      categoriesRollover: rolloverResults,
      formattedTotalRollover: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(totalRollover),
      formattedTotalDeficit: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(totalDeficit)
    })

  } catch (error) {
    console.error('Error processing rollover:', error)
    return NextResponse.json(
      { error: 'Failed to process rollover' },
      { status: 500 }
    )
  }
}

// Endpoint para aplicar rollover automático al generar presupuesto del siguiente mes
export async function PUT(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family) {
      return NextResponse.json({ error: 'No family context found' }, { status: 401 })
    }

    const body = await request.json()
    const { budgetId, nextMonthBudgetId } = body

    // Calcular rollover del presupuesto anterior
    const rolloverResponse = await POST(request)
    const rolloverData = await rolloverResponse.json()

    if (!rolloverResponse.ok) {
      return NextResponse.json(rolloverData, { status: rolloverResponse.status })
    }

    // Aplicar rollover al presupuesto del siguiente mes
    const nextMonthBudget = await prisma.budget.findUnique({
      where: { id: nextMonthBudgetId },
      include: { categories: true }
    })

    if (!nextMonthBudget) {
      return NextResponse.json({ error: 'Next month budget not found' }, { status: 404 })
    }

    // Actualizar cada categoría con su rollover correspondiente
    const updatePromises = rolloverData.categoriesRollover.map((rolloverResult: any) => {
      const categoryInNextBudget = nextMonthBudget.categories.find(
        cat => cat.categoryId === rolloverResult.categoryId
      )

      if (categoryInNextBudget) {
        return prisma.budgetCategory.update({
          where: { id: categoryInNextBudget.id },
          data: {
            rolloverAmount: rolloverResult.rolloverAmount
          }
        })
      }
      return null
    })

    await Promise.all(updatePromises.filter(Boolean))

    return NextResponse.json({
      success: true,
      message: 'Rollover applied successfully',
      rolloverData
    })

  } catch (error) {
    console.error('Error applying rollover:', error)
    return NextResponse.json(
      { error: 'Failed to apply rollover' },
      { status: 500 }
    )
  }
}