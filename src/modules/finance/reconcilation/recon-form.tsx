// src/modules/finance/reconciliation/recon-form.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SelectAccount from "@/components/select-account";

import { useEffect } from "react";
import {
  type ReconciliationFormData,
  RECON_SCHEMA,
} from "@/schema/finance/reconcilation";

interface Props {
  onSubmit: (data: ReconciliationFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<ReconciliationFormData> | null;
}

export const ReconciliationForm = ({
  onSubmit,
  loading,
  defaultValues,
}: Props) => {
  const form = useForm<ReconciliationFormData>({
    resolver: zodResolver(RECON_SCHEMA),
    defaultValues: {
      accountId: 0,
      amount: "",
      resource: "",
      reason: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <SelectAccount
          label="Account"
          value={form.watch("accountId")?.toString()}
          onChange={(val) => form.setValue("accountId", Number(val))}
          useId
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Adjustment Amount</FormLabel>
              <FormControl>
                <Input {...field} placeholder="0.00" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Inventory count" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Explain adjustment..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Reconciliation"}
        </Button>
      </form>
    </Form>
  );
};
