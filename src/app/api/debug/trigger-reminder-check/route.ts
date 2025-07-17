import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🧪 Manual trigger of reminder check initiated by:', session.user.email)

    // Call the check-reminders endpoint with proper authentication
    const baseUrl = process.env.NEXTAUTH_URL || request.url.split('/api')[0]
    const response = await fetch(`${baseUrl}/api/cron/check-reminders`, {
      method: 'GET',
      headers: {
        'x-cron-secret': process.env.CRON_SECRET || '',
        'User-Agent': 'Manual Debug Trigger'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Cron job failed: ${result.error || 'Unknown error'}`)
    }

    console.log('✅ Manual reminder check completed:', result)

    return NextResponse.json({
      success: true,
      message: 'Reminder check triggered manually',
      result,
      triggeredBy: session.user.email,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Manual reminder check failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger reminder check', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}