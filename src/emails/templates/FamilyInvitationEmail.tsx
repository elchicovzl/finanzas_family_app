import {
  Text,
  Button,
  Section,
  Row,
  Column,
} from '@react-email/components'
import EmailLayout from '../components/EmailLayout'

interface FamilyInvitationEmailProps {
  familyName: string
  invitedByName: string
  invitationUrl: string
  expirationDate: string
}

export default function FamilyInvitationEmail({
  familyName,
  invitedByName,
  invitationUrl,
  expirationDate,
}: FamilyInvitationEmailProps) {
  const previewText = `${invitedByName} te ha invitado a unirte a la familia "${familyName}"`

  return (
    <EmailLayout 
      title={`Invitación a la familia "${familyName}"`}
      previewText={previewText}
    >
      <Text style={heading}>
        ¡Has sido invitado a unirte a una familia! 👨‍👩‍👧‍👦
      </Text>
      
      <Text style={paragraph}>
        Hola,
      </Text>
      
      <Text style={paragraph}>
        <strong>{invitedByName}</strong> te ha invitado a unirte a la familia{' '}
        <strong>"{familyName}"</strong> en FamFinz.
      </Text>

      <Section style={featuresSection}>
        <Text style={featuresTitle}>Con esta aplicación podrás:</Text>
        
        <Row style={featureRow}>
          <Column style={featureIcon}>💳</Column>
          <Column style={featureText}>
            <Text style={featureDescription}>
              Gestionar transacciones familiares
            </Text>
          </Column>
        </Row>

        <Row style={featureRow}>
          <Column style={featureIcon}>📊</Column>
          <Column style={featureText}>
            <Text style={featureDescription}>
              Crear y seguir presupuestos compartidos
            </Text>
          </Column>
        </Row>

        <Row style={featureRow}>
          <Column style={featureIcon}>📈</Column>
          <Column style={featureText}>
            <Text style={featureDescription}>
              Ver análisis financieros de la familia
            </Text>
          </Column>
        </Row>

        <Row style={featureRow}>
          <Column style={featureIcon}>⏰</Column>
          <Column style={featureText}>
            <Text style={featureDescription}>
              Recibir recordatorios de pagos importantes
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={buttonSection}>
        <Button href={invitationUrl} style={button}>
          Aceptar Invitación
        </Button>
      </Section>

      <Section style={warningSection}>
        <Text style={warningTitle}>⏰ Importante:</Text>
        <Text style={warningText}>
          Esta invitación expira el <strong>{expirationDate}</strong>
        </Text>
      </Section>

      <Text style={paragraph}>
        Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
      </Text>
      <Text style={urlText}>{invitationUrl}</Text>

      <Text style={disclaimerText}>
        Si no esperabas esta invitación, puedes ignorar este correo.
      </Text>
    </EmailLayout>
  )
}

// Styles
const heading = {
  fontSize: '28px',
  fontWeight: '600',
  color: '#1f2937',
  lineHeight: '36px',
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
  padding: '24px',
  borderRadius: '8px',
  margin: '32px 0',
}

const featuresTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 20px 0',
}

const featureRow = {
  margin: '12px 0',
}

const featureIcon = {
  width: '32px',
  paddingRight: '12px',
  fontSize: '20px',
  verticalAlign: 'top' as const,
}

const featureText = {
  verticalAlign: 'top' as const,
}

const featureDescription = {
  fontSize: '14px',
  color: '#4b5563',
  margin: '0',
  lineHeight: '20px',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
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
  padding: '14px 28px',
  border: 'none',
}

const warningSection = {
  backgroundColor: '#fef3c7',
  padding: '16px',
  borderRadius: '6px',
  borderLeft: '4px solid #f59e0b',
  margin: '24px 0',
}

const warningTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 4px 0',
}

const warningText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
}

const urlText = {
  fontSize: '14px',
  color: '#3b82f6',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f3f4f6',
  padding: '12px',
  borderRadius: '4px',
  fontFamily: 'monospace',
}

const disclaimerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '24px 0 0 0',
  fontStyle: 'italic',
}