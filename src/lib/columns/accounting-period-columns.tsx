import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import type { AccountingPeriod } from "@/types/accounting-period";

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
        <Badge
          variant={status === "OPEN" ? "default" : "destructive"}
          className="capitalize"
        >
          {status.toLowerCase()}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const period = row.original;

      return (
        <div className="flex gap-2">
          {period.status === "OPEN" ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCloseOrReopen?.(period, false);
              }}
            >
              Close
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCloseOrReopen?.(period, true);
              }}
            >
              Reopen
            </Button>
          )}
        </div>
      );
    },
  },
];
