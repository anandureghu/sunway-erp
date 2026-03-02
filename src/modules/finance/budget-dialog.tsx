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

// TODO: change backend
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
  onSuccess: (updated: BudgetResponseDTO, mode: "add" | "edit") => void;
}) {
  const isEdit = !!data;

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

      const res = data
        ? await apiClient.put(`/finance/budgets/${data.id}`, payload)
        : await apiClient.post("/finance/budgets", payload);

      toast.success("Budget created");
      onOpenChange(false);
      onSuccess(res.data, data ? "edit" : "add");
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
              {isEdit ? "Edit Budget" : "Create Budget"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Budget Name */}
            <div>
              <Label>Budget Name</Label>
              <Input
                value={form.budgetName}
                onChange={(e) => update("budgetName", e.target.value)}
              />
            </div>

            {/* Budget Year */}
            <div>
              <Label>Fiscal Year</Label>
              <Input
                value={form.fiscalYear || undefined}
                onChange={(e) => update("fiscalYear", e.target.value)}
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
              />
            </div>

            {/* End Date */}
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
              />
            </div>

            <Button className="w-full mt-6" onClick={saveBudget}>
              {isEdit ? "Update Budget" : "Create Budget"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
