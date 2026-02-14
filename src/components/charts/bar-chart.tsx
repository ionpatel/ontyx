"use client";

import * as React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { chartTooltipStyle, chartColorArray } from "./chart-container";

interface BarChartProps<T = Record<string, unknown>> {
  data: T[];
  xKey: keyof T;
  yKeys: Array<{
    key: keyof T;
    name?: string;
    color?: string;
    stackId?: string;
    radius?: number;
  }>;
  className?: string;
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  barSize?: number;
  formatXAxis?: (value: string | number) => string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => [string, string];
  colorByValue?: (value: number) => string;
}

export function BarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKeys,
  className,
  height = "100%",
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  horizontal = false,
  stacked = false,
  barSize,
  formatXAxis,
  formatYAxis,
  formatTooltip,
  colorByValue,
}: BarChartProps<T>) {
  const ChartComponent = horizontal ? RechartsBarChart : RechartsBarChart;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              horizontal={!horizontal}
              vertical={horizontal}
            />
          )}
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={formatYAxis}
              />
              <YAxis
                dataKey={xKey as string}
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={formatXAxis}
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey as string}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={formatXAxis}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={formatYAxis}
                width={50}
              />
            </>
          )}
          {showTooltip && (
            <Tooltip
              {...chartTooltipStyle}
              formatter={formatTooltip}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
          )}
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              iconType="square"
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
          )}
          {yKeys.map((yKey, index) => {
            const color = yKey.color || chartColorArray[index % chartColorArray.length];
            return (
              <Bar
                key={String(yKey.key)}
                dataKey={yKey.key as string}
                name={yKey.name || String(yKey.key)}
                fill={color}
                stackId={stacked ? "stack" : yKey.stackId}
                radius={yKey.radius ?? [4, 4, 0, 0]}
                barSize={barSize}
              >
                {colorByValue &&
                  data.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={colorByValue(entry[yKey.key] as number)}
                    />
                  ))}
              </Bar>
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal variant export
export function HorizontalBarChart(
  props: Omit<BarChartProps<Record<string, unknown>>, "horizontal">
) {
  return <BarChart {...props} horizontal />;
}
