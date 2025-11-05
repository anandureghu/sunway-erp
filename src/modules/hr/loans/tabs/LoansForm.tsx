import { useOutletContext } from "react-router-dom";
import type { ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // if you don’t have this, replace with <textarea>
import { useState, useCallback } from "react";
import { formatMoney } from "@/lib/utils";

type Ctx = { editing: boolean; setEditing?: (b: boolean) => void };

type LoansModel = {
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

const defaultData: LoansModel = {
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
  const [data, setData] = useState<LoansModel>(defaultData);

  const set = useCallback((k: keyof LoansModel, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
  }, []);

  return (
    <div className="space-y-6">
      <Section title="Loans">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="Loan Code:"
            disabled={!editing}
            value={data.loanCode}
            onChange={(v) => set("loanCode", v)}
          />
          <Field
            label="Loan Amount:"
            disabled={!editing}
            value={formatMoney(data.loanAmount)}
            onChange={(v) => set("loanAmount", v.replace(/[^0-9.]/g, ""))}
            ariaLabel="Loan Amount"
          />
          <div className="md:col-span-1 md:row-span-3 md:col-start-3">
            <Label className="text-sm">Note/Remarks:</Label>
            <Textarea
              value={data.notes}
              disabled={!editing}
              onChange={(e) => set("notes", e.target.value)}
              className="min-h-[132px]"
            />
          </div>

          <Field
            label="Loan Type:"
            disabled={!editing}
            value={data.loanType}
            onChange={(v) => set("loanType", v)}
          />
          <Field
            label="Loan Period:"
            disabled={!editing}
            value={data.loanPeriod}
            onChange={(v) => set("loanPeriod", v)}
          />

          <Field
            label="Start Date:"
            type="date"
            disabled={!editing}
            value={data.startDate}
            onChange={(v) => set("startDate", v)}
          />
          <Field
            label="Monthly Deductions:"
            disabled={!editing}
            value={formatMoney(data.monthlyDeductions)}
            onChange={(v) => set("monthlyDeductions", v.replace(/[^0-9.]/g, ""))}
            ariaLabel="Monthly Deductions"
          />

          <Field
            label="Loan Status:"
            disabled={!editing}
            value={data.loanStatus}
            onChange={(v) => set("loanStatus", v)}
          />
          <Field
            label="Balance:"
            disabled={!editing}
            value={formatMoney(data.balance)}
            onChange={(v) => set("balance", v.replace(/[^0-9.]/g, ""))}
            ariaLabel="Loan Balance"
          />
        </div>
      </Section>

      <Section title="Salary Breakdown">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="Gross Pay:"
            disabled={!editing}
            value={formatMoney(data.grossPay)}
            onChange={(v) => set("grossPay", v.replace(/[^0-9.]/g, ""))}
            ariaLabel="Gross Pay"
          />
          <Field
            label="Deduction Amount:"
            disabled={!editing}
            value={formatMoney(data.deductionAmount)}
            onChange={(v) => set("deductionAmount", v.replace(/[^0-9.]/g, ""))}
            ariaLabel="Deduction Amount"
          />
          <Field
            label="Net Pay:"
            disabled={!editing}
            value={formatMoney(data.netPay)}
            onChange={(v) => set("netPay", v.replace(/[^0-9.]/g, ""))}
            ariaLabel="Net Pay"
          />
        </div>
      </Section>
    </div>
  );
}

/* tiny helpers matching your current-job style */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-base font-semibold mb-3">{title}</div>
      {children}
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
