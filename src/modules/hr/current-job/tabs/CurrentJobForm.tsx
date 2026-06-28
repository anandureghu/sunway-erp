import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import CountrySelect from "@/components/country-select";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState, useRef } from "react";
import { useEditableForm } from "@/modules/hr/hooks/use-editable-form";
import { useParams } from "react-router-dom";
import {
  currentJobService,
  type CurrentJobApiPayload,
} from "@/service/currentJobService";
import { hrService } from "@/service/hr.service";
import { fetchDepartments } from "@/service/departmentService";
import { fetchDivisionsByDepartment } from "@/service/divisionService";
import { fetchEmployees } from "@/service/employeeService";
import { toast } from "sonner";
import {
  EMPLOYMENT_CATEGORY_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  type CurrentJob,
  type EmploymentCategory,
  type EmploymentType,
} from "@/types/hr";
import type { Department } from "@/types/department";
import type { Division } from "@/types/division";
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
  Users,
  ShieldCheck,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { jobCodeService, type JobCode } from "@/service/jobCodeService";
import { useAuth } from "@/context/AuthContext";
import type { CurrentJobCtx } from "../CurrentJobLayout";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

/* ================= INITIAL DATA ================= */

const INITIAL_DATA: CurrentJob = {
  jobCode: "",
  departmentCode: "",
  departmentName: "",
  divisionId: null,
  divisionCode: "",
  divisionName: "",
  jobTitle: "",
  jobLevel: "",
  salaryGrade: "",
  minSalary: null,
  maxSalary: null,
  startDate: "",
  effectiveFrom: "",
  expectedEndDate: "",
  workLocation: "",
  workCity: "",
  workCountry: "",
  employmentCategory: "",
  employmentType: "",
  reportingManagerId: null,
  reportingManagerName: "",
  reportingManagerEmployeeNo: "",
  contractStartDate: "",
  contractEndDate: "",
};

interface ValidationErrors {
  [key: string]: string;
}

type EmployeeOption = {
  id: number;
  firstName?: string;
  lastName?: string;
  employeeNo?: string;
  fullName?: string;
};

/* ================= COMPONENT ================= */

