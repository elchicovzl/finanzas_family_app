'use client'

import { useState, useEffect, Suspense } from 'react'
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
import { CheckCircle, XCircle } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'

function ResetPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslations()

  const token = searchParams.get('token')

  // Create schema with localized messages
  const resetPasswordSchema = z.object({
    password: z.string()
      .min(1, { message: t('auth.resetPassword.validation.passwordRequired') })
      .min(6, { message: t('auth.resetPassword.validation.passwordMinLength') }),
    confirmPassword: z.string()
      .min(1, { message: t('auth.resetPassword.validation.confirmPasswordRequired') })
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.resetPassword.validation.passwordMismatch'),
    path: ['confirmPassword']
  })

  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  })

  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }
    setTokenValid(true)
  }, [token])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password
        }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const responseData = await response.json()
        setError(responseData.error || 'An error occurred')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking token
  if (tokenValid === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Invalid token
  if (!tokenValid) {
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
          <div className="flex justify-center mb-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-center">{t('auth.resetPassword.invalidToken')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.resetPassword.invalidTokenDescription')}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4">
          <Link href="/forgot-password" className="w-full">
            <Button className="w-full" variant="outline">
              Solicitar nuevo enlace
            </Button>
          </Link>
          <div className="text-sm text-center">
            <Link href="/signin" className="text-primary hover:underline">
              {t('auth.resetPassword.backToSignin')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    )
  }

  // Success state
  if (success) {
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
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-center">{t('auth.resetPassword.success')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.resetPassword.successDescription')}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/signin" className="w-full">
            <Button className="w-full text-white cursor-pointer">
              {t('auth.resetPassword.backToSignin')}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Reset password form
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
        <CardTitle className="text-2xl text-center">{t('auth.resetPassword.title')}</CardTitle>
        <CardDescription className="text-center">
          {t('auth.resetPassword.description')}
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
            <Label htmlFor="password">{t('auth.resetPassword.newPassword')}</Label>
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
            <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button type="submit" className="w-full text-white cursor-pointer" disabled={loading}>
            {loading ? t('auth.resetPassword.resetting') : t('auth.resetPassword.resetButton')}
          </Button>
          <div className="text-xs text-center">
            <Link href="/signin" className="text-primary hover:underline">
              {t('auth.resetPassword.backToSignin')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}