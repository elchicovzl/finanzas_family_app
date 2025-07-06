'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Plus,
  AlertCircle,
  Construction 
} from 'lucide-react'
import { toast } from 'sonner'
import AddTransactionModal from '@/components/AddTransactionModal'
import { useFamilyStore } from '@/stores/family-store'

interface DashboardData {
  totalBalance: number
  currentMonthIncome: number
  currentMonthExpenses: number
  incomeChange: number
  expenseChange: number
  recentTransactions: Array<{
    id: string
    description: string
    amount: number
    date: string
    category: string
    type: string
    createdBy: {
      name: string | null
      email: string
    }
  }>
  budgetOverview: Array<{
    categoryName: string
    categoryIcon: string
    categoryColor: string
    percentageUsed: number
    isOverBudget: boolean
    isNearLimit: boolean
  }>
  connectedAccounts: number
  hasConnectedAccounts: boolean
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { currentFamily } = useFamilyStore()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/analytics/overview')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      } else {
        toast.error('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleUnderConstruction = (feature: string) => {
    toast.info(`${feature} is under construction`, {
      description: 'This feature is coming soon!'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back, {session?.user?.name?.split(' ')[0]}!
          </h2>
          {currentFamily && (
            <p className="text-muted-foreground">
              Managing finances for <span className="font-medium">{currentFamily.name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => handleUnderConstruction('Bancolombia Integration')}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Bank Account
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData?.totalBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(dashboardData?.currentMonthIncome || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.incomeChange !== undefined ? 
                `${dashboardData.incomeChange >= 0 ? '+' : ''}${dashboardData.incomeChange.toFixed(1)}% from last month` :
                'No comparison data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData?.currentMonthExpenses || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.expenseChange !== undefined ? 
                `${dashboardData.expenseChange >= 0 ? '+' : ''}${dashboardData.expenseChange.toFixed(1)}% from last month` :
                'No comparison data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Progress</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              <Construction className="h-6 w-6 inline mr-2" />
              Under Construction
            </div>
            <p className="text-xs text-muted-foreground">
              Savings tracking coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
                dashboardData.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center">
                    <div className="ml-4 space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category} • Added by {transaction.createdBy.name || transaction.createdBy.email}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No recent transactions</p>
                  <p className="text-xs text-muted-foreground">Start by adding your first transaction</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your finances quickly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddTransactionModal
              onTransactionAdded={fetchDashboardData}
              trigger={
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manual Transaction
                </Button>
              }
            />
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleUnderConstruction('Bancolombia Integration')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Connect Bank Account
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleUnderConstruction('Budget Goals')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Set Budget Goal
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => handleUnderConstruction('Alerts System')}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              View Alerts
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
            <CardDescription>
              How you&apos;re doing this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.budgetOverview && dashboardData.budgetOverview.length > 0 ? (
                dashboardData.budgetOverview.map((budget, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: budget.categoryColor }}
                      ></div>
                      <span className="text-sm">{budget.categoryIcon} {budget.categoryName}</span>
                    </div>
                    <div className="ml-auto">
                      <Badge 
                        variant={
                          budget.isOverBudget ? "destructive" : 
                          budget.isNearLimit ? "secondary" : 
                          "outline"
                        }
                      >
                        {budget.percentageUsed}% used
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No budgets created yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => window.location.href = '/dashboard/budget'}
                  >
                    Create Budget
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>
              Your connected accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {dashboardData?.hasConnectedAccounts ? 
                      `${dashboardData.connectedAccounts} account${dashboardData.connectedAccounts > 1 ? 's' : ''} connected` :
                      'No accounts connected'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dashboardData?.hasConnectedAccounts ? 
                      'Your bank accounts are synced' :
                      'Connect your Bancolombia account to get started'
                    }
                  </p>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleUnderConstruction('Bancolombia Integration')}
                disabled={dashboardData?.hasConnectedAccounts}
              >
                <Plus className="mr-2 h-4 w-4" />
                {dashboardData?.hasConnectedAccounts ? 'Account Connected' : 'Connect Bancolombia'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}