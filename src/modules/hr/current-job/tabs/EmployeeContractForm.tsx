import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, useRef, useMemo } from "react";
import { useEditableForm } from "@/modules/hr/hooks/use-editable-form";
import { useParams } from "react-router-dom";
import { contractService, type ContractApiPayload, type AllowancePayload, type AllowanceType } from "@/service/contractService";
import { toast } from "sonner";
import type { ContractType, ContractStatus } from "@/types/hr";
import { FormField } from "@/modules/hr/components/form-components";
import { Plus, Trash2, FileText, Calendar, DollarSign, PenTool, Upload, Clock, User, Hash } from "lucide-react";

/* ================= TYPES ================= */

interface SalaryAllowanceRow {
  id: string;
  allowanceTypeId: string;
  amount: string;
  effectiveDate: string;
  note: string;
}

interface ContractFormData {
  contractCode: string;
  staffName: string;
  contractType: ContractType;
  status: ContractStatus;
  effectiveDate: string;
  expirationDate: string;
  contractPeriodMonths: number;
  noticePeriodDays: number;
  salaryRateType: string;
  salaryRows: SalaryAllowanceRow[];
  signatureDate: string;
  signedBy: string;
  termsAndConditions: string;
  attachmentUrl: string;
}

interface ValidationErrors {
  [key: string]: string;
}

/* ================= HELPERS ================= */


const createEmptyRow = (): SalaryAllowanceRow => ({
  id: crypto.randomUUID(),
  allowanceTypeId: "",
  amount: "",
  effectiveDate: "",
  note: "",
});

