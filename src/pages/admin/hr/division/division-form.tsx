// src/pages/admin/departments/DivisionForm.tsx
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
import { useEffect } from "react";
import SelectUser from "@/components/select-user";
import { Textarea } from "@/components/ui/textarea";
import { DIVISION_SCHEMA, type DivisionFormData } from "@/schema/division";
import SelectDepartment from "@/components/select-department";
import { useAuth } from "@/context/AuthContext";

interface DivisionFormProps {
  onSubmit: (data: DivisionFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<DivisionFormData> | null;
}

export const DivisionForm = ({
  onSubmit,
  loading,
  defaultValues,
}: DivisionFormProps) => {
  const { user } = useAuth();

  const form = useForm<DivisionFormData>({
    resolver: zodResolver(DIVISION_SCHEMA),
    defaultValues: {
      code: "",
      name: "",
      managerId: undefined,
      companyId: Number(user?.companyId),
      departmentId: undefined,
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Division Code</FormLabel>
                <FormControl>
                  <Input placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Division Name</FormLabel>
                <FormControl>
                  <Input placeholder="Finance Division" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            {/* <Label>Manager</Label> */}
            <SelectUser
              value={form.getValues("managerId")?.toString()}
              onChange={(val) => form.setValue("managerId", Number(val))}
              label="Manger"
              placeholder="Select Manager"
            />
          </div>

          <div>
            {/* <Label>Manager</Label> */}
            <SelectDepartment
              value={form.getValues("departmentId")?.toString() || undefined}
              onChange={(val) => form.setValue("departmentId", Number(val))}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explain briefly about the division..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Division"}
        </Button>
      </form>
    </Form>
  );
};
