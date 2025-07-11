// Email template helper functions with internationalization support

export type Locale = 'es' | 'en'

interface EmailTranslations {
  [key: string]: any
}

// Function to get translations from JSON files
async function getEmailTranslations(locale: Locale): Promise<EmailTranslations> {
  try {
    const translations = await import(`@/messages/${locale}.json`)
    return translations.default
  } catch (error) {
    console.error(`Failed to load email translations for locale: ${locale}`, error)
    // Fallback to Spanish if English fails
    if (locale !== 'es') {
      const fallbackTranslations = await import('@/messages/es.json')
      return fallbackTranslations.default
    }
    throw error
  }
}

// Helper function to interpolate variables in translation strings
function interpolate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match
  })
}

// Format currency based on locale
export function formatCurrency(amount: number, locale: Locale): string {
  const localeCode = locale === 'es' ? 'es-CO' : 'en-US'
  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

// Format date based on locale
export function formatDate(date: Date, locale: Locale): string {
  const localeCode = locale === 'es' ? 'es-CO' : 'en-US'
  return date.toLocaleDateString(localeCode, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Generate invitation email content
export async function generateInvitationEmail(
  locale: Locale,
  variables: {
    familyName: string
    invitedByName: string
    invitationUrl: string
    expirationDate: string
  }
) {
  const t = await getEmailTranslations(locale)
  const inv = t.emails.invitation

  const subject = interpolate(inv.subject, variables)
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${inv.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border: 1px solid #e9ecef;">
        <h1 style="color: #007bff; text-align: center; margin-bottom: 30px;">
          ${inv.appName}
        </h1>
        
        <h2 style="color: #495057; margin-bottom: 20px;">
          ${inv.heading}
        </h2>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          ${inv.greeting}
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          ${interpolate(inv.inviteText, variables)}
        </p>
        
        <p style="font-size: 16px; margin-bottom: 30px;">
          ${inv.featuresTitle}
        </p>
        
        <ul style="font-size: 16px; margin-bottom: 30px; padding-left: 20px;">
          <li>${inv.features.transactions}</li>
          <li>${inv.features.budgets}</li>
          <li>${inv.features.analytics}</li>
          <li>${inv.features.coordination}</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${variables.invitationUrl}" 
             style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
            ${inv.acceptButton}
          </a>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            <strong>${inv.expirationWarning}</strong> ${interpolate(inv.expirationText, variables)}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
          ${inv.linkInstructions}
        </p>
        <p style="font-size: 14px; color: #007bff; word-break: break-all;">
          ${variables.invitationUrl}
        </p>
        
        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #6c757d; text-align: center;">
          ${inv.ignoreText}
        </p>
      </div>
    </body>
    </html>
  `

  const textContent = `
${inv.heading}

${inv.greeting}

${interpolate(inv.inviteText, variables)}

${inv.featuresTitle}
- ${inv.features.transactions}
- ${inv.features.budgets}  
- ${inv.features.analytics}
- ${inv.features.coordination}

${inv.acceptButton}: ${variables.invitationUrl}

${inv.expirationWarning} ${interpolate(inv.expirationText, variables)}

${inv.linkInstructions}
${variables.invitationUrl}

${inv.ignoreText}
  `.trim()

  return { subject, htmlContent, textContent }
}

// Generate reminder email content
export async function generateReminderEmail(
  locale: Locale,
  variables: {
    reminderTitle: string
    familyName: string
    reminderDescription?: string
    amount?: number
    formattedDueDate: string
    daysUntilDue: number
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    isRecurring: boolean
    category?: {
      name: string
      icon: string
      color: string
    }
  }
) {
  const t = await getEmailTranslations(locale)
  const rem = t.emails.reminder

  // Generate subject based on urgency
  let subject: string
  if (variables.daysUntilDue < 0) {
    subject = interpolate(rem.subjectOverdue, { reminderTitle: variables.reminderTitle })
  } else if (variables.daysUntilDue === 0) {
    subject = interpolate(rem.subjectToday, { reminderTitle: variables.reminderTitle })
  } else if (variables.daysUntilDue === 1) {
    subject = interpolate(rem.subjectTomorrow, { reminderTitle: variables.reminderTitle })
  } else {
    subject = interpolate(rem.subjectGeneral, { reminderTitle: variables.reminderTitle })
  }

  // Generate urgency text
  let urgencyText: string
  if (variables.daysUntilDue < 0) {
    urgencyText = interpolate(rem.urgencyOverdue, { days: Math.abs(variables.daysUntilDue) })
  } else if (variables.daysUntilDue === 0) {
    urgencyText = rem.urgencyToday
  } else if (variables.daysUntilDue === 1) {
    urgencyText = rem.urgencyTomorrow
  } else {
    urgencyText = interpolate(rem.urgencyDays, { days: variables.daysUntilDue })
  }

  const priorityColors = {
    LOW: '#10B981',
    MEDIUM: '#F59E0B', 
    HIGH: '#EF4444',
    URGENT: '#DC2626'
  }

  const formattedAmount = variables.amount ? formatCurrency(variables.amount, locale) : ''

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${rem.title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding: 20px 0; border-bottom: 2px solid #eee; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
        .reminder-card { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid ${priorityColors[variables.priority]}; }
        .reminder-title { font-size: 20px; font-weight: bold; color: #1e293b; margin-bottom: 10px; }
        .reminder-details { margin: 15px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-label { font-weight: bold; color: #64748b; }
        .detail-value { color: #1e293b; }
        .urgency { font-size: 18px; font-weight: bold; text-align: center; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .overdue { background-color: #fef2f2; color: #dc2626; border: 2px solid #fecaca; }
        .today { background-color: #fef3c7; color: #d97706; border: 2px solid #fde68a; }
        .soon { background-color: #f0f9ff; color: #0369a1; border: 2px solid #bae6fd; }
        .category-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; color: white; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">${rem.appName}</div>
          <h1>${rem.title}</h1>
          <div class="priority-badge" style="background-color: ${priorityColors[variables.priority]}">
            ${interpolate(rem.priority, { priority: variables.priority })}
          </div>
        </div>

        <div class="reminder-card">
          <div class="reminder-title">${variables.reminderTitle}</div>
          
          ${variables.reminderDescription ? `<p style="color: #64748b; margin: 10px 0;">${variables.reminderDescription}</p>` : ''}

          <div class="urgency ${variables.daysUntilDue < 0 ? 'overdue' : variables.daysUntilDue === 0 ? 'today' : 'soon'}">
            ${urgencyText}
          </div>

          <div class="reminder-details">
            <div class="detail-row">
              <span class="detail-label">${rem.dueDate}</span>
              <span class="detail-value">${variables.formattedDueDate}</span>
            </div>
            
            ${variables.amount ? `
              <div class="detail-row">
                <span class="detail-label">${rem.amount}</span>
                <span class="detail-value" style="font-weight: bold; color: #059669;">${formattedAmount}</span>
              </div>
            ` : ''}

            ${variables.category ? `
              <div class="detail-row">
                <span class="detail-label">${rem.category}</span>
                <span class="detail-value">
                  <span class="category-badge" style="background-color: ${variables.category.color}">
                    ${variables.category.icon} ${variables.category.name}
                  </span>
                </span>
              </div>
            ` : ''}

            <div class="detail-row">
              <span class="detail-label">${rem.recurring}</span>
              <span class="detail-value">${variables.isRecurring ? rem.yes : rem.no}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">${rem.family}</span>
              <span class="detail-value">${variables.familyName}</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #64748b; margin-bottom: 15px;">
            ${variables.daysUntilDue < 0 ? rem.overdueNote : rem.automaticNote}
          </p>
          
          ${variables.isRecurring ? `
            <p style="color: #0369a1; font-size: 14px; margin-top: 15px;">
              ${rem.recurringNote}
            </p>
          ` : `
            <p style="color: #059669; font-size: 14px; margin-top: 15px;">
              ${rem.completionNote}
            </p>
          `}
        </div>

        <div class="footer">
          <p>${rem.footerText}</p>
          <p style="font-size: 12px; color: #9ca3af;">
            ${rem.contactText}
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
${rem.title} - ${variables.familyName}

${variables.reminderTitle}
${variables.reminderDescription ? variables.reminderDescription + '\n' : ''}

${urgencyText}
${rem.dueDate} ${variables.formattedDueDate}
${variables.amount ? `${rem.amount} ${formattedAmount}\n` : ''}
${variables.category ? `${rem.category} ${variables.category.name}\n` : ''}
${rem.priority}: ${variables.priority}
${rem.recurring} ${variables.isRecurring ? rem.yes : rem.no}

${variables.daysUntilDue < 0 ? rem.overdueNote : rem.automaticNote}

${variables.isRecurring ? rem.recurringNote : rem.completionNote}

---
${rem.footerText}
  `.trim()

  return { subject, htmlContent, textContent }
}