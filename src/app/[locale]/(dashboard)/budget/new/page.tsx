'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Target } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'
import MultiCategoryForm from '@/components/budget/multi-category-form'

export default function NewBudgetPage() {
  const router = useRouter()
  const { t } = useTranslations()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    categories: [{ categoryId: '', monthlyLimit: '', enableRollover: true }],
    alertThreshold: '80'
  })

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

    setLoading(true)
    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
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
        toast.success(t('messages.budgetCreated'))
        router.push('/budget')
      } else {
        const error = await response.json()
        toast.error(error.error || t('budget.failedToCreateBudget'))
      }
    } catch (error) {
      toast.error(t('budget.errorCreatingBudget'))
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl font-bold">{t('budget.createBudget')}</h1>
          <p className="text-muted-foreground">{t('budget.createBudgetDesc')}</p>
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
                  <Button type="submit" disabled={loading}>
                    {loading ? t('common.loading') : t('budget.createBudget')}
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
                          <span className="text-muted-foreground">
                            {t('budget.category')} {index + 1}
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