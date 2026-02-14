"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, Download, Maximize2, MoreHorizontal } from "lucide-react";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  height?: number | string;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onExpand?: () => void;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ChartContainer({
  title,
  description,
  children,
  className,
  height = 300,
  loading = false,
  onRefresh,
  onExport,
  onExpand,
  actions,
  footer,
}: ChartContainerProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className={cn(
                "p-2 rounded-md hover:bg-muted transition-colors",
                loading && "animate-spin"
              )}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          style={{ height: typeof height === "number" ? `${height}px` : height }}
          className={cn(
            "relative px-2 pb-4",
            loading && "opacity-50 pointer-events-none"
          )}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
          {children}
        </div>
        {footer && (
          <div className="border-t px-6 py-3 bg-muted/30">{footer}</div>
        )}
      </CardContent>
    </Card>
  );
}

// Chart legend component
interface ChartLegendProps {
  items: Array<{
    name: string;
    color: string;
    value?: string | number;
  }>;
  className?: string;
}

export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-muted-foreground">{item.name}</span>
          {item.value !== undefined && (
            <span className="text-sm font-medium">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Chart tooltip styling
export const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  labelStyle: {
    color: "hsl(var(--foreground))",
    fontWeight: 600,
    marginBottom: "4px",
  },
  itemStyle: {
    color: "hsl(var(--muted-foreground))",
    fontSize: "12px",
  },
};

// Chart color palette
export const chartColors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  chart1: "hsl(var(--chart-1))",
  chart2: "hsl(var(--chart-2))",
  chart3: "hsl(var(--chart-3))",
  chart4: "hsl(var(--chart-4))",
  chart5: "hsl(var(--chart-5))",
};

export const chartColorArray = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];
