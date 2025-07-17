'use client'

import { useState, useEffect } from 'react'
import { Combobox, ComboboxOption } from '@/components/ui/combobox'
import { useTranslations } from '@/hooks/use-translations'
import { translateCategories } from '@/lib/category-translations'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  isCustom: boolean
}

interface CategorySelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  excludeCategories?: string[] // IDs de categorías a excluir
}

export function CategorySelect({
  value,
  onValueChange,
  placeholder,
  className,
  disabled = false,
  excludeCategories = []
}: CategorySelectProps) {
  const { t } = useTranslations()
  const [allCategories, setAllCategories] = useState<ComboboxOption[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data: Category[] = await response.json()
        
        // Translate all categories (function will only translate predefined ones)
        const translatedCategories = translateCategories(data, t)
        
        // Separate predefined and custom categories after translation
        const predefinedCategories = translatedCategories.filter(category => !category.isCustom)
        const customCategories = translatedCategories.filter(category => category.isCustom)
        
        // Create category options
        const categoryOptions: ComboboxOption[] = []

        // Add predefined categories
        predefinedCategories.forEach(category => {
          categoryOptions.push({
            value: category.id,
            label: category.name,
            icon: category.icon,
            color: category.color
          })
        })

        // Add custom categories with a visual indicator
        customCategories.forEach(category => {
          categoryOptions.push({
            value: category.id,
            label: category.name,
            icon: category.icon,
            color: category.color
          })
        })

        setAllCategories(categoryOptions)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [t])

  // Filter categories based on excluded list
  const filteredCategories = allCategories.filter(
    category => !excludeCategories.includes(category.id)
  )

  return (
    <Combobox
      options={filteredCategories}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder || t('budget.selectCategory')}
      searchPlaceholder={t('transactions.searchCategories')}
      emptyText={t('transactions.noCategoriesFound')}
      className={className}
      disabled={disabled}
      loading={loading}
    />
  )
}