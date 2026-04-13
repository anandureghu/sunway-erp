import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";
import { useEditableForm } from "@/modules/hr/hooks/use-editable-form";
import { useParams } from "react-router-dom";
import {
  currentJobService,
  type CurrentJobApiPayload,
} from "@/service/currentJobService";
import { hrService } from "@/service/hr.service";
import { fetchDepartments } from "@/service/departmentService";
import { toast } from "sonner";
import type { CurrentJob } from "@/types/hr";
import type { Department } from "@/types/department";
import { isValidDate } from "@/modules/hr/utils/validation";
import {
  Briefcase,
  Building2,
  Calendar,
  Award,
  MapPin,
  TrendingUp,
  Globe,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { jobCodeService, type JobCode } from "@/service/jobCodeService";
import { useAuth } from "@/context/AuthContext";
import type { CurrentJobCtx } from "../CurrentJobLayout";

/* ================= INITIAL DATA ================= */

const INITIAL_DATA: CurrentJob = {
  jobCode: "",
  departmentCode: "",
  departmentName: "",
  jobTitle: "",
  jobLevel: "",
  grade: "",
  startDate: "",
  effectiveFrom: "",
  expectedEndDate: "",
  workLocation: "",
  workCity: "",
  workCountry: "",
};

interface ValidationErrors {
  [key: string]: string;
}

/* ================= COMPONENT ================= */

export default function CurrentJobForm() {
  const { id } = useParams<{ id: string }>();

  // Better validation for employeeId - ensure it's a valid number
  const employeeId = (() => {
    if (!id || id.trim() === "") return undefined;
    const parsed = Number(id);
    if (isNaN(parsed) || parsed <= 0) {
      console.error("Invalid employee ID:", id);
      return undefined;
    }
    return parsed;
  })();

  const [exists, setExists] = useState(false);
  const [jobCodes, setJobCodes] = useState<JobCode[]>([]);
  const [loadingJobCodes, setLoadingJobCodes] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const savingRef = useRef(false);

  // Get companyId from AuthContext
  const { company } = useAuth();
  const companyId = company?.id ? Number(company.id) : null;

  // Get editing state from layout via Outlet context
  const { editing: externalEditing } = useOutletContext<CurrentJobCtx>();

  const {
    editing,
    formData,
    updateField,
    handleEdit,
    handleSave,
    handleCancel,
  } = useEditableForm<CurrentJob>({
    initialData: INITIAL_DATA,
    externalEditing,
    onSave: async (data) => {
      if (savingRef.current) return;
      savingRef.current = true;

      const errors = validateForm(data);
      if (Object.keys(errors).length > 0) {
        savingRef.current = false;
        throw new Error("Please fix validation errors");
      }

      // Create a local variable with proper type for TypeScript
      const validEmployeeId: number = employeeId as number;
      if (!validEmployeeId || !Number.isFinite(validEmployeeId)) {
        savingRef.current = false;
        console.error("Invalid employee ID for save:", employeeId);
        throw new Error(
          " Invalid employee ID. Please refresh the page and try again.",
        );
      }

      // Find selected job code object
      const selectedJob = jobCodes.find((j) => j.code === data.jobCode);

      // Find selected department object
      const selectedDept = departments.find(
        (d) => d.departmentCode === data.departmentCode,
      );

      if (!selectedJob) {
        savingRef.current = false;
        throw new Error(" Invalid job code selected");
      }

      if (!selectedDept) {
        savingRef.current = false;
        throw new Error(" Invalid department selected");
      }

      const payload: CurrentJobApiPayload = {
        jobCodeId: selectedJob.id,
        departmentId: selectedDept.id,
        workLocation: data.workLocation,
        workCity: data.workCity,
        workCountry: data.workCountry,
        startDate: data.startDate,
        effectiveFrom: data.effectiveFrom,
        expectedEndDate: data.expectedEndDate || undefined,
      };

      try {
        if (exists) {
          await currentJobService.update(validEmployeeId, payload);
        } else {
          await currentJobService.create(validEmployeeId, payload);
        }

        // Sync join date and department to employee profile
        try {
          if (selectedDept || data.startDate) {
            const employeeUpdateData: {
              joinDate?: string;
              departmentId?: number;
            } = {};

            if (data.startDate) {
              employeeUpdateData.joinDate = data.startDate;
            }

            if (selectedDept) {
              employeeUpdateData.departmentId = selectedDept.id;
            }

            if (Object.keys(employeeUpdateData).length > 0) {
              await hrService.updateEmployee(
                validEmployeeId,
                employeeUpdateData,
              );
              toast.success(
                "Employee profile updated with join date and department",
              );

              // Dispatch event to update employee overview in employees-page (listen on window)
              window.dispatchEvent(new CustomEvent("employee:updated"));
            }
          }
        } catch (updateErr: any) {
          console.error("Error updating employee profile:", updateErr);
          // Don't throw here - the current job was saved successfully
          toast.warning(
            "Current job saved but failed to update employee profile",
          );
        }

        const fresh = await currentJobService.get(validEmployeeId);
        if (fresh) {
          const resData = fresh as any;
          // 🔥 Properly map nested API response to flat form fields (same as initial load)
          updateField("jobCode")(resData.job?.code ?? "");
          updateField("jobTitle")(resData.job?.title ?? "");
          updateField("jobLevel")(resData.job?.level ?? "");
          updateField("grade")(resData.job?.grade ?? "");

          updateField("departmentCode")(resData.department?.code ?? "");
          updateField("departmentName")(resData.department?.name ?? "");

          updateField("startDate")(fresh.startDate ?? "");
          updateField("effectiveFrom")(fresh.effectiveFrom ?? "");
          updateField("expectedEndDate")(fresh.expectedEndDate ?? "");

          updateField("workLocation")(fresh.workLocation ?? "");
          updateField("workCity")(fresh.workCity ?? "");
          updateField("workCountry")(fresh.workCountry ?? "");
        }

        // Notify listeners that current job was saved
        window.dispatchEvent(new CustomEvent("current-job:saved"));
      } catch (err: any) {
        toast.error(currentJobService.extractErrorMessage(err));
        savingRef.current = false;
        throw err;
      }

      savingRef.current = false;
    },
  });

  /* ================= LOAD JOB CODES ================= */

  useEffect(() => {
    let mounted = true;

    const fetchJobCodes = async () => {
      try {
        // Use getAll to fetch all job codes (both active and inactive)
        // This ensures users can select from all available job codes
        const codes = await jobCodeService.getAll();
        if (mounted) {
          setJobCodes(codes || []);
        }
      } catch (error: any) {
        console.error("Error loading job codes:", error);
        // Show error toast for debugging
        if (mounted) {
          toast.error(
            error?.response?.data?.message ||
              "Failed to load job codes. Please check your permissions or try again.",
          );
        }
      } finally {
        if (mounted) {
          setLoadingJobCodes(false);
        }
      }
    };

    fetchJobCodes();

    return () => {
      mounted = false;
    };
  }, []);

  /* ================= LOAD DEPARTMENTS ================= */

  useEffect(() => {
    if (!companyId) return;

    const fetchDepartmentsData = async () => {
      try {
        const depts = await fetchDepartments(companyId);
        if (depts) {
          setDepartments(depts);
        }
      } catch (error) {
        console.error("Error loading departments:", error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartmentsData();
  }, [company, companyId]);

  /* ================= LOAD CURRENT JOB ================= */

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;

    (async () => {
      try {
        const res = await currentJobService.get(employeeId);
        if (!mounted || !res) return;

        setExists(true);

        // 🔥 Correct mapping from nested API response
        const resData = res as any;
        updateField("jobCode")(resData.job?.code ?? "");
        updateField("jobTitle")(resData.job?.title ?? "");
        updateField("jobLevel")(resData.job?.level ?? "");
        updateField("grade")(resData.job?.grade ?? "");

        updateField("departmentCode")(resData.department?.code ?? "");
        updateField("departmentName")(resData.department?.name ?? "");

        updateField("startDate")(res.startDate ?? "");
        updateField("effectiveFrom")(res.effectiveFrom ?? "");
        updateField("expectedEndDate")(res.expectedEndDate ?? "");

        updateField("workLocation")(res.workLocation ?? "");
        updateField("workCity")(res.workCity ?? "");
        updateField("workCountry")(res.workCountry ?? "");
      } catch (err) {
        console.error("Error loading current job:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [employeeId, updateField]);

  /* ================= EVENT BRIDGE ================= */

  useEffect(() => {
    document.addEventListener(
      "current-job:start-edit",
      handleEdit as EventListener,
    );
    document.addEventListener("current-job:save", handleSave as EventListener);
    document.addEventListener(
      "current-job:cancel",
      handleCancel as EventListener,
    );

    return () => {
      document.removeEventListener(
        "current-job:start-edit",
        handleEdit as EventListener,
      );
      document.removeEventListener(
        "current-job:save",
        handleSave as EventListener,
      );
      document.removeEventListener(
        "current-job:cancel",
        handleCancel as EventListener,
      );
    };
  }, [handleEdit, handleSave, handleCancel]);

  /* ================= VALIDATION ================= */

  const validateForm = (data: CurrentJob): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!data.jobCode) errors.jobCode = "Job code is required";
    if (!data.departmentCode)
      errors.departmentCode = "Department code is required";
    if (!data.jobTitle) errors.jobTitle = "Job title is required";
    if (!data.workLocation) errors.workLocation = "Work location is required";
    if (!isValidDate(data.startDate))
      errors.startDate = "Valid start date is required";
    if (!isValidDate(data.effectiveFrom))
      errors.effectiveFrom = "Valid effective date is required";
    if (data.expectedEndDate && !isValidDate(data.expectedEndDate)) {
      errors.expectedEndDate = "Invalid end date";
    }

    return errors;
  };

  const errors = validateForm(formData);

  /* ================= HANDLERS ================= */

  const handleJobCodeChange = (value: string) => {
    updateField("jobCode")(value);
    // Auto-populate jobTitle and jobLevel from selected job code
    if (value) {
      const selectedJob = jobCodes.find((j) => j.code === value);
      if (selectedJob) {
        updateField("jobTitle")(selectedJob.title);
        updateField("jobLevel")(selectedJob.level);
        updateField("grade")(selectedJob.grade);
      }
    }
  };

  const handleDepartmentChange = (value: string) => {
    updateField("departmentCode")(value);
    // Auto-populate departmentName from selected department
    if (value) {
      const selectedDept = departments.find((d) => d.departmentCode === value);
      if (selectedDept) {
        updateField("departmentName")(selectedDept.departmentName);
      }
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="bg-slate-50/60 min-h-screen p-5 space-y-5">

      {/* ── Page header ── */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600" />
        <div className="flex items-center gap-4 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-md">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Current Job</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage employment position, department, and work location details
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI summary strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Position"
          value={formData.jobTitle || "—"}
          accent="text-violet-600 bg-violet-50 border-violet-100"
        />
        <KpiCard
          icon={<Building2 className="h-4 w-4" />}
          label="Department"
          value={formData.departmentName || formData.departmentCode || "—"}
          accent="text-emerald-600 bg-emerald-50 border-emerald-100"
        />
        <KpiCard
          icon={<Calendar className="h-4 w-4" />}
          label="Start Date"
          value={
            formData.startDate
              ? new Date(formData.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "—"
          }
          accent="text-amber-600 bg-amber-50 border-amber-100"
        />
        <KpiCard
          icon={<MapPin className="h-4 w-4" />}
          label="Work Location"
          value={formData.workLocation || "—"}
          accent="text-blue-600 bg-blue-50 border-blue-100"
        />
      </div>

      {/* ── Position Details ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHeading
          icon={<LayoutGrid className="h-3.5 w-3.5" />}
          label="Position Details"
          accent="from-violet-600 to-blue-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Job Code */}
          <Field label="Job Code" required error={errors.jobCode}>
            {loadingJobCodes ? (
              <Input className={fieldCls} disabled placeholder="Loading job codes…" />
            ) : jobCodes.length > 0 ? (
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select value={formData.jobCode} onValueChange={handleJobCodeChange}>
                  <SelectTrigger className={cn(fieldCls, "pl-9")} disabled={!editing}>
                    <SelectValue placeholder="Select job code" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobCodes.map((jc) => (
                      <SelectItem key={jc.id} value={jc.code}>
                        {jc.code} — {jc.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className={cn(fieldCls, "pl-9")}
                    disabled={!editing}
                    value={formData.jobCode}
                    onChange={(e) => updateField("jobCode")(e.target.value)}
                    placeholder="e.g., JD001"
                  />
                </div>
                <p className="text-[11px] text-amber-600 mt-1">No job codes configured — enter manually.</p>
              </>
            )}
          </Field>

          {/* Job Title */}
          <Field label="Job Title" required error={errors.jobTitle}>
            <div className="relative">
              <Award className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.jobTitle}
                onChange={(e) => updateField("jobTitle")(e.target.value)}
                placeholder="e.g., Senior Developer"
              />
            </div>
          </Field>

          {/* Job Level */}
          <Field label="Job Level">
            <div className="relative">
              <TrendingUp className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.jobLevel}
                onChange={(e) => updateField("jobLevel")(e.target.value)}
                placeholder="e.g., Senior, Manager"
              />
            </div>
          </Field>
        </div>
      </div>

      {/* ── Department ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHeading
          icon={<Building2 className="h-3.5 w-3.5" />}
          label="Department"
          accent="from-emerald-500 to-teal-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Department Code */}
          <Field label="Department" required error={errors.departmentCode}>
            {loadingDepartments ? (
              <Input className={fieldCls} disabled placeholder="Loading departments…" />
            ) : (
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select value={formData.departmentCode} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className={cn(fieldCls, "pl-9")} disabled={!editing}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.departmentCode}>
                        {dept.departmentCode} — {dept.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </Field>

          {/* Department Name (auto-filled, editable) */}
          <Field label="Department Name">
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.departmentName}
                onChange={(e) => updateField("departmentName")(e.target.value)}
                placeholder="Auto-filled from selection"
              />
            </div>
          </Field>

          {/* Grade */}
          <Field label="Grade">
            <div className="relative">
              <Award className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.grade}
                onChange={(e) => updateField("grade")(e.target.value)}
                placeholder="e.g., Grade 5"
              />
            </div>
          </Field>
        </div>
      </div>

      {/* ── Dates ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHeading
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Employment Dates"
          accent="from-amber-500 to-orange-500"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Start Date" required error={errors.startDate}>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.startDate}
                onChange={(e) => updateField("startDate")(e.target.value)}
              />
            </div>
          </Field>

          <Field label="Effective From" required error={errors.effectiveFrom}>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.effectiveFrom}
                onChange={(e) => updateField("effectiveFrom")(e.target.value)}
              />
            </div>
          </Field>

          <Field label="Expected End Date" error={errors.expectedEndDate}>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.expectedEndDate}
                onChange={(e) => updateField("expectedEndDate")(e.target.value)}
              />
            </div>
            {!errors.expectedEndDate && (
              <p className="text-[11px] text-muted-foreground mt-0.5">Optional — leave blank for open-ended contracts</p>
            )}
          </Field>
        </div>
      </div>

      {/* ── Work Location ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHeading
          icon={<Globe className="h-3.5 w-3.5" />}
          label="Work Location"
          accent="from-blue-500 to-indigo-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Work Location" required error={errors.workLocation}>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.workLocation}
                onChange={(e) => updateField("workLocation")(e.target.value)}
                placeholder="Office / Remote / Hybrid"
              />
            </div>
          </Field>

          <Field label="Work City">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.workCity}
                onChange={(e) => updateField("workCity")(e.target.value)}
                placeholder="e.g., Kuala Lumpur"
              />
            </div>
          </Field>

          <Field label="Work Country">
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.workCountry}
                onChange={(e) => updateField("workCountry")(e.target.value)}
                placeholder="e.g., Malaysia"
              />
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */

/** Shared input class — consistent across all fields */
const fieldCls =
  "h-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors";

function SectionHeading({
  icon,
  label,
  accent = "from-violet-600 to-blue-600",
}: {
  icon: React.ReactNode;
  label: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white", accent)}>
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border p-3.5 bg-white shadow-sm", accent)}>
      <div className={cn("shrink-0", accent.split(" ")[0])}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-rose-500">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
