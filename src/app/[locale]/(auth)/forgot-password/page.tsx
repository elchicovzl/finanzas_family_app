'use client'

import { useState } from 'react'
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
import { CheckCircle } from 'lucide-react'
import { useTranslations } from '@/hooks/use-translations'

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslations()

  // Create schema with localized messages
  const forgotPasswordSchema = z.object({
    email: z.string()
      .min(1, { message: t('auth.forgotPassword.validation.emailRequired') })
      .email({ message: t('auth.forgotPassword.validation.emailInvalid') })
  })

  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const responseData = await response.json()
        setError(responseData.error || 'An error occurred')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
          <CardTitle className="text-2xl text-center">{t('auth.forgotPassword.emailSent')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.forgotPassword.emailSentDescription')}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <div className="w-full text-center text-xs">
            <Link href="/signin" className="text-primary hover:underline">
              {t('auth.forgotPassword.backToSignin')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    )
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
        <CardTitle className="text-2xl text-center">{t('auth.forgotPassword.title')}</CardTitle>
        <CardDescription className="text-center">
          {t('auth.forgotPassword.description')}
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
            <Label htmlFor="email">{t('auth.forgotPassword.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.forgotPassword.emailPlaceholder')}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button type="submit" className="w-full text-white cursor-pointer" disabled={loading}>
            {loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendButton')}
          </Button>
          <div className="text-xs text-center">
            <Link href="/signin" className="text-primary hover:underline">
              {t('auth.forgotPassword.backToSignin')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}