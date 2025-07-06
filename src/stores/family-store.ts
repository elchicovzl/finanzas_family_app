'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

interface FamilyStore {
  families: Family[]
  currentFamily: Family | null
  loading: boolean
  error: string | null
  fetchFamilies: () => Promise<void>
  refreshFamilies: () => Promise<void>
  switchFamily: (familyId: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set, get) => ({
      families: [],
      currentFamily: null,
      loading: true,
      error: null,

      fetchFamilies: async () => {
        set({ loading: true, error: null })
        
        try {
          const response = await fetch('/api/families')
          
          if (response.ok) {
            const familyData = await response.json()
            set({ families: familyData })
            
            // Set current family to first one if none selected
            const { currentFamily } = get()
            if (familyData.length > 0 && !currentFamily) {
              set({ currentFamily: familyData[0] })
            }
          } else {
            const errorData = await response.json()
            set({ error: errorData.error || 'Failed to load families' })
          }
        } catch (error) {
          console.error('Error fetching families:', error)
          set({ error: 'Failed to load families' })
        } finally {
          set({ loading: false })
        }
      },

      refreshFamilies: async () => {
        const { fetchFamilies } = get()
        await fetchFamilies()
      },

      switchFamily: (familyId: string) => {
        const { families } = get()
        const family = families.find(f => f.id === familyId)
        if (family) {
          set({ currentFamily: family })
        }
      },

      setLoading: (loading: boolean) => set({ loading }),
      
      setError: (error: string | null) => set({ error }),

      reset: () => set({
        families: [],
        currentFamily: null,
        loading: true,
        error: null
      })
    }),
    {
      name: 'family-store',
      partialize: (state) => ({
        currentFamily: state.currentFamily
      })
    }
  )
)

export type { Family, FamilyMember }