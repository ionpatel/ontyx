"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Command,
} from "lucide-react"

interface HeaderProps {
  sidebarCollapsed?: boolean
}

export function Header({ sidebarCollapsed = false }: HeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)

  const notifications = [
    { id: 1, title: "Invoice #INV-001 paid", time: "5 min ago", read: false },
    { id: 2, title: "New lead assigned", time: "1 hour ago", read: false },
    { id: 3, title: "Low stock alert", time: "2 hours ago", read: true },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-lg px-6 transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search anything..."
            className="w-64 pl-9 pr-12 bg-muted/50 border-transparent focus:border-primary focus:bg-background"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Create
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </Button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-xl z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-semibold">Notifications</h3>
                  <Button variant="ghost" size="sm">Mark all read</Button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
                        !notification.read && "bg-primary/5"
                      )}
                    >
                      <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", notification.read ? "bg-muted" : "bg-primary")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatar.jpg" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">HP</AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">Harshil Patel</p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-card shadow-xl z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium">Harshil Patel</p>
                  <p className="text-xs text-muted-foreground">harshil@ontyx.app</p>
                </div>
                <div className="py-1">
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted"><User className="h-4 w-4" />Profile</button>
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted"><Settings className="h-4 w-4" />Settings</button>
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted"><HelpCircle className="h-4 w-4" />Help</button>
                </div>
                <div className="border-t border-border py-1">
                  <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"><LogOut className="h-4 w-4" />Log out</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
