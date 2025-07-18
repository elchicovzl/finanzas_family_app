'use client'

import { useState } from 'react'
import { useTranslations } from '@/hooks/use-translations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Settings, Globe, Palette, User, Bell, Shield } from 'lucide-react'
import { PageLoader } from '@/components/ui/page-loader'

export default function SettingsPage() {
  const { t, locale, changeLanguage, isLoading } = useTranslations()
  const [selectedLanguage, setSelectedLanguage] = useState<'es' | 'en'>(locale)

  const handleLanguageChange = (newLocale: 'es' | 'en') => {
    setSelectedLanguage(newLocale)
    changeLanguage(newLocale)
    toast.success(t('messages.languageChanged'))
  }


  if (isLoading) {
    return <PageLoader size="md" fullScreen={false} />
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