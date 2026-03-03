// src/pages/admin/accounting-periods/AccountingPeriodForm.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

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

import {
  ACCOUNTING_PERIOD_CREATE_SCHEMA,
  type AccountingPeriodFormData,
} from "@/schema/accounting-period";

interface AccountingPeriodFormProps {
  onSubmit: (data: AccountingPeriodFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<AccountingPeriodFormData> | null;
}

export const AccountingPeriodForm = ({
  onSubmit,
  loading,
  defaultValues,
}: AccountingPeriodFormProps) => {
  const form = useForm<AccountingPeriodFormData>({
    resolver: zodResolver(ACCOUNTING_PERIOD_CREATE_SCHEMA),
    defaultValues: {
      periodName: "",
      startDate: "",
      endDate: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) form.reset(defaultValues);
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          control={form.control}
          name="periodName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Period Name</FormLabel>
              <FormControl>
                <Input placeholder="FY-2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Period"}
        </Button>
      </form>
    </Form>
  );
};
