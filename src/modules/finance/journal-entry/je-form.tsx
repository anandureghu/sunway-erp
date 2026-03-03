// src/modules/finance/journal-entry/je-form.tsx

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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SelectAccount from "@/components/select-account";
import { JE_SCHEMA, type JEFormData } from "@/schema/finance/journal-entry";
import { useEffect } from "react";

interface Props {
  onSubmit: (data: JEFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<JEFormData> | null;
}

export const JournalEntryForm = ({
  onSubmit,
  loading,
  defaultValues,
}: Props) => {
  const form = useForm<JEFormData>({
    resolver: zodResolver(JE_SCHEMA),
    defaultValues: {
      creditAccountId: 0,
      debitAccountId: 0,
      amount: "",
      source: "",
      description: "",
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
      <form
        onSubmit={form.handleSubmit((data) => {
          onSubmit(data);
          form.reset({
            creditAccountId: 0,
            debitAccountId: 0,
            amount: "",
            source: "",
            description: "",
          });
        })}
        className="space-y-6"
      >
        <SelectAccount
          label="Debit Account"
          value={form.watch("debitAccountId")?.toString()}
          onChange={(val) => form.setValue("debitAccountId", Number(val))}
          useId
        />

        <SelectAccount
          label="Credit Account"
          value={form.watch("creditAccountId")?.toString()}
          onChange={(val) => form.setValue("creditAccountId", Number(val))}
          useId
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input {...field} placeholder="0.00" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Manual / Adjustment" />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Optional description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Create Journal Entry"}
        </Button>
      </form>
    </Form>
  );
};
