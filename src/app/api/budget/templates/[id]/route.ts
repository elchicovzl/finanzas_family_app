import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const template = await prisma.budgetTemplate.findFirst({
      where: {
        id,
        familyId: session.user.familyId
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { name, categories, alertThreshold, autoGenerate } = await request.json()

    // Validate input
    if (!name || !categories || categories.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify template exists and belongs to user's family
    const existingTemplate = await prisma.budgetTemplate.findFirst({
      where: {
        id,
        familyId: session.user.familyId
      }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Calculate total budget
    const totalBudget = categories.reduce((sum: number, cat: any) => sum + cat.monthlyLimit, 0)

    // Update template in transaction
    const updatedTemplate = await prisma.$transaction(async (tx) => {
      // Delete existing template categories
      await tx.budgetTemplateCategory.deleteMany({
        where: { templateId: id }
      })

      // Update template and create new categories
      const template = await tx.budgetTemplate.update({
        where: { id },
        data: {
          name,
          totalBudget,
          alertThreshold: alertThreshold || 80,
          autoGenerate: autoGenerate ?? true,
          categories: {
            create: categories.map((cat: any) => ({
              categoryId: cat.categoryId,
              monthlyLimit: cat.monthlyLimit,
              enableRollover: cat.enableRollover
            }))
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

      return template
    })

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Verify template exists and belongs to user's family
    const existingTemplate = await prisma.budgetTemplate.findFirst({
      where: {
        id,
        familyId: session.user.familyId
      }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Delete template (categories will be deleted by cascade)
    await prisma.budgetTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}