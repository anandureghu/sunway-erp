import { Button } from "@/components/ui/button";
import { Archive, Trash2, X } from "lucide-react";

type BulkActionBarProps = {
  selectedCount: number;
  mode?: "archive" | "delete";
  onArchive?: () => void;
  onDelete?: () => void;
  onClear: () => void;
  archiving?: boolean;
  deleting?: boolean;
};

export function BulkActionBar({
  selectedCount,
  mode = "archive",
  onArchive,
  onDelete,
  onClear,
  archiving = false,
  deleting = false,
}: BulkActionBarProps) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="text-sm font-medium">
        {selectedCount} item{selectedCount === 1 ? "" : "s"} selected
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {mode === "archive" && onArchive ? (
          <Button
            type="button"
            size="sm"
            onClick={onArchive}
            disabled={archiving}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive selected
          </Button>
        ) : null}
        {mode === "delete" && onDelete ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete selected
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
