"use client";

import * as React from "react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { topCustomers, CustomerData } from "@/lib/mock-data";
import { ArrowRight, Mail, FileText, TrendingUp } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { HorizontalBarChart } from "@/components/charts/bar-chart";

interface TopCustomersProps {
  className?: string;
  limit?: number;
  variant?: "list" | "chart";
}

const avatarColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
];

export function TopCustomers({
  className,
  limit = 5,
  variant = "list",
}: TopCustomersProps) {
  const customers = topCustomers.slice(0, limit);
  const maxRevenue = Math.max(...customers.map((c) => c.totalRevenue));

  if (variant === "chart") {
    const chartData = customers.map((c) => ({
      name: c.name,
      revenue: c.totalRevenue,
    }));

    return (
      <Card className={cn("", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Top Customers</CardTitle>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <HorizontalBarChart
              data={chartData}
              xKey="name"
              yKeys={[
                {
                  key: "revenue",
                  name: "Revenue",
                  color: "hsl(var(--primary))",
                },
              ]}
              formatYAxis={(v) => `$${(v / 1000).toFixed(0)}k`}
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
          <CardTitle className="text-base font-medium">Top Customers</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            By total revenue
          </p>
        </div>
        <button className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {customers.map((customer, index) => {
            const percentage = (customer.totalRevenue / maxRevenue) * 100;

            return (
              <div
                key={customer.id}
                className={cn(
                  "flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer group",
                  index !== customers.length - 1 && "border-b border-border/50"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-medium",
                    avatarColors[index % avatarColors.length]
                  )}
                >
                  {getInitials(customer.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {customer.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {customer.invoiceCount} invoices
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Last: {formatDistanceToNow(parseISO(customer.lastOrder), { addSuffix: true })}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Revenue */}
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(customer.totalRevenue)}
                  </p>
                  <div className="flex items-center gap-1 justify-end text-success">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs">+12%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
