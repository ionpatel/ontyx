"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Sector,
} from "recharts";
import { cn } from "@/lib/utils";
import { chartTooltipStyle, chartColorArray } from "./chart-container";

interface PieChartProps<T = Record<string, unknown>> {
  data: T[];
  dataKey: keyof T;
  nameKey: keyof T;
  colors?: string[];
  className?: string;
  height?: number | string;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  interactive?: boolean;
  formatValue?: (value: number) => string;
  formatLabel?: (entry: T) => string;
}

export function PieChart<T extends Record<string, unknown>>({
  data,
  dataKey,
  nameKey,
  colors = chartColorArray,
  className,
  height = "100%",
  showLegend = true,
  showTooltip = true,
  showLabels = false,
  innerRadius = 0,
  outerRadius = 80,
  paddingAngle = 2,
  interactive = true,
  formatValue,
  formatLabel,
}: PieChartProps<T>) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>();

  const onPieEnter = React.useCallback(
    (_: unknown, index: number) => {
      if (interactive) {
        setActiveIndex(index);
      }
    },
    [interactive]
  );

  const onPieLeave = React.useCallback(() => {
    if (interactive) {
      setActiveIndex(undefined);
    }
  }, [interactive]);

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      value,
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fill="hsl(var(--foreground))"
          className="text-sm font-medium"
        >
          {payload[nameKey]}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          className="text-lg font-bold"
        >
          {formatValue ? formatValue(value) : value}
        </text>
      </g>
    );
  };

  const renderLabel = (entry: any) => {
    if (formatLabel) {
      return formatLabel(entry);
    }
    const value = entry[dataKey];
    return formatValue ? formatValue(value as number) : value;
  };

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          {showTooltip && (
            <Tooltip
              {...chartTooltipStyle}
              formatter={(value: number) =>
                formatValue ? formatValue(value) : value
              }
            />
          )}
          {showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-muted-foreground">{value}</span>
              )}
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
            paddingAngle={paddingAngle}
            activeIndex={activeIndex}
            activeShape={interactive ? renderActiveShape : undefined}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            label={showLabels ? renderLabel : false}
            labelLine={showLabels}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
