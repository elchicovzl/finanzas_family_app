'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTranslations } from '@/hooks/use-translations'

function SignUpForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslations()
  const { data: session, status } = useSession()
  
  const callbackUrl = searchParams.get('callbackUrl')
  const inviteEmail = searchParams.get('email')
  
  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl || '/dashboard')
    }
  }, [session, status, router, callbackUrl])
  
  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail)
    }
  }, [inviteEmail])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Don't render form if already authenticated
  if (status === 'authenticated') {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.signup.passwordMismatch'))
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (response.ok) {
        const redirectUrl = callbackUrl 
          ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&message=Account created successfully`
          : '/signin?message=Account created successfully'
        router.push(redirectUrl)
      } else {
        const data = await response.json()
        setError(data.error || 'An error occurred')
      }
    } catch (error) {
      setError(t('auth.signup.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="FamFinz Logo"
              width={120}
              height={40}
              className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>
        <CardTitle className="text-2xl text-center">{t('auth.signup.title')}</CardTitle>
        <CardDescription className="text-center">
          {inviteEmail 
            ? t('auth.signup.inviteDescription', { email: inviteEmail })
            : t('auth.signup.description')
          }
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{t('auth.signup.fullName')}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t('auth.signup.fullNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.signup.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.signup.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!inviteEmail}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.signup.password')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.signup.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.signup.creatingAccount') : t('auth.signup.createButton')}
          </Button>
          <div className="text-sm text-center">
            {t('auth.signup.hasAccount')}{' '}
            <Link href="/signin" className="text-blue-600 hover:underline">
              {t('auth.signup.signIn')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function SignUp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  )
}