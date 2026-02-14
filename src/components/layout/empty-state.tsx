"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  Package,
  Users,
  FolderKanban,
  Search,
  AlertCircle,
  Inbox,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateType =
  | "no-data"
  | "no-results"
  | "error"
  | "invoices"
  | "contacts"
  | "products"
  | "projects"
  | "custom";

interface EmptyStateProps {
  type?: EmptyStateType;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

const defaultIcons: Record<EmptyStateType, React.ReactNode> = {
  "no-data": <Inbox className="h-12 w-12" />,
  "no-results": <Search className="h-12 w-12" />,
  error: <AlertCircle className="h-12 w-12" />,
  invoices: <FileText className="h-12 w-12" />,
  contacts: <Users className="h-12 w-12" />,
  products: <Package className="h-12 w-12" />,
  projects: <FolderKanban className="h-12 w-12" />,
  custom: <Inbox className="h-12 w-12" />,
};

export function EmptyState({
  type = "no-data",
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const Icon = icon || defaultIcons[type];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 rounded-full p-4",
          type === "error"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground"
        )}
      >
        {Icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              asChild={!!action.href}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              {action.href ? (
                <a href={action.href}>{action.label}</a>
              ) : (
                action.label
              )}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              asChild={!!secondaryAction.href}
            >
              {secondaryAction.href ? (
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              ) : (
                secondaryAction.label
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function NoInvoicesEmpty({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <EmptyState
      type="invoices"
      title="No invoices yet"
      description="Create your first invoice to start tracking your receivables and get paid faster."
      action={{
        label: "Create Invoice",
        onClick: onCreateClick,
      }}
      secondaryAction={{
        label: "Import invoices",
      }}
    />
  );
}

export function NoContactsEmpty({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <EmptyState
      type="contacts"
      title="No contacts yet"
      description="Add your customers and vendors to start managing your business relationships."
      action={{
        label: "Add Contact",
        onClick: onCreateClick,
      }}
      secondaryAction={{
        label: "Import contacts",
      }}
    />
  );
}

export function NoProductsEmpty({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <EmptyState
      type="products"
      title="No products yet"
      description="Add your products and services to start tracking inventory and creating invoices."
      action={{
        label: "Add Product",
        onClick: onCreateClick,
      }}
    />
  );
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      type="no-results"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search or filters.`}
    />
  );
}

export function ErrorState({
  onRetry,
  message,
}: {
  onRetry?: () => void;
  message?: string;
}) {
  return (
    <EmptyState
      type="error"
      title="Something went wrong"
      description={message || "We encountered an error loading this data. Please try again."}
      action={
        onRetry
          ? {
              label: "Try again",
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}
