// src/lib/columns/finance/reconciliation-columns.ts

import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/lib/status-badge";
import { SignedColoredAmount } from "@/components/accounting-amount";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Reconciliation } from "@/types/finance/reconcilation";

export const RECONCILIATION_COLUMNS = ({
  onEdit,
  onConfirm,
}: {
  onEdit: (rec: Reconciliation) => void;
  onConfirm: (rec: Reconciliation) => void;
}): ColumnDef<Reconciliation>[] => [
  {
    accessorKey: "accountCode",
    header: "Account Code",
  },
  {
    accessorKey: "accountName",
    header: "Account Name",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <SignedColoredAmount amount={Number(row.getValue("amount"))} />
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
  },
  {
    accessorKey: "resource",
    header: "Resource",
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={String(row.getValue("status") ?? "")} />
    ),
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const rec = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            {rec.status === "DRAFT" && (
              <>
                <DropdownMenuItem onClick={() => onEdit(rec)}>
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onConfirm(rec)}>
                  Confirm
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-muted-foreground">
              ID: {rec.id}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
