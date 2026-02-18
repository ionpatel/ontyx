'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface AutosaveOptions {
  key: string
  debounceMs?: number
  onRestore?: (data: any) => void
}

/**
 * Autosave form data to localStorage with debounce.
 * Survives browser crashes, tab closes, and accidental navigation.
 * 
 * Usage:
 * const { save, restore, clear, hasSavedData } = useAutosave({
 *   key: 'invoice-draft',
 *   onRestore: (data) => setFormData(data)
 * })
 * 
 * // Call save() whenever form data changes
 * useEffect(() => { save(formData) }, [formData])
 * 
 * // Clear when successfully submitted
 * onSubmit: () => { ... clear() }
 */
export function useAutosave<T>({ key, debounceMs = 2000, onRestore }: AutosaveOptions) {
  const storageKey = `ontyx-autosave-${key}`
  const timeoutRef = useRef<NodeJS.Timeout>()
  const [hasSavedData, setHasSavedData] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Check for existing saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const { data, timestamp } = JSON.parse(saved)
        // Only consider data from last 24 hours
        const age = Date.now() - timestamp
        if (age < 24 * 60 * 60 * 1000) {
          setHasSavedData(true)
          setLastSaved(new Date(timestamp))
        } else {
          // Clear stale data
          localStorage.removeItem(storageKey)
        }
      }
    } catch (e) {
      console.error('Autosave: Failed to check saved data', e)
    }
  }, [storageKey])

  // Save with debounce
  const save = useCallback((data: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const payload = {
          data,
          timestamp: Date.now(),
        }
        localStorage.setItem(storageKey, JSON.stringify(payload))
        setHasSavedData(true)
        setLastSaved(new Date())
      } catch (e) {
        console.error('Autosave: Failed to save', e)
      }
    }, debounceMs)
  }, [storageKey, debounceMs])

  // Restore saved data
  const restore = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const { data } = JSON.parse(saved)
        onRestore?.(data)
        return data as T
      }
    } catch (e) {
      console.error('Autosave: Failed to restore', e)
    }
    return null
  }, [storageKey, onRestore])

  // Clear saved data (call after successful submit)
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setHasSavedData(false)
      setLastSaved(null)
    } catch (e) {
      console.error('Autosave: Failed to clear', e)
    }
  }, [storageKey])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    save,
    restore,
    clear,
    hasSavedData,
    lastSaved,
  }
}

/**
 * Autosave banner component to show recovery option
 */
import { AlertCircle, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AutosaveBannerProps {
  hasSavedData: boolean
  lastSaved: Date | null
  onRestore: () => void
  onDiscard: () => void
}

export function AutosaveBanner({ 
  hasSavedData, 
  lastSaved, 
  onRestore, 
  onDiscard 
}: AutosaveBannerProps) {
  if (!hasSavedData) return null

  const timeAgo = lastSaved 
    ? formatTimeAgo(lastSaved)
    : 'recently'

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-amber-800 dark:text-amber-200">
          You have unsaved changes from {timeAgo}
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onDiscard}
            className="h-7"
          >
            <X className="h-3 w-3 mr-1" />
            Discard
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={onRestore}
            className="h-7 bg-amber-600 hover:bg-amber-700"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restore
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return 'yesterday'
}
