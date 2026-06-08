"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/service/apiClient";
import { roleService, type RoleResponse } from "@/service/roleService";
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
} from "@/components/ui/form";
import { createEmployeeSchema } from "@/schema/employee";
import { type Employee } from "@/types/hr";
import type { z } from "zod";
import {
  User,
  AtSign,
  ShieldCheck,
  Hash,
  UserPlus,
  UserCog,
  Lock,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────
const getInitials = (first?: string, last?: string) => {
  const f = (first ?? "").trim()[0] ?? "";
  const l = (last ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "?";
};


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

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  hint,
  badge,
  icon,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  badge?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="group space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
          {required && <span className="ml-0.5 text-rose-400">*</span>}
        </label>
        {badge && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            <Sparkles className="h-2.5 w-2.5" />
            {badge}
          </span>
        )}
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-500">
            {icon}
          </span>
        )}
        {children}
      </div>
      {hint && !error && (
        <p className="text-[11px] text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-400">{error}</p>
      )}
    </div>
  );
}

// ── Styled input ──────────────────────────────────────────────────────────────
const fieldClass = (hasIcon = true, disabled = false) =>
  cn(
    "h-10 w-full rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300",
    "outline-none ring-0 transition-all duration-150",
    "focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]",
    hasIcon && "pl-9",
    !hasIcon && "px-3",
    disabled && "cursor-not-allowed opacity-50"
  );

