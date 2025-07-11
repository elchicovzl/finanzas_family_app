'use client'

import { useState } from 'react'
import { useTranslations } from '@/hooks/use-translations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Settings, Globe, User, Bell, Shield, Palette, Mail } from 'lucide-react'

export default function SettingsPage() {
  const { t, locale, changeLanguage, isLoading } = useTranslations()
  const [selectedLanguage, setSelectedLanguage] = useState<'es' | 'en'>(locale)
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const [isTestingWelcomeEmail, setIsTestingWelcomeEmail] = useState(false)
  const [isProcessingJobs, setIsProcessingJobs] = useState(false)

  const handleLanguageChange = (newLocale: 'es' | 'en') => {
    setSelectedLanguage(newLocale)
    changeLanguage(newLocale)
    toast.success(t('messages.languageChanged'))
  }

  const handleTestEmail = async () => {
    setIsTestingEmail(true)
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          locale === 'es' 
            ? `Correo de prueba enviado exitosamente a ${data.sentTo}` 
            : `Test email sent successfully to ${data.sentTo}`
        )
      } else {
        throw new Error(data.error || 'Error enviando correo')
      }
    } catch (error) {
      console.error('Error testing email:', error)
      toast.error(
        locale === 'es' 
          ? 'Error enviando correo de prueba. Revisa los logs del servidor.' 
          : 'Error sending test email. Check server logs.'
      )
    } finally {
      setIsTestingEmail(false)
    }
  }

  const handleTestWelcomeEmail = async () => {
    setIsTestingWelcomeEmail(true)
    try {
      const response = await fetch('/api/test-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          locale === 'es' 
            ? `Correo de bienvenida (registro) enviado exitosamente a ${data.sentTo}` 
            : `Welcome email (registration) sent successfully to ${data.sentTo}`
        )
      } else {
        throw new Error(data.error || 'Error enviando correo')
      }
    } catch (error) {
      console.error('Error testing welcome email:', error)
      toast.error(
        locale === 'es' 
          ? 'Error enviando correo de bienvenida. Revisa los logs del servidor.' 
          : 'Error sending welcome email. Check server logs.'
      )
    } finally {
      setIsTestingWelcomeEmail(false)
    }
  }

  const handleProcessJobs = async () => {
    setIsProcessingJobs(true)
    try {
      const response = await fetch('/api/test-process-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        const results = data.processResult?.results
        toast.success(
          locale === 'es' 
            ? `Jobs procesados: ${results?.processed || 0} total, ${results?.succeeded || 0} exitosos, ${results?.failed || 0} fallidos` 
            : `Jobs processed: ${results?.processed || 0} total, ${results?.succeeded || 0} succeeded, ${results?.failed || 0} failed`
        )
      } else {
        throw new Error(data.error || 'Error procesando jobs')
      }
    } catch (error) {
      console.error('Error processing jobs:', error)
      toast.error(
        locale === 'es' 
          ? 'Error procesando jobs de email. Revisa los logs del servidor.' 
          : 'Error processing email jobs. Check server logs.'
      )
    } finally {
      setIsProcessingJobs(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
      </div>

      <div className="grid gap-6">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <CardTitle>{t('settings.language')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.selectLanguage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t('settings.language')}</Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value: 'es' | 'en') => handleLanguageChange(value)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder={t('settings.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">
                    🇪🇸 {t('settings.spanish')}
                  </SelectItem>
                  <SelectItem value="en">
                    🇺🇸 {t('settings.english')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-600">
              {locale === 'es' 
                ? 'Los cambios se aplicarán inmediatamente y se recordarán en futuras visitas.'
                : 'Changes will be applied immediately and remembered for future visits.'
              }
            </p>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <CardTitle>{t('settings.account')}</CardTitle>
            </div>
            <CardDescription>
              {locale === 'es' 
                ? 'Gestiona tu información de cuenta y preferencias'
                : 'Manage your account information and preferences'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                {t('settings.profile')}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                {t('settings.security')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <CardTitle>{t('settings.notifications')}</CardTitle>
            </div>
            <CardDescription>
              {locale === 'es'
                ? 'Configura cómo y cuándo recibir notificaciones'
                : 'Configure how and when you receive notifications'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start">
              <Bell className="h-4 w-4 mr-2" />
              {t('settings.notifications')}
            </Button>
          </CardContent>
        </Card>

        {/* Email Testing */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <CardTitle>
                {locale === 'es' ? 'Prueba de Correo' : 'Email Testing'}
              </CardTitle>
            </div>
            <CardDescription>
              {locale === 'es'
                ? 'Envía un correo de prueba para verificar que la configuración funciona correctamente'
                : 'Send a test email to verify that the configuration works correctly'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleTestEmail}
                disabled={isTestingEmail}
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isTestingEmail 
                  ? (locale === 'es' ? 'Enviando...' : 'Sending...') 
                  : (locale === 'es' ? 'Enviar Correo de Prueba' : 'Send Test Email')
                }
              </Button>
              
              <Button 
                onClick={handleTestWelcomeEmail}
                disabled={isTestingWelcomeEmail}
                variant="outline"
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isTestingWelcomeEmail 
                  ? (locale === 'es' ? 'Enviando...' : 'Sending...') 
                  : (locale === 'es' ? 'Probar Correo de Registro' : 'Test Registration Email')
                }
              </Button>
              
              <Button 
                onClick={handleProcessJobs}
                disabled={isProcessingJobs}
                variant="secondary"
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isProcessingJobs 
                  ? (locale === 'es' ? 'Procesando...' : 'Processing...') 
                  : (locale === 'es' ? 'Procesar Jobs de Email' : 'Process Email Jobs')
                }
              </Button>
              
              <p className="text-sm text-gray-600">
                {locale === 'es'
                  ? 'Prueba el sistema de correos y procesa jobs pendientes manualmente. El cron job se ejecuta cada 2 minutos automáticamente.'
                  : 'Test the email system and manually process pending jobs. The cron job runs every 2 minutes automatically.'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <CardTitle>{t('settings.appearance')}</CardTitle>
            </div>
            <CardDescription>
              {locale === 'es'
                ? 'Personaliza la apariencia de la aplicación'
                : 'Customize the appearance of the application'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Palette className="h-4 w-4 mr-2" />
                {t('settings.theme')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}