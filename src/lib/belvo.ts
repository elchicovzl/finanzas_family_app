// Manual implementation using fetch since the belvo npm package may have compatibility issues

const BELVO_BASE_URL = process.env.BELVO_ENVIRONMENT === 'production' 
  ? 'https://api.belvo.com' 
  : 'https://sandbox.belvo.com'

class BelvoClient {
  private secretId: string
  private secretPassword: string
  private accessToken: string | null = null

  constructor(secretId: string, secretPassword: string) {
    this.secretId = secretId
    this.secretPassword = secretPassword
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken
    }

    const response = await fetch(`${BELVO_BASE_URL}/api/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.secretId,
        password: this.secretPassword,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status}`)
    }

    const data = await response.json()
    this.accessToken = data.access
    return this.accessToken
  }

  async request(endpoint: string, method: string = 'GET', body?: any) {
    const token = await this.getAccessToken()
    
    const response = await fetch(`${BELVO_BASE_URL}/api/${endpoint}/`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Belvo API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }
}

const belvoClient = new BelvoClient(
  process.env.BELVO_SECRET_ID!,
  process.env.BELVO_SECRET_PASSWORD!
)

export interface BelvoAccount {
  id: string
  institution: string
  name: string
  type: string
  balance: {
    current: number
    available: number
  }
  currency: string
  number: string
}

export interface BelvoTransaction {
  id: string
  account: string
  amount: number
  description: string
  date: string
  type: 'INFLOW' | 'OUTFLOW'
  category: string
  merchant?: {
    name: string
    category: string
  }
}

export interface BelvoLink {
  id: string
  institution: string
  access_mode: string
  status: string
  created_at: string
  external_id?: string
}

export class BelvoService {
  static async createLink(institution: string, username: string, password: string, externalId?: string): Promise<BelvoLink> {
    try {
      const link = await belvoClient.request('links', 'POST', {
        institution,
        username,
        password,
        external_id: externalId,
      })
      return link
    } catch (error) {
      console.error('Error creating Belvo link:', error)
      throw error
    }
  }

  static async getAccounts(linkId: string): Promise<BelvoAccount[]> {
    try {
      const response = await belvoClient.request('accounts', 'POST', {
        link: linkId,
      })
      return response.results || response
    } catch (error) {
      console.error('Error fetching accounts:', error)
      throw error
    }
  }

  static async getTransactions(linkId: string, dateFrom?: string, dateTo?: string): Promise<BelvoTransaction[]> {
    try {
      const body: any = { link: linkId }
      if (dateFrom) body.date_from = dateFrom
      if (dateTo) body.date_to = dateTo
      
      const response = await belvoClient.request('transactions', 'POST', body)
      return response.results || response
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  }

  static async refreshLink(linkId: string) {
    try {
      const link = await belvoClient.request(`links/${linkId}`, 'PATCH', {
        refresh: true
      })
      return link
    } catch (error) {
      console.error('Error refreshing link:', error)
      throw error
    }
  }

  static async deleteLink(linkId: string) {
    try {
      await belvoClient.request(`links/${linkId}`, 'DELETE')
      return true
    } catch (error) {
      console.error('Error deleting link:', error)
      throw error
    }
  }
}