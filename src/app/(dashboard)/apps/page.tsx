"use client"

import { useState } from "react"
import {
  CreditCard, Wallet, Smartphone, Calculator, Landmark, Mail,
  MessageSquare, ShoppingBag, Store, Truck, Package, Plane,
  Cloud, HardDrive, TrendingUp, Zap, Search, Filter, Check,
  ExternalLink, ChevronRight, Puzzle, Clock, Sparkles, Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  mockIntegrations,
  APP_CATEGORIES,
  getAppSummary,
  type Integration,
  type AppCategory,
} from "@/lib/mock-data/apps"

const ICON_MAP: Record<string, React.ElementType> = {
  CreditCard, Wallet, Smartphone, Calculator, Landmark, Mail,
  MessageSquare, ShoppingBag, Store, Truck, Package, Plane,
  Cloud, HardDrive, TrendingUp, Zap,
}

function AppIcon({ iconName, color, size = "md" }: { iconName: string; color: string; size?: "sm" | "md" | "lg" }) {
  const Icon = ICON_MAP[iconName] || Puzzle
  const sizes = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-8 w-8" }
  const containers = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-14 w-14" }

  return (
    <div
      className={`${containers[size]} rounded-xl flex items-center justify-center shrink-0`}
      style={{ backgroundColor: `${color}15` }}
    >
      <Icon className={sizes[size]} style={{ color }} />
    </div>
  )
}

function StatusBadge({ status }: { status: Integration["status"] }) {
  switch (status) {
    case "connected":
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200"><Check className="h-3 w-3 mr-1" /> Connected</Badge>
    case "available":
      return <Badge variant="outline" className="text-blue-600 border-blue-200">Available</Badge>
    case "coming_soon":
      return <Badge variant="outline" className="text-muted-foreground"><Clock className="h-3 w-3 mr-1" /> Coming Soon</Badge>
    default:
      return null
  }
}

function AppDetailDialog({ app }: { app: Integration }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="ml-auto">
          Details <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <AppIcon iconName={app.icon} color={app.color} size="lg" />
            <div>
              <DialogTitle className="text-xl">{app.name}</DialogTitle>
              <DialogDescription className="text-sm">{app.category.replace("_", " ")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{app.longDescription}</p>

          <div>
            <h4 className="text-sm font-semibold mb-2">Features</h4>
            <ul className="grid grid-cols-1 gap-1.5">
              {app.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pricing</span>
            <span className="font-medium">{app.pricing}</span>
          </div>

          {app.setupSteps && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Setup Steps</h4>
              <ol className="space-y-1.5">
                {app.setupSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {app.status === "connected" ? (
              <Button variant="outline" className="flex-1">
                <Settings className="h-4 w-4 mr-2" /> Configure
              </Button>
            ) : app.status === "available" ? (
              <Button className="flex-1">
                <Zap className="h-4 w-4 mr-2" /> Connect
              </Button>
            ) : (
              <Button disabled className="flex-1">
                <Clock className="h-4 w-4 mr-2" /> Coming Soon
              </Button>
            )}
            {app.website !== "#" && (
              <Button variant="outline" size="icon" asChild>
                <a href={app.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AppsPage() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const summary = getAppSummary()

  const filteredApps = mockIntegrations.filter(app => {
    const matchesSearch = search === "" ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "all" || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const stats = [
    { title: "Total Apps", value: summary.total, icon: Puzzle, desc: "Integration marketplace" },
    { title: "Connected", value: summary.connected, icon: Check, desc: "Active integrations" },
    { title: "Available", value: summary.available, icon: Sparkles, desc: "Ready to connect" },
    { title: "Coming Soon", value: summary.comingSoon, icon: Clock, desc: "In development" },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Store</h1>
          <p className="text-muted-foreground">
            Connect your favorite tools and services with Ontyx
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm">
            All ({mockIntegrations.length})
          </TabsTrigger>
          {APP_CATEGORIES.map(cat => {
            const count = mockIntegrations.filter(a => a.category === cat.value).length
            return (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 text-sm"
              >
                {cat.label} ({count})
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-4">
          {filteredApps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Puzzle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No integrations found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredApps.map(app => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <AppIcon iconName={app.icon} color={app.color} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{app.name}</h3>
                          <StatusBadge status={app.status} />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {app.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {APP_CATEGORIES.find(c => c.value === app.category)?.label}
                          </Badge>
                          <AppDetailDialog app={app} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
