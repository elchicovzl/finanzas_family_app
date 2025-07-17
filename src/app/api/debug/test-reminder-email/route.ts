import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendReminderEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      to, 
      reminderTitle = 'Test Reminder',
      daysUntilDue = 1 
    } = await request.json()

    if (!to) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    console.log('🧪 Testing reminder email to:', to)

    const result = await sendReminderEmail({
      to,
      familyName: 'Test Family',
      reminderTitle,
      reminderDescription: 'This is a test reminder email from the debug endpoint',
      amount: 150000,
      dueDate: new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000),
      reminderTime: '14:30',
      daysUntilDue,
      priority: 'MEDIUM',
      isRecurring: false,
      category: {
        name: 'Test Category',
        icon: '🧪',
        color: '#6B7280'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Test reminder email sent successfully',
      result,
      emailSentTo: to,
      testData: {
        reminderTitle,
        daysUntilDue,
        currentTime: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Test reminder email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test reminder email', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}