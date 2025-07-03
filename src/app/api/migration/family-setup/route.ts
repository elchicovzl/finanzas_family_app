import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// TEMPORARY MIGRATION ENDPOINT
// This endpoint will create a default family for existing users and migrate their data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has a family
    const existingMembership = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        isActive: true
      }
    })

    if (existingMembership) {
      return NextResponse.json({ 
        message: 'User already has a family',
        familyId: existingMembership.familyId 
      })
    }

    // Create migration in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create a default family for the user
      const family = await tx.family.create({
        data: {
          name: `${user.name || user.email}'s Family`,
          description: 'Default family created during migration',
          createdByUserId: user.id
        }
      })

      // 2. Add user as admin member
      const membership = await tx.familyMember.create({
        data: {
          userId: user.id,
          familyId: family.id,
          role: 'ADMIN',
          isActive: true
        }
      })

      // 3. Migrate existing bank accounts
      const bankAccountsUpdated = await tx.bankAccount.updateMany({
        where: { 
          userId: user.id,
          familyId: { equals: null } // Only update accounts without family
        },
        data: {
          familyId: family.id,
          connectedByUserId: user.id
        }
      })

      // 4. Migrate existing transactions
      const transactionsUpdated = await tx.transaction.updateMany({
        where: { 
          userId: user.id,
          familyId: { equals: null } // Only update transactions without family
        },
        data: {
          familyId: family.id,
          createdByUserId: user.id
        }
      })

      // 5. Migrate existing budgets
      const budgetsUpdated = await tx.budget.updateMany({
        where: { 
          userId: user.id,
          familyId: { equals: null } // Only update budgets without family
        },
        data: {
          familyId: family.id,
          createdByUserId: user.id
        }
      })

      // 6. Migrate existing budget templates
      const templatesUpdated = await tx.budgetTemplate.updateMany({
        where: { 
          userId: user.id,
          familyId: { equals: null } // Only update templates without family
        },
        data: {
          familyId: family.id,
          createdByUserId: user.id
        }
      })

      return {
        family,
        membership,
        bankAccountsUpdated: bankAccountsUpdated.count,
        transactionsUpdated: transactionsUpdated.count,
        budgetsUpdated: budgetsUpdated.count,
        templatesUpdated: templatesUpdated.count
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      family: {
        id: result.family.id,
        name: result.family.name,
        role: 'ADMIN'
      },
      migrated: {
        bankAccounts: result.bankAccountsUpdated,
        transactions: result.transactionsUpdated,
        budgets: result.budgetsUpdated,
        templates: result.templatesUpdated
      }
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}