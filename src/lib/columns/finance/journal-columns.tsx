import { Button } from "@/components/ui/button";
import type { JournalEntryResponseDTO } from "@/types/journal";
import type { ColumnDef } from "@tanstack/react-table";

export const JOURNAL_COLUMNS = ({
  onEdit,
  onPost,
}: {
  onEdit: (row: JournalEntryResponseDTO) => void;
  onPost: (row: JournalEntryResponseDTO) => void;
}): ColumnDef<JournalEntryResponseDTO>[] => [
  {
    accessorKey: "journalEntryNumber",
    header: "JE No",
  },
  {
    accessorKey: "entryDate",
    header: "Date",
  },
  {
    accessorKey: "totalDebit",
    header: "Total Debit",
  },
  {
    accessorKey: "totalCredit",
    header: "Total Credit",
  },
  {
    accessorKey: "status",
    header: "Status",
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
      );
    },
  },
];
