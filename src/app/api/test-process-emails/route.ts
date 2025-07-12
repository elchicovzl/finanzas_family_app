import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('🔄 Manually triggering email jobs processing...')

    // Call the process emails endpoint
    const processUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/process-emails`
    
    const response = await fetch(processUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Email jobs processing triggered manually',
      processResult: data
    })

  } catch (error) {
    console.error('❌ Error triggering email jobs processing:', error)
    
    return NextResponse.json(
      { 
        error: 'Error triggering email jobs processing',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}