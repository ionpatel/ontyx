'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell, Check, CheckCheck, Trash2, Settings,
  FileText, Users, Package, AlertCircle, DollarSign,
  Clock, ShoppingCart, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'invoice' | 'payment' | 'order' | 'contact' | 'inventory' | 'appointment' | 'alert'
  title: string
  message: string
  href?: string
  read: boolean
  createdAt: Date
}

const typeConfig = {
  invoice: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100' },
  payment: { icon: DollarSign, color: 'text-green-500', bg: 'bg-green-100' },
  order: { icon: ShoppingCart, color: 'text-orange-500', bg: 'bg-orange-100' },
  contact: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-100' },
  inventory: { icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  appointment: { icon: Calendar, color: 'text-cyan-500', bg: 'bg-cyan-100' },
  alert: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' },
}

// Mock notifications - in real app, fetch from API
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Payment Received',
    message: 'INV-2024-0042 was paid in full ($1,250.00)',
    href: '/invoices/abc123',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
  },
  {
    id: '2',
    type: 'invoice',
    title: 'Invoice Overdue',
    message: 'INV-2024-0039 is 3 days overdue',
    href: '/invoices/def456',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: '3',
    type: 'inventory',
    title: 'Low Stock Alert',
    message: '3 products are below reorder level',
    href: '/inventory?filter=low-stock',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '4',
    type: 'appointment',
    title: 'Upcoming Appointment',
    message: 'Meeting with John Smith in 30 minutes',
    href: '/appointments/ghi789',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  },
]

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type]
                const Icon = config.icon

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {notification.href ? (
                      <Link href={notification.href} className="flex gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                          config.bg
                        )}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              "text-sm",
                              !notification.read && "font-semibold"
                            )}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                          config.bg
                        )}>
                          <Icon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 flex justify-between">
              <Button variant="ghost" size="sm" className="text-xs" onClick={clearAll}>
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href="/settings/notifications">
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
