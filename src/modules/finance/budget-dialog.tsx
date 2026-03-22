"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { BudgetCreateDTO, BudgetResponseDTO } from "@/types/budget";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

export function BudgetDialog({
  open,
  onOpenChange,
  data,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: BudgetResponseDTO | null;
  companyId: number;
  onSuccess?: () => void;
}) {
  const isEdit = !!data;
  /** Approved budgets only revise amount; other statuses save a full new copy. */
  const lockHeaderFields = isEdit && data?.status === "APPROVED";

  const [form, setForm] = useState<BudgetCreateDTO>({
    budgetName: "",
    fiscalYear: "",
    startDate: "",
    endDate: "",
    amount: 0,
  });

  const update = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (data) {
      setForm({
        budgetName: data.budgetName,
        fiscalYear: data.fiscalYear,
        startDate: data.startDate ?? "",
        endDate: data.endDate ?? "",
        amount: data.amount ?? 0,
      });
    } else {
      setForm({
        budgetName: "",
        fiscalYear: "",
        startDate: "",
        endDate: "",
        amount: 0,
      });
    }
  }, [data, open]);

  const saveBudget = async () => {
    try {
      const payload = {
        budgetName: form.budgetName,
        fiscalYear: form.fiscalYear,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        amount: form.amount || 0,
      };

      if (data) {
        await apiClient.put(`/finance/budgets/${data.id}`, payload);
      } else {
        await apiClient.post("/finance/budgets", payload);
      }

      if (data) {
        if (data.status === "APPROVED") {
          toast.success("Budget revised");
        } else {
          toast.success("Saved as a new budget version");
        }
      } else {
        toast.success("Budget created");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error("Failed to save budget", {
        description: err.response.data.message,
      });
      console.error(err);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isEdit
                ? data?.status === "APPROVED"
                  ? "Revise Budget"
                  : "Edit Budget (saves new version)"
                : "Create Budget"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Budget Name */}
            <div>
              <Label>Budget Name</Label>
              <Input
                value={form.budgetName}
                onChange={(e) => update("budgetName", e.target.value)}
                disabled={lockHeaderFields}
              />
            </div>

            {/* Budget Year */}
            <div>
              <Label>Fiscal Year</Label>
              <Input
                value={form.fiscalYear || undefined}
                onChange={(e) => update("fiscalYear", e.target.value)}
                disabled={lockHeaderFields}
              />
            </div>

            {/* Amount */}
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={form.amount || 0}
                onChange={(e) => update("amount", e.target.value)}
              />
            </div>

            {/* Start Date */}
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                disabled={lockHeaderFields}
              />
            </div>

            {/* End Date */}
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                disabled={lockHeaderFields}
              />
            </div>

            <Button className="w-full mt-6" onClick={saveBudget}>
              {isEdit
                ? data?.status === "APPROVED"
                  ? "Revise Budget"
                  : "Save new version"
                : "Create Budget"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
