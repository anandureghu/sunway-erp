import PayrollBankFileSettingsCard from "@/modules/hr/payroll/PayrollBankFileSettingsCard";
import { useParams } from "react-router-dom";

export default function SettingsPayrollPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="mx-auto max-w-6xl px-6 py-7 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payroll</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure the bank payroll file (SIF) used for CSV export to your bank (Finance → Employee Payroll).
        </p>
        <div className="mt-8">
          <PayrollBankFileSettingsCard companyId={id} />
        </div>
      </div>
    </div>
  );
}
