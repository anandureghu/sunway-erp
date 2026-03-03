// src/lib/columns/finance/journal-entry-columns.ts

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import Info from "@/components/info";

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
    accessorKey: "debitAccountName",
    header: "Debit",
    cell: ({ row }) => {
      const je = row.original;
      return (
        <Info title={je.debitAccountName} subtitle={je.debitAccountCode} />
      );
    },
  },

  {
    accessorKey: "creditAccountName",
    header: "Credit",
    cell: ({ row }) => {
      const je = row.original;
      return (
        <Info
          title={je.creditAccountName ?? "-"}
          subtitle={je.creditAccountCode ?? "-"}
        />
      );
    },
  },

  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) =>
      Number(row.getValue("amount")).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<string>("status");

      const color =
        status === "APPROVED"
          ? "bg-green-100 text-green-700"
          : status === "REJECTED"
            ? "bg-red-100 text-red-700"
            : status === "ON_HOLD"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700";

      return <Badge className={color}>{status}</Badge>;
    },
  },

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
