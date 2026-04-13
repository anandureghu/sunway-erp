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
import { toast } from "sonner";

const SCHEMA = z.object({
  defaultSalesDebitAccountId: z.string().optional(),
  defaultSalesCreditAccountId: z.string().optional(),
  defaultPurchaseDebitAccountId: z.string().optional(),
  defaultPurchaseCreditAccountId: z.string().optional(),
  defaultBankAccountId: z.string().optional(),
});

type FormData = z.infer<typeof SCHEMA>;

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
        const [coRes, bankRes] = await Promise.all([
          apiClient.get<Company>(`/companies/${companyId}`),
          apiClient.get<BankAccount[]>(`/bank-accounts/company/${companyId}`),
        ]);
        if (cancelled) return;
        const co = coRes.data;
        setBankAccounts(bankRes.data || []);
        form.reset({
          defaultSalesDebitAccountId: toStr(co?.defaultSalesDebitAccountId),
          defaultSalesCreditAccountId: toStr(co?.defaultSalesCreditAccountId),
          defaultPurchaseDebitAccountId: toStr(co?.defaultPurchaseDebitAccountId),
          defaultPurchaseCreditAccountId: toStr(
            co?.defaultPurchaseCreditAccountId,
          ),
          defaultBankAccountId: toStr(co?.defaultBankAccountId),
        });
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

  const onSubmit = async (data: FormData) => {
    if (!companyId) return;
    try {
      setSaving(true);
      await apiClient.put(`/companies/${companyId}/accounting-defaults`, {
        defaultSalesDebitAccountId: optNum(data.defaultSalesDebitAccountId),
        defaultSalesCreditAccountId: optNum(data.defaultSalesCreditAccountId),
        defaultPurchaseDebitAccountId: optNum(
          data.defaultPurchaseDebitAccountId,
        ),
        defaultPurchaseCreditAccountId: optNum(
          data.defaultPurchaseCreditAccountId,
        ),
        defaultBankAccountId: optNum(data.defaultBankAccountId),
      });
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
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Default accounts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          These values pre-fill sales orders, purchase requisitions, and sales
          invoices. Orders may be blocked until required defaults are set.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">GL and bank defaults</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultSalesDebitAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SelectAccount
                          label="Default sales debit account"
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
                          label="Default sales credit account"
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
                          label="Default purchase debit account"
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
                          label="Default purchase credit account"
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
                      <FormLabel>
                        Default bank (sales orders and invoices)
                      </FormLabel>
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
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
