import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createFamilySchema = z.object({
  name: z.string().min(1, 'Family name is required').max(100, 'Family name is too long'),
  description: z.string().optional()
})

export async function GET() {
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

    // Get user's families
    const families = await prisma.familyMember.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        family: {
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
        }
      }
    })

    const formattedFamilies = families.map(membership => ({
      id: membership.family.id,
      name: membership.family.name,
      description: membership.family.description,
      myRole: membership.role,
      joinedAt: membership.joinedAt,
      createdAt: membership.family.createdAt,
      createdBy: membership.family.createdBy,
      members: membership.family.members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user
      })),
      memberCount: membership.family.members.length
    }))

    return NextResponse.json(formattedFamilies)

  } catch (error) {
    console.error('Error fetching families:', error)
    return NextResponse.json(
      { error: 'Failed to fetch families' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = createFamilySchema.parse(body)

    // Create family and add creator as admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the family
      const family = await tx.family.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          createdByUserId: user.id
        }
      })

      // Add creator as admin member
      const membership = await tx.familyMember.create({
        data: {
          userId: user.id,
          familyId: family.id,
          role: 'ADMIN',
          isActive: true
        }
      })

      return { family, membership }
    })

    // Return the created family with member info
    const familyWithMembers = await prisma.family.findUnique({
      where: { id: result.family.id },
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

    return NextResponse.json({
      id: familyWithMembers!.id,
      name: familyWithMembers!.name,
      description: familyWithMembers!.description,
      myRole: 'ADMIN',
      joinedAt: result.membership.joinedAt,
      createdAt: familyWithMembers!.createdAt,
      createdBy: familyWithMembers!.createdBy,
      members: familyWithMembers!.members.map(member => ({
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user
      })),
      memberCount: familyWithMembers!.members.length
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating family:', error)
    return NextResponse.json(
      { error: 'Failed to create family' },
      { status: 500 }
    )
  }
}