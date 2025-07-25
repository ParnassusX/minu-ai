'use client'

import { useState, useCallback } from 'react'

export interface BatchSelectionHook<T> {
  selectedItems: Set<string>
  isSelected: (id: string) => boolean
  toggleSelection: (id: string) => void
  selectAll: (items: T[]) => void
  clearSelection: () => void
  selectRange: (startId: string, endId: string, items: T[]) => void
  getSelectedItems: (items: T[]) => T[]
  selectedCount: number
}

export function useBatchSelection<T extends { id: string }>(): BatchSelectionHook<T> {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const isSelected = useCallback((id: string) => {
    return selectedItems.has(id)
  }, [selectedItems])

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback((items: T[]) => {
    setSelectedItems(new Set(items.map(item => item.id)))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  const selectRange = useCallback((startId: string, endId: string, items: T[]) => {
    const startIndex = items.findIndex(item => item.id === startId)
    const endIndex = items.findIndex(item => item.id === endId)
    
    if (startIndex === -1 || endIndex === -1) return

    const [start, end] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex]
    const rangeIds = items.slice(start, end + 1).map(item => item.id)
    
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      rangeIds.forEach(id => newSet.add(id))
      return newSet
    })
  }, [])

  const getSelectedItems = useCallback((items: T[]) => {
    return items.filter(item => selectedItems.has(item.id))
  }, [selectedItems])

  return {
    selectedItems,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectRange,
    getSelectedItems,
    selectedCount: selectedItems.size
  }
}
