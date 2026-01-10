import type { ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Eye } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { salaryService } from "@/service/salaryService";
import { formatMoney, generateId } from "@/lib/utils";
import { useParams } from "react-router-dom";
import { loanService } from "@/service/loanService";
import { SelectField } from "@/modules/hr/components/select-field";
import type { LoanPayload } from "@/types/hr/loan";
import { toast } from "sonner";

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
  // required fields for backend DTO: loanType, loanAmount, loanPeriod, startDate
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

  const [loans, setLoans] = useState<LoansModel[]>([]);
  const [loanTypeOptions, setLoanTypeOptions] = useState<Array<{value: string; label: string}>>([]);
  const [grossSalary, setGrossSalary] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [, setLoading] = useState(false);

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
    // fetch loan types for select (server-driven picklist)
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
      .catch(() => {
        // ignore - will fall back to hard-coded options
      });
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
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Employee Loans</h2>
        <Button
          onClick={handleAdd}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Loan
        </Button>
      </div>

      <div className="grid gap-4">
        {loans.map((loan) => (
          <Card key={loan.id}>
            <CardContent className="p-4">
              {editingId === loan.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Loan Type: <span className="text-red-500">*</span></Label>
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

                    <Field
                      label="Loan Amount:"
                      disabled={false}
                      value={formatMoney(loan.loanAmount)}
                      onChange={(v) => handleSave({ ...loan, loanAmount: v.replace(/[^0-9.]/g, "") })}
                      ariaLabel="Loan Amount"
                      required
                    />

                    <div>
                      <Label className="text-sm">Loan Status:</Label>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field
                      label="Start Date:"
                      type="date"
                      disabled={false}
                      value={loan.startDate}
                      onChange={(v) => handleSave({ ...loan, startDate: v })}
                      required
                    />

                    <div>
                      <Label className="text-sm">Loan Period:</Label>
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
                                className="w-24"
                              />
                              <span className="text-sm">years</span>
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
                                className="w-24"
                              />
                              <span className="text-sm">months</span>
                            </>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{(() => {
                        const total = Number(loan.loanPeriod || 0) || 0;
                        const y = Math.floor(total / 12);
                        const m = total % 12;
                        return `${y} year(s) ${m} month(s)`;
                      })()}</p>
                    </div>

                    <Field
                      label="Balance:"
                      disabled={true}
                      value={formatMoney(loan.balance)}
                      onChange={(v) => handleSave({ ...loan, balance: v.replace(/[^0-9.]/g, "") })}
                      ariaLabel="Loan Balance"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Note/Remarks:</Label>
                    <Textarea
                      value={loan.notes}
                      disabled={false}
                      onChange={(e) => handleSave({ ...loan, notes: e.target.value })}
                      className="min-h-[100px] mt-2"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold mb-3">Salary Breakdown</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Field
                        label="Gross Pay:"
                        disabled={false}
                        value={formatMoney(loan.grossPay)}
                        onChange={(v) => handleSave({ ...loan, grossPay: v.replace(/[^0-9.]/g, "") })}
                        ariaLabel="Gross Pay"
                        required
                      />
                      <Field
                        label="Deduction Amount:"
                        disabled={false}
                        value={formatMoney(loan.deductionAmount)}
                        onChange={(v) => handleSave({ ...loan, deductionAmount: v.replace(/[^0-9.]/g, "") })}
                        ariaLabel="Deduction Amount"
                        required
                      />
                      <Field
                        label="Net Pay:"
                        disabled={false}
                        value={formatMoney(loan.netPay)}
                        onChange={(v) => handleSave({ ...loan, netPay: v.replace(/[^0-9.]/g, "") })}
                        ariaLabel="Net Pay"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
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
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary View */}
                  {viewingId !== loan.id && (
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {loan.loanCode || "Loan"}
                        </h3>
                        <div className="text-sm text-gray-500 mt-1">
                          <p>Amount: {formatMoney(loan.loanAmount)}</p>
                          <p>Type: {loan.loanType || "N/A"} • Period: {loan.loanPeriod || "N/A"}</p>
                          <p>Status: {loan.loanStatus || "N/A"} • Balance: {formatMoney(loan.balance)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setViewingId(loan.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(loan)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(loan.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Full Details View */}
                  {viewingId === loan.id && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Loan Code</p>
                          <p className="text-sm mt-1">{loan.loanCode || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Loan Amount</p>
                          <p className="text-sm mt-1">{formatMoney(loan.loanAmount)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Loan Type</p>
                          <p className="text-sm mt-1">{loan.loanType || "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Loan Period</p>
                          <p className="text-sm mt-1">{loan.loanPeriod || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Start Date</p>
                          <p className="text-sm mt-1">{loan.startDate ? new Date(loan.startDate).toLocaleDateString() : "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Monthly Deductions</p>
                          <p className="text-sm mt-1">{formatMoney(loan.monthlyDeductions)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Loan Status</p>
                          <p className="text-sm mt-1">{loan.loanStatus || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Balance</p>
                          <p className="text-sm mt-1">{formatMoney(loan.balance)}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Salary Breakdown</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Gross Pay</p>
                            <p className="text-sm mt-1">{formatMoney(loan.grossPay)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Deduction Amount</p>
                            <p className="text-sm mt-1">{formatMoney(loan.deductionAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Net Pay</p>
                            <p className="text-sm mt-1">{formatMoney(loan.netPay)}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Notes/Remarks</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{loan.notes || "—"}</p>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={() => setViewingId(null)}>Close</Button>
                        <Button size="sm" onClick={() => { setViewingId(null); handleEdit(loan); }}>Edit</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {loans.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No loans added yet. Click "Add Loan" to add one.
        </div>
      )}
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
    <div className="space-y-1.5">
      <Label className="text-sm">
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
      />
    </div>
  );
}
