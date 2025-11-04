import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";

type SalaryCtx = { editing: boolean };

type PayrollRow = {
  payrollCode: string;
  payPeriod: string;      // yyyy-mm-dd
  payPeriodEnd: string;   // yyyy-mm-dd
  workingPeriod: string;
  payDays: string;
  basic: string;
  netPayable: string;
  bankName: string;
  bankAccount: string;
};

const ROWS: PayrollRow[] = [
  {
    payrollCode: "",
    payPeriod: "2025-09-22",
    payPeriodEnd: "2025-10-22",
    workingPeriod: "",
    payDays: "",
    basic: "50000",
    netPayable: "28000",
    bankName: "",
    bankAccount: "",
  },
  { payrollCode: "", payPeriod: "", payPeriodEnd: "", workingPeriod: "", payDays: "", basic: "50000", netPayable: "28000", bankName: "", bankAccount: "" },
  { payrollCode: "", payPeriod: "", payPeriodEnd: "", workingPeriod: "", payDays: "", basic: "60000", netPayable: "0", bankName: "", bankAccount: "" },
  { payrollCode: "", payPeriod: "", payPeriodEnd: "", workingPeriod: "", payDays: "", basic: "60000", netPayable: "0", bankName: "", bankAccount: "" },
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
      <div className="min-w-[1100px] grid grid-cols-9 gap-3 items-center">
        <Header>KPI Employee No.</Header>
        <Header>Payroll Code</Header>
        <Header>Pay Period</Header>
        <Header>Pay Period End</Header>
        <Header>Working Period</Header>
        <Header>Pay Days</Header>
        <Header>Basic</Header>
        <Header>Net Payable</Header>
        <Header>Bank Name</Header>
        {/* rows */}
        {draft.map((r, i) => (
          <Row key={i}>
            <Cell>
              <Input disabled value="" />
            </Cell>
            <Cell>
              <Input disabled={!editing} value={r.payrollCode} onChange={(e) => set(i, "payrollCode", e.target.value)} />
            </Cell>
            <Cell>
              <Input type="date" disabled={!editing} value={r.payPeriod} onChange={(e) => set(i, "payPeriod", e.target.value)} />
            </Cell>
            <Cell>
              <Input type="date" disabled={!editing} value={r.payPeriodEnd} onChange={(e) => set(i, "payPeriodEnd", e.target.value)} />
            </Cell>
            <Cell>
              <Input disabled={!editing} value={r.workingPeriod} onChange={(e) => set(i, "workingPeriod", e.target.value)} />
            </Cell>
            <Cell>
              <Input disabled={!editing} value={r.payDays} onChange={(e) => set(i, "payDays", e.target.value)} />
            </Cell>
            <Cell>
              <Input disabled={!editing} value={r.basic} onChange={(e) => set(i, "basic", e.target.value)} />
            </Cell>
            <Cell>
              <Input disabled={!editing} value={r.netPayable} onChange={(e) => set(i, "netPayable", e.target.value)} />
            </Cell>
            <Cell>
              <Input disabled={!editing} value={r.bankName} onChange={(e) => set(i, "bankName", e.target.value)} />
            </Cell>
            {/* extra: Bank Account */}
            <Header className="col-span-9 hidden" children={undefined} />
            <Cell className="hidden">
              <Input disabled={!editing} value={r.bankAccount} onChange={(e) => set(i, "bankAccount", e.target.value)} />
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
