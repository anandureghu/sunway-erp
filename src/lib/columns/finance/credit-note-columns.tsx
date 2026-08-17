import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { CreditNote } from "@/types/credit-note";
import { StatusBadge } from "@/lib/status-badge";
import { CreditAmount } from "@/components/accounting-amount";
import { Button } from "@/components/ui/button";
import { Banknote } from "lucide-react";

type Options = {
  onCashOut?: (note: CreditNote) => void;
  cashingId?: number | null;
};

export function buildCreditNoteColumns(options: Options = {}): ColumnDef<CreditNote>[] {
  const cols: ColumnDef<CreditNote>[] = [
    {
      accessorKey: "creditNoteNumber",
      header: "Credit Note #",
    },
    {
      accessorKey: "creditNoteDate",
      header: "Credit Note Date",
      cell: ({ row }) =>
        format(new Date(row.original.creditNoteDate), "dd MMM yyyy"),
    },
    {
      id: "party",
      header: "Customer / Supplier",
      cell: ({ row }) =>
        row.original.customerName ?? row.original.supplierName ?? "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => {
        const src = row.original.source;
        if (!src) return "—";
        if (src === "AUTO_REJECTION") return "PO rejection";
        if (src === "AUTO_CUSTOMER_RETURN") return "Customer return";
        return src.replaceAll("_", " ");
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-[220px] text-slate-600">
          {row.original.reason ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => row.original.project ?? "—",
    },
    {
      accessorKey: "referenceNumber",
      header: "Reference #",
    },
    {
      accessorKey: "amount",
      header: "Total Amount",
      cell: ({ row }) => <CreditAmount amount={row.original.amount} />,
    },
    {
      accessorKey: "remainingAmount",
      header: "Remaining Amount",
      cell: ({ row }) => <CreditAmount amount={row.original.remainingAmount} />,
    },
  ];

  if (options.onCashOut) {
    cols.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const note = row.original;
        const canCash =
          (note.status === "AVAILABLE" || note.status === "PARTIALLY_APPLIED") &&
          Number(note.remainingAmount) > 0;
        if (!canCash) return null;
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            disabled={options.cashingId === note.id}
            onClick={(e) => {
              e.stopPropagation();
              options.onCashOut?.(note);
            }}
          >
            <Banknote className="h-3.5 w-3.5" />
            Cash out
          </Button>
        );
      },
    });
  }

  return cols;
}

/** @deprecated Prefer buildCreditNoteColumns for cash-out support */
export const CREDIT_NOTE_COLUMNS = buildCreditNoteColumns();
