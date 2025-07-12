'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from '@/hooks/use-translations'
import {
  LayoutDashboard,
  CreditCard,
  Target,
  Settings,
  Receipt,
  Users,
  Bell,
  LogOut,
  User
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = useTranslations()
  const navigation = getNavigation(t)

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center px-4 py-2">
          <Image
            src="/logo.png"
            alt="FamFinz Logo"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        {session?.user && (
          <div className="p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-auto p-2">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {session.user.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {session.user.email}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" side="top">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}