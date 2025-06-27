import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const connectSchema = z.object({
  institution: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    const body = await request.json()
    const result = connectSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }

    const { institution } = result.data

    // Create access token for Belvo Connect Widget
    const belvoSecretId = process.env.BELVO_SECRET_ID
    const belvoSecretPassword = process.env.BELVO_SECRET_PASSWORD
    
    if (!belvoSecretId || !belvoSecretPassword) {
      return NextResponse.json(
        { error: 'Belvo credentials not configured' },
        { status: 500 }
      )
    }

    // Create access token
    console.log('Making request to Belvo token endpoint...')
    const tokenResponse = await fetch('https://sandbox.belvo.com/api/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: belvoSecretId,
        password: belvoSecretPassword,
      }),
    })

    console.log('Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Belvo token error:', errorText)
      throw new Error(`Failed to get Belvo access token: ${tokenResponse.status} - ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    console.log('Token response:', tokenData)
    const { access: access_token } = tokenData

    // For now, return a simple configuration that the frontend can use
    // Later we'll integrate with BelvoService once it's properly configured
    return NextResponse.json({
      success: true,
      requiresManualConnection: true,
      institution: institution,
      message: 'Connection requires manual setup - please provide credentials'
    })

  } catch (error) {
    console.error('Belvo connection error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate bank connection' },
      { status: 500 }
    )
  }
}