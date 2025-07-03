import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: {
    token: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = params

    // Find the invitation
    const invitation = await prisma.familyInvitation.findUnique({
      where: { token },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true
          }
        },
        invitedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      )
    }

    // Check if invitation has already been accepted
    if (invitation.isAccepted) {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 409 }
      )
    }

    const response = {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      family: invitation.family,
      invitedBy: invitation.invitedBy,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    )
  }
}