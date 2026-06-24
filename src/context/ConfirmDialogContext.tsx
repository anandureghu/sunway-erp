import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ConfirmDialogOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
};

export type AlertDialogOptions = {
  title?: string;
  description: string;
  okLabel?: string;
};

type DialogMode = "confirm" | "alert";

type ActiveDialog = {
  mode: DialogMode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: "default" | "destructive";
};

type ConfirmDialogContextValue = {
  confirm: (options: ConfirmDialogOptions | string) => Promise<boolean>;
  alert: (options: AlertDialogOptions | string) => Promise<void>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(
  null,
);

function normalizeConfirmOptions(
  options: ConfirmDialogOptions | string,
): ConfirmDialogOptions {
  return typeof options === "string" ? { description: options } : options;
}

function normalizeAlertOptions(
  options: AlertDialogOptions | string,
): AlertDialogOptions {
  return typeof options === "string" ? { description: options } : options;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
  }, []);

  const confirm = useCallback((options: ConfirmDialogOptions | string) => {
    const opts = normalizeConfirmOptions(options);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setDialog({
        mode: "confirm",
        title: opts.title ?? "Confirm",
        description: opts.description,
        confirmLabel: opts.confirmLabel ?? "Continue",
        cancelLabel: opts.cancelLabel ?? "Cancel",
        variant: opts.variant ?? "default",
      });
    });
  }, []);

  const alert = useCallback((options: AlertDialogOptions | string) => {
    const opts = normalizeAlertOptions(options);
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve();
      setDialog({
        mode: "alert",
        title: opts.title ?? "Notice",
        description: opts.description,
        confirmLabel: opts.okLabel ?? "OK",
        cancelLabel: "Cancel",
        variant: "default",
      });
    });
  }, []);

  return (
    <ConfirmDialogContext.Provider value={{ confirm, alert }}>
      {children}
      <Dialog
        open={dialog != null}
        onOpenChange={(open) => {
          if (!open) {
            close(dialog?.mode === "alert");
          }
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog?.title}</DialogTitle>
            <DialogDescription>{dialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            {dialog?.mode === "confirm" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => close(false)}
              >
                {dialog.cancelLabel}
              </Button>
            )}
            <Button
              type="button"
              variant={
                dialog?.variant === "destructive" ? "destructive" : "default"
              }
              onClick={() => close(true)}
            >
              {dialog?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider");
  }
  return ctx;
}
