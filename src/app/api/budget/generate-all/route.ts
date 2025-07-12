import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { month, year } = body

    // Get user's current family
    const userFamilyMember = await prisma.familyMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        family: true
      }
    })

    if (!userFamilyMember) {
      return NextResponse.json(
        { error: 'User is not part of any active family' },
        { status: 403 }
      )
    }

    // Default to current month if not provided
    const targetDate = month && year 
      ? new Date(year, month - 1, 1)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)

    // Get all active templates with auto-generate enabled
    const autoTemplates = await prisma.budgetTemplate.findMany({
      where: {
        familyId: userFamilyMember.familyId,
        isActive: true,
        autoGenerate: true
      }
    })

    const generatedBudgets = []
    const skippedTemplates = []

    for (const template of autoTemplates) {
      // Check if budget already exists for this period
      const existingBudget = await prisma.budget.findFirst({
        where: {
          familyId: userFamilyMember.familyId,
          categoryId: template.categoryId,
          startDate: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      if (existingBudget) {
        skippedTemplates.push({
          templateId: template.id,
          templateName: template.name,
          reason: 'Budget already exists for this period'
        })
        continue
      }

      try {
        // Create budget from template
        const budget = await prisma.budget.create({
          data: {
            familyId: userFamilyMember.familyId,
            categoryId: template.categoryId,
            name: template.name,
            monthlyLimit: template.monthlyLimit,
            period: template.period,
            startDate: startDate,
            endDate: endDate,
            alertThreshold: template.alertThreshold,
            templateId: template.id,
            createdByUserId: session.user.id
          },
          include: {
            category: {
              select: {
                name: true,
                color: true,
                icon: true
              }
            }
          }
        })

        // Update template's last generated date
        await prisma.budgetTemplate.update({
          where: { id: template.id },
          data: { lastGenerated: new Date() }
        })

        generatedBudgets.push({
          id: budget.id,
          name: budget.name,
          monthlyLimit: Number(budget.monthlyLimit),
          category: budget.category,
          formattedLimit: new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
          }).format(Number(budget.monthlyLimit))
        })

      } catch (error) {
        console.error(`Error generating budget for template ${template.id}:`, error)
        skippedTemplates.push({
          templateId: template.id,
          templateName: template.name,
          reason: 'Error during generation'
        })
      }
    }

    return NextResponse.json({
      success: true,
      generatedCount: generatedBudgets.length,
      skippedCount: skippedTemplates.length,
      period: targetDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
      generatedBudgets,
      skippedTemplates
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating all budgets:', error)
    return NextResponse.json(
      { error: 'Failed to generate budgets' },
      { status: 500 }
    )
  }
}