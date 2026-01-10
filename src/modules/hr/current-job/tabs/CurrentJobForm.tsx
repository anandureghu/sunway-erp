import { Input } from "@/components/ui/input";
import { useEffect, useState, useRef } from "react";
import { useEditableForm } from "@/modules/hr/hooks/use-editable-form";
import { useParams } from "react-router-dom";
import { currentJobService } from "@/service/currentJobService";
import { toast } from "sonner";
import { FormRow, FormField, FormSection } from "@/modules/hr/components/form-components";
import type { CurrentJob } from "@/types/hr";
import { isValidDate } from "@/modules/hr/utils/validation";

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
        throw new Error("Please fix the validation errors");
      }
      if (!employeeId) throw new Error("No employee selected");

      try {
        const payload = { ...data } as any;
        if (exists) {
          await currentJobService.update(employeeId, payload);
        } else {
          await currentJobService.create(employeeId, payload);
        }

        setExists(true);
        toast.success("Current job saved");
        try {
          const fresh = await currentJobService.get(employeeId);
          if (fresh) {
            updateField("jobCode")(fresh.jobCode ?? "");
            updateField("departmentCode")(fresh.departmentCode ?? "");
            updateField("departmentName")(fresh.departmentName ?? "");
            updateField("jobTitle")(fresh.jobTitle ?? "");
            updateField("jobLevel")(fresh.jobLevel ?? "");
            updateField("grade")(fresh.grade ?? "");
            updateField("startDate")(fresh.startDate ?? "");
            updateField("effectiveFrom")(fresh.effectiveFrom ?? "");
            updateField("expectedEndDate")(fresh.expectedEndDate ?? "");
          }
        } catch (err) {
          void err;
        }
        document.dispatchEvent(new CustomEvent("current-job:saved"));
      } catch (err: any) {
        const msg = currentJobService.extractErrorMessage(err);
        toast.error(msg);
        savingRef.current = false;
        throw err;
      }
      savingRef.current = false;
    },
  });

  useEffect(() => {
    const onStart = () => handleEdit();
    const onSave = () => handleSave();
    const onCancel = () => handleCancel();

    document.addEventListener("current-job:start-edit", onStart as EventListener);
    document.addEventListener("current-job:save", onSave as EventListener);
    document.addEventListener("current-job:cancel", onCancel as EventListener);

    return () => {
      document.removeEventListener("current-job:start-edit", onStart as EventListener);
      document.removeEventListener("current-job:save", onSave as EventListener);
      document.removeEventListener("current-job:cancel", onCancel as EventListener);
    };
  }, [handleEdit, handleSave, handleCancel]);

  useEffect(() => {
    let mounted = true;
    if (!employeeId) return;

    (async () => {
      try {
        const res = await currentJobService.get(employeeId);
        if (!mounted) return;
        if (res) {
          setExists(true);
        
          updateField("jobCode")(res.jobCode ?? "");
          updateField("departmentCode")(res.departmentCode ?? "");
          updateField("departmentName")(res.departmentName ?? "");
          updateField("jobTitle")(res.jobTitle ?? "");
          updateField("jobLevel")(res.jobLevel ?? "");
          updateField("grade")(res.grade ?? "");
          updateField("startDate")(res.startDate ?? "");
          updateField("effectiveFrom")(res.effectiveFrom ?? "");
          updateField("expectedEndDate")(res.expectedEndDate ?? "");
        }
      } catch (err) {
        void err;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const validateForm = (data: CurrentJob): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!data.jobCode) errors.jobCode = "Job code is required";
    if (!data.departmentCode) errors.departmentCode = "Department code is required";
    if (!data.jobTitle) errors.jobTitle = "Job title is required";
    if (!isValidDate(data.startDate)) errors.startDate = "Valid start date is required";
    if (!isValidDate(data.effectiveFrom)) errors.effectiveFrom = "Valid effective date is required";
    if (data.expectedEndDate && !isValidDate(data.expectedEndDate)) {
      errors.expectedEndDate = "Invalid end date format";
    }

    return errors;
  };

  return (
    <div className="space-y-6">
      {/* Action bar is provided by the Current Job shell */}

      <FormSection title="Job Information">
        <FormRow columns={3}>
          <FormField label="Job Code" required>
            <Input
              value={formData.jobCode}
              onChange={e => updateField('jobCode')(e.target.value)}
              placeholder="Enter job code"
              disabled={!editing}
            />
          </FormField>

          <FormField label="Job Title" required>
            <Input
              value={formData.jobTitle}
              onChange={e => updateField('jobTitle')(e.target.value)}
              placeholder="Enter job title"
              disabled={!editing}
            />
          </FormField>

          <FormField label="Job Level">
            <Input
              value={formData.jobLevel}
              onChange={e => updateField('jobLevel')(e.target.value)}
              placeholder="Enter job level"
              disabled={!editing}
            />
          </FormField>
        </FormRow>

        <FormRow columns={3}>
          <FormField label="Department Code" required>
            <Input
              value={formData.departmentCode}
              onChange={e => updateField('departmentCode')(e.target.value)}
              placeholder="Enter department code"
              disabled={!editing}
            />
          </FormField>

          <FormField label="Department Name">
            <Input
              value={formData.departmentName}
              onChange={e => updateField('departmentName')(e.target.value)}
              placeholder="Enter department name"
              disabled={!editing}
            />
          </FormField>

          <FormField label="Grade">
            <Input
              value={formData.grade}
              onChange={e => updateField('grade')(e.target.value)}
              placeholder="Enter grade"
              disabled={!editing}
            />
          </FormField>
        </FormRow>

        <FormRow columns={3}>
          <FormField label="Start Date" required>
            <Input
              type="date"
              value={formData.startDate}
              onChange={e => updateField('startDate')(e.target.value)}
              disabled={!editing}
            />
          </FormField>

          <FormField label="Effective From" required>
            <Input
              type="date"
              value={formData.effectiveFrom}
              onChange={e => updateField('effectiveFrom')(e.target.value)}
              disabled={!editing}
            />
          </FormField>

          <FormField label="Expected End Date">
            <Input
              type="date"
              value={formData.expectedEndDate}
              onChange={e => updateField('expectedEndDate')(e.target.value)}
              disabled={!editing}
            />
          </FormField>
        </FormRow>
      </FormSection>
    </div>
  );
}


