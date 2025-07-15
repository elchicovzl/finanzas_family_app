import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const familyContext = await getFamilyContext()
    
    if (!familyContext?.family) {
      return NextResponse.json({ error: 'No family context found' }, { status: 401 })
    }

    const transactionId = params.id

    // First, get the transaction to check permissions
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        familyId: familyContext.family.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Check permissions: user must be the creator OR be an admin
    const isCreator = transaction.createdByUserId === familyContext.user.id
    const isAdmin = familyContext.family.role === 'ADMIN'

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only delete transactions you created or if you are an admin' }, 
        { status: 403 }
      )
    }

    // Check if this is an automatic transaction from Belvo
    if (transaction.source === 'BELVO') {
      return NextResponse.json(
        { error: 'Cannot delete automatic transactions from bank imports' }, 
        { status: 403 }
      )
    }

    // Delete the transaction
    await prisma.transaction.delete({
      where: { id: transactionId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Transaction deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}