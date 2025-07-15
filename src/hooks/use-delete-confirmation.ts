'use client'

import { useState } from 'react'

interface UseDeleteConfirmationOptions<T> {
  onDelete: (item: T) => Promise<void>
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useDeleteConfirmation<T = any>({
  onDelete,
  onSuccess,
  onError
}: UseDeleteConfirmationOptions<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [item, setItem] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const openModal = (itemToDelete: T) => {
    setItem(itemToDelete)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setItem(null)
  }

  const confirmDelete = async () => {
    if (!item) return

    setIsLoading(true)
    try {
      await onDelete(item)
      onSuccess?.()
      closeModal()
    } catch (error) {
      onError?.(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isOpen,
    item,
    isLoading,
    openModal,
    closeModal,
    confirmDelete
  }
}