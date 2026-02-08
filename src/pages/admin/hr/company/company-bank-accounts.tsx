import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Edit, Trash, Plus, Star } from "lucide-react";
import { BankAccountDialog } from "./bank-account-dialog";
import type { BankAccount } from "@/types/bank-account";

interface Props {
  companyId: number;
}

export function CompanyBankAccounts({ companyId }: Props) {
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Bank Accounts</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bank accounts added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between border rounded-md p-3 text-sm"
              >
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {acc.bankName}
                    {acc.primaryAccount && (
                      <Star className="h-4 w-4 text-yellow-500" />
                    )}
                  </p>
                  <p>{acc.accountHolderName}</p>
                  <p className="text-muted-foreground">{acc.accountNumber}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditAccount(acc)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(acc.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialogs */}
      <BankAccountDialog
        open={open}
        onOpenChange={setOpen}
        companyId={companyId}
        onSuccess={fetchAccounts}
      />

      {editAccount && (
        <BankAccountDialog
          open={!!editAccount}
          onOpenChange={() => setEditAccount(null)}
          companyId={companyId}
          bankAccount={editAccount}
          onSuccess={fetchAccounts}
        />
      )}
    </Card>
  );
}
