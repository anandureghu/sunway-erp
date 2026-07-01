import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DestructiveDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  count: number;
  entityLabel: string;
  requireDeleteAll?: boolean;
  onConfirm: () => void | Promise<void>;
  confirming?: boolean;
};

export function DestructiveDeleteDialog({
  open,
  onOpenChange,
  title = "Permanently delete archived records?",
  description,
  count,
  entityLabel,
  requireDeleteAll = false,
  onConfirm,
  confirming = false,
}: DestructiveDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open) {
      setConfirmText("");
    }
  }, [open]);

  const canConfirm = requireDeleteAll
    ? confirmText.trim().toUpperCase() === "DELETE"
    : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ||
              `You are about to permanently delete ${count} archived ${entityLabel.toLowerCase()}. This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        {requireDeleteAll ? (
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Type <span className="font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
        ) : (
          <p className="text-sm text-destructive font-medium">
            This action is not reversible.
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canConfirm || confirming}
            onClick={() => void onConfirm()}
          >
            {confirming ? "Deleting..." : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