// ── main component ────────────────────────────────────────────────────────────
export function EmployeeDialog({
  open,
  onOpenChange,
  companyId,
  mode = "create",
  employee,
  employeeId,
  // `presetRole` is accepted for backwards-compat with callers that still pass
  // the old Spring-Security role enum, but the dropdown now lists company
  // roles fetched from /api/roles, so the preset is no longer used as a default.
  presetRole = "ADMIN",
  onSuccess,
}: EmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [companyRoles, setCompanyRoles] = useState<RoleResponse[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      role: "",
    },
  });

  // Fetch this company's active roles (the ones created in Settings → Roles)
  // so the dropdown reflects what HR has configured, not a hardcoded list.
  useEffect(() => {
    if (!open || !companyId) return;
    let cancelled = false;
    setRolesLoading(true);
    roleService
      .getActiveRoles(companyId)
      .then((roles) => {
        if (!cancelled) {
          setCompanyRoles(roles);
          if (mode === "create" && presetRole) {
            const match = roles.find(
              (r) => r.name.toLowerCase() === presetRole.toLowerCase(),
            );
            if (match) {
              form.setValue("role", match.name);
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompanyRoles([]);
          toast.error("Failed to load roles for this company");
        }
      })
      .finally(() => {
        if (!cancelled) setRolesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, companyId, mode, presetRole, form]);

  const roleOptions = useMemo(
    () =>
      companyRoles.map((r) => ({
        label: r.name,
        value: r.name,
        description: r.description ?? "Company-defined role",
      })),
    [companyRoles]
  );

  const { watch } = form;
  const firstName = watch("firstName");
  const lastName = watch("lastName");
  const initials = getInitials(firstName, lastName);

  const avatarColors: Record<string, string> = {
    A: "bg-rose-100 text-rose-600",
    B: "bg-orange-100 text-orange-600",
    C: "bg-amber-100 text-amber-600",
    D: "bg-lime-100 text-lime-700",
    E: "bg-emerald-100 text-emerald-700",
    F: "bg-teal-100 text-teal-700",
    G: "bg-cyan-100 text-cyan-700",
    H: "bg-sky-100 text-sky-700",
    I: "bg-blue-100 text-blue-700",
    J: "bg-indigo-100 text-indigo-700",
    K: "bg-violet-100 text-violet-700",
    L: "bg-purple-100 text-purple-700",
    M: "bg-fuchsia-100 text-fuchsia-700",
    N: "bg-pink-100 text-pink-700",
    "?": "bg-slate-100 text-slate-400",
  };
  const avatarColor =
    avatarColors[initials[0]] ?? "bg-slate-100 text-slate-500";

  useEffect(() => {
    if (open && mode === "edit" && employee) {
      form.reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        username: employee.username,
        password: "",
        // Prefill with the employee's company role (the HR-defined one).
        // Fall back to the legacy system role only if no company role is set.
        role: employee.companyRole ?? (employee.role as string) ?? "",
      });
    }
    if (open && mode === "create") {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        password: "",
        role: "",
      });
    }
  }, [open, employee, mode]);

  useEffect(() => {
    if (mode === "edit") return;
    if (firstName && lastName) {
      form.setValue(
        "username",
        `${firstName.toLowerCase().charAt(0)}.${lastName.toLowerCase()}`
      );
    } else {
      form.setValue("username", "");
    }
  }, [firstName, lastName, mode]);

  const onSubmit = async (values: FormValues): Promise<void> => {
    setLoading(true);

    // The dropdown now lists company roles (from /api/roles), so the selected
    // value is a CompanyRole name. Send it as `companyRole` (and the matching
    // `companyRoleId` when we have it). The Spring Security `role` enum is
    // left at the backend's default (USER) unless an admin overrides it
    // elsewhere — HR shouldn't be picking it from this dialog.
    const selectedRole = companyRoles.find((r) => r.name === values.role);

    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || undefined,
      username: values.username,
      companyId,
      companyRole: values.role || undefined,
      companyRoleId: selectedRole?.id,
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
      }
      toast.error(message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 780, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20",
                avatarColor
              )}
            >
              {initials}
            </div>

            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {mode === "create" ? "Add new employee" : "Edit employee"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {mode === "create"
                  ? "Fill in the details to onboard a new team member"
                  : "Update this employee's profile and permissions"}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto bg-white" style={{ maxHeight: "calc(92vh - 132px)" }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Two column grid */}
              <div className="grid grid-cols-2 divide-x divide-slate-200 border-y border-slate-200">

                {/* ── Left column ── */}
                <div className="space-y-5 px-6 py-6">
                  {/* Section heading */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Personal info
                    </span>
                  </div>

                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-0">
                        <Field
                          label="First name"
                          required
                          icon={<User className="h-[15px] w-[15px]" />}
                          error={fieldState.error?.message}
                        >
                          <FormControl>
                            <Input
                              placeholder="John"
                              {...field}
                              className={fieldClass()}
                            />
                          </FormControl>
                        </Field>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-0">
                        <Field
                          label="Last name"
                          required
                          icon={<User className="h-[15px] w-[15px]" />}
                          error={fieldState.error?.message}
                        >
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              {...field}
                              className={fieldClass()}
                            />
                          </FormControl>
                        </Field>
                      </FormItem>
                    )}
                  />

                  <Field
                    label="Employee number"
                    hint="Optional identifier for your records"
                    icon={<Hash className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      placeholder="EMP-001"
                      className={cn(fieldClass(), "font-mono")}
                    />
                  </Field>

                  {/* Divider */}
                  <div className="!mt-7 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Access & permissions
                    </span>
                  </div>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field, fieldState }) => {
                      const hasRoles = roleOptions.length > 0;
                      const placeholder = rolesLoading
                        ? "Loading roles…"
                        : hasRoles
                        ? "Select a role"
                        : "No roles configured — add one in Settings → Roles";
                      return (
                        <FormItem className="space-y-0">
                          <Field
                            label="Role"
                            required
                            hint="Pulled from your company's roles (Settings → Roles)"
                            error={fieldState.error?.message}
                          >
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={rolesLoading || !hasRoles}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={cn(
                                    "h-10 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-3 text-[13px] text-slate-800",
                                    "outline-none ring-0 transition-all duration-150",
                                    "focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]",
                                    "data-[-placeholder]:text-slate-300"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-[15px] w-[15px] shrink-0 text-slate-300" />
                                    <SelectValue placeholder={placeholder} />
                                  </div>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                                {roleOptions.map((r) => (
                                  <SelectItem
                                    key={r.value}
                                    value={r.value}
                                    className="rounded-lg py-2.5 text-[13px] focus:bg-slate-50"
                                  >
                                    <div>
                                      <p className="font-medium text-slate-800">{r.label}</p>
                                      <p className="text-[11px] text-slate-400">{r.description}</p>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* ── Right column ── */}
                <div className="space-y-5 px-6 py-6">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
                      <Lock className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Account credentials
                    </span>
                  </div>

                  {/* Email is auto-generated on the backend, so the field is hidden. */}

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-0">
                        <Field
                          label="Username"
                          badge="auto-generated"
                          hint="Generated from name — you can edit this"
                          icon={<AtSign className="h-[15px] w-[15px]" />}
                          error={fieldState.error?.message}
                        >
                          <FormControl>
                            <Input
                              placeholder="j.doe"
                              {...field}
                              className={fieldClass()}
                            />
                          </FormControl>
                        </Field>
                      </FormItem>
                    )}
                  />

                  <Field
                    label="Password"
                    badge="auto-generated"
                    hint="A secure password is sent to the employee's email"
                    icon={<Lock className="h-[15px] w-[15px]" />}
                  >
                    <Input
                      value="Auto-generated"
                      disabled
                      className={fieldClass()}
                    />
                  </Field>

                  {/* Info card */}
                  <div className="!mt-8 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200">
                        <span className="text-[10px] font-bold text-slate-500">i</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[12px] font-medium text-slate-600">
                          What happens after creation?
                        </p>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          The employee will receive a welcome email with their login credentials. They can change their password on first login.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Preview card — shows filled data */}
                  {(firstName || lastName) && (
                    <div className="!mt-2 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-300">
                        Preview
                      </p>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                            avatarColor
                          )}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-slate-800">
                            {[firstName, lastName].filter(Boolean).join(" ") || "—"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {watch("username") ? `@${watch("username")}` : "username pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <p className="text-[11px] text-slate-500">
                  Fields marked <span className="text-rose-400">*</span> are required
                </p>
                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {mode === "create" ? "Creating…" : "Saving…"}
                      </span>
                    ) : mode === "create" ? (
                      <span className="flex items-center gap-2">
                        <UserPlus className="h-3.5 w-3.5" />
                        Create employee
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserCog className="h-3.5 w-3.5" />
                        Save changes
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}