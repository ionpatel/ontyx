"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { chartTooltipStyle, chartColorArray } from "./chart-container";

interface DonutChartProps<T = Record<string, unknown>> {
  data: T[];
  dataKey: keyof T;
  nameKey: keyof T;
  colors?: string[];
  className?: string;
  height?: number | string;
  showLegend?: boolean;
  showTooltip?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  centerLabel?: string;
  centerValue?: string | number;
  formatValue?: (value: number) => string;
}

export function DonutChart<T extends Record<string, unknown>>({
  data,
  dataKey,
  nameKey,
  colors = chartColorArray,
  className,
  height = "100%",
  showLegend = true,
  showTooltip = true,
  innerRadius = 60,
  outerRadius = 80,
  centerLabel,
  centerValue,
  formatValue,
}: DonutChartProps<T>) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>();

  const total = React.useMemo(() => {
    return data.reduce((sum, item) => sum + (item[dataKey] as number), 0);
  }, [data, dataKey]);

  return (
    <div className={cn("w-full relative", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          {showTooltip && (
            <Tooltip
              {...chartTooltipStyle}
              formatter={(value: number, name: string) => [
                formatValue ? formatValue(value) : value,
                name,
              ]}
            />
          )}
          {showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              formatter={(value, entry: any) => {
                const item = data.find((d) => d[nameKey] === value);
                const itemValue = item ? (item[dataKey] as number) : 0;
                const percentage = ((itemValue / total) * 100).toFixed(1);
                return (
                  <span className="text-sm">
                    <span className="text-muted-foreground">{value}</span>
                    <span className="ml-2 font-medium">{percentage}%</span>
                  </span>
                );
              }}
            />
          )}
          <Pie
            data={data}
            dataKey={dataKey as string}
            nameKey={nameKey as string}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                style={{
                  filter:
                    activeIndex === index
                      ? "brightness(1.1)"
                      : "brightness(1)",
                  transition: "filter 0.2s ease",
                }}
              />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Center content */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && (
            <span className="text-2xl font-bold">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-sm text-muted-foreground">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Progress Ring - a single-value donut
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showValue?: boolean;
  label?: string;
  className?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = "hsl(var(--primary))",
  backgroundColor = "hsl(var(--muted))",
  showValue = true,
  label,
  className,
}: ProgressRingProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center content */}
      {(showValue || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <span className="text-xl font-bold">{Math.round(percentage)}%</span>
          )}
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}
