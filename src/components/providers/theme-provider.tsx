'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes'

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

/**
 * Theme Provider
 * ==============
 * Wraps next-themes for dark/light mode support.
 * 
 * Features:
 * - System preference detection
 * - Persistent theme selection
 * - No flash on load (SSR safe)
 * - Smooth transitions
 * 
 * Usage:
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

/**
 * Theme Toggle Hook
 * =================
 * Easy access to theme state and toggle function.
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme()
  
  const toggleTheme = React.useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])
  
  const isDark = resolvedTheme === 'dark'
  const isLight = resolvedTheme === 'light'
  
  return {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
    toggleTheme,
    isDark,
    isLight,
  }
}
