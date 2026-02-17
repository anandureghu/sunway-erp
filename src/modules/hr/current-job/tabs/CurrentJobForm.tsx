import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";  
import { useEffect, useState, useRef } from "react";
import { useEditableForm } from "@/modules/hr/hooks/use-editable-form";
import { useParams } from "react-router-dom";
import { currentJobService } from "@/service/currentJobService";
import { toast } from "sonner";
import type { CurrentJob } from "@/types/hr";
import { isValidDate } from "@/modules/hr/utils/validation";
import { Briefcase, Building2, Calendar, Award, MapPin, TrendingUp } from "lucide-react";

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
  workCountry: ""
};

interface ValidationErrors {
  [key: string]: string;
}

/* ================= COMPONENT ================= */

export default function CurrentJobForm() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [exists, setExists] = useState(false);
  const savingRef = useRef(false);

  const {
    editing,
    formData,
    updateField,
    handleEdit,
    handleSave,
    handleCancel,
  } = useEditableForm<CurrentJob>({
    initialData: INITIAL_DATA,
    onSave: async (data) => {
      if (savingRef.current) return;
      savingRef.current = true;

      const errors = validateForm(data);
      if (Object.keys(errors).length > 0) {
        savingRef.current = false;
        throw new Error("Please fix validation errors");
      }

      if (!employeeId) {
        savingRef.current = false;
        throw new Error("No employee selected");
      }

      try {
        if (exists) {
          await currentJobService.update(employeeId, data);
        } else {
          await currentJobService.create(employeeId, data);
        }

        setExists(true);
        toast.success("Current job saved");

        const fresh = await currentJobService.get(employeeId);
        if (fresh) {
          Object.keys(INITIAL_DATA).forEach((key) => {
            updateField(key as keyof CurrentJob)(
              (fresh as any)[key] ?? ""
            );
          });
        }

        document.dispatchEvent(new CustomEvent("current-job:saved"));
      } catch (err: any) {
        toast.error(currentJobService.extractErrorMessage(err));
        savingRef.current = false;
        throw err;
      }

      savingRef.current = false;
    },
  });

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;

    (async () => {
      try {
        const res = await currentJobService.get(employeeId);
        if (!mounted || !res) return;

        setExists(true);
        Object.keys(INITIAL_DATA).forEach((key) => {
          updateField(key as keyof CurrentJob)((res as any)[key] ?? "");
        });
      } catch {
        /* silent */
      }
    })();

    return () => {
      mounted = false;
    };
  }, [employeeId, updateField]);

  /* ================= EVENT BRIDGE ================= */

  useEffect(() => {
    document.addEventListener("current-job:start-edit", handleEdit as EventListener);
    document.addEventListener("current-job:save", handleSave as EventListener);
    document.addEventListener("current-job:cancel", handleCancel as EventListener);

    return () => {
      document.removeEventListener("current-job:start-edit", handleEdit as EventListener);
      document.removeEventListener("current-job:save", handleSave as EventListener);
      document.removeEventListener("current-job:cancel", handleCancel as EventListener);
    };
  }, [handleEdit, handleSave, handleCancel]);

  /* ================= VALIDATION ================= */

  const validateForm = (data: CurrentJob): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!data.jobCode) errors.jobCode = "Job code is required";
    if (!data.departmentCode) errors.departmentCode = "Department code is required";
    if (!data.jobTitle) errors.jobTitle = "Job title is required";
    if (!data.workLocation) errors.workLocation = "Work location is required";
    if (!isValidDate(data.startDate)) errors.startDate = "Valid start date is required";
    if (!isValidDate(data.effectiveFrom)) errors.effectiveFrom = "Valid effective date is required";
    if (data.expectedEndDate && !isValidDate(data.expectedEndDate)) {
      errors.expectedEndDate = "Invalid end date";
    }

    return errors;
  };

  const errors = validateForm(formData);

  /* ================= RENDER ================= */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Current Job Information</h2>
            <p className="text-sm text-slate-500 mt-1">Manage employment position and organizational details</p>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards - Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Current Position</p>
              <p className="text-sm font-semibold text-blue-900">{formData.jobTitle || "Not set"}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">Department</p>
              <p className="text-sm font-semibold text-emerald-900">{formData.departmentName || formData.departmentCode || "Not set"}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-amber-600 font-medium">Start Date</p>
              <p className="text-sm font-semibold text-amber-900">
                {formData.startDate
                  ? new Date(formData.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not set"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">Work Location</p>
              <p className="text-sm font-semibold text-purple-900">{formData.workLocation || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* All Job Information in One Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-800">Job Information</h3>
          </div>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Position Details */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
              Position Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Job Code" required error={errors.jobCode}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.jobCode}
                    onChange={(e) => updateField("jobCode")(e.target.value)}
                    required
                    placeholder="e.g., JOB-001"
                  />
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Job Title" required error={errors.jobTitle}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.jobTitle}
                    onChange={(e) => updateField("jobTitle")(e.target.value)}
                    required
                    placeholder="e.g., Senior Developer"
                  />
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Job Level" error={errors.jobLevel}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.jobLevel}
                    onChange={(e) => updateField("jobLevel")(e.target.value)}
                    placeholder="e.g., Senior, Manager"
                  />
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Department Information */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-600 rounded-full"></div>
              Department Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Department Code" required error={errors.departmentCode}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.departmentCode}
                    onChange={(e) => updateField("departmentCode")(e.target.value)}
                    required
                    placeholder="e.g., DEPT-IT"
                  />
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Department Name" error={errors.departmentName}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.departmentName}
                    onChange={(e) => updateField("departmentName")(e.target.value)}
                    placeholder="e.g., Information Technology"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Grade" error={errors.grade}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.grade}
                    onChange={(e) => updateField("grade")(e.target.value)}
                    placeholder="e.g., Grade 5"
                  />
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Employment Dates */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-amber-600 rounded-full"></div>
              Employment Dates
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Start Date" required error={errors.startDate}>
                <div className="relative">
                  <Input
                    type="date"
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.startDate}
                    onChange={(e) => updateField("startDate")(e.target.value)}
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Effective From" required error={errors.effectiveFrom}>
                <div className="relative">
                  <Input
                    type="date"
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.effectiveFrom}
                    onChange={(e) => updateField("effectiveFrom")(e.target.value)}
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Expected End Date" error={errors.expectedEndDate}>
                <div className="relative">
                  <Input
                    type="date"
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.expectedEndDate}
                    onChange={(e) => updateField("expectedEndDate")(e.target.value)}
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200"></div>

          {/* Work Location */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-purple-600 rounded-full"></div>
              Work Location
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Work Location" required error={errors.workLocation}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.workLocation}
                    onChange={(e) => updateField("workLocation")(e.target.value)}
                    required
                    placeholder="e.g., Office, Remote, Hybrid"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Work City" error={errors.workCity}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.workCity}
                    onChange={(e) => updateField("workCity")(e.target.value)}
                    placeholder="e.g., New York"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>

              <Field label="Work Country" error={errors.workCountry}>
                <div className="relative">
                  <Input
                    className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                    disabled={!editing}
                    value={formData.workCountry}
                    onChange={(e) => updateField("workCountry")(e.target.value)}
                    placeholder="e.g., United States"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */

function Field({
  label,
  children,
  required,
  error
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
}