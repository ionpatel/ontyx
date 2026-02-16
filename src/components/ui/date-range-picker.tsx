"use client"

import * as React from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type DateRangePreset = 
  | "today" 
  | "this-week" 
  | "this-month" 
  | "this-quarter" 
  | "this-year" 
  | "last-week"
  | "last-month" 
  | "last-quarter" 
  | "last-year" 
  | "custom"

interface DateRangePickerProps {
  value: DateRangePreset
  onChange: (value: DateRangePreset) => void
  className?: string
  showIcon?: boolean
  size?: "sm" | "default"
}

const presetLabels: Record<DateRangePreset, string> = {
  "today": "Today",
  "this-week": "This Week",
  "this-month": "This Month",
  "this-quarter": "This Quarter",
  "this-year": "This Year",
  "last-week": "Last Week",
  "last-month": "Last Month",
  "last-quarter": "Last Quarter",
  "last-year": "Last Year",
  "custom": "Custom Range",
}

export function getDateRange(preset: DateRangePreset): { start: Date; end: Date; label: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (preset) {
    case "today":
      return { start: today, end: today, label: "Today" }
    case "this-week": {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return { start: weekStart, end: today, label: "This Week" }
    }
    case "this-month":
      return { 
        start: new Date(today.getFullYear(), today.getMonth(), 1), 
        end: today, 
        label: "This Month" 
      }
    case "this-quarter": {
      const q = Math.floor(today.getMonth() / 3)
      return { 
        start: new Date(today.getFullYear(), q * 3, 1), 
        end: today, 
        label: `Q${q + 1} ${today.getFullYear()}` 
      }
    }
    case "this-year":
      return { 
        start: new Date(today.getFullYear(), 0, 1), 
        end: today, 
        label: `${today.getFullYear()}` 
      }
    case "last-week": {
      const lwEnd = new Date(today)
      lwEnd.setDate(today.getDate() - today.getDay() - 1)
      const lwStart = new Date(lwEnd)
      lwStart.setDate(lwEnd.getDate() - 6)
      return { start: lwStart, end: lwEnd, label: "Last Week" }
    }
    case "last-month":
      return { 
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1), 
        end: new Date(today.getFullYear(), today.getMonth(), 0), 
        label: "Last Month" 
      }
    case "last-quarter": {
      const cq = Math.floor(today.getMonth() / 3)
      const lq = cq === 0 ? 3 : cq - 1
      const lqYear = cq === 0 ? today.getFullYear() - 1 : today.getFullYear()
      return { 
        start: new Date(lqYear, lq * 3, 1), 
        end: new Date(lqYear, lq * 3 + 3, 0), 
        label: `Q${lq + 1} ${lqYear}` 
      }
    }
    case "last-year":
      return { 
        start: new Date(today.getFullYear() - 1, 0, 1), 
        end: new Date(today.getFullYear() - 1, 11, 31), 
        label: `${today.getFullYear() - 1}` 
      }
    case "custom":
    default:
      return { start: new Date(today.getFullYear(), 0, 1), end: today, label: "Custom" }
  }
}

export function DateRangePicker({ 
  value, 
  onChange, 
  className,
  showIcon = true,
  size = "default",
}: DateRangePickerProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DateRangePreset)}>
      <SelectTrigger className={cn(
        size === "sm" ? "h-8 text-xs" : "",
        className
      )} style={{ width: size === "sm" ? 160 : 200 }}>
        {showIcon && <Calendar className={cn("mr-2", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="this-week">This Week</SelectItem>
        <SelectItem value="this-month">This Month</SelectItem>
        <SelectItem value="this-quarter">This Quarter</SelectItem>
        <SelectItem value="this-year">This Year</SelectItem>
        <SelectItem value="last-week">Last Week</SelectItem>
        <SelectItem value="last-month">Last Month</SelectItem>
        <SelectItem value="last-quarter">Last Quarter</SelectItem>
        <SelectItem value="last-year">Last Year</SelectItem>
        <SelectItem value="custom">Custom Range</SelectItem>
      </SelectContent>
    </Select>
  )
}
