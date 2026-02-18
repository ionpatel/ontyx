'use client'

import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Undo2 } from 'lucide-react'

interface UndoAction<T> {
  id: string
  label: string
  data: T
  restore: (data: T) => Promise<void>
  expiresAt: number
}

const UNDO_TIMEOUT_MS = 5000 // 5 seconds to undo

/**
 * Hook for managing undoable actions with toast notifications.
 * 
 * Usage:
 * const { executeWithUndo } = useUndo()
 * 
 * const handleDelete = async (contact: Contact) => {
 *   await executeWithUndo({
 *     label: `Deleted ${contact.name}`,
 *     execute: () => deleteContact(contact.id),
 *     undo: () => restoreContact(contact),
 *   })
 * }
 */
export function useUndo() {
  const [pendingActions, setPendingActions] = useState<Map<string, UndoAction<any>>>(new Map())
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const executeWithUndo = useCallback(async <T>({
    label,
    execute,
    undo,
    data,
  }: {
    label: string
    execute: () => Promise<void>
    undo: (data: T) => Promise<void>
    data: T
  }) => {
    const actionId = crypto.randomUUID()

    // Execute the action
    await execute()

    // Store the undo action
    const action: UndoAction<T> = {
      id: actionId,
      label,
      data,
      restore: undo,
      expiresAt: Date.now() + UNDO_TIMEOUT_MS,
    }

    setPendingActions(prev => new Map(prev).set(actionId, action))

    // Show toast with undo button
    toast(label, {
      duration: UNDO_TIMEOUT_MS,
      action: {
        label: 'Undo',
        onClick: () => handleUndo(actionId),
      },
    })

    // Set timeout to clear the action
    const timeout = setTimeout(() => {
      setPendingActions(prev => {
        const next = new Map(prev)
        next.delete(actionId)
        return next
      })
      timeoutRefs.current.delete(actionId)
    }, UNDO_TIMEOUT_MS)

    timeoutRefs.current.set(actionId, timeout)

    return actionId
  }, [])

  const handleUndo = useCallback(async (actionId: string) => {
    const action = pendingActions.get(actionId)
    if (!action) return

    // Clear the timeout
    const timeout = timeoutRefs.current.get(actionId)
    if (timeout) {
      clearTimeout(timeout)
      timeoutRefs.current.delete(actionId)
    }

    // Execute the undo
    try {
      await action.restore(action.data)
      toast.success('Action undone')
    } catch (error) {
      toast.error('Failed to undo')
      console.error('Undo failed:', error)
    }

    // Remove from pending
    setPendingActions(prev => {
      const next = new Map(prev)
      next.delete(actionId)
      return next
    })
  }, [pendingActions])

  const clearPendingActions = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    timeoutRefs.current.clear()
    setPendingActions(new Map())
  }, [])

  return {
    executeWithUndo,
    handleUndo,
    clearPendingActions,
    hasPendingActions: pendingActions.size > 0,
  }
}

/**
 * Simple undo toast without the full hook (for one-off actions)
 */
export function showUndoToast<T>({
  label,
  onUndo,
}: {
  label: string
  onUndo: () => Promise<void>
}) {
  toast(label, {
    duration: UNDO_TIMEOUT_MS,
    action: {
      label: 'Undo',
      onClick: async () => {
        try {
          await onUndo()
          toast.success('Action undone')
        } catch (error) {
          toast.error('Failed to undo')
        }
      },
    },
  })
}
