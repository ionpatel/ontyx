'use client'

import { useState, useEffect, useRef, forwardRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  loading?: boolean
  debounceMs?: number
  showClear?: boolean
  className?: string
  inputClassName?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({
    value: controlledValue,
    onChange,
    onSearch,
    loading = false,
    debounceMs = 300,
    showClear = true,
    className,
    inputClassName,
    placeholder = 'Search...',
    ...props
  }, ref) {
    const [internalValue, setInternalValue] = useState(controlledValue || '')
    const debounceTimer = useRef<NodeJS.Timeout>()

    // Sync with controlled value
    useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(controlledValue)
      }
    }, [controlledValue])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInternalValue(newValue)
      onChange?.(newValue)

      // Debounced search
      if (onSearch) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = setTimeout(() => {
          onSearch(newValue)
        }, debounceMs)
      }
    }

    const handleClear = () => {
      setInternalValue('')
      onChange?.('')
      onSearch?.('')
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        clearTimeout(debounceTimer.current)
        onSearch(internalValue)
      }
      if (e.key === 'Escape') {
        handleClear()
      }
    }

    return (
      <div className={cn("relative", className)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={ref}
          type="text"
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "pl-9",
            (showClear && internalValue) && "pr-16",
            loading && "pr-16",
            inputClassName
          )}
          {...props}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {showClear && internalValue && !loading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </Button>
          )}
        </div>
      </div>
    )
  }
)

// Inline search with keyboard hint
export function SearchInputWithHint({
  shortcut = '⌘K',
  ...props
}: SearchInputProps & { shortcut?: string }) {
  return (
    <div className="relative">
      <SearchInput {...props} />
      {!props.value && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          {shortcut}
        </kbd>
      )}
    </div>
  )
}
