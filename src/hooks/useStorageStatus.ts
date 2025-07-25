/**
 * Storage Status Hook
 * Manages storage operation states and provides real-time updates
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { StorageProgressData } from '@/components/ui/StorageProgress'

export interface StorageOperation {
  id: string
  type: 'upload' | 'download' | 'delete'
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'
  progress: StorageProgressData
  startTime: number
  endTime?: number
  retryCount: number
  maxRetries: number
}

export interface StorageStatusState {
  operations: Record<string, StorageOperation>
  activeOperations: string[]
  completedOperations: string[]
  failedOperations: string[]
  totalBytesTransferred: number
  totalOperations: number
}

export function useStorageStatus() {
  const [state, setState] = useState<StorageStatusState>({
    operations: {},
    activeOperations: [],
    completedOperations: [],
    failedOperations: [],
    totalBytesTransferred: 0,
    totalOperations: 0
  })

  const operationTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  /**
   * Start a new storage operation
   */
  const startOperation = useCallback((
    id: string,
    type: 'upload' | 'download' | 'delete',
    initialProgress: Partial<StorageProgressData> = {}
  ) => {
    const operation: StorageOperation = {
      id,
      type,
      status: 'active',
      progress: {
        stage: 'downloading',
        fileIndex: 0,
        totalFiles: 1,
        progress: 0,
        ...initialProgress
      },
      startTime: Date.now(),
      retryCount: 0,
      maxRetries: 3
    }

    setState(prev => ({
      ...prev,
      operations: {
        ...prev.operations,
        [id]: operation
      },
      activeOperations: [...prev.activeOperations, id],
      totalOperations: prev.totalOperations + 1
    }))

    return operation
  }, [])

  /**
   * Update operation progress
   */
  const updateProgress = useCallback((
    id: string,
    progressUpdate: Partial<StorageProgressData>
  ) => {
    setState(prev => {
      const operation = prev.operations[id]
      if (!operation) return prev

      const updatedOperation = {
        ...operation,
        progress: {
          ...operation.progress,
          ...progressUpdate
        }
      }

      return {
        ...prev,
        operations: {
          ...prev.operations,
          [id]: updatedOperation
        }
      }
    })
  }, [])

  /**
   * Complete an operation
   */
  const completeOperation = useCallback((id: string, finalData?: any) => {
    setState(prev => {
      const operation = prev.operations[id]
      if (!operation) return prev

      const updatedOperation = {
        ...operation,
        status: 'completed' as const,
        endTime: Date.now(),
        progress: {
          ...operation.progress,
          stage: 'complete' as const,
          progress: 100
        }
      }

      return {
        ...prev,
        operations: {
          ...prev.operations,
          [id]: updatedOperation
        },
        activeOperations: prev.activeOperations.filter(opId => opId !== id),
        completedOperations: [...prev.completedOperations, id],
        totalBytesTransferred: prev.totalBytesTransferred + (operation.progress.bytesTransferred || 0)
      }
    })

    // Clear any timeout for this operation
    if (operationTimeouts.current[id]) {
      clearTimeout(operationTimeouts.current[id])
      delete operationTimeouts.current[id]
    }
  }, [])

  /**
   * Fail an operation
   */
  const failOperation = useCallback((id: string, error: string) => {
    setState(prev => {
      const operation = prev.operations[id]
      if (!operation) return prev

      const updatedOperation = {
        ...operation,
        status: 'failed' as const,
        endTime: Date.now(),
        progress: {
          ...operation.progress,
          stage: 'error' as const,
          error
        }
      }

      return {
        ...prev,
        operations: {
          ...prev.operations,
          [id]: updatedOperation
        },
        activeOperations: prev.activeOperations.filter(opId => opId !== id),
        failedOperations: [...prev.failedOperations, id]
      }
    })
  }, [])

  /**
   * Retry a failed operation
   */
  const retryOperation = useCallback((id: string) => {
    setState(prev => {
      const operation = prev.operations[id]
      if (!operation || operation.retryCount >= operation.maxRetries) return prev

      const updatedOperation = {
        ...operation,
        status: 'active' as const,
        retryCount: operation.retryCount + 1,
        progress: {
          ...operation.progress,
          stage: 'downloading' as const,
          progress: 0,
          error: undefined
        }
      }

      return {
        ...prev,
        operations: {
          ...prev.operations,
          [id]: updatedOperation
        },
        activeOperations: [...prev.activeOperations, id],
        failedOperations: prev.failedOperations.filter(opId => opId !== id)
      }
    })
  }, [])

  /**
   * Cancel an operation
   */
  const cancelOperation = useCallback((id: string) => {
    setState(prev => {
      const operation = prev.operations[id]
      if (!operation) return prev

      const updatedOperation = {
        ...operation,
        status: 'cancelled' as const,
        endTime: Date.now()
      }

      return {
        ...prev,
        operations: {
          ...prev.operations,
          [id]: updatedOperation
        },
        activeOperations: prev.activeOperations.filter(opId => opId !== id)
      }
    })

    // Clear any timeout for this operation
    if (operationTimeouts.current[id]) {
      clearTimeout(operationTimeouts.current[id])
      delete operationTimeouts.current[id]
    }
  }, [])

  /**
   * Clear completed operations
   */
  const clearCompleted = useCallback(() => {
    setState(prev => {
      const newOperations = { ...prev.operations }
      prev.completedOperations.forEach(id => {
        delete newOperations[id]
      })

      return {
        ...prev,
        operations: newOperations,
        completedOperations: []
      }
    })
  }, [])

  /**
   * Clear all operations
   */
  const clearAll = useCallback(() => {
    // Clear all timeouts
    Object.values(operationTimeouts.current).forEach(timeout => {
      clearTimeout(timeout)
    })
    operationTimeouts.current = {}

    setState({
      operations: {},
      activeOperations: [],
      completedOperations: [],
      failedOperations: [],
      totalBytesTransferred: 0,
      totalOperations: 0
    })
  }, [])

  /**
   * Get operation by ID
   */
  const getOperation = useCallback((id: string) => {
    return state.operations[id]
  }, [state.operations])

  /**
   * Get operations by status
   */
  const getOperationsByStatus = useCallback((status: StorageOperation['status']) => {
    return Object.values(state.operations).filter(op => op.status === status)
  }, [state.operations])

  /**
   * Check if any operations are active
   */
  const hasActiveOperations = state.activeOperations.length > 0

  /**
   * Get overall progress for all active operations
   */
  const getOverallProgress = useCallback(() => {
    const activeOps = state.activeOperations.map(id => state.operations[id])
    if (activeOps.length === 0) return 100

    const totalProgress = activeOps.reduce((sum, op) => sum + op.progress.progress, 0)
    return Math.round(totalProgress / activeOps.length)
  }, [state.activeOperations, state.operations])

  /**
   * Auto-timeout operations that take too long
   */
  const setOperationTimeout = useCallback((id: string, timeoutMs: number = 300000) => { // 5 minutes
    if (operationTimeouts.current[id]) {
      clearTimeout(operationTimeouts.current[id])
    }

    operationTimeouts.current[id] = setTimeout(() => {
      failOperation(id, 'Operation timed out')
      delete operationTimeouts.current[id]
    }, timeoutMs)
  }, [failOperation])

  return {
    // State
    operations: state.operations,
    activeOperations: state.activeOperations,
    completedOperations: state.completedOperations,
    failedOperations: state.failedOperations,
    totalBytesTransferred: state.totalBytesTransferred,
    totalOperations: state.totalOperations,
    hasActiveOperations,

    // Actions
    startOperation,
    updateProgress,
    completeOperation,
    failOperation,
    retryOperation,
    cancelOperation,
    clearCompleted,
    clearAll,
    setOperationTimeout,

    // Getters
    getOperation,
    getOperationsByStatus,
    getOverallProgress
  }
}

export default useStorageStatus
