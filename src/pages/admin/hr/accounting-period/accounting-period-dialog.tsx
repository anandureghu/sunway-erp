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
import type { AccountingPeriod } from "@/types/accounting-period";
import type { AccountingPeriodFormData } from "@/schema/accounting-period";
import { AccountingPeriodForm } from "./accounting-period-form";

interface AccountPeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountPeriod?: AccountingPeriod | null;
  onSuccess: (dept: AccountingPeriod, mode: "add" | "edit") => void;
}

export const AccountPeriodDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: AccountPeriodDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: AccountingPeriodFormData) => {
    try {
      setLoading(true);
      const res = await apiClient.post("/accounting-periods", data);
      toast.success("Accounting Period added successfully");
      onSuccess(res.data, "add");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save accountPeriod");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{"Add Accounting Period"}</DialogTitle>
          <DialogDescription>
            {"Enter Account Period details below."}
          </DialogDescription>
        </DialogHeader>

        <AccountingPeriodForm onSubmit={handleSubmit} loading={loading} />
      </DialogContent>
    </Dialog>
  );
};
