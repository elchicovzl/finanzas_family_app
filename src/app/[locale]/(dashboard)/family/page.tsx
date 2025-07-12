'use client'

import { FamilyMemberList } from '@/components/FamilyMemberList'
import { useFamilyStore } from '@/stores/family-store'
import { useTranslations } from '@/hooks/use-translations'

export default function FamilyPage() {
  const { currentFamily } = useFamilyStore()
  const { t } = useTranslations()

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{t('family.title')}</h2>
          <p className="text-muted-foreground">
            {currentFamily ? t('family.description', { familyName: currentFamily.name }) : t('family.descriptionDefault')}
          </p>
        </div>
      </div>

      <FamilyMemberList />
    </div>
  )
}