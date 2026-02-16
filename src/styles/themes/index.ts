/**
 * ONTYX THEMES
 * ============
 * Central export for all theme definitions.
 */

export { mapleTheme } from './maple'
export { frostTheme } from './frost'
export { shieldTheme } from './shield'

import { mapleTheme } from './maple'
import { frostTheme } from './frost'
import { shieldTheme } from './shield'

// All available themes
export const themes = {
  maple: mapleTheme,
  frost: frostTheme,
  shield: shieldTheme,
} as const

export type ThemeName = keyof typeof themes
export type Theme = typeof themes[ThemeName]

// Default theme
export const defaultTheme: ThemeName = 'maple'

/**
 * Get theme by name
 */
export function getTheme(name: ThemeName) {
  return themes[name]
}

/**
 * Convert theme to CSS custom properties
 */
export function themeToCssVars(theme: Theme, mode: 'light' | 'dark') {
  const values = theme[mode]
  
  return {
    '--background': values.background,
    '--background-secondary': values.backgroundSecondary,
    '--background-tertiary': values.backgroundTertiary,
    '--surface': values.surface,
    '--surface-hover': values.surfaceHover,
    '--surface-active': values.surfaceActive,
    '--primary': values.primary,
    '--primary-hover': values.primaryHover,
    '--primary-active': values.primaryActive,
    '--primary-light': values.primaryLight,
    '--primary-foreground': values.primaryForeground,
    '--secondary': values.secondary,
    '--secondary-hover': values.secondaryHover,
    '--secondary-active': values.secondaryActive,
    '--secondary-foreground': values.secondaryForeground,
    '--text-primary': values.textPrimary,
    '--text-secondary': values.textSecondary,
    '--text-tertiary': values.textTertiary,
    '--text-muted': values.textMuted,
    '--text-inverse': values.textInverse,
    '--border': values.border,
    '--border-hover': values.borderHover,
    '--border-focus': values.borderFocus,
    '--success': values.success,
    '--success-light': values.successLight,
    '--warning': values.warning,
    '--warning-light': values.warningLight,
    '--error': values.error,
    '--error-light': values.errorLight,
    '--info': values.info,
    '--info-light': values.infoLight,
    '--ring': values.ring,
    '--sidebar-background': values.sidebarBackground,
    '--sidebar-border': values.sidebarBorder,
    '--sidebar-item-hover': values.sidebarItemHover,
    '--sidebar-item-active': values.sidebarItemActive,
    '--sidebar-item-active-text': values.sidebarItemActiveText,
    '--chart-1': values.chart1,
    '--chart-2': values.chart2,
    '--chart-3': values.chart3,
    '--chart-4': values.chart4,
    '--chart-5': values.chart5,
  }
}
