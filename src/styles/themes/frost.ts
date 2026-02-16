/**
 * NORTHERN FROST THEME
 * ====================
 * Cool blue tones inspired by Canadian winters.
 * Modern, tech-forward, trustworthy.
 * 
 * Best for: Tech startups, modern retail, e-commerce
 */

import { colors } from '../tokens'

// Frost blue palette
const frost = {
  50: '#F0F9FF',
  100: '#E0F2FE',
  200: '#BAE6FD',
  300: '#7DD3FC',
  400: '#38BDF8',
  500: '#0EA5E9',
  600: '#0284C7',
  700: '#0369A1',
  800: '#075985',
  900: '#0C4A6E',
  950: '#082F49',
}

export const frostTheme = {
  name: 'frost',
  label: 'Northern Frost',
  
  light: {
    // Backgrounds
    background: colors.white,
    backgroundSecondary: frost[50],
    backgroundTertiary: colors.slate[100],
    
    // Surfaces
    surface: colors.white,
    surfaceHover: frost[50],
    surfaceActive: frost[100],
    
    // Primary (Frost Blue)
    primary: frost[500],
    primaryHover: frost[600],
    primaryActive: frost[700],
    primaryLight: frost[50],
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
    borderFocus: frost[500],
    
    // States
    success: colors.success.DEFAULT,
    successLight: colors.success.light,
    warning: colors.warning.DEFAULT,
    warningLight: colors.warning.light,
    error: colors.error.DEFAULT,
    errorLight: colors.error.light,
    info: frost[500],
    infoLight: frost[50],
    
    // Ring
    ring: frost[500],
    
    // Sidebar
    sidebarBackground: colors.white,
    sidebarBorder: colors.slate[200],
    sidebarItemHover: frost[50],
    sidebarItemActive: frost[100],
    sidebarItemActiveText: frost[700],
    
    // Chart colors
    chart1: frost[500],
    chart2: colors.maple[500],
    chart3: colors.success.DEFAULT,
    chart4: colors.warning.DEFAULT,
    chart5: '#8B5CF6',
  },
  
  dark: {
    // Backgrounds
    background: colors.slate[950],
    backgroundSecondary: colors.slate[900],
    backgroundTertiary: colors.slate[800],
    
    // Surfaces
    surface: colors.slate[900],
    surfaceHover: colors.slate[800],
    surfaceActive: colors.slate[700],
    
    // Primary (Frost Blue)
    primary: frost[400],
    primaryHover: frost[300],
    primaryActive: frost[500],
    primaryLight: `${frost[900]}50`,
    primaryForeground: colors.slate[900],
    
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
    borderFocus: frost[400],
    
    // States
    success: colors.success.DEFAULT,
    successLight: `${colors.success.DEFAULT}20`,
    warning: colors.warning.DEFAULT,
    warningLight: `${colors.warning.DEFAULT}20`,
    error: colors.error.DEFAULT,
    errorLight: `${colors.error.DEFAULT}20`,
    info: frost[400],
    infoLight: `${frost[500]}20`,
    
    // Ring
    ring: frost[400],
    
    // Sidebar
    sidebarBackground: colors.slate[900],
    sidebarBorder: colors.slate[700],
    sidebarItemHover: colors.slate[800],
    sidebarItemActive: `${frost[500]}20`,
    sidebarItemActiveText: frost[400],
    
    // Chart colors
    chart1: frost[400],
    chart2: colors.maple[400],
    chart3: '#34D399',
    chart4: '#FBBF24',
    chart5: '#A78BFA',
  },
} as const

export default frostTheme
