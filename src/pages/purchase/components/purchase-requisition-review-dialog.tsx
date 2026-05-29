import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export type ReviewActionType = "reject" | "send_back";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ReviewActionType;
  requisitionNo?: string;
  loading?: boolean;
  onConfirm: (comments: string) => void | Promise<void>;
};

const titles: Record<ReviewActionType, string> = {
  reject: "Reject requisition",
  send_back: "Send back to requester",
};

const descriptions: Record<ReviewActionType, string> = {
  reject:
    "The requester will be notified and can revise this requisition before submitting again.",
  send_back:
    "Return this requisition to the requester for changes. They can revise and resubmit.",
};

export function PurchaseRequisitionReviewDialog({
  open,
  onOpenChange,
  action,
  requisitionNo,
  loading = false,
  onConfirm,
}: Props) {
  const [comments, setComments] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setComments("");
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    const trimmed = comments.trim();
    if (!trimmed) return;
    await onConfirm(trimmed);
    setComments("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[action]}</DialogTitle>
          <DialogDescription>
            {requisitionNo ? `${requisitionNo} — ` : ""}
            {descriptions[action]}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="review-comments">Comments for requester</Label>
          <Textarea
            id="review-comments"
            placeholder="Explain what must be changed or why this was declined…"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-[120px]"
            required
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={action === "reject" ? "destructive" : "default"}
            disabled={loading || !comments.trim()}
            onClick={() => void handleConfirm()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === "reject" ? "Reject" : "Send back"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
