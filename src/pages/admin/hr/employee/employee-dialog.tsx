import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Department } from "@/types/department";
import { createEmployeeSchema } from "@/schema/employee";
import type { Employee } from "@/types/hr";

type EmployeeDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  // create mode
  companyId: number;

  // edit mode
  mode?: "create" | "edit";
  employee?: Employee; // admin data
  employeeId?: string;

  presetRole?: "ADMIN" | "HR" | "USER";

  onSuccess: () => void;
};

export function EmployeeDialog({
  open,
  onOpenChange,
  companyId,
  mode = "create",
  employee,
  employeeId,
  presetRole = "ADMIN",
  onSuccess,
}: EmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      employeeNo: "",
      firstName: "",
      lastName: "",
      phoneNo: "",
      email: "",
      username: "",
      password: "",
      departmentId: "",
    },
  });

  // 👉 Pre-fill data when editing
  useEffect(() => {
    if (open && mode === "edit" && employee) {
      form.reset({
        employeeNo: employee.employeeNo ? String(employee.employeeNo) : "",
        firstName: employee.firstName,
        lastName: employee.lastName,
        phoneNo: employee.phoneNo || "",
        email: employee.email,
        username: employee.username,
        password: "", // keep empty, not required
        departmentId: employee.departmentId
          ? String(employee.departmentId)
          : "",
      });
    }
  }, [open, employee, mode]);

  // Auto-generate username
  useEffect(() => {
    if (mode === "edit") return; // no auto-change in edit mode

    const { firstName, lastName } = form.watch();
    if (firstName && lastName) {
      form.setValue(
        "username",
        `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
      );
    }
  }, [form.watch("firstName"), form.watch("lastName")]);

  const fetchDepartments = async () => {
    setDeptLoading(true);
    apiClient
      .get(`/departments/company/${companyId}`)
      .then((res) => setDepartments(res.data))
      .catch(() => toast.error("Failed to load departments"))
      .finally(() => setDeptLoading(false));
  };

  useEffect(() => {
    if (open) fetchDepartments();
  }, [open]);

  type FormValues = {
    employeeNo?: string | number | null;
    firstName: string;
    lastName: string;
    phoneNo?: string | null;
    email: string;
    username: string;
    password?: string | null;
    departmentId?: string | number | null;
  };

  const onSubmit = async (values: FormValues): Promise<void> => {
    setLoading(true);
    const payload = {
      employeeNo: values.employeeNo ? values.employeeNo : null,
      firstName: values.firstName,
      lastName: values.lastName,
      phoneNo: values.phoneNo,
      email: values.email,
      username: values.username,
      password: values.password || null, // if empty, backend should ignore
      companyId,
      departmentId: values.departmentId ? Number(values.departmentId) : null,
      role: presetRole,
    };

    try {
      if (mode === "create") {
        await apiClient.post("/employees", payload);
        toast.success("Admin created successfully");
      } else {
        await apiClient.put(`/employees/${employeeId}`, payload);
        toast.success("Admin updated successfully");
      }

      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      // safe extraction of potential Axios error message
      type ErrWithResponse = { response?: unknown };
      type ResponseWithData = { data?: unknown };
      type DataWithMessage = { message?: string };

      const isErrWithResponse = (e: unknown): e is ErrWithResponse =>
        typeof e === "object" && e !== null && "response" in e;

      const isResponseWithData = (r: unknown): r is ResponseWithData =>
        typeof r === "object" && r !== null && "data" in (r as object);

      const isDataWithMessage = (d: unknown): d is DataWithMessage =>
        typeof d === "object" && d !== null && "message" in (d as object);

      let message: string | undefined;

      if (
        isErrWithResponse(err) &&
        isResponseWithData(err.response) &&
        isDataWithMessage(err.response.data)
      ) {
        message = err.response.data.message;
      } else {
        message = undefined;
      }

      toast.error(message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Company Admin" : "Edit Company Admin"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Number (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="EMP123"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      type="text"
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Only require password in CREATE mode */}
            {mode === "create" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department (optional)</FormLabel>

                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            deptLoading ? "Loading..." : "Select department"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {departments.map((d: Department) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.departmentName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ROLE FIXED */}
            <div>
              <FormLabel>User Role</FormLabel>
              <Input
                disabled
                value={presetRole}
                className="bg-muted/50 font-semibold mt-1"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? mode === "create"
                  ? "Creating..."
                  : "Updating..."
                : mode === "create"
                ? "Create Admin"
                : "Update Admin"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
