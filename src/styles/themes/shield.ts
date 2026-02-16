/**
 * CANADIAN SHIELD THEME
 * =====================
 * Forest green palette reflecting Canadian nature.
 * Sustainable, grounded, growth-focused.
 * 
 * Best for: Eco-friendly, agriculture, wellness, local cafés
 */

import { colors } from '../tokens'

// Shield green palette
const shield = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#10B981',
  600: '#059669',
  700: '#047857',
  800: '#065F46',
  900: '#064E3B',
  950: '#022C22',
}

export const shieldTheme = {
  name: 'shield',
  label: 'Canadian Shield',
  
  light: {
    // Backgrounds
    background: colors.white,
    backgroundSecondary: shield[50],
    backgroundTertiary: colors.slate[100],
    
    // Surfaces
    surface: colors.white,
    surfaceHover: shield[50],
    surfaceActive: shield[100],
    
    // Primary (Shield Green)
    primary: shield[600],
    primaryHover: shield[700],
    primaryActive: shield[800],
    primaryLight: shield[50],
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
    borderFocus: shield[600],
    
    // States
    success: shield[600],
    successLight: shield[50],
    warning: colors.warning.DEFAULT,
    warningLight: colors.warning.light,
    error: colors.error.DEFAULT,
    errorLight: colors.error.light,
    info: colors.info.DEFAULT,
    infoLight: colors.info.light,
    
    // Ring
    ring: shield[600],
    
    // Sidebar
    sidebarBackground: colors.white,
    sidebarBorder: colors.slate[200],
    sidebarItemHover: shield[50],
    sidebarItemActive: shield[100],
    sidebarItemActiveText: shield[700],
    
    // Chart colors
    chart1: shield[600],
    chart2: colors.info.DEFAULT,
    chart3: colors.maple[500],
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
    
    // Primary (Shield Green)
    primary: shield[500],
    primaryHover: shield[400],
    primaryActive: shield[600],
    primaryLight: `${shield[900]}50`,
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
    borderFocus: shield[500],
    
    // States
    success: shield[500],
    successLight: `${shield[500]}20`,
    warning: colors.warning.DEFAULT,
    warningLight: `${colors.warning.DEFAULT}20`,
    error: colors.error.DEFAULT,
    errorLight: `${colors.error.DEFAULT}20`,
    info: colors.info.DEFAULT,
    infoLight: `${colors.info.DEFAULT}20`,
    
    // Ring
    ring: shield[500],
    
    // Sidebar
    sidebarBackground: colors.slate[900],
    sidebarBorder: colors.slate[700],
    sidebarItemHover: colors.slate[800],
    sidebarItemActive: `${shield[500]}20`,
    sidebarItemActiveText: shield[400],
    
    // Chart colors
    chart1: shield[500],
    chart2: '#60A5FA',
    chart3: colors.maple[400],
    chart4: '#FBBF24',
    chart5: '#A78BFA',
  },
} as const

export default shieldTheme
