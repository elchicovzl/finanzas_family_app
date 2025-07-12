'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Target, AlertTriangle, CheckCircle, TrendingUp, LayoutTemplate, Play, Settings, Bell, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useFamilyStore } from '@/stores/family-store'
import { useTranslations } from '@/hooks/use-translations'
import { translateCategories } from '@/lib/category-translations'

interface Budget {
  id: string
  name: string
  monthlyLimit: number
  currentSpent: number
  remainingBudget: number
  percentageUsed: number
  isOverBudget: boolean
  isNearLimit: boolean
  formattedLimit: string
  formattedSpent: string
  formattedRemaining: string
  category: {
    name: string
    color: string
    icon: string
  }
}

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface BudgetTemplate {
  id: string
  name: string
  monthlyLimit: number
  period: string
  alertThreshold: number
  autoGenerate: boolean
  lastGenerated: Date | null
  formattedLimit: string
  category: {
    name: string
    color: string
    icon: string
  }
}

interface MissingBudget {
  templateId: string
  templateName: string
  monthlyLimit: number
  formattedLimit: string
  category: {
    name: string
    color: string
    icon: string
  }
}

interface MissingBudgetsResponse {
  missingCount: number
  currentMonth: string
  missingBudgets: MissingBudget[]
}

export default function BudgetPage() {
  const { currentFamily } = useFamilyStore()
  const { t, locale } = useTranslations()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [templates, setTemplates] = useState<BudgetTemplate[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [missingBudgets, setMissingBudgets] = useState<MissingBudgetsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [activeTab, setActiveTab] = useState<'budgets' | 'templates'>('budgets')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    monthlyLimit: '',
    alertThreshold: '80'
  })
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    categoryId: '',
    monthlyLimit: '',
    alertThreshold: '80',
    autoGenerate: true
  })

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budget')
      if (response.ok) {
        const data = await response.json()
        setBudgets(data)
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    }
  }

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

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/budget/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const checkMissingBudgets = async () => {
    try {
      const response = await fetch('/api/budget/missing')
      if (response.ok) {
        const data = await response.json()
        setMissingBudgets(data)
      }
    } catch (error) {
      console.error('Error checking missing budgets:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchBudgets(), fetchCategories(), fetchTemplates(), checkMissingBudgets()])
      setLoading(false)
    }
    loadData()
  }, [t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.categoryId || !formData.monthlyLimit) {
      toast.error(t('budget.fillAllRequired'))
      return
    }

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          categoryId: formData.categoryId,
          monthlyLimit: parseFloat(formData.monthlyLimit.replace(/[^0-9]/g, '')),
          alertThreshold: parseFloat(formData.alertThreshold)
        }),
      })

      if (response.ok) {
        toast.success(t('messages.budgetCreated'))
        fetchBudgets()
        setDialogOpen(false)
        setFormData({
          name: '',
          categoryId: '',
          monthlyLimit: '',
          alertThreshold: '80'
        })
      } else {
        const error = await response.json()
        toast.error(error.error || t('budget.failedToCreateBudget'))
      }
    } catch (error) {
      toast.error(t('budget.errorCreatingBudget'))
    }
  }

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!templateFormData.name || !templateFormData.categoryId || !templateFormData.monthlyLimit) {
      toast.error(t('budget.fillAllRequired'))
      return
    }

    try {
      const response = await fetch('/api/budget/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateFormData.name,
          categoryId: templateFormData.categoryId,
          monthlyLimit: parseFloat(templateFormData.monthlyLimit.replace(/[^0-9]/g, '')),
          alertThreshold: parseFloat(templateFormData.alertThreshold),
          autoGenerate: templateFormData.autoGenerate
        }),
      })

      if (response.ok) {
        toast.success(t('budget.templateCreatedSuccess'))
        fetchTemplates()
        setTemplateDialogOpen(false)
        setTemplateFormData({
          name: '',
          categoryId: '',
          monthlyLimit: '',
          alertThreshold: '80',
          autoGenerate: true
        })
      } else {
        const error = await response.json()
        toast.error(error.error || t('budget.failedToCreateTemplate'))
      }
    } catch (error) {
      toast.error(t('budget.errorCreatingTemplate'))
    }
  }

  const generateBudgetFromTemplate = async (templateId: string) => {
    try {
      const response = await fetch('/api/budget/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId }),
      })

      if (response.ok) {
        toast.success(t('budget.budgetGeneratedSuccess'))
        await Promise.all([fetchBudgets(), fetchTemplates(), checkMissingBudgets()])
      } else {
        const error = await response.json()
        toast.error(error.error || t('budget.failedToGenerateBudget'))
      }
    } catch (error) {
      toast.error(t('budget.errorGeneratingBudget'))
    }
  }

  const generateAllMissingBudgets = async () => {
    if (!missingBudgets || missingBudgets.missingCount === 0) return
    
    setGeneratingAll(true)
    
    try {
      const response = await fetch('/api/budget/generate-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Use current month by default
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(t('budget.generatedBudgetsSuccess', { count: result.generatedCount, period: result.period }))
        
        // Refresh all data
        await Promise.all([fetchBudgets(), fetchTemplates(), checkMissingBudgets()])
      } else {
        const error = await response.json()
        toast.error(error.error || t('budget.failedToGenerateBudgets'))
      }
    } catch (error) {
      toast.error(t('budget.errorGeneratingBudgets'))
    } finally {
      setGeneratingAll(false)
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatCurrency = (amount: number) => {
    const localeCode = locale === 'es' ? 'es-CO' : 'en-US'
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.monthlyLimit), 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + Number(budget.currentSpent), 0)
  const totalRemaining = totalBudget - totalSpent
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{t('budget.title')}</h2>
          <p className="text-muted-foreground">
            {currentFamily ? t('budget.descriptionFamily', { familyName: currentFamily.name }) : t('budget.description')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LayoutTemplate className="mr-2 h-4 w-4" />
                {t('budget.createTemplate')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('budget.createTemplateTitle')}</DialogTitle>
                <DialogDescription>
                  {t('budget.createTemplateDesc')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">{t('budget.templateName')}</Label>
                  <Input
                    id="template-name"
                    placeholder={t('budget.templateNamePlaceholder')}
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-category">{t('common.category')}</Label>
                  <Select 
                    value={templateFormData.categoryId} 
                    onValueChange={(value) => setTemplateFormData(prev => ({ ...prev, categoryId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('budget.selectCategory')} />
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
                  <Label htmlFor="template-limit">{t('budget.monthlyLimit')}</Label>
                  <Input
                    id="template-limit"
                    type="text"
                    placeholder={t('budget.monthlyLimitPlaceholder')}
                    value={templateFormData.monthlyLimit}
                    onChange={(e) => {
                      const value = e.target.value
                      const numericValue = value.replace(/[^0-9]/g, '')
                      const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      setTemplateFormData(prev => ({ ...prev, monthlyLimit: formatted }))
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-threshold">{t('budget.alertThresholdPercent')}</Label>
                  <Select 
                    value={templateFormData.alertThreshold} 
                    onValueChange={(value) => setTemplateFormData(prev => ({ ...prev, alertThreshold: value }))}
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
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-generate"
                    checked={templateFormData.autoGenerate}
                    onCheckedChange={(checked) => setTemplateFormData(prev => ({ ...prev, autoGenerate: checked }))}
                  />
                  <Label htmlFor="auto-generate">{t('budget.autoGenerateMonthly')}</Label>
                </div>
                <Button type="submit" className="w-full">
                  {t('budget.createTemplate')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('budget.createBudget')}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('budget.createBudgetTitle')}</DialogTitle>
              <DialogDescription>
                {t('budget.createBudgetDesc')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="category">{t('common.category')}</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('budget.selectCategory')} />
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
                <Label htmlFor="limit">{t('budget.monthlyLimit')}</Label>
                <Input
                  id="limit"
                  type="text"
                  placeholder={t('budget.monthlyLimitPlaceholder')}
                  value={formData.monthlyLimit}
                  onChange={(e) => {
                    const value = e.target.value
                    // Remove all non-numeric characters
                    const numericValue = value.replace(/[^0-9]/g, '')
                    // Format with thousands separator
                    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    setFormData(prev => ({ ...prev, monthlyLimit: formatted }))
                  }}
                  required
                />
              </div>
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
              <Button type="submit" className="w-full">
                {t('budget.createBudget')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Missing Budgets Notification */}
      {missingBudgets && missingBudgets.missingCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Bell className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">
                    {t('budget.budgetsMissing', { count: missingBudgets.missingCount, plural: missingBudgets.missingCount > 1 ? 's' : '' })}
                  </h3>
                  <p className="text-sm text-orange-700">
                    {t('budget.budgetsMissingDesc', { month: missingBudgets.currentMonth })}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('templates')}
                >
                  {t('budget.viewTemplates')}
                </Button>
                <Button
                  onClick={generateAllMissingBudgets}
                  disabled={generatingAll}
                  size="sm"
                >
                  {generatingAll ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('budget.generating')}
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      {t('budget.generateAllCount', { count: missingBudgets.missingCount })}
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Show details of missing budgets */}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-orange-900">{t('budget.missingBudgetsLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {missingBudgets.missingBudgets.slice(0, 3).map((missing, index) => (
                  <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                    {missing.category.icon} {missing.templateName} ({missing.formattedLimit})
                  </Badge>
                ))}
                {missingBudgets.missingBudgets.length > 3 && (
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    {t('budget.more', { count: missingBudgets.missingBudgets.length - 3 })}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'budgets' | 'templates')}>
        <TabsList>
          <TabsTrigger value="budgets">{t('budget.activeBudgets')}</TabsTrigger>
          <TabsTrigger value="templates">{t('budget.templates')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="budgets" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('budget.totalBudget')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('budget.acrossAllBudgets')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('budget.totalSpent')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('budget.percentOfBudget', { percent: Math.round(overallPercentage) })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('budget.remaining')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalRemaining)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('budget.availableToSpend')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('budget.activeBudgets')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('budget.categoriesWithBudgets')}
            </p>
          </CardContent>
        </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const status = getBudgetStatus(budget)
          const StatusIcon = status.icon
          
          return (
            <Card key={budget.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{budget.category.icon}</span>
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                  </div>
                  <Badge 
                    variant={status.color as any}
                    className="flex items-center space-x-1"
                  >
                    <StatusIcon className="h-3 w-3" />
                    <span>{status.text}</span>
                  </Badge>
                </div>
                <CardDescription>
                  {budget.category.name} • {t('budget.thisMonth')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('budget.spent')}</span>
                    <span className="font-medium">{budget.formattedSpent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('budget.budget')}</span>
                    <span className="font-medium">{budget.formattedLimit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('budget.remaining')}</span>
                    <span className={`font-medium ${budget.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {budget.formattedRemaining}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('budget.progress')}</span>
                    <span>{budget.percentageUsed}%</span>
                  </div>
                  <Progress 
                    value={Math.min(budget.percentageUsed, 100)} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}

            {budgets.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('budget.noBudgetsCreated')}</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {t('budget.noBudgetsCreatedDesc')}
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('budget.createFirstBudget')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{template.category.icon}</span>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Badge variant={template.autoGenerate ? "default" : "secondary"}>
                      {template.autoGenerate ? t('budget.auto') : t('budget.manual')}
                    </Badge>
                  </div>
                  <CardDescription>
                    {template.category.name} • {template.period.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('budget.limit')}</span>
                      <span className="font-medium">{template.formattedLimit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t('budget.alertAt')}</span>
                      <span className="font-medium">{template.alertThreshold}%</span>
                    </div>
                    {template.lastGenerated && (
                      <div className="flex justify-between text-sm">
                        <span>{t('budget.lastGenerated')}</span>
                        <span className="font-medium">
                          {new Date(template.lastGenerated).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => generateBudgetFromTemplate(template.id)}
                      className="flex-1"
                      size="sm"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {t('budget.generateBudget')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // TODO: Implement edit template functionality
                        toast.info(t('budget.editTemplateSoon'))
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {templates.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('budget.noTemplatesCreated')}</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {t('budget.noTemplatesCreatedDesc')}
                  </p>
                  <Button onClick={() => setTemplateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('budget.createFirstTemplate')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}