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
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import type {
  TransactionResponseDTO,
  CreateTransactionDTO,
} from "@/types/transactions";

export function TransactionDialog({
  open,
  onOpenChange,
  data,
  onSuccess,
  companyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: TransactionResponseDTO | null;
  companyId: number;
  onSuccess: (updated: TransactionResponseDTO, mode: "add" | "edit") => void;
}) {
  const [form, setForm] = useState<CreateTransactionDTO>({
    companyId,
    transactionType: "",
    fiscalType: "",
    transactionDate: "",
    amount: 0,
    debitAccount: "",
    creditAccount: "",
    itemCode: "",
    invoiceId: "",
    paymentId: "",
    transactionDescription: "",
  });

  const update = (key: keyof CreateTransactionDTO, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (data) {
      setForm({
        companyId,
        transactionType: data.transactionType ?? "",
        fiscalType: data.fiscalType ?? "",
        transactionDate: data.transactionDate,
        amount: data.amount,
        debitAccount: data.debitAccount ?? "",
        creditAccount: data.creditAccount ?? "",
        itemCode: data.itemCode ?? "",
        invoiceId: data.invoiceId ?? "",
        paymentId: data.paymentId ?? "",
        transactionDescription: data.transactionDescription ?? "",
      });
    }
  }, [data, companyId]);

  const handleSave = async () => {
    try {
      const res = data
        ? await apiClient.put(`/finance/transactions/${data.id}`, form)
        : await apiClient.post(`/finance/transactions`, form);

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
          <DialogTitle>
            {data ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Input
            placeholder="Transaction Type"
            value={form.transactionType}
            onChange={(e) => update("transactionType", e.target.value)}
          />

          <Input
            placeholder="Fiscal Type"
            value={form.fiscalType}
            onChange={(e) => update("fiscalType", e.target.value)}
          />

          <Input
            type="date"
            value={form.transactionDate}
            onChange={(e) => update("transactionDate", e.target.value)}
          />

          <Input
            placeholder="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => update("amount", Number(e.target.value))}
          />

          <Input
            placeholder="Debit Account"
            value={form.debitAccount}
            onChange={(e) => update("debitAccount", e.target.value)}
          />

          <Input
            placeholder="Credit Account"
            value={form.creditAccount}
            onChange={(e) => update("creditAccount", e.target.value)}
          />

          <Input
            placeholder="Invoice ID"
            value={form.invoiceId ?? ""}
            onChange={(e) => update("invoiceId", e.target.value)}
          />

          <Input
            placeholder="Payment ID"
            value={form.paymentId ?? ""}
            onChange={(e) => update("paymentId", e.target.value)}
          />

          <Input
            placeholder="Item Code"
            value={form.itemCode ?? ""}
            onChange={(e) => update("itemCode", e.target.value)}
          />

          <Input
            placeholder="Description"
            value={form.transactionDescription ?? ""}
            onChange={(e) => update("transactionDescription", e.target.value)}
          />
        </div>

        <Button className="w-full mt-2" onClick={handleSave}>
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
