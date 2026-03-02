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

  console.log(form.watch("parentId"));

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Code (System Generated) */}
        <FormField
          control={form.control}
          name="accountCode"
          render={({ field }) => {
            const deptCode = department?.departmentCode || projectCode || "000";

            const computedCode = `${company?.companyCode || "000"}.${
              deptCode
            }.${accountNo || "000000"}.${interCompanyNumber || "000"}`;

            // Push computed value into form state
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useEffect(() => {
              form.setValue("accountCode", computedCode);
            }, [computedCode]);

            return (
              <FormItem>
                <FormLabel>Account Code</FormLabel>
                <FormControl>
                  <Input {...field} disabled value={computedCode} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

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

        {/* Only show these during CREATE */}
        {!isEditMode && (
          <>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => form.setValue("type", val)}
                      value={field.value}
                      defaultValue="ADMIN"
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

            <SelectDepartment
              value={form.watch("departmentId")?.toString()}
              onChange={(val, dept) => {
                form.setValue("departmentId", Number(val));
                console.log(dept);
                setDepartment(dept);
              }}
            />

            <SelectAccount
              value={form.watch("parentId")?.toString()}
              onChange={(val) => {
                console.log(val);
                form.setValue("parentId", Number(val));
              }}
              label="Parent Account"
              useId
            />

            <FormField
              control={form.control}
              name="openingBalance"
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
          </>
        )}

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
