'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface InvitationData {
  id: string
  email: string
  role: string
  family: {
    id: string
    name: string
    description?: string
    createdAt: string
  }
  invitedBy: {
    name: string | null
    email: string
  }
  expiresAt: string
  createdAt: string
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = params.token as string

  useEffect(() => {
    if (token) {
      fetchInvitation()
    }
  }, [token])

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/families/invitations/${token}`)
      
      if (response.ok) {
        const data = await response.json()
        setInvitation(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load invitation')
      }
    } catch (error) {
      console.error('Error fetching invitation:', error)
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!session) {
      toast.error('Please sign in to accept the invitation')
      router.push(`/signin?callbackUrl=/invite/${token}`)
      return
    }

    if (session.user?.email !== invitation?.email) {
      toast.error('This invitation was sent to a different email address')
      return
    }

    setAccepting(true)

    try {
      const response = await fetch('/api/families/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully joined ${data.family.name}!`)
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to accept invitation')
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'MEMBER':
        return 'bg-blue-100 text-blue-800'
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Full access: manage members, connect accounts, view all data'
      case 'MEMBER':
        return 'Add transactions, create budgets, view family finances'
      case 'VIEWER':
        return 'View-only access to family financial data'
      default:
        return 'Member access'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600">Invitation not found</h1>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const isExpired = new Date(invitation.expiresAt) < new Date()
  const isWrongEmail = session?.user?.email !== invitation.email

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Family Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a family on Finanzas App
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Family Info */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">{invitation.family.name}</h3>
            {invitation.family.description && (
              <p className="text-muted-foreground">{invitation.family.description}</p>
            )}
          </div>

          {/* Invitation Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Invited by:</span>
              <span className="font-medium">
                {invitation.invitedBy.name || invitation.invitedBy.email}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Your role:</span>
              <Badge className={getRoleColor(invitation.role)}>
                {invitation.role}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expires:</span>
              <span className="text-sm font-medium">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Role Description */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>As a {invitation.role.toLowerCase()}:</strong> {getRoleDescription(invitation.role)}
            </p>
          </div>

          {/* Warnings */}
          {isExpired && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This invitation has expired and can no longer be accepted.
              </AlertDescription>
            </Alert>
          )}

          {status === 'authenticated' && isWrongEmail && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This invitation was sent to {invitation.email}, but you're signed in as {session.user?.email}. 
                Please sign in with the correct account.
              </AlertDescription>
            </Alert>
          )}

          {status === 'unauthenticated' && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Please sign in with the email address {invitation.email} to accept this invitation.
                Don't have an account? You can create one and the invitation will be automatically accepted.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {status === 'authenticated' && !isWrongEmail && !isExpired ? (
              <Button 
                className="w-full" 
                onClick={handleAcceptInvitation}
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>
            ) : !isExpired && (
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/signin?callbackUrl=/invite/${token}`)}
                >
                  Sign In to Accept
                </Button>
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={() => router.push(`/signup?callbackUrl=/invite/${token}&email=${encodeURIComponent(invitation.email)}`)}
                >
                  Create Account & Accept
                </Button>
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}