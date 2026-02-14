"use client";

import * as React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { expenseCategories, ExpenseCategory } from "@/lib/mock-data";
import { DonutChart } from "@/components/charts/donut-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

interface ExpenseBreakdownProps {
  className?: string;
  variant?: "donut" | "pie" | "bars";
}

export function ExpenseBreakdown({
  className,
  variant = "donut",
}: ExpenseBreakdownProps) {
  const totalExpenses = expenseCategories.reduce((sum, c) => sum + c.amount, 0);
  const chartData = expenseCategories.map((c) => ({
    name: c.name,
    value: c.amount,
  }));
  const colors = expenseCategories.map((c) => c.color);

  if (variant === "bars") {
    const maxAmount = Math.max(...expenseCategories.map((c) => c.amount));

    return (
      <Card className={cn("", className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-medium">
              Expense Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalExpenses)} total
            </p>
          </div>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenseCategories.map((category, index) => {
              const percentage = (category.amount / maxAmount) * 100;
              const trend = Math.random() > 0.5;

              return (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {category.percentage}%
                      </span>
                      <span className="font-medium">
                        {formatCurrency(category.amount)}
                      </span>
                      <span
                        className={cn(
                          "text-xs flex items-center gap-0.5",
                          trend ? "text-destructive" : "text-success"
                        )}
                      >
                        {trend ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.floor(Math.random() * 15) + 1}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">
            Expense Breakdown
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            By category this month
          </p>
        </div>
        <button className="text-sm text-primary hover:underline flex items-center gap-1">
          Details <ArrowRight className="h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {variant === "donut" ? (
            <DonutChart
              data={chartData}
              dataKey="value"
              nameKey="name"
              colors={colors}
              innerRadius={50}
              outerRadius={80}
              centerValue={formatCurrency(totalExpenses)}
              centerLabel="Total"
              formatValue={(v) => formatCurrency(v)}
            />
          ) : (
            <PieChart
              data={chartData}
              dataKey="value"
              nameKey="name"
              colors={colors}
              outerRadius={80}
              formatValue={(v) => formatCurrency(v)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
