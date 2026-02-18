'use client'

import Link from 'next/link'
import { Package, MoreHorizontal, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react'
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

interface Product {
  id: string
  name: string
  sku?: string
  type: 'product' | 'service'
  price: number
  quantity?: number | null
  reorderPoint?: number | null
  status: 'active' | 'inactive' | 'discontinued'
  category?: { name: string } | null
}

interface ProductCardProps {
  product: Product
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
  className?: string
}

export function ProductCard({ product, onEdit, onDelete, className }: ProductCardProps) {
  const isLowStock = product.type === 'product' && 
    product.quantity !== null && 
    product.reorderPoint !== null &&
    product.quantity <= product.reorderPoint

  const statusConfig = {
    active: { label: 'Active', className: 'bg-green-100 text-green-700' },
    inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-700' },
    discontinued: { label: 'Discontinued', className: 'bg-red-100 text-red-700' },
  }

  const status = statusConfig[product.status]

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left side - Product info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              product.type === 'service' ? "bg-purple-100" : "bg-blue-100"
            )}>
              <Package className={cn(
                "h-5 w-5",
                product.type === 'service' ? "text-purple-600" : "text-blue-600"
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <Link 
                href={`/inventory/${product.id}`}
                className="font-medium text-foreground hover:text-primary truncate block"
              >
                {product.name}
              </Link>
              
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {product.sku && <span>{product.sku}</span>}
                {product.category && (
                  <>
                    <span>•</span>
                    <span>{product.category.name}</span>
                  </>
                )}
              </div>

              {/* Price and quantity row */}
              <div className="flex items-center gap-3 mt-2">
                <span className="font-semibold text-lg">
                  {formatCurrency(product.price, 'CAD')}
                </span>
                
                {product.type === 'product' && product.quantity !== null && (
                  <Badge 
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      isLowStock && "bg-amber-100 text-amber-700"
                    )}
                  >
                    {isLowStock && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {product.quantity} in stock
                  </Badge>
                )}
                
                {product.type === 'service' && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                    Service
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Status and actions */}
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", status.className)}>
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
                  <Link href={`/inventory/${product.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(product)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(product)}
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
