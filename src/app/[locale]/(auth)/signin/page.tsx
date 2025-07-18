'use client'

import { useState, Suspense, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useTranslations } from '@/hooks/use-translations'

function SignInForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useTranslations()
  const { data: session, status } = useSession()
  
  const callbackUrl = searchParams.get('callbackUrl')
  const message = searchParams.get('message')

  // Create schema with localized messages
  const signinSchema = z.object({
    email: z.string()
      .min(1, { message: t('auth.signin.validation.emailRequired') })
      .email({ message: t('auth.signin.validation.emailInvalid') }),
    password: z.string()
      .min(1, { message: t('auth.signin.validation.passwordRequired') })
  })

  type SigninFormData = z.infer<typeof signinSchema>

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl || '/dashboard')
    }
  }, [session, status, router, callbackUrl])

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

  const onSubmit = async (data: SigninFormData) => {
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('auth.signin.invalidCredentials'))
      } else {
        // Redirect after successful login
        if (callbackUrl) {
          router.push(callbackUrl)
        } else {
          router.push(`/${locale}/dashboard`)
        }
      }
    } catch (err) {
      console.error('Signin error:', err)
      setError(t('auth.signin.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      await signIn('google', {
        callbackUrl: callbackUrl || `/${locale}/dashboard`
      })
    } catch (err) {
      console.error('Google signin error:', err)
      setError(t('auth.signin.error'))
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
        <CardTitle className="text-2xl text-center">{t('auth.signin.title')}</CardTitle>
        <CardDescription className="text-center">
          {t('auth.signin.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Google Sign In */}
        <Button 
          type="button" 
          variant="outline" 
          className="w-full" 
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t('auth.signin.googleButton')}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.signin.orContinue')}
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.signin.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.signin.emailPlaceholder')}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.signin.password')}</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full text-white cursor-pointer" disabled={loading}>
            {loading ? t('auth.signin.signingIn') : t('auth.signin.signInButton')}
          </Button>
          <div className="text-center">
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              {t('auth.signin.forgotPassword')}
            </Link>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-center w-full">
          {t('auth.signin.noAccount')}{' '}
          <Link 
            href={callbackUrl ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/signup'} 
            className="text-primary hover:underline"
          >
            {t('auth.signin.signUp')}
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  )
}