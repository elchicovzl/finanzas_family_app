import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('=== TEST EMAIL REQUEST ===')
    console.log('User:', session.user.email)
    console.log('User Name:', session.user.name)
    console.log('==========================')

    // Enviar correo de prueba usando la función de bienvenida
    const result = await sendWelcomeEmail({
      to: session.user.email,
      userName: session.user.name || 'Usuario de Prueba',
      isGoogleSignup: false,
      loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
    })

    return NextResponse.json({
      success: true,
      message: 'Correo de prueba enviado exitosamente',
      messageId: result.messageId,
      sentTo: session.user.email
    })

  } catch (error) {
    console.error('Error en test email:', error)
    
    return NextResponse.json(
      { 
        error: 'Error enviando correo de prueba',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}