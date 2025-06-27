import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const budgetSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  monthlyLimit: z.number().positive(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  alertThreshold: z.number().min(0).max(100).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const budgets = await prisma.budget.findMany({
      where: { 
        userId: session.user.id,
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
      orderBy: { createdAt: 'desc' }
    })

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    const nextMonth = new Date(currentMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await prisma.transaction.aggregate({
          where: {
            account: { userId: session.user.id },
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: {
              gte: currentMonth,
              lt: nextMonth
            }
          },
          _sum: { amount: true }
        })

        const spentAmount = Number(spent._sum.amount || 0)
        const limitAmount = Number(budget.monthlyLimit)
        const percentage = limitAmount > 0 ? (spentAmount / limitAmount) * 100 : 0

        return {
          ...budget,
          currentSpent: spentAmount,
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = budgetSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }

    const { categoryId, name, monthlyLimit, period, alertThreshold } = result.data

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const existingBudget = await prisma.budget.findFirst({
      where: {
        userId: session.user.id,
        categoryId,
        startDate: currentMonth,
        isActive: true
      }
    })

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget already exists for this category this month' },
        { status: 400 }
      )
    }

    const budget = await prisma.budget.create({
      data: {
        userId: session.user.id,
        categoryId,
        name,
        monthlyLimit,
        period,
        alertThreshold,
        startDate: currentMonth,
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

    return NextResponse.json(budget, { status: 201 })

  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    )
  }
}