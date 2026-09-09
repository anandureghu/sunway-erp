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
import PhoneInput from "@/components/PhoneInput";
import CountrySelect from "@/components/country-select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
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
import { listCategories } from "@/service/inventoryService";
import type { ItemCategory } from "@/types/inventory";
import { Truck, Users } from "lucide-react";

interface VendorFormProps {
  onSubmit: (data: VendorFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<VendorFormData> | null;
  vendorCode?: string | null;
}

function flattenCategories(categories: ItemCategory[]): ItemCategory[] {
  const out: ItemCategory[] = [];
  for (const cat of categories) {
    out.push(cat);
    if (cat.subCategories?.length) {
      out.push(...flattenCategories(cat.subCategories));
    }
  }
  return out;
}

export const VendorForm = ({
  onSubmit,
  loading,
  defaultValues,
  vendorCode,
}: VendorFormProps) => {
  const { currencyCode: companyCurrencyCode } = useCompanyCurrency();
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const blankDefaults = useMemo(
    (): VendorFormData => ({
      vendorName: "",
      taxId: "",
      categoryId: null,
      vendorCrNo: "",
      bankName: "",
      iban: "",
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
    let cancelled = false;
    void listCategories()
      .then((cats) => {
        if (!cancelled) setCategories(flattenCategories(cats));
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <Truck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Contact details
            </span>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Supplier Code
                </FormLabel>
                <FormControl>
                  <Input
                    value={vendorCode || "Auto-generated on save (SUP-…)"}
                    disabled
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-500"
                  />
                </FormControl>
              </FormItem>

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
                      Contact Person <span className="text-rose-400">*</span>
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
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Category
                    </FormLabel>
                    <Select
                      value={field.value != null ? String(field.value) : "none"}
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? null : Number(v))
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        <SelectItem value="none">No category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.parentId ? `— ${cat.name}` : cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      Email <span className="text-rose-400">*</span>
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
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Phone <span className="text-rose-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={!!fieldState.error}
                        className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus-within:border-blue-400 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
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

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <Truck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Business information
            </span>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendorCrNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Vendor CR. No.
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Commercial registration no."
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
                      Payment Terms <span className="text-rose-400">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl border border-slate-200 bg-white text-[13px]">
                          <SelectValue placeholder="Select terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 45">Net 45</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Bank Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Bank Name"
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
                name="iban"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      IBAN
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="QA58DOHB000012345678901234567"
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
                    <FormLabel className="m-0 text-[13px] font-medium text-slate-700">
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
                    <FormLabel className="m-0 text-[13px] font-medium text-slate-700">
                      1099 Supplier
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    VAT / TIN
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VAT / TIN number"
                      {...field}
                      className="h-10 max-w-md rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Address
            </span>
          </div>
          <div className="space-y-5 p-5">
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
                      <CountrySelect
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Select country"
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

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
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
                      className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
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
          className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-[13px] font-semibold shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Supplier"}
        </Button>
      </form>
    </Form>
  );
};
