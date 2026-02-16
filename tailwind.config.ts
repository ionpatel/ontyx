import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CSS Variable-based colors (theme-aware)
        background: "var(--background)",
        "background-secondary": "var(--background-secondary)",
        "background-tertiary": "var(--background-tertiary)",
        
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        "surface-active": "var(--surface-active)",
        
        foreground: "var(--text-primary)",
        
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          active: "var(--primary-active)",
          light: "var(--primary-light)",
          foreground: "var(--primary-foreground)",
        },
        
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary-hover)",
          active: "var(--secondary-active)",
          foreground: "var(--secondary-foreground)",
        },
        
        muted: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--text-muted)",
        },
        
        accent: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        
        destructive: {
          DEFAULT: "var(--error)",
          foreground: "var(--primary-foreground)",
          light: "var(--error-light)",
        },
        
        success: {
          DEFAULT: "var(--success)",
          light: "var(--success-light)",
        },
        
        warning: {
          DEFAULT: "var(--warning)",
          light: "var(--warning-light)",
        },
        
        info: {
          DEFAULT: "var(--info)",
          light: "var(--info-light)",
        },
        
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        input: "var(--border)",
        ring: "var(--ring)",
        
        // Text colors
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "text-muted": "var(--text-muted)",
        
        // Sidebar
        sidebar: {
          background: "var(--sidebar-background)",
          border: "var(--sidebar-border)",
          "item-hover": "var(--sidebar-item-hover)",
          "item-active": "var(--sidebar-item-active)",
          "item-active-text": "var(--sidebar-item-active-text)",
        },
        
        // Chart colors
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        
        // Keep shadcn compatibility
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text-primary)",
        },
      },
      
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "Playfair Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      
      spacing: {
        "sidebar": "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-collapsed-width)",
        "header": "var(--header-height)",
      },
      
      boxShadow: {
        "sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "DEFAULT": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "md": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "lg": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "xl": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        "inner": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        "maple": "0 4px 14px 0 rgba(220, 38, 38, 0.15)",
        "maple-lg": "0 10px 25px 0 rgba(220, 38, 38, 0.2)",
      },
      
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-to-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "shimmer": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in": "slide-in-from-right 0.3s ease-out",
        "slide-out": "slide-out-to-right 0.3s ease-out",
        "slide-up": "slide-in-from-bottom 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "shimmer": "shimmer 1.5s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