/* ================= STATUS COLORS ================= */

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'DRAFT': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'EXPIRED': return 'bg-red-50 text-red-700 border-red-200';
    case 'TERMINATED': return 'bg-slate-50 text-slate-700 border-slate-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getContractTypeColor = (type: string) => {
  switch (type) {
    case 'PERMANENT': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'TEMPORARY': return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'CONTRACT': return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'PART_TIME': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'INTERN': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'CONSULTANT': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'PROBATION': return 'bg-rose-50 text-rose-700 border-rose-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

/* ================= COMPONENT ================= */

export default function EmployeeContractForm() {
  const { id } = useParams<{ id: string }>();

  const employeeId = (() => {
    if (!id || id.trim() === "") return undefined;
    const parsed = Number(id);
    if (isNaN(parsed) || parsed <= 0) return undefined;
    return parsed;
  })();

  const [exists, setExists] = useState(false);
  const [contractId, setContractId] = useState<number | null>(null);
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [loadingAllowanceTypes, setLoadingAllowanceTypes] = useState(true);
  const [allowanceTypesReady, setAllowanceTypesReady] = useState(false);
  const loadingContractRef = useRef(false);
  const allowanceTypesRef = useRef<AllowanceType[]>([]);
  const savingRef = useRef(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const contractLoadedRef = useRef(false);

  /* ================= LOAD ALLOWANCE TYPES ================= */

  useEffect(() => {
    const fetchAllowanceTypes = async () => {
      try {
        const types = await contractService.getAllowanceTypes();
        const typesArray = types || [];
        setAllowanceTypes(typesArray);
        allowanceTypesRef.current = typesArray;
      } catch (error) {
        console.error("Error loading allowance types:", error);
        setAllowanceTypes([]);
        allowanceTypesRef.current = [];
      } finally {
        setLoadingAllowanceTypes(false);
        setAllowanceTypesReady(true);
      }
    };

  fetchAllowanceTypes();
  }, []);

  // Memoized initial form data to prevent shared state across component instances
  const initialFormData = useMemo(() => ({
    contractCode: "",
    staffName: "",
    contractType: "PERMANENT" as ContractType,
    status: "DRAFT" as ContractStatus,
    effectiveDate: new Date().toISOString().slice(0, 10),
    expirationDate: "",
    contractPeriodMonths: 0,
    noticePeriodDays: 30,
    salaryRateType: "MONTHLY",
    salaryRows: [createEmptyRow()],
    signatureDate: new Date().toISOString().slice(0, 10),
    signedBy: "",
    termsAndConditions: "",
    attachmentUrl: "",
  }), []);

  const {
    editing,
    formData,
    updateField,
    setFields,
    handleEdit,
    handleSave,
    handleCancel,
  } = useEditableForm<ContractFormData>({
    initialData: initialFormData,
    onSave: async (data) => {
      if (savingRef.current) return;
      savingRef.current = true;

      const validEmployeeId = employeeId as number;
      if (!validEmployeeId) {
        savingRef.current = false;
        throw new Error("Invalid employee ID");
      }

      const allowances: AllowancePayload[] = data.salaryRows
        .filter((r) =>
          r.allowanceTypeId &&
          r.amount &&
          r.effectiveDate &&
          Number(r.amount) > 0
        )
        .map((r) => ({
          allowanceTypeId: Number(r.allowanceTypeId),  // ✅ CORRECT
          amount: Number(r.amount),
          effectiveDate: r.effectiveDate,
          note: r.note || undefined,
        }));

      if (allowances.length === 0) {
        savingRef.current = false;
        toast.error("Please add at least one valid allowance");
        return;
      }

      const payload: ContractApiPayload = {
        contractType: data.contractType,
        status: data.status,
        effectiveDate: data.effectiveDate,
        expirationDate: data.expirationDate || undefined,
        noticePeriodDays: data.noticePeriodDays || undefined,
        salaryRateType: data.salaryRateType || undefined,
        signatureDate: data.signatureDate || undefined,
        signedBy: data.signedBy || undefined,
        allowances,
      };

      try {
        if (exists && contractId) {
          await contractService.update(contractId, payload);
        } else {
          const result = await contractService.create(validEmployeeId, payload);
          if (result) {
            setContractId(result.id);
            setExists(true);
          }
        }

        // 🚀 ALWAYS reload using employeeId
        await loadContract(validEmployeeId);

        toast.success("Contract saved successfully");
      } catch (err: any) {
        toast.error(contractService.extractErrorMessage(err));
        savingRef.current = false;
        throw err;
      }

      savingRef.current = false;
    },
  });

  /* ================= LOAD CONTRACT ================= */

  const loadContract = async (empId: number) => {
    // Prevent multiple concurrent loads - use ref for synchronous check
    if (loadingContractRef.current) return;
    loadingContractRef.current = true;
    
    try {
      const fresh = await contractService.get(empId);
      if (!fresh) {
        loadingContractRef.current = false;
        return;
      }

      setExists(true);
      setContractId(fresh.id);

      // Read from ref to get the latest allowanceTypes (avoids stale closure)
      const currentAllowanceTypes = allowanceTypesRef.current;

      // Map allowances properly - try to match with allowance types first by ID, then by name
      const mappedSalaryRows = fresh.allowances?.map((a: AllowancePayload) => {
        // First try to find by ID if available
        let matchedTypeId = a.allowanceTypeId ? String(a.allowanceTypeId) : "";
        
        // If no ID match, try to find by name in allowanceTypes (from ref)
        if (!matchedTypeId && a.allowanceType && currentAllowanceTypes.length > 0) {
          const typeByName = currentAllowanceTypes.find(
            (t) => t.name.toLowerCase() === String(a.allowanceType).toLowerCase()
          );
          if (typeByName) {
            matchedTypeId = String(typeByName.id);
          }
        }
        
        return {
          id: crypto.randomUUID(),
          allowanceTypeId: matchedTypeId || String(a.allowanceTypeId ?? a.allowanceType ?? ""),
          amount: String(a.amount ?? ""),
          effectiveDate: a.effectiveDate ?? "",
          note: a.note ?? ""
        };
      }) ?? [createEmptyRow()];

      setFields({
        contractCode: fresh.contractCode ?? "",
        staffName: fresh.staffName ?? fresh.employeeName ?? fresh.staff?.name ?? "",
        contractType: fresh.contractType,
        status: fresh.status,
        effectiveDate: fresh.effectiveDate ?? "",
        expirationDate: fresh.expirationDate ?? "",
        contractPeriodMonths: fresh.contractPeriodMonths ?? 0,
        noticePeriodDays: fresh.noticePeriodDays ?? 30,
        salaryRateType: fresh.salaryRateType ?? "MONTHLY",
        signatureDate: fresh.signatureDate ?? "",
        signedBy: fresh.signedBy ?? "",
        termsAndConditions: fresh.termsAndConditions ?? "",
        attachmentUrl: fresh.attachmentUrl ?? "",
        salaryRows: mappedSalaryRows
      });
      
      // Mark contract as loaded
      contractLoadedRef.current = true;
    } catch (error) {
      console.error("Error loading contract:", error);
    } finally {
      loadingContractRef.current = false;
    }
  };

  useEffect(() => {
    if (!employeeId) return;

    // Only load contract after allowance types are ready (fixes race condition)
    if (allowanceTypesReady) {
      loadContract(employeeId);
    }
  }, [employeeId, allowanceTypesReady]);

  /* ================= EVENT BRIDGE ================= */

  useEffect(() => {
    document.addEventListener("contract:start-edit", handleEdit as EventListener);
    document.addEventListener("contract:save", handleSave as EventListener);
    document.addEventListener("contract:cancel", handleCancel as EventListener);
    return () => {
      document.removeEventListener("contract:start-edit", handleEdit as EventListener);
      document.removeEventListener("contract:save", handleSave as EventListener);
      document.removeEventListener("contract:cancel", handleCancel as EventListener);
    };
  }, [handleEdit, handleSave, handleCancel]);

  /* ================= VALIDATION ================= */

  const validateForm = (data: ContractFormData): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!data.staffName?.trim()) errors.staffName = "Staff name is required";
    if (!data.contractType) errors.contractType = "Contract type is required";
    if (!data.effectiveDate) errors.effectiveDate = "Effective date is required";
    if (!data.status) errors.status = "Status is required";
    return errors;
  };

  const errors = validateForm(formData);

  /* ================= SALARY ROW HELPERS ================= */

  const updateRow = (rowId: string, field: keyof SalaryAllowanceRow, value: string) => {
    updateField("salaryRows")(
      formData.salaryRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const addRow = () =>
    updateField("salaryRows")([...formData.salaryRows, createEmptyRow()]);

  const removeRow = (rowId: string) => {
    if (formData.salaryRows.length <= 1) return;
    updateField("salaryRows")(formData.salaryRows.filter((r) => r.id !== rowId));
  };

  /* ================= CALCULATED VALUES ================= */

  const totalSalary = formData.salaryRows.reduce((sum: number, row: SalaryAllowanceRow) => {
    const amount = parseFloat(row.amount.replace(/[^0-9.]/g, '')) || 0;
    return sum + amount;
  }, 0);

  const validRows = formData.salaryRows.filter(r => r.allowanceTypeId || r.amount);

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-violet-100 p-3 rounded-xl">
              <FileText className="h-6 w-6 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Employee Contract</h2>
                  <p className="text-sm text-slate-500 mt-1">Manage employment contract details and terms</p>
                </div>
                <div className="flex gap-2">
                  {formData.status && (
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${getStatusColor(formData.status)}`}>
                      {formData.status}
                    </span>
                  )}
                  {formData.contractType && (
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${getContractTypeColor(formData.contractType)}`}>
                      {formData.contractType}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Summary Card */}
        <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-2xl -ml-24 -mb-24"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold opacity-95">Contract Summary</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-white/70 mb-1">Contract Code</p>
                <p className="text-lg font-bold">{formData.contractCode || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/70 mb-1">Duration</p>
                <p className="text-lg font-bold">{formData.contractPeriodMonths ? `${formData.contractPeriodMonths} months` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/70 mb-1">Start Date</p>
                <p className="text-lg font-bold">{formData.effectiveDate || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/70 mb-1">Notice Period</p>
                <p className="text-lg font-bold">{formData.noticePeriodDays ? `${formData.noticePeriodDays} days` : '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-8">

          {/* General Information Section */}
          <section>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <User className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">General Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              <FormField label="Contract Code" required>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                    disabled={!editing}
                    value={formData.contractCode}
                    onChange={(e) => updateField("contractCode")(e.target.value)}
                  />
                </div>
              </FormField>

              <FormField label="Staff Name" required error={errors.staffName}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                    disabled={!editing}
                    placeholder="Enter staff name"
                    value={formData.staffName}
                    onChange={(e) => updateField("staffName")(e.target.value)}
                  />
                </div>
              </FormField>

              <FormField label="Contract Type" required error={errors.contractType}>
                <Select
                  value={formData.contractType}
                  onValueChange={(v) => updateField("contractType")(v as ContractType)}
                  disabled={!editing}
                >
                  <SelectTrigger className="h-11 border-slate-300 rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERMANENT">Permanent</SelectItem>
                    <SelectItem value="TEMPORARY">Temporary</SelectItem>
                    <SelectItem value="INTERN">Intern</SelectItem>
                    <SelectItem value="CONSULTANT">Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Status" required error={errors.status}>
                <Select
                  value={formData.status}
                  onValueChange={(v) => updateField("status")(v as ContractStatus)}
                  disabled={!editing}
                >
                  <SelectTrigger className="h-11 border-slate-300 rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Effective Date" required error={errors.effectiveDate}>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                    disabled={!editing}
                    value={formData.effectiveDate}
                    onChange={(e) => updateField("effectiveDate")(e.target.value)}
                  />
                </div>
              </FormField>

              <FormField label="Expiration Date">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="date"
                    className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                    disabled={!editing}
                    value={formData.expirationDate}
                    onChange={(e) => updateField("expirationDate")(e.target.value)}
                  />
                </div>
              </FormField>

              <FormField label="Contract Period (Months)">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                    disabled={!editing}
                    placeholder="0"
                    value={formData.contractPeriodMonths || ''}
                    onChange={(e) => updateField("contractPeriodMonths")(Number(e.target.value))}
                  />
                </div>
              </FormField>

              <FormField label="Notice Period (Days)">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700"
                    disabled={!editing}
                    placeholder="30"
                    value={formData.noticePeriodDays || ''}
                    onChange={(e) => updateField("noticePeriodDays")(Number(e.target.value))}
                  />
                </div>
              </FormField>

              <FormField label="Salary Rate Type">
                <Select
                  value={formData.salaryRateType}
                  onValueChange={(v) => updateField("salaryRateType")(v)}
                  disabled={!editing}
                >
                  <SelectTrigger className="h-11 border-slate-300 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </section>

          {/* Salary & Allowances Section */}
          <section>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-800">Salary & Allowances</h2>
                <p className="text-sm text-slate-500 mt-1">Define salary structure and additional allowances</p>
              </div>
              {validRows.length > 0 && (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200">
                  <span className="font-semibold">Total:</span> ${totalSalary.toLocaleString()}
                </div>
              )}
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700">
                    <th className="w-12 px-4 py-3 text-center font-semibold border-r border-slate-200">#</th>
                    <th className="px-4 py-3 text-left font-semibold border-r border-slate-200 min-w-[200px]">Allowance Type</th>
                    <th className="w-40 px-4 py-3 text-left font-semibold border-r border-slate-200">Amount</th>
                    <th className="w-40 px-4 py-3 text-left font-semibold border-r border-slate-200">Effective Date</th>
                    <th className="px-4 py-3 text-left font-semibold border-r border-slate-200 min-w-[150px]">Note</th>
                    {editing && <th className="w-14 px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {formData.salaryRows.map((row, idx) => (
                    <tr key={row.id} className={`border-t border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/50 transition-colors`}>
                      <td className="px-4 py-3 text-center text-slate-500 border-r border-slate-200 font-medium">{idx + 1}</td>
                      <td className="px-2 py-2 border-r border-slate-200">
                        {loadingAllowanceTypes ? (
                          <Input 
                            className="h-10 border-0 shadow-none bg-transparent rounded-lg" 
                            disabled 
                            placeholder="Loading..." 
                          />
                        ) : allowanceTypes.length > 0 ? (
                          <Select
                            value={row.allowanceTypeId}
                            onValueChange={(v) => updateRow(row.id, "allowanceTypeId", v)}
                            disabled={!editing}
                          >
                            <SelectTrigger className="h-10 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-indigo-400 bg-transparent rounded-lg">
                              <SelectValue placeholder="Select allowance" />
                            </SelectTrigger>
                            <SelectContent>
                              {allowanceTypes.map((type) => (
                                <SelectItem key={type.id} value={String(type.id)}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input 
                            className="h-10 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-indigo-400 bg-transparent rounded-lg" 
                            disabled={!editing} 
                            value={row.allowanceTypeId} 
                            onChange={(e) => updateRow(row.id, "allowanceTypeId", e.target.value)} 
                            placeholder={editing ? "Enter allowance type..." : ""} 
                          />
                        )}
                      </td>
                      <td className="px-2 py-2 border-r border-slate-200">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                          <Input
                            type="text"
                            className="h-10 pl-7 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-indigo-400 bg-transparent rounded-lg"
                            disabled={!editing}
                            value={row.amount}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9.]/g, "");
                              updateRow(row.id, "amount", clean);
                            }}
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                      <td className="px-2 py-2 border-r border-slate-200">
                        <Input 
                          type="date" 
                          className="h-10 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-indigo-400 bg-transparent rounded-lg" 
                          disabled={!editing} 
                          value={row.effectiveDate} 
                          onChange={(e) => updateRow(row.id, "effectiveDate", e.target.value)} 
                        />
                      </td>
                      <td className="px-2 py-2 border-r border-slate-200">
                        <Input 
                          className="h-10 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-indigo-400 bg-transparent rounded-lg" 
                          disabled={!editing} 
                          value={row.note} 
                          onChange={(e) => updateRow(row.id, "note", e.target.value)} 
                          placeholder={editing ? "Add note..." : ""} 
                        />
                      </td>
                      {editing && (
                        <td className="px-2 py-2 text-center">
                          <button 
                            type="button" 
                            onClick={() => removeRow(row.id)} 
                            className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {editing && (
                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                  <button 
                    type="button" 
                    onClick={addRow} 
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors px-3 py-2 hover:bg-indigo-50 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    Add Allowance Row
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Signing Information Section */}
          <section>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <PenTool className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Signing Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <FormField label="Signature Date">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="date" 
                    className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700" 
                    disabled={!editing} 
                    value={formData.signatureDate} 
                    onChange={(e) => updateField("signatureDate")(e.target.value)} 
                  />
                </div>
              </FormField>

              <FormField label="Signed By">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    className="h-11 pl-10 border-slate-300 rounded-xl disabled:bg-slate-50 disabled:text-slate-700" 
                    disabled={!editing} 
                    placeholder="Enter signatory name"
                    value={formData.signedBy} 
                    onChange={(e) => updateField("signedBy")(e.target.value)} 
                  />
                </div>
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Attachment">
                  <div className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Upload className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      {attachmentFile ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-indigo-600" />
                          <span className="font-medium text-slate-700">{attachmentFile?.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setAttachmentFile(null);
                              updateField("attachmentUrl")("");
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-slate-700 font-medium">
                            {editing ? "Click to upload or drag and drop" : "No file uploaded"}
                          </p>
                          <p className="text-xs text-slate-500">PDF, DOC, DOCX up to 10MB</p>
                        </div>
                      )}
                    </div>
                    {editing && (
                      <label className={`cursor-pointer px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md ${!editing ? 'opacity-50 pointer-events-none' : ''}`}>
                        Browse Files
                        <input 
                          type="file" 
                          className="hidden" 
                          disabled={!editing} 
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => { 
                            const file = e.target.files?.[0] ?? null; 
                            setAttachmentFile(file); 
                            if (file) updateField("attachmentUrl")(file.name); 
                          }} 
                        />
                      </label>
                    )}
                  </div>
                </FormField>
              </div>

              <div className="md:col-span-2">
                <FormField label="Terms and Conditions">
                  <textarea
                    className="w-full min-h-[100px] p-3 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-700 transition-all resize-none"
                    disabled={!editing}
                    value={formData.termsAndConditions}
                    onChange={(e) => updateField("termsAndConditions")(e.target.value)}
                    placeholder="Enter any additional terms and conditions..."
                  />
                </FormField>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
