'use client'

import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle, TrendingUp, Receipt, FileWarning, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'

interface Anomaly {
  type: string
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  expenseId?: string
  suggestion: string
}

export function AIInsightsCard() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, high: 0, medium: 0, low: 0 })

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      const res = await fetch('/api/ai/anomalies')
      if (res.ok) {
        const data = await res.json()
        setAnomalies(data.anomalies || [])
        setSummary(data.summary || { total: 0, high: 0, medium: 0, low: 0 })
      }
    } catch (err) {
      console.error('Failed to load AI insights:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'duplicate': return <FileWarning className="h-4 w-4" />
      case 'unusual_amount': return <TrendingUp className="h-4 w-4" />
      case 'missing_receipt': return <Receipt className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Bookkeeper
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Bookkeeper
          </CardTitle>
          {summary.total > 0 && (
            <div className="flex gap-1">
              {summary.high > 0 && (
                <Badge variant="destructive" className="text-xs">{summary.high} urgent</Badge>
              )}
              {summary.medium > 0 && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">{summary.medium}</Badge>
              )}
            </div>
          )}
        </div>
        <CardDescription>
          Automated insights and anomaly detection
        </CardDescription>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="text-center py-6">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium">Looking good!</p>
            <p className="text-sm text-muted-foreground">No anomalies detected in your recent expenses</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {anomalies.slice(0, 5).map((anomaly, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
                >
                  <div className="flex items-start gap-2">
                    {getTypeIcon(anomaly.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{anomaly.title}</p>
                      <p className="text-xs mt-0.5 opacity-80">{anomaly.description}</p>
                      <p className="text-xs mt-1 italic">{anomaly.suggestion}</p>
                    </div>
                  </div>
                  {anomaly.expenseId && (
                    <Link href={`/expenses?id=${anomaly.expenseId}`}>
                      <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                        View Expense →
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {anomalies.length > 5 && (
          <Link href="/reports?tab=anomalies">
            <Button variant="outline" size="sm" className="w-full mt-3">
              View All {anomalies.length} Insights
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
