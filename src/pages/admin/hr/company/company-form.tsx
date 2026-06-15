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
import PhoneInput from "@/components/PhoneInput";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { type CompanyFormData, COMPANY_SCHEMA } from "@/schema/company";
import { useForm, type SubmitHandler } from "react-hook-form";
import SelectCurrency from "@/components/select-currency";
import type { Company } from "@/types/company";
import { hasAnyRole } from "@/lib/utils";
import { useAppSelector } from "@/store/store";

interface CompanyFormProps {
  onSubmit: (
    data: CompanyFormData,
    logoFile: File | null,
  ) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<CompanyFormData> | Partial<Company> | null;
  isEditMode?: boolean;
  hideSubmitButton?: boolean;
}

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toOptionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  return String(value);
};

const normalizeCompanyDefaults = (
  values?: Partial<CompanyFormData> | Partial<Company> | null,
): Partial<CompanyFormData> => {
  if (!values) return {};

  const currencyIdFromValues =
    "currencyId" in values
      ? values.currencyId
      : "currency" in values
        ? values.currency?.id
        : undefined;

  return {
    companyName: toOptionalString(values.companyName) ?? "",
    companyCode: toOptionalString(values.companyCode),
    computerCard: toOptionalString(values.computerCard),
    street: toOptionalString(values.street),
    city: toOptionalString(values.city),
    state: toOptionalString(values.state),
    country: toOptionalString(values.country),
    phoneNo: toOptionalString(values.phoneNo),
    crNo: toOptionalNumber(values.crNo),
    noOfEmployees: toOptionalNumber(values.noOfEmployees),
    currencyId: toOptionalNumber(currencyIdFromValues),
    hrEnabled: values.hrEnabled,
    financeEnabled: values.financeEnabled,
    inventoryEnabled: values.inventoryEnabled,
  };
};

const getExistingLogoUrl = (
  values?: Partial<CompanyFormData> | Partial<Company> | null,
): string | null => {
  if (!values) return null;
  if ("logoUrl" in values && typeof values.logoUrl === "string") {
    return values.logoUrl || null;
  }
  return null;
};

export const CompanyForm = ({
  onSubmit,
  loading,
  defaultValues,
  isEditMode = false,
  hideSubmitButton = false,
}: CompanyFormProps) => {
  const normalizedDefaults = useMemo(
    () => normalizeCompanyDefaults(defaultValues),
    [defaultValues],
  );
  const existingLogoUrl = useMemo(
    () => getExistingLogoUrl(defaultValues),
    [defaultValues],
  );
  const disableCurrencySelection =
    isEditMode && !!normalizedDefaults.currencyId;

  const { user } = useAppSelector((state) => state);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    setLogoFile(null);
  }, [defaultValues]);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(COMPANY_SCHEMA),
    defaultValues: {
      companyName: "",
      noOfEmployees: undefined,
      crNo: undefined,
      companyCode: "",
      computerCard: "",
      street: "",
      city: "",
      state: "",
      country: "India",
      phoneNo: "",
      currencyId: undefined,
      ...normalizedDefaults,
    },
  });

  useEffect(() => {
    if (normalizedDefaults) {
      form.reset({
        companyName: "",
        noOfEmployees: undefined,
        crNo: undefined,
        companyCode: "",
        computerCard: "",
        street: "",
        city: "",
        state: "",
        country: "India",
        phoneNo: "",
        currencyId: undefined,
        ...normalizedDefaults,
      });
    }
  }, [normalizedDefaults, form]);

  const handleSubmit: SubmitHandler<CompanyFormData> = async (values) => {
    await onSubmit(values, logoFile);
  };

  const previewSrc = logoPreview ?? existingLogoUrl;

  return (
    // ✅ Pass the *typed* form instance directly
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Sunway Technologies" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="crNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Company CR No.</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1029834756"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isEditMode && (
            <FormField
              control={form.control}
              name="companyCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Code</FormLabel>
                  <FormControl>
                    <Input
                      type="string"
                      placeholder="100"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? e.target.value : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="noOfEmployees"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>No. of Employees</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="250"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Optional fields */}
          <FormField
            control={form.control}
            name="computerCard"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Computer Card</FormLabel>
                <FormControl>
                  <Input placeholder="CC-93847" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street</FormLabel>
                <FormControl>
                  <Input placeholder="Tech Avenue" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Kochi" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="Kerala" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="India" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNo"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="currencyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Currency</FormLabel>
              <FormControl>
                <SelectCurrency
                  value={field.value ? String(field.value) : undefined}
                  onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  disabled={disableCurrencySelection}
                  disableLabel
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2 border p-4 rounded-md">
          <p className="font-medium text-sm">Company Logo</p>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-md border bg-muted/30 overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="Company logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span>No logo</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setLogoFile(f ?? null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or WebP. Max 5MB.
                {isEditMode && existingLogoUrl && !logoFile
                  ? " Leave empty to keep the current logo."
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {hasAnyRole(user?.role, ["SUPER_ADMIN"]) && (
          <div className="space-y-2 border p-4 rounded-md">
            <p className="font-medium text-sm">Subscribed Modules</p>

            <div className="grid grid-cols-3 gap-4">
              {/* HR */}
              <FormField
                control={form.control}
                name="hrEnabled"
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
                    <FormLabel className="m-0">HR</FormLabel>
                  </FormItem>
                )}
              />

              {/* Finance */}
              <FormField
                control={form.control}
                name="financeEnabled"
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
                    <FormLabel className="m-0">Finance</FormLabel>
                  </FormItem>
                )}
              />

              {/* Inventory */}
              <FormField
                control={form.control}
                name="inventoryEnabled"
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
                    <FormLabel className="m-0">Inventory</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          id="company-form-submit-btn"
          className="w-full"
          disabled={loading}
          style={{ display: hideSubmitButton ? "none" : undefined }}
        >
          {loading ? "Saving..." : "Save Company"}
        </Button>
      </form>
    </Form>
  );
};
