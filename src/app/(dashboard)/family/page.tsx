'use client'

import { FamilyMemberList } from '@/components/FamilyMemberList'
import { useFamilyStore } from '@/stores/family-store'

export default function FamilyPage() {
  const { currentFamily } = useFamilyStore()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Family Management</h2>
          <p className="text-muted-foreground">
            {currentFamily ? `Manage members and permissions for ${currentFamily.name}` : 'Manage your family members and permissions'}
          </p>
        </div>
      </div>

      <FamilyMemberList />
    </div>
  )
}