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

import { useState, useEffect } from "react";
import type { BudgetLineDTO } from "@/types/budget";
import SelectAccount from "@/components/select-account";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: BudgetLineDTO | null;
  onSuccess: () => void;
  budgetId: number;
}

export function BudgetLineDialog({
  open,
  onOpenChange,
  budgetId,
  line,
  onSuccess,
}: Props) {
  const isEdit = !!line;

  const [form, setForm] = useState({
    accountId: "",
    departmentId: "",
    projectId: "",
    period: "",
    amount: "",
    currencyCode: "USD",
    notes: "",
  });

  const update = (key: string, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (!line) {
      setForm({
        accountId: "",
        departmentId: "",
        projectId: "",
        period: "",
        amount: "",
        currencyCode: "USD",
        notes: "",
      });
    } else {
      setForm({
        accountId: String(line.accountId),
        departmentId: line.departmentId?.toString() || "",
        projectId: line.projectId?.toString() || "",
        period: line.period.toString(),
        amount: line.amount.toString(),
        currencyCode: line.currencyCode ?? "USD",
        notes: line.notes ?? "",
      });
    }
  }, [line]);

  const save = async () => {
    try {
      const newLine: BudgetLineDTO & { tempId?: string } = {
        tempId: line?.tempId ?? Math.random().toString(36),
        accountId: Number(form.accountId),
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        projectId: form.projectId ? Number(form.projectId) : null,
        period: Number(form.period),
        amount: Number(form.amount),
        currencyCode: form.currencyCode,
        notes: form.notes,
      };

      if (isEdit) {
        await apiClient.put(
          `/finance/budgets/${budgetId}/lines/${line!.id}`,
          newLine
        );
        toast.success("Budget line updated");
      } else {
        await apiClient.post(`/finance/budgets/${budgetId}/lines`, newLine);
        toast.success("Budget Line added");
      }

      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to save Budget line");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Budget Line" : "Add Budget Line"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Account</Label>
            <Select
              value={form.accountId}
              onValueChange={(v) => update("accountId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>

              <SelectAccount useId />
            </Select>
          </div>

          <div>
            <Label>Department ID</Label>
            <Input
              value={form.departmentId}
              onChange={(e) => update("departmentId", e.target.value)}
            />
          </div>

          <div>
            <Label>Project ID</Label>
            <Input
              value={form.projectId}
              onChange={(e) => update("projectId", e.target.value)}
            />
          </div>

          <div>
            <Label>Period (1–12)</Label>
            <Input
              type="number"
              value={form.period}
              onChange={(e) => update("period", e.target.value)}
            />
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          <Button className="w-full mt-2" onClick={save}>
            {isEdit ? "Update Line" : "Add Line"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
