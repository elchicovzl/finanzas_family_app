import { NextRequest, NextResponse } from 'next/server'
import { BelvoService } from '@/lib/belvo'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('link_id')
    const userId = searchParams.get('user_id')
    const status = searchParams.get('status')

    if (!linkId || !userId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/accounts?error=missing_parameters`
      )
    }

    if (status !== 'success') {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/accounts?error=connection_failed`
      )
    }

    // Fetch accounts from Belvo
    const accounts = await BelvoService.getAccounts(linkId)

    // Save accounts to database
    const createdAccounts = await Promise.all(
      accounts.map(async (account) => {
        return await prisma.bankAccount.create({
          data: {
            userId,
            belvoAccountId: account.id,
            belvoLinkId: linkId,
            institutionName: account.institution,
            accountNumber: account.number,
            accountType: account.type,
            balance: account.balance.current,
            currency: account.currency,
            lastSyncAt: new Date(),
          },
        })
      })
    )

    // Fetch recent transactions
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const transactions = await BelvoService.getTransactions(
      linkId,
      thirtyDaysAgo.toISOString().split('T')[0],
      now.toISOString().split('T')[0]
    )

    // Save transactions to database
    await Promise.all(
      transactions.map(async (transaction) => {
        const accountId = createdAccounts.find(
          acc => acc.belvoAccountId === transaction.account
        )?.id

        if (accountId) {
          return await prisma.transaction.create({
            data: {
              accountId,
              belvoTransactionId: transaction.id,
              amount: transaction.amount,
              description: transaction.description,
              date: new Date(transaction.date),
              type: transaction.type === 'INFLOW' ? 'INCOME' : 'EXPENSE',
              merchantInfo: transaction.merchant?.name,
            },
          })
        }
      })
    )

    // Redirect to accounts page with success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/accounts?success=connection_successful&accounts=${createdAccounts.length}&transactions=${transactions.length}`
    )

  } catch (error) {
    console.error('Belvo callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/accounts?error=processing_failed`
    )
  }
}