import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { rateLimiters } from '@/lib/rate-limiter'
import { sendWelcomeEmail } from '@/lib/email'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  // Apply rate limiting for auth endpoints
  const rateLimitResult = await rateLimiters.auth(request)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Too many registration attempts',
        retryAfter: Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime!).toISOString()
        }
      }
    )
  }
  try {
    const body = await request.json()
    
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      )
    }

    const { name, email, password } = result.data

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Send welcome email asynchronously (don't block the response)
    const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signin`
    
    console.log('=== REGISTRATION EMAIL TRIGGER ===')
    console.log('Sending welcome email to:', email)
    console.log('User name:', name)
    console.log('Login URL:', loginUrl)
    console.log('===================================')
    
    sendWelcomeEmail({
      to: email,
      userName: name,
      isGoogleSignup: false,
      loginUrl
    }).catch(error => {
      console.error('❌ Failed to send welcome email:', error)
      console.error('❌ Error details:', JSON.stringify(error, null, 2))
      // Don't fail the registration if email fails
    })

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}