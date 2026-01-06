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
  return (
    loan.loanCode.trim() !== "" &&
    loan.loanAmount.trim() !== "" &&
    loan.loanType.trim() !== "" &&
    loan.loanPeriod.trim() !== "" &&
    loan.startDate.trim() !== "" &&
    loan.monthlyDeductions.trim() !== "" &&
    loan.loanStatus.trim() !== "" &&
    loan.balance.trim() !== "" &&
    loan.grossPay.trim() !== "" &&
    loan.deductionAmount.trim() !== "" &&
    loan.netPay.trim() !== ""
  );
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
    loanCode: f.loanCode,
    loanAmount: Number(f.loanAmount || 0),
    loanPeriod: Number(f.loanPeriod || 0),
    monthlyDeduction: Number(f.monthlyDeductions || 0),
    startDate: f.startDate || "",
  });

  const loadLoans = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await loanService.getAll(employeeId);
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
        await loanService.update(Number(loan.id), payload);
        toast.success("Loan updated");
      } else {
        await loanService.create(employeeId, payload);
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
          variant="outline"
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
                    <Field
                      label="Loan Code:"
                      disabled={false}
                      value={loan.loanCode}
                      onChange={(v) => handleSave({ ...loan, loanCode: v })}
                      required
                    />
                    <Field
                      label="Loan Amount:"
                      disabled={false}
                      value={formatMoney(loan.loanAmount)}
                      onChange={(v) => handleSave({ ...loan, loanAmount: v.replace(/[^0-9.]/g, "") })}
                      ariaLabel="Loan Amount"
                      required
                    />
                    <div className="md:col-span-1">
                      <Label className="text-sm">Note/Remarks:</Label>
                      <Textarea
                        value={loan.notes}
                        disabled={false}
                        onChange={(e) => handleSave({ ...loan, notes: e.target.value })}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field
                      label="Loan Type:"
                      disabled={false}
                      value={loan.loanType}
                      onChange={(v) => handleSave({ ...loan, loanType: v })}
                      required
                    />
                    <Field
                      label="Loan Period:"
                      disabled={false}
                      value={loan.loanPeriod}
                      onChange={(v) => handleSave({ ...loan, loanPeriod: v })}
                      required
                    />
                    <Field
                      label="Start Date:"
                      type="date"
                      disabled={false}
                      value={loan.startDate}
                      onChange={(v) => handleSave({ ...loan, startDate: v })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field
                      label="Monthly Deductions:"
                      disabled={false}
                      value={formatMoney(loan.monthlyDeductions)}
                      onChange={(v) => handleSave({ ...loan, monthlyDeductions: v.replace(/[^0-9.]/g, "") })}
                      ariaLabel="Monthly Deductions"
                      required
                    />
                    <Field
                      label="Loan Status:"
                      disabled={false}
                      value={loan.loanStatus}
                      onChange={(v) => handleSave({ ...loan, loanStatus: v })}
                      required
                    />
                    <Field
                      label="Balance:"
                      disabled={false}
                      value={formatMoney(loan.balance)}
                      onChange={(v) => handleSave({ ...loan, balance: v.replace(/[^0-9.]/g, "") })}
                      ariaLabel="Loan Balance"
                      required
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
