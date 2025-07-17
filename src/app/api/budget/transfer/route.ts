import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'
import { z } from 'zod'

const transferSchema = z.object({
  fromCategoryId: z.string(),
  toCategoryId: z.string(),
  amount: z.number().positive(),
  budgetId: z.string(),
  reason: z.string().optional().default('Budget transfer'),
})

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
    const result = transferSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }

    const { fromCategoryId, toCategoryId, amount, budgetId, reason } = result.data

    // Verificar que las categorías son diferentes
    if (fromCategoryId === toCategoryId) {
      return NextResponse.json({ error: 'Cannot transfer to the same category' }, { status: 400 })
    }

    // Obtener el presupuesto con sus categorías
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

    // Encontrar las categorías de origen y destino
    const fromCategory = budget.categories.find(cat => cat.categoryId === fromCategoryId)
    const toCategory = budget.categories.find(cat => cat.categoryId === toCategoryId)

    if (!fromCategory || !toCategory) {
      return NextResponse.json({ error: 'Category not found in budget' }, { status: 404 })
    }

    // Calcular el período actual
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    // Calcular gastos actuales de la categoría origen
    const fromSpent = await prisma.transaction.aggregate({
      where: {
        familyId: familyContext.family.id,
        categoryId: fromCategoryId,
        type: 'EXPENSE',
        date: {
          gte: currentMonth,
          lt: nextMonth
        }
      },
      _sum: { amount: true }
    })

    const fromSpentAmount = Math.abs(Number(fromSpent._sum.amount || 0))
    const fromEffectiveLimit = Number(fromCategory.monthlyLimit) + Number(fromCategory.rolloverAmount)
    const fromAvailable = fromEffectiveLimit - fromSpentAmount

    // Verificar que hay fondos suficientes en la categoría origen
    if (fromAvailable < amount) {
      return NextResponse.json({ 
        error: 'Insufficient funds in source category',
        available: fromAvailable,
        requested: amount,
        formattedAvailable: new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        }).format(fromAvailable)
      }, { status: 400 })
    }

    // Realizar la transferencia en una transacción
    const transferResult = await prisma.$transaction(async (tx) => {
      // Reducir el rollover de la categoría origen
      const updatedFromCategory = await tx.budgetCategory.update({
        where: { id: fromCategory.id },
        data: {
          rolloverAmount: {
            decrement: amount
          }
        }
      })

      // Aumentar el rollover de la categoría destino
      const updatedToCategory = await tx.budgetCategory.update({
        where: { id: toCategory.id },
        data: {
          rolloverAmount: {
            increment: amount
          }
        }
      })

      // Registrar la transferencia como log (opcional - podríamos crear una tabla de logs)
      // Por ahora, devolvemos la información de la transferencia

      return {
        fromCategory: updatedFromCategory,
        toCategory: updatedToCategory,
        transferAmount: amount,
        reason
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
      transfer: {
        from: {
          categoryId: fromCategoryId,
          categoryName: fromCategory.category.name,
          newRolloverAmount: Number(transferResult.fromCategory.rolloverAmount)
        },
        to: {
          categoryId: toCategoryId,
          categoryName: toCategory.category.name,
          newRolloverAmount: Number(transferResult.toCategory.rolloverAmount)
        },
        amount: amount,
        formattedAmount: new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        }).format(amount),
        reason
      }
    })

  } catch (error) {
    console.error('Error processing transfer:', error)
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    )
  }
}

// Endpoint para obtener opciones de transferencia disponibles
export async function GET(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family) {
      return NextResponse.json({ error: 'No family context found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const budgetId = searchParams.get('budgetId')
    const categoryId = searchParams.get('categoryId') // Categoría que necesita fondos

    if (!budgetId) {
      return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 })
    }

    // Obtener el presupuesto con sus categorías
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

    // Calcular el período actual
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    // Calcular categorías con fondos disponibles
    const availableCategories = await Promise.all(
      budget.categories
        .filter(cat => !categoryId || cat.categoryId !== categoryId) // Excluir la categoría que necesita fondos
        .map(async (budgetCategory) => {
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
          const effectiveLimit = Number(budgetCategory.monthlyLimit) + Number(budgetCategory.rolloverAmount)
          const available = effectiveLimit - spentAmount

          return {
            ...budgetCategory,
            currentSpent: spentAmount,
            effectiveLimit,
            available,
            formattedAvailable: new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP'
            }).format(available)
          }
        })
    )

    // Filtrar solo las categorías con fondos disponibles
    const categoriesWithFunds = availableCategories.filter(cat => cat.available > 0)

    return NextResponse.json({
      budgetId,
      availableCategories: categoriesWithFunds,
      totalAvailable: categoriesWithFunds.reduce((sum, cat) => sum + cat.available, 0)
    })

  } catch (error) {
    console.error('Error getting transfer options:', error)
    return NextResponse.json(
      { error: 'Failed to get transfer options' },
      { status: 500 }
    )
  }
}