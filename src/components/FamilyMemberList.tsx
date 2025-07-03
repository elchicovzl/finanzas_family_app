'use client'

import { useState, useEffect, useCallback } from 'react'
import { useFamily } from '@/contexts/FamilyContext'
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
  const { currentFamily, refreshFamilies } = useFamily()
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
      toast.error('Failed to load family members')
    } finally {
      setLoading(false)
    }
  }, [currentFamily])

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
        toast.success('Member removed from family')
        await fetchMembers()
        await refreshFamilies()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
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
        toast.success('Member role updated')
        await fetchMembers()
        await refreshFamilies()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update member role')
      }
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error('Failed to update member role')
    }
  }

  const cancelInvitation = async (invitationId: string) => {
    if (!currentFamily) return

    try {
      const response = await fetch(`/api/families/${currentFamily.id}/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Invitation cancelled')
        await fetchMembers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to cancel invitation')
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast.error('Failed to cancel invitation')
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
            <h3 className="text-lg font-semibold mb-2">No Family Selected</h3>
            <p className="text-muted-foreground">Select a family to view members</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Family Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Family Members</span>
            <Badge variant="outline">{members.length}</Badge>
          </CardTitle>
          <CardDescription>
            Manage {currentFamily.name} members and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback>
                      {getInitials(member.user.name, member.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {member.user.name || member.user.email}
                      </span>
                      <Badge className={getRoleColor(member.role)} variant="secondary">
                        <span className="flex items-center space-x-1">
                          {getRoleIcon(member.role)}
                          <span className="text-xs">{member.role}</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{member.user.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

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
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'MEMBER')}>
                        <User className="mr-2 h-4 w-4 text-blue-600" />
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'VIEWER')}>
                        <Eye className="mr-2 h-4 w-4 text-gray-600" />
                        Make Viewer
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <UserMinus className="mr-2 h-4 w-4 text-red-600" />
                            Remove Member
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Family Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {member.user.name || member.user.email} from the family? 
                              This action cannot be undone and they will lose access to all family financial data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => removeMember(member.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove Member
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
                    Admin
                  </Badge>
                )}
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
              <span>Pending Invitations</span>
              <Badge variant="outline">{invitations.length}</Badge>
            </CardTitle>
            <CardDescription>
              Invitations that haven&apos;t been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{invitation.email}</span>
                      <Badge className={getRoleColor(invitation.role)} variant="secondary">
                        <span className="flex items-center space-x-1">
                          {getRoleIcon(invitation.role)}
                          <span className="text-xs">{invitation.role}</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Invited by {invitation.invitedBy.name || invitation.invitedBy.email}</span>
                      <span>•</span>
                      <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {canManageMembers && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel the invitation for {invitation.email}? 
                            They will not be able to join the family using this invitation.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => cancelInvitation(invitation.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Cancel Invitation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}