'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/stores/family-store'
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
        toast.success(`Family "${newFamily.name}" created successfully!`)
        setCreateDialogOpen(false)
        setFormData({ name: '', description: '' })
        await refreshFamilies()
        switchFamily(newFamily.id)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to create family')
      }
    } catch (error) {
      console.error('Error creating family:', error)
      toast.error('Failed to create family')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentFamily) return

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
        toast.success(`Invitation sent to ${inviteData.email}!`, {
          description: 'They will receive an email with instructions to join.'
        })
        setInviteDialogOpen(false)
        setInviteData({ email: '', role: 'MEMBER' })
        await refreshFamilies()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error('Failed to send invitation')
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
        <span className="text-sm text-muted-foreground">No family selected</span>
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
        {currentFamily.memberCount} member{currentFamily.memberCount !== 1 ? 's' : ''}
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
                <DialogTitle>Invite Family Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join {currentFamily.name}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@example.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={inviteData.role} 
                    onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-4 w-4 text-amber-600" />
                          <div>
                            <div className="font-medium">Admin</div>
                            <div className="text-xs text-muted-foreground">Full access</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEMBER">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-medium">Member</div>
                            <div className="text-xs text-muted-foreground">Add transactions & budgets</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="VIEWER">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-gray-600" />
                          <div>
                            <div className="font-medium">Viewer</div>
                            <div className="text-xs text-muted-foreground">View only</div>
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
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send Invitation'}
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
              <DialogTitle>Create New Family</DialogTitle>
              <DialogDescription>
                Create a new family group to manage finances together
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Family Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., The Smith Family"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Family financial planning"
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
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Family'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}