import type { ColumnDef } from "@tanstack/react-table";
import type { JournalLineDTO } from "@/types/journal";
import type { Company } from "@/types/company";

export const JOURNAL_LINE_COLUMNS = ({
  company,
}: {
  company: Company;
}): ColumnDef<JournalLineDTO>[] => [
  {
    accessorKey: "debitAccountName",
    header: "Debit Account",
  },

  {
    accessorKey: "creditAccountName",
    header: "Credit Account",
  },
  {
    accessorKey: "debitAmount",
    header: "Amount",
    cell: ({ row }) =>
      `${company.currency?.currencySymbol} ${row.original.debitAmount?.toFixed(2)}`,
  },
  // {
  //   accessorKey: "creditAmount",
  //   header: "Credit",
  //   cell: ({ row }) => row.original.creditAmount?.toFixed(2),
  // },

  // {
  //   accessorKey: "currencyCode",
  //   header: "Currency",
  // },
  // {
  //   accessorKey: "exchangeRate",
  //   header: "Exchange Rate",
  // },
  // {
  //   accessorKey: "departmentId",
  //   header: "Department",
  //   cell: ({ row }) => row.original.departmentId ?? "-",
  // },
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
