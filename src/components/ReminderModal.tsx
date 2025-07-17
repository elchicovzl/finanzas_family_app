'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslations } from '@/hooks/use-translations'
import { translateCategories } from '@/lib/category-translations'

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

interface Reminder {
  id: string
  title: string
  description?: string
  amount?: number
  dueDate: string
  reminderTime?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isRecurring: boolean
  recurrenceType?: string
  recurrenceInterval?: number
  recurrenceEndDate?: string
  categoryId?: string
  notifyDaysBefore?: number
}

interface ReminderFormData {
  title: string
  description: string
  amount: string
  dueDate: Date
  reminderTime: string
  isRecurring: boolean
  recurrenceType: string
  recurrenceInterval: string
  recurrenceEndDate: Date | null
  categoryId: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  notifyDaysBefore: string
}

interface ReminderModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingReminder?: Reminder
  selectedDate?: Date | null
}

export function ReminderModal({ isOpen, onOpenChange, onSuccess, editingReminder, selectedDate }: ReminderModalProps) {
  const { t } = useTranslations()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    amount: '',
    dueDate: new Date(),
    reminderTime: '09:00',
    isRecurring: false,
    recurrenceType: 'MONTHLY',
    recurrenceInterval: '1',
    recurrenceEndDate: null,
    categoryId: '',
    priority: 'MEDIUM',
    notifyDaysBefore: '1'
  })

  useEffect(() => {
    fetchCategories()
  }, [t])

  useEffect(() => {
    if (editingReminder) {
      setFormData({
        title: editingReminder.title || '',
        description: editingReminder.description || '',
        amount: editingReminder.amount ? editingReminder.amount.toString() : '',
        dueDate: new Date(editingReminder.dueDate),
        reminderTime: editingReminder.reminderTime || '09:00',
        isRecurring: editingReminder.isRecurring || false,
        recurrenceType: editingReminder.recurrenceType || 'MONTHLY',
        recurrenceInterval: editingReminder.recurrenceInterval?.toString() || '1',
        recurrenceEndDate: editingReminder.recurrenceEndDate ? new Date(editingReminder.recurrenceEndDate) : null,
        categoryId: editingReminder.categoryId || '',
        priority: editingReminder.priority || 'MEDIUM',
        notifyDaysBefore: editingReminder.notifyDaysBefore?.toString() || '1'
      })
    } else {
      // Reset form for new reminder, use selectedDate if provided
      const defaultDate = selectedDate || new Date()
      setFormData({
        title: '',
        description: '',
        amount: '',
        dueDate: defaultDate,
        reminderTime: '09:00',
        isRecurring: false,
        recurrenceType: 'MONTHLY',
        recurrenceInterval: '1',
        recurrenceEndDate: null,
        categoryId: '',
        priority: 'MEDIUM',
        notifyDaysBefore: '1'
      })
    }
  }, [editingReminder, selectedDate, isOpen])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const translatedCategories = translateCategories(data, t)
        setCategories(translatedCategories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('El título es requerido')
      return
    }

    // Validate due date is not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (formData.dueDate < today) {
      toast.error('La fecha de vencimiento no puede ser anterior a hoy')
      return
    }

    setLoading(true)

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        dueDate: formData.dueDate.toISOString(),
        reminderTime: formData.reminderTime || undefined,
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : undefined,
        recurrenceInterval: formData.isRecurring ? parseInt(formData.recurrenceInterval) : undefined,
        recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate 
          ? formData.recurrenceEndDate.toISOString() 
          : undefined,
        categoryId: formData.categoryId || undefined,
        priority: formData.priority,
        notifyDaysBefore: parseInt(formData.notifyDaysBefore)
      }

      const url = editingReminder ? `/api/reminders/${editingReminder.id}` : '/api/reminders'
      const method = editingReminder ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(editingReminder ? 'Recordatorio actualizado' : 'Recordatorio creado')
        onSuccess()
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar recordatorio')
      }
    } catch (error) {
      console.error('Error saving reminder:', error)
      toast.error('Error al guardar recordatorio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingReminder ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
          </DialogTitle>
          <DialogDescription>
            {editingReminder 
              ? 'Modifica los detalles del recordatorio'
              : 'Crea un nuevo recordatorio de pago'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Pago de servicios públicos"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalles adicionales sobre este recordatorio..."
              rows={3}
            />
          </div>

          {/* Amount and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto (opcional)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoría</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date, Time and Priority */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fecha de vencimiento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, dueDate: date }))}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderTime">Hora de recordatorio</Label>
              <Input
                id="reminderTime"
                type="time"
                value={formData.reminderTime}
                onChange={(e) => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={formData.priority} onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <Badge className="bg-green-100 text-green-800">Baja</Badge>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <Badge className="bg-orange-100 text-orange-800">Alta</Badge>
                  </SelectItem>
                  <SelectItem value="URGENT">
                    <Badge className="bg-red-100 text-red-800">Urgente</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notify Days Before */}
          <div className="space-y-2">
            <Label htmlFor="notifyDaysBefore">Notificar días antes</Label>
            <Select value={formData.notifyDaysBefore} onValueChange={(value) => setFormData(prev => ({ ...prev, notifyDaysBefore: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">El mismo día</SelectItem>
                <SelectItem value="1">1 día antes</SelectItem>
                <SelectItem value="2">2 días antes</SelectItem>
                <SelectItem value="3">3 días antes</SelectItem>
                <SelectItem value="7">1 semana antes</SelectItem>
                <SelectItem value="14">2 semanas antes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
              />
              <Label htmlFor="isRecurring" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Recordatorio recurrente
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceType">Frecuencia</Label>
                    <Select value={formData.recurrenceType} onValueChange={(value) => setFormData(prev => ({ ...prev, recurrenceType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Diario</SelectItem>
                        <SelectItem value="WEEKLY">Semanal</SelectItem>
                        <SelectItem value="MONTHLY">Mensual</SelectItem>
                        <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                        <SelectItem value="YEARLY">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrenceInterval">Intervalo</Label>
                    <Select value={formData.recurrenceInterval} onValueChange={(value) => setFormData(prev => ({ ...prev, recurrenceInterval: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Cada 1</SelectItem>
                        <SelectItem value="2">Cada 2</SelectItem>
                        <SelectItem value="3">Cada 3</SelectItem>
                        <SelectItem value="6">Cada 6</SelectItem>
                        <SelectItem value="12">Cada 12</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de finalización (opcional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.recurrenceEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.recurrenceEndDate 
                          ? format(formData.recurrenceEndDate, "PPP", { locale: es }) 
                          : "Sin fecha de finalización"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.recurrenceEndDate || undefined}
                        onSelect={(date) => setFormData(prev => ({ ...prev, recurrenceEndDate: date || null }))}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return date < formData.dueDate || date < today
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : editingReminder ? 'Actualizar' : 'Crear Recordatorio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ReminderModal