import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { PasswordResetEmail } from '@/emails/password-reset-email'

const resend = new Resend(process.env.RESEND_API_KEY)

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'If the email exists, a reset link has been sent.'
      })
    }

    // Check if user has a password (not OAuth only)
    if (!user.password) {
      return NextResponse.json({
        message: 'If the email exists, a reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour from now

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    })

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token: resetToken,
        expires
      }
    })

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    // Send email
    try {
      const emailHtml = await render(PasswordResetEmail({
        userName: user.name || 'Usuario',
        resetUrl
      }))

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'FamFinz <noreply@famfinz.com>',
        to: email,
        subject: 'Restablecer contraseña - FamFinz',
        html: emailHtml
      })
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Still return success to prevent information disclosure
    }

    return NextResponse.json({
      message: 'If the email exists, a reset link has been sent.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}