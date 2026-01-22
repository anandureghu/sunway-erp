import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormRow, } from "@/modules/hr/components/form-components";
import { SelectField } from "@/modules/hr/components/select-field";
import { isValidAmount, isValidDate } from "@/modules/hr/utils/validation";
import { formatMoney } from "@/lib/utils";
import { salaryService } from "@/service/salaryService";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Calendar, CheckCircle } from "lucide-react";

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Inactive': return 'bg-gray-50 text-gray-700 border-gray-200';
    default: return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

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
  }, [formData.transportationAllowance, formData.travelAllowance, formData.otherAllowance, formData.housingType, formData.housingAllowance, formData.transportationType, formData.travelType]);

  const grossPay = useMemo(() => {
    const basic = formData.basicSalary || 0;
    const allowance = parseFloat(totalAllowance) || 0;
    return (basic + allowance).toString();
  }, [formData.basicSalary, totalAllowance]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-width mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full opacity-20 blur-3xl -mr-32 -mt-32"></div>
          <div className="relative">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Salary Information</h1>
                <p className="text-slate-600">Enter compensation details and benefits</p>
              </div>
              {formData.compensationStatus && (
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(formData.compensationStatus)}`}>
                  {formData.compensationStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Compensation Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium opacity-90">Total Compensation</span>
          </div>
          <p className="text-4xl font-bold">{formatMoney(grossPay)}</p>
          <p className="text-sm opacity-75 mt-2">
            Basic Salary: {formatMoney(String(formData.basicSalary))} + Allowances: {formatMoney(totalAllowance)}
          </p>
        </div>

        {/* Compensation Components Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-200">
            Compensation Components
          </h2>

          {/* Basic Salary */}
          <div className="mb-6">
            <FormRow columns={1}>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Basic Salary <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formatMoney(String(formData.basicSalary))}
                  onChange={e => updateField('basicSalary')(e.target.value)}
                  placeholder="Enter basic salary"
                  disabled={!editing}
                  className="rounded-lg border-slate-300 text-lg font-semibold"
                />
                {validateForm(formData).basicSalary && (
                  <p className="text-xs text-red-500">{validateForm(formData).basicSalary}</p>
                )}
              </div>
            </FormRow>
          </div>

          {/* Transportation */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-4 border border-blue-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Transportation
            </h3>
            <FormRow columns={2}>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Transportation Type <span className="text-red-500">*</span></Label>
                <SelectField
                  options={BENEFIT_OPTIONS}
                  value={formData.transportationType}
                  onChange={e => updateField('transportationType')(e.target.value)}
                  disabled={!editing}
                />
              </div>

              {formData.transportationType === 'ALLOWANCE' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Transportation Allowance <span className="text-red-500">*</span></Label>
                  <Input
                    value={formatMoney(String(formData.transportationAllowance))}
                    onChange={e => updateField('transportationAllowance')(e.target.value)}
                    placeholder="Enter transportation allowance"
                    disabled={!editing}
                    className="rounded-lg border-slate-300"
                  />
                  {validateForm(formData).transportationAllowance && (
                    <p className="text-xs text-red-500">{validateForm(formData).transportationAllowance}</p>
                  )}
                </div>
              )}
            </FormRow>
          </div>

          {/* Travel */}
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 mb-4 border border-violet-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-violet-600" />
              Travel
            </h3>
            <FormRow columns={2}>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Travel Type <span className="text-red-500">*</span></Label>
                <SelectField
                  options={BENEFIT_OPTIONS}
                  value={formData.travelType}
                  onChange={e => updateField('travelType')(e.target.value)}
                  disabled={!editing}
                />
              </div>

              {formData.travelType === 'ALLOWANCE' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Travel Allowance <span className="text-red-500">*</span></Label>
                  <Input
                    value={formatMoney(String(formData.travelAllowance))}
                    onChange={e => updateField('travelAllowance')(e.target.value)}
                    placeholder="Enter travel allowance"
                    disabled={!editing}
                    className="rounded-lg border-slate-300"
                  />
                  {validateForm(formData).travelAllowance && (
                    <p className="text-xs text-red-500">{validateForm(formData).travelAllowance}</p>
                  )}
                </div>
              )}
            </FormRow>
          </div>

          {/* Housing */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 mb-4 border border-amber-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              Housing
            </h3>
            <FormRow columns={2}>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Housing Type <span className="text-red-500">*</span></Label>
                <SelectField
                  options={BENEFIT_OPTIONS}
                  value={formData.housingType}
                  onChange={e => updateField('housingType')(e.target.value)}
                  disabled={!editing}
                />
              </div>

              {formData.housingType === 'ALLOWANCE' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Housing Allowance <span className="text-red-500">*</span></Label>
                  <Input
                    value={formatMoney(String(formData.housingAllowance))}
                    onChange={e => updateField('housingAllowance')(e.target.value)}
                    placeholder="Enter housing allowance"
                    disabled={!editing}
                    className="rounded-lg border-slate-300"
                  />
                  {validateForm(formData).housingAllowance && (
                    <p className="text-xs text-red-500">{validateForm(formData).housingAllowance}</p>
                  )}
                </div>
              )}
            </FormRow>
          </div>

          {/* Other Allowance */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-slate-600" />
              Other Allowance
            </h3>
            <FormRow columns={1}>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Other Allowance <span className="text-red-500">*</span></Label>
                <Input
                  value={formatMoney(String(formData.otherAllowance))}
                  onChange={e => updateField('otherAllowance')(e.target.value)}
                  placeholder="Enter other allowance"
                  disabled={!editing}
                  className="rounded-lg border-slate-300"
                />
                {validateForm(formData).otherAllowance && (
                  <p className="text-xs text-red-500">{validateForm(formData).otherAllowance}</p>
                )}
              </div>
            </FormRow>
          </div>
        </div>

        {/* Compensation Status Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-200 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            Compensation Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Compensation Status <span className="text-red-500">*</span></Label>
              <SelectField
                options={COMPENSATION_STATUS_OPTIONS}
                value={formData.compensationStatus}
                onChange={e => updateField('compensationStatus')(e.target.value)}
                disabled={!editing}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Effective From <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.effectiveFrom}
                onChange={e => updateField('effectiveFrom')(e.target.value)}
                disabled={!editing}
                className="rounded-lg border-slate-300"
              />
              {validateForm(formData).effectiveFrom && (
                <p className="text-xs text-red-500">{validateForm(formData).effectiveFrom}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Effective To
              </Label>
              <Input
                type="date"
                value={formData.effectiveTo}
                onChange={e => updateField('effectiveTo')(e.target.value)}
                disabled={!editing}
                className="rounded-lg border-slate-300"
              />
              {validateForm(formData).effectiveTo && (
                <p className="text-xs text-red-500">{validateForm(formData).effectiveTo}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
