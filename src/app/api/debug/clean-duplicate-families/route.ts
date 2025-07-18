import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get all users with their family memberships
    const users = await prisma.user.findMany({
      include: {
        familyMemberships: {
          where: {
            isActive: true
          },
          include: {
            family: {
              select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                createdByUserId: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        }
      }
    })

    const report = {
      totalUsers: users.length,
      usersWithMultipleFamilies: 0,
      duplicateFamilies: [] as any[],
      cleanupActions: [] as any[]
    }

    // Find users with multiple families
    for (const user of users) {
      if (user.familyMemberships.length > 1) {
        report.usersWithMultipleFamilies++
        
        // Group families by similar names (likely duplicates)
        const familiesByName = new Map<string, any[]>()
        
        for (const membership of user.familyMemberships) {
          const family = membership.family
          const baseName = family.name.replace(/\s+Family$/, '').toLowerCase()
          
          if (!familiesByName.has(baseName)) {
            familiesByName.set(baseName, [])
          }
          familiesByName.get(baseName)!.push({
            ...membership,
            family
          })
        }

        // Find potential duplicates
        for (const [baseName, families] of familiesByName) {
          if (families.length > 1) {
            // Sort by creation date to keep the oldest one
            families.sort((a, b) => new Date(a.family.createdAt).getTime() - new Date(b.family.createdAt).getTime())
            
            const keepFamily = families[0]
            const duplicates = families.slice(1)
            
            report.duplicateFamilies.push({
              userId: user.id,
              userEmail: user.email,
              userName: user.name,
              baseName,
              keepFamily: {
                id: keepFamily.family.id,
                name: keepFamily.family.name,
                createdAt: keepFamily.family.createdAt
              },
              duplicates: duplicates.map(d => ({
                id: d.family.id,
                name: d.family.name,
                createdAt: d.family.createdAt
              }))
            })
          }
        }
      }
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error analyzing duplicate families:', error)
    return NextResponse.json(
      { error: 'Failed to analyze duplicate families' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { dryRun = true } = await request.json()
    
    // Get all users with their family memberships
    const users = await prisma.user.findMany({
      include: {
        familyMemberships: {
          where: {
            isActive: true
          },
          include: {
            family: {
              select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                createdByUserId: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        }
      }
    })

    const cleanupActions = []
    let familiesDeleted = 0

    for (const user of users) {
      if (user.familyMemberships.length > 1) {
        // Group families by similar names (likely duplicates)
        const familiesByName = new Map<string, any[]>()
        
        for (const membership of user.familyMemberships) {
          const family = membership.family
          const baseName = family.name.replace(/\s+Family$/, '').toLowerCase()
          
          if (!familiesByName.has(baseName)) {
            familiesByName.set(baseName, [])
          }
          familiesByName.get(baseName)!.push({
            ...membership,
            family
          })
        }

        // Clean up duplicates
        for (const [baseName, families] of familiesByName) {
          if (families.length > 1) {
            // Sort by creation date to keep the oldest one
            families.sort((a, b) => new Date(a.family.createdAt).getTime() - new Date(b.family.createdAt).getTime())
            
            const keepFamily = families[0]
            const duplicates = families.slice(1)
            
            for (const duplicate of duplicates) {
              const action = {
                userId: user.id,
                userEmail: user.email,
                action: 'DELETE_FAMILY',
                familyId: duplicate.family.id,
                familyName: duplicate.family.name,
                keepFamilyId: keepFamily.family.id,
                keepFamilyName: keepFamily.family.name
              }
              
              cleanupActions.push(action)
              
              if (!dryRun) {
                // Delete the duplicate family and its memberships
                await prisma.$transaction(async (tx) => {
                  // Delete all memberships for this family
                  await tx.familyMember.deleteMany({
                    where: {
                      familyId: duplicate.family.id
                    }
                  })
                  
                  // Delete the family
                  await tx.family.delete({
                    where: {
                      id: duplicate.family.id
                    }
                  })
                })
                
                familiesDeleted++
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      dryRun,
      cleanupActions,
      familiesDeleted,
      totalActions: cleanupActions.length
    })
  } catch (error) {
    console.error('Error cleaning duplicate families:', error)
    return NextResponse.json(
      { error: 'Failed to clean duplicate families' },
      { status: 500 }
    )
  }
}