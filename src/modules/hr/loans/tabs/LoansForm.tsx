import type { ReactElement } from "react";
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
  CheckCircle2,
  AlertTriangle,
  Wallet,
  PencilLine,
  Check,
  X,
  Building2,
} from "lucide-react";
import { SummaryCard } from "@/modules/hr/components/summary-card";
import { useState, useCallback, useEffect } from "react";
import { salaryService } from "@/service/salaryService";
import { formatMoney, generateId } from "@/lib/utils";
import { humanizeLoanType } from "@/lib/loan-type-label";
import { addMonths } from "@/lib/date";
import { useParams } from "react-router-dom";
import { loanService } from "@/service/loanService";
import { SelectField } from "@/modules/hr/components/select-field";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import type { LoanPayload } from "@/types/hr/loan";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { canActScoped } from "@/lib/module-permissions";
import { fetchCompany } from "@/service/companyService";
import type { Company } from "@/types/company";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

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
};

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
  const endDateOk = loan.endDate.trim() !== "";
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
};

export default function LoansForm(): ReactElement {
  const { confirm } = useConfirmDialog();
  const params = useParams<{ id: string }>();
  const employeeId = params.id ? Number(params.id) : undefined;
  const { user, permissions } = useAuth();
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
  const canApproveLoans = canActScoped(permissions, "LOANS", "approve", isOwnEmployee);
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
  const [, setLoading] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("$");

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
  const exceedsLimit = (loan: LoansModel) => {
    if (basicSalary <= 0) return false;
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
  }, [grossSalary, hasOpenLoan]);

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

  useEffect(() => {
    if (user?.companyId) {
      fetchCompany(user.companyId.toString())
        .then((company: Company) => {
          if (company?.currency?.currencyCode) {
            setCurrencySymbol(company.currency?.currencyCode);
          }
        })
        .catch((err) => {
          console.error("Failed to load company currency", err);
        });
    }
  }, [user?.companyId]);

  const handleSave = useCallback(
    (loan: LoansModel, changedField?: string) => {
      const loanAmount = Number(loan.loanAmount || 0);
      const loanPeriod = Number(loan.loanPeriod || 0);
      const monthly = loanPeriod > 0 ? loanAmount / loanPeriod : 0;
      const gross = grossSalary || Number(loan.grossPay || 0);
      const deduction = monthly;
      const net = gross - deduction;

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

  const handleDelete = useCallback(async (id: string) => {
    if (!(await confirm("Are you sure you want to delete this loan?"))) return;

    setLoans((current) => current.filter((l) => l.id !== id));
    setEditingId(null);
    toast.success("Loan removed locally");
  }, [confirm]);

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

  const handleDecision = useCallback(
    async (loanDbId: number, approve: boolean) => {
      if (!employeeId) return;
      try {
        await loanService.decideLoan(employeeId, loanDbId, approve);
        toast.success(approve ? "Loan approved" : "Loan rejected");
        await loadLoans();
      } catch (err: any) {
        console.error("LoansForm -> decision failed", err);
        const status = err?.response?.status;
        if (status === 403) {
          toast.error("You don't have permission to approve loans");
        } else {
          toast.error(err?.response?.data?.message || "Failed to update loan");
        }
      }
    },
    [employeeId, loadLoans],
  );

  const totalLoans = loans.length;
  const pendingLoans = loans.filter(
    (l) => l.loanStatus?.toUpperCase() === "PENDING_APPROVAL",
  ).length;
  const activeLoans = loans.filter(
    (l) => l.loanStatus?.toUpperCase() === "ACTIVE",
  ).length;
  const closedLoans = loans.filter(
    (l) => l.loanStatus?.toUpperCase() === "CLOSED",
  ).length;
  const totalOutstanding = loans
    .filter((l) => l.loanStatus?.toUpperCase() === "ACTIVE")
    .reduce((sum, l) => sum + Number(l.balance || 0), 0);

  return (
    <div className="space-y-6 rounded-xl">
      <SecondaryPageHeader
        title="Employee Loans"
        description="Manage loan details and repayment schedules"
        icon={<Building2 className="h-5 w-5 text-white" />}
        actions={
          canCreateLoans ? (
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
          ) : undefined
        }
      />

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
          label="Closed"
          value={closedLoans}
          description="Fully repaid"
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="emerald"
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

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          Loans Details
        </h3>

        <div className="grid gap-6">
          {loans.map((loan) => (
            <div
              key={loan.id}
              className="border border-slate-200 rounded-lg p-6 mb-6"
            >
              {editingId === loan.id ? (
                <div className="p-6 bg-gradient-to-br from-white to-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium opacity-90">
                          Loan Amount
                        </span>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatMoney(loan.loanAmount, currencySymbol) ||
                          `${currencySymbol}0.00`}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium opacity-90">
                          Monthly Payment
                        </span>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatMoney(loan.monthlyDeductions, currencySymbol) ||
                          `${currencySymbol}0.00`}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium opacity-90">
                          Current Balance
                        </span>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatMoney(loan.balance, currencySymbol) ||
                          `${currencySymbol}0.00`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                      Loan Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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

                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 shadow-sm border border-blue-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      Salary Breakdown
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Field
                        label="Gross Pay"
                        disabled={false}
                        value={formatMoney(loan.grossPay, currencySymbol)}
                        onChange={(v) =>
                          handleSave({
                            ...loan,
                            grossPay: v.replace(/[^0-9.]/g, ""),
                          })
                        }
                        ariaLabel="Gross Pay"
                        required
                      />
                      <Field
                        label="Deduction Amount"
                        disabled={false}
                        value={formatMoney(
                          loan.deductionAmount,
                          currencySymbol,
                        )}
                        onChange={(v) =>
                          handleSave({
                            ...loan,
                            deductionAmount: v.replace(/[^0-9.]/g, ""),
                          })
                        }
                        ariaLabel="Deduction Amount"
                        required
                      />
                      <Field
                        label="Net Pay"
                        disabled={false}
                        value={formatMoney(loan.netPay, currencySymbol)}
                        onChange={(v) =>
                          handleSave({
                            ...loan,
                            netPay: v.replace(/[^0-9.]/g, ""),
                          })
                        }
                        ariaLabel="Net Pay"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="px-6 rounded-lg border-slate-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!validateLoan(loan) || exceedsLimit(loan)}
                      onClick={async () => {
                        handleSave(loan);
                        await persistLoan(loan);
                        setEditingId(null);
                      }}
                      className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg"
                    >
                      Save Loan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
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

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                          <InfoCard
                            icon={DollarSign}
                            label="Loan Amount"
                            value={formatMoney(loan.loanAmount, currencySymbol)}
                            color="blue"
                          />
                          <InfoCard
                            icon={Calendar}
                            label="Start Date"
                            value={
                              loan.startDate
                                ? new Date(loan.startDate).toLocaleDateString()
                                : "—"
                            }
                            color="emerald"
                          />
                          <InfoCard
                            icon={Calendar}
                            label="End Date"
                            value={
                              loan.endDate
                                ? new Date(loan.endDate).toLocaleDateString()
                                : "—"
                            }
                            color="amber"
                          />
                          <InfoCard
                            icon={TrendingUp}
                            label="Monthly Deduction"
                            value={formatMoney(
                              loan.monthlyDeductions,
                              currencySymbol,
                            )}
                            color="violet"
                          />
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100 mt-6">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">
                            Loan Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem
                              label="Loan Type"
                              value={loanTypeLabel(loan.loanType)}
                            />
                            <DetailItem
                              label="Loan Period"
                              value={
                                loan.loanPeriod
                                  ? `${loan.loanPeriod} months`
                                  : "—"
                              }
                            />
                            <DetailItem
                              label="Current Balance"
                              value={formatMoney(loan.balance, currencySymbol)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {canApproveLoans &&
                          loan.loanStatus?.toUpperCase() ===
                            "PENDING_APPROVAL" &&
                          /^\d+$/.test(loan.id) && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleDecision(Number(loan.id), true)
                                }
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDecision(Number(loan.id), false)
                                }
                                className="border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                              >
                                <X className="h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
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
                    <div className="space-y-6">
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InfoCard
                          icon={DollarSign}
                          label="Loan Amount"
                          value={formatMoney(loan.loanAmount, currencySymbol)}
                          color="blue"
                        />
                        <InfoCard
                          icon={Calendar}
                          label="Start Date"
                          value={
                            loan.startDate
                              ? new Date(loan.startDate).toLocaleDateString()
                              : "—"
                          }
                          color="emerald"
                        />
                        <InfoCard
                          icon={TrendingUp}
                          label="Monthly Deduction"
                          value={formatMoney(
                            loan.monthlyDeductions,
                            currencySymbol,
                          )}
                          color="violet"
                        />
                      </div>

                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">
                          Loan Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailItem
                            label="Loan Type"
                            value={loanTypeLabel(loan.loanType)}
                          />
                          <DetailItem
                            label="Loan Period"
                            value={
                              loan.loanPeriod
                                ? `${loan.loanPeriod} months`
                                : "—"
                            }
                          />
                          <DetailItem
                            label="Current Balance"
                            value={formatMoney(loan.balance, currencySymbol)}
                          />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">
                          Salary Breakdown
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <DetailItem
                            label="Gross Pay"
                            value={formatMoney(loan.grossPay, currencySymbol)}
                          />
                          <DetailItem
                            label="Deduction Amount"
                            value={formatMoney(
                              loan.deductionAmount,
                              currencySymbol,
                            )}
                          />
                          <DetailItem
                            label="Net Pay"
                            value={formatMoney(loan.netPay, currencySymbol)}
                          />
                        </div>
                      </div>

                      {loan.notes && (
                        <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-2">
                            Notes/Remarks
                          </h4>
                          <p className="text-slate-700 whitespace-pre-wrap">
                            {loan.notes}
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

        {loans.length === 0 && (
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
  ariaLabel?: string;
  required?: boolean;
}) {
  const {
    label,
    value,
    onChange,
    type = "text",
    disabled,
    ariaLabel,
    required,
  } = props;
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        required={required}
        className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
      />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-indigo-600",
    emerald: "from-emerald-500 to-teal-600",
    violet: "from-violet-500 to-purple-600",
    amber: "from-amber-500 to-orange-600",
  };
  const gradient = colorClasses[color] ?? colorClasses.blue;
  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-xl p-5 text-white shadow-lg`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium opacity-90">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">
        {label}
      </p>
      <p className="text-base text-slate-800 font-medium">{value}</p>
    </div>
  );
}
