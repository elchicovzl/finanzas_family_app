import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'
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
            familyId: familyContext.family.id,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: {
              gte: currentMonth,
              lt: nextMonth
            }
          },
          _sum: { amount: true }
        })

        const spentAmount = Math.abs(Number(spent._sum.amount || 0))
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
        familyId: familyContext.family.id,
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
        familyId: familyContext.family.id,
        createdByUserId: familyContext.user.id,
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