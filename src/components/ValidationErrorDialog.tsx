import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export type ValidationErrorDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  messages: string[];
  okLabel?: string;
  onClose: () => void;
};

export function ValidationErrorDialog({
  open,
  title = "Required fields missing",
  description = "Please complete the following before saving:",
  messages,
  okLabel = "OK",
  onClose,
}: ValidationErrorDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden border-red-200 p-0 sm:max-w-md"
        aria-describedby="validation-error-description"
      >
        <div className="border-b border-red-100 bg-red-50 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 ring-4 ring-red-50">
              <AlertCircle className="h-6 w-6 text-red-600" aria-hidden />
            </div>
            <div className="min-w-0 pt-0.5">
              <DialogTitle className="text-left text-lg font-semibold text-red-900">
                {title}
              </DialogTitle>
              <p
                id="validation-error-description"
                className="mt-1.5 text-sm text-red-800/80"
              >
                {description}
              </p>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <ul className="max-h-56 space-y-2 overflow-y-auto px-6 py-4">
            {messages.map((message) => (
              <li
                key={message}
                className="flex items-start gap-2.5 text-sm text-slate-700"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                  aria-hidden
                />
                <span>{message}</span>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            className="min-w-24 rounded-lg bg-orange-500 hover:bg-orange-600"
            onClick={onClose}
            autoFocus
          >
            {okLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
