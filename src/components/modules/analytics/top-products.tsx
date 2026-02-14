"use client";

import * as React from "react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { topProducts, ProductData } from "@/lib/mock-data";
import { ArrowRight, Package, TrendingUp, BarChart3 } from "lucide-react";
import { DonutChart } from "@/components/charts/donut-chart";

interface TopProductsProps {
  className?: string;
  limit?: number;
  variant?: "list" | "chart";
}

const categoryColors: Record<string, string> = {
  Software: "bg-blue-500",
  Services: "bg-green-500",
  Support: "bg-purple-500",
  Training: "bg-orange-500",
};

export function TopProducts({
  className,
  limit = 5,
  variant = "list",
}: TopProductsProps) {
  const products = topProducts.slice(0, limit);
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);

  if (variant === "chart") {
    const chartData = products.map((p) => ({
      name: p.name,
      value: p.revenue,
    }));

    return (
      <Card className={cn("", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">
            Revenue by Product
          </CardTitle>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <DonutChart
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              centerValue={formatCurrency(totalRevenue)}
              centerLabel="Total"
              formatValue={(v) => formatCurrency(v)}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">Top Products</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            By revenue this month
          </p>
        </div>
        <button className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {products.map((product, index) => {
            const percentage = ((product.revenue / totalRevenue) * 100).toFixed(1);

            return (
              <div
                key={product.id}
                className={cn(
                  "flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer group",
                  index !== products.length - 1 && "border-b border-border/50"
                )}
              >
                {/* Icon */}
                <div className="rounded-lg bg-muted p-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {product.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-medium",
                        categoryColors[product.category]
                          ? `${categoryColors[product.category]}/10 text-${categoryColors[product.category].split("-")[1]}-600`
                          : "bg-muted text-muted-foreground"
                      )}
                      style={{
                        backgroundColor: `var(--${product.category.toLowerCase()}-bg, hsl(var(--muted)))`,
                      }}
                    >
                      {product.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      SKU: {product.sku}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(product.revenue)}
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(product.unitsSold)} sold
                    </span>
                    <span className="text-xs text-success flex items-center gap-0.5">
                      <BarChart3 className="h-3 w-3" />
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total bar */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Revenue</span>
          <span className="text-sm font-bold">{formatCurrency(totalRevenue)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
