import type { ReactElement, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Trash2,
  Eye,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  AlertTriangle,
  Wallet,
  PencilLine,
  Building2,
} from "lucide-react";
import { SummaryCard } from "@/modules/hr/components/summary-card";
import { useState, useCallback, useEffect, useMemo } from "react";
import { salaryService } from "@/service/salaryService";
import { formatMoney, generateId, cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { humanizeLoanType } from "@/lib/loan-type-label";
import { addMonths } from "@/lib/date";
import { useParams, useOutletContext } from "react-router-dom";
import type { LoansShellCtx } from "@/modules/hr/loans/LoansShell";
import { loanService } from "@/service/loanService";
import { SelectField } from "@/modules/hr/components/select-field";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import type { LoanPayload } from "@/types/hr/loan";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { canActScoped } from "@/lib/module-permissions";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

const formatViewDate = (v?: string | number | readonly string[]) => {
  if (v == null || v === "") return "";
  const [y, m, d] = String(v).split("-");
  return y && m && d ? `${d}-${m}-${y}` : String(v);
};

const ViewField = ({
  icon,
  label,
  value,
  mono,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  mono?: boolean;
}) => {
  const empty = value == null || value === "" || value === "—";
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-semibold",
            empty ? "text-slate-300" : "text-slate-700",
            mono && "font-mono",
          )}
        >
          {empty ? "—" : value}
        </p>
      </div>
    </div>
  );
};

type LoansModel = {
  id: string;
  loanCode: string;
  loanAmount: string;
  notes: string;
  loanType: string;
  loanPeriod: string;
  startDate: string;
  endDate: string;
  monthlyDeductions: string;
  loanStatus: string;
  balance: string;
  grossPay: string;
  deductionAmount: string;
  netPay: string;
  rejectionComment: string;
};

