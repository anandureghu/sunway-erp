import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SelectDepartment from "@/components/select-department";

import {
  COA_SCHEMA,
  normalizeCoaFormDefaults,
  type COAFormData,
  type CoaFormSource,
} from "@/schema/finance/chart-of-account";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COA } from "@/types/coa";
import { useAuth } from "@/context/AuthContext";
import { type Department } from "@/types/department";
import SelectAccount from "@/components/select-account";
import { cn } from "@/lib/utils";
import { Layers, Hash } from "lucide-react";
import { apiClient } from "@/service/apiClient";

interface ChartOfAccountsFormProps {
  onSubmit: (data: COAFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: (CoaFormSource & Partial<COAFormData>) | null;
  /** Override primary button label (create flow uses review step). */
  submitLabel?: string;
}

const icls =
  "h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

export const ChartOfAccountsForm = ({
  onSubmit,
  loading,
  defaultValues,
  submitLabel,
}: ChartOfAccountsFormProps) => {
  const isEditMode = useMemo(
    () => !!defaultValues?.accountCode,
    [defaultValues],
  );

  const { company } = useAuth();
  const seededTypeRef = useRef<string | null>(null);

  const form = useForm<COAFormData>({
    resolver: zodResolver(COA_SCHEMA),
    defaultValues: {
      accountCode: "",
      accountName: "",
      description: "",
      type: "ASSET",
      accountNo: "",
      interCompanyNumber: "",
      ...(defaultValues
        ? normalizeCoaFormDefaults(defaultValues)
        : {}),
    },
  });

  const accountNo = form.watch("accountNo");
  const projectCode = form.watch("projectCode");
  const interCompanyNumber = form.watch("interCompanyNumber");
  const accountType = form.watch("type");

  const [department, setDepartment] = useState<Department | null>(null);

  useEffect(() => {
    if (!defaultValues) return;
    const normalized = normalizeCoaFormDefaults(defaultValues);
    const { departmentCode, departmentName, ...formFields } = normalized;
    form.reset(formFields);
    seededTypeRef.current = formFields.type;
    if (normalized.departmentId && departmentCode) {
      setDepartment({
        id: normalized.departmentId,
        departmentCode,
        departmentName: departmentName ?? "",
        companyCode: "",
        companyId: company?.id ?? 0,
        companyName: "",
        createdAt: "",
      });
    } else {
      setDepartment(null);
    }
  }, [defaultValues, form, company?.id]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.log(error);
    }
  });

  const isBudgetAccountSelected = accountType === "BUDGET";

  const deptCode = isBudgetAccountSelected
    ? "BUD1"
    : department?.departmentCode ||
      defaultValues?.departmentCode ||
      projectCode ||
      "000";

  const companySegment = String(company?.companyCode ?? "")
    .trim()
    .padStart(3, "0")
    .slice(-3);

  // On edit, prefer the persisted code so department segment stays accurate.
  const computedCode = isEditMode
    ? defaultValues?.accountCode ||
      `${companySegment}.${deptCode}.${accountNo || "000000"}.${interCompanyNumber || "000"}`
    : `${companySegment}.${deptCode}.${accountNo || "000000"}.${interCompanyNumber || "000"}`;

  useEffect(() => {
    form.setValue("accountCode", computedCode);
  }, [computedCode, form]);

  // Suggest next unique account number on create when type changes — never overwrite on edit.
  useEffect(() => {
    if (isEditMode) return;
    if (!accountType) return;
    if (seededTypeRef.current === accountType && form.getValues("accountNo")) {
      return;
    }
    seededTypeRef.current = accountType;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get<{ accountNo: string }>(
          "/finance/chart-of-accounts/next-account-no",
          { params: { type: accountType } },
        );
        if (!cancelled && data?.accountNo) {
          form.setValue("accountNo", data.accountNo);
        }
      } catch {
        // Fallback: type base series if API unavailable
        if (accountType === "BUDGET") {
          form.setValue("accountNo", `BUD${new Date().getFullYear()}`);
        } else {
          const idx = COA.findIndex((coa) => coa.key === accountType);
          form.setValue("accountNo", String((idx + 1) * 100000));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountType, isEditMode, form]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="rounded-xl bg-slate-800 p-4 text-white">
          <div className="mb-2 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Layers className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                Account Code
              </p>
              <p className="text-[11px] text-slate-400">
                Auto-computed from your selections
              </p>
            </div>
          </div>
          <p className="pl-10 font-mono text-2xl font-bold">{computedCode}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <Hash className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Core information
            </span>
          </div>
          <div className="space-y-3 p-4">
            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Account Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Cash at Bank"
                      className={icls}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Account Type
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => form.setValue("type", val)}
                      value={field.value}
                      disabled={isEditMode}
                    >
                      <SelectTrigger className={icls}>
                        <SelectValue placeholder="Select COA Type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        {COA.map((r) => (
                          <SelectItem key={r.key} value={r.key}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Account No
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="100000"
                      disabled={isEditMode}
                      className={icls}
                    />
                  </FormControl>
                  {!isEditMode && (
                    <p className="text-[11px] text-slate-400">
                      Suggested next available number for this type — must be
                      unique.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {!isBudgetAccountSelected && (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <Hash className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[13px] font-semibold text-slate-700">
                Assignment
              </span>
            </div>
            <div className="p-4">
              <div
                className={cn(
                  "space-y-3",
                  !form.watch("departmentId") &&
                    !form.watch("projectCode") &&
                    "rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4",
                )}
              >
                {!form.watch("projectCode") && (
                  <SelectDepartment
                    value={form.watch("departmentId")?.toString()}
                    onChange={(val, dept) => {
                      form.setValue("departmentId", Number(val));
                      setDepartment(dept || null);
                    }}
                    companyId={company?.id || 0}
                    disabled={isEditMode}
                  />
                )}

                {!form.watch("departmentId") && !form.watch("projectCode") && (
                  <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                    OR
                  </p>
                )}

                {!form.watch("departmentId") && (
                  <FormField
                    control={form.control}
                    name="projectCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Project Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="2000"
                            disabled={isEditMode}
                            className={icls}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <Layers className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Hierarchy &amp; details
            </span>
          </div>
          <div className="space-y-3 p-4">
            <SelectAccount
              value={form.watch("parentId")?.toString()}
              onChange={(val) => {
                form.setValue("parentId", Number(val));
              }}
              label=""
              useId
              disabled={isEditMode}
            />

            <FormField
              control={form.control}
              name="interCompanyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Inter Company No
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="200"
                      disabled={isEditMode}
                      className={icls}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Optional description..."
                      rows={3}
                      className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 outline-none placeholder:text-slate-300 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
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
          className="h-11 w-full rounded-xl bg-slate-900 text-[13px] font-semibold shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : submitLabel ??
              (isEditMode ? "Update Account" : "Create Account")}
        </Button>
      </form>
    </Form>
  );
};
