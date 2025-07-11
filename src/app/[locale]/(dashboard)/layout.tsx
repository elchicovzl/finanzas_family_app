'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { FamilySelector } from '@/components/FamilySelector'
import { LanguageSwitcher } from '@/components/language-switcher'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { useFamilyStore } from '@/stores/family-store'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { fetchFamilies, reset } = useFamilyStore()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/signin')
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFamilies()
    } else if (status === 'unauthenticated') {
      reset()
    }
  }, [status, fetchFamilies, reset])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center space-x-4">
            <FamilySelector />
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}