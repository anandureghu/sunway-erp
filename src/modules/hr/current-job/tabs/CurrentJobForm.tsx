import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEditableForm } from "@/modules/hr/hooks/use-editable-form";
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
  const {
    editing,
    formData,
    updateField,
    handleEdit,
    handleSave,
    handleCancel
  } = useEditableForm<CurrentJob>({
    initialData: INITIAL_DATA,
    onSave: async (data) => {
      // Validate before saving
      const errors = validateForm(data);
      if (Object.keys(errors).length > 0) {
        throw new Error("Please fix the validation errors");
      }
      // TODO: Implement API call to save data
      console.log("Saving data:", data);
    }
  });

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
      <div className="flex items-center justify-end">
        {!editing ? (
          <Button onClick={handleEdit} variant="outline">
            ✏️ Edit/Update
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="secondary">Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        )}
      </div>

      <FormSection title="Job Information">
        <FormRow columns={3}>
          <FormField 
            label="Job Code" 
            required
          >
            <Input
              value={formData.jobCode}
              onChange={e => updateField('jobCode')(e.target.value)}
              placeholder="Enter job code"
              disabled={!editing}
            />
          </FormField>

          <FormField 
            label="Department Code"
            required
          >
            <Input
              value={formData.departmentCode}
              onChange={e => updateField('departmentCode')(e.target.value)}
              placeholder="Enter department code"
              disabled={!editing}
            />
          </FormField>

          <FormField 
            label="Effective From"
            required
          >
            <Input
              type="date"
              value={formData.effectiveFrom}
              onChange={e => updateField('effectiveFrom')(e.target.value)}
              disabled={!editing}
            />
          </FormField>
        </FormRow>

        <FormRow columns={3}>
          <FormField 
            label="Job Title"
            required
          >
            <Input
              value={formData.jobTitle}
              onChange={e => updateField('jobTitle')(e.target.value)}
              placeholder="Enter job title"
              disabled={!editing}
            />
          </FormField>

          <FormField 
            label="Department Name"
          >
            <Input
              value={formData.departmentName}
              onChange={e => updateField('departmentName')(e.target.value)}
              placeholder="Enter department name"
              disabled={!editing}
            />
          </FormField>

          <FormField 
            label="Start Date"
            required
          >
            <Input
              type="date"
              value={formData.startDate}
              onChange={e => updateField('startDate')(e.target.value)}
              disabled={!editing}
            />
          </FormField>
        </FormRow>

        <FormRow columns={3}>
          <FormField 
            label="Job Level"
          >
            <Input
              value={formData.jobLevel}
              onChange={e => updateField('jobLevel')(e.target.value)}
              placeholder="Enter job level"
              disabled={!editing}
            />
          </FormField>

          <FormField 
            label="Grade"
          >
            <Input
              value={formData.grade}
              onChange={e => updateField('grade')(e.target.value)}
              placeholder="Enter grade"
              disabled={!editing}
            />
          </FormField>

          <FormField 
            label="Expected End Date"
          >
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


