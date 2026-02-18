'use client'

import { useEffect, useState } from 'react'
import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['⌘', 'K'], description: 'Open search', category: 'Navigation' },
  { keys: ['⌘', '/'], description: 'Show shortcuts', category: 'Navigation' },
  { keys: ['G', 'D'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['G', 'I'], description: 'Go to Invoices', category: 'Navigation' },
  { keys: ['G', 'C'], description: 'Go to Contacts', category: 'Navigation' },
  { keys: ['G', 'P'], description: 'Go to Products', category: 'Navigation' },
  { keys: ['G', 'S'], description: 'Go to Settings', category: 'Navigation' },
  
  // Actions
  { keys: ['N', 'I'], description: 'New Invoice', category: 'Actions' },
  { keys: ['N', 'C'], description: 'New Contact', category: 'Actions' },
  { keys: ['N', 'P'], description: 'New Product', category: 'Actions' },
  
  // General
  { keys: ['Esc'], description: 'Close dialog/modal', category: 'General' },
  { keys: ['⌘', 'S'], description: 'Save (in forms)', category: 'General' },
]

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘/ or Ctrl+/ to show shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Group shortcuts by category
  const grouped = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = []
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-9 w-9"
        title="Keyboard shortcuts (⌘/)"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {Object.entries(grouped).map(([category, shortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex}>
                            <kbd className={cn(
                              "px-2 py-1 text-xs font-semibold rounded",
                              "bg-muted border shadow-sm",
                              "min-w-[24px] text-center inline-block"
                            )}>
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="mx-0.5 text-muted-foreground">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd> to close
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Hook for registering navigation shortcuts
export function useNavigationShortcuts() {
  useEffect(() => {
    let lastKey = ''
    let lastKeyTime = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const now = Date.now()
      const key = e.key.toUpperCase()

      // Two-key shortcuts (G+X for navigation, N+X for new)
      if (now - lastKeyTime < 500) {
        if (lastKey === 'G') {
          switch (key) {
            case 'D':
              window.location.href = '/dashboard'
              break
            case 'I':
              window.location.href = '/invoices'
              break
            case 'C':
              window.location.href = '/contacts'
              break
            case 'P':
              window.location.href = '/inventory'
              break
            case 'S':
              window.location.href = '/settings'
              break
          }
        } else if (lastKey === 'N') {
          switch (key) {
            case 'I':
              window.location.href = '/invoices/new'
              break
            case 'C':
              window.location.href = '/contacts/new'
              break
            case 'P':
              window.location.href = '/inventory/new'
              break
          }
        }
      }

      lastKey = key
      lastKeyTime = now
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}
