'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Target, Download } from 'lucide-react'

interface AnalyticsData {
  totalBalance: number
  periodIncome: number
  periodExpenses: number
  netIncome: number
  formattedTotalBalance: string
  formattedPeriodIncome: string
  formattedPeriodExpenses: string
  categoryBreakdown: Array<{
    categoryId: string
    categoryName: string
    categoryColor: string
    categoryIcon: string
    amount: number
    count: number
    formattedAmount: string
  }>
  monthlyTrends: Array<{
    month: string
    type: string
    total: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/overview?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!analytics) {
    return <div>Error loading analytics</div>
  }

  const categoryChartData = analytics.categoryBreakdown.map(item => ({
    name: item.categoryName,
    value: item.amount,
    color: item.categoryColor,
    icon: item.categoryIcon
  }))

  const monthlyTrendData = analytics.monthlyTrends.reduce((acc: any[], curr: any) => {
    const monthStr = new Date(curr.month).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
    const existing = acc.find(item => item.month === monthStr)
    
    if (existing) {
      existing[curr.type === 'INCOME' ? 'income' : 'expenses'] = Number(curr.total)
    } else {
      acc.push({
        month: monthStr,
        income: curr.type === 'INCOME' ? Number(curr.total) : 0,
        expenses: curr.type === 'EXPENSE' ? Number(curr.total) : 0
      })
    }
    
    return acc
  }, []).slice(0, 12).reverse()

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Insights into your financial patterns and trends
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
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
            <div className="text-2xl font-bold">{analytics.formattedTotalBalance}</div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.formattedPeriodIncome}</div>
            <p className="text-xs text-muted-foreground">
              Total income for selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.formattedPeriodExpenses}</div>
            <p className="text-xs text-muted-foreground">
              Total expenses for selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP'
              }).format(analytics.netIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income minus expenses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>
              Where your money is going
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                  }).format(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No expense data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>
              Detailed view of your spending categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.categoryBreakdown.map((category) => (
                <div key={category.categoryId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.categoryColor }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span>{category.categoryIcon}</span>
                        <span className="font-medium">{category.categoryName}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.count} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{category.formattedAmount}</div>
                  </div>
                </div>
              ))}
              {analytics.categoryBreakdown.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No category data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses Trend</CardTitle>
          <CardDescription>
            Monthly comparison of your income and expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP'
                }).format(Number(value))} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-muted-foreground">No trend data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}