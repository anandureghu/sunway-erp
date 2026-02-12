import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import type { BankAccount } from "@/types/bank-account";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: number;
  bankAccount?: BankAccount;
  onSuccess: () => void;
}

export function BankAccountDialog({
  open,
  onOpenChange,
  companyId,
  bankAccount,
  onSuccess,
}: Props) {
  const [form, setForm] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    accountHolderName: "",
    primaryAccount: false,
  });

  useEffect(() => {
    if (bankAccount && open) {
      setForm({
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        ifscCode: bankAccount.ifscCode || "",
        branchName: bankAccount.branchName || "",
        accountHolderName: bankAccount.accountHolderName,
        primaryAccount: bankAccount.primaryAccount,
      });
    }

    if (!open) {
      resetForm();
    }
  }, [bankAccount, open]);

  const resetForm = () => {
    setForm({
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branchName: "",
      accountHolderName: "",
      primaryAccount: false,
    });
  };

  const handleSubmit = async () => {
    try {
      if (bankAccount) {
        await apiClient.put(`/bank-accounts/${bankAccount.id}`, {
          ...form,
          companyId,
        });
        toast.success("Bank account updated");
      } else {
        await apiClient.post("/bank-accounts", {
          ...form,
          companyId,
        });
        toast.success("Bank account added");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save bank account");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {bankAccount ? "Edit Bank Account" : "Add Bank Account"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Label>Bank Name</Label>
          <Input
            placeholder="Bank Name"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          />

          <Label>Account Number</Label>
          <Input
            placeholder="Account Number"
            value={form.accountNumber}
            onChange={(e) =>
              setForm({ ...form, accountNumber: e.target.value })
            }
          />

          <Label>IFSC Code</Label>
          <Input
            placeholder="IFSC Code"
            value={form.ifscCode}
            onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
          />

          <Label>Branch Name</Label>
          <Input
            placeholder="Branch Name"
            value={form.branchName}
            onChange={(e) => setForm({ ...form, branchName: e.target.value })}
          />

          <Label>Account Holder Name</Label>
          <Input
            placeholder="Account Holder Name"
            value={form.accountHolderName}
            onChange={(e) =>
              setForm({ ...form, accountHolderName: e.target.value })
            }
          />

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="primaryAccount"
              checked={form.primaryAccount}
              onCheckedChange={(checked) =>
                setForm({ ...form, primaryAccount: Boolean(checked) })
              }
            />
            <Label htmlFor="primaryAccount">Set as primary account</Label>
          </div>

          <Button className="w-full" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
