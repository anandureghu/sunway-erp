import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import EmailInput from "@/components/EmailInput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo } from "react";
import { type VendorFormData, VENDOR_SCHEMA } from "@/schema/vendor";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import { Truck, Users } from "lucide-react";

interface VendorFormProps {
  onSubmit: (data: VendorFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<VendorFormData> | null;
}

export const VendorForm = ({
  onSubmit,
  loading,
  defaultValues,
}: VendorFormProps) => {
  const { currencyCode: companyCurrencyCode } = useCompanyCurrency();
  const blankDefaults = useMemo(
    (): VendorFormData => ({
      vendorName: "",
      taxId: "",
      paymentTerms: "",
      currencyCode: companyCurrencyCode ?? "",
      creditLimit: 0,
      active: true,
      street: "",
      city: "",
      country: "",
      phoneNo: "",
      email: "",
      contactPersonName: "",
      fax: "",
      websiteUrl: "",
      is1099Vendor: false,
      remarks: "",
    }),
    [companyCurrencyCode],
  );

  const form = useForm<VendorFormData>({
    resolver: zodResolver(VENDOR_SCHEMA),
    defaultValues: {
      ...blankDefaults,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({ ...blankDefaults, ...defaultValues });
    } else {
      form.reset(blankDefaults);
    }
  }, [defaultValues, form, blankDefaults]);

  const handleSubmit: SubmitHandler<VendorFormData> = async (values) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

        {/* ── Section: Contact Details ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <Truck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Contact details
            </span>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Supplier Name <span className="text-rose-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Supplier Name"
                        {...field}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPersonName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Contact Person
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contact Person"
                        {...field}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Email
                    </FormLabel>
                    <FormControl>
                      <EmailInput
                        placeholder="email@example.com"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={!!fieldState.error}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1234567890"
                        {...field}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Fax
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Fax Number"
                        {...field}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
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
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Website
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        {...field}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* ── Section: Business Information ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <Truck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Business information
            </span>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Tax ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tax ID"
                        {...field}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Payment Terms
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Net 30"
                        {...field}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Currency
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="QAR">QAR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Credit Limit
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : 0,
                          )
                        }
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2.5">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? true}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                      />
                    </FormControl>
                    <FormLabel className="text-[13px] font-medium text-slate-700 m-0">
                      Active supplier
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is1099Vendor"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2.5">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                      />
                    </FormControl>
                    <FormLabel className="text-[13px] font-medium text-slate-700 m-0">
                      1099 Supplier
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* ── Section: Address ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Address
            </span>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Street
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Street Address"
                        {...field}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      City
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City"
                        {...field}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Country
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Country"
                        {...field}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* ── Section: Remarks ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <Truck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Additional notes
            </span>
          </div>
          <div className="p-5">
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Additional remarks or notes about the supplier"
                      {...field}
                      rows={3}
                      className="rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] resize-none px-3 py-2"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-[13px] shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Supplier"}
        </Button>
      </form>
    </Form>
  );
};