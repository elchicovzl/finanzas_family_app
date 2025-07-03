import { NextRequest, NextResponse } from 'next/server'
import { validateFamilyPermission } from '@/lib/family-context'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'])
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { familyId: string; memberId: string } }
) {
  try {
    const familyId = params.familyId
    const memberId = params.memberId

    // Validate user has admin permission in this family
    const validation = await validateFamilyPermission(familyId, 'admin')
    if (!validation) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateMemberSchema.parse(body)

    // Check if the member exists and is active
    const member = await prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyId,
        isActive: true
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent user from changing their own role
    if (member.userId === validation.user.id) {
      return NextResponse.json({ 
        error: 'You cannot change your own role' 
      }, { status: 400 })
    }

    // Update the member role
    const updatedMember = await prisma.familyMember.update({
      where: {
        id: memberId
      },
      data: {
        role: validatedData.role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(updatedMember)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating family member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { familyId: string; memberId: string } }
) {
  try {
    const familyId = params.familyId
    const memberId = params.memberId

    // Validate user has admin permission in this family
    const validation = await validateFamilyPermission(familyId, 'admin')
    if (!validation) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if the member exists and is active
    const member = await prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyId,
        isActive: true
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent user from removing themselves
    if (member.userId === validation.user.id) {
      return NextResponse.json({ 
        error: 'You cannot remove yourself from the family' 
      }, { status: 400 })
    }

    // Check if this is the last admin
    const adminCount = await prisma.familyMember.count({
      where: {
        familyId,
        role: 'ADMIN',
        isActive: true
      }
    })

    if (member.role === 'ADMIN' && adminCount === 1) {
      return NextResponse.json({ 
        error: 'Cannot remove the last admin from the family' 
      }, { status: 400 })
    }

    // Deactivate the member instead of deleting
    await prisma.familyMember.update({
      where: {
        id: memberId
      },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error removing family member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}