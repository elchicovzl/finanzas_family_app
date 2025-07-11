'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from '@/hooks/use-translations'
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  BarChart3, 
  CreditCard,
  Target,
  Users,
  Smartphone
} from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const { t, locale } = useTranslations()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (session) {
      router.push(`/${locale}/dashboard`)
    }
  }, [session, status, router, locale])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Finanzas App
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {locale === 'es' 
              ? 'Toma el control de tus finanzas personales con integración bancaria automatizada, presupuestos inteligentes y análisis poderosos. Conecta con Bancolombia y más.'
              : 'Take control of your personal finances with automated bank integration, smart budgeting, and powerful analytics. Connect with Bancolombia and more.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                {locale === 'es' ? 'Comenzar Gratis' : 'Get Started Free'}
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {locale === 'es' ? 'Iniciar Sesión' : 'Sign In'}
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>
                {locale === 'es' ? 'Integración Bancaria' : 'Bank Integration'}
              </CardTitle>
              <CardDescription>
                {locale === 'es' 
                  ? 'Conecta de forma segura tus cuentas de Bancolombia con la API de Belvo para sincronización automática de transacciones'
                  : 'Securely connect your Bancolombia accounts with Belvo API for automatic transaction synchronization'
                }
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>
                {locale === 'es' ? 'Análisis Inteligentes' : 'Smart Analytics'}
              </CardTitle>
              <CardDescription>
                {locale === 'es'
                  ? 'Visualiza tus patrones de gastos con gráficos interactivos y obtén insights sobre tus hábitos financieros'
                  : 'Visualize your spending patterns with interactive charts and get insights into your financial habits'
                }
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>
                {locale === 'es' ? 'Gestión de Presupuestos' : 'Budget Management'}
              </CardTitle>
              <CardDescription>
                {locale === 'es'
                  ? 'Establece límites de gastos por categoría y recibe alertas cuando te acerques a tus límites de presupuesto'
                  : 'Set spending limits by category and get alerts when you\'re approaching your budget limits'
                }
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>
                {locale === 'es' ? 'Metas Financieras' : 'Financial Goals'}
              </CardTitle>
              <CardDescription>
                {locale === 'es'
                  ? 'Rastrea tus metas de ahorro y monitorea tu progreso hacia hitos financieros importantes'
                  : 'Track your savings goals and monitor your progress towards financial milestones'
                }
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>
                {locale === 'es' ? 'Finanzas Familiares' : 'Family Finance'}
              </CardTitle>
              <CardDescription>
                {locale === 'es'
                  ? 'Gestiona presupuestos familiares con múltiples miembros de la familia y rastrea gastos compartidos'
                  : 'Manage household budgets with multiple family members and track shared expenses'
                }
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-gray-600" />
              </div>
              <CardTitle>
                {locale === 'es' ? 'Seguridad Bancaria' : 'Bank-Level Security'}
              </CardTitle>
              <CardDescription>
                {locale === 'es'
                  ? 'Tus datos financieros están protegidos con seguridad y estándares de encriptación de nivel empresarial'
                  : 'Your financial data is protected with enterprise-grade security and encryption standards'
                }
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="mb-16">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Badge variant="secondary" className="px-4 py-2">
                {locale === 'es' ? 'Impulsado por la API de Belvo' : 'Powered by Belvo API'}
              </Badge>
            </div>
            <CardTitle className="text-2xl">
              {locale === 'es' ? 'Integración Bancaria Confiable' : 'Trusted Bank Integration'}
            </CardTitle>
            <CardDescription className="text-lg">
              {locale === 'es'
                ? 'Conecta de forma segura con Bancolombia y otros bancos colombianos importantes'
                : 'Connect securely with Bancolombia and other major Colombian banks'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">
                  {locale === 'es' ? 'Conexión Segura' : 'Secure Connection'}
                </h3>
                <p className="text-sm text-gray-600">
                  {locale === 'es'
                    ? 'Seguridad de nivel bancario con acceso de solo lectura a tus cuentas'
                    : 'Bank-grade security with read-only access to your accounts'
                  }
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">
                  {locale === 'es' ? 'Sincronización en Tiempo Real' : 'Real-time Sync'}
                </h3>
                <p className="text-sm text-gray-600">
                  {locale === 'es'
                    ? 'Actualizaciones automáticas de transacciones y sincronización de saldos'
                    : 'Automatic transaction updates and balance synchronization'
                  }
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">
                  {locale === 'es' ? 'Configuración Fácil' : 'Easy Setup'}
                </h3>
                <p className="text-sm text-gray-600">
                  {locale === 'es'
                    ? 'Conecta tu cuenta bancaria en minutos con nuestro flujo simple'
                    : 'Connect your bank account in minutes with our simple flow'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {locale === 'es' 
              ? '¿Listo para tomar el control de tus finanzas?' 
              : 'Ready to take control of your finances?'
            }
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {locale === 'es'
              ? 'Únete a miles de usuarios gestionando su dinero de manera más inteligente con Finanzas App'
              : 'Join thousands of users managing their money smarter with Finanzas App'
            }
          </p>
          <Link href="/signup">
            <Button size="lg">
              {locale === 'es' ? 'Comienza tu Jornada Financiera' : 'Start Your Financial Journey'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}