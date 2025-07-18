import React from 'react'
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Img
} from '@react-email/components'

interface PasswordResetEmailProps {
  userName: string
  resetUrl: string
}

export const PasswordResetEmail = ({
  userName,
  resetUrl
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Restablece tu contraseña de FamFinz</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Img
              src="https://your-domain.com/logo.png"
              width="120"
              height="40"
              alt="FamFinz"
              style={logo}
            />
          </Section>

          {/* Header */}
          <Section style={header}>
            <Text style={appName}>🔐 Restablecer Contraseña</Text>
            <Heading style={heading}>¡Solicitud de restablecimiento de contraseña!</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={text}>
              Hola <strong>{userName}</strong>,
            </Text>
            
            <Text style={text}>
              Recibimos una solicitud para restablecer la contraseña de tu cuenta de FamFinz.
            </Text>

            <Text style={text}>
              Si solicitaste este cambio, haz clic en el botón de abajo para crear una nueva contraseña:
            </Text>

            {/* Reset Button */}
            <Section style={buttonSection}>
              <Button href={resetUrl} style={button}>
                Restablecer Contraseña
              </Button>
            </Section>

            <Text style={smallText}>
              Este enlace expirará en 1 hora por seguridad.
            </Text>

            <Hr style={divider} />

            <Text style={smallText}>
              <strong>⚠️ Importante:</strong> Si no solicitaste este cambio de contraseña, 
              puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.
            </Text>

            <Text style={smallText}>
              Si tienes problemas con el botón, copia y pega este enlace en tu navegador:
            </Text>
            <Text style={linkText}>{resetUrl}</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este es un correo automático de FamFinz
            </Text>
            <Text style={footerText}>
              Si tienes alguna pregunta, contacta a nuestro equipo de soporte.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px'
}

const logoSection = {
  padding: '32px 32px 0'
}

const logo = {
  margin: '0 auto'
}

const header = {
  padding: '32px 32px 20px',
  textAlign: 'center' as const
}

const appName = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#3b82f6',
  margin: '0 0 16px'
}

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 20px'
}

const content = {
  padding: '0 32px'
}

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#374151',
  margin: '0 0 16px'
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0'
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px'
}

const smallText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6b7280',
  margin: '0 0 12px'
}

const linkText = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#3b82f6',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  margin: '0 0 16px'
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0'
}

const footer = {
  padding: '32px 32px 0',
  textAlign: 'center' as const
}

const footerText = {
  fontSize: '12px',
  lineHeight: '16px',
  color: '#9ca3af',
  margin: '0 0 8px'
}

export default PasswordResetEmail