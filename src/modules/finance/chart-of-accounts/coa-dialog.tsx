// src/pages/admin/departments/DepartmentDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import type { ChartOfAccounts } from "@/types/finance/chart-of-accounts";
import type { COAFormData } from "@/schema/finance/chart-of-account";
import { ChartOfAccountsForm } from "@/modules/finance/chart-of-accounts/coa-form";

interface ChartOfAccountsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coa?: ChartOfAccounts | null;
  onSuccess: (dept: ChartOfAccounts, mode: "add" | "edit") => void;
}

export const ChartOfAccountsDialog = ({
  open,
  onOpenChange,
  coa,
  onSuccess,
}: ChartOfAccountsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!coa;

  const handleSubmit = async (data: COAFormData) => {
    try {
      setLoading(true);
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
    } catch (error: any) {
      toast.error("Failed to save coa", {
        description: error.response.data.message,
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Chart Of Account" : "Add Chart Of Account"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update chart of account details below."
              : "Enter chart of account details below."}
          </DialogDescription>
        </DialogHeader>

        <ChartOfAccountsForm
          onSubmit={handleSubmit}
          loading={loading}
          defaultValues={coa as COAFormData | null}
        />
      </DialogContent>
    </Dialog>
  );
};
