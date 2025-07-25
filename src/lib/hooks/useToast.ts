'use client'

import * as React from 'react'

import type {
  ToastActionElement,
  ToastProps,
} from '@/components/ui/toast'

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType['ADD_TOAST']
      toast: ToasterToast
    }
  | {
      type: ActionType['UPDATE_TOAST']
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType['DISMISS_TOAST']
      toastId?: ToasterToast['id']
    }
  | {
      type: ActionType['REMOVE_TOAST']
      toastId?: ToasterToast['id']
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case 'DISMISS_TOAST': {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, 'id'>

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

// Enhanced helper functions for professional toast types
export const toastHelpers = {
  success: (title: string, description?: string, options?: Partial<Toast>) => {
    return toast({
      title,
      description,
      variant: 'success',
      ...options,
    })
  },
  error: (title: string, description?: string, options?: Partial<Toast>) => {
    return toast({
      title,
      description,
      variant: 'destructive',
      ...options,
    })
  },
  warning: (title: string, description?: string, options?: Partial<Toast>) => {
    return toast({
      title,
      description,
      variant: 'warning',
      ...options,
    })
  },
  info: (title: string, description?: string, options?: Partial<Toast>) => {
    return toast({
      title,
      description,
      variant: 'info',
      ...options,
    })
  },
  loading: (title: string, description?: string, options?: Partial<Toast>) => {
    return toast({
      title,
      description,
      variant: 'loading',
      duration: Infinity, // Don't auto-dismiss loading toasts
      ...options,
    })
  },
  // Professional toast variants
  imageGeneration: {
    started: (modelName?: string) => {
      return toast({
        title: 'Image Generation Started',
        description: modelName ? `Using ${modelName} model` : 'AI is creating your image...',
        variant: 'loading',
        duration: Infinity,
      })
    },
    completed: (count: number = 1) => {
      return toast({
        title: 'Image Generation Complete',
        description: `Successfully generated ${count} image${count > 1 ? 's' : ''}`,
        variant: 'success',
        duration: 5000,
      })
    },
    failed: (error?: string) => {
      return toast({
        title: 'Image Generation Failed',
        description: error || 'An error occurred during generation',
        variant: 'destructive',
        duration: 8000,
      })
    }
  },
  auth: {
    signedIn: (email?: string) => {
      return toast({
        title: 'Welcome back!',
        description: email ? `Signed in as ${email}` : 'Successfully signed in',
        variant: 'success',
        duration: 4000,
      })
    },
    signedOut: () => {
      return toast({
        title: 'Signed out',
        description: 'You have been successfully signed out',
        variant: 'info',
        duration: 3000,
      })
    },
    error: (message?: string) => {
      return toast({
        title: 'Authentication Error',
        description: message || 'Please try again',
        variant: 'destructive',
        duration: 6000,
      })
    }
  },
  api: {
    keyUpdated: (provider: string) => {
      return toast({
        title: 'API Key Updated',
        description: `${provider} API key has been saved successfully`,
        variant: 'success',
        duration: 4000,
      })
    },
    connectionError: (service: string) => {
      return toast({
        title: 'Connection Error',
        description: `Unable to connect to ${service}. Please check your settings.`,
        variant: 'destructive',
        duration: 8000,
      })
    }
  }
}

export { useToast, toast }
