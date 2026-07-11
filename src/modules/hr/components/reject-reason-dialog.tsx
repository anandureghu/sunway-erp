import { useEffect, useState } from "react";
import { X, Loader2, Ban } from "lucide-react";

type Props = {
  open: boolean;
  /** What is being rejected, e.g. "leave for John Doe" or loan code. */
  subject?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (comment: string) => void;
};

/**
 * Small modal asking the approver why they're rejecting a leave / loan. The
 * reason is optional but encouraged — it is shown to the employee in their
 * leave / loan history so they understand the decision.
 */
export function RejectReasonDialog({
  open,
  subject,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  const [comment, setComment] = useState("");

  // Reset the field each time the dialog is (re)opened.
  useEffect(() => {
    if (open) setComment("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50">
              <Ban className="h-4 w-4 text-rose-600" />
            </span>
            <h3 className="text-base font-bold text-slate-800">
              Reject request
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          {subject && (
            <p className="text-sm text-slate-500">
              You are rejecting{" "}
              <span className="font-semibold text-slate-700">{subject}</span>.
            </p>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Reason for rejection{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              autoFocus
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Explain why this request is being declined…"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-300/20"
            />
            <p className="text-[11px] text-slate-400">
              Shown to the employee in their history.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(comment.trim())}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Reject request
          </button>
        </div>
      </div>
    </div>
  );
}
