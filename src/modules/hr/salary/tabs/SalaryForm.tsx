import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { FormRow, FormField, FormSection } from "@/modules/hr/components/form-components";
import { SelectField } from "@/modules/hr/components/select-field";
import { isValidAmount, isValidDate } from "@/modules/hr/utils/validation";
import { formatMoney } from "@/lib/utils";
import type { Salary } from "@/types/hr";

interface SalaryCtx {
  editing: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;
}

const YES_NO_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" }
];

const COMPENSATION_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" }
];

const INITIAL_DATA: Salary = {
  basicSalary: "50000",
  transportation: "Yes",
  transportationAllowance: "20000",
  travelAllowance: "4000",
  otherAllowance: "4000",
  totalAllowance: "28000",
  housing: "No",
  housingAllowance: "",
  compensationStatus: "Active",
  effectiveFrom: "",
  effectiveTo: "",
  payPeriodStart: "",
  payPeriodEnd: "",
  numberOfDaysWorked: "",
  payPerDay: "",
  overtime: ""
};

interface ValidationErrors {
  [key: string]: string;
}

export default function SalaryForm() {
  const { editing, cancelEdit, saveEdit } = useOutletContext<SalaryCtx>();
  const [formData, setFormData] = useState<Salary>(INITIAL_DATA);

  // Listen for edit/save/cancel events from the shell
  useEffect(() => {
    const handleStartEdit = () => {};
    const handleSave = async () => {
      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        throw new Error("Please fix the validation errors");
      }
      // TODO: Implement API call to save data
      console.log("Saving salary data:", formData);
      saveEdit();
    };
    const handleCancel = () => {
      setFormData(INITIAL_DATA);
      cancelEdit();
    };

    document.addEventListener("salary:start-edit", handleStartEdit);
    document.addEventListener("salary:save", handleSave);
    document.addEventListener("salary:cancel", handleCancel);

    return () => {
      document.removeEventListener("salary:start-edit", handleStartEdit);
      document.removeEventListener("salary:save", handleSave);
      document.removeEventListener("salary:cancel", handleCancel);
    };
  }, [formData, saveEdit, cancelEdit]);

  const updateField = (field: keyof Salary) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = useCallback((data: Salary): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!isValidAmount(data.basicSalary)) {
      errors.basicSalary = "Valid basic salary amount is required";
    }

    if (!["Yes", "No"].includes(data.transportation)) {
      errors.transportation = "Transportation must be Yes or No";
    }

    if (data.transportation === "Yes" && !isValidAmount(data.transportationAllowance)) {
      errors.transportationAllowance = "Valid transportation allowance amount is required";
    }

    if (!isValidAmount(data.travelAllowance)) {
      errors.travelAllowance = "Valid travel allowance amount is required";
    }

    if (!isValidAmount(data.otherAllowance)) {
      errors.otherAllowance = "Valid other allowance amount is required";
    }

    if (!isValidDate(data.effectiveFrom)) {
      errors.effectiveFrom = "Valid effective from date is required";
    }

    if (data.effectiveTo && !isValidDate(data.effectiveTo)) {
      errors.effectiveTo = "Invalid effective to date";
    }

    return errors;
  }, []);

  // Calculate total allowance
  const totalAllowance = useMemo(() => {
    const ta = parseFloat(formData.transportationAllowance) || 0;
    const tr = parseFloat(formData.travelAllowance) || 0;
    const oa = parseFloat(formData.otherAllowance) || 0;
    const ha = formData.housing === "Yes" ? (parseFloat(formData.housingAllowance) || 0) : 0;
    return (ta + tr + oa + ha).toString();
  }, [formData.transportationAllowance, formData.travelAllowance, formData.otherAllowance, formData.housing, formData.housingAllowance]);

  // Calculate gross pay (basic salary + total allowance)
  const grossPay = useMemo(() => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const allowance = parseFloat(totalAllowance) || 0;
    return (basic + allowance).toString();
  }, [formData.basicSalary, totalAllowance]);

  // Calculate compensation based on days worked * pay per day
  return (
    <div className="space-y-6">

      <FormSection title="Salary Information">
        <FormRow columns={2}>
          <FormField 
            label="Basic Salary" 
            required
            error={validateForm(formData).basicSalary}
          >
            <Input
              value={formatMoney(formData.basicSalary)}
              onChange={e => updateField('basicSalary')(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="Enter basic salary"
              disabled={!editing}
            />
          </FormField>

          <FormField 
            label="Transportation"
            required
          >
            <SelectField
              options={YES_NO_OPTIONS}
              value={formData.transportation}
              onChange={e => updateField('transportation')(e.target.value as 'Yes' | 'No')}
              disabled={!editing}
            />
          </FormField>

          {formData.transportation === 'Yes' && (
            <FormField 
              label="Transportation Allowance"
              error={validateForm(formData).transportationAllowance}
              required
            >
              <Input
                value={formatMoney(formData.transportationAllowance)}
                onChange={e => updateField('transportationAllowance')(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Enter transportation allowance"
                disabled={!editing}
              />
            </FormField>
          )}
        </FormRow>

        <FormRow columns={2}>
          <FormField 
            label="Travel Allowance"
            error={validateForm(formData).travelAllowance}
            required
          >
            <Input
              value={formatMoney(formData.travelAllowance)}
              onChange={e => updateField('travelAllowance')(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="Enter travel allowance"
              disabled={!editing}
            />
          </FormField>

          <FormField 
            label="Other Allowance"
            error={validateForm(formData).otherAllowance}
            required
          >
            <Input
              value={formatMoney(formData.otherAllowance)}
              onChange={e => updateField('otherAllowance')(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="Enter other allowance"
              disabled={!editing}
            />
          </FormField>
        </FormRow>

        <FormRow columns={2}>
          <FormField 
            label="Housing"
            required
          >
            <SelectField
              options={YES_NO_OPTIONS}
              value={formData.housing}
              onChange={e => updateField('housing')(e.target.value as 'Yes' | 'No')}
              disabled={!editing}
            />
          </FormField>

          {formData.housing === 'Yes' && (
            <FormField 
              label="Housing Allowance"
              error={validateForm(formData).housingAllowance}
              required
            >
              <Input
                value={formatMoney(formData.housingAllowance)}
                onChange={e => updateField('housingAllowance')(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Enter housing allowance"
                disabled={!editing}
              />
            </FormField>
          )}
        </FormRow>

        <FormRow columns={1}>
          <FormField 
            label="Total Compensation"
          >
            <Input
              value={formatMoney(grossPay)}
              disabled
            />
          </FormField>
        </FormRow>
      </FormSection>

      <FormSection title="Compensation Status">
        <FormRow columns={3}>
          <FormField 
            label="Compensation Status"
            required
          >
            <SelectField
              options={COMPENSATION_STATUS_OPTIONS}
              value={formData.compensationStatus}
              onChange={e => updateField('compensationStatus')(e.target.value as 'Active' | 'Inactive')}
              disabled={!editing}
            />
          </FormField>

          <FormField 
            label="Effective From"
            error={validateForm(formData).effectiveFrom}
            required
          >
            <Input
              type="date"
              value={formData.effectiveFrom}
              onChange={e => updateField('effectiveFrom')(e.target.value)}
              disabled={!editing}
            />
          </FormField>

          <FormField 
            label="Effective To"
            error={validateForm(formData).effectiveTo}
          >
            <Input
              type="date"
              value={formData.effectiveTo}
              onChange={e => updateField('effectiveTo')(e.target.value)}
              disabled={!editing}
            />
          </FormField>
        </FormRow>
      </FormSection>
    </div>
  );
}
