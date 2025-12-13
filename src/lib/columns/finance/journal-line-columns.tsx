import type { ColumnDef } from "@tanstack/react-table";
import type { JournalLineDTO } from "@/types/journal";

export const JOURNAL_LINE_COLUMNS: ColumnDef<JournalLineDTO>[] = [
  {
    accessorKey: "accountId",
    header: "Account",
  },
  {
    accessorKey: "debitAmount",
    header: "Debit",
    cell: ({ row }) => row.original.debitAmount?.toFixed(2),
  },
  {
    accessorKey: "creditAmount",
    header: "Credit",
    cell: ({ row }) => row.original.creditAmount?.toFixed(2),
  },

  {
    accessorKey: "currencyCode",
    header: "Currency",
  },
  {
    accessorKey: "exchangeRate",
    header: "Exchange Rate",
  },
  {
    accessorKey: "departmentId",
    header: "Department",
    cell: ({ row }) => row.original.departmentId ?? "-",
  },
  {
    accessorKey: "projectId",
    header: "Project",
    cell: ({ row }) => row.original.projectId ?? "-",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
];
