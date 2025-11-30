"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { CreateGLBalanceDTO, GLAccountBalance } from "@/types/gl";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

export function GLBalanceDialog({
  open,
  onOpenChange,
  data,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: GLAccountBalance | null;
  onSuccess: (updated: GLAccountBalance, mode: "add" | "edit") => void;
}) {
  const [form, setForm] = useState<CreateGLBalanceDTO>({
    accountId: 0,
    fiscalYear: "",
    accountingPeriodStart: null,
    accountingPeriodEnd: null,
    totalAssets: 0,
    totalLiabilities: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    asOfDate: null,
  });

  const update = (key: keyof CreateGLBalanceDTO, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // When editing, load values
  useEffect(() => {
    if (data) {
      setForm({
        accountId: data.accountId,
        fiscalYear: data.fiscalYear,
        accountingPeriodStart: data.accountingPeriodStart,
        accountingPeriodEnd: data.accountingPeriodEnd,
        totalAssets: data.totalAssets,
        totalLiabilities: data.totalLiabilities,
        totalRevenue: data.totalRevenue,
        totalExpenses: data.totalExpenses,
        asOfDate: data.asOfDate || "",
      });
    }
  }, [data]);

  const handleSave = async () => {
    try {
      const res = data
        ? await apiClient.put(`/finance/gl/balance/${data.id}`, form)
        : await apiClient.post(`/finance/gl/balance`, form);

      onSuccess(res.data, data ? "edit" : "add");
      toast.success("Saved successfully");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data ? "Edit Balance" : "Add Balance"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Input
            placeholder="Account ID"
            value={form.accountId}
            onChange={(e) => update("accountId", Number(e.target.value))}
          />

          <Input
            placeholder="Fiscal Year"
            value={form.fiscalYear}
            onChange={(e) => update("fiscalYear", e.target.value)}
          />

          <Input
            type="date"
            placeholder="Period Start"
            value={form.accountingPeriodStart ?? ""}
            onChange={(e) => update("accountingPeriodStart", e.target.value)}
          />

          <Input
            type="date"
            placeholder="Period End"
            value={form.accountingPeriodEnd ?? ""}
            onChange={(e) => update("accountingPeriodEnd", e.target.value)}
          />

          <Input
            placeholder="Assets"
            type="number"
            value={form.totalAssets}
            onChange={(e) => update("totalAssets", Number(e.target.value))}
          />

          <Input
            placeholder="Liabilities"
            type="number"
            value={form.totalLiabilities}
            onChange={(e) => update("totalLiabilities", Number(e.target.value))}
          />

          <Input
            placeholder="Revenue"
            type="number"
            value={form.totalRevenue}
            onChange={(e) => update("totalRevenue", Number(e.target.value))}
          />

          <Input
            placeholder="Expenses"
            type="number"
            value={form.totalExpenses}
            onChange={(e) => update("totalExpenses", Number(e.target.value))}
          />

          <Input
            type="date"
            placeholder="As of Date"
            value={form.asOfDate ?? ""}
            onChange={(e) => update("asOfDate", e.target.value)}
          />
        </div>

        <Button className="w-full mt-2" onClick={handleSave}>
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
