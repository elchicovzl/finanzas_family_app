'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CreditCard,
  PieChart,
  Target,
  Settings,
  Receipt,
  Users
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: Receipt,
  },
  {
    name: 'Budget',
    href: '/budget',
    icon: Target,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: PieChart,
  },
  {
    name: 'Accounts',
    href: '/accounts',
    icon: CreditCard,
  },
  {
    name: 'Family',
    href: '/family',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)}>
      {navigation.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.name}
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