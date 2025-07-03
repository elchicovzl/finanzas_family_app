import { NextRequest, NextResponse } from 'next/server'
import { validateFamilyPermission } from '@/lib/family-context'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { familyId: string; invitationId: string } }
) {
  try {
    const familyId = params.familyId
    const invitationId = params.invitationId

    // Validate user has admin permission in this family
    const validation = await validateFamilyPermission(familyId, 'admin')
    if (!validation) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if the invitation exists and belongs to this family
    const invitation = await prisma.familyInvitation.findFirst({
      where: {
        id: invitationId,
        familyId
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Delete the invitation
    await prisma.familyInvitation.delete({
      where: {
        id: invitationId
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}