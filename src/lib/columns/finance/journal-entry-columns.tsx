// src/lib/columns/finance/journal-entry-columns.ts

import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/lib/status-badge";
import { CreditAmount, DebitAmount } from "@/components/accounting-amount";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import type { JournalEntry } from "@/types/finance/journal-entry";

export const JOURNAL_ENTRY_COLUMNS = ({
  onEdit,
  onApprove,
  onReject,
  onHold,
}: {
  onEdit: (entry: JournalEntry) => void;
  onApprove: (entry: JournalEntry) => void;
  onReject: (entry: JournalEntry) => void;
  onHold: (entry: JournalEntry) => void;
}): ColumnDef<JournalEntry>[] => [
  { accessorKey: "jeNumber", header: "JE No" },
  {
    accessorKey: "debitAccountCode",
    header: "Debit Account Code",
  },
  {
    accessorKey: "debitAccountName",
    header: "Debit Account Name",
  },
  {
    accessorKey: "creditAccountCode",
    header: "Credit Account Code",
  },
  {
    accessorKey: "creditAccountName",

    header: "Credit Account Name",
  },

  {
    id: "debitAmount",
    header: "Debit",
    cell: ({ row }) => {
      const je = row.original;
      return <DebitAmount amount={je.amount} />;
    },
  },
  {
    id: "creditAmount",
    header: "Credit",
    cell: ({ row }) => {
      const je = row.original;
      return <CreditAmount amount={je.amount} />;
    },
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={String(row.getValue("status") ?? "")} />
    ),
  },

  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row?.original?.createdAt).toDateString();
    },
  },
  { accessorKey: "createdByName", header: "Created By" },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const entry = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            {(entry.status === "PENDING_APPROVAL" ||
              entry.status === "ON_HOLD") && (
              <DropdownMenuItem onClick={() => onEdit(entry)}>
                Edit
              </DropdownMenuItem>
            )}

            {entry.status === "PENDING_APPROVAL" && (
              <>
                <DropdownMenuItem onClick={() => onApprove(entry)}>
                  Approve
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onReject(entry)}>
                  Reject
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onHold(entry)}>
                  Hold
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-muted-foreground">
              ID: {entry.id}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
