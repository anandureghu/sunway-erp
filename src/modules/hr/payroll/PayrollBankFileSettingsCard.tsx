import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  payrollExportService,
  type PayrollExportSettings,
  isPayrollExportSettingsComplete,
} from "@/service/payrollExportService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Landmark, Loader2 } from "lucide-react";

type Props = {
  /** When omitted, uses route param `id` or current user company */
  companyId?: string | number;
};

/**
 * Bank payroll file (SIF) — employer/payer EID, payer bank, IBAN. Used in Global Settings → Payroll.
 */
export default function PayrollBankFileSettingsCard({ companyId: companyIdProp }: Props) {
  const { id: routeCompanyId } = useParams<{ id: string }>();
  const { user } = useAuth();

  const companyId =
    companyIdProp != null
      ? companyIdProp
      : routeCompanyId
        ? routeCompanyId
        : user?.companyId;

  const [exportSettings, setExportSettings] = useState<PayrollExportSettings>({});
  const [loadingExportSettings, setLoadingExportSettings] = useState(false);
  const [savingExportSettings, setSavingExportSettings] = useState(false);

  useEffect(() => {
    if (companyId == null) return;
    setLoadingExportSettings(true);
    payrollExportService
      .getSettings(companyId)
      .then((res) => setExportSettings(res.data ?? {}))
      .catch(() => toast.error("Failed to load bank payroll file settings"))
      .finally(() => setLoadingExportSettings(false));
  }, [companyId]);

  const patchExportSettings = (partial: Partial<PayrollExportSettings>) =>
    setExportSettings((prev) => ({ ...prev, ...partial }));

  const handleSaveExportSettings = async () => {
    if (companyId == null) return;
    setSavingExportSettings(true);
    try {
      const res = await payrollExportService.updateSettings(companyId, exportSettings);
      setExportSettings(res.data ?? exportSettings);
      toast.success("Bank payroll file settings saved");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax?.response?.data?.message ?? "Failed to save settings");
    } finally {
      setSavingExportSettings(false);
    }
  };

  const exportReady = isPayrollExportSettingsComplete(exportSettings);

  if (companyId == null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted-foreground">
        No company context available.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
          <Landmark className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-bold text-slate-700">Bank payroll file (SIF)</span>
          <p className="text-[11px] text-slate-500">
            Required for downloading the bank payroll CSV (Finance → Employee Payroll). Payer QID is optional.
          </p>
        </div>
        {loadingExportSettings ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wide shrink-0 px-2 py-1 rounded-md",
              exportReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800",
            )}
          >
            {exportReady ? "Ready" : "Incomplete"}
          </span>
        )}
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(
          [
            ["payrollEmployerEid", "Employer EID", true],
            ["payrollPayerEid", "Payer EID", true],
            ["payrollPayerQid", "Payer QID", false],
            ["payrollPayerBankShortName", "Payer bank short name", true],
            ["payrollPayerIban", "Payer IBAN", true],
            ["payrollSifVersion", "SIF version", false],
          ] as const
        ).map(([key, label, required]) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              {label}
              {required ? <span className="text-rose-500"> *</span> : null}
            </label>
            <Input
              value={(exportSettings[key as keyof PayrollExportSettings] as string) ?? ""}
              onChange={(e) => patchExportSettings({ [key]: e.target.value })}
              placeholder={key === "payrollSifVersion" ? "1" : ""}
              className="h-9 text-sm border-slate-200"
            />
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <Button
          type="button"
          onClick={() => void handleSaveExportSettings()}
          disabled={savingExportSettings || loadingExportSettings}
          className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        >
          {savingExportSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save bank file settings
        </Button>
      </div>
    </div>
  );
}
