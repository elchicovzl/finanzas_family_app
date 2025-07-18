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
    const bankAccountsBalance = bankAccounts.reduce((sum, account) => sum + Number(account.balance), 0)
    
    // Calculate balance from manual transactions (cash)
    // Get all manual transactions for the family
    const manualTransactions = await prisma.transaction.findMany({
      where: {
        familyId: familyContext.family.id,
        source: 'MANUAL', // Only manual transactions (cash)
        accountId: null   // Manual transactions don't have accountId
      }
    })
    
    // Calculate net balance from manual transactions
    const manualBalance = manualTransactions.reduce((sum, transaction) => {
      const amount = Number(transaction.amount)
      return transaction.type === 'INCOME' ? sum + amount : sum - amount
    }, 0)
    
    // Total balance = bank accounts balance + manual transactions balance
    const totalBalance = bankAccountsBalance + manualBalance

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
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const currentMonthExpenses = currentMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const lastMonthIncome = lastMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const lastMonthExpenses = lastMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

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
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    // Calculate budget usage for each category in each budget
    const budgetOverview = []
    for (const budget of currentBudgets) {
      for (const budgetCategory of budget.categories) {
        const budgetTransactions = currentMonthTransactions.filter(
          t => t.categoryId === budgetCategory.categoryId && t.type === 'EXPENSE'
        )
        
        const currentSpent = budgetTransactions.reduce(
          (sum, t) => sum + Number(t.amount), 0
        )
        
        const effectiveLimit = Number(budgetCategory.monthlyLimit) + Number(budgetCategory.rolloverAmount)
        const percentageUsed = effectiveLimit > 0 ? 
          (currentSpent / effectiveLimit) * 100 : 0

        budgetOverview.push({
          categoryName: budgetCategory.category.name,
          categoryIcon: budgetCategory.category.icon,
          categoryColor: budgetCategory.category.color,
          percentageUsed: Math.round(percentageUsed),
          currentSpent,
          monthlyLimit: effectiveLimit,
          isOverBudget: percentageUsed > 100,
          isNearLimit: percentageUsed >= 80 && percentageUsed <= 100
        })
      }
    }

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