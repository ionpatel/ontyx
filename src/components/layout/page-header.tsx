"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  backHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  backHref,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {backHref && (
            <Button variant="ghost" size="icon" asChild className="mt-0.5">
              <Link href={backHref}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground max-w-2xl">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Optional children (tabs, filters, etc.) */}
      {children}
    </div>
  );
}

// Stats row for page headers
interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
}

interface PageStatsProps {
  stats: StatItem[];
  className?: string;
}

export function PageStats({ stats, className }: PageStatsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-6 py-4 border-t border-border",
        className
      )}
    >
      {stats.map((stat, index) => (
        <div key={index} className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">{stat.label}:</span>
          <span className="text-lg font-semibold">{stat.value}</span>
          {stat.change !== undefined && (
            <span
              className={cn(
                "text-xs font-medium",
                stat.trend === "up" && "text-success",
                stat.trend === "down" && "text-destructive",
                stat.trend === "neutral" && "text-muted-foreground"
              )}
            >
              {stat.change > 0 ? "+" : ""}
              {stat.change}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
