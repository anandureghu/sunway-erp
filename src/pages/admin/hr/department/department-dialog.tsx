"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
import { Textarea } from "@/components/ui/textarea";
import { type DepartmentFormData, DEPARTMENT_SCHEMA } from "@/schema/department";
import { type Department } from "@/types/department";
import { type Division } from "@/types/division";
import { createDepartment, updateDepartment } from "@/service/departmentService";
import { fetchDivisions } from "@/service/divisionService";
import {
  Building2,
  Hash,
  User,
  X,
  Info,
  Layers,
  Network,
} from "lucide-react";

// ── types ─────────────────────────────────────────────────────────────────────
type DepartmentDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  department?: Department | null;
  onSuccess: (dept: Department, mode: "add" | "edit") => void;
  companyId: number;
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  hint,
  icon,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="group space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          {label}
          {required && <span className="ml-0.5 text-rose-400">*</span>}
        </label>
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
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
const fieldCls = (hasIcon = true) =>
  cn(
    "h-10 w-full rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300",
    "outline-none ring-0 transition-all duration-150",
    "focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]",
    hasIcon && "pl-9",
    !hasIcon && "px-3"
  );

// ── main component ────────────────────────────────────────────────────────────
export function DepartmentDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
  companyId,
}: DepartmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const isEdit = !!department;

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(DEPARTMENT_SCHEMA),
    defaultValues: {
      departmentCode: "",
      departmentName: "",
      managerId: undefined,
      divisionId: undefined,
      companyId,
      description: "",
    },
  });

  useEffect(() => {
    if (!open || !companyId) return;
    fetchDivisions(companyId).then((data) => {
      if (Array.isArray(data)) setDivisions(data);
    });
  }, [open, companyId]);

  const { watch } = form;
  const deptName = watch("departmentName");
  const deptCode = watch("departmentCode");

  useEffect(() => {
    if (open) {
      if (isEdit && department) {
        form.reset({
          departmentCode: department.departmentCode ?? "",
          departmentName: department.departmentName ?? "",
          managerId: department.managerId ?? undefined,
          divisionId: department.divisionId ?? undefined,
          companyId: department.companyId ?? companyId,
          description: (department as any).description ?? "",
        });
      } else {
        form.reset({
          departmentCode: "",
          departmentName: "",
          managerId: undefined,
          divisionId: undefined,
          companyId,
          description: "",
        });
      }
    }
  }, [open, department, isEdit, companyId, form]);

  const handleSubmit = async (values: DepartmentFormData) => {
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await updateDepartment(companyId, department!.id, values);
        toast.success("Department updated successfully");
      } else {
        res = await createDepartment(companyId, values);
        toast.success("Department added successfully");
      }
      onSuccess(res, isEdit ? "edit" : "add");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 680, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-violet-100 text-violet-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEdit ? "Edit department" : "Add new department"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEdit
                  ? "Update department details and structure"
                  : "Define a new department within your organization"}
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
        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

              {/* ── Section: Basic info ── */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                    <Building2 className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-700">
                    Basic information
                  </span>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="departmentCode"
                      render={({ field, fieldState }) => (
                        <FormItem className="space-y-0">
                          <Field
                            label="Department code"
                            required
                            hint="Short identifier e.g. FIN, HR, IT"
                            icon={<Hash className="h-[15px] w-[15px]" />}
                            error={fieldState.error?.message}
                          >
                            <FormControl>
                              <Input
                                placeholder="FIN"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                                value={field.value ?? ""}
                                className={cn(fieldCls(), "font-mono")}
                              />
                            </FormControl>
                          </Field>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="departmentName"
                      render={({ field, fieldState }) => (
                        <FormItem className="space-y-0">
                          <Field
                            label="Department name"
                            required
                            icon={<Building2 className="h-[15px] w-[15px]" />}
                            error={fieldState.error?.message}
                          >
                            <FormControl>
                              <Input
                                placeholder="Finance"
                                {...field}
                                value={field.value ?? ""}
                                className={fieldCls()}
                              />
                            </FormControl>
                          </Field>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <Field
                          label="Description"
                          hint="Brief overview of the department's purpose"
                          icon={<Info className="h-[15px] w-[15px]" />}
                        >
                          <FormControl>
                            <Textarea
                              placeholder="Handles all financial operations including bookkeeping, reporting, and compliance..."
                              {...field}
                              rows={3}
                              className="rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] resize-none px-3 py-2"
                              value={field.value ?? ""}
                            />
                          </FormControl>
                        </Field>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ── Section: Management ── */}
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-700">
                    Management
                  </span>
                </div>
                <div className="p-5">
                  <FormField
                    control={form.control}
                    name="managerId"
                    render={({ field }) => (
                      <FormItem className="space-y-0">
                        <Field
                          label="Department manager"
                          hint="Assign a manager to oversee this department"
                          icon={<User className="h-[15px] w-[15px]" />}
                        >
                          <FormControl>
                            <Select
                              value={
                                field.value != null
                                  ? String(field.value)
                                  : "none"
                              }
                              onValueChange={(v) =>
                                field.onChange(
                                  v === "none" ? undefined : Number(v)
                                )
                              }
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-800",
                                  "outline-none ring-0 transition-all duration-150",
                                  "focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]",
                                  "data-[-placeholder]:text-slate-300"
                                )}
                              >
                                <SelectValue placeholder="Select manager (optional)" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                                <SelectItem value="none">
                                  — No manager assigned —
                                </SelectItem>
                                <SelectItem
                                  value="1"
                                  className="rounded-lg py-2.5 text-[13px] focus:bg-slate-50"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-800">
                                      Manager Name
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      Job Title — EMP-001
                                    </span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </Field>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="divisionId"
                    render={({ field }) => (
                      <FormItem className="space-y-0 mt-4">
                        <Field
                          label="Division"
                          hint="Group this department under a division"
                          icon={<Network className="h-[15px] w-[15px]" />}
                        >
                          <FormControl>
                            <Select
                              value={
                                field.value != null
                                  ? String(field.value)
                                  : "none"
                              }
                              onValueChange={(v) =>
                                field.onChange(
                                  v === "none" ? undefined : Number(v)
                                )
                              }
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-800",
                                  "outline-none ring-0 transition-all duration-150",
                                  "focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]",
                                  "data-[-placeholder]:text-slate-300"
                                )}
                              >
                                <SelectValue placeholder="Select division (optional)" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                                <SelectItem value="none">
                                  — No division —
                                </SelectItem>
                                {divisions.map((d) => (
                                  <SelectItem
                                    key={d.id}
                                    value={String(d.id)}
                                    className="rounded-lg py-2.5 text-[13px] focus:bg-slate-50"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium text-slate-800">
                                        {d.name}
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        {d.code}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </Field>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ── Preview card ── */}
              {(deptName || deptCode) && (
                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-300">
                    Preview
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800">
                        {deptName || "—"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {deptCode ? `Code: ${deptCode}` : "No code set"}
                        {isEdit && department?.id ? ` · ID: ${department.id}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
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
              type="button"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={loading}
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {isEdit ? "Saving…" : "Creating…"}
                </span>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create department"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
