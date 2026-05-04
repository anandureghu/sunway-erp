import PayrollBankFileSettingsCard from "@/modules/hr/payroll/PayrollBankFileSettingsCard";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function SettingsPayrollPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!id || id === "undefined") {
      if (user?.companyId != null) {
        navigate(`/settings/payroll/${user.companyId}`, { replace: true });
      }
    }
  }, [id, user?.companyId, navigate]);

  const resolvedId =
    id && id !== "undefined"
      ? id
      : user?.companyId != null
        ? String(user.companyId)
        : undefined;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="mx-auto max-w-6xl px-6 py-7 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payroll</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure the bank payroll file (SIF) used for CSV export to your bank (Finance → Employee Payroll).
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The company IBAN below is used as the payer account in the bank payroll file. Each employee’s IBAN is
          entered separately under{" "}
          <Link to="/hr/employees" className="font-medium text-violet-700 underline-offset-2 hover:underline">
            HR → Employees
          </Link>{" "}
          → Salary → Bank details.
        </p>
        <div className="mt-8">
          <PayrollBankFileSettingsCard companyId={resolvedId} />
        </div>
      </div>
    </div>
  );
}
