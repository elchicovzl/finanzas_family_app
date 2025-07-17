import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verify the request is coming from Vercel Cron
    const authHeader = request.headers.get('authorization')
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
    
    if (authHeader !== expectedAuth) {
      console.error('Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    console.log(`Starting monthly budget generation for ${now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`)

    // Get all active templates with auto-generate enabled
    const autoTemplates = await prisma.budgetTemplate.findMany({
      where: {
        isActive: true,
        autoGenerate: true
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    console.log(`Found ${autoTemplates.length} auto-templates to process`)

    let generatedCount = 0
    let skippedCount = 0
    const results = []

    for (const template of autoTemplates) {
      try {
        // Check if budget already exists for this period
        const existingBudget = await prisma.budget.findFirst({
          where: {
            familyId: template.familyId,
            name: template.name,
            startDate: {
              gte: currentMonthStart,
              lte: currentMonthEnd
            }
          }
        })

        if (existingBudget) {
          skippedCount++
          results.push({
            templateId: template.id,
            templateName: template.name,
            familyId: template.familyId,
            status: 'skipped',
            reason: 'Budget already exists'
          })
          continue
        }

        // Buscar presupuesto del mes anterior para calcular rollover
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        const previousBudget = await prisma.budget.findFirst({
          where: {
            familyId: template.familyId,
            name: template.name,
            startDate: {
              gte: previousMonthStart,
              lte: previousMonthEnd
            }
          },
          include: {
            categories: {
              include: {
                category: true
              }
            }
          }
        })

        // Create budget from template with rollover logic
        const budget = await prisma.$transaction(async (tx) => {
          // Create the budget
          const newBudget = await tx.budget.create({
            data: {
              familyId: template.familyId,
              createdByUserId: template.createdByUserId,
              name: template.name,
              totalBudget: template.totalBudget,
              period: template.period,
              startDate: currentMonthStart,
              endDate: currentMonthEnd,
              alertThreshold: template.alertThreshold,
              templateId: template.id
            }
          })

          // Create budget categories with rollover calculation
          const budgetCategories = await Promise.all(
            template.categories.map(async (templateCategory) => {
              let rolloverAmount = 0

              // Calculate rollover if there's a previous budget
              if (previousBudget) {
                const previousCategory = previousBudget.categories.find(
                  cat => cat.categoryId === templateCategory.categoryId
                )

                if (previousCategory && templateCategory.enableRollover) {
                  // Calculate spent amount in previous month
                  const spent = await tx.transaction.aggregate({
                    where: {
                      familyId: template.familyId,
                      categoryId: templateCategory.categoryId,
                      type: 'EXPENSE',
                      date: {
                        gte: previousMonthStart,
                        lt: previousMonthEnd
                      }
                    },
                    _sum: { amount: true }
                  })

                  const spentAmount = Math.abs(Number(spent._sum.amount || 0))
                  const effectiveLimit = Number(previousCategory.monthlyLimit) + Number(previousCategory.rolloverAmount)
                  const remaining = effectiveLimit - spentAmount

                  if (remaining > 0) {
                    rolloverAmount = remaining
                  }
                }
              }

              return tx.budgetCategory.create({
                data: {
                  budgetId: newBudget.id,
                  categoryId: templateCategory.categoryId,
                  monthlyLimit: templateCategory.monthlyLimit,
                  enableRollover: templateCategory.enableRollover,
                  rolloverAmount: rolloverAmount
                }
              })
            })
          )

          // Update template's last generated date
          await tx.budgetTemplate.update({
            where: { id: template.id },
            data: { lastGenerated: now }
          })

          return { ...newBudget, categories: budgetCategories }
        })

        generatedCount++
        results.push({
          templateId: template.id,
          templateName: template.name,
          familyId: template.familyId,
          budgetId: budget.id,
          status: 'generated',
          amount: Number(template.totalBudget),
          categoriesCount: template.categories.length,
          rolloverApplied: previousBudget ? true : false
        })

        console.log(`Generated budget for template ${template.name} (${template.id}) with ${template.categories.length} categories`)

      } catch (error) {
        console.error(`Error processing template ${template.id}:`, error)
        skippedCount++
        results.push({
          templateId: template.id,
          templateName: template.name,
          familyId: template.familyId,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const summary = {
      timestamp: now.toISOString(),
      period: now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
      totalTemplates: autoTemplates.length,
      generatedCount,
      skippedCount,
      results
    }

    console.log('Monthly budget generation completed:', summary)

    return NextResponse.json({
      success: true,
      message: `Monthly budget generation completed for ${summary.period}`,
      ...summary
    })

  } catch (error) {
    console.error('Error in monthly budget generation cron:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate monthly budgets',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}