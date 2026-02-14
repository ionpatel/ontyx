"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border border-primary/20",
        secondary: "bg-secondary text-secondary-foreground border border-border",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        accent: "bg-accent/10 text-accent border border-accent/20",
        outline: "border border-border text-foreground",
        // Status badges for invoices, orders, etc.
        draft: "bg-muted text-muted-foreground border border-border",
        pending: "bg-warning/10 text-warning border border-warning/20",
        approved: "bg-success/10 text-success border border-success/20",
        rejected: "bg-destructive/10 text-destructive border border-destructive/20",
        paid: "bg-success/10 text-success border border-success/20",
        overdue: "bg-destructive/10 text-destructive border border-destructive/20",
        cancelled: "bg-muted text-muted-foreground border border-border line-through",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

function Badge({
  className,
  variant,
  size,
  dot,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "mr-1.5 h-1.5 w-1.5 rounded-full",
            dotColor || "bg-current"
          )}
        />
      )}
      {children}
    </div>
  );
}

// Status Badge with dot
interface StatusBadgeProps {
  status: "draft" | "pending" | "approved" | "rejected" | "paid" | "overdue" | "cancelled" | "active" | "inactive";
  children?: React.ReactNode;
}

function StatusBadge({ status, children }: StatusBadgeProps) {
  const statusConfig: Record<string, { variant: any; label: string }> = {
    draft: { variant: "draft", label: "Draft" },
    pending: { variant: "pending", label: "Pending" },
    approved: { variant: "approved", label: "Approved" },
    rejected: { variant: "rejected", label: "Rejected" },
    paid: { variant: "paid", label: "Paid" },
    overdue: { variant: "overdue", label: "Overdue" },
    cancelled: { variant: "cancelled", label: "Cancelled" },
    active: { variant: "success", label: "Active" },
    inactive: { variant: "draft", label: "Inactive" },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge variant={config.variant} dot>
      {children || config.label}
    </Badge>
  );
}

export { Badge, badgeVariants, StatusBadge };
