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
import SelectDepartment from "@/components/select-department";

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
    amount: "",
    currencyCode: "USD",
    notes: "",
    startDate: "",
    endDate: "",
  });

  const update = (key: string, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (!line) {
      setForm({
        accountId: "",
        departmentId: "",
        projectId: "",
        amount: "",
        currencyCode: "USD",
        notes: "",
        startDate: "",
        endDate: "",
      });
    } else {
      setForm({
        accountId: String(line.accountId),
        departmentId: line.departmentId?.toString() || "",
        projectId: line.projectId?.toString() || "",
        amount: line.amount.toString(),
        currencyCode: line.currencyCode ?? "USD",
        notes: line.notes ?? "",
        startDate: line.startDate ?? "",
        endDate: line.endDate ?? "",
      });
    }
  }, [line]);

  const save = async () => {
    try {
      const newLine: BudgetLineDTO & { tempId?: string } = {
        tempId: line?.tempId ?? Math.random().toString(36),
        accountId: Number(form.accountId),
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        projectId: form.projectId ? form.projectId : null,
        amount: Number(form.amount),
        currencyCode: form.currencyCode,
        notes: form.notes,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      if (isEdit) {
        apiClient
          .put(`/finance/budgets/${budgetId}/lines/${line!.id}`, newLine)
          .then(() => {
            toast.success("Budget Distribution updated");
          });
      } else {
        apiClient
          .post(`/finance/budgets/${budgetId}/lines`, newLine)
          .then(() => {
            toast.success("Budget Distribution added");
          })
          .catch((error) => {
            console.error("Error adding budget line:", error);
            toast.error("Failed to add Budget Distribution", {
              description: error.response?.data?.message,
            });
          });
      }

      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to save Budget Distribution");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Budget Distribution" : "Add Budget Distribution"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Account</Label>

            <SelectAccount
              value={form.accountId}
              onChange={(v) => update("accountId", v)}
              useId
            />
          </div>

          <SelectDepartment
            value={form.departmentId?.toString()}
            onChange={(v) => update("departmentId", v)}
          />

          <div>
            <Label>Project ID</Label>
            <Input
              value={form.projectId}
              onChange={(e) => update("projectId", e.target.value)}
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
