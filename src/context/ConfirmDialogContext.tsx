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
import {
  ValidationErrorDialog,
  type ValidationErrorDialogProps,
} from "@/components/ValidationErrorDialog";

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

export type ValidationErrorDialogOptions = {
  title?: string;
  description?: string;
  messages: string | string[];
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
  /**
   * Destructive cancel confirmation for records (orders, shipments, etc.).
   * Pass a short label such as `order PO-1000` or `this shipment`.
   */
  confirmCancel: (
    entityLabel: string,
    options?: Pick<ConfirmDialogOptions, "title" | "description">,
  ) => Promise<boolean>;
  alert: (options: AlertDialogOptions | string) => Promise<void>;
  validationError: (options: ValidationErrorDialogOptions) => Promise<void>;
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

function normalizeValidationErrorOptions(
  options: ValidationErrorDialogOptions,
): Omit<ValidationErrorDialogProps, "open" | "onClose"> {
  const messages = Array.isArray(options.messages)
    ? options.messages.filter(Boolean)
    : [options.messages].filter(Boolean);

  return {
    title: options.title,
    description: options.description,
    messages,
    okLabel: options.okLabel,
  };
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  const [validationDialog, setValidationDialog] = useState<Omit<
    ValidationErrorDialogProps,
    "open" | "onClose"
  > | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const validationResolveRef = useRef<(() => void) | null>(null);

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

  const confirmCancel = useCallback(
    (
      entityLabel: string,
      options?: Pick<ConfirmDialogOptions, "title" | "description">,
    ) =>
      confirm({
        title: options?.title ?? `Cancel ${entityLabel}?`,
        description:
          options?.description ??
          `Are you sure you want to cancel ${entityLabel}? This cannot be undone.`,
        confirmLabel: "Yes, cancel",
        cancelLabel: "Keep",
        variant: "destructive",
      }),
    [confirm],
  );

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

  const closeValidationError = useCallback(() => {
    validationResolveRef.current?.();
    validationResolveRef.current = null;
    setValidationDialog(null);
  }, []);

  const validationError = useCallback((options: ValidationErrorDialogOptions) => {
    return new Promise<void>((resolve) => {
      validationResolveRef.current = resolve;
      setValidationDialog(normalizeValidationErrorOptions(options));
    });
  }, []);

  return (
    <ConfirmDialogContext.Provider value={{ confirm, confirmCancel, validationError, alert }}>
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
      <ValidationErrorDialog
        open={validationDialog != null}
        title={validationDialog?.title}
        description={validationDialog?.description}
        messages={validationDialog?.messages ?? []}
        okLabel={validationDialog?.okLabel}
        onClose={closeValidationError}
      />
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
