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
import { currentJobService, type CurrentJobApiPayload } from "@/service/currentJobService";
import { hrService } from "@/service/hr.service";
import { fetchDepartments } from "@/service/departmentService";
import { toast } from "sonner";
import type { CurrentJob } from "@/types/hr";
import type { Department } from "@/types/department";
import { isValidDate } from "@/modules/hr/utils/validation";
import { Briefcase, Building2, Calendar, Award, MapPin, TrendingUp } from "lucide-react";
import { jobCodeService, type JobCode } from "@/service/jobCodeService";

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

      // Debug log to check employeeId
      console.log("Saving current job - Employee ID:", employeeId, "Type:", typeof employeeId);

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
        throw new Error(" Invalid employee ID. Please refresh the page and try again.");
      }

      // Find selected job code object
      const selectedJob = jobCodes.find(j => j.code === data.jobCode);

      // Find selected department object
      const selectedDept = departments.find(d => d.departmentCode === data.departmentCode);

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
        expectedEndDate: data.expectedEndDate || undefined
      };

      console.log("Sending payload:", payload);

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
              await hrService.updateEmployee(validEmployeeId, employeeUpdateData);
              toast.success("Employee profile updated with join date and department");

              // Dispatch event to update employee overview in employees-page (listen on window)
              window.dispatchEvent(new CustomEvent("employee:updated"));
            }
          }
        } catch (updateErr: any) {
          console.error("Error updating employee profile:", updateErr);
          // Don't throw here - the current job was saved successfully
          toast.warning("Current job saved but failed to update employee profile");
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
        console.log("Fetching job codes...");
        // Use getAll to fetch all job codes (both active and inactive)
        // This ensures users can select from all available job codes
        const codes = await jobCodeService.getAll();
        console.log("Job codes fetched:", codes);
        if (mounted) {
          setJobCodes(codes || []);
        }
      } catch (error: any) {
        console.error("Error loading job codes:", error);
        // Show error toast for debugging
        if (mounted) {
          toast.error(error?.response?.data?.message || "Failed to load job codes. Please check your permissions or try again.");
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
    const fetchDepartmentsData = async () => {
      try {
        const depts = await fetchDepartments();
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

  /* ================= HANDLERS ================= */

  const handleJobCodeChange = (value: string) => {
    updateField("jobCode")(value);
    // Auto-populate jobTitle and jobLevel from selected job code
    if (value) {
      const selectedJob = jobCodes.find(j => j.code === value);
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
      const selectedDept = departments.find(d => d.departmentCode === value);
      if (selectedDept) {
        updateField("departmentName")(selectedDept.departmentName);
      }
    }
  };

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
                  {loadingJobCodes ? (
                    <Input
                      className="h-10 pl-10 border-slate-300 bg-slate-50"
                      disabled
                      placeholder="Loading..."
                    />
                  ) : jobCodes.length > 0 ? (
                    <>
                      <div className="relative">
                        <Select value={formData.jobCode} onValueChange={handleJobCodeChange}>
                          <SelectTrigger className="h-10 pl-10" disabled={!editing}>
                            <SelectValue placeholder="Select Job Code" />
                          </SelectTrigger>

                          <SelectContent>
                            {jobCodes.map((jc) => (
                              <SelectItem key={jc.id} value={jc.code}>
                                {jc.code} - {jc.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Input
                          className="h-10 pl-10 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all"
                          disabled={!editing}
                          value={formData.jobCode}
                          onChange={(e) => updateField("jobCode")(e.target.value)}
                          placeholder="Enter Job Code (e.g., JD001)"
                        />
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                      <p className="text-xs text-amber-600 mt-1">
                        No job codes available. Please enter manually or contact admin to set up job codes.
                      </p>
                    </>
                  )}
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
                  {loadingDepartments ? (
                    <Input
                      className="h-10 pl-10 border-slate-300 bg-slate-50"
                      disabled
                      placeholder="Loading..."
                    />
                  ) : (
                    <>
                      <div className="relative">
                        <Select value={formData.departmentCode} onValueChange={handleDepartmentChange}>
                          <SelectTrigger className="h-10 pl-10" disabled={!editing}>
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>

                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.departmentCode}>
                                {dept.departmentCode} - {dept.departmentName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </>
                  )}
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
