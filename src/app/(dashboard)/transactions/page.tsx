'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Search, Download, User } from 'lucide-react'
import AddTransactionModal from '@/components/AddTransactionModal'
import { useFamily } from '@/contexts/FamilyContext'

interface Transaction {
  id: string
  description: string
  amount: number
  formattedAmount: string
  date: string
  formattedDate: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  source?: 'BELVO' | 'MANUAL' | 'PLAID' | 'CSV_IMPORT'
  category?: {
    name: string
    color: string
    icon: string
  }
  customCategory?: string
  account: {
    institutionName: string
    accountNumber: string
  }
  createdBy: {
    name: string | null
    email: string
  }
}

interface TransactionResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function TransactionsPage() {
  const { currentFamily } = useFamily()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      
      if (search) params.append('search', search)
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter)
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter)

      const response = await fetch(`/api/transactions?${params}`)
      
      if (response.ok) {
        const data: TransactionResponse = await response.json()
        setTransactions(data.transactions)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [currentPage, search, typeFilter, categoryFilter])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'bg-green-100 text-green-800'
      case 'EXPENSE':
        return 'bg-red-100 text-red-800'
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'text-green-600'
      case 'EXPENSE':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            {currentFamily ? `Manage and track all transactions for ${currentFamily.name}` : 'Manage and track all your financial transactions'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <AddTransactionModal onTransactionAdded={fetchTransactions} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter and search your transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food">Food & Dining</SelectItem>
                <SelectItem value="transport">Transportation</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            A complete list of all your transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.formattedDate}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        {transaction.category ? (
                          <div className="flex items-center space-x-2">
                            <span>{transaction.category.icon}</span>
                            <span>{transaction.category.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Uncategorized</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{transaction.account.institutionName}</div>
                          <div className="text-sm text-muted-foreground">
                            ****{transaction.account.accountNumber.slice(-4)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {transaction.createdBy.name || transaction.createdBy.email}
                            </div>
                            {transaction.createdBy.name && (
                              <div className="text-xs text-muted-foreground">
                                {transaction.createdBy.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(transaction.type)}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getAmountColor(transaction.type)}`}>
                        {transaction.formattedAmount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {transactions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}