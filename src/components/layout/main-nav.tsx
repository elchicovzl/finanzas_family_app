'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/hooks/use-translations'
import {
  LayoutDashboard,
  CreditCard,
  PieChart,
  Target,
  Settings,
  Receipt,
  Users,
  Bell
} from 'lucide-react'

const getNavigation = (t: (key: string) => string) => [
  {
    name: t('navigation.dashboard'),
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: t('navigation.transactions'),
    href: '/transactions',
    icon: Receipt,
  },
  {
    name: t('navigation.budget'),
    href: '/budget',
    icon: Target,
  },
  {
    name: t('navigation.reminders'),
    href: '/reminders',
    icon: Bell,
  },
  {
    name: t('navigation.accounts'),
    href: '/accounts',
    icon: CreditCard,
  },
  {
    name: t('navigation.family'),
    href: '/family',
    icon: Users,
  },
  {
    name: t('navigation.settings'),
    href: '/settings',
    icon: Settings,
  },
]

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname()
  const { t } = useTranslations()
  const navigation = getNavigation(t)

  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)}>
      {navigation.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
              pathname === item.href
                ? 'text-black dark:text-white'
                : 'text-muted-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline-block">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}