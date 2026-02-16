/**
 * MAPLE PROFESSIONAL THEME
 * ========================
 * Bold Canadian red with clean white spaces.
 * Trustworthy, authoritative, distinctly Canadian.
 * 
 * Best for: Professional services, pharmacies, law firms, accounting
 */

import { colors } from '../tokens'

export const mapleTheme = {
  name: 'maple',
  label: 'Maple Professional',
  
  light: {
    // Backgrounds
    background: colors.white,
    backgroundSecondary: colors.slate[50],
    backgroundTertiary: colors.slate[100],
    
    // Surfaces (cards, dialogs)
    surface: colors.white,
    surfaceHover: colors.slate[50],
    surfaceActive: colors.slate[100],
    
    // Primary (Maple Red)
    primary: colors.maple[600],
    primaryHover: colors.maple[700],
    primaryActive: colors.maple[800],
    primaryLight: colors.maple[50],
    primaryForeground: colors.white,
    
    // Secondary
    secondary: colors.slate[100],
    secondaryHover: colors.slate[200],
    secondaryActive: colors.slate[300],
    secondaryForeground: colors.slate[900],
    
    // Text
    textPrimary: colors.slate[900],
    textSecondary: colors.slate[600],
    textTertiary: colors.slate[500],
    textMuted: colors.slate[400],
    textInverse: colors.white,
    
    // Borders
    border: colors.slate[200],
    borderHover: colors.slate[300],
    borderFocus: colors.maple[600],
    
    // States
    success: colors.success.DEFAULT,
    successLight: colors.success.light,
    warning: colors.warning.DEFAULT,
    warningLight: colors.warning.light,
    error: colors.error.DEFAULT,
    errorLight: colors.error.light,
    info: colors.info.DEFAULT,
    infoLight: colors.info.light,
    
    // Ring (focus)
    ring: colors.maple[600],
    
    // Sidebar
    sidebarBackground: colors.white,
    sidebarBorder: colors.slate[200],
    sidebarItemHover: colors.slate[100],
    sidebarItemActive: colors.maple[50],
    sidebarItemActiveText: colors.maple[700],
    
    // Chart colors
    chart1: colors.maple[600],
    chart2: colors.info.DEFAULT,
    chart3: colors.success.DEFAULT,
    chart4: colors.warning.DEFAULT,
    chart5: '#8B5CF6', // Purple
  },
  
  dark: {
    // Backgrounds
    background: colors.slate[950],
    backgroundSecondary: colors.slate[900],
    backgroundTertiary: colors.slate[800],
    
    // Surfaces (cards, dialogs)
    surface: colors.slate[900],
    surfaceHover: colors.slate[800],
    surfaceActive: colors.slate[700],
    
    // Primary (Maple Red - slightly lighter for dark mode)
    primary: colors.maple[500],
    primaryHover: colors.maple[400],
    primaryActive: colors.maple[600],
    primaryLight: `${colors.maple[900]}50`,
    primaryForeground: colors.white,
    
    // Secondary
    secondary: colors.slate[800],
    secondaryHover: colors.slate[700],
    secondaryActive: colors.slate[600],
    secondaryForeground: colors.slate[100],
    
    // Text
    textPrimary: colors.slate[50],
    textSecondary: colors.slate[300],
    textTertiary: colors.slate[400],
    textMuted: colors.slate[500],
    textInverse: colors.slate[900],
    
    // Borders
    border: colors.slate[700],
    borderHover: colors.slate[600],
    borderFocus: colors.maple[500],
    
    // States
    success: colors.success.DEFAULT,
    successLight: `${colors.success.DEFAULT}20`,
    warning: colors.warning.DEFAULT,
    warningLight: `${colors.warning.DEFAULT}20`,
    error: colors.error.DEFAULT,
    errorLight: `${colors.error.DEFAULT}20`,
    info: colors.info.DEFAULT,
    infoLight: `${colors.info.DEFAULT}20`,
    
    // Ring (focus)
    ring: colors.maple[500],
    
    // Sidebar
    sidebarBackground: colors.slate[900],
    sidebarBorder: colors.slate[700],
    sidebarItemHover: colors.slate[800],
    sidebarItemActive: `${colors.maple[600]}20`,
    sidebarItemActiveText: colors.maple[400],
    
    // Chart colors
    chart1: colors.maple[500],
    chart2: '#60A5FA', // Blue-400
    chart3: '#34D399', // Emerald-400
    chart4: '#FBBF24', // Amber-400
    chart5: '#A78BFA', // Purple-400
  },
} as const

export default mapleTheme
