import { NextRequest, NextResponse } from 'next/server'
import { BelvoService } from '@/lib/belvo'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { webhook_type, data } = body

    if (!webhook_type || !data) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    switch (webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionWebhook(data)
        break
      case 'ACCOUNTS':
        await handleAccountWebhook(data)
        break
      default:
        console.log('Unhandled webhook type:', webhook_type)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleTransactionWebhook(data: any) {
  try {
    const { link_id, account_id, transactions } = data

    const bankAccount = await prisma.bankAccount.findFirst({
      where: { belvoLinkId: link_id }
    })

    if (!bankAccount) {
      console.error('Bank account not found for link:', link_id)
      return
    }

    for (const transaction of transactions) {
      const existingTransaction = await prisma.transaction.findUnique({
        where: { belvoTransactionId: transaction.id }
      })

      if (!existingTransaction) {
        await prisma.transaction.create({
          data: {
            accountId: bankAccount.id,
            belvoTransactionId: transaction.id,
            amount: transaction.amount,
            description: transaction.description,
            date: new Date(transaction.date),
            type: transaction.type === 'INFLOW' ? 'INCOME' : 'EXPENSE',
            merchantInfo: transaction.merchant?.name,
          },
        })
      }
    }

    await prisma.bankAccount.update({
      where: { id: bankAccount.id },
      data: { lastSyncAt: new Date() }
    })

  } catch (error) {
    console.error('Transaction webhook error:', error)
  }
}

async function handleAccountWebhook(data: any) {
  try {
    const { link_id, accounts } = data

    for (const account of accounts) {
      await prisma.bankAccount.updateMany({
        where: { 
          belvoLinkId: link_id,
          belvoAccountId: account.id 
        },
        data: {
          balance: account.balance.current,
          lastSyncAt: new Date()
        }
      })
    }

  } catch (error) {
    console.error('Account webhook error:', error)
  }
}