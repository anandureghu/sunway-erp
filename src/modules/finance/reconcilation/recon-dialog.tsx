// src/modules/finance/reconciliation/recon-dialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import { ReconciliationForm } from "./recon-form";
import type { ReconciliationFormData } from "@/schema/finance/reconcilation";
import type { Reconciliation } from "@/types/finance/reconcilation";

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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Reconciliation" : "Create Reconciliation"}
          </DialogTitle>
        </DialogHeader>

        <ReconciliationForm
          onSubmit={handleSubmit}
          loading={loading}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
};
