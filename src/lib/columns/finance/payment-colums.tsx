import { type ColumnDef } from "@tanstack/react-table";
import type { PaymentResponseDTO, PaymentsPageVariant } from "@/types/payment";
import { Badge } from "@/components/ui/badge";
import {
  CreditAmount,
  DebitAmount,
  TotalAmount,
  PaidAmount,
  RemainingAmount,
  CreditNoteAppliedAmount,
} from "@/components/accounting-amount";
import { Button } from "@/components/ui/button";
import { isPaymentArchivedTab } from "@/lib/payment-tab-utils";
import {
  formatPaymentMethodLabel,
  isDummyDocumentUrl,
} from "@/lib/payment-method-label";
import { Archive, CheckCircle2, Loader2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupplierIdNameCell } from "@/components/supplier-id-name-cell";
import { formatExpenseCategoryLabel } from "@/lib/expense-category-label";

export const PAYMENT_COLUMNS = ({
  variant = "customer",
  onConfirm,
  onOpenInvoice,
  onOpenPurchaseOrder,
  onViewReceipt,
  onArchive,
  archivingPaymentId,
}: {
  variant?: PaymentsPageVariant;
  onConfirm: (payment: PaymentResponseDTO) => void;
  onOpenInvoice: (invoiceId: string) => void;
  onOpenPurchaseOrder: (purchaseOrderId: number) => void;
  onViewReceipt?: (payment: PaymentResponseDTO) => void;
  onArchive?: (payment: PaymentResponseDTO) => void;
  archivingPaymentId?: number | null;
}): ColumnDef<PaymentResponseDTO>[] => {
  const columns: ColumnDef<PaymentResponseDTO>[] = [
    { accessorKey: "paymentCode", header: "Code" },
  ];

  if (variant === "vendor") {
    columns.push({
      id: "supplier",
      header: "Supplier",
      cell: ({ row }) => (
        <SupplierIdNameCell
          supplierId={row.original.supplierId}
          supplierName={row.original.supplierName}
        />
      ),
    });
  }

  if (variant === "other") {
    columns.push(
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => formatExpenseCategoryLabel(row.original.expenseCategory),
      },
      {
        id: "payee",
        header: "Paid to",
        cell: ({ row }) => row.original.payee || (
          <span className="text-muted-foreground">—</span>
        ),
      },
    );
  }

  columns.push({
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const item = row.original;
      const amt = Number(row.getValue("amount"));
      const dir =
        item.paymentDirection ||
        (variant === "vendor" ? "VENDOR" : variant === "other" ? "OTHER" : "CUSTOMER");
      if (dir === "VENDOR" || dir === "OTHER") {
        return <DebitAmount amount={amt} />;
      }
      return <CreditAmount amount={Math.abs(amt)} />;
    },
  });

  if (variant !== "other") {
    columns.push(
      {
        id: "invoiceTotal",
        header: "Total",
        cell: ({ row }) => {
          const total = row.original.invoiceTotal;
          if (total == null) {
            return <span className="text-muted-foreground">—</span>;
          }
          return <TotalAmount amount={Number(total)} />;
        },
      },
      {
        id: "invoicePaidAmount",
        header: "Paid Amount",
        cell: ({ row }) => {
          const item = row.original;
          const paid = Number(item.invoicePaidAmount ?? 0);
          const creditApplied = Number(item.invoiceCreditAppliedAmount ?? 0);
          return (
            <div className="space-y-0.5">
              <PaidAmount amount={paid} />
              {creditApplied > 0 && (
                <div className="text-xs text-muted-foreground">
                  incl. <CreditNoteAppliedAmount amount={creditApplied} className="inline" /> credit
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "invoiceRemainderDue",
        header: "Remainder Due",
        cell: ({ row }) => {
          const remaining = row.original.invoiceOutstanding;
          if (remaining == null) {
            return <span className="text-muted-foreground">—</span>;
          }
          return <RemainingAmount amount={Number(remaining)} />;
        },
      },
    );
  }

  columns.push(
    {
      accessorKey: "paymentMethod",
      header: "Method",
      cell: ({ row }) => {
        const value = row.getValue("paymentMethod") as string;
        return (
          <Badge className="bg-blue-100 text-blue-700">
            {formatPaymentMethodLabel(value)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "effectiveDate",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("effectiveDate") as string;
        return new Date(date).toLocaleDateString();
      },
    },
    ...(variant !== "other"
      ? [
          {
            id: "creditApplied",
            header: "Credit Applied",
            cell: ({ row }: { row: { original: PaymentResponseDTO } }) => {
              const applied = Number(row.original.creditAppliedAmount ?? 0);
              if (!applied) {
                return <span className="text-muted-foreground">—</span>;
              }
              return <CreditNoteAppliedAmount amount={applied} />;
            },
          },
          {
            id: "orderNumber",
            header: "Order No",
            cell: ({ row }: { row: { original: PaymentResponseDTO } }) => {
              const item = row.original;
              const dir =
                item.paymentDirection ||
                (variant === "vendor" ? "VENDOR" : "CUSTOMER");
              if (dir === "VENDOR") {
                const poLabel =
                  item.purchaseOrderNumber ||
                  (item.purchaseOrderId != null
                    ? `PO #${item.purchaseOrderId}`
                    : null);
                if (!poLabel) {
                  return <span className="text-muted-foreground">—</span>;
                }
                return item.purchaseOrderId != null ? (
                  <button
                    type="button"
                    className="font-mono text-sm text-blue-600 underline underline-offset-2 text-left"
                    onClick={() => onOpenPurchaseOrder(item.purchaseOrderId!)}
                  >
                    {poLabel}
                  </button>
                ) : (
                  <span className="font-mono text-sm">{poLabel}</span>
                );
              }
              const so = item.salesOrderNumber;
              if (!so) {
                return <span className="text-muted-foreground">—</span>;
              }
              return <span className="font-mono text-sm">{so}</span>;
            },
          },
          {
            id: "reference",
            header: variant === "vendor" ? "Purchase invoice" : "Sales invoice",
            cell: ({ row }: { row: { original: PaymentResponseDTO } }) => {
              const item = row.original;
              const inv = item.invoiceId;
              if (!inv) {
                return <span className="text-muted-foreground">—</span>;
              }
              return (
                <button
                  type="button"
                  className="text-blue-600 underline underline-offset-2 text-left text-sm"
                  onClick={() => onOpenInvoice(inv)}
                >
                  {inv}
                </button>
              );
            },
          },
        ]
      : []),
    ...(variant === "vendor"
      ? [
          {
            id: "vendorInvoiceCode",
            header: "Vendor Invoice Code",
            cell: ({ row }: { row: { original: PaymentResponseDTO } }) => {
              const code = row.original.supplierInvoiceNumber;
              return code ? (
                <span className="font-mono text-sm">{code}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              );
            },
          },
        ]
      : []),
    ...(variant !== "other"
      ? [
          {
            id: "receiptPdf",
            header: "Receipt PDF",
            cell: ({ row }: { row: { original: PaymentResponseDTO } }) => {
              const item = row.original;
              const method = (item.paymentMethod || "").toUpperCase();
              const isPendingVendor =
                variant === "vendor" && method === "PENDING_VENDOR_PAYMENT";
              if (isPendingVendor) {
                return (
                  <span className="text-muted-foreground text-xs">After confirm</span>
                );
              }
              const url = item.pdfUrl;
              const canUseDirect = url && !isDummyDocumentUrl(url);
              if (canUseDirect) {
                return (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                    data-no-row-nav
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                );
              }
              if (variant === "vendor" && onViewReceipt && !isPendingVendor) {
                return (
                  <button
                    type="button"
                    className="text-blue-600 underline text-sm"
                    data-no-row-nav
                    onClick={(e) => {
                      e.stopPropagation();
                      void onViewReceipt(item);
                    }}
                  >
                    View
                  </button>
                );
              }
              return <span className="text-muted-foreground">—</span>;
            },
          },
        ]
      : []),
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        const method = (item.paymentMethod || "").toUpperCase();
        const dir =
          item.paymentDirection ||
          (variant === "vendor" ? "VENDOR" : variant === "other" ? "OTHER" : "CUSTOMER");
        const isPending =
          dir === "VENDOR"
            ? method === "PENDING_VENDOR_PAYMENT"
            : dir === "OTHER"
              ? method === "PENDING_OTHER_PAYMENT"
              : method === "PENDING_REQUEST";
        const settled = isPaymentArchivedTab(item, variant);
        const canArchive = settled && !item.archived && onArchive != null;
        const isArchiving = archivingPaymentId === item.id;

        if (item.archived) {
          return (
            <span className="text-muted-foreground text-xs">Archived</span>
          );
        }

        const hasActions = isPending || canArchive;
        if (!hasActions) {
          return <span className="text-muted-foreground text-xs">Confirmed</span>;
        }

        return (
          <div data-no-row-nav onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {isPending && (
                  <DropdownMenuItem onClick={() => onConfirm(item)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {dir === "VENDOR"
                      ? "Confirm vendor payment"
                      : dir === "OTHER"
                        ? "Confirm expense payment"
                        : "Confirm payment"}
                  </DropdownMenuItem>
                )}
                {canArchive && (
                  <DropdownMenuItem
                    disabled={isArchiving}
                    onClick={() => onArchive!(item)}
                  >
                    {isArchiving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="mr-2 h-4 w-4" />
                    )}
                    {isArchiving ? "Archiving…" : "Archive"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  );

  return columns;
};
