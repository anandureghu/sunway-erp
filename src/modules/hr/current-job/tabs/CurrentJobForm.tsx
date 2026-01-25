import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useRef } from "react";
import { useEditableForm } from "@/modules/hr/hooks/use-editable-form";
import { useParams } from "react-router-dom";
import { currentJobService } from "@/service/currentJobService";
import { toast } from "sonner";
import type { CurrentJob } from "@/types/hr";
import { isValidDate } from "@/modules/hr/utils/validation";
import { Briefcase, Building2, Calendar, Award } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full opacity-20 blur-3xl -mr-32 -mt-32"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Job Information</h1>
                <p className="text-slate-600">Enter employment and position details</p>
              </div>
            </div>
            <div className="inline-block mt-3 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-semibold shadow-lg">
              💼 Job Assignment
            </div>
          </div>
        </div>

        {/* FORM */}
        <Card className="border-slate-200 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 bg-gradient-to-br from-white to-slate-50 space-y-6">

              {/* JOB DETAILS SECTION */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 pb-3 border-b border-slate-200 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  Job Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="Job Code" required error={errors.jobCode}>
                    <Input
                      value={formData.jobCode}
                      onChange={(e) => updateField("jobCode")(e.target.value)}
                      disabled={!editing}
                      placeholder="e.g., JOB-001"
                      className="rounded-lg border-slate-300"
                    />
                  </Field>

                  <Field label="Job Title" required error={errors.jobTitle}>
                    <Input
                      value={formData.jobTitle}
                      onChange={(e) => updateField("jobTitle")(e.target.value)}
                      disabled={!editing}
                      placeholder="e.g., Senior Developer"
                      className="rounded-lg border-slate-300"
                    />
                  </Field>

                  <Field label="Job Level">
                    <Input
                      value={formData.jobLevel}
                      onChange={(e) => updateField("jobLevel")(e.target.value)}
                      disabled={!editing}
                      placeholder="e.g., Senior, Manager"
                      className="rounded-lg border-slate-300"
                    />
                  </Field>
                </div>
              </div>

              {/* DEPARTMENT SECTION */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 pb-3 border-b border-blue-200 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Department Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="Department Code" required error={errors.departmentCode}>
                    <Input
                      value={formData.departmentCode}
                      onChange={(e) =>
                        updateField("departmentCode")(e.target.value)
                      }
                      disabled={!editing}
                      placeholder="e.g., DEPT-IT"
                      className="rounded-lg border-slate-300 bg-white"
                    />
                  </Field>

                  <Field label="Department Name">
                    <Input
                      value={formData.departmentName}
                      onChange={(e) =>
                        updateField("departmentName")(e.target.value)
                      }
                      disabled={!editing}
                      placeholder="e.g., Information Technology"
                      className="rounded-lg border-slate-300 bg-white"
                    />
                  </Field>

                  <Field label="Grade">
                    <Input
                      value={formData.grade}
                      onChange={(e) => updateField("grade")(e.target.value)}
                      disabled={!editing}
                      placeholder="e.g., Grade 5"
                      className="rounded-lg border-slate-300 bg-white"
                    />
                  </Field>
                </div>
              </div>

              {/* DATES SECTION */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm border border-purple-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 pb-3 border-b border-purple-200 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Effective Dates
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Field label="Start Date" required error={errors.startDate}>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        updateField("startDate")(e.target.value)
                      }
                      disabled={!editing}
                      className="rounded-lg border-slate-300 bg-white"
                    />
                  </Field>

                  <Field label="Effective From" required error={errors.effectiveFrom}>
                    <Input
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={(e) =>
                        updateField("effectiveFrom")(e.target.value)
                      }
                      disabled={!editing}
                      className="rounded-lg border-slate-300 bg-white"
                    />
                  </Field>

                  <Field label="Expected End Date" error={errors.expectedEndDate}>
                    <Input
                      type="date"
                      value={formData.expectedEndDate}
                      onChange={(e) =>
                        updateField("expectedEndDate")(e.target.value)
                      }
                      disabled={!editing}
                      className="rounded-lg border-slate-300 bg-white"
                    />
                  </Field>
                </div>
              </div>

              {/* Job Duration Summary (if dates available) */}
              {formData.startDate && formData.effectiveFrom && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-1">Employment Period</h3>
                      <p className="text-sm text-slate-600">
                        Started: {new Date(formData.startDate).toLocaleDateString()} • 
                        Effective: {new Date(formData.effectiveFrom).toLocaleDateString()}
                        {formData.expectedEndDate && ` • Expected End: ${new Date(formData.expectedEndDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              {editing && (
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="px-6 rounded-lg border-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={Object.keys(errors).length > 0}
                    className="px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-lg"
                  >
                    Save Job Details
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}