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

    console.log('=== TEST WELCOME EMAIL (REGISTRO SIMULATION) ===')
    console.log('User:', session.user.email)
    console.log('User Name:', session.user.name)
    console.log('================================================')

    // Simular exactamente lo que ocurre en el registro
    const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signin`
    
    console.log('=== REGISTRATION EMAIL TRIGGER ===')
    console.log('Sending welcome email to:', session.user.email)
    console.log('User name:', session.user.name)
    console.log('Login URL:', loginUrl)
    console.log('===================================')

    const result = await sendWelcomeEmail({
      to: session.user.email,
      userName: session.user.name || 'Usuario de Prueba',
      isGoogleSignup: false,  // Simular registro manual
      loginUrl
    })

    return NextResponse.json({
      success: true,
      message: 'Correo de bienvenida (registro) enviado exitosamente',
      messageId: result.messageId,
      sentTo: session.user.email,
      type: 'registration_simulation'
    })

  } catch (error) {
    console.error('❌ Error en test welcome email:', error)
    
    return NextResponse.json(
      { 
        error: 'Error enviando correo de bienvenida (registro)',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}