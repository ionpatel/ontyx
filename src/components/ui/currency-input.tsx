'use client'

import { useState, useEffect, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number | string
  onChange?: (value: number) => void
  currency?: string
  locale?: string
  allowNegative?: boolean
  decimalPlaces?: number
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput({
    value,
    onChange,
    currency = 'CAD',
    locale = 'en-CA',
    allowNegative = false,
    decimalPlaces = 2,
    className,
    placeholder,
    ...props
  }, ref) {
    const [displayValue, setDisplayValue] = useState('')
    const [focused, setFocused] = useState(false)

    // Currency symbols
    const currencySymbol = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).formatToParts(0).find(part => part.type === 'currency')?.value || '$'

    // Format number for display
    const formatForDisplay = (num: number): string => {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(num)
    }

    // Parse display string to number
    const parseToNumber = (str: string): number => {
      // Remove currency symbol and spaces
      const cleaned = str
        .replace(currencySymbol, '')
        .replace(/\s/g, '')
        .replace(/,/g, '')
        .trim()
      
      const num = parseFloat(cleaned)
      return isNaN(num) ? 0 : num
    }

    // Initialize display value
    useEffect(() => {
      if (!focused) {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
        setDisplayValue(formatForDisplay(numValue))
      }
    }, [value, focused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value

      // Allow only numbers, decimal point, and optionally minus
      const regex = allowNegative 
        ? /^-?\d*\.?\d*$/
        : /^\d*\.?\d*$/

      // Remove any non-numeric characters except decimal and minus
      inputValue = inputValue.replace(/[^\d.-]/g, '')

      if (regex.test(inputValue) || inputValue === '' || inputValue === '-') {
        setDisplayValue(inputValue)
        
        // Parse and emit the numeric value
        const numericValue = parseFloat(inputValue) || 0
        onChange?.(numericValue)
      }
    }

    const handleFocus = () => {
      setFocused(true)
      // Show raw number when focused for easier editing
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
      setDisplayValue(numValue.toString())
    }

    const handleBlur = () => {
      setFocused(false)
      // Format on blur
      const numValue = parseFloat(displayValue) || 0
      setDisplayValue(formatForDisplay(numValue))
      onChange?.(numValue)
    }

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {currencySymbol}
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || '0.00'}
          className={cn("pl-7", className)}
          {...props}
        />
      </div>
    )
  }
)

// Display-only currency (no input)
export function Currency({
  value,
  currency = 'CAD',
  locale = 'en-CA',
  className,
  colorCode = false,
}: {
  value: number
  currency?: string
  locale?: string
  className?: string
  colorCode?: boolean
}) {
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value)

  return (
    <span className={cn(
      className,
      colorCode && value > 0 && 'text-green-600',
      colorCode && value < 0 && 'text-red-600',
    )}>
      {formatted}
    </span>
  )
}

// Percentage input
export const PercentageInput = forwardRef<HTMLInputElement, Omit<CurrencyInputProps, 'currency' | 'locale'>>(
  function PercentageInput({
    value,
    onChange,
    decimalPlaces = 2,
    className,
    placeholder,
    ...props
  }, ref) {
    const [displayValue, setDisplayValue] = useState('')

    useEffect(() => {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
      setDisplayValue(numValue.toString())
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value.replace(/[^\d.]/g, '')
      
      // Limit to 0-100
      const num = parseFloat(inputValue)
      if (!isNaN(num) && num > 100) {
        inputValue = '100'
      }

      setDisplayValue(inputValue)
      onChange?.(parseFloat(inputValue) || 0)
    }

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder || '0'}
          className={cn("pr-7", className)}
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          %
        </span>
      </div>
    )
  }
)
