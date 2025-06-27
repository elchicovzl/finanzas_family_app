import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { BelvoService } from '@/lib/belvo'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const linkSchema = z.object({
  institution: z.string(),
  username: z.string(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    const body = await request.json()
    const result = linkSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }

    const { institution, username, password } = result.data

    // For demo purposes, create mock data since Belvo sandbox has limitations
    console.log('Creating demo account for:', username, 'at', institution)

    // Generate mock Belvo IDs
    const mockLinkId = `demo_link_${Date.now()}`
    const mockAccountId = `demo_account_${Date.now()}`

    // Create mock account in database
    const createdAccount = await prisma.bankAccount.create({
      data: {
        userId,
        belvoAccountId: mockAccountId,
        belvoLinkId: mockLinkId,
        institutionName: 'Bancolombia',
        accountNumber: '1234567890',
        accountType: 'checking',
        balance: 2500000, // $2,500,000 COP
        currency: 'COP',
        lastSyncAt: new Date(),
      },
    })

    // Create some mock transactions
    const mockTransactions = [
      {
        description: 'Pago de nómina',
        amount: 3000000,
        type: 'INCOME' as const,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        description: 'Supermercado Éxito',
        amount: -150000,
        type: 'EXPENSE' as const,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        description: 'Transferencia bancaria',
        amount: -500000,
        type: 'EXPENSE' as const,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        description: 'Gasolina Terpel',
        amount: -80000,
        type: 'EXPENSE' as const,
        date: new Date(),
      },
    ]

    await Promise.all(
      mockTransactions.map(async (transaction) => {
        return await prisma.transaction.create({
          data: {
            accountId: createdAccount.id,
            userId,
            belvoTransactionId: `demo_tx_${Date.now()}_${Math.random()}`,
            amount: transaction.amount,
            description: transaction.description,
            date: transaction.date,
            type: transaction.type,
            source: 'BELVO',
            merchantInfo: transaction.description.includes('Éxito') ? 'Éxito' : 
                         transaction.description.includes('Terpel') ? 'Terpel' : null,
          },
        })
      })
    )

    return NextResponse.json({
      success: true,
      message: 'Demo account created successfully',
      link: {
        id: mockLinkId,
        institution: 'Bancolombia',
        status: 'valid',
      },
      accounts: 1,
      transactions: mockTransactions.length,
    })

  } catch (error) {
    console.error('Belvo link creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create bank connection' },
      { status: 500 }
    )
  }
}