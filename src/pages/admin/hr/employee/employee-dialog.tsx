"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { createEmployeeSchema } from "@/schema/employee";
import { type Employee } from "@/types/hr";
import type { z } from "zod";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  AtSign,
  ShieldCheck,
  Hash,
  UserPlus,
  UserCog,
} from "lucide-react";

import { Label } from "@/components/ui/label";

// ── helpers ───────────────────────────────────────────────────────────────────
const getInitials = (first?: string, last?: string) => {
  const f = (first ?? "").trim()[0] ?? "";
  const l = (last  ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "?";
};

// ✅ Fixed: hardcoded Spring Security roles only
const SECURITY_ROLES = [
  { label: "Admin",           value: "ADMIN"           },
  { label: "HR",              value: "HR"              },
  { label: "User",            value: "USER"            },
  { label: "Finance Manager", value: "FINANCE_MANAGER" },
  { label: "Accountant",      value: "ACCOUNTANT"      },
  { label: "Cashier",         value: "CASHIER"         },
  { label: "Super Admin",     value: "SUPER_ADMIN"     },
];

// ── sub-components ────────────────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 pt-1">
    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

const FieldIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
    {children}
  </span>
);

// ── types ─────────────────────────────────────────────────────────────────────
type EmployeeDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: number;
  mode?: "create" | "edit";
  employee?: Employee;
  employeeId?: string;
  presetRole?: "ADMIN" | "HR" | "USER";
  onSuccess: () => void;
};

type FormValues = z.infer<typeof createEmployeeSchema>;

// ── main component ────────────────────────────────────────────────────────────
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

  const form = useForm<FormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      firstName:    "",
      lastName:     "",
      email:        "",
      username:     "",
      password:     "",
      role:         presetRole,
    },
  });

  const { watch } = form;
  const firstName = watch("firstName");
  const lastName  = watch("lastName");
  const initials  = getInitials(firstName, lastName);
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || (mode === "edit" ? "Employee" : "New Employee");

// Pre-fill on edit
  useEffect(() => {
    if (open && mode === "edit" && employee) {
      form.reset({
        firstName:    employee.firstName,
        lastName:     employee.lastName,
        email:        employee.email,
        username:     employee.username,
        password:     "",
        role:         (employee.role as string) ?? presetRole,
      });
    }
    if (open && mode === "create") {
      form.reset({
        firstName:    "",
        lastName:     "",
        email:        "",
        username:     "",
        password:     "",
        role:         presetRole,
      });
    }
  }, [open, employee, mode]);

  // Auto-generate username in create mode
  useEffect(() => {
    if (mode === "edit") return;
    if (firstName && lastName) {
// Username format: firstName[0].lastName (e.g., "j.doe")
      form.setValue("username", `${firstName.toLowerCase().charAt(0)}.${lastName.toLowerCase()}`);
    }
  }, [firstName, lastName]);

