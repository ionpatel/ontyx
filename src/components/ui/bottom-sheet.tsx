'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: ReactNode
  className?: string
  showHandle?: boolean
}

/**
 * Mobile-friendly bottom sheet component.
 * Slides up from bottom with drag-to-close.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
  showHandle = true,
}: BottomSheetProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onOpenChange(false)
              }
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background rounded-t-2xl shadow-2xl",
              "max-h-[90vh] overflow-hidden",
              className
            )}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="font-semibold">{title}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Filter bottom sheet with apply/reset buttons
 */
interface FilterSheetProps extends Omit<BottomSheetProps, 'children'> {
  onApply: () => void
  onReset: () => void
  children: ReactNode
  applyLabel?: string
  resetLabel?: string
}

export function FilterSheet({
  open,
  onOpenChange,
  title = 'Filters',
  children,
  onApply,
  onReset,
  applyLabel = 'Apply Filters',
  resetLabel = 'Reset',
  ...props
}: FilterSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      {...props}
    >
      <div className="space-y-4">
        {children}
      </div>

      {/* Fixed footer with buttons */}
      <div className="sticky bottom-0 -mx-4 -mb-4 mt-4 p-4 bg-background border-t flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            onReset()
            onOpenChange(false)
          }}
        >
          {resetLabel}
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            onApply()
            onOpenChange(false)
          }}
        >
          {applyLabel}
        </Button>
      </div>
    </BottomSheet>
  )
}

/**
 * Action sheet for mobile action menus
 */
interface ActionSheetAction {
  label: string
  icon?: React.ElementType
  onClick: () => void
  variant?: 'default' | 'destructive'
}

interface ActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  actions: ActionSheetAction[]
}

export function ActionSheet({
  open,
  onOpenChange,
  title,
  actions,
}: ActionSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} showHandle={true}>
      {title && (
        <p className="text-sm text-muted-foreground text-center mb-3">{title}</p>
      )}
      <div className="space-y-1">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            className={cn(
              "w-full justify-start h-12 text-base",
              action.variant === 'destructive' && "text-destructive hover:text-destructive"
            )}
            onClick={() => {
              action.onClick()
              onOpenChange(false)
            }}
          >
            {action.icon && <action.icon className="h-5 w-5 mr-3" />}
            {action.label}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        className="w-full mt-3 h-12"
        onClick={() => onOpenChange(false)}
      >
        Cancel
      </Button>
    </BottomSheet>
  )
}
