import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const budget = await prisma.budget.findFirst({
      where: {
        id,
        familyId: session.user.familyId
      },
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

    // Calculate spending for each category
    const categoriesWithSpending = await Promise.all(
      budget.categories.map(async (budgetCategory) => {
        // Get current month's spending for this category
        const currentMonth = new Date()
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

        const spent = await prisma.transaction.aggregate({
          where: {
            familyId: session.user.familyId,
            categoryId: budgetCategory.categoryId,
            type: 'EXPENSE',
            date: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          _sum: {
            amount: true
          }
        })

        const spentAmount = Math.abs(Number(spent._sum.amount || 0))
        const limitAmount = Number(budgetCategory.monthlyLimit) + Number(budgetCategory.rolloverAmount)
        const remainingAmount = limitAmount - spentAmount
        const percentageUsed = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0
        const isOverBudget = spentAmount > limitAmount
        const isNearLimit = !isOverBudget && percentageUsed >= (budget.alertThreshold || 80)

        return {
          ...budgetCategory,
          currentSpent: spentAmount,
          effectiveLimit: limitAmount,
          remainingBudget: remainingAmount,
          percentageUsed: percentageUsed,
          isOverBudget,
          isNearLimit,
          formattedLimit: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(limitAmount),
          formattedSpent: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(spentAmount),
          formattedRemaining: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(remainingAmount),
          formattedRollover: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(Number(budgetCategory.rolloverAmount))
        }
      })
    )

    // Calculate totals
    const totalSpent = categoriesWithSpending.reduce((sum, cat) => sum + cat.currentSpent, 0)
    const totalLimit = categoriesWithSpending.reduce((sum, cat) => sum + cat.effectiveLimit, 0)
    const totalRemaining = totalLimit - totalSpent
    const totalPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
    const isOverBudget = totalSpent > totalLimit
    const isNearLimit = !isOverBudget && totalPercentage >= (budget.alertThreshold || 80)

    // Format dates
    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

    const budgetWithDetails = {
      ...budget,
      categories: categoriesWithSpending,
      totalSpent,
      totalRemaining,
      totalPercentage,
      isOverBudget,
      isNearLimit,
      formattedTotalBudget: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(totalLimit),
      formattedTotalSpent: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(totalSpent),
      formattedTotalRemaining: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(totalRemaining),
      startDate: startOfMonth.toISOString(),
      endDate: endOfMonth.toISOString()
    }

    return NextResponse.json(budgetWithDetails)
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { name, categories, alertThreshold } = await request.json()

    // Validate input
    if (!name || !categories || categories.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify budget exists and belongs to user's family
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        familyId: session.user.familyId
      }
    })

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Calculate total budget
    const totalBudget = categories.reduce((sum: number, cat: any) => sum + cat.monthlyLimit, 0)

    // Update budget in transaction
    const updatedBudget = await prisma.$transaction(async (tx) => {
      // Delete existing budget categories
      await tx.budgetCategory.deleteMany({
        where: { budgetId: id }
      })

      // Update budget and create new categories
      const budget = await tx.budget.update({
        where: { id },
        data: {
          name,
          totalBudget,
          alertThreshold: alertThreshold || 80,
          categories: {
            create: categories.map((cat: any) => ({
              categoryId: cat.categoryId,
              monthlyLimit: cat.monthlyLimit,
              enableRollover: cat.enableRollover,
              rolloverAmount: 0 // Reset rollover when editing
            }))
          }
        },
        include: {
          categories: {
            include: {
              category: true
            }
          }
        }
      })

      return budget
    })

    return NextResponse.json(updatedBudget)
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Verify budget exists and belongs to user's family
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        familyId: session.user.familyId
      }
    })

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Delete budget (categories will be deleted by cascade)
    await prisma.budget.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Budget deleted successfully' })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}