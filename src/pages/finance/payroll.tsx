import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppTab } from "@/components/app-tab";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  payrollExportService,
  downloadBankPayrollCsvFile,
  isPayrollExportSettingsComplete,
  type PayrollExportSettings,
} from "@/service/payrollExportService";
import {
  Loader2,
  Settings,
  Download,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

function currentYearMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

function CompanyPayrollExportTab() {
  const { user } = useAuth();
  const cid = user?.companyId;
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [settings, setSettings] = useState<PayrollExportSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!cid) return;
    setLoadingSettings(true);
    payrollExportService
      .getSettings(cid)
      .then((res) => setSettings(res.data ?? {}))
      .catch(() => toast.error("Could not load payroll export settings"))
      .finally(() => setLoadingSettings(false));
  }, [cid]);

  const ready = useMemo(
    () => isPayrollExportSettingsComplete(settings),
    [settings],
  );

  const ymOk = /^\d{6}$/.test(yearMonth);

  const handleDownload = async () => {
    if (!cid) {
      toast.error("No company context");
      return;
    }
    if (!ready) {
      toast.error(
        "Configure bank payroll file settings in Global Settings → Payroll first",
      );
      return;
    }
    if (!ymOk) {
      toast.error("Use salary month as yyyyMM (e.g. 202512)");
      return;
    }
    setDownloading(true);
    try {
      await downloadBankPayrollCsvFile(cid, yearMonth);
      toast.success("Payroll CSV downloaded");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Download failed";
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Export all employees for the selected salary month (Qatar SIF-style CSV
        for your bank). Amounts use saved payroll when{" "}
        <code className="text-xs bg-slate-100 px-1 rounded">pay date</code>{" "}
        falls in that month; otherwise they are calculated from active salary
        and loans.
      </p>

      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border p-4",
          loadingSettings
            ? "border-slate-200 bg-slate-50"
            : ready
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-amber-200 bg-amber-50/60",
        )}
      >
        {loadingSettings ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-400" />
        ) : ready ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            {loadingSettings
              ? "Checking settings…"
              : ready
                ? "Bank file settings complete"
                : "Settings incomplete"}
          </p>
          <p className="text-xs text-slate-600">
            Employer EID, payer EID, payer bank short name, and payer IBAN are
            required. Configure them under{" "}
            <strong>Global Settings → Payroll</strong> (sidebar, or use Settings
            in the footer then Payroll).
          </p>
          <Link
            to={cid ? `/settings/payroll/${cid}` : "/"}
            className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline"
          >
            <Settings className="h-3.5 w-3.5" />
            Open Payroll settings
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700">
          Salary year & month (yyyyMM)
        </label>
        <Input
          value={yearMonth}
          onChange={(e) =>
            setYearMonth(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="202512"
          className="max-w-xs font-mono"
          maxLength={6}
        />
        {!ymOk && yearMonth.length > 0 && (
          <p className="text-xs text-rose-600">
            Enter exactly 6 digits (year + month).
          </p>
        )}
      </div>

      <Button
        type="button"
        disabled={!cid || !ready || !ymOk || downloading}
        onClick={() => void handleDownload()}
        className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download bank payroll CSV
      </Button>
    </div>
  );
}

const Payroll = () => {
  const tabsList = [
    {
      value: "company-payroll",
      label: "Bank payroll CSV",
      element: () => <CompanyPayrollExportTab />,
    },
  ];
  return (
    <AppTab
      title="Payroll"
      subtitle="Employee payroll and bank file export"
      tabs={tabsList}
      defaultValue="company-payroll"
      props={{}}
    />
  );
};

export default Payroll;
