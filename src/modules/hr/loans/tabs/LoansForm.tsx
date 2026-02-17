import type { ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Eye, DollarSign, Calendar, TrendingUp, FileText } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { salaryService } from "@/service/salaryService";
import { formatMoney, generateId } from "@/lib/utils";
import { useParams } from "react-router-dom";
import { loanService } from "@/service/loanService";
import { SelectField } from "@/modules/hr/components/select-field";
import type { LoanPayload } from "@/types/hr/loan";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { fetchCompany } from "@/service/companyService";

type LoansModel = {
  id: string;
  loanCode: string;
  loanAmount: string;
  notes: string;
  loanType: string;
  loanPeriod: string;
  startDate: string;
  monthlyDeductions: string;
  loanStatus: string;
  balance: string;
  grossPay: string;
  deductionAmount: string;
  netPay: string;
};

function validateLoan(loan: LoansModel): boolean {
  const amountOk = loan.loanAmount.trim() !== "" && !isNaN(Number(loan.loanAmount)) && Number(loan.loanAmount) > 0;
  const typeOk = loan.loanType.trim() !== "";
  const periodNum = Number(loan.loanPeriod);
  const periodOk = loan.loanPeriod.trim() !== "" && Number.isInteger(periodNum) && periodNum > 0;
  const dateOk = loan.startDate.trim() !== "";
  return amountOk && typeOk && periodOk && dateOk;
}

const INITIAL_LOAN: LoansModel = {
  id: "",
  loanCode: "",
  loanAmount: "",
  notes: "",
  loanType: "",
  loanPeriod: "",
  startDate: "",
  monthlyDeductions: "",
  loanStatus: "",
  balance: "",
  grossPay: "0",
  deductionAmount: "0",
  netPay: "0",
};

