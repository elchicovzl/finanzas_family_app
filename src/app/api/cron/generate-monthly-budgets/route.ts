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
            categoryId: template.categoryId,
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

        // Create budget from template
        const budget = await prisma.budget.create({
          data: {
            familyId: template.familyId,
            createdByUserId: template.createdByUserId,
            categoryId: template.categoryId,
            name: template.name,
            monthlyLimit: template.monthlyLimit,
            period: template.period,
            startDate: currentMonthStart,
            endDate: currentMonthEnd,
            alertThreshold: template.alertThreshold,
            templateId: template.id
          }
        })

        // Update template's last generated date
        await prisma.budgetTemplate.update({
          where: { id: template.id },
          data: { lastGenerated: now }
        })

        generatedCount++
        results.push({
          templateId: template.id,
          templateName: template.name,
          familyId: template.familyId,
          budgetId: budget.id,
          status: 'generated',
          amount: Number(template.monthlyLimit)
        })

        console.log(`Generated budget for template ${template.name} (${template.id})`)

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