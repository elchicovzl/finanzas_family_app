'use client'

import { useState, useEffect, useCallback } from 'react'
import { useFamilyStore } from '@/stores/family-store'
import { useTranslations } from '@/hooks/use-translations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Crown, 
  User, 
  Eye, 
  MoreVertical, 
  UserMinus, 
  Shield,
  Calendar,
  Users,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'
import { PageLoader } from '@/components/ui/page-loader'

interface FamilyMember {
  id: string
  role: 'ADMIN' | 'MEMBER' | 'VIEWER'
  joinedAt: string
  isActive: boolean
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface FamilyInvitation {
  id: string
  email: string
  role: 'ADMIN' | 'MEMBER' | 'VIEWER'
  createdAt: string
  expiresAt: string
  invitedBy: {
    name: string | null
    email: string
  }
}

export function FamilyMemberList() {
  const { currentFamily, refreshFamilies } = useFamilyStore()
  const { t } = useTranslations()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    if (!currentFamily) return

    try {
      const response = await fetch(`/api/families/${currentFamily.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error(t('family.failedToLoadMembers'))
    } finally {
      setLoading(false)
    }
  }, [currentFamily, t])

  useEffect(() => {
    if (currentFamily) {
      fetchMembers()
    }
  }, [currentFamily, fetchMembers])

  const removeMember = async (memberId: string) => {
    if (!currentFamily) return

    try {
      const response = await fetch(`/api/families/${currentFamily.id}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(t('family.memberRemovedSuccess'))
        await fetchMembers()
        await refreshFamilies()
      } else {
        const error = await response.json()
        toast.error(error.error || t('family.failedToRemoveMember'))
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error(t('family.failedToRemoveMember'))
    }
  }

  const updateMemberRole = async (memberId: string, newRole: 'ADMIN' | 'MEMBER' | 'VIEWER') => {
    if (!currentFamily) return

    try {
      const response = await fetch(`/api/families/${currentFamily.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        toast.success(t('family.memberRoleUpdated'))
        await fetchMembers()
        await refreshFamilies()
      } else {
        const error = await response.json()
        toast.error(error.error || t('family.failedToUpdateRole'))
      }
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error(t('family.failedToUpdateRole'))
    }
  }

  const cancelInvitation = async (invitationId: string) => {
    if (!currentFamily) return

    try {
      const response = await fetch(`/api/families/${currentFamily.id}/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(t('family.invitationCancelled'))
        await fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || t('family.failedToCancelInvitation'))
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast.error(t('family.failedToCancelInvitation'))
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-amber-600" />
      case 'MEMBER':
        return <User className="h-4 w-4 text-blue-600" />
      case 'VIEWER':
        return <Eye className="h-4 w-4 text-gray-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-amber-100 text-amber-800'
      case 'MEMBER':
        return 'bg-blue-100 text-blue-800'
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const isCurrentUserAdmin = currentFamily?.myRole === 'ADMIN'
  const canManageMembers = isCurrentUserAdmin

  if (!currentFamily) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('family.noFamilySelected')}</h3>
            <p className="text-muted-foreground">{t('family.noFamilySelectedDesc')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return <PageLoader size="md" fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      {/* Family Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{t('family.familyMembers')}</span>
            <Badge variant="outline">{members.length}</Badge>
          </CardTitle>
          <CardDescription>
            {t('family.manageMembers', { familyName: currentFamily.name })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback>
                      {getInitials(member.user.name, member.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                      <span className="font-medium">
                        {member.user.name || member.user.email}
                      </span>
                      <Badge className={getRoleColor(member.role)} variant="secondary">
                        <span className="flex items-center space-x-1">
                          {getRoleIcon(member.role)}
                          <span className="text-xs">{t(`family.${member.role}`)}</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{member.user.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{t('family.joined')} {new Date(member.joinedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end sm:justify-start">
                  {canManageMembers && member.role !== 'ADMIN' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'ADMIN')}>
                        <Crown className="mr-2 h-4 w-4 text-amber-600" />
                        {t('family.makeAdmin')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'MEMBER')}>
                        <User className="mr-2 h-4 w-4 text-blue-600" />
                        {t('family.makeMember')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'VIEWER')}>
                        <Eye className="mr-2 h-4 w-4 text-gray-600" />
                        {t('family.makeViewer')}
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <UserMinus className="mr-2 h-4 w-4 text-red-600" />
                            {t('family.removeMember')}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('family.removeMemberTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('family.removeMemberDesc', { memberName: member.user.name || member.user.email })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => removeMember(member.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t('family.removeMember')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {member.role === 'ADMIN' && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      <Shield className="mr-1 h-3 w-3" />
                      {t('family.adminBadge')}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>{t('family.pendingInvitations')}</span>
              <Badge variant="outline">{invitations.length}</Badge>
            </CardTitle>
            <CardDescription>
              {t('family.invitationsNotAccepted')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                      <span className="font-medium">{invitation.email}</span>
                      <Badge className={getRoleColor(invitation.role)} variant="secondary">
                        <span className="flex items-center space-x-1">
                          {getRoleIcon(invitation.role)}
                          <span className="text-xs">{t(`family.${invitation.role}`)}</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-sm text-muted-foreground">
                      <span>{t('family.invitedBy')} {invitation.invitedBy.name || invitation.invitedBy.email}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{t('family.expires')} {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end sm:justify-start">
                    {canManageMembers && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            {t('family.cancel')}
                          </Button>
                        </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('family.cancelInvitationTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('family.cancelInvitationDesc', { email: invitation.email })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('family.keepInvitation')}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => cancelInvitation(invitation.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {t('family.cancelInvitationAction')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}