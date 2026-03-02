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

import { useEffect } from "react";
import {
  type DepartmentFormData,
  DEPARTMENT_SCHEMA,
} from "@/schema/department";
import type { Department } from "@/types/department";
import SelectUser from "@/components/select-user";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();
  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(DEPARTMENT_SCHEMA),
    defaultValues: {
      departmentCode: "",
      departmentName: "",
      managerId: undefined,
      companyId: Number(user?.companyId),
      ...defaultValues,
    },
  });

  useEffect(() => {
    apiClient.get("/companies").then((res) => {
      // Handle both { data: [...] } and [...] response formats
      const companiesData = res.data?.data || res.data;
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    });
  }, []);

  useEffect(() => {
    if (defaultValues) {
      // Extract companyId from nested company object if it exists
      // Cast to Department type to access company property
      const dept = defaultValues as Partial<Department>;
      const formData = {
        ...defaultValues,
        companyId: defaultValues.companyId || dept.company?.id || 0,
      };
      form.reset(formData);
    }
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
                  <Input 
                    placeholder="FIN001" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    value={field.value || ""}
                  />
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
