import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { JournalEntryResponseDTO } from "@/types/journal";
import type { ColumnDef } from "@tanstack/react-table";
import { CreditAmount, DebitAmount } from "@/components/accounting-amount";
import { StatusBadge } from "@/lib/status-badge";
import { MoreHorizontal, Pencil, Send } from "lucide-react";

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
        <div onClick={(e) => e.stopPropagation()}>
          {!accountOpen ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="ghost" className="h-8 w-8 p-0" disabled>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cannot modify journal while accounting period is closed</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(data)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPost(data)}>
                  <Send className="mr-2 h-4 w-4" />
                  Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      );
    },
  },
];
