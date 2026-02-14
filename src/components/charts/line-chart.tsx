"use client";

import * as React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { chartTooltipStyle, chartColorArray } from "./chart-container";

interface LineChartProps<T = Record<string, unknown>> {
  data: T[];
  xKey: keyof T;
  yKeys: Array<{
    key: keyof T;
    name?: string;
    color?: string;
    strokeWidth?: number;
    dashed?: boolean;
    dot?: boolean;
  }>;
  className?: string;
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curved?: boolean;
  referenceLines?: Array<{
    y?: number;
    x?: string | number;
    label?: string;
    color?: string;
    dashed?: boolean;
  }>;
  formatXAxis?: (value: string | number) => string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => [string, string];
}

export function LineChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKeys,
  className,
  height = "100%",
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  curved = true,
  referenceLines = [],
  formatXAxis,
  formatYAxis,
  formatTooltip,
}: LineChartProps<T>) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
          )}
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
          {showTooltip && (
            <Tooltip
              {...chartTooltipStyle}
              formatter={formatTooltip}
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
            />
          )}
          {showLegend && (
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
          )}
          {referenceLines.map((line, index) => (
            <ReferenceLine
              key={index}
              y={line.y}
              x={line.x}
              stroke={line.color || "hsl(var(--muted-foreground))"}
              strokeDasharray={line.dashed ? "5 5" : undefined}
              label={
                line.label
                  ? {
                      value: line.label,
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }
                  : undefined
              }
            />
          ))}
          {yKeys.map((yKey, index) => {
            const color = yKey.color || chartColorArray[index % chartColorArray.length];
            return (
              <Line
                key={String(yKey.key)}
                type={curved ? "monotone" : "linear"}
                dataKey={yKey.key as string}
                name={yKey.name || String(yKey.key)}
                stroke={color}
                strokeWidth={yKey.strokeWidth ?? 2}
                strokeDasharray={yKey.dashed ? "5 5" : undefined}
                dot={
                  yKey.dot ?? {
                    r: 4,
                    stroke: color,
                    strokeWidth: 2,
                    fill: "hsl(var(--background))",
                  }
                }
                activeDot={{
                  r: 6,
                  stroke: color,
                  strokeWidth: 2,
                  fill: "hsl(var(--background))",
                }}
              />
            );
          })}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sparkline variant - minimal line chart for small spaces
interface SparklineProps<T = Record<string, unknown>> {
  data: T[];
  dataKey: keyof T;
  color?: string;
  className?: string;
  height?: number;
  width?: number | string;
}

export function Sparkline<T extends Record<string, unknown>>({
  data,
  dataKey,
  color = "hsl(var(--primary))",
  className,
  height = 40,
  width = "100%",
}: SparklineProps<T>) {
  return (
    <div className={cn("", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <Line
            type="monotone"
            dataKey={dataKey as string}
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
