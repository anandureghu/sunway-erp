import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/service/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Company } from "@/types/company";

const SCHEMA = z.object({
  taxRate: z.string().optional(),
  isTaxActive: z.boolean().optional(),
  invoiceFooterTaxLine: z.string().optional(),
});

type FormData = z.infer<typeof SCHEMA>;

const toStr = (x: number | string | null | undefined) =>
  x != null && x !== "" ? String(x) : "";

export default function TaxSettingsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId ? Number(user.companyId) : 0;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(SCHEMA),
    defaultValues: {
      taxRate: "",
      isTaxActive: false,
      invoiceFooterTaxLine: "",
    },
  });

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await apiClient.get<Company>(`/companies/${companyId}`);
        setCompany(res.data);
        form.reset({
          taxRate: toStr(res.data.taxRate),
          isTaxActive: !!res.data.isTaxActive,
          invoiceFooterTaxLine: res.data.invoiceFooterTaxLine || "",
        });
      } catch {
        toast.error("Failed to load tax settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId, form]);

  const onSubmit = async (values: FormData) => {
    if (!company || !company.currency?.id) {
      toast.error("Company or currency context is missing");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        companyName: company.companyName,
        noOfEmployees: company.noOfEmployees ? Number(company.noOfEmployees) : undefined,
        currencyId: company.currency.id,
        crNo: company.crNo ? Number(company.crNo) : undefined,
        computerCard: company.computerCard || "",
        companyCode: company.companyCode || "",
        street: company.street || "",
        city: company.city || "",
        state: company.state || "",
        country: company.country || "",
        phoneNo: company.phoneNo || "",
        companyEmail: company.companyEmail || "",
        billingEmail: company.billingEmail || "",
        websiteUrl: company.websiteUrl || "",
        taxRate: values.taxRate ? Number(values.taxRate) : undefined,
        isTaxActive: !!values.isTaxActive,
        hrEnabled: !!company.hrEnabled,
        financeEnabled: !!company.financeEnabled,
        inventoryEnabled: !!company.inventoryEnabled,
        invoiceHeaderSubtitle: company.invoiceHeaderSubtitle || "",
        invoiceNotesUnpaid: company.invoiceNotesUnpaid || "",
        invoiceNotesPaid: company.invoiceNotesPaid || "",
        invoiceTerms: company.invoiceTerms || "",
        invoiceFooterCompanyLine: company.invoiceFooterCompanyLine || "",
        invoiceFooterTaxLine: values.invoiceFooterTaxLine || "",
        invoiceFooterSignatureNote: company.invoiceFooterSignatureNote || "",
        invoiceFooterSupportEmail: company.invoiceFooterSupportEmail || "",
        invoiceFooterBillingEmail: company.invoiceFooterBillingEmail || "",
        invoiceQrEnabled: !!company.invoiceQrEnabled,
      };
      const res = await apiClient.put<Company>(`/companies/${companyId}`, payload);
      setCompany(res.data);
      toast.success("Tax settings updated");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save tax settings";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading tax settings...</div>;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tax Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure company tax behavior and tax footer line for invoices.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tax configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isTaxActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={!!field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel className="m-0">Enable tax</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="invoiceFooterTaxLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice footer tax line</FormLabel>
                    <FormControl>
                      <Input placeholder="Tax ID: QA-123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Tax Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
