import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { CreditNote } from "@/types/credit-note";

export const CREDIT_NOTE_COLUMNS: ColumnDef<CreditNote>[] = [
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
    accessorKey: "customerName",
    header: "Customer",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;

      const color =
        status === "APPLIED"
          ? "bg-green-100 text-green-700"
          : status === "PARTIALLY_APPLIED"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-gray-100 text-gray-700";

      return <Badge className={color}>{status}</Badge>;
    },
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
    header: "Amount",
    cell: ({ row }) => `₹ ${row.original.amount.toLocaleString()}`,
  },
  {
    accessorKey: "remainingAmount",
    header: "Remaining Amount",
    cell: ({ row }) => `₹ ${row.original.remainingAmount.toLocaleString()}`,
  },
];
