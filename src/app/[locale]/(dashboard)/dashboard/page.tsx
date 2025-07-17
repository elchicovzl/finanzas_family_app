'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Plus,
  AlertCircle,
  Construction 
} from 'lucide-react'
import { toast } from 'sonner'
import AddTransactionModal from '@/components/AddTransactionModal'
import { useFamilyStore } from '@/stores/family-store'
import { useTranslations } from '@/hooks/use-translations'

interface DashboardData {
  totalBalance: number
  currentMonthIncome: number
  currentMonthExpenses: number
  incomeChange: number
  expenseChange: number
  recentTransactions: Array<{
    id: string
    description: string
    amount: number
    date: string
    category: string
    type: string
    createdBy: {
      name: string | null
      email: string
    }
  }>
  budgetOverview: Array<{
    categoryName: string
    categoryIcon: string
    categoryColor: string
    percentageUsed: number
    isOverBudget: boolean
    isNearLimit: boolean
  }>
  connectedAccounts: number
  hasConnectedAccounts: boolean
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { currentFamily } = useFamilyStore()
  const { t, locale } = useTranslations()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/analytics/overview')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        toast.error(t('messages.errorOccurred'))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error(t('messages.errorOccurred'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    const localeCode = locale === 'es' ? 'es-CO' : 'en-US'
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleUnderConstruction = (feature: string) => {
    toast.info(t('messages.underConstruction', { feature }), {
      description: t('messages.featureComingSoon'),
      style: {
        backgroundColor: 'white',
        color: '#1f2937',
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        opacity: 1
      },
      className: 'toast-custom',
      duration: 4000
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">
            {t('dashboard.welcomeBack')}, {session?.user?.name?.split(' ')[0]}!
          </h2>
          {currentFamily && (
            <p className="text-muted-foreground">
              {locale === 'es' ? 'Gestionando finanzas para' : 'Managing finances for'} <span className="font-medium">{currentFamily.name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => handleUnderConstruction('Bancolombia Integration')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.connectBank')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalBalance')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData?.totalBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {locale === 'es' ? 'Entre todas las cuentas' : 'Across all accounts'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.monthlyIncome')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(dashboardData?.currentMonthIncome || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.incomeChange !== undefined ? 
                `${dashboardData.incomeChange >= 0 ? '+' : ''}${dashboardData.incomeChange.toFixed(1)}% ${locale === 'es' ? 'del mes pasado' : 'from last month'}` :
                (locale === 'es' ? 'Sin datos de comparación' : 'No comparison data')
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.monthlyExpenses')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData?.currentMonthExpenses || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.expenseChange !== undefined ? 
                `${dashboardData.expenseChange >= 0 ? '+' : ''}${dashboardData.expenseChange.toFixed(1)}% ${locale === 'es' ? 'del mes pasado' : 'from last month'}` :
                (locale === 'es' ? 'Sin datos de comparación' : 'No comparison data')
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.savings')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              <Construction className="h-6 w-6 inline mr-2" />
              {locale === 'es' ? 'En Construcción' : 'Under Construction'}
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === 'es' ? 'Seguimiento de ahorros próximamente' : 'Savings tracking coming soon'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t('dashboard.recentTransactions')}</CardTitle>
            <CardDescription>
              {locale === 'es' ? 'Tu actividad financiera más reciente' : 'Your latest financial activity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
                dashboardData.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center">
                    <div className="ml-4 space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category} • {locale === 'es' ? 'Agregado por' : 'Added by'} {transaction.createdBy.name || transaction.createdBy.email}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">{t('dashboard.noTransactions')}</p>
                  <p className="text-xs text-muted-foreground">{locale === 'es' ? 'Comienza agregando tu primera transacción' : 'Start by adding your first transaction'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
            <CardDescription>
              {locale === 'es' ? 'Gestiona tus finanzas rápidamente' : 'Manage your finances quickly'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddTransactionModal
              onTransactionAdded={fetchDashboardData}
              trigger={
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('dashboard.addTransaction')}
                </Button>
              }
            />
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleUnderConstruction('Bancolombia Integration')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {t('dashboard.connectBank')}
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleUnderConstruction('Budget Goals')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {locale === 'es' ? 'Establecer Meta de Presupuesto' : 'Set Budget Goal'}
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleUnderConstruction('Alerts System')}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              {locale === 'es' ? 'Ver Alertas' : 'View Alerts'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.budgetOverview')}</CardTitle>
            <CardDescription>
              {locale === 'es' ? 'Cómo te va este mes' : "How you're doing this month"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.budgetOverview && dashboardData.budgetOverview.length > 0 ? (
                dashboardData.budgetOverview.map((budget, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: budget.categoryColor }}
                      ></div>
                      <span className="text-sm">{budget.categoryIcon} {budget.categoryName}</span>
                    </div>
                    <div className="ml-auto">
                      <Badge 
                        variant={
                          budget.isOverBudget ? "destructive" : 
                          budget.isNearLimit ? "secondary" : 
                          "outline"
                        }
                      >
                        {budget.percentageUsed}% {locale === 'es' ? 'usado' : 'used'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">{locale === 'es' ? 'Aún no hay presupuestos creados' : 'No budgets created yet'}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.href = `/${locale}/budget`}
                  >
                    {t('dashboard.createBudget')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{locale === 'es' ? 'Estado de Cuentas' : 'Account Status'}</CardTitle>
            <CardDescription>
              {locale === 'es' ? 'Tus cuentas conectadas' : 'Your connected accounts'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {dashboardData?.hasConnectedAccounts ? 
                      (locale === 'es' ? 
                        `${dashboardData.connectedAccounts} cuenta${dashboardData.connectedAccounts > 1 ? 's' : ''} conectada${dashboardData.connectedAccounts > 1 ? 's' : ''}` :
                        `${dashboardData.connectedAccounts} account${dashboardData.connectedAccounts > 1 ? 's' : ''} connected`
                      ) :
                      (locale === 'es' ? 'No hay cuentas conectadas' : 'No accounts connected')
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dashboardData?.hasConnectedAccounts ? 
                      (locale === 'es' ? 'Tus cuentas bancarias están sincronizadas' : 'Your bank accounts are synced') :
                      (locale === 'es' ? 'Conecta tu cuenta de Bancolombia para empezar' : 'Connect your Bancolombia account to get started')
                    }
                  </p>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleUnderConstruction('Bancolombia Integration')}
                disabled={dashboardData?.hasConnectedAccounts}
              >
                <Plus className="mr-2 h-4 w-4" />
                {dashboardData?.hasConnectedAccounts ? 
                  (locale === 'es' ? 'Cuenta Conectada' : 'Account Connected') : 
                  (locale === 'es' ? 'Conectar Bancolombia' : 'Connect Bancolombia')
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}