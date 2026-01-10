import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { FormRow, FormField, FormSection } from "@/modules/hr/components/form-components";
import { SelectField } from "@/modules/hr/components/select-field";
import { isValidAmount, isValidDate } from "@/modules/hr/utils/validation";
import { formatMoney } from "@/lib/utils";
import { salaryService } from "@/service/salaryService";
import { toast } from "sonner";

interface SalaryCtx {
  editing: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;
}

type BenefitType = "ALLOWANCE" | "COMPANY_PROVIDED";

const BENEFIT_OPTIONS = [
  { value: "ALLOWANCE", label: "Company Pays Allowance" },
  { value: "COMPANY_PROVIDED", label: "Company Provides" },
];

const COMPENSATION_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" }
];

type SalaryFormState = {
  basicSalary: number;
  transportationType: BenefitType;
  transportationAllowance: number;
  travelType: BenefitType;
  travelAllowance: number;
  housingType: BenefitType;
  housingAllowance: number;
  otherAllowance: number;
  compensationStatus: string;
  effectiveFrom: string;
  effectiveTo: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  numberOfDaysWorked: string;
  payPerDay: string;
  overtime: string;
};

const INITIAL_STATE: SalaryFormState = {
  basicSalary: 0,
  transportationType: "COMPANY_PROVIDED",
  transportationAllowance: 0,
  travelType: "COMPANY_PROVIDED",
  travelAllowance: 0,
  housingType: "COMPANY_PROVIDED",
  housingAllowance: 0,
  otherAllowance: 0,
  compensationStatus: "Active",
  effectiveFrom: "",
  effectiveTo: "",
  payPeriodStart: "",
  payPeriodEnd: "",
  numberOfDaysWorked: "",
  payPerDay: "",
  overtime: "",
};

interface ValidationErrors {
  [key: string]: string;
}