/** Round a monetary value to 2 decimal places, guarding against NaN/Infinity. */
function roundMoney(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function validateLoan(loan: LoansModel): boolean {
  const amountOk =
    loan.loanAmount.trim() !== "" &&
    !isNaN(Number(loan.loanAmount)) &&
    Number(loan.loanAmount) > 0;
  const typeOk = loan.loanType.trim() !== "";
  const periodNum = Number(loan.loanPeriod);
  const periodOk =
    loan.loanPeriod.trim() !== "" &&
    Number.isInteger(periodNum) &&
    periodNum > 0;
  const dateOk = loan.startDate.trim() !== "";
  // End date is auto-derived from start + period, but guard against a manual
  // edit that puts it on/before the start (both are yyyy-mm-dd, so string
  // comparison is chronological).
  const endDateOk =
    loan.endDate.trim() !== "" && loan.endDate > loan.startDate;
  return amountOk && typeOk && periodOk && dateOk && endDateOk;
}

const INITIAL_LOAN: LoansModel = {
  id: "",
  loanCode: "",
  loanAmount: "",
  notes: "",
  loanType: "",
  loanPeriod: "",
  startDate: "",
  endDate: "",
  monthlyDeductions: "",
  loanStatus: "PENDING_APPROVAL",
  balance: "",
  grossPay: "0",
  deductionAmount: "0",
  netPay: "0",
  rejectionComment: "",
};

export default function LoansForm(): ReactElement {
  const { confirm } = useConfirmDialog();
  const params = useParams<{ id: string }>();
  const employeeId = params.id ? Number(params.id) : undefined;
  const { registerAction } = useOutletContext<LoansShellCtx>();
  const { user, permissions, company } = useAuth();
  // Loans are scoped to the employee in the route. ADMIN/SUPER_ADMIN bypass via
  // permissions === null. Otherwise a grant applies per own/all: an "own-only"
  // grant only enables the action on the user's own records, so the buttons are
  // hidden on someone else's loans (no button that would 403 on save).
  // employeeId is populated on the auth user at runtime (from the JWT) but isn't
  // on the Employee type — read it via a cast, as the rest of the app does.
  const myEmployeeId = (user as { employeeId?: number | string } | null)
    ?.employeeId;
  const isOwnEmployee =
    myEmployeeId != null && Number(myEmployeeId) === employeeId;
  const canCreateLoans = canActScoped(permissions, "LOANS", "create", isOwnEmployee);
  const canEditLoans = canActScoped(permissions, "LOANS", "edit", isOwnEmployee);
  const canDeleteLoans = canActScoped(permissions, "LOANS", "delete", isOwnEmployee);

  const [loans, setLoans] = useState<LoansModel[]>([]);
  const [loanTypeOptions, setLoanTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [grossSalary, setGrossSalary] = useState<number>(0);
  const [basicSalary, setBasicSalary] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Loan-eligibility pre-check (company min-service policy etc.).
  const [eligibility, setEligibility] = useState<
    import("@/service/loanService").LoanEligibility | null
  >(null);
  const currencySymbol = company?.currency?.currencyCode ?? "";

  // One loan at a time: an employee with a persisted pending or active loan
  // can't open another request (the backend enforces this too). Drafts (non-
  // numeric ids) don't count, so the first request is still allowed.
  const hasOpenLoan = loans.some(
    (l) =>
      /^\d+$/.test(l.id) &&
      ["PENDING_APPROVAL", "ACTIVE"].includes(
        (l.loanStatus || "").toUpperCase(),
      ),
  );

  const MAX_DEDUCTION_PCT = 0.3;
  const maxMonthlyDeduction = basicSalary * MAX_DEDUCTION_PCT;
  const computeMonthly = (amount: string | number, period: string | number) => {
    const a = Number(amount || 0);
    const p = Number(period || 0);
    return p > 0 ? a / p : 0;
  };
  // Prefer the configured loan-type label (e.g. "Car Loan"); fall back to a
  // humanized form of the raw value so we never show "CAR_LOAN".
  const loanTypeLabel = (type?: string): string =>
    (type && loanTypeOptions.find((o) => o.value === type)?.label) ||
    humanizeLoanType(type);
  // When basic salary is unknown (still loading, fetch failed, or genuinely
  // unset) the 30%-of-basic affordability cap can't be evaluated, so we block
  // the request rather than silently letting any amount through.
  const affordabilityUnknown = basicSalary <= 0;
  const exceedsLimit = (loan: LoansModel) => {
    if (affordabilityUnknown) return false;
    return (
      computeMonthly(loan.loanAmount, loan.loanPeriod) > maxMonthlyDeduction
    );
  };

  const handleAdd = useCallback(() => {
    if (hasOpenLoan) {
      toast.error(
        "This employee already has a pending or active loan. Only one loan at a time is allowed.",
      );
      return;
    }
    // Block the request up front when the employee doesn't meet loan policy.
    if (eligibility && !eligibility.eligible) {
      toast.error(
        eligibility.reason ||
          "This employee is not eligible to request a loan right now.",
      );
      return;
    }
    const gross = grossSalary || 0;
    const newLoan = {
      ...INITIAL_LOAN,
      id: generateId(),
      grossPay: String(gross),
      deductionAmount: String(0),
      netPay: String(gross),
    };
    setLoans((current) => [...current, newLoan]);
    setEditingId(newLoan.id);
  }, [grossSalary, hasOpenLoan, eligibility]);

  const mapApiToForm = (api: any): LoansModel => ({
    id: String(api.id),
    loanCode: api.loanCode ?? "",
    loanAmount: api.loanAmount != null ? String(api.loanAmount) : "",
    notes: api.notes ?? "",
    loanType: api.loanType ?? "",
    loanPeriod: api.loanPeriod != null ? String(api.loanPeriod) : "",
    startDate: api.startDate ?? "",
    endDate: api.endDate ?? "",
    monthlyDeductions:
      api.monthlyDeduction != null ? String(api.monthlyDeduction) : "",
    loanStatus: api.status ?? "",
    balance: api.balance != null ? String(api.balance) : "",
    grossPay: api.grossPay != null ? String(api.grossPay) : "0",
    deductionAmount:
      api.deductionAmount != null ? String(api.deductionAmount) : "0",
    netPay: api.netPay != null ? String(api.netPay) : "0",
    rejectionComment: api.rejectionComment ?? "",
  });

  const mapFormToPayload = (f: LoansModel): LoanPayload => ({
    loanType: f.loanType as any,
    loanAmount: Number(f.loanAmount || 0),
    loanPeriod: Number(f.loanPeriod || 0),
    startDate: f.startDate || "",
    endDate: f.endDate || "",
    notes: f.notes || undefined,
  });

  const loadLoans = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await loanService.getLoans(employeeId);
      const mapped = (res.data || []).map(mapApiToForm).map((l) => {
        const monthly = Number(l.monthlyDeductions || 0);
        const gross = grossSalary || Number(l.grossPay || 0);
        const deduction = monthly;
        const net = gross - deduction;
        return {
          ...l,
          grossPay: String(gross),
          deductionAmount: String(deduction),
          netPay: String(net),
        } as LoansModel;
      });
      setLoans(mapped);
    } catch (err: any) {
      console.error("LoansForm -> loadLoans failed", err);
      toast.error(err?.response?.data?.message || "Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [employeeId, grossSalary]);

  // Pre-check loan eligibility so we can block a request the policy would reject.
  useEffect(() => {
    if (!employeeId) return;
    void loanService
      .checkEligibility(employeeId)
      .then((res) => setEligibility(res.data))
      .catch(() => setEligibility(null));
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) return;
    void loanService
      .getLoanTypes(employeeId)
      .then((res) => {
        const types: string[] = res.data || [];
        const mapLabel = (t: string) => {
          switch (t) {
            case "CAR_LOAN":
              return "Car Loan";
            case "PERSONAL_LOAN":
              return "Personal Loan";
            case "HOUSING_LOAN":
              return "Housing Loan";
            case "EDUCATION_LOAN":
              return "Education Loan";
            case "MEDICAL_LOAN":
              return "Medical Loan";
            default:
              return t.replace(/_/g, " ");
          }
        };
        setLoanTypeOptions(
          types.map((t) => ({ value: t, label: mapLabel(t) })),
        );
      })
      .catch(() => {});
    salaryService
      .get(employeeId)
      .then((res) => {
        const data = res.data || {};
        const gross =
          Number(
            data.totalCompensation ??
              data.total_compensation ??
              data.grossPay ??
              0,
          ) || 0;
        const basic = Number(data.basicSalary ?? data.basic_salary ?? 0) || 0;
        setGrossSalary(gross);
        setBasicSalary(basic);
      })
      .catch((err) => {
        console.error("Failed to load salary", err);
      });
  }, [employeeId]);

  useEffect(() => {
    void loadLoans();
  }, [loadLoans]);

  const handleSave = useCallback(
    (loan: LoansModel, changedField?: string) => {
      const loanAmount = Number(loan.loanAmount || 0);
      const loanPeriod = Number(loan.loanPeriod || 0);
      const monthly = roundMoney(loanPeriod > 0 ? loanAmount / loanPeriod : 0);
      const gross = grossSalary || Number(loan.grossPay || 0);
      const deduction = monthly;
      // Take-home pay can never be negative; clamp so an over-large deduction
      // surfaces as 0 rather than a nonsensical negative figure.
      const net = roundMoney(Math.max(0, gross - deduction));

      let updated = {
        ...loan,
        monthlyDeductions: String(monthly),
        grossPay: String(gross),
        deductionAmount: String(deduction),
        netPay: String(net),
      } as LoansModel;

      // Auto-calculate endDate only when loanPeriod or startDate changes
      if (
        (changedField === "loanPeriod" || changedField === "startDate") &&
        loan.startDate &&
        loanPeriod > 0
      ) {
        const autoEndDate = addMonths(loan.startDate, loanPeriod);
        updated = { ...updated, endDate: autoEndDate };
      }

      setLoans((current) =>
        current.map((l) => (l.id === loan.id ? updated : l)),
      );
    },
    [grossSalary],
  );

  const persistLoan = useCallback(
    async (loan: LoansModel) => {
      if (!employeeId) {
        toast.error("No employee selected");
        return;
      }

      const payload = mapFormToPayload(loan);

      try {
        if (/^\d+$/.test(loan.id)) {
          await loanService.updateLoan(employeeId!, Number(loan.id), payload);
          toast.success("Loan updated");
        } else {
          await loanService.applyLoan(employeeId, payload);
          toast.success("Loan created");
        }
        await loadLoans();
      } catch (err: any) {
        console.error("LoansForm -> persist failed", err);
        toast.error(err?.response?.data?.message || "Failed to save loan");
      }
    },
    [employeeId, loadLoans],
  );

  const handleCancel = useCallback(() => {
    setLoans((current) =>
      current.filter((l) => l.id !== editingId || l.loanCode.trim() !== ""),
    );
    setEditingId(null);
  }, [editingId]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!(await confirm("Are you sure you want to delete this loan?"))) return;

      // Un-persisted drafts carry a non-numeric client id and only exist in
      // local state, so there is nothing to delete on the server.
      if (!/^\d+$/.test(id)) {
        setLoans((current) => current.filter((l) => l.id !== id));
        setEditingId(null);
        return;
      }

      if (!employeeId) return;

      try {
        await loanService.deleteLoan(employeeId, Number(id));
        setEditingId(null);
        await loadLoans();
        toast.success("Loan deleted");
      } catch (err) {
        console.error("LoansForm -> delete failed", err);
        toast.error(getApiErrorMessage(err, "Failed to delete loan"));
      }
    },
    [confirm, employeeId, loadLoans],
  );

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CLOSED":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "PENDING_APPROVAL":
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const formatStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING_APPROVAL":
        return "Pending Approval";
      case "ACTIVE":
        return "Active";
      case "REJECTED":
        return "Rejected";
      case "CLOSED":
        return "Closed";
      default:
        return status;
    }
  };

  const totalLoans = loans.length;
  const pendingLoans = loans.filter(
    (l) => l.loanStatus?.toUpperCase() === "PENDING_APPROVAL",
  ).length;
  const activeLoans = loans.filter(
    (l) => l.loanStatus?.toUpperCase() === "ACTIVE",
  ).length;
  const totalOutstanding = loans
    .filter((l) => l.loanStatus?.toUpperCase() === "ACTIVE")
    .reduce((sum, l) => sum + Number(l.balance || 0), 0);

  const editingLoan = editingId
    ? (loans.find((l) => l.id === editingId) ?? null)
    : null;

  // Hoist the header action into the shell header: Request Loan normally, or
  // Cancel/Save while a loan is being edited.
  const headerAction = useMemo(
    () =>
      editingLoan ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            disabled={
              !validateLoan(editingLoan) ||
              exceedsLimit(editingLoan) ||
              affordabilityUnknown
            }
            onClick={async () => {
              handleSave(editingLoan);
              await persistLoan(editingLoan);
              setEditingId(null);
            }}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
          >
            Save Loan
          </Button>
        </div>
      ) : canCreateLoans ? (
        <Button
          onClick={handleAdd}
          disabled={hasOpenLoan || editingId !== null}
          title={
            hasOpenLoan
              ? "This employee already has a pending or active loan. Only one loan at a time is allowed."
              : undefined
          }
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2 rounded-xl px-5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Request Loan
        </Button>
      ) : null,
    [
      editingLoan,
      canCreateLoans,
      hasOpenLoan,
      editingId,
      affordabilityUnknown,
      handleAdd,
      handleCancel,
      handleSave,
      persistLoan,
    ],
  );

  useEffect(() => {
    registerAction(headerAction);
    return () => registerAction(null);
  }, [registerAction, headerAction]);

  return (
    <div className="space-y-4 rounded-xl">
      <SecondaryPageHeader
        title="Employee Loans"
        description="Manage loan details and repayment schedules"
        icon={<Building2 className="h-5 w-5 text-white" />}
      />

      {eligibility && !eligibility.eligible && !hasOpenLoan && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Not eligible for a loan.</strong> {eligibility.reason}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Loans"
          value={totalLoans}
          description="Loans on record"
          icon={<FileText className="h-5 w-5" />}
          color="blue"
        />
        <SummaryCard
          label="Pending"
          value={pendingLoans}
          description="Awaiting approval"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="amber"
        />
        <SummaryCard
          label="Active"
          value={activeLoans}
          description="Currently being deducted"
          icon={<Wallet className="h-5 w-5" />}
          color="blue"
        />
        <SummaryCard
          label="Outstanding"
          value={formatMoney(String(totalOutstanding), currencySymbol)}
          description="Across active loans"
          icon={<AlertTriangle className="h-5 w-5" />}
          color="rose"
        />
      </div>

      {canCreateLoans && hasOpenLoan && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            This employee already has a pending or active loan. Only one loan at
            a time is allowed — a new request can be made once the current loan
            is rejected or fully repaid (closed).
          </span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-blue-600" />
          Loans Details
        </h3>

        <div className="grid gap-4">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="border border-slate-200 rounded-lg p-4 mb-6"
            >
              {editingId === loan.id ? (
                <div className="p-4 bg-gradient-to-br from-white to-slate-50">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1">
                          Loan Information
                        </h4>
                        <p className="text-sm text-slate-600">
                          Record the loan type, amount, tenure, and monthly
                          deduction details for this request.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                      Loan Details
                    </h3>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <Label className="text-sm font-medium text-slate-700">
                          Loan Type <span className="text-red-500">*</span>
                        </Label>
                        <SelectField
                          value={loan.loanType}
                          onChange={(e) =>
                            handleSave({ ...loan, loanType: e.target.value })
                          }
                          options={
                            loanTypeOptions.length > 0
                              ? loanTypeOptions
                              : [
                                  { value: "CAR_LOAN", label: "Car Loan" },
                                  {
                                    value: "PERSONAL_LOAN",
                                    label: "Personal Loan",
                                  },
                                  {
                                    value: "HOUSING_LOAN",
                                    label: "Housing Loan",
                                  },
                                  {
                                    value: "EDUCATION_LOAN",
                                    label: "Education Loan",
                                  },
                                  {
                                    value: "MEDICAL_LOAN",
                                    label: "Medical Loan",
                                  },
                                ]
                          }
                          placeholder="Select Loan Type"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Loan Amount <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={loan.loanAmount || ""}
                            onChange={(e) =>
                              handleSave({
                                ...loan,
                                loanAmount: e.target.value,
                              })
                            }
                            placeholder="Enter loan amount"
                            disabled={false}
                            className="rounded-lg border-slate-300 pr-16"
                            min="0"
                            step="0.01"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                            {currencySymbol}
                          </span>
                        </div>
                        {exceedsLimit(loan) && (
                          <p className="text-xs text-rose-600 font-medium">
                            You don't qualify for this loan amount. Monthly
                            deduction cannot exceed 30% of basic salary (max{" "}
                            {formatMoney(
                              String(maxMonthlyDeduction),
                              currencySymbol,
                            )}
                            ).
                          </p>
                        )}
                        {affordabilityUnknown && (
                          <p className="text-xs text-amber-600 font-medium">
                            Basic salary is unavailable, so the 30% affordability
                            limit can't be verified. Set the employee's salary
                            before applying for a loan.
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-slate-700">
                          Loan Status
                        </Label>
                        <div className="mt-1 flex h-9 items-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(loan.loanStatus || "PENDING_APPROVAL")}`}
                          >
                            {formatStatus(
                              loan.loanStatus || "PENDING_APPROVAL",
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          New requests start as Pending Approval and become
                          Active after an authorized approver decides.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                      <Field
                        label="Start Date"
                        type="date"
                        disabled={false}
                        value={loan.startDate}
                        onChange={(v) =>
                          handleSave({ ...loan, startDate: v }, "startDate")
                        }
                        required
                      />

                      <div>
                        <Label className="text-sm font-medium text-slate-700">
                          Loan Period
                        </Label>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const total = Number(loan.loanPeriod || 0) || 0;
                            const years = Math.floor(total / 12);
                            const months = total % 12;
                            return (
                              <>
                                <Input
                                  type="number"
                                  min={0}
                                  value={String(years)}
                                  onChange={(e) => {
                                    const y = Math.max(
                                      0,
                                      Number(e.target.value) || 0,
                                    );
                                    const newTotal = y * 12 + months;
                                    handleSave(
                                      { ...loan, loanPeriod: String(newTotal) },
                                      "loanPeriod",
                                    );
                                  }}
                                  aria-label="years"
                                  className="w-24 rounded-lg border-slate-300"
                                />
                                <span className="text-sm text-slate-600">
                                  years
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  max={11}
                                  value={String(months)}
                                  onChange={(e) => {
                                    let m = Number(e.target.value) || 0;
                                    if (m < 0) m = 0;
                                    if (m > 11) m = 11;
                                    const newTotal = years * 12 + m;
                                    handleSave(
                                      { ...loan, loanPeriod: String(newTotal) },
                                      "loanPeriod",
                                    );
                                  }}
                                  aria-label="months"
                                  className="w-24 rounded-lg border-slate-300"
                                />
                                <span className="text-sm text-slate-600">
                                  months
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {(() => {
                            const total = Number(loan.loanPeriod || 0) || 0;
                            const y = Math.floor(total / 12);
                            const m = total % 12;
                            return `${y} year(s) ${m} month(s)`;
                          })()}
                        </p>
                      </div>

                      <Field
                        label="End Date"
                        type="date"
                        disabled={false}
                        value={loan.endDate}
                        onChange={(v) =>
                          handleSave({ ...loan, endDate: v }, "endDate")
                        }
                        required
                      />
                    </div>

                    <div className="mt-4">
                      <Label className="text-sm font-medium text-slate-700">
                        Note/Remarks
                      </Label>
                      <Textarea
                        value={loan.notes}
                        disabled={false}
                        onChange={(e) =>
                          handleSave({ ...loan, notes: e.target.value })
                        }
                        className="min-h-[100px] mt-2 rounded-lg border-slate-300"
                        placeholder="Enter any additional notes or remarks..."
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      Salary Breakdown
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Gross / Deduction / Net are derived from salary and loan
                          terms and are recomputed on save — display only. */}
                      <Field
                        label="Gross Pay"
                        readOnly
                        value={formatMoney(loan.grossPay, currencySymbol)}
                        onChange={() => {}}
                        ariaLabel="Gross Pay"
                      />
                      <Field
                        label="Deduction Amount"
                        readOnly
                        value={formatMoney(
                          loan.deductionAmount,
                          currencySymbol,
                        )}
                        onChange={() => {}}
                        ariaLabel="Deduction Amount"
                      />
                      <Field
                        label="Net Pay"
                        readOnly
                        value={formatMoney(loan.netPay, currencySymbol)}
                        onChange={() => {}}
                        ariaLabel="Net Pay"
                      />
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-4">
                  {viewingId !== loan.id && (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-slate-800">
                            {loan.loanCode || "Loan"}
                          </h3>
                          {loan.loanStatus && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(loan.loanStatus)}`}
                            >
                              {formatStatus(loan.loanStatus)}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-slate-600 mb-1">
                              Loan Amount
                            </p>
                            <p className="text-sm font-semibold text-blue-700">
                              {formatMoney(loan.loanAmount, currencySymbol)}
                            </p>
                          </div>
                          {loan.startDate && (
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
                              <p className="text-xs text-slate-600 mb-1">
                                Start Date
                              </p>
                              <p className="text-sm font-semibold text-emerald-700">
                                {new Date(loan.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {loan.endDate && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100">
                              <p className="text-xs text-slate-600 mb-1">
                                End Date
                              </p>
                              <p className="text-sm font-semibold text-amber-700">
                                {new Date(loan.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                            <p className="text-xs text-slate-600 mb-1">
                              Monthly Deduction
                            </p>
                            <p className="text-sm font-semibold text-violet-700">
                              {formatMoney(loan.monthlyDeductions, currencySymbol)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingId(loan.id)}
                          className="flex items-center gap-1 rounded-lg"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        {canEditLoans && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(loan.id)}
                            className="flex items-center gap-1 rounded-lg"
                          >
                            <PencilLine className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                        {canDeleteLoans && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(loan.id)}
                            className="text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {viewingId === loan.id && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-slate-800">
                          {loan.loanCode || "Loan Details"}
                        </h3>
                        {loan.loanStatus && (
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(loan.loanStatus)}`}
                          >
                            {formatStatus(loan.loanStatus)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <ViewField
                          icon={<DollarSign className="h-4 w-4" />}
                          label="Loan Amount"
                          value={formatMoney(loan.loanAmount, currencySymbol)}
                        />
                        <ViewField
                          icon={<Calendar className="h-4 w-4" />}
                          label="Start Date"
                          value={formatViewDate(loan.startDate)}
                        />
                        <ViewField
                          icon={<TrendingUp className="h-4 w-4" />}
                          label="Monthly Deduction"
                          value={formatMoney(
                            loan.monthlyDeductions,
                            currencySymbol,
                          )}
                        />
                      </div>

                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-blue-100">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">
                          Loan Information
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <ViewField
                            icon={<FileText className="h-4 w-4" />}
                            label="Loan Type"
                            value={loanTypeLabel(loan.loanType)}
                          />
                          <ViewField
                            icon={<Calendar className="h-4 w-4" />}
                            label="Loan Period"
                            value={
                              loan.loanPeriod
                                ? `${loan.loanPeriod} months`
                                : "—"
                            }
                          />
                          <ViewField
                            icon={<Wallet className="h-4 w-4" />}
                            label="Current Balance"
                            value={formatMoney(loan.balance, currencySymbol)}
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">
                          Salary Breakdown
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <ViewField
                            icon={<DollarSign className="h-4 w-4" />}
                            label="Gross Pay"
                            value={formatMoney(loan.grossPay, currencySymbol)}
                          />
                          <ViewField
                            icon={<TrendingUp className="h-4 w-4" />}
                            label="Deduction Amount"
                            value={formatMoney(
                              loan.deductionAmount,
                              currencySymbol,
                            )}
                          />
                          <ViewField
                            icon={<Wallet className="h-4 w-4" />}
                            label="Net Pay"
                            value={formatMoney(loan.netPay, currencySymbol)}
                          />
                        </div>
                      </div>

                      {loan.notes && (
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-2">
                            Notes/Remarks
                          </h4>
                          <p className="text-slate-700 whitespace-pre-wrap">
                            {loan.notes}
                          </p>
                        </div>
                      )}

                      {loan.loanStatus?.toUpperCase() === "REJECTED" &&
                        loan.rejectionComment && (
                          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                            <h4 className="text-lg font-semibold text-rose-800 mb-2">
                              Reason for rejection
                            </h4>
                            <p className="text-rose-700 whitespace-pre-wrap">
                              {loan.rejectionComment}
                            </p>
                          </div>
                        )}

                      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingId(null)}
                          className="rounded-lg border-slate-300"
                        >
                          Close
                        </Button>
                        {canEditLoans && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setViewingId(null);
                              setEditingId(loan.id);
                            }}
                            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          >
                            <PencilLine className="mr-1 h-3.5 w-3.5" /> Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {loading && loans.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center mt-6">
            <div className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
            <p className="text-slate-500">Loading loans…</p>
          </div>
        )}

        {!loading && loans.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center mt-6">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No loans added yet
            </h3>
            <p className="text-slate-600 mb-6">
              {canCreateLoans
                ? 'Click "Request Loan" to create your first employee loan'
                : "You don't have permission to request loans."}
            </p>
            {canCreateLoans && (
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg rounded-xl px-6"
              >
                <Plus className="h-5 w-5 mr-2" />
                Request Your First Loan
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
  ariaLabel?: string;
  required?: boolean;
}) {
  const {
    label,
    value,
    onChange,
    type = "text",
    disabled,
    readOnly,
    ariaLabel,
    required,
  } = props;
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && !readOnly && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        aria-label={ariaLabel}
        required={required}
        className={
          readOnly
            ? "rounded-lg border-slate-200 bg-slate-50 text-slate-600 cursor-default focus:ring-0"
            : "rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
        }
      />
    </div>
  );
}

