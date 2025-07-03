'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface FamilyMember {
  id: string
  role: 'ADMIN' | 'MEMBER' | 'VIEWER'
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface Family {
  id: string
  name: string
  description?: string
  myRole: 'ADMIN' | 'MEMBER' | 'VIEWER'
  joinedAt: string
  createdAt: string
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  members: FamilyMember[]
  memberCount: number
}

interface FamilyContextType {
  families: Family[]
  currentFamily: Family | null
  loading: boolean
  error: string | null
  refreshFamilies: () => Promise<void>
  switchFamily: (familyId: string) => void
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined)

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [families, setFamilies] = useState<Family[]>([])
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFamilies = async () => {
    if (status !== 'authenticated') {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch('/api/families')
      
      if (response.ok) {
        const familyData = await response.json()
        setFamilies(familyData)
        
        // Set current family to first one if none selected
        if (familyData.length > 0 && !currentFamily) {
          setCurrentFamily(familyData[0])
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load families')
      }
    } catch (error) {
      console.error('Error fetching families:', error)
      setError('Failed to load families')
    } finally {
      setLoading(false)
    }
  }

  const refreshFamilies = async () => {
    await fetchFamilies()
  }

  const switchFamily = (familyId: string) => {
    const family = families.find(f => f.id === familyId)
    if (family) {
      setCurrentFamily(family)
      // Store in localStorage for persistence
      localStorage.setItem('selectedFamilyId', familyId)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFamilies()
    } else if (status === 'unauthenticated') {
      setFamilies([])
      setCurrentFamily(null)
      setLoading(false)
    }
  }, [status])

  // Restore selected family from localStorage
  useEffect(() => {
    if (families.length > 0) {
      const savedFamilyId = localStorage.getItem('selectedFamilyId')
      if (savedFamilyId) {
        const savedFamily = families.find(f => f.id === savedFamilyId)
        if (savedFamily) {
          setCurrentFamily(savedFamily)
          return
        }
      }
      
      // Default to first family if no saved selection
      if (!currentFamily) {
        setCurrentFamily(families[0])
      }
    }
  }, [families])

  const value: FamilyContextType = {
    families,
    currentFamily,
    loading,
    error,
    refreshFamilies,
    switchFamily
  }

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamily() {
  const context = useContext(FamilyContext)
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider')
  }
  return context
}

export type { Family, FamilyMember }