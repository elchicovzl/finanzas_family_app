'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Target, AlertTriangle, CheckCircle, TrendingUp, LayoutTemplate, Play, Settings, Bell, Zap, Edit, MoreHorizontal, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useFamilyStore } from '@/stores/family-store'
import { useTranslations } from '@/hooks/use-translations'
import { translateCategories } from '@/lib/category-translations'

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
  categories: BudgetCategory[]
}

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface BudgetTemplateCategory {
  id: string
  categoryId: string
  monthlyLimit: number
  enableRollover: boolean
  formattedLimit: string
  category: {
    name: string
    color: string
    icon: string
  }
}

interface BudgetTemplate {
  id: string
  name: string
  totalBudget: number
  period: string
  alertThreshold: number
  autoGenerate: boolean
  lastGenerated: Date | null
  formattedTotalBudget: string
  isRunning?: boolean
  categories: BudgetTemplateCategory[]
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
  const router = useRouter()
  const { currentFamily } = useFamilyStore()
  const { t, locale } = useTranslations()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [templates, setTemplates] = useState<BudgetTemplate[]>([])  
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [missingBudgets, setMissingBudgets] = useState<MissingBudgetsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [activeTab, setActiveTab] = useState<'budgets' | 'templates'>('budgets')

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budget')
      if (response.ok) {
        const data = await response.json()
        // Translate categories in budgets
        const budgetsWithTranslatedCategories = data.map((budget: any) => ({
          ...budget,
          categories: budget.categories.map((cat: any) => ({
            ...cat,
            category: {
              ...cat.category,
              name: translateCategories([cat.category], t)[0]?.name || cat.category.name
            }
          }))
        }))
        setBudgets(budgetsWithTranslatedCategories)
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
        // Translate categories in templates
        const templatesWithTranslatedCategories = data.map((template: any) => ({
          ...template,
          categories: template.categories.map((cat: any) => ({
            ...cat,
            category: {
              ...cat.category,
              name: translateCategories([cat.category], t)[0]?.name || cat.category.name
            }
          }))
        }))
        setTemplates(templatesWithTranslatedCategories)
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


  const generateBudgetFromTemplate = async (templateId: string, isRunning?: boolean) => {
    if (isRunning) {
      toast.info(t('budget.templates.generateDisabled'))
      return
    }
    
    setTemplatesLoading(true)
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
    } finally {
      setTemplatesLoading(false)
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


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.totalBudget), 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + Number(budget.totalSpent), 0)
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
          <Button 
            variant="outline" 
            onClick={() => router.push('/budget/templates/new')}
          >
            <LayoutTemplate className="mr-2 h-4 w-4" />
            {t('budget.createTemplate')}
          </Button>
          <Button onClick={() => router.push('/budget/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('budget.createBudget')}
          </Button>
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

      <div className="flex items-center space-x-2 mb-6">
        <Badge 
          variant={activeTab === 'budgets' ? 'default' : 'secondary'}
          className="cursor-pointer px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/80"
          onClick={() => setActiveTab('budgets')}
        >
          {t('budget.activeBudgets')}
        </Badge>
        <Badge 
          variant={activeTab === 'templates' ? 'default' : 'secondary'}
          className="cursor-pointer px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/80"
          onClick={() => setActiveTab('templates')}
        >
          {t('budget.templates.title')}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'budgets' | 'templates')}>
        
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
                    <Target className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      {budget.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={status.color as any}
                      className="flex items-center space-x-1"
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{status.text}</span>
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/budget/${budget.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/budget/${budget.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('budget.viewDetails')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardDescription>
                  {budget.categories.length} {t('budget.categories')} • {t('budget.thisMonth')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resumen total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('budget.totalSpent')}</span>
                    <span className="font-medium">{budget.formattedTotalSpent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('budget.totalBudget')}</span>
                    <span className="font-medium">{budget.formattedTotalBudget}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('budget.remaining')}</span>
                    <span className={`font-medium ${budget.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {budget.formattedTotalRemaining}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('budget.progress')}</span>
                    <span>{budget.totalPercentage}%</span>
                  </div>
                  <Progress 
                    value={Math.min(budget.totalPercentage, 100)} 
                    className="h-2"
                  />
                </div>

                {/* Desglose por categorías */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{t('budget.categoryBreakdown')}</h4>
                  <div className="space-y-1">
                    {budget.categories.slice(0, 3).map((category) => (
                      <div key={category.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span>{category.category.icon}</span>
                          <span>{category.category.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={category.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {category.formattedRemaining}
                          </span>
                          <div className="w-12 bg-gray-200 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${category.isOverBudget ? 'bg-red-500' : category.isNearLimit ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(category.percentageUsed, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {budget.categories.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{budget.categories.length - 3} {t('budget.moreCategories')}
                      </div>
                    )}
                  </div>
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
                  <Button onClick={() => router.push('/budget/new')}>
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
                      <LayoutTemplate className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={template.autoGenerate ? "default" : "secondary"}>
                        {template.autoGenerate ? t('budget.templates.auto') : t('budget.manual')}
                      </Badge>
                      {template.isRunning && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {t('budget.templates.running')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    {template.categories.length} {t('budget.categories')} • {template.period.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('budget.totalBudget')}</span>
                      <span className="font-medium">{template.formattedTotalBudget}</span>
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

                  {/* Desglose por categorías */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">{t('budget.templateCategories')}</h4>
                    <div className="space-y-1">
                      {template.categories.slice(0, 3).map((category) => (
                        <div key={category.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <span>{category.category.icon}</span>
                            <span>{category.category.name}</span>
                            {category.enableRollover && (
                              <span className="text-blue-600">💰</span>
                            )}
                          </div>
                          <span className="font-medium">{category.formattedLimit}</span>
                        </div>
                      ))}
                      {template.categories.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{template.categories.length - 3} {t('budget.moreCategories')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => generateBudgetFromTemplate(template.id, template.isRunning)}
                      className="flex-1"
                      size="sm"
                      disabled={template.isRunning || templatesLoading}
                      variant={template.isRunning ? "outline" : "default"}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {template.isRunning ? t('budget.templates.generateDisabled') : t('budget.templates.generate')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/budget/templates/${template.id}/edit`)}
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
                  <Button onClick={() => router.push('/budget/templates/new')}>
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