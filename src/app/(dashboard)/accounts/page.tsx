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
    return new Date(dateString).toLocaleDateString('es-CO', {
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
        alert(`Error: ${errorData.error || 'Failed to initiate connection'}`)
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
        toast.error('Error connecting account', {
          description: errorData.error || 'Failed to connect to Bancolombia. Please try again.'
        })
      }
    } catch (error) {
      console.error('Error creating link:', error)
      toast.error('Connection failed', {
        description: 'Unable to connect to Bancolombia. Please check your credentials.'
      })
    } finally {
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  const activeAccounts = accounts.filter(account => account.isActive).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bank Accounts</h2>
          <p className="text-muted-foreground">
            Manage your connected bank accounts and view balances
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={toggleBalanceVisibility}>
            {balancesVisible ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Hide Balances
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Show Balances
              </>
            )}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Connect Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Bank Account</DialogTitle>
                <DialogDescription>
                  Connect your Bancolombia account to start tracking your finances
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {!showCredentialsForm ? (
                  <div className="text-center py-8">
                    <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belvo Integration</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect securely with your bank through Belvo&apos;s API
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={handleConnectBancolombia}
                      disabled={connecting}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      {connecting ? 'Connecting...' : 'Connect Bancolombia'}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    <div className="text-center mb-4">
                      <Building className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold">Connect to Bancolombia</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your Bancolombia online banking credentials
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username / Document</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Your Bancolombia username"
                        value={credentials.username}
                        onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Your Bancolombia password"
                        value={credentials.password}
                        onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
                      🔒 Your credentials are encrypted and securely transmitted to Belvo. 
                      We do not store your banking credentials.
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
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={connecting}
                      >
                        {connecting ? 'Connecting...' : 'Connect'}
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
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balancesVisible 
                ? new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP'
                  }).format(totalBalance)
                : '••••••••'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Across all accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Connected and syncing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.length > 0 && accounts[0].lastSyncAt
                ? formatDate(accounts[0].lastSyncAt).split(' ')[0]
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent update
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.reduce((sum, account) => sum + account.transactionCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total imported
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
                    {account.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                  <div className="text-2xl font-bold">
                    {balancesVisible 
                      ? account.formattedBalance
                      : '••••••••'
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Account Type</div>
                    <div className="font-medium capitalize">{account.accountType}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Currency</div>
                    <div className="font-medium">{account.currency}</div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Transactions</span>
                    <span className="font-medium">{account.transactionCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span className="font-medium">
                      {account.lastSyncAt 
                        ? formatDate(account.lastSyncAt)
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Connected</span>
                    <span className="font-medium">
                      {formatDate(account.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="mr-2 h-4 w-4" />
                    Details
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
            <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
            <p className="text-muted-foreground text-center mb-4">
              Connect your first bank account to start tracking your finances
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Your First Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Bank Account</DialogTitle>
                  <DialogDescription>
                    Connect your Bancolombia account through Belvo
                  </DialogDescription>
                </DialogHeader>
                <div className="text-center py-8">
                  <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Secure Bank Connection</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect safely with bank-level security through Belvo API
                  </p>
                  <Button 
                    className="w-full"
                    onClick={handleConnectBancolombia}
                    disabled={connecting}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {connecting ? 'Connecting...' : 'Connect Bancolombia Account'}
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