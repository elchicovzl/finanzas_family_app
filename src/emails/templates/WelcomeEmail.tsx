import {
  Text,
  Button,
  Section,
  Row,
  Column,
} from '@react-email/components'
import EmailLayout from '../components/EmailLayout'

interface WelcomeEmailProps {
  userName: string
  isGoogleSignup?: boolean
  loginUrl: string
}

export default function WelcomeEmail({
  userName,
  isGoogleSignup = false,
  loginUrl,
}: WelcomeEmailProps) {
  const previewText = `¡Bienvenido a Finanzas Familiares, ${userName}!`

  return (
    <EmailLayout 
      title="¡Bienvenido a Finanzas Familiares!"
      previewText={previewText}
    >
      <Text style={heading}>
        ¡Bienvenido a FamFinz! 🎉
      </Text>
      
      <Text style={paragraph}>
        Hola <strong>{userName}</strong>,
      </Text>
      
      <Text style={paragraph}>
        {isGoogleSignup 
          ? 'Te has registrado exitosamente usando tu cuenta de Google.'
          : 'Tu cuenta ha sido creada exitosamente.'
        } ¡Estamos emocionados de tenerte en nuestra comunidad!
      </Text>

      <Section style={featuresSection}>
        <Text style={featuresTitle}>¿Qué puedes hacer ahora?</Text>
        
        <Row style={featureRow}>
          <Column style={featureIcon}>👨‍👩‍👧‍👦</Column>
          <Column style={featureText}>
            <Text style={featureTitle}>Crear tu primera familia</Text>
            <Text style={featureDescription}>
              Comienza creando una familia e invita a tus seres queridos a unirse
            </Text>
          </Column>
        </Row>

        <Row style={featureRow}>
          <Column style={featureIcon}>💳</Column>
          <Column style={featureText}>
            <Text style={featureTitle}>Agregar transacciones</Text>
            <Text style={featureDescription}>
              Registra tus ingresos y gastos para llevar un control completo
            </Text>
          </Column>
        </Row>

        <Row style={featureRow}>
          <Column style={featureIcon}>📊</Column>
          <Column style={featureText}>
            <Text style={featureTitle}>Crear presupuestos</Text>
            <Text style={featureDescription}>
              Establece límites de gasto y recibe alertas cuando te acerques
            </Text>
          </Column>
        </Row>

        <Row style={featureRow}>
          <Column style={featureIcon}>⏰</Column>
          <Column style={featureText}>
            <Text style={featureTitle}>Configurar recordatorios</Text>
            <Text style={featureDescription}>
              Nunca olvides un pago importante con nuestros recordatorios automáticos
            </Text>
          </Column>
        </Row>

        <Row style={featureRow}>
          <Column style={featureIcon}>🏦</Column>
          <Column style={featureText}>
            <Text style={featureTitle}>Conectar tu banco</Text>
            <Text style={featureDescription}>
              Sincroniza automáticamente tus transacciones bancarias (próximamente)
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={buttonSection}>
        <Button href={loginUrl} style={button}>
          Comenzar Ahora
        </Button>
      </Section>

      <Section style={tipsSection}>
        <Text style={tipsTitle}>💡 Consejos para empezar:</Text>
        
        <Text style={tipText}>
          <strong>1. Crea tu familia:</strong> Invita a tu pareja e hijos para tener una visión completa de las finanzas familiares.
        </Text>
        
        <Text style={tipText}>
          <strong>2. Conecta todas las cuentas:</strong> Mientras más información tengas, mejores decisiones podrás tomar.
        </Text>
        
        <Text style={tipText}>
          <strong>3. Establece metas:</strong> Define presupuestos realistas y metas de ahorro para alcanzar tus objetivos.
        </Text>
      </Section>

      <Section style={helpSection}>
        <Text style={helpTitle}>¿Necesitas ayuda?</Text>
        <Text style={helpText}>
          Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos. 
          Estamos aquí para ayudarte a tomar el control de tus finanzas familiares.
        </Text>
      </Section>

      <Text style={signatureText}>
        ¡Gracias por elegir FamFinz!<br />
        El equipo de FamFinz
      </Text>
    </EmailLayout>
  )
}

// Styles
const heading = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#1f2937',
  lineHeight: '40px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '24px',
  margin: '16px 0',
}

const featuresSection = {
  backgroundColor: '#f9fafb',
  padding: '32px 24px',
  borderRadius: '12px',
  margin: '32px 0',
}

const featuresTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const featureRow = {
  margin: '20px 0',
}

const featureIcon = {
  width: '48px',
  paddingRight: '16px',
  fontSize: '24px',
  verticalAlign: 'top' as const,
}

const featureText = {
  verticalAlign: 'top' as const,
}

const featureTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 4px 0',
}

const featureDescription = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
  lineHeight: '20px',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '40px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  border: 'none',
}

const tipsSection = {
  backgroundColor: '#ecfdf5',
  padding: '24px',
  borderRadius: '8px',
  borderLeft: '4px solid #10b981',
  margin: '32px 0',
}

const tipsTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#065f46',
  margin: '0 0 16px 0',
}

const tipText = {
  fontSize: '14px',
  color: '#065f46',
  margin: '12px 0',
  lineHeight: '20px',
}

const helpSection = {
  backgroundColor: '#eff6ff',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const helpTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1e40af',
  margin: '0 0 8px 0',
}

const helpText = {
  fontSize: '14px',
  color: '#1e40af',
  margin: '0',
  lineHeight: '20px',
}

const signatureText = {
  fontSize: '16px',
  color: '#4b5563',
  textAlign: 'center' as const,
  margin: '32px 0 0 0',
  fontStyle: 'italic',
}