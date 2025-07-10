'use client'

import { FamilyMemberList } from '@/components/FamilyMemberList'
import { useFamilyStore } from '@/stores/family-store'
import { useTranslations } from '@/hooks/use-translations'

export default function FamilyPage() {
  const { currentFamily } = useFamilyStore()
  const { t } = useTranslations()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
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