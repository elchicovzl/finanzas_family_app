import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const manualTransactionSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' })
  }),
  categoryId: z.string().optional(),
  customCategory: z.string().optional(),
  date: z.string().datetime(),
  reference: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database. Please log out and log back in.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const result = manualTransactionSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }

    const { 
      amount, 
      description, 
      type, 
      categoryId, 
      customCategory, 
      date, 
      reference, 
      tags, 
      isRecurring 
    } = result.data

    // Validate that either categoryId or customCategory is provided
    if (!categoryId && !customCategory) {
      return NextResponse.json(
        { error: 'Either categoryId or customCategory must be provided' },
        { status: 400 }
      )
    }

    // If categoryId is provided, verify it exists
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      })
      
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
    }

    // Convert amount to negative for expenses
    const finalAmount = type === 'EXPENSE' ? -Math.abs(amount) : Math.abs(amount)

    // Create the manual transaction
    const transactionData: any = {
      userId,
      amount: finalAmount,
      description,
      type,
      source: 'MANUAL',
      date: new Date(date),
      tags,
      isRecurring,
      // accountId is intentionally null for manual transactions (cash transactions)
    }

    // Only add categoryId if it's provided
    if (categoryId) {
      transactionData.categoryId = categoryId
    }

    // Only add customCategory if it's provided
    if (customCategory) {
      transactionData.customCategory = customCategory
    }

    // Only add reference if it's provided
    if (reference) {
      transactionData.reference = reference
    }

    const transaction = await prisma.transaction.create({
      data: transactionData,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Format the response
    const formattedTransaction = {
      id: transaction.id,
      amount: transaction.amount,
      formattedAmount: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(transaction.amount)),
      description: transaction.description,
      date: transaction.date.toISOString(),
      formattedDate: transaction.date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      type: transaction.type,
      source: transaction.source,
      category: transaction.category ? {
        id: transaction.category.id,
        name: transaction.category.name,
        color: transaction.category.color,
        icon: transaction.category.icon,
      } : null,
      customCategory: transaction.customCategory,
      reference: transaction.reference,
      tags: transaction.tags,
      isRecurring: transaction.isRecurring,
      createdAt: transaction.createdAt.toISOString(),
    }

    return NextResponse.json({
      success: true,
      transaction: formattedTransaction,
      message: 'Manual transaction created successfully'
    })

  } catch (error) {
    console.error('Manual transaction creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create manual transaction' },
      { status: 500 }
    )
  }
}