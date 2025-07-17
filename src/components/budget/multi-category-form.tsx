'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { CategorySelect } from '@/components/CategorySelect'

interface CategoryFormData {
  categoryId: string
  monthlyLimit: string
  enableRollover: boolean
}

interface MultiCategoryFormProps {
  formCategories: CategoryFormData[]
  onCategoriesChange: (categories: CategoryFormData[]) => void
  t: (key: string) => string
}

export default function MultiCategoryForm({ 
  formCategories, 
  onCategoriesChange, 
  t 
}: MultiCategoryFormProps) {
  const addCategory = () => {
    onCategoriesChange([
      ...formCategories,
      { categoryId: '', monthlyLimit: '', enableRollover: true }
    ])
  }

  const removeCategory = (index: number) => {
    if (formCategories.length > 1) {
      onCategoriesChange(formCategories.filter((_, i) => i !== index))
    }
  }

  const updateCategory = (index: number, field: keyof CategoryFormData, value: any) => {
    const updated = formCategories.map((cat, i) => 
      i === index ? { ...cat, [field]: value } : cat
    )
    onCategoriesChange(updated)
  }

  const getUsedCategoryIds = () => {
    return formCategories.map(cat => cat.categoryId).filter(id => id !== '')
  }

  const getExcludedCategories = (currentIndex: number) => {
    const usedIds = getUsedCategoryIds()
    const currentCategoryId = formCategories[currentIndex].categoryId
    // Excluir todas las categorías usadas excepto la actual
    return usedIds.filter(id => id !== currentCategoryId)
  }

  const getTotalBudget = () => {
    return formCategories.reduce((sum, cat) => {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{t('budget.categories')}</Label>
      </div>

      <div className="space-y-3">
        {formCategories.map((formCategory, index) => (
          <Card key={index} className="p-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t('budget.category')} {index + 1}
                </Label>
                {formCategories.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategory(index)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{t('common.category')}</Label>
                  <CategorySelect
                    value={formCategory.categoryId}
                    onValueChange={(value) => updateCategory(index, 'categoryId', value)}
                    placeholder={t('budget.selectCategory')}
                    className="h-9"
                    excludeCategories={getExcludedCategories(index)}
                  />
                </div>

                <div>
                  <Label className="text-xs">{t('budget.monthlyLimit')}</Label>
                  <Input
                    type="text"
                    placeholder="$0"
                    value={formCategory.monthlyLimit}
                    onChange={(e) => {
                      const value = e.target.value
                      const numericValue = value.replace(/[^0-9]/g, '')
                      const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      updateCategory(index, 'monthlyLimit', formatted)
                    }}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`rollover-${index}`}
                  checked={formCategory.enableRollover}
                  onCheckedChange={(checked) => updateCategory(index, 'enableRollover', checked)}
                />
                <Label htmlFor={`rollover-${index}`} className="text-xs">
                  {t('budget.enableRollover')}
                </Label>
              </div>
            </div>
          </Card>
        ))}
        
        {/* Botón agregar categoría al final */}
        <div className="flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addCategory}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('budget.addCategory')}
          </Button>
        </div>
      </div>

      {/* Total del presupuesto */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-blue-900">
              {t('budget.totalBudget')}
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              {formatCurrency(getTotalBudget())}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}