import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Zap, ShieldCheck, Clock, Fingerprint, Timer, Coins } from "lucide-react";
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
  standardWorkingHoursPerDay: 6,
  requireCheckIn: true,
  otDayRateMultiplier: 1.25,
  otNightFridayHolidayRateMultiplier: 1.5,
  otNightStartTime: "21:00:00",
  otNightEndTime: "03:00:00",
  otMaxHoursPerDay: 2,
  minimumMonthlyWage: 1000,
  defaultHousingAllowance: 500,
  defaultFoodAllowance: 300,
};

function toTimeInputValue(value?: string): string {
  if (!value) return "";
  // Backend may return HH:mm:ss — HTML time input wants HH:mm
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function fromTimeInputValue(value: string): string {
  if (!value) return value;
  return value.length === 5 ? `${value}:00` : value;
}

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

        {/* Working hours & attendance */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100">
              <Clock className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Working Hours & Attendance
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                The standard working day and whether the organization uses check-in /
                check-out.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Standard working hours / day
              </label>
              <Input
                type="number"
                step="0.5"
                min="1"
                max="24"
                value={hrPolicies.standardWorkingHoursPerDay ?? 6}
                onChange={(e) =>
                  updateHrPolicyField(
                    "standardWorkingHoursPerDay",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={hrPoliciesLoading}
                className="mt-1 h-9 text-sm max-w-[10rem]"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                A full day is worked once this many hours are logged; payroll divides
                monthly pay by working days on this basis.
              </p>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <Fingerprint className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Require check-in / check-out
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {hrPolicies.requireCheckIn
                      ? "Employees punch in and out; hours come from their timesheets."
                      : "No punching — every active employee is auto-marked present for the standard day."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateHrPolicyField("requireCheckIn", !hrPolicies.requireCheckIn)
                }
                disabled={hrPoliciesLoading}
                className={`inline-flex h-5 w-9 shrink-0 rounded-full relative transition-colors ${
                  hrPolicies.requireCheckIn ? "bg-emerald-500" : "bg-slate-300"
                }`}
                role="switch"
                aria-checked={hrPolicies.requireCheckIn}
                aria-label="Toggle check-in requirement"
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    hrPolicies.requireCheckIn ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
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
              role="switch"
              aria-checked={hrPolicies.annualLeaveAccrualEnabled}
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
              role="switch"
              aria-checked={hrPolicies.retirementCompensationEnabled}
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
              role="switch"
              aria-checked={hrPolicies.loanPolicyEnabled}
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

        {/* Overtime (Qatar labor-law defaults) */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Timer className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Overtime
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Hourly multipliers applied to basic pay for overtime. Night
                window, Friday, and public holidays use the higher rate. Cap is
                the max OT hours allowed per day.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Day OT rate multiplier
              </label>
              <Input
                type="number"
                step="0.05"
                min="1"
                max="5"
                value={hrPolicies.otDayRateMultiplier ?? 1.25}
                onChange={(e) =>
                  updateHrPolicyField(
                    "otDayRateMultiplier",
                    parseFloat(e.target.value) || 1,
                  )
                }
                disabled={hrPoliciesLoading}
                className="mt-1 h-9 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Default 1.25× basic hourly
              </p>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Night / Friday / holiday multiplier
              </label>
              <Input
                type="number"
                step="0.05"
                min="1"
                max="5"
                value={hrPolicies.otNightFridayHolidayRateMultiplier ?? 1.5}
                onChange={(e) =>
                  updateHrPolicyField(
                    "otNightFridayHolidayRateMultiplier",
                    parseFloat(e.target.value) || 1,
                  )
                }
                disabled={hrPoliciesLoading}
                className="mt-1 h-9 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Default 1.5× basic hourly
              </p>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Night OT start
              </label>
              <Input
                type="time"
                value={toTimeInputValue(hrPolicies.otNightStartTime)}
                onChange={(e) =>
                  updateHrPolicyField(
                    "otNightStartTime",
                    fromTimeInputValue(e.target.value),
                  )
                }
                disabled={hrPoliciesLoading}
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Night OT end
              </label>
              <Input
                type="time"
                value={toTimeInputValue(hrPolicies.otNightEndTime)}
                onChange={(e) =>
                  updateHrPolicyField(
                    "otNightEndTime",
                    fromTimeInputValue(e.target.value),
                  )
                }
                disabled={hrPoliciesLoading}
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Max OT hours per day
              </label>
              <Input
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={hrPolicies.otMaxHoursPerDay ?? 2}
                onChange={(e) =>
                  updateHrPolicyField(
                    "otMaxHoursPerDay",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={hrPoliciesLoading}
                className="mt-1 h-9 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Qatar default: 2 hours / day
              </p>
            </div>
          </div>
        </div>

        {/* Statutory compensation defaults */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Coins className="h-4 w-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Statutory compensation
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Minimum monthly wage and default housing / food allowances used
                when an employee&apos;s compensation amounts are left blank.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Min. monthly wage (QAR)
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                value={hrPolicies.minimumMonthlyWage ?? 1000}
                onChange={(e) =>
                  updateHrPolicyField(
                    "minimumMonthlyWage",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={hrPoliciesLoading}
                className="mt-1 h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Default housing allowance
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                value={hrPolicies.defaultHousingAllowance ?? 500}
                onChange={(e) =>
                  updateHrPolicyField(
                    "defaultHousingAllowance",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={hrPoliciesLoading}
                className="mt-1 h-9 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                When company does not provide housing
              </p>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Default food allowance
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                value={hrPolicies.defaultFoodAllowance ?? 300}
                onChange={(e) =>
                  updateHrPolicyField(
                    "defaultFoodAllowance",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={hrPoliciesLoading}
                className="mt-1 h-9 text-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                When company does not provide food
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
