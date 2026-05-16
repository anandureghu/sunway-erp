import PayrollBankFileSettingsCard from "@/modules/hr/payroll/PayrollBankFileSettingsCard";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

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
      <div className="mx-auto p-6">
        <PageHeader
          title="Payroll"
          description="Configure the bank payroll file (SIF) used for CSV export to your bank (Finance → Employee Payroll)."
          variant="darkBlue"
          icon={<FileText className="w-6 h-6" />}
        />
        <div className="mt-8">
          <PayrollBankFileSettingsCard companyId={resolvedId} />
        </div>
      </div>
    </div>
  );
}
