import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { JournalEntryResponseDTO } from "@/types/journal";
import type { ColumnDef } from "@tanstack/react-table";
import { CreditAmount, DebitAmount } from "@/components/accounting-amount";
import { StatusBadge } from "@/lib/status-badge";

export const JOURNAL_COLUMNS = ({
  onEdit,
  onPost,
  accountOpen,
  currency,
}: {
  onEdit: (row: JournalEntryResponseDTO) => void;
  onPost: (row: JournalEntryResponseDTO) => void;
  accountOpen?: boolean;
  currency: string;
}): ColumnDef<JournalEntryResponseDTO>[] => [
  {
    accessorKey: "journalEntryNumber",
    header: "JE No",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "entryDate",
    header: "Date",
  },
  {
    accessorKey: "totalDebit",
    header: "Total Debit",
    cell: ({ row }) => {
      const je = row.original;
      return <DebitAmount amount={je.totalDebit} currencyCode={currency} />;
    },
  },
  {
    accessorKey: "totalCredit",
    header: "Total Credit",
    cell: ({ row }) => {
      const je = row.original;
      return <CreditAmount amount={je.totalCredit} currencyCode={currency} />;
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
    accessorKey: "source",
    header: "Source",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const data = row.original;
      return (
        <div>
          {!accountOpen ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex gap-2 items-center">
                  <Button size="sm" disabled>
                    Edit
                  </Button>
                  <Button size="sm" disabled>
                    Post
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Cannot add or modify journal while accounting period is closed
                </p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(data);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPost(data);
                }}
              >
                Post
              </Button>
            </div>
          )}
        </div>
      );
    },
  },
];
