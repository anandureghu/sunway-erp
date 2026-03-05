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

interface ChartOfAccountsFormProps {
  onSubmit: (data: COAFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<COAFormData> | null;
}

export const ChartOfAccountsForm = ({
  onSubmit,
  loading,
  defaultValues,
}: ChartOfAccountsFormProps) => {
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
    await onSubmit(values);
  });

  const deptCode = department?.departmentCode || projectCode || "000";

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
  }, [form.watch("type")]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Name */}
        <FormField
          control={form.control}
          name="accountName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={false} placeholder="Cash at Bank" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          disabled={isEditMode}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(val) => form.setValue("type", val)}
                  value={field.value}
                  defaultValue="ADMIN"
                  disabled={isEditMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select COA Type" />
                  </SelectTrigger>
                  <SelectContent>
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

        <div
          className={cn(
            !form.watch("departmentId") &&
              !form.watch("projectCode") &&
              "p-5 border border-dashed border-black/20 rounded-xl",
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
            <div className="text-center text-black/40 font-semibold mt-3">
              OR
            </div>
          )}

          {!form.watch("departmentId") && (
            <FormField
              control={form.control}
              name="projectCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="2000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="accountNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account No</FormLabel>
              <FormControl>
                <Input {...field} placeholder="100000" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SelectAccount
          value={form.watch("parentId")?.toString()}
          onChange={(val) => {
            form.setValue("parentId", Number(val));
          }}
          label="Parent Account"
          useId
          disabled={isEditMode}
        />

        <FormField
          control={form.control}
          name="interCompanyNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inter Company No</FormLabel>
              <FormControl>
                <Input {...field} placeholder="200" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="openingBalance"
          disabled={isEditMode}
          render={() => (
            <FormItem>
              <FormLabel>Opening Balance</FormLabel>
              <FormControl>
                <Input
                  // type="number"
                  // step="0.01"
                  {...form.register("openingBalance", {
                    setValueAs: (v) => (v === "" ? undefined : v),
                  })}
                  placeholder="0.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Optional description..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl drop-shadow-2xl">
          <h1 className="text-white/70">Account Code</h1>
          <h2 className="text-4xl font-bold">{computedCode}</h2>
        </div>

        {/* Only edit these during CREATE */}

        <Button type="submit" className="w-full" disabled={loading}>
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
