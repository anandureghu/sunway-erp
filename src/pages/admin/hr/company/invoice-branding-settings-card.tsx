import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { apiClient } from "@/service/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { Company } from "@/types/company";

const SCHEMA = z.object({
  invoiceHeaderSubtitleUnpaid: z.string().max(200).optional(),
  invoiceHeaderSubtitlePaid: z.string().max(200).optional(),
  invoiceNotesUnpaid: z.string().max(1000).optional(),
  invoiceNotesPaid: z.string().max(1000).optional(),
  invoiceTerms: z.string().max(4000).optional(),
  invoiceFooterSignatureNote: z.string().max(300).optional(),
  invoiceFooterSupportEmail: z.string().max(120).optional(),
  invoiceFooterBillingEmail: z.string().max(120).optional(),
  invoiceQrEnabled: z.boolean(),
});

type FormData = z.infer<typeof SCHEMA>;

type Placeholder = { token: string; label: string; description: string };

const UNPAID_PLACEHOLDERS: Placeholder[] = [
  { token: "{{companyName}}",   label: "Company Name",   description: "Your registered company name" },
  { token: "{{invoiceId}}",     label: "Invoice Number", description: "Auto-generated invoice reference" },
  { token: "{{invoiceDate}}",   label: "Invoice Date",   description: "Date the invoice was created" },
  { token: "{{dueDate}}",       label: "Due Date",       description: "Payment deadline date" },
  { token: "{{customerName}}", label: "Customer Name",  description: "Name of the billed customer" },
  { token: "{{totalAmount}}",   label: "Total Amount",   description: "Invoice total including taxes" },
];

const PAID_PLACEHOLDERS: Placeholder[] = [
  { token: "{{companyName}}",   label: "Company Name",   description: "Your registered company name" },
  { token: "{{invoiceId}}",     label: "Invoice Number", description: "Auto-generated invoice reference" },
  { token: "{{paidDate}}",      label: "Paid Date",      description: "Date the payment was received" },
  { token: "{{customerName}}", label: "Customer Name",  description: "Name of the billed customer" },
  { token: "{{totalAmount}}",   label: "Total Amount",   description: "Invoice total including taxes" },
];

const HEADER_PLACEHOLDERS: Placeholder[] = [
  { token: "{{companyName}}",  label: "Company Name",   description: "Your registered company name" },
  { token: "{{invoiceId}}",    label: "Invoice Number", description: "Auto-generated invoice reference" },
  { token: "{{invoiceDate}}",  label: "Invoice Date",   description: "Date the invoice was created" },
];

function PlaceholderHint({ placeholders }: { placeholders: Placeholder[] }) {
  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <button type="button" className="ml-1.5 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <Info className="h-3.5 w-3.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-3" align="start" side="right">
        <p className="text-xs text-muted-foreground mb-2.5 leading-relaxed">
          Type these placeholders directly in the text. They are automatically replaced with real values when the document is generated.
        </p>
        <div className="space-y-1.5">
          {placeholders.map(({ token, label, description }) => (
            <div key={token} className="flex items-start gap-2">
              <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-foreground">
                {token}
              </code>
              <div className="min-w-0">
                <span className="text-xs font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground"> — {description}</span>
              </div>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

type Props = {
  company: Company;
  onSaved: (company: Company) => void;
};

export function InvoiceBrandingSettingsCard({ company, onSaved }: Props) {
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(SCHEMA),
    defaultValues: {
      invoiceHeaderSubtitleUnpaid: "",
      invoiceHeaderSubtitlePaid: "",
      invoiceNotesUnpaid: "",
      invoiceNotesPaid: "",
      invoiceTerms: "",
      invoiceFooterSignatureNote: "",
      invoiceFooterSupportEmail: "",
      invoiceFooterBillingEmail: "",
      invoiceQrEnabled: false,
    },
  });

  useEffect(() => {
    form.reset({
      invoiceHeaderSubtitleUnpaid: company.invoiceHeaderSubtitleUnpaid || company.invoiceHeaderSubtitle || "",
      invoiceHeaderSubtitlePaid: company.invoiceHeaderSubtitlePaid || "",
      invoiceNotesUnpaid: company.invoiceNotesUnpaid || "",
      invoiceNotesPaid: company.invoiceNotesPaid || "",
      invoiceTerms: company.invoiceTerms || "",
      invoiceFooterSignatureNote: company.invoiceFooterSignatureNote || "",
      invoiceFooterSupportEmail:
        company.invoiceFooterSupportEmail || company.companyEmail || "",
      invoiceFooterBillingEmail:
        company.invoiceFooterBillingEmail || company.billingEmail || "",
      invoiceQrEnabled: !!company.invoiceQrEnabled,
    });
  }, [company, form]);

  const onSubmit = async (values: FormData) => {
    try {
      setSaving(true);
      const res = await apiClient.put<Company>(
        `/companies/${company.id}/invoice-branding`,
        values,
      );
      toast.success("Invoice branding settings updated");
      onSaved(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save invoice branding settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="invoiceHeaderSubtitleUnpaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Header Subtitle (Unpaid)
                    <PlaceholderHint placeholders={HEADER_PLACEHOLDERS} />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Invoice to be Paid Before the items are delivered"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceHeaderSubtitlePaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Header Subtitle (Paid)
                    <PlaceholderHint placeholders={HEADER_PLACEHOLDERS} />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Thank you for your payment"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceNotesUnpaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Notes Template (Unpaid)
                    <PlaceholderHint placeholders={UNPAID_PLACEHOLDERS} />
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="e.g. Dear {{customerName}}, please make payment by {{dueDate}}."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceNotesPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Notes Template (Paid)
                    <PlaceholderHint placeholders={PAID_PLACEHOLDERS} />
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="e.g. Thank you {{customerName}}, payment received on {{paidDate}}."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions — Invoice (Unpaid) <span className="text-muted-foreground font-normal">(one line per item)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      rows={8}
                      placeholder="Line 1&#10;Line 2&#10;Line 3"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceFooterSignatureNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Signature Note</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="This is a computer-generated document and does not require a physical signature."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="invoiceFooterSupportEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support contact (invoice footer)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="support@company.com"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Shown as “For support: …” on the invoice footer.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoiceFooterBillingEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing contact (invoice footer)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="accounts@company.com"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Shown as “For billing: …” on the invoice footer.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="invoiceQrEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <FormLabel className="m-0">
                    Enable QR in invoice footer
                  </FormLabel>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Invoice Branding"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
