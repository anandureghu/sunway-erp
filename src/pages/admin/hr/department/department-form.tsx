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
import { fetchManagers } from "@/service/employeeService";

interface ManagerOption {
  id: number;
  employeeNo: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
}

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
  const [, setCompanies] = useState<Company[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const isCompanyIdValid = companyId && companyId > 0;

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(DEPARTMENT_SCHEMA),
    defaultValues: {
      departmentCode: "",
      departmentName: "",
      managerId: undefined,
      companyId: isCompanyIdValid ? companyId : Number(user?.companyId),
      ...defaultValues,
    },
  });

  if (!isCompanyIdValid) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Please select a company first.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Company information is required to create a department.
        </p>
      </div>
    );
  }

  useEffect(() => {
    if (isSuperAdmin) {
      apiClient.get("/companies").then((res) => {
        const companiesData = res.data?.data || res.data;
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
      });
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const loadManagers = async () => {
      if (!companyId || companyId <= 0) {
        setManagers([]);
        return;
      }
      
      setLoadingManagers(true);
      try {
        const res = await apiClient.get(`/employees/company/${companyId}`);
        const employees = res.data;
        
        if (employees && Array.isArray(employees)) {
          const managerOptions = employees
            .filter((emp: any) => emp.companyRole === "Manager")
            .map((emp: any) => ({
              id: emp.id,
              employeeNo: emp.employeeNo || '',
              firstName: emp.firstName || '',
              lastName: emp.lastName || '',
              jobTitle: emp.jobTitle || emp.companyRole || 'Manager'
            }));
          setManagers(managerOptions);
        } else {
          setManagers([]);
        }
      } catch (error) {
        console.error("Error loading managers/employees:", error);
        try {
          const managersData = await fetchManagers(companyId);
          if (managersData && Array.isArray(managersData)) {
            setManagers(managersData);
          } else {
            setManagers([]);
          }
        } catch {
          setManagers([]);
        }
      } finally {
        setLoadingManagers(false);
      }
    };

    loadManagers();
  }, [companyId]);

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
                <FormLabel>Manager (Optional)</FormLabel>
                <Select
                  value={field.value ? field.value.toString() : "none"}
                  onValueChange={(v) =>
                    field.onChange(v === "none" ? undefined : Number(v))
                  }
                  disabled={loadingManagers}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingManagers ? "Loading managers..." : "Select Manager"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">-- No Manager --</SelectItem>

                    {managers.map((manager) => (
                      <SelectItem
                        key={manager.id}
                        value={manager.id.toString()}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {manager.firstName} {manager.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {manager.jobTitle || "Manager"} - ID: {manager.employeeNo}
                          </span>
                        </div>
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
