// src/pages/admin/departments/DepartmentForm.tsx
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { apiClient } from "@/service/apiClient";
import type { Company } from "@/types/company";
import {
  type DepartmentFormData,
  DEPARTMENT_SCHEMA,
} from "@/schema/department";
import SelectUser from "@/components/select-user";
import { Textarea } from "@/components/ui/textarea";

interface DepartmentFormProps {
  onSubmit: (data: DepartmentFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<DepartmentFormData> | null;
}

export const DepartmentForm = ({
  onSubmit,
  loading,
  defaultValues,
}: DepartmentFormProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(DEPARTMENT_SCHEMA),
    defaultValues: {
      departmentCode: "",
      departmentName: "",
      managerId: undefined,
      companyId: 0,
      ...defaultValues,
    },
  });

  useEffect(() => {
    apiClient.get("/companies").then((res) => setCompanies(res.data));
  }, []);

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
            name="departmentCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Code</FormLabel>
                <FormControl>
                  <Input placeholder="FIN001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departmentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name</FormLabel>
                <FormControl>
                  <Input placeholder="Finance Department" {...field} />
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

          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <Select
                  value={field.value?.toString()}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Explain briefly about the department..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Department"}
        </Button>
      </form>
    </Form>
  );
};
