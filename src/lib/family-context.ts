import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface FamilyContext {
  user: {
    id: string
    email: string
    name: string | null
  }
  family: {
    id: string
    name: string
    role: 'ADMIN' | 'MEMBER' | 'VIEWER'
  } | null
}

/**
 * Gets the family context for the current authenticated user
 * Returns the user and their primary family (first active family)
 * Automatically creates a default family if user doesn't have one
 */
export async function getFamilyContext(): Promise<FamilyContext | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return null
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (!user) {
      return null
    }

    // Get user's primary family (first active membership)
    let primaryMembership = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        isActive: true
      },
      include: {
        family: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc' // Use the oldest membership as primary
      }
    })

    // If no family membership exists, create a default family
    if (!primaryMembership) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Create a default family for the user
          const family = await tx.family.create({
            data: {
              name: `${user.name || user.email}'s Family`,
              description: 'Default family created automatically',
              createdByUserId: user.id
            }
          })

          // Add user as admin member
          const membership = await tx.familyMember.create({
            data: {
              userId: user.id,
              familyId: family.id,
              role: 'ADMIN',
              isActive: true
            },
            include: {
              family: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          })

          return membership
        })

        primaryMembership = result
        console.log(`Auto-created default family for user ${user.email}`)
      } catch (error) {
        console.error('Error creating default family:', error)
        return null
      }
    }

    const familyContext: FamilyContext = {
      user,
      family: primaryMembership ? {
        id: primaryMembership.family.id,
        name: primaryMembership.family.name,
        role: primaryMembership.role
      } : null
    }

    return familyContext

  } catch (error) {
    console.error('Error getting family context:', error)
    return null
  }
}

/**
 * Checks if user has specific permission in their family
 */
export function hasPermission(role: string, requiredPermission: 'read' | 'write' | 'admin'): boolean {
  const permissions = {
    'ADMIN': ['read', 'write', 'admin'],
    'MEMBER': ['read', 'write'],
    'VIEWER': ['read']
  }

  return permissions[role as keyof typeof permissions]?.includes(requiredPermission) || false
}

/**
 * Validates that user has required permission in a specific family
 */
export async function validateFamilyPermission(
  familyId: string, 
  requiredPermission: 'read' | 'write' | 'admin'
): Promise<{ user: any; family: any; membership: any } | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return null
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return null
    }

    // Get user's membership in the specific family
    const membership = await prisma.familyMember.findFirst({
      where: {
        userId: user.id,
        familyId,
        isActive: true
      },
      include: {
        family: true
      }
    })

    if (!membership) {
      return null
    }

    // Check if user has required permission
    if (!hasPermission(membership.role, requiredPermission)) {
      return null
    }

    return {
      user,
      family: membership.family,
      membership
    }

  } catch (error) {
    console.error('Error validating family permission:', error)
    return null
  }
}