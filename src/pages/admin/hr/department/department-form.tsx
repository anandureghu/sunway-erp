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

import { useEffect, useState } from "react";
import {
  type DepartmentFormData,
  DEPARTMENT_SCHEMA,
} from "@/schema/department";
import type { Department } from "@/types/department";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/service/apiClient";
import type { Company } from "@/types/company";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DepartmentFormProps {
  onSubmit: (data: DepartmentFormData) => Promise<void> | void;
  loading?: boolean;
  defaultValues?: Partial<DepartmentFormData> | null;
  companyId: number;
}

export const DepartmentForm = ({
  onSubmit,
  loading,
  defaultValues,
  companyId,
}: DepartmentFormProps) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(DEPARTMENT_SCHEMA),
    defaultValues: {
      departmentCode: "",
      departmentName: "",
      managerId: undefined,
      companyId: companyId || Number(user?.companyId),
      ...defaultValues,
    },
  });

  // Fetch companies only for SUPER_ADMIN
  useEffect(() => {
    if (isSuperAdmin) {
      apiClient.get("/companies").then((res) => {
        const companiesData = res.data?.data || res.data;
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
      });
    }
  }, [isSuperAdmin]);

  // Set companyId from props
  useEffect(() => {
    form.setValue("companyId", companyId);
  }, [companyId, form]);

  useEffect(() => {
    if (defaultValues) {
      const dept = defaultValues as Partial<Department>;
      const formData = {
        ...defaultValues,
        companyId: defaultValues.companyId || dept.company?.id || companyId,
      };
      form.reset(formData);
    }
  }, [defaultValues, form, companyId]);

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

          <FormField
            control={form.control}
            name="managerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manager ID (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="12"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isSuperAdmin && (
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
          )}
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
