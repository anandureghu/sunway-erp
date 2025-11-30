import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";

type SalaryCtx = { editing: boolean };

type PayrollRow = {
  payrollCode: string;
  payPeriodStart: string;    // yyyy-mm-dd (populated from salary)
  payPeriodEnd: string;      // yyyy-mm-dd (populated from salary)
  grossPay: string;          // calculated from Total Compensation (basicSalary + totalAllowance)
  payDay: string;            // only editable field
  netPayable: string;
  bankName: string;
  bankAccount: string;
};

const ROWS: PayrollRow[] = [
  {
    payrollCode: "",
    payPeriodStart: "2025-09-22",
    payPeriodEnd: "2025-10-22",
    grossPay: "78000",  // 50000 + 28000
    payDay: "",
    netPayable: "28000",
    bankName: "",
    bankAccount: "",
  },
  { payrollCode: "", payPeriodStart: "", payPeriodEnd: "", grossPay: "78000", payDay: "", netPayable: "28000", bankName: "", bankAccount: "" },
  { payrollCode: "", payPeriodStart: "", payPeriodEnd: "", grossPay: "88000", payDay: "", netPayable: "0", bankName: "", bankAccount: "" },
  { payrollCode: "", payPeriodStart: "", payPeriodEnd: "", grossPay: "88000", payDay: "", netPayable: "0", bankName: "", bankAccount: "" },
];

export default function PayrollTab() {
  const { editing } = useOutletContext<SalaryCtx>();
  const [saved, setSaved] = useState<PayrollRow[]>(ROWS);
  const [draft, setDraft] = useState<PayrollRow[]>(ROWS);

  useEffect(() => {
    const onSave = () => setSaved(draft);
    const onCancel = () => setDraft(saved);
    document.addEventListener("salary:save", onSave as EventListener);
    document.addEventListener("salary:cancel", onCancel as EventListener);
    return () => {
      document.removeEventListener("salary:save", onSave as EventListener);
      document.removeEventListener("salary:cancel", onCancel as EventListener);
    };
  }, [draft, saved]);

  const set = (idx: number, k: keyof PayrollRow, v: string) =>
    setDraft((rows) => rows.map((r, i) => (i === idx ? { ...r, [k]: v } : r)));

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1100px] grid grid-cols-8 gap-3 items-center">
        <Header>Payroll Code</Header>
        <Header>Pay Period Start</Header>
        <Header>Pay Period End</Header>
        <Header>Gross Pay</Header>
        <Header>Pay Day</Header>
        <Header>Net Payable</Header>
        <Header>Bank Name</Header>
        <Header>Bank Account</Header>
        {/* rows */}
        {draft.map((r, i) => (
          <Row key={i}>
            <Cell>
              <Input disabled value={r.payrollCode} />
            </Cell>
            <Cell>
              <Input type="date" disabled value={r.payPeriodStart} />
            </Cell>
            <Cell>
              <Input type="date" disabled value={r.payPeriodEnd} />
            </Cell>
            <Cell>
              <Input disabled value={formatMoney(r.grossPay)} />
            </Cell>
            <Cell>
              <Input
                type="date"
                disabled={!editing}
                value={r.payDay}
                onChange={(e) => set(i, "payDay", e.target.value)}
              />
            </Cell>
            <Cell>
              <Input disabled value={formatMoney(r.netPayable)} />
            </Cell>
            <Cell>
              <Input disabled value={r.bankName} />
            </Cell>
            <Cell>
              <Input disabled value={r.bankAccount} />
            </Cell>
          </Row>
        ))}
      </div>
    </div>
  );
}

function Header({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}
function Row({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`py-1 ${className}`}>{children}</div>;
}
