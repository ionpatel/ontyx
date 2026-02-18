'use client'

import Link from 'next/link'
import { 
  Receipt, MoreHorizontal, Edit, Trash2, Eye,
  Paperclip, CheckCircle, Clock, AlertCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, cn } from '@/lib/utils'

interface Expense {
  id: string
  description: string
  vendor?: string
  category?: { name: string } | null
  amount: number
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  date: string
  hasReceipt?: boolean
}

interface ExpenseCardProps {
  expense: Expense
  onEdit?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
  className?: string
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', icon: CheckCircle, className: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Paid', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', icon: AlertCircle, className: 'bg-red-100 text-red-700' },
}

const categoryColors: Record<string, string> = {
  'Office Supplies': 'bg-blue-100 text-blue-700',
  'Travel': 'bg-purple-100 text-purple-700',
  'Meals': 'bg-orange-100 text-orange-700',
  'Software': 'bg-cyan-100 text-cyan-700',
  'Marketing': 'bg-pink-100 text-pink-700',
  'Utilities': 'bg-amber-100 text-amber-700',
}

export function ExpenseCard({ expense, onEdit, onDelete, className }: ExpenseCardProps) {
  const status = statusConfig[expense.status] || statusConfig.pending
  const StatusIcon = status.icon
  const categoryColor = expense.category?.name 
    ? categoryColors[expense.category.name] || 'bg-gray-100 text-gray-700'
    : 'bg-gray-100 text-gray-700'

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left side - Expense info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5 text-red-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link 
                  href={`/expenses/${expense.id}`}
                  className="font-medium text-foreground hover:text-primary truncate"
                >
                  {expense.description}
                </Link>
                {expense.hasReceipt && (
                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {expense.vendor && <span>{expense.vendor}</span>}
                {expense.vendor && expense.category && <span>•</span>}
                {expense.category && (
                  <Badge variant="secondary" className={cn("text-xs", categoryColor)}>
                    {expense.category.name}
                  </Badge>
                )}
              </div>

              {/* Amount and date row */}
              <div className="flex items-center gap-3 mt-2">
                <span className="font-semibold text-lg text-red-600">
                  -{formatCurrency(expense.amount, 'CAD')}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(expense.date)}
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Status and actions */}
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", status.className)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/expenses/${expense.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(expense)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(expense)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
