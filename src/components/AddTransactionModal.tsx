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
      toast.warning('Category required', {
        description: 'Please select a category or enter a custom category name.'
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
        toast.success('Transaction added successfully!', {
          description: `${formData.type === 'INCOME' ? 'Income' : 'Expense'} of ${new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
          }).format(parseFloat(formData.amount.replace(/[^0-9.]/g, '')))} recorded.`
        })
        
        // Call the callback to refresh data
        if (onTransactionAdded) {
          onTransactionAdded()
        }
      } else {
        const errorData = await response.json()
        toast.error('Failed to add transaction', {
          description: errorData.error || 'Please try again.'
        })
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      toast.error('Connection error', {
        description: 'Unable to connect to server. Please check your internet connection.'
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
      Add Transaction
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Transaction</DialogTitle>
          <DialogDescription>
            Add a cash transaction or expense not tracked by your bank
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              placeholder="e.g., Coffee at Starbucks"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (COP)</Label>
            <Input 
              id="amount" 
              type="text"
              placeholder="50,000"
              value={formData.amount}
              onChange={(e) => {
                const formatted = formatAmount(e.target.value)
                setFormData(prev => ({ ...prev, amount: formatted }))
              }}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value, customCategory: '' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
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
            <Label htmlFor="customCategory">Or Custom Category</Label>
            <Input 
              id="customCategory" 
              placeholder="Custom category name"
              value={formData.customCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value, categoryId: '' }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reference">Reference (Optional)</Label>
            <Input 
              id="reference" 
              placeholder="Receipt number, notes, etc."
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
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}