const onSubmit = async (values: FormValues): Promise<void> => {
    setLoading(true);
    const payload = {
      firstName:    values.firstName,
      lastName:     values.lastName,
      email:        values.email,
      username:     values.username,
      companyId,
      role:         values.role || presetRole,
    };

    try {
      if (mode === "create") {
        await apiClient.post("/employees", payload);
        toast.success("Employee created successfully");
      } else {
        await apiClient.put(`/employees/${employeeId}`, payload);
        toast.success("Employee updated successfully");
      }
      onSuccess();
    } catch (err: unknown) {
      type ErrWithResponse = { response?: unknown };
      type ResponseWithData = { data?: unknown };
      type DataWithMessage  = { message?: string };

      const isErrWithResponse  = (e: unknown): e is ErrWithResponse  =>
        typeof e === "object" && e !== null && "response" in e;
      const isResponseWithData = (r: unknown): r is ResponseWithData =>
        typeof r === "object" && r !== null && "data" in (r as object);
      const isDataWithMessage  = (d: unknown): d is DataWithMessage  =>
        typeof d === "object" && d !== null && "message" in (d as object);

      let message: string | undefined;
      if (
        isErrWithResponse(err) &&
        isResponseWithData(err.response) &&
        isDataWithMessage(err.response.data)
      ) {
        message = err.response.data.message;
      }
      toast.error(message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 overflow-hidden rounded-2xl p-0">
        {/* ── gradient header ── */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600 px-7 py-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-2 text-white text-lg font-bold">
              {mode === "create"
                ? <><UserPlus className="h-5 w-5" /> Add New Employee</>
                : <><UserCog  className="h-5 w-5" /> Edit Employee</>}
            </DialogTitle>
            <p className="text-sm text-white/75 mt-0.5">
              {mode === "create"
                ? "Fill in the details below to onboard a new team member."
                : "Update the employee's information and save changes."}
            </p>
          </DialogHeader>

          {/* Live avatar preview */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-2 ring-white/40 text-white font-bold text-xl select-none backdrop-blur-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white text-base leading-tight">
                {fullName}
              </p>
              <p className="text-xs text-white/65 mt-0.5">
                username and password are auto-generated
              </p>
            </div>
          </div>
        </div>

        {/* ── form body ── */}
        <div className="max-h-[60vh] overflow-y-auto px-7 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Section: Basic Info */}
              <SectionLabel>Basic Information</SectionLabel>

              {/* First + Last name (2-col) */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required className="text-xs font-semibold text-gray-700">First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FieldIcon><User className="h-4 w-4" /></FieldIcon>
                          <Input
                            placeholder="John"
                            {...field}
                            className="pl-9 h-9 rounded-lg border-violet-200/80 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required className="text-xs font-semibold text-gray-700">Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FieldIcon><User className="h-4 w-4" /></FieldIcon>
                          <Input
                            placeholder="Doe"
                            {...field}
                            className="pl-9 h-9 rounded-lg border-violet-200/80 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

{/* Employee No - using standard Input since employeeNo is not in the form schema */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Employee Number <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <FieldIcon><Hash className="h-4 w-4" /></FieldIcon>
                  <Input
                    placeholder="e.g. EMP-001"
                    className="pl-9 h-9 rounded-lg border-violet-200/80 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 font-mono"
                  />
                </div>
              </div>

              {/* Section: Account */}
              <SectionLabel>Account Details</SectionLabel>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-700">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FieldIcon><Mail className="h-4 w-4" /></FieldIcon>
                        <Input
                          type="email"
                          placeholder="john.doe@company.com"
                          {...field}
                          className="pl-9 h-9 rounded-lg border-violet-200/80 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

{/* Username (auto-generated) */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-700">Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <FieldIcon><AtSign className="h-4 w-4" /></FieldIcon>
                        <Input
placeholder="j.doe"
                          {...field}
                          className="pl-9 h-9 rounded-lg border-violet-200/80 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Password info - auto-generated on backend */}
              {mode === "create" && (
                <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Password will be auto-generated and sent to the employee's email.
                </div>
              )}

{/* Section: Role */}
              <SectionLabel>System Role</SectionLabel>

{/* System role - default is ADMIN */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required className="text-xs font-semibold text-gray-700">System Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue="ADMIN">
                      <FormControl>
                        <SelectTrigger className={cn(
                          "h-9 rounded-lg border-violet-200/80 pl-3",
                          "focus:border-violet-400 focus:ring-violet-400/30"
                        )}>
                          <ShieldCheck className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                          <SelectValue placeholder="Select system role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SECURITY_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="mt-2 h-10 w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-sm font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-blue-700 hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    {mode === "create" ? "Creating…" : "Saving…"}
                  </>
                ) : mode === "create" ? (
                  <><UserPlus className="mr-1.5 h-4 w-4" /> Create Employee</>
                ) : (
                  <><UserCog className="mr-1.5 h-4 w-4" /> Save Changes</>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
