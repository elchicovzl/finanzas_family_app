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

    const accounts = await prisma.bankAccount.findMany({
      where: { 
        userId: session.user.id,
        isActive: true 
      },
      include: {
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const accountsWithStats = accounts.map(account => ({
      ...account,
      transactionCount: account._count.transactions,
      formattedBalance: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: account.currency
      }).format(Number(account.balance))
    }))

    return NextResponse.json(accountsWithStats)

  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}