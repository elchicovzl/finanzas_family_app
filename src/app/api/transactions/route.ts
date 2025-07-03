import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'
import { z } from 'zod'

const transactionSchema = z.object({
  accountId: z.string(),
  amount: z.number(),
  description: z.string().min(1),
  categoryId: z.string().optional(),
  customCategory: z.string().optional(),
  date: z.string().transform((str) => new Date(str)),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
})

export async function GET(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family) {
      return NextResponse.json({ error: 'No family context found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: any = {
      familyId: familyContext.family.id
    }

    if (category) {
      where.categoryId = category
    }

    if (type) {
      where.type = type
    }

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: {
            select: {
              institutionName: true,
              accountNumber: true
            }
          },
          category: {
            select: {
              name: true,
              color: true,
              icon: true
            }
          },
          createdBy: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ])

    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      formattedAmount: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
      }).format(Number(transaction.amount)),
      formattedDate: new Intl.DateTimeFormat('es-CO').format(transaction.date),
      account: transaction.account || { // Para transacciones manuales sin cuenta
        institutionName: 'Cash',
        accountNumber: 'Manual Entry'
      }
    }))

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family) {
      return NextResponse.json({ error: 'No family context found' }, { status: 401 })
    }

    // Check write permission
    if (familyContext.family.role === 'VIEWER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const result = transactionSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }

    const account = await prisma.bankAccount.findFirst({
      where: { 
        id: result.data.accountId,
        familyId: familyContext.family.id
      }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...result.data,
        familyId: familyContext.family.id,
        createdByUserId: familyContext.user.id,
        source: 'MANUAL'
      },
      include: {
        account: {
          select: {
            institutionName: true,
            accountNumber: true
          }
        },
        category: {
          select: {
            name: true,
            color: true,
            icon: true
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(transaction, { status: 201 })

  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}