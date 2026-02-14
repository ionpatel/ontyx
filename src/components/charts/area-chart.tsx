"use client";

import * as React from "react";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { chartTooltipStyle, chartColorArray } from "./chart-container";

interface AreaChartProps<T = Record<string, unknown>> {
  data: T[];
  xKey: keyof T;
  yKeys: Array<{
    key: keyof T;
    name?: string;
    color?: string;
    stackId?: string;
    fillOpacity?: number;
  }>;
  className?: string;
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curved?: boolean;
  stacked?: boolean;
  gradient?: boolean;
  formatXAxis?: (value: string | number) => string;
  formatYAxis?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => [string, string];
}

export function AreaChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKeys,
  className,
  height = "100%",
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  curved = true,
  stacked = false,
  gradient = true,
  formatXAxis,
  formatYAxis,
  formatTooltip,
}: AreaChartProps<T>) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {gradient && (
            <defs>
              {yKeys.map((yKey, index) => {
                const color = yKey.color || chartColorArray[index % chartColorArray.length];
                const id = `gradient-${String(yKey.key)}-${index}`;
                return (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
          )}
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
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
            />
          )}
          {yKeys.map((yKey, index) => {
            const color = yKey.color || chartColorArray[index % chartColorArray.length];
            const fillId = gradient ? `url(#gradient-${String(yKey.key)}-${index})` : color;
            return (
              <Area
                key={String(yKey.key)}
                type={curved ? "monotone" : "linear"}
                dataKey={yKey.key as string}
                name={yKey.name || String(yKey.key)}
                stroke={color}
                strokeWidth={2}
                fill={fillId}
                fillOpacity={yKey.fillOpacity ?? (gradient ? 1 : 0.3)}
                stackId={stacked ? "stack" : yKey.stackId}
                activeDot={{
                  r: 6,
                  stroke: color,
                  strokeWidth: 2,
                  fill: "hsl(var(--background))",
                }}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
