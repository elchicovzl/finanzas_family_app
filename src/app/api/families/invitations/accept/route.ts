import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required')
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user by email or ID with retry logic for OAuth users
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // If user not found by email, try by ID if available
    if (!user && (session.user as any).id) {
      user = await prisma.user.findUnique({
        where: { id: (session.user as any).id }
      })
    }

    // If user still not found, try a few more times with delay (for OAuth timing issues)
    if (!user) {
      console.log('User not found on first attempt, retrying...')
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms
        user = await prisma.user.findUnique({
          where: { email: session.user.email }
        })
        if (!user && (session.user as any).id) {
          user = await prisma.user.findUnique({
            where: { id: (session.user as any).id }
          })
        }
        if (user) {
          console.log(`User found on retry attempt ${i + 1}`)
          break
        }
      }
    }

    if (!user) {
      console.error('User not found after retries:', { 
        email: session.user.email, 
        sessionUserId: (session.user as any).id 
      })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { token } = acceptInvitationSchema.parse(body)

    // Find the invitation
    const invitation = await prisma.familyInvitation.findUnique({
      where: { token },
      include: {
        family: {
          select: {
            id: true,
            name: true
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

    // Check if the email matches the current user
    if (invitation.email !== user.email) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId: invitation.familyId,
        isActive: true
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this family' },
        { status: 409 }
      )
    }

    // Accept invitation and create membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark invitation as accepted
      await tx.familyInvitation.update({
        where: { id: invitation.id },
        data: {
          isAccepted: true,
          acceptedAt: new Date()
        }
      })

      // Create family membership
      const membership = await tx.familyMember.create({
        data: {
          userId: user.id,
          familyId: invitation.familyId,
          role: invitation.role,
          isActive: true,
          invitedAt: invitation.createdAt,
          invitedByUserId: invitation.invitedByUserId
        }
      })

      return membership
    })

    // Get the family with updated member info
    const family = await prisma.family.findUnique({
      where: { id: invitation.familyId },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    const response = {
      message: 'Successfully joined family',
      family: {
        id: family!.id,
        name: family!.name,
        description: family!.description,
        myRole: result.role,
        joinedAt: result.joinedAt,
        createdAt: family!.createdAt,
        createdBy: family!.createdBy,
        members: family!.members.map(member => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user
        })),
        memberCount: family!.members.length
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}