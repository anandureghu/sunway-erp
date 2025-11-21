import { useOutletContext } from "react-router-dom";
import type { ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useState, useCallback } from "react";
import { formatMoney, generateId } from "@/lib/utils";

type Ctx = { editing: boolean; setEditing?: (b: boolean) => void };

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
  const { editing } = useOutletContext<Ctx>();
  const [loans, setLoans] = useState<LoansModel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    const newLoan = {
      ...INITIAL_LOAN,
      id: generateId()
    };
    setLoans(current => [...current, newLoan]);
    setEditingId(newLoan.id);
  }, []);

  const handleEdit = useCallback((loan: LoansModel) => {
    setEditingId(loan.id);
  }, []);

  const handleSave = useCallback((loan: LoansModel) => {
    setLoans(current => 
      current.map(l => l.id === loan.id ? loan : l)
    );
  }, []);

  const handleCancel = useCallback(() => {
    setLoans(current => 
      current.filter(l => l.id !== editingId || l.loanCode.trim() !== "")
    );
    setEditingId(null);
  }, [editingId]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      setLoans(current => current.filter(l => l.id !== id));
      setEditingId(null);
    }
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
                    />
                    <Field
                      label="Loan Amount:"
                      disabled={false}
                      value={formatMoney(loan.loanAmount)}
                      onChange={(v) => handleSave({ ...loan, loanAmount: v.replace(/[^0-9.]/g, "") })}
                      ariaLabel="Loan Amount"
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
                    />
                    <Field
                      label="Loan Period:"
                      disabled={false}
                      value={loan.loanPeriod}
                      onChange={(v) => handleSave({ ...loan, loanPeriod: v })}
                    />
                    <Field
                      label="Start Date:"
                      type="date"
                      disabled={false}
                      value={loan.startDate}
                      onChange={(v) => handleSave({ ...loan, startDate: v })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field
                      label="Monthly Deductions:"
                      disabled={false}
                      value={formatMoney(loan.monthlyDeductions)}
                      onChange={(v) => handleSave({ ...loan, monthlyDeductions: v.replace(/[^0-9.]/g, "") })}
                      ariaLabel="Monthly Deductions"
                    />
                    <Field
                      label="Loan Status:"
                      disabled={false}
                      value={loan.loanStatus}
                      onChange={(v) => handleSave({ ...loan, loanStatus: v })}
                    />
                    <Field
                      label="Balance:"
                      disabled={false}
                      value={formatMoney(loan.balance)}
                      onChange={(v) => handleSave({ ...loan, balance: v.replace(/[^0-9.]/g, "") })}
                      ariaLabel="Loan Balance"
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
                      />
                      <Field
                        label="Deduction Amount:"
                        disabled={false}
                        value={formatMoney(loan.deductionAmount)}
                        onChange={(v) => handleSave({ ...loan, deductionAmount: v.replace(/[^0-9.]/g, "") })}
                        ariaLabel="Deduction Amount"
                      />
                      <Field
                        label="Net Pay:"
                        disabled={false}
                        value={formatMoney(loan.netPay)}
                        onChange={(v) => handleSave({ ...loan, netPay: v.replace(/[^0-9.]/g, "") })}
                        ariaLabel="Net Pay"
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
                      onClick={() => {
                        handleSave(loan);
                        setEditingId(null);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
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
                      onClick={() => handleEdit(loan)}
                      disabled={!editing}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(loan.id)}
                      disabled={!editing}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
}) {
  const { label, value, onChange, type = "text", disabled, ariaLabel } = props;
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
      />
    </div>
  );
}
