'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/stores/family-store'
import { useTranslations } from '@/hooks/use-translations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Plus, 
  Crown, 
  User, 
  Eye,
  UserPlus
} from 'lucide-react'
import { toast } from 'sonner'

export function FamilySelector() {
  const { families, currentFamily, switchFamily, refreshFamilies } = useFamilyStore()
  const { t } = useTranslations()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'MEMBER'
  })
  const [emailError, setEmailError] = useState('')

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newFamily = await response.json()
        toast.success(t('family.createFamilyModal.success', { name: newFamily.name }))
        setCreateDialogOpen(false)
        setFormData({ name: '', description: '' })
        await refreshFamilies()
        switchFamily(newFamily.id)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || t('family.createFamilyModal.error'))
      }
    } catch (error) {
      console.error('Error creating family:', error)
      toast.error(t('family.createFamilyModal.error'))
    } finally {
      setLoading(false)
    }
  }

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (email: string) => {
    setInviteData(prev => ({ ...prev, email }))
    if (email && !validateEmail(email)) {
      setEmailError(t('family.inviteMemberModal.invalidEmail'))
    } else {
      setEmailError('')
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentFamily) return

    // Validate email before sending
    if (!inviteData.email) {
      setEmailError(t('family.inviteMemberModal.emailRequired'))
      return
    }

    if (!validateEmail(inviteData.email)) {
      setEmailError(t('family.inviteMemberModal.invalidEmail'))
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/families/${currentFamily.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      })

      if (response.ok) {
        await response.json()
        toast.success(t('family.inviteMemberModal.success', { email: inviteData.email }), {
          description: t('family.inviteMemberModal.successDescription')
        })
        setInviteDialogOpen(false)
        setInviteData({ email: '', role: 'MEMBER' })
        await refreshFamilies()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || t('family.inviteMemberModal.error'))
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error(t('family.inviteMemberModal.error'))
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-3 w-3 text-amber-600" />
      case 'MEMBER':
        return <User className="h-3 w-3 text-blue-600" />
      case 'VIEWER':
        return <Eye className="h-3 w-3 text-gray-600" />
      default:
        return <User className="h-3 w-3 text-gray-600" />
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

  if (!currentFamily) {
    return (
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t('family.familySelector.noFamilySelected')}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Family Selector */}
      <div className="flex items-center space-x-2">
        <Users className="hidden sm:block h-4 w-4 text-muted-foreground" />
        <Select value={currentFamily.id} onValueChange={switchFamily}>
          <SelectTrigger className="w-[140px] sm:w-[180px] md:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {families.map((family) => (
              <SelectItem key={family.id} value={family.id}>
                <div className="flex items-center space-x-2">
                  <span>{family.name}</span>
                  <Badge className={getRoleColor(family.myRole)} variant="secondary">
                    <span className="flex items-center space-x-1">
                      {getRoleIcon(family.myRole)}
                      <span className="text-xs">{family.myRole}</span>
                    </span>
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Member Count - Hidden on mobile */}
      <Badge variant="outline" className="hidden sm:inline-flex">
        {currentFamily.memberCount} {currentFamily.memberCount === 1 ? t('family.familySelector.member') : t('family.familySelector.members')}
      </Badge>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1">
        {/* Invite Member (Only for ADMIN) */}
        {currentFamily.myRole === 'ADMIN' && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('family.inviteMemberModal.title')}</DialogTitle>
                <DialogDescription>
                  {t('family.inviteMemberModal.description', { familyName: currentFamily.name })}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('family.inviteMemberModal.emailAddress')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('family.inviteMemberModal.emailPlaceholder')}
                    value={inviteData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={emailError ? 'border-red-500' : ''}
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-red-500 mt-1">{emailError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t('family.inviteMemberModal.role')}</Label>
                  <Select 
                    value={inviteData.role} 
                    onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="h-auto min-h-[40px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full max-w-[400px]">
                      <SelectItem value="ADMIN" className="py-3">
                        <div className="flex items-center space-x-3 w-full">
                          <Crown className="h-5 w-5 text-amber-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{t('family.inviteMemberModal.adminRole')}</div>
                            <div className="text-xs text-muted-foreground leading-tight">{t('family.inviteMemberModal.adminRoleDescription')}</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEMBER" className="py-3">
                        <div className="flex items-center space-x-3 w-full">
                          <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{t('family.inviteMemberModal.memberRole')}</div>
                            <div className="text-xs text-muted-foreground leading-tight">{t('family.inviteMemberModal.memberRoleDescription')}</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="VIEWER" className="py-3">
                        <div className="flex items-center space-x-3 w-full">
                          <Eye className="h-5 w-5 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{t('family.inviteMemberModal.viewerRole')}</div>
                            <div className="text-xs text-muted-foreground leading-tight">{t('family.inviteMemberModal.viewerRoleDescription')}</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    {t('family.inviteMemberModal.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={loading || !!emailError}
                  >
                    {loading ? t('family.inviteMemberModal.sending') : t('family.inviteMemberModal.sendInvitation')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Create Family */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('family.createFamilyModal.title')}</DialogTitle>
              <DialogDescription>
                {t('family.createFamilyModal.description')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('family.createFamilyModal.familyName')}</Label>
                <Input
                  id="name"
                  placeholder={t('family.createFamilyModal.familyNamePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('family.createFamilyModal.description')}</Label>
                <Input
                  id="description"
                  placeholder={t('family.createFamilyModal.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  {t('family.createFamilyModal.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? t('family.createFamilyModal.creating') : t('family.createFamilyModal.create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}