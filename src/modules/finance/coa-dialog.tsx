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
import type { ChartOfAccounts, CreateAccountDTO } from "@/types/coa";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: ChartOfAccounts | null;
  onSuccess: (updated: ChartOfAccounts, mode: "add" | "edit") => void;
  companyId: number;
}

export function ChartOfAccountDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
  companyId,
}: Props) {
  const [form, setForm] = useState<CreateAccountDTO>({
    companyId,
    accountCode: "",
    accountName: "",
    description: "",
    type: "asset",
    parentId: null,
    currency: "INR",
    status: "active",
    glAccountClassTypeKey: "",
    glAccountType: "",
    openingBalance: 0,
  });

  /** load form when editing */
  useEffect(() => {
    if (account) {
      setForm({
        companyId,
        accountCode: account.accountCode,
        accountName: account.accountName,
        description: account.description ?? "",
        type: account.type,
        parentId: account.parentId ?? null,
        currency: account.currency ?? "",
        status: account.status,
        glAccountClassTypeKey: account.glAccountClassTypeKey ?? "",
        glAccountType: account.glAccountType ?? "",
        openingBalance: Number(account.balance),
      });
    }
  }, [account, companyId]);

  const update = (key: keyof CreateAccountDTO, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    try {
      const res = account
        ? await apiClient.put(`/finance/chart-of-accounts/${account.id}`, form)
        : await apiClient.post(`/finance/chart-of-accounts`, form);

      onSuccess(res.data, account ? "edit" : "add");
      toast.success("Saved successfully");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save account");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Add Account"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <Input
            placeholder="Account Code"
            value={form.accountCode}
            onChange={(e) => update("accountCode", e.target.value)}
          />

          <Input
            placeholder="Account Name"
            value={form.accountName}
            onChange={(e) => update("accountName", e.target.value)}
          />

          <Input
            placeholder="Description"
            value={form.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
          />

          <Input
            placeholder="Type (asset/liability/etc)"
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
          />

          <Input
            placeholder="Parent ID"
            value={form.parentId ?? ""}
            onChange={(e) => update("parentId", Number(e.target.value))}
          />

          <Input
            placeholder="Currency"
            value={form.currency ?? ""}
            onChange={(e) => update("currency", e.target.value)}
          />

          <Input
            placeholder="Status (active/inactive)"
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          />

          <Input
            placeholder="GL Class Type Key"
            value={form.glAccountClassTypeKey ?? ""}
            onChange={(e) => update("glAccountClassTypeKey", e.target.value)}
          />

          <Input
            placeholder="GL Account Type"
            value={form.glAccountType ?? ""}
            onChange={(e) => update("glAccountType", e.target.value)}
          />

          <Input
            placeholder="Opening Balance"
            type="number"
            value={form.openingBalance ?? ""}
            onChange={(e) => update("openingBalance", Number(e.target.value))}
          />
        </div>

        <Button className="w-full mt-2" onClick={handleSave}>
          Save
        </Button>
      </DialogContent>
    </Dialog>
  );
}
