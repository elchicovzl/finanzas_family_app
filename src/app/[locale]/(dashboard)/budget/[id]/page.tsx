'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Target, AlertTriangle, CheckCircle, Edit, TrendingUp, TrendingDown, Loader2, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTranslations } from '@/hooks/use-translations'
import { translateCategories } from '@/lib/category-translations'
import { toast } from 'sonner'
import { PageLoader } from '@/components/ui/page-loader'

interface BudgetCategory {
  id: string
  categoryId: string
  monthlyLimit: number
  currentSpent: number
  effectiveLimit: number
  remainingBudget: number
  percentageUsed: number
  isOverBudget: boolean
  isNearLimit: boolean
  enableRollover: boolean
  rolloverAmount: number
  formattedLimit: string
  formattedSpent: string
  formattedRemaining: string
  formattedRollover: string
  category: {
    name: string
    color: string
    icon: string
  }
}

interface Budget {
  id: string
  name: string
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  totalPercentage: number
  isOverBudget: boolean
  isNearLimit: boolean
  formattedTotalBudget: string
  formattedTotalSpent: string
  formattedTotalRemaining: string
  alertThreshold: number
  startDate: string
  endDate: string
  categories: BudgetCategory[]
}

export default function BudgetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { t, locale } = useTranslations()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBudget()
  }, [t])

  const fetchBudget = async () => {
    try {
      const response = await fetch(`/api/budget/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        // Translate categories in budget
        const budgetWithTranslatedCategories = {
          ...data,
          categories: data.categories.map((cat: any) => ({
            ...cat,
            category: {
              ...cat.category,
              name: translateCategories([cat.category], t)[0]?.name || cat.category.name
            }
          }))
        }
        setBudget(budgetWithTranslatedCategories)
      } else {
        toast.error(t('budget.failedToLoadBudget'))
        router.push('/budget')
      }
    } catch (error) {
      toast.error(t('budget.errorLoadingBudget'))
      router.push('/budget')
    } finally {
      setLoading(false)
    }
  }

  const getBudgetStatus = (budget: Budget) => {
    if (budget.isOverBudget) {
      return { color: 'destructive', icon: AlertTriangle, text: t('budget.overBudget') }
    } else if (budget.isNearLimit) {
      return { color: 'warning', icon: AlertTriangle, text: t('budget.nearLimit') }
    } else {
      return { color: 'success', icon: CheckCircle, text: t('budget.onTrack') }
    }
  }

  const getCategoryStatus = (category: BudgetCategory) => {
    if (category.isOverBudget) {
      return { color: 'destructive', icon: AlertTriangle, text: t('budget.overBudget') }
    } else if (category.isNearLimit) {
      return { color: 'warning', icon: AlertTriangle, text: t('budget.nearLimit') }
    } else {
      return { color: 'success', icon: CheckCircle, text: t('budget.onTrack') }
    }
  }

  const formatCurrency = (amount: number) => {
    const localeCode = locale === 'es' ? 'es-CO' : 'en-US'
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === 'es' ? 'es-CO' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return <PageLoader />
  }

  if (!budget) {
    return null
  }

  const budgetStatus = getBudgetStatus(budget)
  const StatusIcon = budgetStatus.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.back')}</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{budget.name}</h1>
            <p className="text-muted-foreground">
              {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={budgetStatus.color as any}
            className="flex items-center space-x-1"
          >
            <StatusIcon className="h-3 w-3" />
            <span>{budgetStatus.text}</span>
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/budget/${budget.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('budget.totalBudget')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budget.formattedTotalBudget}</div>
            <p className="text-xs text-muted-foreground">
              {budget.categories.length} {t('budget.categories')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('budget.totalSpent')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{budget.formattedTotalSpent}</div>
            <p className="text-xs text-muted-foreground">
              {budget.totalPercentage.toFixed(1)}% {t('budget.ofTotal')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('budget.remaining')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${budget.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {budget.formattedTotalRemaining}
            </div>
            <p className="text-xs text-muted-foreground">
              {budget.totalRemaining >= 0 ? t('budget.availableToSpend') : t('budget.overBudget')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('budget.progress')}</CardTitle>
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budget.totalPercentage.toFixed(1)}%</div>
            <Progress value={Math.min(budget.totalPercentage, 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detalle por categorías */}
      <Card>
        <CardHeader>
          <CardTitle>{t('budget.categoryBreakdown')}</CardTitle>
          <CardDescription>
            {t('budget.detailedCategoryAnalysis')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {budget.categories.map((category) => {
              const categoryStatus = getCategoryStatus(category)
              const CategoryStatusIcon = categoryStatus.icon
              
              return (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: category.category.color }}
                      >
                        {category.category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.enableRollover && category.rolloverAmount > 0 && (
                            <span className="text-blue-600">
                              💰 {category.formattedRollover} {t('budget.rollover')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={categoryStatus.color as any}
                      className="flex items-center space-x-1"
                    >
                      <CategoryStatusIcon className="h-3 w-3" />
                      <span>{categoryStatus.text}</span>
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">{t('budget.budgeted')}</div>
                      <div className="text-lg font-semibold">{category.formattedLimit}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">{t('budget.spent')}</div>
                      <div className="text-lg font-semibold text-red-600">{category.formattedSpent}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">{t('budget.remaining')}</div>
                      <div className={`text-lg font-semibold ${category.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {category.formattedRemaining}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('budget.progress')}</span>
                      <span>{category.percentageUsed.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(category.percentageUsed, 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}