import {
  Text,
  Section,
  Row,
  Column,
} from '@react-email/components'
import EmailLayout from '../components/EmailLayout'

interface ReminderEmailProps {
  reminderTitle: string
  dueDate: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  amount?: number
  category?: string
  familyName: string
  isRecurring: boolean
  isOverdue: boolean
  daysDifference: number
}

export default function ReminderEmail({
  reminderTitle,
  dueDate,
  priority,
  amount,
  category,
  familyName,
  isRecurring,
  isOverdue,
  daysDifference,
}: ReminderEmailProps) {
  const getSubject = () => {
    if (isOverdue) return `🔔 Notificación: ${reminderTitle} (fecha pasada)`
    if (daysDifference === 0) return `⚠️ Notificación para HOY: ${reminderTitle}`
    if (daysDifference === 1) return `⏰ Notificación para MAÑANA: ${reminderTitle}`
    return `📅 Notificación: ${reminderTitle}`
  }

  const getUrgencyMessage = () => {
    if (isOverdue) return `¡Fecha pasada! (${Math.abs(daysDifference)} días después)`
    if (daysDifference === 0) return '¡ES PARA HOY!'
    if (daysDifference === 1) return 'Es para mañana'
    return `Es en ${daysDifference} días`
  }

  const getPriorityColor = () => {
    switch (priority) {
      case 'URGENT': return '#dc2626'
      case 'HIGH': return '#ea580c'
      case 'MEDIUM': return '#d97706'
      case 'LOW': return '#65a30d'
      default: return '#6b7280'
    }
  }

  const getPriorityLabel = () => {
    switch (priority) {
      case 'URGENT': return 'Urgente'
      case 'HIGH': return 'Alta'
      case 'MEDIUM': return 'Media'
      case 'LOW': return 'Baja'
      default: return priority
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const previewText = getSubject()

  return (
    <EmailLayout 
      title="Notificación de Pago"
      previewText={previewText}
    >
      <Section style={headerSection}>
        <Text style={heading}>
          Notificación de Pago 💰
        </Text>
        
        <Section style={{
          ...priorityBadge,
          backgroundColor: getPriorityColor(),
        }}>
          <Text style={priorityText}>
            Prioridad {getPriorityLabel()}
          </Text>
        </Section>
      </Section>

      <Section style={{
        ...urgencySection,
        backgroundColor: isOverdue ? '#fee2e2' : daysDifference <= 1 ? '#fef3c7' : '#ecfdf5',
        borderLeftColor: isOverdue ? '#dc2626' : daysDifference <= 1 ? '#f59e0b' : '#10b981',
      }}>
        <Text style={{
          ...urgencyText,
          color: isOverdue ? '#991b1b' : daysDifference <= 1 ? '#92400e' : '#065f46',
        }}>
          {getUrgencyMessage()}
        </Text>
      </Section>

      <Text style={reminderTitleStyle}>
        {reminderTitle}
      </Text>

      <Section style={detailsSection}>
        <Row style={detailRow}>
          <Column style={detailIcon}>📅</Column>
          <Column style={detailLabel}>
            <Text style={detailLabelText}>Fecha de vencimiento:</Text>
          </Column>
          <Column style={detailValue}>
            <Text style={detailValueText}>{formatDate(dueDate)}</Text>
          </Column>
        </Row>

        {amount && (
          <Row style={detailRow}>
            <Column style={detailIcon}>💵</Column>
            <Column style={detailLabel}>
              <Text style={detailLabelText}>Monto:</Text>
            </Column>
            <Column style={detailValue}>
              <Text style={detailValueText}>{formatAmount(amount)}</Text>
            </Column>
          </Row>
        )}

        {category && (
          <Row style={detailRow}>
            <Column style={detailIcon}>🏷️</Column>
            <Column style={detailLabel}>
              <Text style={detailLabelText}>Categoría:</Text>
            </Column>
            <Column style={detailValue}>
              <Text style={detailValueText}>{category}</Text>
            </Column>
          </Row>
        )}

        <Row style={detailRow}>
          <Column style={detailIcon}>🔄</Column>
          <Column style={detailLabel}>
            <Text style={detailLabelText}>Recurrente:</Text>
          </Column>
          <Column style={detailValue}>
            <Text style={detailValueText}>{isRecurring ? 'Sí' : 'No'}</Text>
          </Column>
        </Row>

        <Row style={detailRow}>
          <Column style={detailIcon}>👨‍👩‍👧‍👦</Column>
          <Column style={detailLabel}>
            <Text style={detailLabelText}>Familia:</Text>
          </Column>
          <Column style={detailValue}>
            <Text style={detailValueText}>{familyName}</Text>
          </Column>
        </Row>
      </Section>

      {isOverdue && (
        <Section style={noteSection}>
          <Text style={noteTitle}>💡 Nota importante:</Text>
          <Text style={noteText}>
            Este recordatorio es para una fecha que ya pasó. Revisa si ya realizaste este pago.
          </Text>
        </Section>
      )}

      {isRecurring && (
        <Section style={noteSection}>
          <Text style={noteTitle}>🔄 Recordatorio recurrente:</Text>
          <Text style={noteText}>
            Este es un recordatorio recurrente. Se generará automáticamente el próximo recordatorio según la frecuencia configurada.
          </Text>
        </Section>
      )}

      <Section style={noteSection}>
        <Text style={noteTitle}>✅ Notificación automática:</Text>
        <Text style={noteText}>
          Este recordatorio se marca automáticamente como notificado después de enviarse.
        </Text>
      </Section>

      <Text style={footerNote}>
        Esta es una notificación automática de FamFinz para mantener tus finanzas organizadas.
      </Text>
    </EmailLayout>
  )
}

// Styles
const headerSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const heading = {
  fontSize: '28px',
  fontWeight: '600',
  color: '#1f2937',
  lineHeight: '36px',
  margin: '0 0 16px 0',
}

const priorityBadge = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: '20px',
  margin: '0 auto',
}

const priorityText = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#ffffff',
  margin: '0',
  textTransform: 'uppercase' as const,
}

const urgencySection = {
  padding: '16px',
  borderRadius: '6px',
  borderLeft: '4px solid',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const urgencyText = {
  fontSize: '18px',
  fontWeight: '600',
  margin: '0',
}

const reminderTitleStyle = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1f2937',
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
}

const detailsSection = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const detailRow = {
  margin: '12px 0',
}

const detailIcon = {
  width: '32px',
  fontSize: '18px',
  verticalAlign: 'top' as const,
}

const detailLabel = {
  width: '140px',
  verticalAlign: 'top' as const,
}

const detailLabelText = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#6b7280',
  margin: '0',
}

const detailValue = {
  verticalAlign: 'top' as const,
}

const detailValueText = {
  fontSize: '14px',
  color: '#1f2937',
  margin: '0',
  fontWeight: '500',
}

const noteSection = {
  backgroundColor: '#eff6ff',
  padding: '16px',
  borderRadius: '6px',
  borderLeft: '4px solid #3b82f6',
  margin: '16px 0',
}

const noteTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e40af',
  margin: '0 0 4px 0',
}

const noteText = {
  fontSize: '14px',
  color: '#1e40af',
  margin: '0',
  lineHeight: '20px',
}

const footerNote = {
  fontSize: '14px',
  color: '#6b7280',
  fontStyle: 'italic',
  textAlign: 'center' as const,
  margin: '24px 0 0 0',
}