"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import { ReconciliationForm } from "./recon-form";
import type { ReconciliationFormData } from "@/schema/finance/reconcilation";
import type { Reconciliation } from "@/types/finance/reconcilation";
import { X, CheckSquare } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reconciliation?: Reconciliation | null;
  onSuccess: (rec: Reconciliation, mode: "add" | "edit") => void;
}

export const ReconciliationDialog = ({
  open,
  onOpenChange,
  reconciliation,
  onSuccess,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!reconciliation;

  const handleSubmit = async (data: ReconciliationFormData) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        amount: Number(data.amount),
      };

      const res = isEdit
        ? await apiClient.put(
            `/finance/reconciliations/${reconciliation!.id}`,
            payload,
          )
        : await apiClient.post(`/finance/reconciliations`, payload);

      toast.success(
        isEdit ? "Reconciliation updated" : "Reconciliation created",
      );
      onSuccess(res.data, isEdit ? "edit" : "add");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to save reconciliation", {
        description: err?.response?.data?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultValues = reconciliation
    ? {
        accountId: reconciliation.accountId,
        amount: String(reconciliation.amount),
        resource: reconciliation.resource ?? "",
        reason: reconciliation.reason ?? "",
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 580, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-teal-100 text-teal-600">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEdit ? "Edit reconciliation" : "Create reconciliation"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEdit
                  ? "Update account reconciliation record"
                  : "Create a new reconciliation entry"}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body: embedded form without footer button ── */}
        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          <ReconciliationForm
            onSubmit={handleSubmit}
            loading={loading}
            defaultValues={defaultValues}
            hideSubmitButton
          />
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            Fill in all required fields before submitting
          </p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800 flex items-center"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                document
                  .querySelector<HTMLButtonElement>("#recon-form-submit-btn")
                  ?.click();
              }}
              disabled={loading}
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </span>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create reconciliation"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
