'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface AddTransactionModalProps {
  onTransactionAdded?: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function AddTransactionModal({ 
  onTransactionAdded,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: AddTransactionModalProps) {
  const { t } = useTranslations()
  const [internalOpen, setInternalOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: '',
    categoryId: '',
    customCategory: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    tags: ''
  })

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = controlledOnOpenChange || setInternalOpen

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      type: '',
      categoryId: '',
      customCategory: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      tags: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that either category or custom category is provided
    if (!formData.categoryId && !formData.customCategory) {
      toast.warning(t('transactions.modal.validation.categoryRequired'), {
        description: t('transactions.modal.validation.categoryRequiredDesc')
      })
      return
    }

    setSubmitting(true)

    try {
      const requestData = {
        amount: parseFloat(formData.amount.replace(/[^0-9]/g, '')), // Remove any formatting
        description: formData.description,
        type: formData.type,
        categoryId: formData.categoryId || undefined,
        customCategory: formData.customCategory || undefined,
        date: new Date(formData.date).toISOString(),
        reference: formData.reference || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      }

      const response = await fetch('/api/transactions/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        setIsOpen(false)
        resetForm()
        const formattedAmount = new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
        }).format(parseFloat(formData.amount.replace(/[^0-9.]/g, '')))
        
        const descriptionKey = formData.type === 'INCOME' 
          ? 'transactions.modal.success.incomeRecorded'
          : 'transactions.modal.success.expenseRecorded'
        
        toast.success(t('transactions.modal.success.transactionAdded'), {
          description: t(descriptionKey, { amount: formattedAmount })
        })
        
        // Call the callback to refresh data
        if (onTransactionAdded) {
          onTransactionAdded()
        }
      } else {
        const errorData = await response.json()
        toast.error(t('transactions.modal.error.failedToAdd'), {
          description: errorData.error || t('transactions.modal.error.tryAgain')
        })
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error(t('transactions.modal.error.connectionError'), {
        description: t('transactions.modal.error.checkConnection')
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatAmount = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9]/g, '')
    
    if (!numericValue) return ''
    
    // Format with thousands separator
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return formatted
  }

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      {t('transactions.addTransaction')}
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('transactions.modal.title')}</DialogTitle>
          <DialogDescription>
            {t('transactions.modal.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">{t('transactions.modal.form.description')}</Label>
            <Input 
              id="description" 
              placeholder={t('transactions.modal.form.descriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">{t('transactions.modal.form.amount')}</Label>
            <Input 
              id="amount" 
              type="text"
              placeholder={t('transactions.modal.form.amountPlaceholder')}
              value={formData.amount}
              onChange={(e) => {
                const formatted = formatAmount(e.target.value)
                setFormData(prev => ({ ...prev, amount: formatted }))
              }}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">{t('transactions.modal.form.type')}</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('transactions.modal.form.typePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">{t('transactions.income')}</SelectItem>
                <SelectItem value="EXPENSE">{t('transactions.expense')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">{t('transactions.modal.form.category')}</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value, customCategory: '' }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('transactions.modal.form.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customCategory">{t('transactions.modal.form.customCategory')}</Label>
            <Input 
              id="customCategory" 
              placeholder={t('transactions.modal.form.customCategoryPlaceholder')}
              value={formData.customCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value, categoryId: '' }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">{t('transactions.modal.form.date')}</Label>
            <Input 
              id="date" 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reference">{t('transactions.modal.form.reference')}</Label>
            <Input 
              id="reference" 
              placeholder={t('transactions.modal.form.referencePlaceholder')}
              value={formData.reference}
              onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              {t('transactions.modal.buttons.cancel')}
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? t('transactions.modal.buttons.adding') : t('transactions.modal.buttons.addTransaction')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}