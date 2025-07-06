import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendInvitationEmail } from '@/lib/email'
import { z } from 'zod'
import crypto from 'crypto'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER')
})

interface RouteParams {
  params: Promise<{
    familyId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { familyId } = await params
    const body = await request.json()
    const validatedData = inviteSchema.parse(body)

    // Check if user is an admin of this family
    const membership = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        role: 'ADMIN',
        isActive: true
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be an admin to invite members' },
        { status: 403 }
      )
    }

    // Check if family exists
    const family = await prisma.family.findUnique({
      where: { id: familyId }
    })

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        family: {
          id: familyId
        },
        user: {
          email: validatedData.email
        },
        isActive: true
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this family' },
        { status: 409 }
      )
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.familyInvitation.findFirst({
      where: {
        familyId,
        email: validatedData.email,
        isAccepted: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 409 }
      )
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create invitation
    const invitation = await prisma.familyInvitation.create({
      data: {
        familyId,
        email: validatedData.email,
        role: validatedData.role,
        invitedByUserId: user.id,
        token,
        expiresAt
      },
      include: {
        family: {
          select: {
            name: true
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

    // Send email invitation
    try {
      await sendInvitationEmail({
        to: invitation.email,
        familyName: invitation.family.name,
        invitedByName: invitation.invitedBy.name || invitation.invitedBy.email,
        invitationUrl: `${process.env.NEXTAUTH_URL}/invite/${token}`,
        expiresAt: invitation.expiresAt
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)
      // Continue with the process even if email fails
      // The invitation is still created and can be shared manually
    }
    
    const invitationResponse = {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      familyName: invitation.family.name,
      invitedBy: invitation.invitedBy,
      expiresAt: invitation.expiresAt,
      invitationUrl: `${process.env.NEXTAUTH_URL}/invite/${token}`,
      createdAt: invitation.createdAt
    }

    return NextResponse.json(invitationResponse, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { familyId } = await params

    // Check if user is an admin of this family
    const membership = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        role: 'ADMIN',
        isActive: true
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be an admin to view invitations' },
        { status: 403 }
      )
    }

    // Get pending invitations
    const invitations = await prisma.familyInvitation.findMany({
      where: {
        familyId,
        isAccepted: false,
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

    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt
    }))

    return NextResponse.json(formattedInvitations)

  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}