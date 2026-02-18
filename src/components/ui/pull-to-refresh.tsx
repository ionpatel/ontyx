'use client'

import { useState, useRef, ReactNode } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Loader2, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  className?: string
  threshold?: number
  disabled?: boolean
}

/**
 * Pull-to-refresh wrapper for mobile lists.
 * Wrap your scrollable content with this component.
 * 
 * Usage:
 * <PullToRefresh onRefresh={async () => await refetch()}>
 *   <InvoiceList />
 * </PullToRefresh>
 */
export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  
  const pullDistance = useMotionValue(0)
  const pullProgress = useTransform(pullDistance, [0, threshold], [0, 1])
  const indicatorY = useTransform(pullDistance, [0, threshold * 1.5], [-40, 20])
  const indicatorOpacity = useTransform(pullDistance, [0, threshold / 2], [0, 1])
  const indicatorRotation = useTransform(pullDistance, [0, threshold], [0, 180])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || refreshing) return
    
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop > 0) return // Only activate when at top
    
    startY.current = e.touches[0].clientY
    setPulling(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pulling || disabled || refreshing) return
    
    const currentY = e.touches[0].clientY
    const diff = Math.max(0, currentY - startY.current)
    
    // Apply resistance
    const distance = Math.min(diff * 0.5, threshold * 1.5)
    pullDistance.set(distance)
  }

  const handleTouchEnd = async () => {
    if (!pulling || disabled) return
    
    const distance = pullDistance.get()
    
    if (distance >= threshold && !refreshing) {
      setRefreshing(true)
      pullDistance.set(threshold / 2)
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setRefreshing(false)
      }
    }
    
    pullDistance.set(0)
    setPulling(false)
  }

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        style={{ 
          y: indicatorY,
          opacity: indicatorOpacity,
        }}
      >
        <div className="w-10 h-10 rounded-full bg-background shadow-lg border flex items-center justify-center">
          {refreshing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <motion.div style={{ rotate: indicatorRotation }}>
              <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y: refreshing ? threshold / 2 : pullDistance }}
      >
        {children}
      </motion.div>
    </div>
  )
}
