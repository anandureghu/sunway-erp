"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { CreatePaymentDTO, PaymentResponseDTO } from "@/types/payment";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { toISO } from "@/lib/utils";

export function PaymentDialog({
  open,
  onOpenChange,
  data,
  companyId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PaymentResponseDTO | null;
  companyId: number;
  onSuccess: (updated: PaymentResponseDTO, mode: "add" | "edit") => void;
}) {
  const [form, setForm] = useState<CreatePaymentDTO>({
    companyId,
    amount: 0,
    paymentMethod: "",
    effectiveDate: "",
    notes: "",
    invoiceId: "",
  });

  const update = (key: keyof CreatePaymentDTO, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (data) {
      setForm({
        companyId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        effectiveDate: toISO(data.effectiveDate),
        notes: "",
        invoiceId: data.invoiceId ?? "",
      });
    }
  }, [data, companyId]);

  const handleSave = async () => {
    try {
      const res = data
        ? await apiClient.put(`/finance/payments/${data.id}`, form)
        : await apiClient.post(`/finance/payments`, form);

      onSuccess(res.data, data ? "edit" : "add");
      toast.success("Payment saved");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save payment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {data ? "Edit Payment" : "Add Customer Payment"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Input
            placeholder="Amount"
            type="number"
            value={form.amount}
            onChange={(e) => update("amount", Number(e.target.value))}
          />

          <Input
            placeholder="Payment Method (BANK_TRANSFER, CASH)"
            value={form.paymentMethod}
            onChange={(e) => update("paymentMethod", e.target.value)}
          />

          <Input
            type="date"
            value={form.effectiveDate}
            onChange={(e) => update("effectiveDate", e.target.value)}
          />

          <Input
            placeholder="Invoice ID (optional)"
            value={form.invoiceId ?? ""}
            onChange={(e) => update("invoiceId", e.target.value)}
          />

          <Input
            placeholder="Notes"
            value={form.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>

        <Button className="w-full mt-2" onClick={handleSave}>
          Save Payment
        </Button>
      </DialogContent>
    </Dialog>
  );
}
