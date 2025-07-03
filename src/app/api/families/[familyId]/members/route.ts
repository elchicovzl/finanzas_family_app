import { NextRequest, NextResponse } from 'next/server'
import { validateFamilyPermission } from '@/lib/family-context'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { familyId: string } }
) {
  try {
    const familyId = params.familyId

    // Validate user has read permission in this family
    const validation = await validateFamilyPermission(familyId, 'read')
    if (!validation) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all active family members
    const members = await prisma.familyMember.findMany({
      where: {
        familyId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // Admins first
        { joinedAt: 'asc' }
      ]
    })

    // Get pending invitations (only if user is admin)
    let invitations = []
    if (validation.membership.role === 'ADMIN') {
      invitations = await prisma.familyInvitation.findMany({
        where: {
          familyId,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          invitedBy: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json({
      members,
      invitations
    })

  } catch (error) {
    console.error('Error fetching family members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}