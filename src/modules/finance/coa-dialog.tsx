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
import { COA, type ChartOfAccounts, type CreateAccountDTO } from "@/types/coa";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SelectAccount from "@/components/select-account";

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
    type: "ASSET",
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
        parentId: Number(account.parentId),
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Account Code</label>
            <Input
              value={form.accountCode}
              onChange={(e) => update("accountCode", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Account Name</label>
            <Input
              value={form.accountName}
              onChange={(e) => update("accountName", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Type</label>

            <Select
              onValueChange={(val) => update("type", val)}
              value={form.type}
              defaultValue="ADMIN"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select COA Type" />
              </SelectTrigger>
              <SelectContent>
                {COA.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <SelectAccount
              value={form.parentId?.toString() || undefined}
              onChange={(v) => update("parentId", v)}
              label="Parent Account"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Currency</label>
            <Input
              value={form.currency ?? ""}
              onChange={(e) => update("currency", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Status</label>
            <Input
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">GL Class Type Key</label>
            <Input
              value={form.glAccountClassTypeKey ?? ""}
              onChange={(e) => update("glAccountClassTypeKey", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">GL Account Type</label>
            <Input
              value={form.glAccountType ?? ""}
              onChange={(e) => update("glAccountType", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-sm font-medium">Opening Balance</label>
            <Input
              type="number"
              value={form.openingBalance ?? ""}
              onChange={(e) => update("openingBalance", Number(e.target.value))}
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
