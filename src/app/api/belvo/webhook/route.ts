import { NextRequest, NextResponse } from 'next/server'
import { BelvoService } from '@/lib/belvo'
import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { rateLimiters } from '@/lib/rate-limiter'

function verifyBelvoSignature(payload: string, signature: string): boolean {
  if (!process.env.BELVO_WEBHOOK_SECRET) {
    console.warn('BELVO_WEBHOOK_SECRET not configured - webhook signature verification disabled')
    return true // Allow in development, but log warning
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.BELVO_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting for webhook endpoints
  const rateLimitResult = await rateLimiters.webhook(request)
  if (!rateLimitResult.success) {
    console.warn('Webhook rate limit exceeded')
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString()
        }
      }
    )
  }

  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    
    // Verify webhook signature for security
    const signature = request.headers.get('x-belvo-signature')
    if (!signature) {
      console.error('Missing Belvo signature header')
      return NextResponse.json({ error: 'Unauthorized - missing signature' }, { status: 401 })
    }

    if (!verifyBelvoSignature(rawBody, signature)) {
      console.error('Invalid Belvo signature')
      return NextResponse.json({ error: 'Unauthorized - invalid signature' }, { status: 401 })
    }

    // Parse body after verification
    const body = JSON.parse(rawBody)
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

    // BankAccount already has familyId directly, no need to look up family membership

    for (const transaction of transactions) {
      const existingTransaction = await prisma.transaction.findUnique({
        where: { belvoTransactionId: transaction.id }
      })

      if (!existingTransaction) {
        await prisma.transaction.create({
          data: {
            accountId: bankAccount.id,
            familyId: bankAccount.familyId,
            createdByUserId: bankAccount.connectedByUserId,
            belvoTransactionId: transaction.id,
            amount: transaction.amount,
            description: transaction.description,
            date: new Date(transaction.date),
            type: transaction.type === 'INFLOW' ? 'INCOME' : 'EXPENSE',
            merchantInfo: transaction.merchant?.name,
            source: 'BELVO'
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