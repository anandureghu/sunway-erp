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
  companyEmail: z.string().email().or(z.literal("")),
  billingEmail: z.string().email().or(z.literal("")),
  websiteUrl: z.string().url().or(z.literal("")),
});

type FormData = z.infer<typeof SCHEMA>;

export default function SocialSettingsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId ? Number(user.companyId) : 0;
  const role = (user?.role || "").toUpperCase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(SCHEMA),
    defaultValues: {
      companyEmail: "",
      billingEmail: "",
      websiteUrl: "",
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
          companyEmail: res.data.companyEmail || "",
          billingEmail: res.data.billingEmail || "",
          websiteUrl: res.data.websiteUrl || "",
        });
      } catch {
        toast.error("Failed to load social settings");
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
        companyEmail: values.companyEmail || "",
        billingEmail: values.billingEmail || "",
        websiteUrl: values.websiteUrl || "",
        taxRate: company.taxRate ? Number(company.taxRate) : undefined,
        isTaxActive: !!company.isTaxActive,
        hrEnabled: !!company.hrEnabled,
        financeEnabled: !!company.financeEnabled,
        inventoryEnabled: !!company.inventoryEnabled,
        invoiceHeaderSubtitle: company.invoiceHeaderSubtitle || "",
        invoiceNotesUnpaid: company.invoiceNotesUnpaid || "",
        invoiceNotesPaid: company.invoiceNotesPaid || "",
        invoiceTerms: company.invoiceTerms || "",
        invoiceFooterCompanyLine: company.invoiceFooterCompanyLine || "",
        invoiceFooterTaxLine: company.invoiceFooterTaxLine || "",
        invoiceFooterSignatureNote: company.invoiceFooterSignatureNote || "",
        invoiceFooterSupportEmail: company.invoiceFooterSupportEmail || "",
        invoiceFooterBillingEmail: company.invoiceFooterBillingEmail || "",
        invoiceQrEnabled: !!company.invoiceQrEnabled,
      };
      const res = await apiClient.put<Company>(`/companies/${companyId}`, payload);
      setCompany(res.data);
      toast.success("Social settings updated");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save social settings";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading social settings...</div>;
  if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return <div className="p-6 text-muted-foreground">You do not have access to this page.</div>;
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Social</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage company social and email details used across invoices.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email and website details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="companyEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company email</FormLabel>
                    <FormControl>
                      <Input placeholder="info@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing email</FormLabel>
                    <FormControl>
                      <Input placeholder="accounts@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Social Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
