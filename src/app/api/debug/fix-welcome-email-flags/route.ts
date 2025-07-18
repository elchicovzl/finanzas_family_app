import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get all users and their welcome email status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        welcomeEmailSent: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const report = {
      totalUsers: users.length,
      usersWithWelcomeEmailSent: users.filter(u => u.welcomeEmailSent).length,
      usersWithoutWelcomeEmailSent: users.filter(u => !u.welcomeEmailSent).length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        welcomeEmailSent: u.welcomeEmailSent,
        createdAt: u.createdAt
      }))
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error getting welcome email status:', error)
    return NextResponse.json(
      { error: 'Failed to get welcome email status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { dryRun = true } = await request.json()
    
    // Find all users who don't have welcomeEmailSent set to true
    // For existing users, we assume they've already received welcome emails
    const usersToUpdate = await prisma.user.findMany({
      where: {
        welcomeEmailSent: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    const updateActions = usersToUpdate.map(user => ({
      userId: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      action: 'SET_WELCOME_EMAIL_SENT_TRUE'
    }))

    let updatedCount = 0

    if (!dryRun) {
      // Update all users to mark welcome email as sent
      const result = await prisma.user.updateMany({
        where: {
          welcomeEmailSent: false
        },
        data: {
          welcomeEmailSent: true
        }
      })
      
      updatedCount = result.count
    }

    return NextResponse.json({
      dryRun,
      usersToUpdate: updateActions,
      totalToUpdate: updateActions.length,
      updatedCount
    })
  } catch (error) {
    console.error('Error updating welcome email flags:', error)
    return NextResponse.json(
      { error: 'Failed to update welcome email flags' },
      { status: 500 }
    )
  }
}