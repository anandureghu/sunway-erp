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

import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import type { JournalLineDTO } from "@/types/journal";
import SelectAccount from "@/components/select-account";
// import SelectDepartment from "@/components/select-department";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  journalId: number;

  line: JournalLineDTO | null; // edit or add
  onSuccess: () => void;
}

export function JournalLineDialog({
  open,
  onOpenChange,
  journalId,
  line,
  onSuccess,
}: Props) {
  const isEdit = !!line;

  const [form, setForm] = useState({
    debitAccount: "",
    creditAccount: "",
    debitAmount: "",
    creditAmount: "",
    departmentId: "",
    projectId: "",
    currencyCode: "USD",
    exchangeRate: "1",
    description: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Load edit values
  useEffect(() => {
    if (line) {
      setForm({
        debitAccount: String(line.debitAccount),
        creditAccount: String(line.creditAccount),
        debitAmount: line.debitAmount?.toString() ?? "",
        creditAmount: line.creditAmount?.toString() ?? "",
        departmentId: line.departmentId?.toString() ?? "",
        projectId: line.projectId?.toString() ?? "",
        currencyCode: line.currencyCode ?? "USD",
        exchangeRate: line.exchangeRate?.toString() ?? "1",
        description: line.description ?? "",
      });
    } else {
      setForm({
        debitAccount: "",
        creditAccount: "",
        debitAmount: "",
        creditAmount: "",
        departmentId: "",
        projectId: "",
        currencyCode: "USD",
        exchangeRate: "1",
        description: "",
      });
    }
  }, [line]);

  const handleSave = async () => {
    try {
      const payload = {
        debitAccount: Number(form.debitAccount || 0),
        creditAccount: Number(form.creditAccount || 0),
        debitAmount: Number(form.debitAmount || 0),
        creditAmount: Number(form.creditAmount || 0),
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        projectId: form.projectId ? Number(form.projectId) : null,
        currencyCode: form.currencyCode,
        exchangeRate: Number(form.exchangeRate || 1),
        description: form.description,
      };

      console.log(payload);

      // if (payload.debitAmount > 0 && payload.creditAmount > 0) {
      //   toast.error("A line cannot have both debit and credit.");
      //   return;
      // }

      if (!payload.debitAccount && !payload.creditAccount) {
        toast.error("Both Account is required");
        return;
      }

      if (isEdit) {
        await apiClient.put(
          `/finance/journal-entries/${journalId}/lines/${line!.id}`,
          payload,
        );
        toast.success("Journal line updated");
      } else {
        await apiClient.post(
          `/finance/journal-entries/${journalId}/lines`,
          payload,
        );
        toast.success("Journal line added");
      }

      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to save journal line");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Journal Line" : "Add Journal Line"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Account */}
          {/* <div className="col-span-2">
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
          </div> */}
          <div>
            <SelectAccount
              label="Debit Account"
              value={form.debitAccount}
              onChange={(v) => update("debitAccount", v)}
              placeholder="Select Debit Account"
              useId
            />
          </div>
          <div>
            <SelectAccount
              label="Credit Account"
              value={form.creditAccount}
              onChange={(v) => update("creditAccount", v)}
              placeholder="Select Credit Account"
              useId
            />
          </div>

          {/* Debit */}
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={form.debitAmount}
              onChange={(e) => {
                // TODO: change backend and combine both
                update("debitAmount", e.target.value);
                update("creditAmount", e.target.value);
              }}
            />
          </div>

          {/* Credit
          <div>
            <Label>Credit Amount</Label>
            <Input
              type="number"
              value={form.creditAmount}
              onChange={(e) => update("creditAmount", e.target.value)}
            />
          </div> */}

          {/* Department */}
          {/* <div>
            <SelectDepartment
              value={form.departmentId}
              onChange={(v) => update("departmentId", v)}
            />
          </div> */}

          {/* Project */}
          <div>
            <Label>Project ID</Label>
            <Input
              value={form.projectId}
              onChange={(e) => update("projectId", e.target.value)}
            />
          </div>

          {/* Currency */}
          {/* <div>
            <Label>Currency Code</Label>
            <Input
              value={form.currencyCode}
              onChange={(e) => update("currencyCode", e.target.value)}
            />
          </div> */}

          {/* Exchange Rate */}
          {/* <div>
            <Label>Exchange Rate</Label>
            <Input
              type="number"
              value={form.exchangeRate}
              onChange={(e) => update("exchangeRate", e.target.value)}
            />
          </div> */}

          {/* Description */}
          <div className="col-span-2">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
        </div>

        <Button className="w-full mt-2" onClick={handleSave}>
          {isEdit ? "Update Line" : "Add Line"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
