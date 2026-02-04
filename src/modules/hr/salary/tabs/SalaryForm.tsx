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
import { DollarSign, TrendingUp, Calendar, CheckCircle, Plane, Home, Car, Sparkles } from "lucide-react";

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full opacity-20 blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full opacity-20 blur-2xl -ml-16 -mb-16"></div>
          <div className="relative">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Salary Information</h1>
                <p className="text-slate-600 text-base">Manage employee compensation details and benefits</p>
              </div>
              {formData.compensationStatus && (
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${getStatusColor(formData.compensationStatus)}`}>
                  {formData.compensationStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Compensation Card */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl -ml-24 -mb-24"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold opacity-95">Total Compensation Package</span>
            </div>
            <p className="text-4xl font-bold mb-2">{formatMoney(grossPay)}</p>
            <div className="flex items-center gap-4 text-sm opacity-90">
              <span>Basic: {formatMoney(String(formData.basicSalary))}</span>
              <span>•</span>
              <span>Allowances: {formatMoney(totalAllowance)}</span>
            </div>
          </div>
        </div>

        {/* Compensation Components Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Compensation Components</h2>
          </div>

          {/* Basic Salary */}
          <div className="mb-8">
            <FormRow columns={1}>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Basic Salary <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 font-semibold text-lg">$</span>
                  <Input
                    type="number"
                    value={formData.basicSalary || ''}
                    onChange={e => updateField('basicSalary')(e.target.value)}
                    placeholder="0.00"
                    disabled={!editing}
                    className="rounded-xl border-slate-300 text-xl font-bold pl-10 h-14 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    min="0"
                    step="0.01"
                  />
                </div>
                {validateForm(formData).basicSalary && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span className="font-medium">⚠</span> {validateForm(formData).basicSalary}
                  </p>
                )}
              </div>
            </FormRow>
          </div>

          <div className="space-y-8">
            {/* Transportation */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-blue-900">Transportation</h4>
                  <p className="text-xs text-blue-700">Vehicle and commute benefits</p>
                </div>
              </div>
              <FormRow columns={2}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Benefit Type <span className="text-red-500">*</span></Label>
                  <SelectField
                    options={BENEFIT_OPTIONS}
                    value={formData.transportationType}
                    onChange={e => updateField('transportationType')(e.target.value)}
                    disabled={!editing}
                  />
                </div>

                {formData.transportationType === 'ALLOWANCE' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Allowance Amount <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 font-medium">$</span>
                      <Input
                        type="number"
                        value={formData.transportationAllowance || ''}
                        onChange={e => updateField('transportationAllowance')(e.target.value)}
                        placeholder="0.00"
                        disabled={!editing}
                        className="rounded-xl border-slate-300 pl-9 h-11 shadow-sm focus:ring-2 focus:ring-blue-400"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {validateForm(formData).transportationAllowance && (
                      <p className="text-xs text-red-500">{validateForm(formData).transportationAllowance}</p>
                    )}
                  </div>
                )}
              </FormRow>
            </div>

            {/* Travel */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-md">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-violet-900">Travel</h4>
                  <p className="text-xs text-violet-700">Business travel and trip benefits</p>
                </div>
              </div>
              <FormRow columns={2}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Benefit Type <span className="text-red-500">*</span></Label>
                  <SelectField
                    options={BENEFIT_OPTIONS}
                    value={formData.travelType}
                    onChange={e => updateField('travelType')(e.target.value)}
                    disabled={!editing}
                  />
                </div>

                {formData.travelType === 'ALLOWANCE' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Allowance Amount <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 font-medium">$</span>
                      <Input
                        type="number"
                        value={formData.travelAllowance || ''}
                        onChange={e => updateField('travelAllowance')(e.target.value)}
                        placeholder="0.00"
                        disabled={!editing}
                        className="rounded-xl border-slate-300 pl-9 h-11 shadow-sm focus:ring-2 focus:ring-violet-400"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {validateForm(formData).travelAllowance && (
                      <p className="text-xs text-red-500">{validateForm(formData).travelAllowance}</p>
                    )}
                  </div>
                )}
              </FormRow>
            </div>

            {/* Housing */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-md">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-amber-900">Housing</h4>
                  <p className="text-xs text-amber-700">Accommodation and residence benefits</p>
                </div>
              </div>
              <FormRow columns={2}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Benefit Type <span className="text-red-500">*</span></Label>
                  <SelectField
                    options={BENEFIT_OPTIONS}
                    value={formData.housingType}
                    onChange={e => updateField('housingType')(e.target.value)}
                    disabled={!editing}
                  />
                </div>

                {formData.housingType === 'ALLOWANCE' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Allowance Amount <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 font-medium">$</span>
                      <Input
                        type="number"
                        value={formData.housingAllowance || ''}
                        onChange={e => updateField('housingAllowance')(e.target.value)}
                        placeholder="0.00"
                        disabled={!editing}
                        className="rounded-xl border-slate-300 pl-9 h-11 shadow-sm focus:ring-2 focus:ring-amber-400"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {validateForm(formData).housingAllowance && (
                      <p className="text-xs text-red-500">{validateForm(formData).housingAllowance}</p>
                    )}
                  </div>
                )}
              </FormRow>
            </div>

            {/* Other Allowance */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-6 border border-slate-200/50 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Other Allowance</h4>
                  <p className="text-xs text-slate-700">Additional compensation and perks</p>
                </div>
              </div>
              <FormRow columns={1}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Allowance Amount <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 font-medium">$</span>
                    <Input
                      type="number"
                      value={formData.otherAllowance || ''}
                      onChange={e => updateField('otherAllowance')(e.target.value)}
                      placeholder="0.00"
                      disabled={!editing}
                      className="rounded-xl border-slate-300 pl-9 h-11 shadow-sm focus:ring-2 focus:ring-slate-400"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {validateForm(formData).otherAllowance && (
                    <p className="text-xs text-red-500">{validateForm(formData).otherAllowance}</p>
                  )}
                </div>
              </FormRow>
            </div>
          </div>
        </div>

        {/* Compensation Status Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Compensation Status & Dates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Status <span className="text-red-500">*</span></Label>
              <SelectField
                options={COMPENSATION_STATUS_OPTIONS}
                value={formData.compensationStatus}
                onChange={e => updateField('compensationStatus')(e.target.value)}
                disabled={!editing}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Effective From <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.effectiveFrom}
                onChange={e => updateField('effectiveFrom')(e.target.value)}
                disabled={!editing}
                className="rounded-xl border-slate-300 h-11 shadow-sm focus:ring-2 focus:ring-emerald-400"
              />
              {validateForm(formData).effectiveFrom && (
                <p className="text-xs text-red-500">{validateForm(formData).effectiveFrom}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-600" />
                Effective To
              </Label>
              <Input
                type="date"
                value={formData.effectiveTo}
                onChange={e => updateField('effectiveTo')(e.target.value)}
                disabled={!editing}
                className="rounded-xl border-slate-300 h-11 shadow-sm focus:ring-2 focus:ring-slate-400"
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