// src/pages/admin/departments/DepartmentDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import type { ChartOfAccounts } from "@/types/finance/chart-of-accounts";
import type { COAFormData } from "@/schema/finance/chart-of-account";
import { ChartOfAccountsForm } from "@/modules/finance/chart-of-accounts/coa-form";
import { CoaCreateConfirmView } from "@/modules/finance/chart-of-accounts/coa-create-confirm-view";
import { X, Layers } from "lucide-react";

interface ChartOfAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coa?: ChartOfAccounts | null;
  onSuccess: (dept: ChartOfAccounts, mode: "add" | "edit") => void;
}

type CreateStep = "form" | "confirm";

export const ChartOfAccountsDialog = ({
  open,
  onOpenChange,
  coa,
  onSuccess,
}: ChartOfAccountsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<CreateStep>("form");
  const [pendingCreate, setPendingCreate] = useState<COAFormData | null>(null);
  const isEdit = !!coa;

  useEffect(() => {
    if (!open) {
      setStep("form");
      setPendingCreate(null);
    }
  }, [open]);

  const persistAccount = async (data: COAFormData) => {
    setLoading(true);
    try {
      const res = isEdit
        ? await apiClient.put(`/finance/chart-of-accounts/${coa!.id}`, data)
        : await apiClient.post("/finance/chart-of-accounts", data);
      toast.success(
        isEdit
          ? "Chart Of Account updated successfully"
          : "Chart Of Account added successfully",
      );
      onSuccess(res.data, isEdit ? "edit" : "add");
      onOpenChange(false);
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { message?: string } } };
      toast.error("Failed to save chart of account", {
        description: ax?.response?.data?.message,
      });
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: COAFormData) => {
    if (isEdit) {
      await persistAccount(data);
      return;
    }
    setPendingCreate(data);
    setStep("confirm");
  };

  const handleConfirmCreate = async () => {
    if (!pendingCreate) return;
    await persistAccount(pendingCreate);
  };

  const handleBackToForm = () => {
    setStep("form");
  };

  const title = isEdit
    ? "Edit Chart Of Account"
    : step === "confirm"
      ? "Confirm new GL account"
      : "Add Chart Of Account";

  const subtitle = isEdit
    ? "Update chart of account details below"
    : step === "confirm"
      ? "Verify details — accounts cannot be changed after creation"
      : "Enter chart of account details below";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 680, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-teal-100 text-teal-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {title}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          <div className={!isEdit && step === "confirm" ? "hidden" : undefined}>
            <ChartOfAccountsForm
              key={coa?.id ?? "new"}
              onSubmit={handleSubmit}
              loading={loading && isEdit}
              defaultValues={coa as COAFormData | null}
              submitLabel={isEdit ? undefined : "Review & continue"}
            />
          </div>
          {!isEdit && step === "confirm" && pendingCreate ? (
            <CoaCreateConfirmView
              data={pendingCreate}
              onBack={handleBackToForm}
              onConfirm={handleConfirmCreate}
              loading={loading}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
