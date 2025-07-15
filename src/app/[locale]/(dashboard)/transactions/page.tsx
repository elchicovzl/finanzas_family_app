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
import { Search, Download, User, Trash2 } from 'lucide-react'
import AddTransactionModal from '@/components/AddTransactionModal'
import { useFamilyStore } from '@/stores/family-store'
import { useTranslations } from '@/hooks/use-translations'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal'
import { CategoryFilter } from '@/components/CategoryFilter'

interface Transaction {
  id: string
  description: string
  amount: number
  formattedAmount: string
  date: string
  formattedDate: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  source?: 'BELVO' | 'MANUAL' | 'PLAID' | 'CSV_IMPORT'
  createdByUserId?: string
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
  const { currentFamily } = useFamilyStore()
  const { data: session } = useSession()
  const { t, locale } = useTranslations()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null)
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

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return

    const transactionId = transactionToDelete.id
    setDeletingIds(prev => new Set(prev).add(transactionId))

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(t('transactions.deleteSuccess'))
        fetchTransactions() // Refresh the list
        setDeleteModalOpen(false)
        setTransactionToDelete(null)
      } else {
        const error = await response.json()
        toast.error(error.error || t('transactions.deleteError'))
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error(t('transactions.deleteError'))
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(transactionId)
        return newSet
      })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setTransactionToDelete(null)
  }

  const canDeleteTransaction = (transaction: Transaction) => {
    if (!session?.user?.id) return false
    
    // User can delete if they are the creator
    const isCreator = transaction.createdByUserId === session.user.id
    
    // Or if they are an admin
    const isAdmin = currentFamily?.role === 'ADMIN'
    
    // And it's not an automatic transaction from Belvo
    const isNotAutomatic = transaction.source !== 'BELVO'
    
    return (isCreator || isAdmin) && isNotAutomatic
  }

  const formatCurrency = (amount: number) => {
    const localeCode = locale === 'es' ? 'es-CO' : 'en-US'
    return new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'INCOME':
        return t('transactions.income')
      case 'EXPENSE':
        return t('transactions.expense')
      case 'TRANSFER':
        return t('transactions.transfer')
      default:
        return type
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
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{t('transactions.title')}</h2>
          <p className="text-muted-foreground">
            {currentFamily ? `${t('transactions.descriptionFamily')} ${currentFamily.name}` : t('transactions.description')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('common.export')}
          </Button>
          <AddTransactionModal onTransactionAdded={fetchTransactions} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('transactions.filters')}</CardTitle>
          <CardDescription>
            {t('transactions.filtersDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('transactions.searchTransactions')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('transactions.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('transactions.allTypes')}</SelectItem>
                <SelectItem value="INCOME">{t('transactions.income')}</SelectItem>
                <SelectItem value="EXPENSE">{t('transactions.expense')}</SelectItem>
                <SelectItem value="TRANSFER">{t('transactions.transfer')}</SelectItem>
              </SelectContent>
            </Select>
            <CategoryFilter
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              className="w-[180px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('transactions.transactionHistory')}</CardTitle>
          <CardDescription>
            {t('transactions.transactionHistoryDescription')}
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
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.description')}</TableHead>
                    <TableHead>{t('common.category')}</TableHead>
                    <TableHead>{t('transactions.account')}</TableHead>
                    <TableHead>{t('transactions.addedBy')}</TableHead>
                    <TableHead>{t('transactions.type')}</TableHead>
                    <TableHead className="text-right">{t('common.amount')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
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
                          <span className="text-muted-foreground">{t('transactions.uncategorized')}</span>
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
                          {getTypeLabel(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getAmountColor(transaction.type)}`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {canDeleteTransaction(transaction) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(transaction)}
                            disabled={deletingIds.has(transaction.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingIds.has(transaction.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {transactions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('transactions.noTransactions')}</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    {t('common.previous')}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t('transactions.pageOf', { page: currentPage, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('transactions.deleteTransaction')}
        description={t('transactions.confirmDelete')}
        itemName={transactionToDelete?.description}
        isLoading={transactionToDelete ? deletingIds.has(transactionToDelete.id) : false}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </div>
  )
}