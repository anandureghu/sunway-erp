// src/pages/admin/finance/ChartOfAccountsForm.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";

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
  type COAFormData,
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

interface ChartOfAccountsFormProps {
  onSubmit: (data: COAFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<COAFormData> | null;
}

export const ChartOfAccountsForm = ({
  onSubmit,
  loading,
  defaultValues,
}: ChartOfAccountsFormProps)  => {
  const isEditMode = useMemo(
    () => !!defaultValues?.accountCode,
    [defaultValues],
  );

  const { company } = useAuth();

  const form = useForm<COAFormData>({
    resolver: zodResolver(COA_SCHEMA),
    defaultValues: {
      accountCode: "",
      accountName: "",
      description: "",
      type: "ASSET",
      ...defaultValues,
    },
  });

  const accountNo = form.watch("accountNo");
  const projectCode = form.watch("projectCode");
  const interCompanyNumber = form.watch("interCompanyNumber");

  const [department, setDepartment] = useState<Department | null>();

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.log(error);
    }
  });

  const isBudgetAccountSelected = form.watch("type") === "BUDGET";

  const deptCode = isBudgetAccountSelected
    ? "BUD1"
    : department?.departmentCode || projectCode || "000";

  const computedCode = `${company?.companyCode || "000"}.${
    deptCode
  }.${accountNo || "000000"}.${interCompanyNumber || "000"}`;

  // Push computed value into form state
  useEffect(() => {
    form.setValue("accountCode", computedCode);
  }, [computedCode]);

  useEffect(() => {
    const idx = COA.findIndex((coa) => coa.key === form.watch("type"));
    form.setValue("accountNo", String((idx + 1) * 100000));

    if (form.watch("type") === "BUDGET") {
      form.setValue("accountNo", `BUD${new Date().getFullYear()}`);
    }
  }, [form.watch("type")]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Account Code Preview Banner ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                Account Code
              </p>
              <p className="text-[12px] text-slate-400">
                Auto-computed from your selections
              </p>
            </div>
          </div>
          <p className="text-3xl font-bold font-mono pl-12">{computedCode}</p>
        </div>

        {/* ── Section: Core Information ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <Hash className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Core information
            </span>
          </div>
          <div className="p-5 space-y-5">
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
                      disabled={false}
                      placeholder="Cash at Bank"
                      className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
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
                      defaultValue="ADMIN"
                      disabled={isEditMode}
                    >
                      <SelectTrigger className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]">
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
                      className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Section: Department / Project Assignment ── */}
        {!isBudgetAccountSelected && (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <Hash className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-[13px] font-semibold text-slate-700">
                Assignment
              </span>
            </div>
            <div className="p-5">
              <div
                className={cn(
                  "space-y-4",
                  !form.watch("departmentId") &&
                    !form.watch("projectCode") &&
                    "p-5 border border-dashed border-slate-300 rounded-xl bg-slate-50/50",
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
                            placeholder="2000"
                            className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
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

        {/* ── Section: Hierarchy & Details ── */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <Layers className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              Hierarchy &amp; details
            </span>
          </div>
          <div className="p-5 space-y-5">
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
                      className="h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
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
                      placeholder="Optional description..."
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
          {loading
            ? "Saving..."
            : isEditMode
              ? "Update Account"
              : "Create Account"}
        </Button>
      </form>
    </Form>
  );
};