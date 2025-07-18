'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  CreditCard, 
  Plus, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Building,
  Calendar,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { PageLoader } from '@/components/ui/page-loader'
import { useTranslations } from '@/hooks/use-translations'

interface BankAccount {
  id: string
  institutionName: string
  accountNumber: string
  accountType: string
  balance: number
  formattedBalance: string
  currency: string
  isActive: boolean
  lastSyncAt: string | null
  transactionCount: number
  createdAt: string
}

export default function AccountsPage() {
  const { t, locale } = useTranslations()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [balancesVisible, setBalancesVisible] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [showCredentialsForm, setShowCredentialsForm] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '' })

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const toggleBalanceVisibility = () => {
    setBalancesVisible(!balancesVisible)
  }

  const formatAccountNumber = (accountNumber: string) => {
    return `****${accountNumber.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    const localeCode = locale === 'es' ? 'es-CO' : 'en-US'
    return new Date(dateString).toLocaleDateString(localeCode, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleConnectBancolombia = async () => {
    setConnecting(true)
    try {
      const response = await fetch('/api/belvo/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institution: 'bancolombia_co_business'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Connect response:', data)
        if (data.requiresManualConnection) {
          setShowCredentialsForm(true)
        } else if (data.redirectUrl) {
          // Open Belvo Connect in a popup
          const popup = window.open(
            data.redirectUrl, 
            'belvo-connect',
            'width=600,height=800,scrollbars=yes,resizable=yes'
          )
          
          // Check if popup was closed
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed)
              // Refresh accounts after connection
              fetchAccounts()
            }
          }, 1000)
        } else {
          console.error('Unexpected response:', data)
        }
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        alert(`Error: ${errorData.error || t('accounts.failedToInitiate')}`)
      }
    } catch (error) {
      console.error('Error connecting to Bancolombia:', error)
    } finally {
      setConnecting(false)
    }
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    
    try {
      const response = await fetch('/api/belvo/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          institution: 'bancolombia_co_business',
          username: credentials.username,
          password: credentials.password,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Link created:', data)
        setShowCredentialsForm(false)
        setCredentials({ username: '', password: '' })
        fetchAccounts() // Refresh accounts list
        toast.success('¡Cuenta conectada exitosamente!', {
          description: `Se crearon ${data.accounts} cuenta(s) y se importaron ${data.transactions} transacciones.`
        })
      } else {
        const errorData = await response.json()
        console.error('Link creation error:', errorData)
        toast.error(t('accounts.errorConnectingAccount'), {
          description: errorData.error || t('accounts.connectionFailedDescription')
        })
      }
    } catch (error) {
      console.error('Error creating link:', error)
      toast.error(t('accounts.connectionFailed'), {
        description: t('accounts.connectionFailedDescription')
      })
    } finally {
      setConnecting(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const activeAccounts = accounts.filter(account => account.isActive).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{t('accounts.title')}</h2>
          <p className="text-muted-foreground">
            {t('accounts.description')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={toggleBalanceVisibility}>
            {balancesVisible ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                {t('common.hide')}
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                {t('common.show')}
              </>
            )}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="text-white">
                <Plus className="mr-2 h-4 w-4" />
                {t('accounts.connectAccount')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('accounts.connectBankAccount')}</DialogTitle>
                <DialogDescription>
                  {t('accounts.description')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {!showCredentialsForm ? (
                  <div className="text-center py-8">
                    <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t('accounts.belvoIntegration')}</h3>
                    <p className="text-muted-foreground mb-4">
                      {t('accounts.belvoDescription')}
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={handleConnectBancolombia}
                      disabled={connecting}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {connecting ? t('accounts.connecting') : t('accounts.connectBancolombia')}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    <div className="text-center mb-4">
                      <Building className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold">{t('accounts.connectToBancolombia')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('accounts.credentialsRequired')}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">{t('accounts.username')}</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder={t('accounts.usernamePlaceholder')}
                        value={credentials.username}
                        onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('accounts.password')}</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={t('accounts.passwordPlaceholder')}
                        value={credentials.password}
                        onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
                      🔒 {t('accounts.secureDescription')}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setShowCredentialsForm(false)
                          setCredentials({ username: '', password: '' })
                        }}
                      >
                        {t('accounts.cancel')}
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={connecting}
                      >
                        {connecting ? t('accounts.connecting') : t('accounts.connect')}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('accounts.totalBalance')}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balancesVisible 
                ? new Intl.NumberFormat(locale === 'es' ? 'es-CO' : 'en-US', {
                    style: 'currency',
                    currency: 'COP'
                  }).format(totalBalance)
                : '••••••••'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {t('budget.acrossAllBudgets')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('accounts.activeAccounts')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAccounts}</div>
            <p className="text-xs text-muted-foreground">
              {t('accounts.connected')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('accounts.lastSync')}</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.length > 0 && accounts[0].lastSyncAt
                ? formatDate(accounts[0].lastSyncAt).split(' ')[0]
                : t('accounts.never')
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {t('accounts.lastSync')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('accounts.transactions')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.reduce((sum, account) => sum + account.transactionCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('common.total')}
            </p>
          </CardContent>
        </Card>
      </div>

      {accounts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.institutionName}</CardTitle>
                      <CardDescription>
                        {formatAccountNumber(account.accountNumber)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={account.isActive ? 'default' : 'secondary'}>
                    {account.isActive ? t('accounts.active') : t('accounts.inactive')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">{t('accounts.currentBalance')}</div>
                  <div className="text-2xl font-bold">
                    {balancesVisible 
                      ? account.formattedBalance
                      : '••••••••'
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">{t('accounts.accountType')}</div>
                    <div className="font-medium capitalize">{account.accountType}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">{t('accounts.currency')}</div>
                    <div className="font-medium">{account.currency}</div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('accounts.transactions')}</span>
                    <span className="font-medium">{account.transactionCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('accounts.lastSync')}</span>
                    <span className="font-medium">
                      {account.lastSyncAt 
                        ? formatDate(account.lastSyncAt)
                        : t('accounts.never')
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('accounts.connected')}</span>
                    <span className="font-medium">
                      {formatDate(account.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('accounts.sync')}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="mr-2 h-4 w-4" />
                    {t('accounts.details')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('accounts.noAccountsTitle')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('accounts.noAccountsDescription')}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('accounts.connectAccount')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('accounts.connectBankAccount')}</DialogTitle>
                  <DialogDescription>
                    {t('accounts.belvoDescription')}
                  </DialogDescription>
                </DialogHeader>
                <div className="text-center py-8">
                  <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('accounts.secureBankConnection')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('accounts.secureDescription')}
                  </p>
                  <Button 
                    className="w-full"
                    onClick={handleConnectBancolombia}
                    disabled={connecting}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {connecting ? t('accounts.connecting') : t('accounts.connectBancolombiaAccount')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}