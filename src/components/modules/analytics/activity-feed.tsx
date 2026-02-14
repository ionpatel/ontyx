"use client";

import * as React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recentActivity, ActivityItem } from "@/lib/mock-data";
import {
  FileText,
  CreditCard,
  ShoppingCart,
  Users,
  Package,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const activityIcons: Record<ActivityItem["type"], React.ElementType> = {
  invoice: FileText,
  payment: CreditCard,
  order: ShoppingCart,
  customer: Users,
  product: Package,
  expense: Receipt,
};

const activityColors: Record<ActivityItem["type"], string> = {
  invoice: "bg-blue-500/10 text-blue-500",
  payment: "bg-green-500/10 text-green-500",
  order: "bg-purple-500/10 text-purple-500",
  customer: "bg-orange-500/10 text-orange-500",
  product: "bg-yellow-500/10 text-yellow-500",
  expense: "bg-red-500/10 text-red-500",
};

interface ActivityFeedProps {
  className?: string;
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function ActivityFeed({
  className,
  limit = 8,
  showHeader = true,
  compact = false,
}: ActivityFeedProps) {
  const activities = recentActivity.slice(0, limit);

  return (
    <Card className={cn("", className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
          <button className="text-sm text-primary hover:underline">
            View all
          </button>
        </CardHeader>
      )}
      <CardContent className={cn(showHeader ? "" : "pt-6")}>
        <div className="space-y-1">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];
            
            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer",
                  index !== activities.length - 1 && "border-b border-border/50"
                )}
              >
                <div className={cn("rounded-lg p-2", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {activity.title}
                    </p>
                    {activity.amount && (
                      <span
                        className={cn(
                          "text-sm font-medium flex items-center gap-1",
                          activity.type === "payment"
                            ? "text-success"
                            : activity.type === "expense"
                            ? "text-destructive"
                            : ""
                        )}
                      >
                        {activity.type === "payment" && (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                        {activity.type === "expense" && (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {formatCurrency(activity.amount)}
                      </span>
                    )}
                  </div>
                  {!compact && (
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                    {activity.user && !compact && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {activity.user}
                        </span>
                      </>
                    )}
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

// Compact activity list for sidebars
export function ActivityList({ limit = 5 }: { limit?: number }) {
  const activities = recentActivity.slice(0, limit);

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type];
        const colorClass = activityColors[activity.type];

        return (
          <div key={activity.id} className="flex items-center gap-3">
            <div className={cn("rounded-md p-1.5", colorClass)}>
              <Icon className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{activity.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
            {activity.amount && (
              <span className="text-sm font-medium">
                {formatCurrency(activity.amount)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
