"use client";

import * as React from "react";
import { cn, formatCurrency, formatCompactNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/charts/line-chart";
import { kpiSummary, generateCashFlowData } from "@/lib/mock-data";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Wallet,
  Users,
  ShoppingCart,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface KPIWidgetProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  sparklineData?: Array<{ value: number }>;
  className?: string;
  onClick?: () => void;
}

export function KPIWidget({
  title,
  value,
  change,
  changeLabel = "vs last period",
  icon: Icon,
  iconColor = "text-primary",
  trend,
  sparklineData,
  className,
  onClick,
}: KPIWidgetProps) {
  const isPositive = trend === "up" || (change !== undefined && change > 0);
  const isNegative = trend === "down" || (change !== undefined && change < 0);

  return (
    <Card
      className={cn(
        "p-5 hover:shadow-md transition-all cursor-pointer group",
        onClick && "hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          
          {change !== undefined && (
            <div className="flex items-center gap-1.5 text-sm">
              {isPositive ? (
                <div className="flex items-center text-success">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="font-medium">+{Math.abs(change)}%</span>
                </div>
              ) : isNegative ? (
                <div className="flex items-center text-destructive">
                  <ArrowDownRight className="h-4 w-4" />
                  <span className="font-medium">{Math.abs(change)}%</span>
                </div>
              ) : (
                <span className="text-muted-foreground font-medium">0%</span>
              )}
              <span className="text-muted-foreground text-xs">{changeLabel}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={cn("rounded-lg bg-primary/10 p-2.5", iconColor.replace("text-", "bg-").replace("500", "500/10"))}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          
          {sparklineData && (
            <Sparkline
              data={sparklineData}
              dataKey="value"
              height={30}
              width={80}
              color={isPositive ? "hsl(var(--success))" : isNegative ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

// Pre-built KPI Grid component
interface KPIGridProps {
  className?: string;
}

export function KPIGrid({ className }: KPIGridProps) {
  const cashFlowData = React.useMemo(
    () => generateCashFlowData(14).map((d) => ({ value: d.balance })),
    []
  );

  const revenueSparkline = [
    { value: 38000 },
    { value: 42000 },
    { value: 39000 },
    { value: 45000 },
    { value: 48000 },
    { value: 52000 },
    { value: 49000 },
  ];

  const expenseSparkline = [
    { value: 24000 },
    { value: 26000 },
    { value: 25000 },
    { value: 27000 },
    { value: 28000 },
    { value: 29000 },
    { value: 28500 },
  ];

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      <KPIWidget
        title="Total Revenue"
        value={formatCurrency(kpiSummary.totalRevenue)}
        change={kpiSummary.revenueChange}
        icon={DollarSign}
        iconColor="text-green-500"
        trend="up"
        sparklineData={revenueSparkline}
      />
      <KPIWidget
        title="Total Expenses"
        value={formatCurrency(kpiSummary.totalExpenses)}
        change={kpiSummary.expensesChange}
        icon={Receipt}
        iconColor="text-red-500"
        trend="up"
      />
      <KPIWidget
        title="Net Profit"
        value={formatCurrency(kpiSummary.netProfit)}
        change={kpiSummary.profitChange}
        icon={PiggyBank}
        iconColor="text-blue-500"
        trend="up"
        sparklineData={cashFlowData}
      />
      <KPIWidget
        title="Outstanding Invoices"
        value={formatCurrency(kpiSummary.outstandingInvoices)}
        change={kpiSummary.invoicesChange}
        icon={CreditCard}
        iconColor="text-orange-500"
        trend="down"
      />
    </div>
  );
}

// Secondary KPIs
export function SecondaryKPIs({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      <KPIWidget
        title="Cash Balance"
        value={formatCurrency(kpiSummary.cashBalance)}
        change={kpiSummary.cashChange}
        icon={Wallet}
        iconColor="text-emerald-500"
        trend="up"
      />
      <KPIWidget
        title="Total Customers"
        value={formatCompactNumber(kpiSummary.customersCount)}
        change={kpiSummary.customersChange}
        icon={Users}
        iconColor="text-purple-500"
        trend="up"
      />
      <KPIWidget
        title="Orders This Month"
        value={formatCompactNumber(kpiSummary.ordersCount)}
        change={kpiSummary.ordersChange}
        icon={ShoppingCart}
        iconColor="text-cyan-500"
        trend="up"
      />
      <KPIWidget
        title="Avg Order Value"
        value={formatCurrency(kpiSummary.averageOrderValue)}
        change={kpiSummary.aovChange}
        icon={TrendingUp}
        iconColor="text-amber-500"
        trend="up"
      />
    </div>
  );
}
