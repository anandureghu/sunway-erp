import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SelectAccount from "@/components/select-account";
import { apiClient } from "@/service/apiClient";
import { useAuth } from "@/context/AuthContext";
import type { Company } from "@/types/company";
import type { BankAccount } from "@/types/bank-account";
import type {
  AccountingProcessCode,
  ProcessAccountDefault,
} from "@/types/process-account-default";
import {
  ACCOUNTING_PROCESS_LABELS,
  ALL_ACCOUNTING_PROCESS_CODES,
} from "@/lib/accounting-defaults";
import { toast } from "sonner";
import { Banknote } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const SCHEMA = z.object({
  defaultSalesDebitAccountId: z.string().optional(),
  defaultSalesCreditAccountId: z.string().optional(),
  defaultPurchaseDebitAccountId: z.string().optional(),
  defaultPurchaseCreditAccountId: z.string().optional(),
  defaultBankAccountId: z.string().optional(),
});

type FormData = z.infer<typeof SCHEMA>;

type ProcessAccountFields = {
  debitAccountId: string;
  creditAccountId: string;
};

type ProcessAccountsState = Record<AccountingProcessCode, ProcessAccountFields>;

function emptyProcessAccounts(): ProcessAccountsState {
  return ALL_ACCOUNTING_PROCESS_CODES.reduce((acc, code) => {
    acc[code] = { debitAccountId: "", creditAccountId: "" };
    return acc;
  }, {} as ProcessAccountsState);
}

function toStr(x: number | string | null | undefined) {
  return x != null && x !== "" ? String(x) : "";
}

function optNum(s?: string) {
  return s != null && String(s).trim() !== "" ? Number(s) : undefined;
}

export default function DefaultAccountsSettingsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId ? Number(user.companyId) : 0;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processAccounts, setProcessAccounts] =
    useState<ProcessAccountsState>(emptyProcessAccounts);

  const form = useForm<FormData>({
    resolver: zodResolver(SCHEMA),
    defaultValues: {
      defaultSalesDebitAccountId: "",
      defaultSalesCreditAccountId: "",
      defaultPurchaseDebitAccountId: "",
      defaultPurchaseCreditAccountId: "",
      defaultBankAccountId: "",
    },
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [coRes, bankRes, processRes] = await Promise.all([
          apiClient.get<Company>(`/companies/${companyId}`),
          apiClient.get<BankAccount[]>(`/bank-accounts/company/${companyId}`),
          apiClient.get<ProcessAccountDefault[]>(
            `/companies/${companyId}/process-account-defaults`,
          ),
        ]);
        if (cancelled) return;
        const co = coRes.data;
        setBankAccounts(bankRes.data || []);
        form.reset({
          defaultSalesDebitAccountId: toStr(co?.defaultSalesDebitAccountId),
          defaultSalesCreditAccountId: toStr(co?.defaultSalesCreditAccountId),
          defaultPurchaseDebitAccountId: toStr(
            co?.defaultPurchaseDebitAccountId,
          ),
          defaultPurchaseCreditAccountId: toStr(
            co?.defaultPurchaseCreditAccountId,
          ),
          defaultBankAccountId: toStr(co?.defaultBankAccountId),
        });

        const next = emptyProcessAccounts();
        for (const row of processRes.data || []) {
          if (!row.processCode) continue;
          next[row.processCode] = {
            debitAccountId: toStr(row.debitAccountId),
            creditAccountId: toStr(row.creditAccountId),
          };
        }
        setProcessAccounts(next);
      } catch (e: unknown) {
        if (!cancelled) {
          console.error(e);
          toast.error("Failed to load default accounts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, form]);

  const updateProcessAccount = (
    code: AccountingProcessCode,
    patch: Partial<ProcessAccountFields>,
  ) => {
    setProcessAccounts((prev) => ({
      ...prev,
      [code]: { ...prev[code], ...patch },
    }));
  };

  const onSubmit = async (data: FormData) => {
    if (!companyId) return;

    const incompleteProcess = ALL_ACCOUNTING_PROCESS_CODES.find((code) => {
      const { debitAccountId, creditAccountId } = processAccounts[code];
      return (
        (debitAccountId && !creditAccountId) ||
        (!debitAccountId && creditAccountId)
      );
    });
    if (incompleteProcess) {
      toast.error(
        `${ACCOUNTING_PROCESS_LABELS[incompleteProcess]} needs both debit and credit accounts`,
      );
      return;
    }

    const processPayload = ALL_ACCOUNTING_PROCESS_CODES.filter((code) => {
      const { debitAccountId, creditAccountId } = processAccounts[code];
      return debitAccountId && creditAccountId;
    }).map((code) => ({
      processCode: code,
      debitAccountId: optNum(processAccounts[code].debitAccountId),
      creditAccountId: optNum(processAccounts[code].creditAccountId),
    }));

    try {
      setSaving(true);
      await Promise.all([
        apiClient.put(`/companies/${companyId}/accounting-defaults`, {
          defaultSalesDebitAccountId: optNum(data.defaultSalesDebitAccountId),
          defaultSalesCreditAccountId: optNum(data.defaultSalesCreditAccountId),
          defaultPurchaseDebitAccountId: optNum(
            data.defaultPurchaseDebitAccountId,
          ),
          defaultPurchaseCreditAccountId: optNum(
            data.defaultPurchaseCreditAccountId,
          ),
          defaultBankAccountId: optNum(data.defaultBankAccountId),
        }),
        apiClient.put(`/companies/${companyId}/process-account-defaults`, {
          defaults: processPayload,
        }),
      ]);
      toast.success("Default accounts saved");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!companyId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No company context. Sign in again.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground">Loading default accounts…</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Default accounts"
        description="Configure GL defaults for sales, purchases, and other business processes. Sales and purchase values pre-fill orders and requisitions; process defaults auto-fill manual journal entries and stock variance posting."
        variant="darkBlue"
        icon={<Banknote className="w-6 h-6" />}
        actions={
          <Button type="submit" form="default-accounts-form" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        }
      />

      <Form {...form}>
        <form
          id="default-accounts-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GL and bank defaults</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultSalesDebitAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SelectAccount
                          label="Sales debit account"
                          useId
                          showNoneOption
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultSalesCreditAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SelectAccount
                          label="Sales credit account"
                          useId
                          showNoneOption
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultPurchaseDebitAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SelectAccount
                          label="Purchase debit account"
                          useId
                          showNoneOption
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultPurchaseCreditAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SelectAccount
                          label="Purchase credit account"
                          useId
                          showNoneOption
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultBankAccountId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Bank (sales orders and invoices)</FormLabel>
                      <Select
                        value={field.value || "__none__"}
                        onValueChange={(v) =>
                          field.onChange(v === "__none__" ? "" : v)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select default bank account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {bankAccounts.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              {b.bankName} — {b.accountNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Process account defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y">
              {ALL_ACCOUNTING_PROCESS_CODES.map((code) => (
                <div key={code} className="space-y-4 py-6 first:pt-0 last:pb-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    {ACCOUNTING_PROCESS_LABELS[code]}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem>
                      <FormControl>
                        <SelectAccount
                          label="Debit account"
                          useId
                          showNoneOption
                          value={processAccounts[code].debitAccountId}
                          onChange={(v) =>
                            updateProcessAccount(code, { debitAccountId: v })
                          }
                        />
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormControl>
                        <SelectAccount
                          label="Credit account"
                          useId
                          showNoneOption
                          value={processAccounts[code].creditAccountId}
                          onChange={(v) =>
                            updateProcessAccount(code, { creditAccountId: v })
                          }
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
