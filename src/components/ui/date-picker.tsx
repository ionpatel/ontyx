'use client'

import { useState, forwardRef } from 'react'
import { format, parse, isValid, addDays, addMonths, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  dateFormat?: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function CalendarGrid({
  month,
  selectedDate,
  onSelect,
  minDate,
  maxDate,
}: {
  month: Date
  selectedDate: Date | undefined
  onSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
}) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const startDay = start.getDay()
  
  const days: (Date | null)[] = []
  
  // Fill in empty days before month start
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  
  // Fill in month days
  let current = start
  while (current <= end) {
    days.push(current)
    current = addDays(current, 1)
  }

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date): boolean => {
    return selectedDate?.toDateString() === date.toDateString()
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {DAYS.map((day) => (
        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
          {day}
        </div>
      ))}
      {days.map((day, index) => (
        <div key={index} className="aspect-square">
          {day && (
            <button
              type="button"
              onClick={() => !isDateDisabled(day) && onSelect(day)}
              disabled={isDateDisabled(day)}
              className={cn(
                "w-full h-full rounded-md text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isSelected(day) && "bg-primary text-primary-foreground hover:bg-primary",
                isToday(day) && !isSelected(day) && "border border-primary",
                isDateDisabled(day) && "text-muted-foreground/50 cursor-not-allowed hover:bg-transparent",
              )}
            >
              {day.getDate()}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  function DatePicker({
    value,
    onChange,
    placeholder = 'Select date',
    className,
    disabled,
    minDate,
    maxDate,
    dateFormat = 'MMM d, yyyy',
  }, ref) {
    const [open, setOpen] = useState(false)
    const [month, setMonth] = useState(
      value 
        ? (typeof value === 'string' ? new Date(value) : value)
        : new Date()
    )

    const selectedDate = value
      ? (typeof value === 'string' ? new Date(value) : value)
      : undefined

    const handleSelect = (date: Date) => {
      onChange?.(date)
      setOpen(false)
    }

    const handlePrevMonth = () => {
      setMonth(subMonths(month, 1))
    }

    const handleNextMonth = () => {
      setMonth(addMonths(month, 1))
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, dateFormat) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {MONTHS[month.getMonth()]} {month.getFullYear()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar grid */}
            <CalendarGrid
              month={month}
              selectedDate={selectedDate}
              onSelect={handleSelect}
              minDate={minDate}
              maxDate={maxDate}
            />

            {/* Quick actions */}
            <div className="flex gap-1 mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleSelect(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleSelect(addDays(new Date(), 7))}
              >
                +7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleSelect(addDays(new Date(), 30))}
              >
                +30 days
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)

// Date range picker
interface DateRangePickerProps {
  startDate?: Date
  endDate?: Date
  onChangeStart?: (date: Date | undefined) => void
  onChangeEnd?: (date: Date | undefined) => void
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DatePicker
        value={startDate}
        onChange={onChangeStart}
        placeholder="Start date"
        maxDate={endDate}
      />
      <span className="text-muted-foreground">to</span>
      <DatePicker
        value={endDate}
        onChange={onChangeEnd}
        placeholder="End date"
        minDate={startDate}
      />
    </div>
  )
}
