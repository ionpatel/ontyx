"use client";

import * as React from "react";
import { ChartContainer } from "@/components/charts/chart-container";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { generateRevenueData, RevenueDataPoint } from "@/lib/mock-data";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ChartType = "area" | "bar";
type DataView = "revenue" | "profit" | "comparison";

interface RevenueChartProps {
  className?: string;
  height?: number;
  defaultChartType?: ChartType;
  defaultDataView?: DataView;
  showControls?: boolean;
}

export function RevenueChart({
  className,
  height = 350,
  defaultChartType = "area",
  defaultDataView = "revenue",
  showControls = true,
}: RevenueChartProps) {
  const [chartType, setChartType] = React.useState<ChartType>(defaultChartType);
  const [dataView, setDataView] = React.useState<DataView>(defaultDataView);
  const [loading, setLoading] = React.useState(false);
  const data = React.useMemo(() => generateRevenueData(12), []);

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  const getYKeys = () => {
    switch (dataView) {
      case "profit":
        return [
          { key: "profit" as keyof RevenueDataPoint, name: "Profit", color: "hsl(var(--success))" },
        ];
      case "comparison":
        return [
          { key: "revenue" as keyof RevenueDataPoint, name: "This Year", color: "hsl(var(--primary))" },
          { key: "lastYear" as keyof RevenueDataPoint, name: "Last Year", color: "hsl(var(--muted-foreground))" },
        ];
      default:
        return [
          { key: "revenue" as keyof RevenueDataPoint, name: "Revenue", color: "hsl(var(--primary))" },
          { key: "expenses" as keyof RevenueDataPoint, name: "Expenses", color: "hsl(var(--destructive))" },
        ];
    }
  };

  const controls = showControls && (
    <div className="flex items-center gap-2">
      <div className="flex rounded-md border border-border p-1">
        <button
          onClick={() => setDataView("revenue")}
          className={cn(
            "px-2 py-1 text-xs rounded transition-colors",
            dataView === "revenue"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          Revenue
        </button>
        <button
          onClick={() => setDataView("profit")}
          className={cn(
            "px-2 py-1 text-xs rounded transition-colors",
            dataView === "profit"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          Profit
        </button>
        <button
          onClick={() => setDataView("comparison")}
          className={cn(
            "px-2 py-1 text-xs rounded transition-colors",
            dataView === "comparison"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          YoY
        </button>
      </div>
      <div className="flex rounded-md border border-border p-1">
        <button
          onClick={() => setChartType("area")}
          className={cn(
            "px-2 py-1 text-xs rounded transition-colors",
            chartType === "area"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          Area
        </button>
        <button
          onClick={() => setChartType("bar")}
          className={cn(
            "px-2 py-1 text-xs rounded transition-colors",
            chartType === "bar"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          Bar
        </button>
      </div>
    </div>
  );

  return (
    <ChartContainer
      title="Revenue Overview"
      description="Monthly revenue and expenses"
      height={height}
      loading={loading}
      onRefresh={handleRefresh}
      onExport={() => console.log("Export chart")}
      actions={controls}
      className={className}
    >
      {chartType === "area" ? (
        <AreaChart
          data={data}
          xKey="month"
          yKeys={getYKeys()}
          showLegend
          formatYAxis={(v) => formatCompactNumber(v)}
          formatTooltip={(v) => [formatCurrency(v), ""]}
        />
      ) : (
        <BarChart
          data={data}
          xKey="month"
          yKeys={getYKeys()}
          showLegend
          formatYAxis={(v) => formatCompactNumber(v)}
          formatTooltip={(v) => [formatCurrency(v), ""]}
        />
      )}
    </ChartContainer>
  );
}