export default function CurrentJobForm() {
  const { id } = useParams<{ id: string }>();

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
  const [departmentDivisions, setDepartmentDivisions] = useState<Division[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [managerCandidates, setManagerCandidates] = useState<EmployeeOption[]>(
    [],
  );
  const savingRef = useRef(false);

  const { company } = useAuth();
  const companyId = company?.id ? Number(company.id) : null;

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

      const validEmployeeId: number = employeeId as number;
      if (!validEmployeeId || !Number.isFinite(validEmployeeId)) {
        savingRef.current = false;
        console.error("Invalid employee ID for save:", employeeId);
        throw new Error(
          " Invalid employee ID. Please refresh the page and try again.",
        );
      }

      const selectedJob = jobCodes.find((j) => j.code === data.jobCode);
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

      const category = (data.employmentCategory || undefined) as
        | EmploymentCategory
        | undefined;
      const isContractual = category && category !== "PERMANENT";

      const payload: CurrentJobApiPayload = {
        jobCodeId: selectedJob.id,
        departmentId: selectedDept.id,
        divisionId: data.divisionId ?? null,
        workLocation: data.workLocation,
        workCity: data.workCity,
        workCountry: data.workCountry,
        startDate: data.startDate,
        effectiveFrom: data.effectiveFrom,
        expectedEndDate: data.expectedEndDate || undefined,
        employmentCategory: category,
        employmentType: (data.employmentType || undefined) as
          | EmploymentType
          | undefined,
        reportingManagerId: data.reportingManagerId ?? null,
        contractStartDate: isContractual
          ? data.contractStartDate || undefined
          : undefined,
        contractEndDate: isContractual
          ? data.contractEndDate || undefined
          : undefined,
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
              window.dispatchEvent(new CustomEvent("employee:updated"));
            }
          }
        } catch (updateErr: any) {
          console.error("Error updating employee profile:", updateErr);
          toast.warning(
            "Current job saved but failed to update employee profile",
          );
        }

        const fresh = await currentJobService.get(validEmployeeId);
        if (fresh) {
          applyServerResponse(fresh);
        }

        window.dispatchEvent(new CustomEvent("current-job:saved"));
      } catch (err: any) {
        toast.error(currentJobService.extractErrorMessage(err));
        savingRef.current = false;
        throw err;
      }

      savingRef.current = false;
    },
  });

  /* ================= HELPERS ================= */

  const applyServerResponse = (res: any) => {
    const resData = res as any;
    updateField("jobCode")(resData.job?.code ?? "");
    updateField("jobTitle")(resData.job?.title ?? "");
    updateField("jobLevel")(resData.job?.level ?? "");
    updateField("salaryGrade")(resData.job?.salaryGrade ?? "");
    updateField("minSalary")(resData.job?.minSalary ?? null);
    updateField("maxSalary")(resData.job?.maxSalary ?? null);

    updateField("departmentCode")(resData.department?.code ?? "");
    updateField("departmentName")(resData.department?.name ?? "");
    const divisionId = resData.department?.divisionId ?? null;
    updateField("divisionId")(divisionId);
    updateField("divisionCode")(resData.department?.divisionCode ?? "");
    updateField("divisionName")(resData.department?.divisionName ?? "");

    const deptId = resData.department?.id;
    if (deptId) {
      void loadDivisionsForDepartment(deptId);
    } else {
      setDepartmentDivisions([]);
    }

    updateField("startDate")(res.startDate ?? "");
    updateField("effectiveFrom")(res.effectiveFrom ?? "");
    updateField("expectedEndDate")(res.expectedEndDate ?? "");

    updateField("workLocation")(res.workLocation ?? "");
    updateField("workCity")(res.workCity ?? "");
    updateField("workCountry")(res.workCountry ?? "");

    updateField("employmentCategory")(res.employmentCategory ?? "");
    updateField("employmentType")(res.employmentType ?? "");
    updateField("reportingManagerId")(res.reportingManagerId ?? null);
    updateField("reportingManagerName")(res.reportingManagerName ?? "");
    updateField("reportingManagerEmployeeNo")(
      res.reportingManagerEmployeeNo ?? "",
    );
    updateField("contractStartDate")(res.contractStartDate ?? "");
    updateField("contractEndDate")(res.contractEndDate ?? "");
  };

  /* ================= LOAD JOB CODES ================= */

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Active job codes are reference data for the designation picker. Use
        // the /active endpoint (viewable by employees), not getAll() which needs
        // HR_SETTINGS view-all.
        const codes = await jobCodeService.getActive();
        if (mounted) setJobCodes(codes || []);
      } catch (error: any) {
        // A user without job-code read access still gets the form — it falls
        // back to a free-text job-code entry. Don't alarm them with an error.
        console.error("Error loading job codes:", error);
        if (mounted) setJobCodes([]);
      } finally {
        if (mounted) setLoadingJobCodes(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ================= LOAD DEPARTMENTS ================= */

  useEffect(() => {
    if (!companyId) return;

    (async () => {
      try {
        const depts = await fetchDepartments(companyId);
        if (depts) setDepartments(depts);
      } catch (error) {
        console.error("Error loading departments:", error);
      } finally {
        setLoadingDepartments(false);
      }
    })();
  }, [company, companyId]);

  /* ================= LOAD EMPLOYEES (manager candidates) ================= */

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchEmployees();
        if (mounted && Array.isArray(data)) setManagerCandidates(data);
      } catch (error) {
        console.error("Error loading manager candidates:", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ================= LOAD CURRENT JOB ================= */

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;

    (async () => {
      try {
        const res = await currentJobService.get(employeeId);
        if (!mounted || !res) return;

        setExists(true);
        applyServerResponse(res);
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

    const isContractual =
      data.employmentCategory && data.employmentCategory !== "PERMANENT";
    if (isContractual) {
      if (!isValidDate(data.contractStartDate ?? "")) {
        errors.contractStartDate =
          "Contract start date is required for non-permanent employment";
      }
      if (!isValidDate(data.contractEndDate ?? "")) {
        errors.contractEndDate =
          "Contract end date is required for non-permanent employment";
      }
      if (
        isValidDate(data.contractStartDate ?? "") &&
        isValidDate(data.contractEndDate ?? "") &&
        (data.contractStartDate ?? "") > (data.contractEndDate ?? "")
      ) {
        errors.contractEndDate =
          "Contract end date must be on or after the start date";
      }
    }

    if (
      data.reportingManagerId != null &&
      employeeId != null &&
      data.reportingManagerId === employeeId
    ) {
      errors.reportingManagerId =
        "Reporting manager cannot be the employee themselves";
    }

    return errors;
  };

  const errors = validateForm(formData);

  /* ================= HANDLERS ================= */

  const handleJobCodeChange = (value: string) => {
    updateField("jobCode")(value);
    if (value) {
      const selectedJob = jobCodes.find((j) => j.code === value);
      if (selectedJob) {
        updateField("jobTitle")(selectedJob.title);
        updateField("jobLevel")(selectedJob.level);
        updateField("salaryGrade")(selectedJob.salaryGrade);
        updateField("minSalary")(selectedJob.minSalary ?? null);
        updateField("maxSalary")(selectedJob.maxSalary ?? null);
      }
    }
  };

  const loadDivisionsForDepartment = async (departmentId: number) => {
    setLoadingDivisions(true);
    try {
      const divisions = await fetchDivisionsByDepartment(departmentId);
      setDepartmentDivisions(divisions);
    } finally {
      setLoadingDivisions(false);
    }
  };

  const handleDepartmentChange = (value: string) => {
    updateField("departmentCode")(value);
    updateField("divisionId")(null);
    updateField("divisionCode")("");
    updateField("divisionName")("");
    setDepartmentDivisions([]);

    if (value) {
      const selectedDept = departments.find((d) => d.departmentCode === value);
      if (selectedDept) {
        updateField("departmentName")(selectedDept.departmentName);
        void loadDivisionsForDepartment(selectedDept.id);
      }
    }
  };

  const handleDivisionChange = (value: string) => {
    if (value === "none") {
      updateField("divisionId")(null);
      updateField("divisionCode")("");
      updateField("divisionName")("");
      return;
    }

    const selectedDivision = departmentDivisions.find(
      (d) => String(d.id) === value,
    );
    if (selectedDivision) {
      updateField("divisionId")(selectedDivision.id);
      updateField("divisionCode")(selectedDivision.code);
      updateField("divisionName")(selectedDivision.name);
    }
  };

  const isContractual =
    !!formData.employmentCategory && formData.employmentCategory !== "PERMANENT";

  const managerLabel = useMemo(() => {
    if (formData.reportingManagerId == null) return "";
    const m = managerCandidates.find(
      (e) => e.id === formData.reportingManagerId,
    );
    if (!m) {
      return formData.reportingManagerName || "";
    }
    const name = [m.firstName, m.lastName].filter(Boolean).join(" ");
    return name || (m.fullName ?? "");
  }, [
    managerCandidates,
    formData.reportingManagerId,
    formData.reportingManagerName,
  ]);

  /* ================= RENDER ================= */

  return (
    <div className="bg-slate-50/60 min-h-screen space-y-5">
      <SecondaryPageHeader
        title="Current Job"
        description="Manage employment position, department, and work location details"
        icon={<Briefcase className="h-5 w-5 text-white" />}
      />

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
              ? new Date(formData.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
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
          <Field label="Job Code" required error={errors.jobCode}>
            {loadingJobCodes ? (
              <Input
                className={fieldCls}
                disabled
                placeholder="Loading job codes…"
              />
            ) : jobCodes.length > 0 ? (
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.jobCode}
                  onValueChange={handleJobCodeChange}
                >
                  <SelectTrigger
                    className={cn(fieldCls, "pl-9")}
                    disabled={!editing}
                  >
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
                <p className="text-[11px] text-amber-600 mt-1">
                  No job codes configured — enter manually.
                </p>
              </>
            )}
          </Field>

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

          <Field label="Salary Grade">
            <div className="relative">
              <Award className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className={cn(fieldCls, "pl-9")}
                disabled={!editing}
                value={formData.salaryGrade}
                onChange={(e) => updateField("salaryGrade")(e.target.value)}
                placeholder="e.g., G3"
              />
            </div>
          </Field>

          <Field label="Min Salary">
            <Input
              type="number"
              className={fieldCls}
              disabled
              value={formData.minSalary ?? ""}
              placeholder="From job code"
            />
          </Field>

          <Field label="Max Salary">
            <Input
              type="number"
              className={fieldCls}
              disabled
              value={formData.maxSalary ?? ""}
              placeholder="From job code"
            />
          </Field>
        </div>
      </div>

      {/* ── Department & Division ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHeading
          icon={<Building2 className="h-3.5 w-3.5" />}
          label="Department & Division"
          accent="from-emerald-500 to-teal-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Department" required error={errors.departmentCode}>
            {loadingDepartments ? (
              <Input
                className={fieldCls}
                disabled
                placeholder="Loading departments…"
              />
            ) : (
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.departmentCode}
                  onValueChange={handleDepartmentChange}
                >
                  <SelectTrigger
                    className={cn(fieldCls, "pl-9")}
                    disabled={!editing}
                  >
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

          <Field label="Department Name">
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className={cn(fieldCls, "pl-9")}
                disabled
                value={formData.departmentName}
                placeholder="Auto-filled from selection"
              />
            </div>
          </Field>

          <Field label="Division">
            {loadingDivisions ? (
              <Input
                className={fieldCls}
                disabled
                placeholder="Loading divisions…"
              />
            ) : (
              <div className="relative">
                <Network className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={
                    formData.divisionId != null
                      ? String(formData.divisionId)
                      : "none"
                  }
                  onValueChange={handleDivisionChange}
                >
                  <SelectTrigger
                    className={cn(fieldCls, "pl-9")}
                    disabled={!editing || !formData.departmentCode}
                  >
                    <SelectValue
                      placeholder={
                        formData.departmentCode
                          ? "Select division (optional)"
                          : "Pick a department first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No division —</SelectItem>
                    {departmentDivisions.map((div) => (
                      <SelectItem key={div.id} value={String(div.id)}>
                        {div.code} — {div.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </Field>
        </div>
        {formData.departmentCode &&
          !loadingDivisions &&
          departmentDivisions.length === 0 && (
          <p className="text-[11px] text-amber-600 mt-3 flex items-center gap-1">
            <Network className="h-3 w-3" /> No divisions under this department
            yet. Add one in Division Master.
          </p>
        )}
      </div>

      {/* ── Employment Classification ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHeading
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          label="Employment Classification"
          accent="from-indigo-500 to-purple-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Employment Category">
            <Select
              value={formData.employmentCategory || ""}
              onValueChange={(v) =>
                updateField("employmentCategory")(v as EmploymentCategory)
              }
            >
              <SelectTrigger className={fieldCls} disabled={!editing}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Employment Type">
            <Select
              value={formData.employmentType || ""}
              onValueChange={(v) =>
                updateField("employmentType")(v as EmploymentType)
              }
            >
              <SelectTrigger className={fieldCls} disabled={!editing}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Reporting Manager"
            error={errors.reportingManagerId}
          >
            <div className="relative">
              <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select
                value={
                  formData.reportingManagerId != null
                    ? String(formData.reportingManagerId)
                    : "none"
                }
                onValueChange={(v) =>
                  updateField("reportingManagerId")(
                    v === "none" ? null : Number(v),
                  )
                }
              >
                <SelectTrigger
                  className={cn(fieldCls, "pl-9")}
                  disabled={!editing}
                >
                  <SelectValue placeholder="Select reporting manager">
                    {managerLabel || (
                      <span className="text-muted-foreground">
                        Select reporting manager
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No reporting manager —</SelectItem>
                  {managerCandidates
                    .filter((e) => e.id !== employeeId)
                    .map((m) => {
                      const name =
                        [m.firstName, m.lastName].filter(Boolean).join(" ") ||
                        m.fullName ||
                        `Employee #${m.id}`;
                      return (
                        <SelectItem key={m.id} value={String(m.id)}>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {name}
                            </span>
                            {m.employeeNo && (
                              <span className="text-[11px] text-slate-400">
                                #{m.employeeNo}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
          </Field>
        </div>
      </div>

      {/* ── Contract Dates (only when non-permanent) ── */}
      {isContractual && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <SectionHeading
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Contract Dates"
            accent="from-rose-500 to-orange-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Contract Start Date"
              required
              error={errors.contractStartDate}
            >
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className={cn(fieldCls, "pl-9")}
                  disabled={!editing}
                  value={formData.contractStartDate ?? ""}
                  onChange={(e) =>
                    updateField("contractStartDate")(e.target.value)
                  }
                />
              </div>
            </Field>

            <Field
              label="Contract End Date"
              required
              error={errors.contractEndDate}
            >
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className={cn(fieldCls, "pl-9")}
                  disabled={!editing}
                  value={formData.contractEndDate ?? ""}
                  onChange={(e) =>
                    updateField("contractEndDate")(e.target.value)
                  }
                />
              </div>
            </Field>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Shown because employment category is not "Permanent".
          </p>
        </div>
      )}

      {/* ── Employment Dates ── */}
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
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Optional — leave blank for open-ended contracts
              </p>
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
            <CountrySelect
              value={formData.workCountry}
              onChange={updateField("workCountry")}
              disabled={!editing}
              placeholder="Select country..."
              className={fieldCls}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */

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
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
          accent,
        )}
      >
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {label}
      </span>
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
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3.5 bg-white shadow-sm",
        accent,
      )}
    >
      <div className={cn("shrink-0", accent.split(" ")[0])}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
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
