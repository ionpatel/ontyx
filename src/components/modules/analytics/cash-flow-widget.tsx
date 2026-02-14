"use client";

import * as React from "react";
import { ChartContainer } from "@/components/charts/chart-container";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { generateCashFlowData, CashFlowData } from "@/lib/mock-data";
import { formatCurrency, formatCompactNumber, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";

interface CashFlowWidgetProps {
  className?: string;
  height?: number;
  days?: number;
}

export function CashFlowWidget({
  className,
  height = 280,
  days = 30,
}: CashFlowWidgetProps) {
  const [viewType, setViewType] = React.useState<"balance" | "flow">("balance");
  const data = React.useMemo(() => generateCashFlowData(days), [days]);

  const currentBalance = data[data.length - 1]?.balance ?? 0;
  const previousBalance = data[0]?.balance ?? 0;
  const balanceChange = currentBalance - previousBalance;
  const balanceChangePercent = previousBalance
    ? ((balanceChange / previousBalance) * 100).toFixed(1)
    : "0";

  const totalInflow = data.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = data.reduce((sum, d) => sum + d.outflow, 0);

  const controls = (
    <div className="flex rounded-md border border-border p-1">
      <button
        onClick={() => setViewType("balance")}
        className={cn(
          "px-2 py-1 text-xs rounded transition-colors",
          viewType === "balance"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
      >
        Balance
      </button>
      <button
        onClick={() => setViewType("flow")}
        className={cn(
          "px-2 py-1 text-xs rounded transition-colors",
          viewType === "flow"
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
      >
        In/Out
      </button>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4 text-success" />
          <span className="text-sm">
            <span className="text-muted-foreground">In: </span>
            <span className="font-medium">{formatCurrency(totalInflow)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowDownRight className="h-4 w-4 text-destructive" />
          <span className="text-sm">
            <span className="text-muted-foreground">Out: </span>
            <span className="font-medium">{formatCurrency(totalOutflow)}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          <span className="text-muted-foreground">Balance: </span>
          <span className="font-medium">{formatCurrency(currentBalance)}</span>
          <span
            className={cn(
              "ml-2 text-xs",
              balanceChange >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {balanceChange >= 0 ? "+" : ""}
            {balanceChangePercent}%
          </span>
        </span>
      </div>
    </div>
  );

  return (
    <ChartContainer
      title="Cash Flow"
      description={`Last ${days} days`}
      height={height}
      actions={controls}
      footer={footer}
      className={className}
    >
      {viewType === "balance" ? (
        <AreaChart
          data={data}
          xKey="date"
          yKeys={[
            {
              key: "balance",
              name: "Balance",
              color: "hsl(var(--primary))",
            },
          ]}
          formatXAxis={(v) => format(parseISO(v as string), "MMM d")}
          formatYAxis={(v) => formatCompactNumber(v)}
          formatTooltip={(v) => [formatCurrency(v), ""]}
        />
      ) : (
        <BarChart
          data={data}
          xKey="date"
          yKeys={[
            {
              key: "inflow",
              name: "Inflow",
              color: "hsl(var(--success))",
              stackId: "flow",
            },
            {
              key: "outflow",
              name: "Outflow",
              color: "hsl(var(--destructive))",
              stackId: "flow",
            },
          ]}
          stacked
          formatXAxis={(v) => format(parseISO(v as string), "d")}
          formatYAxis={(v) => formatCompactNumber(v)}
          formatTooltip={(v) => [formatCurrency(v), ""]}
        />
      )}
    </ChartContainer>
  );
}
