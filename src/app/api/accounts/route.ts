import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get family context to ensure proper access control
    const familyContext = await getFamilyContext()
    if (!familyContext || !familyContext.family) {
      return NextResponse.json({ error: 'Family context required' }, { status: 400 })
    }

    const accounts = await prisma.bankAccount.findMany({
      where: { 
        familyId: familyContext.family.id,
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