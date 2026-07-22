import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/lib/status-badge";
import type { AccountingPeriod } from "@/types/accounting-period";
import { LockOpen, Lock, MoreHorizontal } from "lucide-react";

interface AccountingPeriodColumnsProps {
  onCloseOrReopen?: (period: AccountingPeriod, reopen: boolean) => void;
}

export const getAccountingPeriodColumns = ({
  onCloseOrReopen,
}: AccountingPeriodColumnsProps): ColumnDef<AccountingPeriod>[] => [
  {
    accessorKey: "periodName",
    header: "Period",
  },
  {
    id: "dateRange",
    header: "Date Range",
    cell: ({ row }) => {
      const period = row.original;
      return (
        <div>
          {new Date(period.startDate).toLocaleDateString()} -{" "}
          {new Date(period.endDate).toLocaleDateString()}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <StatusBadge
          status={status}
          label={status.charAt(0) + status.slice(1).toLowerCase()}
        />
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const period = row.original;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {period.status === "OPEN" ? (
                <DropdownMenuItem onClick={() => onCloseOrReopen?.(period, false)}>
                  <Lock className="mr-2 h-4 w-4" />
                  Close period
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onCloseOrReopen?.(period, true)}>
                  <LockOpen className="mr-2 h-4 w-4" />
                  Reopen period
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
