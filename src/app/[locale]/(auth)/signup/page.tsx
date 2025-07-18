'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTranslations } from '@/hooks/use-translations'

function SignUpForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslations()
  const { data: session, status } = useSession()
  
  const callbackUrl = searchParams.get('callbackUrl')
  const inviteEmail = searchParams.get('email')

  // Create schema with localized messages
  const signupSchema = z.object({
    name: z.string()
      .min(1, { message: t('auth.signup.validation.nameRequired') })
      .min(2, { message: t('auth.signup.validation.nameMinLength') }),
    email: z.string()
      .min(1, { message: t('auth.signup.validation.emailRequired') })
      .email({ message: t('auth.signup.validation.emailInvalid') }),
    password: z.string()
      .min(1, { message: t('auth.signup.validation.passwordRequired') })
      .min(6, { message: t('auth.signup.validation.passwordMinLength') }),
    confirmPassword: z.string()
      .min(1, { message: t('auth.signup.validation.confirmPasswordRequired') }),
    acceptTerms: z.boolean()
      .refine((val) => val === true, {
        message: t('auth.signup.validation.termsRequired')
      })
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.signup.validation.passwordMismatch'),
    path: ['confirmPassword']
  })

  type SignupFormData = z.infer<typeof signupSchema>

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: inviteEmail || '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    }
  })

  const acceptTerms = watch('acceptTerms')
  
  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl || '/dashboard')
    }
  }, [session, status, router, callbackUrl])
  
  useEffect(() => {
    if (inviteEmail) {
      setValue('email', inviteEmail)
    }
  }, [inviteEmail, setValue])

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

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: data.name, 
          email: data.email, 
          password: data.password 
        }),
      })

      if (response.ok) {
        const redirectUrl = callbackUrl 
          ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&message=Account created successfully`
          : '/signin?message=Account created successfully'
        router.push(redirectUrl)
      } else {
        const responseData = await response.json()
        setError(responseData.error || 'An error occurred')
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
      <form onSubmit={handleSubmit(onSubmit)}>
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
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.signup.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.signup.emailPlaceholder')}
              {...register('email')}
              disabled={!!inviteEmail}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.signup.password')}</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.signup.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="acceptTerms" 
              checked={acceptTerms}
              onCheckedChange={(checked) => setValue('acceptTerms', !!checked)}
            />
            <Label htmlFor="acceptTerms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t('auth.signup.terms.acceptTerms')}{' '}
              <Link href="#" className="text-primary hover:underline">
                {t('auth.signup.terms.termsLink')}
              </Link>
            </Label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-red-600">{errors.acceptTerms.message}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full mt-6 text-white cursor-pointer" disabled={loading}>
            {loading ? t('auth.signup.creatingAccount') : t('auth.signup.createButton')}
          </Button>
          <div className="text-sm text-center">
            {t('auth.signup.hasAccount')}{' '}
            <Link href="/signin" className="text-primary hover:underline">
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