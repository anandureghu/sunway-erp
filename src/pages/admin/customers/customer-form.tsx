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
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { type CustomerFormData, CUSTOMER_SCHEMA } from "@/schema/customer";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCompanyCurrency } from "@/hooks/use-company-currency";
import { Users } from "lucide-react";

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<CustomerFormData> | null;
}

export const CustomerForm = ({
  onSubmit,
  loading,
  defaultValues,
}: CustomerFormProps) => {
  const { currencyCode: companyCurrencyCode } = useCompanyCurrency();
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(CUSTOMER_SCHEMA),
    defaultValues: {
      customerName: "",
      taxId: "",
      paymentTerms: "",
      currencyCode: companyCurrencyCode ?? "",
      creditLimit: 0,
      isActive: true,
      street: "",
      city: "",
      state: "",
      country: "",
      phoneNo: "",
      email: "",
      contactPersonName: "",
      websiteUrl: "",
      customerType: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit: SubmitHandler<CustomerFormData> = async (values) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

        {/* ── Section: Contact Details ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Contact details
            </span>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Customer Name <span className="text-rose-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Customer Name"
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
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Phone
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
            </div>
          </div>
        </div>

        {/* ── Section: Business Information ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Business information
            </span>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Customer Type
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="individual">Individual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      value={field.value || companyCurrencyCode || ""}
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

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Status
              </label>
              <Select
                value={form.watch("isActive") ? "active" : "inactive"}
                onValueChange={(val) => {
                  form.setValue("isActive", val === "active" ? true : false);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      State
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="State"
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

        <Button
          type="submit"
          className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-[13px] shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Customer"}
        </Button>
      </form>
    </Form>
  );
};