export default function SalaryForm() {
  const { editing, cancelEdit, saveEdit } = useOutletContext<SalaryCtx>();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [formData, setFormData] = useState<SalaryFormState>(INITIAL_STATE);
  const [exists, setExists] = useState(false);

  const validateForm = useCallback((data: SalaryFormState): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!isValidAmount(String(data.basicSalary))) {
      errors.basicSalary = "Valid basic salary amount is required";
    }

    if (data.transportationType === "ALLOWANCE" && !isValidAmount(String(data.transportationAllowance))) {
      errors.transportationAllowance = "Valid transportation allowance amount is required";
    }

    if (data.travelType === "ALLOWANCE" && !isValidAmount(String(data.travelAllowance))) {
      errors.travelAllowance = "Valid travel allowance amount is required";
    }

    if (data.housingType === "ALLOWANCE" && !isValidAmount(String(data.housingAllowance))) {
      errors.housingAllowance = "Valid housing allowance amount is required";
    }

    if (!isValidAmount(String(data.otherAllowance))) {
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

  const handleSaveSalary = useCallback(async () => {
    if (!employeeId) return;
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      throw new Error("Please fix the validation errors");
    }

    const payload = {
      basicSalary: Number(formData.basicSalary) || 0,

      transportationType: formData.transportationType,
      transportationAllowance:
        formData.transportationType === "ALLOWANCE"
          ? Number(formData.transportationAllowance || 0)
          : 0,

      travelType: formData.travelType,
      travelAllowance:
        formData.travelType === "ALLOWANCE"
          ? Number(formData.travelAllowance || 0)
          : 0,

      housingType: formData.housingType,
      housingAllowance:
        formData.housingType === "ALLOWANCE"
          ? Number(formData.housingAllowance || 0)
          : 0,

      otherAllowance: Number(formData.otherAllowance || 0),

      status: formData.compensationStatus,
      effectiveFrom: formData.effectiveFrom,
      effectiveTo: formData.effectiveTo,
    };

    const api = exists ? salaryService.update : salaryService.create;
    try {
      await api(employeeId, payload);
      toast.success(exists ? "Salary updated" : "Salary created");
      if (!exists) setExists(true);
    } catch (err: any) {
      console.error("Failed to save salary", err);
      toast.error(err?.response?.data?.message || "Failed to save salary");
      throw err;
    }
  }, [employeeId, exists, formData, validateForm]);

  useEffect(() => {
    const handleStartEdit = () => {};

    const handleCancel = () => {
      setFormData(INITIAL_STATE);
      cancelEdit();
    };

    document.addEventListener("salary:start-edit", handleStartEdit);
    document.addEventListener("salary:save", handleSaveSalary as EventListener);
    document.addEventListener("salary:cancel", handleCancel);

    return () => {
      document.removeEventListener("salary:start-edit", handleStartEdit);
      document.removeEventListener("salary:save", handleSaveSalary as EventListener);
      document.removeEventListener("salary:cancel", handleCancel);
    };
  }, [formData, saveEdit, cancelEdit, employeeId, exists]);

  
  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    salaryService
      .get(employeeId)
      .then((res) => {
        if (!mounted) return;
        if (res.data) {
          const api = res.data;
          setFormData((prev) => ({
            ...prev,
            basicSalary: Number(api.basicSalary ?? 0),

            transportationType:
              (api.transportationType as BenefitType) ||
              (Number(api.transportationAllowance ?? 0) > 0 ? "ALLOWANCE" : "COMPANY_PROVIDED"),
            transportationAllowance: Number(api.transportationAllowance ?? 0),

            travelType:
              (api.travelType as BenefitType) ||
              (Number(api.travelAllowance ?? 0) > 0 ? "ALLOWANCE" : "COMPANY_PROVIDED"),
            travelAllowance: Number(api.travelAllowance ?? 0),

            housingType:
              (api.housingType as BenefitType) ||
              (Number(api.housingAllowance ?? 0) > 0 ? "ALLOWANCE" : "COMPANY_PROVIDED"),
            housingAllowance: Number(api.housingAllowance ?? 0),

            otherAllowance: Number(api.otherAllowance ?? 0),

            compensationStatus: api.status ?? api.compensationStatus ?? "Active",
            effectiveFrom: api.effectiveFrom ?? "",
            effectiveTo: api.effectiveTo ?? "",

            payPeriodStart: "",
            payPeriodEnd: "",
            numberOfDaysWorked: "",
            payPerDay: "",
            overtime: "",
          } as SalaryFormState));
          setExists(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load salary", err);
        toast.error(err?.response?.data?.message || "Failed to load salary");
      });
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const updateField = (field: keyof SalaryFormState) => (value: string) => {
    
    if (field === 'basicSalary' || field === 'transportationAllowance' || field === 'travelAllowance' || field === 'otherAllowance' || field === 'housingAllowance') {
      const num = Number(value.replace(/[^0-9.]/g, '')) || 0;
      setFormData(prev => ({ ...prev, [field]: num } as SalaryFormState));
      return;
    }
    if (field === 'transportationType' || field === 'travelType' || field === 'housingType') {
      const val = value as BenefitType;
      const reset =
        field === 'housingType' && val !== 'ALLOWANCE'
          ? { housingAllowance: 0 }
          : field === 'transportationType' && val !== 'ALLOWANCE'
          ? { transportationAllowance: 0 }
          : field === 'travelType' && val !== 'ALLOWANCE'
          ? { travelAllowance: 0 }
          : {};
      setFormData(prev => ({ ...prev, [field]: val, ...reset } as SalaryFormState));
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value } as SalaryFormState));
  };


  
  const totalAllowance = useMemo(() => {
    const ta = formData.transportationType === 'ALLOWANCE' ? (formData.transportationAllowance || 0) : 0;
    const tr = formData.travelType === 'ALLOWANCE' ? (formData.travelAllowance || 0) : 0;
    const oa = formData.otherAllowance || 0;
    const ha = formData.housingType === 'ALLOWANCE' ? (formData.housingAllowance || 0) : 0;
    return (ta + tr + oa + ha).toString();
  }, [formData.transportationAllowance, formData.travelAllowance, formData.otherAllowance, formData.housingType, formData.housingAllowance]);

  
  const grossPay = useMemo(() => {
    const basic = formData.basicSalary || 0;
    const allowance = parseFloat(totalAllowance) || 0;
    return (basic + allowance).toString();
  }, [formData.basicSalary, totalAllowance]);

  
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
              value={formatMoney(String(formData.basicSalary))}
              onChange={e => updateField('basicSalary')(e.target.value)}
              placeholder="Enter basic salary"
              disabled={!editing}
            />
          </FormField>

                <FormField label="Transportation" required>
                  <SelectField
                    options={BENEFIT_OPTIONS}
                    value={formData.transportationType}
                    onChange={e => updateField('transportationType')(e.target.value)}
                    disabled={!editing}
                  />
                </FormField>

                {formData.transportationType === 'ALLOWANCE' && (
                  <FormField label="Transportation Allowance" error={validateForm(formData).transportationAllowance} required>
                    <Input
                      value={formatMoney(String(formData.transportationAllowance))}
                      onChange={e => updateField('transportationAllowance')(e.target.value)}
                      placeholder="Enter transportation allowance"
                      disabled={!editing}
                    />
                  </FormField>
                )}
        </FormRow>

        <FormRow columns={2}>
          <FormField label="Travel" required>
            <SelectField
              options={BENEFIT_OPTIONS}
              value={formData.travelType}
              onChange={e => updateField('travelType')(e.target.value)}
              disabled={!editing}
            />
          </FormField>

          {formData.travelType === 'ALLOWANCE' && (
            <FormField label="Travel Allowance" error={validateForm(formData).travelAllowance} required>
              <Input
                value={formatMoney(String(formData.travelAllowance))}
                onChange={e => updateField('travelAllowance')(e.target.value)}
                placeholder="Enter travel allowance"
                disabled={!editing}
              />
            </FormField>
          )}

          <FormField 
            label="Other Allowance"
            error={validateForm(formData).otherAllowance}
            required
          >
            <Input
                value={formatMoney(String(formData.otherAllowance))}
                onChange={e => updateField('otherAllowance')(e.target.value)}
                placeholder="Enter other allowance"
                disabled={!editing}
              />
          </FormField>
        </FormRow>

        <FormRow columns={2}>
          <FormField label="Housing" required>
            <SelectField
              options={BENEFIT_OPTIONS}
              value={formData.housingType}
              onChange={e => updateField('housingType')(e.target.value)}
              disabled={!editing}
            />
          </FormField>

          {formData.housingType === 'ALLOWANCE' && (
            <FormField label="Housing Allowance" error={validateForm(formData).housingAllowance} required>
              <Input
                value={formatMoney(String(formData.housingAllowance))}
                onChange={e => updateField('housingAllowance')(e.target.value)}
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
