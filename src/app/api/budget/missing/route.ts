import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFamilyContext } from '@/lib/family-context'

export async function GET(request: NextRequest) {
  try {
    const familyContext = await getFamilyContext()
    if (!familyContext?.family?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get all active templates with auto-generate enabled
    const autoTemplates = await prisma.budgetTemplate.findMany({
      where: {
        familyId: familyContext.family.id,
        isActive: true,
        autoGenerate: true
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                name: true,
                color: true,
                icon: true
              }
            }
          }
        }
      }
    })

    // Check which templates don't have budgets for current month
    const missingBudgets = []
    
    for (const template of autoTemplates) {
      // Check if a budget already exists for this template in the current month
      const existingBudget = await prisma.budget.findFirst({
        where: {
          familyId: familyContext.family.id,
          templateId: template.id,
          startDate: {
            gte: currentMonthStart,
            lte: currentMonthEnd
          }
        }
      })

      if (!existingBudget) {
        // For multi-category templates, we show the template as missing
        // and display the first category as representative
        const firstCategory = template.categories[0]
        if (firstCategory) {
          missingBudgets.push({
            templateId: template.id,
            templateName: template.name,
            monthlyLimit: Number(template.totalBudget),
            category: firstCategory.category,
            formattedLimit: new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP'
            }).format(Number(template.totalBudget))
          })
        }
      }
    }

    return NextResponse.json({
      missingCount: missingBudgets.length,
      currentMonth: now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
      missingBudgets
    })

  } catch (error) {
    console.error('Error checking missing budgets:', error)
    return NextResponse.json(
      { error: 'Failed to check missing budgets' },
      { status: 500 }
    )
  }
}