export default function LoansForm(): ReactElement {
  const params = useParams<{ id: string }>();
  const employeeId = params.id ? Number(params.id) : undefined;
  const { user } = useAuth();

  const [loans, setLoans] = useState<LoansModel[]>([]);
  const [loanTypeOptions, setLoanTypeOptions] = useState<Array<{value: string; label: string}>>([]);
  const [grossSalary, setGrossSalary] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const handleAdd = useCallback(() => {
    const gross = grossSalary || 0;
    const newLoan = {
      ...INITIAL_LOAN,
      id: generateId(),
      grossPay: String(gross),
      deductionAmount: String(0),
      netPay: String(gross),
    };
    setLoans(current => [...current, newLoan]);
    setEditingId(newLoan.id);
  }, [grossSalary]);

  const mapApiToForm = (api: any): LoansModel => ({
    id: String(api.id),
    loanCode: api.loanCode ?? "",
    loanAmount: api.loanAmount != null ? String(api.loanAmount) : "",
    notes: api.notes ?? "",
    loanType: api.loanType ?? "",
    loanPeriod: api.loanPeriod != null ? String(api.loanPeriod) : "",
    startDate: api.startDate ?? "",
    monthlyDeductions: api.monthlyDeduction != null ? String(api.monthlyDeduction) : "",
    loanStatus: api.status ?? "",
    balance: api.balance != null ? String(api.balance) : "",
    grossPay: api.grossPay != null ? String(api.grossPay) : "0",
    deductionAmount: api.deductionAmount != null ? String(api.deductionAmount) : "0",
    netPay: api.netPay != null ? String(api.netPay) : "0",
  });

  const mapFormToPayload = (f: LoansModel): LoanPayload => ({
    loanType: f.loanType as any,
    loanAmount: Number(f.loanAmount || 0),
    loanPeriod: Number(f.loanPeriod || 0),
    startDate: f.startDate || "",
    notes: f.notes || undefined,
  });

  const loadLoans = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await loanService.getLoans(employeeId);
      const mapped = (res.data || []).map(mapApiToForm).map(l => {
        const monthly = Number(l.monthlyDeductions || 0);
        const gross = grossSalary || Number(l.grossPay || 0);
        const deduction = monthly;
        const net = gross - deduction;
        return {
          ...l,
          grossPay: String(gross),
          deductionAmount: String(deduction),
          netPay: String(net),
        } as LoansModel;
      });
      setLoans(mapped);
    } catch (err: any) {
      console.error("LoansForm -> loadLoans failed", err);
      toast.error(err?.response?.data?.message || "Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [employeeId, grossSalary]);

  useEffect(() => {
    if (!employeeId) return;
    void loanService.getLoanTypes(employeeId)
      .then((res) => {
        const types: string[] = res.data || [];
        const mapLabel = (t: string) => {
          switch (t) {
            case "CAR_LOAN": return "Car Loan";
            case "PERSONAL_LOAN": return "Personal Loan";
            case "HOUSING_LOAN": return "Housing Loan";
            case "EDUCATION_LOAN": return "Education Loan";
            case "MEDICAL_LOAN": return "Medical Loan";
            default: return t.replace(/_/g, " ");
          }
        };
        setLoanTypeOptions(types.map(t => ({ value: t, label: mapLabel(t) })));
      })
      .catch(() => {});
    salaryService
      .get(employeeId)
      .then((res) => {
        const data = res.data || {};
        const gross = Number(data.totalCompensation ?? data.total_compensation ?? data.grossPay ?? 0) || 0;
        setGrossSalary(gross);
      })
      .catch((err) => {
        console.error("Failed to load salary", err);
      });
  }, [employeeId]);

  useEffect(() => {
    void loadLoans();
  }, [loadLoans]);

  useEffect(() => {
    if (user?.companyId) {
      fetchCompany(user.companyId.toString())
        .then((company) => {
          if (company?.currency?.currencySymbol) {
            setCurrencySymbol(company.currency.currencySymbol);
          }
        })
        .catch((err) => {
          console.error("Failed to load company currency", err);
        });
    }
  }, [user?.companyId]);

  const handleEdit = useCallback((loan: LoansModel) => {
    setEditingId(loan.id);
  }, []);

  const handleSave = useCallback((loan: LoansModel) => {
    const monthly = Number(loan.monthlyDeductions || 0);
    const gross = grossSalary || Number(loan.grossPay || 0);
    const deduction = monthly;
    const net = gross - deduction;
    const updated = { ...loan, grossPay: String(gross), deductionAmount: String(deduction), netPay: String(net) } as LoansModel;
    setLoans(current => current.map(l => l.id === loan.id ? updated : l));
  }, [grossSalary]);

  const persistLoan = useCallback(async (loan: LoansModel) => {
    if (!employeeId) {
      toast.error("No employee selected");
      return;
    }

    const payload = mapFormToPayload(loan);

    try {
      if (/^\d+$/.test(loan.id)) {
        await loanService.updateLoan(employeeId!, Number(loan.id), payload);
        toast.success("Loan updated");
      } else {
        await loanService.applyLoan(employeeId, payload);
        toast.success("Loan created");
      }
      await loadLoans();
    } catch (err: any) {
      console.error("LoansForm -> persist failed", err);
      toast.error(err?.response?.data?.message || "Failed to save loan");
    }
  }, [employeeId, loadLoans]);

  const handleCancel = useCallback(() => {
    setLoans(current => 
      current.filter(l => l.id !== editingId || l.loanCode.trim() !== "")
    );
    setEditingId(null);
  }, [editingId]);

  const handleDelete = useCallback((id: string) => {
    if (!window.confirm('Are you sure you want to delete this loan?')) return;
    
    setLoans(current => current.filter(l => l.id !== id));
    setEditingId(null);
    toast.success("Loan removed locally");
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CLOSED': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Employee Loans
            </h2>
            <p className="text-sm text-slate-500 mt-1">Manage loan details and repayment schedules</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-blue-600 text-white shadow-lg flex items-center gap-2 px-6 py-3 rounded-xl"
          >
            <Plus className="h-5 w-5" />
            Add Loan
          </Button>
        </div>
      </div>

      {/* Loans Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          Loans Details
        </h3>

        {/* Loans Grid */}
        <div className="grid gap-6">
          {loans.map((loan) => (
            <div key={loan.id} className="border border-slate-200 rounded-lg p-6 mb-6">
                {editingId === loan.id ? (
                  <div className="p-6 bg-gradient-to-br from-white to-slate-50">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium opacity-90">Loan Amount</span>
                        </div>
                        <p className="text-2xl font-bold">{formatMoney(loan.loanAmount, currencySymbol) || `${currencySymbol}0.00`}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium opacity-90">Monthly Payment</span>
                        </div>
                        <p className="text-2xl font-bold">{formatMoney(loan.monthlyDeductions, currencySymbol) || `${currencySymbol}0.00`}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <FileText className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium opacity-90">Balance</span>
                        </div>
                        <p className="text-2xl font-bold">{formatMoney(loan.balance, currencySymbol) || `${currencySymbol}0.00`}</p>
                      </div>
                    </div>

                    {/* Loan Details Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">Loan Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Loan Type <span className="text-red-500">*</span></Label>
                          <SelectField
                            value={loan.loanType}
                            onChange={(e) => handleSave({ ...loan, loanType: e.target.value })}
                            options={loanTypeOptions.length > 0 ? loanTypeOptions : [
                              { value: "CAR_LOAN", label: "Car Loan" },
                              { value: "PERSONAL_LOAN", label: "Personal Loan" },
                              { value: "HOUSING_LOAN", label: "Housing Loan" },
                              { value: "EDUCATION_LOAN", label: "Education Loan" },
                              { value: "MEDICAL_LOAN", label: "Medical Loan" },
                            ]}
                            placeholder="Select Loan Type"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Loan Amount <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">$</span>
                            <Input
                              type="number"
                              value={loan.loanAmount || ''}
                              onChange={(e) => handleSave({ ...loan, loanAmount: e.target.value })}
                              placeholder="Enter loan amount"
                              disabled={false}
                              className="rounded-lg border-slate-300 pl-8"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700">Loan Status</Label>
                          <SelectField
                            value={loan.loanStatus}
                            onChange={(e) => handleSave({ ...loan, loanStatus: e.target.value })}
                            options={[
                              { value: "ACTIVE", label: "ACTIVE" },
                              { value: "CLOSED", label: "CLOSED" },
                            ]}
                            placeholder="Select Status"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <Field
                          label="Start Date"
                          type="date"
                          disabled={false}
                          value={loan.startDate}
                          onChange={(v) => handleSave({ ...loan, startDate: v })}
                          required
                        />

                        <div>
                          <Label className="text-sm font-medium text-slate-700">Loan Period</Label>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const total = Number(loan.loanPeriod || 0) || 0;
                              const years = Math.floor(total / 12);
                              const months = total % 12;
                              return (
                                <>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={String(years)}
                                    onChange={(e) => {
                                      const y = Math.max(0, Number(e.target.value) || 0);
                                      const newTotal = y * 12 + months;
                                      handleSave({ ...loan, loanPeriod: String(newTotal) });
                                    }}
                                    aria-label="years"
                                    className="w-24 rounded-lg border-slate-300"
                                  />
                                  <span className="text-sm text-slate-600">years</span>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={11}
                                    value={String(months)}
                                    onChange={(e) => {
                                      let m = Number(e.target.value) || 0;
                                      if (m < 0) m = 0;
                                      if (m > 11) m = 11;
                                      const newTotal = years * 12 + m;
                                      handleSave({ ...loan, loanPeriod: String(newTotal) });
                                    }}
                                    aria-label="months"
                                    className="w-24 rounded-lg border-slate-300"
                                  />
                                  <span className="text-sm text-slate-600">months</span>
                                </>
                              );
                            })()}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{(() => {
                            const total = Number(loan.loanPeriod || 0) || 0;
                            const y = Math.floor(total / 12);
                            const m = total % 12;
                            return `${y} year(s) ${m} month(s)`;
                          })()}</p>
                        </div>

                        <Field
                          label="Balance"
                          disabled={true}
                          value={formatMoney(loan.balance)}
                          onChange={(v) => handleSave({ ...loan, balance: v.replace(/[^0-9.]/g, "") })}
                          ariaLabel="Loan Balance"
                          required
                        />
                      </div>

                      <div className="mt-4">
                        <Label className="text-sm font-medium text-slate-700">Note/Remarks</Label>
                        <Textarea
                          value={loan.notes}
                          disabled={false}
                          onChange={(e) => handleSave({ ...loan, notes: e.target.value })}
                          className="min-h-[100px] mt-2 rounded-lg border-slate-300"
                          placeholder="Enter any additional notes or remarks..."
                        />
                      </div>
                    </div>

                    {/* Salary Breakdown Section */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 shadow-sm border border-blue-100">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Salary Breakdown</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field
                          label="Gross Pay"
                          disabled={false}
                          value={formatMoney(loan.grossPay, currencySymbol)}
                          onChange={(v) => handleSave({ ...loan, grossPay: v.replace(/[^0-9.]/g, "") })}
                          ariaLabel="Gross Pay"
                          required
                        />
                        <Field
                          label="Deduction Amount"
                          disabled={false}
                          value={formatMoney(loan.deductionAmount, currencySymbol)}
                          onChange={(v) => handleSave({ ...loan, deductionAmount: v.replace(/[^0-9.]/g, "") })}
                          ariaLabel="Deduction Amount"
                          required
                        />
                        <Field
                          label="Net Pay"
                          disabled={false}
                          value={formatMoney(loan.netPay, currencySymbol)}
                          onChange={(v) => handleSave({ ...loan, netPay: v.replace(/[^0-9.]/g, "") })}
                          ariaLabel="Net Pay"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="px-6 rounded-lg border-slate-300"
                      >
                        Cancel
                      </Button>
                      <Button 
                        disabled={!validateLoan(loan)}
                        onClick={async () => {
                          handleSave(loan);
                          await persistLoan(loan);
                          setEditingId(null);
                        }}
                        className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg"
                      >
                        Save Loan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    {/* Summary View */}
                    {viewingId !== loan.id && (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-slate-800">
                              {loan.loanCode || "Loan"}
                            </h3>
                            {loan.loanStatus && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(loan.loanStatus)}`}>
                                {loan.loanStatus}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                              <p className="text-xs text-slate-600 mb-1">Amount</p>
                              <p className="text-lg font-bold text-blue-700">{formatMoney(loan.loanAmount, currencySymbol)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
                              <p className="text-xs text-slate-600 mb-1">Type</p>
                              <p className="text-sm font-semibold text-emerald-700">{loan.loanType || "N/A"}</p>
                            </div>
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                              <p className="text-xs text-slate-600 mb-1">Period</p>
                              <p className="text-sm font-semibold text-violet-700">{loan.loanPeriod || "N/A"} months</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100">
                              <p className="text-xs text-slate-600 mb-1">Balance</p>
                              <p className="text-lg font-bold text-amber-700">{formatMoney(loan.balance, currencySymbol)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingId(loan.id)}
                            className="flex items-center gap-1 rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(loan)}
                            className="rounded-lg"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(loan.id)}
                            className="text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Full Details View */}
                    {viewingId === loan.id && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-slate-800">{loan.loanCode || "Loan Details"}</h3>
                          {loan.loanStatus && (
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(loan.loanStatus)}`}>
                              {loan.loanStatus}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <InfoCard icon={DollarSign} label="Loan Amount" value={formatMoney(loan.loanAmount, currencySymbol)} color="blue" />
                          <InfoCard icon={Calendar} label="Start Date" value={loan.startDate ? new Date(loan.startDate).toLocaleDateString() : "—"} color="emerald" />
                          <InfoCard icon={TrendingUp} label="Monthly Deduction" value={formatMoney(loan.monthlyDeductions, currencySymbol)} color="violet" />
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">Loan Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label="Loan Type" value={loan.loanType || "—"} />
                            <DetailItem label="Loan Period" value={loan.loanPeriod ? `${loan.loanPeriod} months` : "—"} />
                            <DetailItem label="Balance" value={formatMoney(loan.balance, currencySymbol)} />
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">Salary Breakdown</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <DetailItem label="Gross Pay" value={formatMoney(loan.grossPay, currencySymbol)} />
                            <DetailItem label="Deduction Amount" value={formatMoney(loan.deductionAmount, currencySymbol)} />
                            <DetailItem label="Net Pay" value={formatMoney(loan.netPay, currencySymbol)} />
                          </div>
                        </div>

                        {loan.notes && (
                          <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                            <h4 className="text-lg font-semibold text-slate-800 mb-2">Notes/Remarks</h4>
                            <p className="text-slate-700 whitespace-pre-wrap">{loan.notes}</p>
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setViewingId(null)}
                            className="rounded-lg border-slate-300"
                          >
                            Close
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => { setViewingId(null); handleEdit(loan); }}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg"
                          >
                            Edit Loan
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>

        {loans.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center mt-6">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No loans added yet</h3>
            <p className="text-slate-600 mb-6">Click "Add Loan" to create your first employee loan</p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg rounded-xl px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Loan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  ariaLabel?: string;
  required?: boolean;
}) {
  const { label, value, onChange, type = "text", disabled, ariaLabel, required } = props;
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        required={required}
        className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    violet: 'from-violet-500 to-purple-600',
  };
  const gradient = colorClasses[color] ?? colorClasses.blue;
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-5 text-white shadow-lg`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium opacity-90">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">{label}</p>
      <p className="text-base text-slate-800 font-medium">{value}</p>
    </div>
  );
}
