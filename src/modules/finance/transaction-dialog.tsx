"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import type {
  TransactionResponseDTO,
  CreateTransactionDTO,
} from "@/types/transactions";
import { fetchCOAAccounts } from "@/service/coaService";
// import { FormControl } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChartOfAccounts } from "@/types/coa";

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
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState<CreateTransactionDTO>({
    companyId,
    transactionType: "",
    // fiscalType: "",
    transactionDate: "",
    amount: 0,
    // debitAccount: "",
    creditAccount: "",
    // itemCode: "",
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
        // fiscalType: data.fiscalType ?? "",
        transactionDate: data.transactionDate,
        amount: data.amount,
        // debitAccount: data.debitAccount ?? "",
        creditAccount: data.creditAccount ?? "",
        // itemCode: data.itemCode ?? "",
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

  useEffect(() => {
    fetchCOAAccounts(companyId.toString()).then((data) => {
      if (data) setAccounts(data);
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {data ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1">
            <Label>Transaction Type</Label>
            <Input
              value={form.transactionType}
              onChange={(e) => update("transactionType", e.target.value)}
            />
          </div>

          {/* <div className="space-y-1">
            <Label>Fiscal Type</Label>
            <Input
              value={form.fiscalType}
              onChange={(e) => update("fiscalType", e.target.value)}
            />
          </div> */}

          <div className="space-y-1">
            <Label>Transaction Date</Label>
            <Input
              type="date"
              value={form.transactionDate}
              onChange={(e) => update("transactionDate", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Amount</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => update("amount", Number(e.target.value))}
            />
          </div>

          {/* <div className="space-y-1">
            <Label>Debit Account</Label>
            <Input
              value={form.debitAccount}
              onChange={(e) => update("debitAccount", e.target.value)}
            />
          </div> */}

          {/* <div className="space-y-1">
            <Label>Credit Account</Label>
            <Input
              value={form.creditAccount}
              onChange={(e) => update("creditAccount", e.target.value)}
            />
          </div> */}

          <div className="space-y-1">
            <Label>Credit Account</Label>
            <Select
              onValueChange={(val) => update("creditAccount", val)}
              value={form.creditAccount}
            >
              {/* <FormControl> */}
              <SelectTrigger>
                <SelectValue placeholder={"Select Credit Account"} />
              </SelectTrigger>
              {/* </FormControl> */}

              <SelectContent>
                {accounts.map((d: ChartOfAccounts) => (
                  <SelectItem key={d.id} value={String(d.accountCode)}>
                    <div>
                      <h2 className="font-semibold">{d.accountName}</h2>
                      <h4 className="font-sm text-gray-500">{d.accountCode}</h4>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Invoice ID</Label>
            <Input
              value={form.invoiceId ?? ""}
              onChange={(e) => update("invoiceId", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label>Payment ID</Label>
            <Input
              value={form.paymentId ?? ""}
              onChange={(e) => update("paymentId", e.target.value)}
            />
          </div>

          {/* <div className="space-y-1">
            <Label>Item Code</Label>
            <Input
              value={form.itemCode ?? ""}
              onChange={(e) => update("itemCode", e.target.value)}
            />
          </div> */}

          <div className="col-span-2 space-y-1">
            <Label>Description</Label>
            <Input
              value={form.transactionDescription ?? ""}
              onChange={(e) => update("transactionDescription", e.target.value)}
            />
          </div>
        </div>

        <Button className="w-full mt-2" onClick={handleSave}>
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
