import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const [
      totalBalance,
      periodIncome,
      periodExpenses,
      transactionsByCategory,
      monthlyTrends
    ] = await Promise.all([
      prisma.bankAccount.aggregate({
        where: { 
          userId: session.user.id,
          isActive: true 
        },
        _sum: { balance: true }
      }),

      prisma.transaction.aggregate({
        where: {
          account: { userId: session.user.id },
          type: 'INCOME',
          date: {
            gte: startDate,
            lte: now
          }
        },
        _sum: { amount: true }
      }),

      prisma.transaction.aggregate({
        where: {
          account: { userId: session.user.id },
          type: 'EXPENSE',
          date: {
            gte: startDate,
            lte: now
          }
        },
        _sum: { amount: true }
      }),

      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          account: { userId: session.user.id },
          type: 'EXPENSE',
          date: {
            gte: startDate,
            lte: now
          }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),

      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', date) as month,
          type,
          SUM(amount) as total
        FROM transactions t
        JOIN bank_accounts ba ON t.account_id = ba.id
        WHERE ba.user_id = ${session.user.id}
        AND date >= ${new Date(now.getFullYear() - 1, now.getMonth(), 1)}
        GROUP BY DATE_TRUNC('month', date), type
        ORDER BY month DESC
      `
    ])

    const categoryDetails = await prisma.category.findMany({
      where: {
        id: {
          in: transactionsByCategory.map(t => t.categoryId).filter(Boolean) as string[]
        }
      }
    })

    const categoryData = transactionsByCategory.map(item => {
      const category = categoryDetails.find(c => c.id === item.categoryId)
      return {
        categoryId: item.categoryId,
        categoryName: category?.name || 'Uncategorized',
        categoryColor: category?.color || '#6B7280',
        categoryIcon: category?.icon || '📝',
        amount: Number(item._sum.amount || 0),
        count: item._count.id,
        formattedAmount: new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        }).format(Number(item._sum.amount || 0))
      }
    })

    const analytics = {
      totalBalance: Number(totalBalance._sum.balance || 0),
      periodIncome: Number(periodIncome._sum.amount || 0),
      periodExpenses: Number(periodExpenses._sum.amount || 0),
      netIncome: Number(periodIncome._sum.amount || 0) - Number(periodExpenses._sum.amount || 0),
      categoryBreakdown: categoryData,
      monthlyTrends: monthlyTrends,
      formattedTotalBalance: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(totalBalance._sum.balance || 0)),
      formattedPeriodIncome: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(periodIncome._sum.amount || 0)),
      formattedPeriodExpenses: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(periodExpenses._sum.amount || 0))
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}