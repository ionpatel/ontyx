"use client";

import * as React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { outstandingInvoices } from "@/lib/mock-data";
import { Invoice } from "@/types/finance";
import {
  FileText,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow, parseISO, isPast, differenceInDays } from "date-fns";

interface OutstandingInvoicesProps {
  className?: string;
  limit?: number;
}

const statusStyles: Record<string, string> = {
  paid: "bg-success/10 text-success",
  sent: "bg-blue-500/10 text-blue-500",
  pending: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
  draft: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export function OutstandingInvoices({
  className,
  limit = 5,
}: OutstandingInvoicesProps) {
  const invoices = outstandingInvoices.slice(0, limit);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);
  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;
  const overdueAmount = invoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.amountDue, 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base font-medium">
            Outstanding Invoices
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {invoices.length} invoices • {formatCurrency(totalOutstanding)} total
          </p>
        </div>
        <button className="text-sm text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </CardHeader>

      {overdueCount > 0 && (
        <div className="mx-6 mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              {overdueCount} overdue ({formatCurrency(overdueAmount)})
            </span>
          </div>
        </div>
      )}

      <CardContent className="pt-0">
        <div className="space-y-1">
          {invoices.map((invoice, index) => {
            const dueDate = parseISO(invoice.dueDate);
            const isOverdue = isPast(dueDate) && invoice.status !== "paid";

            return (
              <div
                key={invoice.id}
                className={cn(
                  "flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer group",
                  index !== invoices.length - 1 && "border-b border-border/50"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg p-2",
                    isOverdue ? "bg-destructive/10" : "bg-muted"
                  )}
                >
                  <FileText
                    className={cn(
                      "h-4 w-4",
                      isOverdue ? "text-destructive" : "text-muted-foreground"
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{invoice.invoiceNumber}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-medium",
                        statusStyles[invoice.status]
                      )}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {invoice.customerName}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(invoice.amountDue)}
                  </p>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span
                      className={cn(
                        "text-xs",
                        isOverdue ? "text-destructive" : "text-muted-foreground"
                      )}
                    >
                      {isOverdue
                        ? `${differenceInDays(new Date(), dueDate)}d overdue`
                        : `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`}
                    </span>
                  </div>
                </div>

                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
