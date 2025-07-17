'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Target, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'
import MultiCategoryForm from '@/components/budget/multi-category-form'

interface BudgetCategory {
  id: string
  categoryId: string
  monthlyLimit: number
  enableRollover: boolean
  rolloverAmount: number
  category: {
    id: string
    name: string
    icon: string
    color: string
  }
}

interface Budget {
  id: string
  name: string
  totalBudget: number
  alertThreshold: number
  categories: BudgetCategory[]
}

export default function EditBudgetPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslations()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    categories: [{ categoryId: '', monthlyLimit: '', enableRollover: true }],
    alertThreshold: '80'
  })

  useEffect(() => {
    fetchBudget()
  }, [])

  const fetchBudget = async () => {
    try {
      const response = await fetch(`/api/budget/${params.id}`)
      if (response.ok) {
        const data: Budget = await response.json()
        setBudget(data)
        
        // Convert budget data to form format
        const formCategories = data.categories.map(cat => ({
          categoryId: cat.categoryId,
          monthlyLimit: cat.monthlyLimit.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
          enableRollover: cat.enableRollover
        }))
        
        setFormData({
          name: data.name,
          categories: formCategories,
          alertThreshold: data.alertThreshold.toString()
        })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || formData.categories.length === 0) {
      toast.error(t('budget.fillAllRequired'))
      return
    }

    // Validar que todas las categorías tengan datos válidos
    const validCategories = formData.categories.filter(cat => cat.categoryId && cat.monthlyLimit)
    if (validCategories.length === 0) {
      toast.error(t('budget.selectAtLeastOneCategory'))
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/budget/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          categories: validCategories.map(cat => ({
            categoryId: cat.categoryId,
            monthlyLimit: parseFloat(cat.monthlyLimit.replace(/[^0-9]/g, '')),
            enableRollover: cat.enableRollover
          })),
          alertThreshold: parseFloat(formData.alertThreshold)
        }),
      })

      if (response.ok) {
        toast.success(t('budget.budgetUpdatedSuccess'))
        router.push('/budget')
      } else {
        const error = await response.json()
        toast.error(error.error || t('budget.failedToUpdateBudget'))
      }
    } catch (error) {
      toast.error(t('budget.errorUpdatingBudget'))
    } finally {
      setSaving(false)
    }
  }

  const getTotalBudget = () => {
    return formData.categories.reduce((sum, cat) => {
      const amount = parseFloat(cat.monthlyLimit.replace(/[^0-9]/g, '')) || 0
      return sum + amount
    }, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  if (!budget) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold">{t('budget.editBudget')}</h1>
          <p className="text-muted-foreground">{t('budget.editBudgetDesc')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>{t('budget.budgetDetails')}</span>
              </CardTitle>
              <CardDescription>
                {t('budget.budgetDetailsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre del presupuesto */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t('budget.budgetName')}</Label>
                  <Input
                    id="name"
                    placeholder={t('budget.budgetNamePlaceholder')}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Categorías */}
                <MultiCategoryForm
                  formCategories={formData.categories}
                  onCategoriesChange={(categories) => setFormData(prev => ({ ...prev, categories }))}
                  t={t}
                />

                {/* Configuración adicional */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('budget.additionalSettings')}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="threshold">{t('budget.alertThresholdPercent')}</Label>
                    <Select 
                      value={formData.alertThreshold} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, alertThreshold: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50%</SelectItem>
                        <SelectItem value="70">70%</SelectItem>
                        <SelectItem value="80">80%</SelectItem>
                        <SelectItem value="90">90%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.saving')}
                      </>
                    ) : (
                      t('budget.updateBudget')
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Resumen */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('budget.budgetSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('budget.totalBudget')}</span>
                  <span className="font-medium">{formatCurrency(getTotalBudget())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('budget.categories')}</span>
                  <span className="font-medium">{formData.categories.filter(cat => cat.categoryId).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('budget.alertThreshold')}</span>
                  <span className="font-medium">{formData.alertThreshold}%</span>
                </div>
              </div>

              {/* Desglose de categorías */}
              {formData.categories.filter(cat => cat.categoryId && cat.monthlyLimit).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{t('budget.categoryBreakdown')}</h4>
                  <div className="space-y-1">
                    {formData.categories
                      .filter(cat => cat.categoryId && cat.monthlyLimit)
                      .map((category, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center space-x-1">
                            <span>{t('budget.category')} {index + 1}</span>
                            {category.enableRollover && (
                              <span className="text-blue-600">💰</span>
                            )}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(parseFloat(category.monthlyLimit.replace(/[^0-9]/g, '')) || 0)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}