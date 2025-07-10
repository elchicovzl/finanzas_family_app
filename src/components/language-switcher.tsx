'use client'

import { useTranslations } from '@/hooks/use-translations'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { locale, changeLanguage, t } = useTranslations()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {locale === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => changeLanguage('es')}
          className={locale === 'es' ? 'bg-accent' : ''}
        >
          <span className="flex items-center space-x-2">
            <span>🇪🇸</span>
            <span>{t('settings.spanish')}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={locale === 'en' ? 'bg-accent' : ''}
        >
          <span className="flex items-center space-x-2">
            <span>🇺🇸</span>
            <span>{t('settings.english')}</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}