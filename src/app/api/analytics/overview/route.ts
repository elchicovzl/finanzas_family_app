import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'

export async function GET() {
  try {
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family) {
      return NextResponse.json({ error: 'No family context found' }, { status: 401 })
    }

    // Get current month date range
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Get last month date range for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get all family's bank accounts
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { familyId: familyContext.family.id }
    })

    // Calculate total balance from bank accounts
    const totalBalance = bankAccounts.reduce((sum, account) => sum + Number(account.balance), 0)

    // Get current month transactions
    const currentMonthTransactions = await prisma.transaction.findMany({
      where: {
        familyId: familyContext.family.id,
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      include: {
        category: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Get last month transactions for comparison
    const lastMonthTransactions = await prisma.transaction.findMany({
      where: {
        familyId: familyContext.family.id,
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }
    })

    // Calculate monthly income and expenses
    const currentMonthIncome = currentMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    const currentMonthExpenses = currentMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    const lastMonthIncome = lastMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    const lastMonthExpenses = lastMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    // Calculate percentage changes
    const incomeChange = lastMonthIncome > 0 ? 
      ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0

    const expenseChange = lastMonthExpenses > 0 ? 
      ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0

    // Get recent transactions (last 5)
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        familyId: familyContext.family.id
      },
      include: {
        category: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get budget overview data
    const currentBudgets = await prisma.budget.findMany({
      where: {
        familyId: familyContext.family.id,
        startDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      include: {
        category: true
      }
    })

    // Calculate budget usage
    const budgetOverview = await Promise.all(
      currentBudgets.map(async (budget) => {
        const budgetTransactions = currentMonthTransactions.filter(
          t => t.categoryId === budget.categoryId && t.type === 'EXPENSE'
        )
        
        const currentSpent = budgetTransactions.reduce(
          (sum, t) => sum + Math.abs(Number(t.amount)), 0
        )
        
        const percentageUsed = Number(budget.monthlyLimit) > 0 ? 
          (currentSpent / Number(budget.monthlyLimit)) * 100 : 0

        return {
          categoryName: budget.category.name,
          categoryIcon: budget.category.icon,
          categoryColor: budget.category.color,
          percentageUsed: Math.round(percentageUsed),
          currentSpent,
          monthlyLimit: Number(budget.monthlyLimit),
          isOverBudget: percentageUsed > 100,
          isNearLimit: percentageUsed >= 80 && percentageUsed <= 100
        }
      })
    )

    // Format recent transactions
    const formattedRecentTransactions = recentTransactions.map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amount: Number(transaction.amount),
      date: transaction.createdAt.toISOString().split('T')[0],
      category: transaction.category?.name || transaction.customCategory || 'Uncategorized',
      type: transaction.type,
      createdBy: transaction.createdBy
    }))

    const response = {
      totalBalance,
      currentMonthIncome,
      currentMonthExpenses,
      incomeChange: Math.round(incomeChange * 10) / 10, // Round to 1 decimal
      expenseChange: Math.round(expenseChange * 10) / 10,
      recentTransactions: formattedRecentTransactions,
      budgetOverview: budgetOverview.slice(0, 3), // Show top 3 budgets
      connectedAccounts: bankAccounts.length,
      hasConnectedAccounts: bankAccounts.length > 0
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching dashboard overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard overview' },
      { status: 500 }
    )
  }
}