import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Edit, Trash, Star, Plus, Landmark } from "lucide-react";
import { BankAccountDialog } from "./bank-account-dialog";
import type { BankAccount } from "@/types/bank-account";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { Banknote } from "lucide-react";

function LabeledField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
      <span className={`text-xs text-muted-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export function CompanyBankAccounts({
  financeSettings,
}: {
  financeSettings?: boolean;
}) {
  const { user } = useAuth();
  const companyId = user?.companyId;
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);

  const fetchAccounts = async () => {
    try {
      const res = await apiClient.get(`/bank-accounts/company/${companyId}`);
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load bank accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/bank-accounts/${id}`);
      toast.success("Bank account deleted");
      fetchAccounts();
    } catch (err) {
      toast.error("Failed to delete bank account");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [companyId]);

  return (
    <div className={financeSettings ? "space-y-6" : "p-6"}>
      {financeSettings ? (
        <SecondaryPageHeader
          title="Bank Accounts"
          description="Manage your bank accounts"
          icon={<Banknote className="h-5 w-5" />}
          actions={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          }
        />
      ) : (
        <PageHeader
          title="Bank Accounts"
          description="Manage your bank accounts"
          variant="darkBlue"
          icon={<Banknote className="w-6 h-6" />}
          actions={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          }
        />
      )}
      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Landmark className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No bank accounts added yet.</p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add your first account
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="group relative flex items-start justify-between rounded-2xl border border-border/60 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Landmark className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{acc.bankName}</span>
                    {acc.primaryAccount && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 border border-amber-200">
                        <Star className="h-2.5 w-2.5" /> Primary
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <LabeledField label="Account Holder" value={acc.accountHolderName} />
                    <LabeledField label="Account No." value={acc.accountNumber} mono />
                    {acc.iban && <LabeledField label="IBAN" value={acc.iban} mono />}
                    {acc.ifscCode && <LabeledField label="IFSC Code" value={acc.ifscCode} mono />}
                    {acc.branchName && <LabeledField label="Branch" value={acc.branchName} />}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setEditAccount(acc)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(acc.id)}
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BankAccountDialog
        open={open}
        onOpenChange={setOpen}
        companyId={Number(companyId)}
        onSuccess={fetchAccounts}
      />

      {editAccount && (
        <BankAccountDialog
          open={!!editAccount}
          onOpenChange={() => setEditAccount(null)}
          companyId={Number(companyId)}
          bankAccount={editAccount}
          onSuccess={fetchAccounts}
        />
      )}
    </div>
  );
}
