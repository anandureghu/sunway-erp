import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Zap, ShieldCheck } from "lucide-react";
import {
  fetchHrPolicies,
  updateHrPolicies,
  type HrPoliciesPayload,
} from "@/service/companyService";
import { useAuth } from "@/context/AuthContext";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

// Company-level HR policies (leave accrual, retirement, loan eligibility).
// Each block gates a rule enforced by the backend — toggling it off makes the
// related behaviour fall back to the system default.
const DEFAULT_HR_POLICIES: HrPoliciesPayload = {
  annualLeaveAccrualEnabled: false,
  annualLeaveAccrualDaysPerMonth: 1.5,
  minServiceMonthsForAnnualLeave: 6,
  retirementCompensationEnabled: false,
  retirementCompensationMonthsPerYear: 1,
  loanPolicyEnabled: false,
  loanMinServiceDays: 365,
  loanMaxRepaymentMonths: 24,
};

export default function HrPoliciesForm() {
  const { company } = useAuth();

  const [hrPolicies, setHrPolicies] =
    useState<HrPoliciesPayload>(DEFAULT_HR_POLICIES);
  // Baseline for the dirty check. Initialized to the same default so Save still
  // works even if the GET fails (e.g. the backend hasn't registered the route).
  const [savedHrPolicies, setSavedHrPolicies] =
    useState<HrPoliciesPayload>(DEFAULT_HR_POLICIES);
  const [hrPoliciesLoading, setHrPoliciesLoading] = useState(false);
  const [hrPoliciesSaving, setHrPoliciesSaving] = useState(false);

  useEffect(() => {
    if (!company?.id) return;
    let cancelled = false;
    setHrPoliciesLoading(true);
    fetchHrPolicies(company.id)
      .then((data) => {
        if (cancelled) return;
        setHrPolicies(data);
        setSavedHrPolicies(data);
      })
      .catch((err: any) => {
        console.error("Failed to load HR policies:", err);
        const status = err?.response?.status;
        const detail =
          err?.response?.data?.message ?? err?.response?.data?.error;
        toast.error(
          status === 404
            ? "HR policies endpoint not found — restart the backend so the new /companies/{id}/hr-policies route is registered."
            : `Couldn't load HR policies${detail ? `: ${detail}` : ""}. You can still edit and save.`,
        );
      })
      .finally(() => {
        if (!cancelled) setHrPoliciesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [company?.id]);

  const hrPoliciesDirty =
    JSON.stringify(hrPolicies) !== JSON.stringify(savedHrPolicies);

  const updateHrPolicyField = <K extends keyof HrPoliciesPayload>(
    key: K,
    value: HrPoliciesPayload[K],
  ) => {
    setHrPolicies((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveHrPolicies = async () => {
    if (!company?.id) return;
    setHrPoliciesSaving(true);
    try {
      const saved = await updateHrPolicies(company.id, hrPolicies);
      setHrPolicies(saved);
      setSavedHrPolicies(saved);
      toast.success("HR policies saved");
    } catch (err: any) {
      console.error("Save HR policies failed:", err);
      const detail =
        err?.response?.data?.message ?? err?.response?.data?.error;
      toast.error(
        detail ? `Failed to save: ${detail}` : "Failed to save HR policies",
      );
    } finally {
      setHrPoliciesSaving(false);
    }
  };

  if (!company) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-600">Loading company information…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SecondaryPageHeader
        title="HR Policies"
        description={`Company-wide rules applied to every employee in ${company.companyName}`}
        icon={<ShieldCheck className="h-5 w-5" />}
      />

      {/* ── HR policy card: company-level accrual + retirement + loan ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Company HR Policies
              </p>
              <p className="text-[11px] text-slate-400">
                Apply to every employee in {company.companyName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hrPoliciesDirty && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                <Zap className="h-3 w-3" /> Unsaved
              </span>
            )}
            <Button
              onClick={handleSaveHrPolicies}
              disabled={
                hrPoliciesSaving || hrPoliciesLoading || !hrPoliciesDirty
              }
              className="h-8 gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {hrPoliciesSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              {hrPoliciesSaving ? "Saving…" : "Save Policies"}
            </Button>
          </div>
        </div>

        {/* Annual leave accrual */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Annual Leave Accrual
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Annual leave accrues from join date instead of a fixed yearly
                allotment.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateHrPolicyField(
                  "annualLeaveAccrualEnabled",
                  !hrPolicies.annualLeaveAccrualEnabled,
                )
              }
              disabled={hrPoliciesLoading}
              className={`inline-flex h-5 w-9 shrink-0 rounded-full relative transition-colors ${
                hrPolicies.annualLeaveAccrualEnabled
                  ? "bg-emerald-500"
                  : "bg-slate-300"
              }`}
              aria-label="Toggle annual leave accrual"
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  hrPolicies.annualLeaveAccrualEnabled
                    ? "translate-x-4"
                    : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Days credited per month worked
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={hrPolicies.annualLeaveAccrualDaysPerMonth ?? 0}
                onChange={(e) =>
                  updateHrPolicyField(
                    "annualLeaveAccrualDaysPerMonth",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={
                  hrPoliciesLoading || !hrPolicies.annualLeaveAccrualEnabled
                }
                className="mt-1 h-9 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                e.g. 1.5 → 18 days/year for a full year worked
              </p>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Min. months of service before applying
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                max="36"
                value={hrPolicies.minServiceMonthsForAnnualLeave ?? 0}
                onChange={(e) =>
                  updateHrPolicyField(
                    "minServiceMonthsForAnnualLeave",
                    parseInt(e.target.value) || 0,
                  )
                }
                disabled={
                  hrPoliciesLoading || !hrPolicies.annualLeaveAccrualEnabled
                }
                className="mt-1 h-9 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Employees can apply for annual leave only after this period.
              </p>
            </div>
          </div>
        </div>

        {/* Retirement compensation */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Retirement Compensation
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                End-of-service benefit: months of basic salary per year of
                service.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateHrPolicyField(
                  "retirementCompensationEnabled",
                  !hrPolicies.retirementCompensationEnabled,
                )
              }
              disabled={hrPoliciesLoading}
              className={`inline-flex h-5 w-9 shrink-0 rounded-full relative transition-colors ${
                hrPolicies.retirementCompensationEnabled
                  ? "bg-emerald-500"
                  : "bg-slate-300"
              }`}
              aria-label="Toggle retirement compensation"
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  hrPolicies.retirementCompensationEnabled
                    ? "translate-x-4"
                    : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Months of basic salary per year of service
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="12"
              value={hrPolicies.retirementCompensationMonthsPerYear ?? 0}
              onChange={(e) =>
                updateHrPolicyField(
                  "retirementCompensationMonthsPerYear",
                  parseFloat(e.target.value) || 0,
                )
              }
              disabled={
                hrPoliciesLoading || !hrPolicies.retirementCompensationEnabled
              }
              className="mt-1 h-9 text-sm max-w-xs"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              e.g. 1.0 → one full month of basic salary per completed year.
            </p>
          </div>
        </div>

        {/* Loan eligibility & repayment */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Loan Eligibility & Repayment
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Minimum service before an employee can request a loan, and the
                maximum repayment period.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateHrPolicyField(
                  "loanPolicyEnabled",
                  !hrPolicies.loanPolicyEnabled,
                )
              }
              disabled={hrPoliciesLoading}
              className={`inline-flex h-5 w-9 shrink-0 rounded-full relative transition-colors ${
                hrPolicies.loanPolicyEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
              aria-label="Toggle loan eligibility policy"
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  hrPolicies.loanPolicyEnabled
                    ? "translate-x-4"
                    : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Days of service before requesting a loan
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                max="3650"
                value={hrPolicies.loanMinServiceDays ?? 0}
                onChange={(e) =>
                  updateHrPolicyField(
                    "loanMinServiceDays",
                    parseInt(e.target.value) || 0,
                  )
                }
                disabled={hrPoliciesLoading || !hrPolicies.loanPolicyEnabled}
                className="mt-1 h-9 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                e.g. 365 → one full year of employment before a loan request.
              </p>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Max. repayment period (months)
              </label>
              <Input
                type="number"
                step="1"
                min="1"
                max="120"
                value={hrPolicies.loanMaxRepaymentMonths ?? 0}
                onChange={(e) =>
                  updateHrPolicyField(
                    "loanMaxRepaymentMonths",
                    parseInt(e.target.value) || 0,
                  )
                }
                disabled={hrPoliciesLoading || !hrPolicies.loanPolicyEnabled}
                className="mt-1 h-9 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Loan repayment cannot be spread beyond this many months.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
