import { Button } from "@/components/ui/button";
import {
  Archive,
  ArchiveRestore,
  Ban,
  FileSpreadsheet,
  Trash2,
  X,
} from "lucide-react";

type Props = {
  selectedCount: number;
  uniqueItemCount: number;
  view: "active" | "archived";
  canEdit: boolean;
  canDelete: boolean;
  archiving?: boolean;
  restoring?: boolean;
  deleting?: boolean;
  updatingStatus?: boolean;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
  onMarkDiscontinued?: () => void;
  onExportSelected?: () => void;
  onClear: () => void;
};

export function StockBulkActionBar({
  selectedCount,
  uniqueItemCount,
  view,
  canEdit,
  canDelete,
  archiving = false,
  restoring = false,
  deleting = false,
  updatingStatus = false,
  onArchive,
  onRestore,
  onDelete,
  onMarkDiscontinued,
  onExportSelected,
  onClear,
}: Props) {
  if (selectedCount <= 0) return null;

  const busy = archiving || restoring || deleting || updatingStatus;
  const label =
    uniqueItemCount !== selectedCount
      ? `${uniqueItemCount} product${uniqueItemCount === 1 ? "" : "s"} selected (${selectedCount} rows)`
      : `${uniqueItemCount} product${uniqueItemCount === 1 ? "" : "s"} selected`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {onExportSelected ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onExportSelected}
            disabled={busy}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export selected
          </Button>
        ) : null}

        {view === "active" && canEdit ? (
          <>
            {onMarkDiscontinued ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onMarkDiscontinued}
                disabled={busy}
              >
                <Ban className="mr-2 h-4 w-4" />
                Mark discontinued
              </Button>
            ) : null}
            {onArchive ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onArchive}
                disabled={busy}
              >
                <Archive className="mr-2 h-4 w-4" />
                {archiving ? "Archiving…" : "Archive"}
              </Button>
            ) : null}
          </>
        ) : null}

        {view === "archived" && canEdit && onRestore ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRestore}
            disabled={busy}
          >
            <ArchiveRestore className="mr-2 h-4 w-4" />
            {restoring ? "Restoring…" : "Restore"}
          </Button>
        ) : null}

        {view === "archived" && canDelete && onDelete ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onDelete}
            disabled={busy}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Deleting…" : "Delete permanently"}
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
