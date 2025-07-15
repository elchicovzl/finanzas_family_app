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
}

interface CategoryFilterProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  includeAllOption?: boolean
  allOptionText?: string
}

export function CategoryFilter({
  value,
  onValueChange,
  placeholder,
  className,
  includeAllOption = true,
  allOptionText
}: CategoryFilterProps) {
  const { t } = useTranslations()
  const [categories, setCategories] = useState<ComboboxOption[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data: Category[] = await response.json()
        
        // Translate category names
        const translatedCategories = translateCategories(data, t)
        
        const categoryOptions: ComboboxOption[] = translatedCategories.map(category => ({
          value: category.id,
          label: category.name,
          icon: category.icon,
          color: category.color
        }))

        // Add "All Categories" option if requested
        if (includeAllOption) {
          categoryOptions.unshift({
            value: 'all',
            label: allOptionText || t('transactions.allCategories'),
            icon: '📋'
          })
        }

        setCategories(categoryOptions)
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

  return (
    <Combobox
      options={categories}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder || t('transactions.filterByCategory')}
      searchPlaceholder={t('transactions.searchCategories')}
      emptyText={t('transactions.noCategoriesFound')}
      className={className}
      loading={loading}
    />
  )
}