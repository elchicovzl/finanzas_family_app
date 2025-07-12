import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Link,
  Hr,
  Font,
} from '@react-email/components'

interface EmailLayoutProps {
  title: string
  children: React.ReactNode
  previewText?: string
}

export default function EmailLayout({ title, children, previewText }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <title>{title}</title>
        {previewText && <meta name="description" content={previewText} />}
      </Head>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src={`${process.env.NEXTAUTH_URL || 'https://famfinz.vercel.app'}/logo.png`}
              width={120}
              height={48}
              alt="FamFinz"
              style={logo}
            />
            <Text style={brandName}>FamFinz - Finanzas Familiares</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Este correo fue enviado desde{' '}
              <Link href={process.env.NEXTAUTH_URL || 'https://famfinz.vercel.app'} style={link}>
                FamFinz
              </Link>
            </Text>
            <Text style={footerText}>
              © 2024 FamFinz. Todos los derechos reservados.
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
  fontFamily: 'Inter, Arial, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e5e7eb',
}

const logo = {
  margin: '0 auto',
  borderRadius: '8px',
}

const brandName = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '16px 0 0 0',
}

const content = {
  padding: '32px 24px',
}

const footer = {
  padding: '0 24px',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '12px',
  color: '#6b7280',
  lineHeight: '16px',
  margin: '8px 0',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}