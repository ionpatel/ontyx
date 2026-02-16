/**
 * ONTYX Animation Presets
 * =======================
 * Framer Motion animation configurations.
 * Consistent, performant, accessible.
 */

import { Variants, Transition } from 'framer-motion'

// ============================================
// TRANSITION PRESETS
// ============================================

export const transitions = {
  // Standard ease for most animations
  default: {
    type: 'tween',
    ease: [0.4, 0, 0.2, 1],
    duration: 0.2,
  } as Transition,
  
  // Snappy for interactions
  snappy: {
    type: 'tween',
    ease: [0.4, 0, 0.2, 1],
    duration: 0.15,
  } as Transition,
  
  // Smooth for larger movements
  smooth: {
    type: 'tween',
    ease: [0.4, 0, 0.2, 1],
    duration: 0.3,
  } as Transition,
  
  // Spring for playful elements
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  } as Transition,
  
  // Bouncy spring
  bouncy: {
    type: 'spring',
    stiffness: 500,
    damping: 25,
  } as Transition,
  
  // Slow for emphasis
  slow: {
    type: 'tween',
    ease: [0.4, 0, 0.2, 1],
    duration: 0.5,
  } as Transition,
} as const

// ============================================
// FADE ANIMATIONS
// ============================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
}

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
}

// ============================================
// SCALE ANIMATIONS
// ============================================

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

export const scaleInCenter: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
}

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: transitions.bouncy,
  },
  exit: { opacity: 0, scale: 0.8 },
}

// ============================================
// SLIDE ANIMATIONS
// ============================================

export const slideInFromRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
}

export const slideInFromLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
}

export const slideInFromTop: Variants = {
  initial: { y: '-100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '-100%', opacity: 0 },
}

export const slideInFromBottom: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
}

// ============================================
// LIST/STAGGER ANIMATIONS
// ============================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
}

export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
}

// ============================================
// COMPONENT-SPECIFIC ANIMATIONS
// ============================================

// Modal/Dialog
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: transitions.smooth,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: transitions.snappy,
  },
}

// Dropdown/Popover
export const dropdownMenu: Variants = {
  initial: { opacity: 0, y: -5, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: transitions.snappy,
  },
  exit: { 
    opacity: 0, 
    y: -5, 
    scale: 0.95,
    transition: { duration: 0.1 },
  },
}

// Sidebar
export const sidebarItem: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
}

// Toast/Notification
export const toastSlideIn: Variants = {
  initial: { opacity: 0, x: 50, scale: 0.95 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    x: 50, 
    scale: 0.95,
    transition: transitions.snappy,
  },
}

// Card hover
export const cardHover: Variants = {
  initial: { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  hover: { 
    y: -4, 
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    transition: transitions.smooth,
  },
}

// Button press
export const buttonPress: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.98 },
}

// Table row
export const tableRow: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, height: 0 },
}

// Skeleton shimmer
export const shimmer: Variants = {
  initial: { x: '-100%' },
  animate: { 
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
}

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: { 
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

// ============================================
// UTILITY ANIMATIONS
// ============================================

// Spinner rotation
export const spin: Variants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: 'linear',
    },
  },
}

// Pulse
export const pulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'easeInOut',
    },
  },
}

// Shake (for errors)
export const shake: Variants = {
  animate: {
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
    },
  },
}

// ============================================
// EXPORT PRESET BUNDLES
// ============================================

export const animations = {
  // Transitions
  transitions,
  
  // Fade
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  
  // Scale
  scaleIn,
  scaleInCenter,
  popIn,
  
  // Slide
  slideInFromRight,
  slideInFromLeft,
  slideInFromTop,
  slideInFromBottom,
  
  // Stagger
  staggerContainer,
  staggerContainerSlow,
  staggerItem,
  staggerItemScale,
  
  // Components
  modalOverlay,
  modalContent,
  dropdownMenu,
  sidebarItem,
  toastSlideIn,
  cardHover,
  buttonPress,
  tableRow,
  shimmer,
  
  // Pages
  pageTransition,
  
  // Utility
  spin,
  pulse,
  shake,
} as const

export default animations
