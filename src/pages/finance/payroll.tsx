import { useEffect, useMemo, useState, useCallback } from "react";
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
import { hrService } from "@/service/hr.service";
import { payrollService } from "@/service/payrollService";
import { fetchCompany } from "@/service/companyService";
import { downloadPayslipPdf } from "@/service/payslipService";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/hr";
import type { Company } from "@/types/company";
import {
  Loader2, Settings, Download, CheckCircle2, AlertTriangle,
  Users, Wallet, TrendingUp, Search, Calendar, FileText,
  ChevronRight, AlertCircle, ListChecks, X, CheckSquare,
  Square, XCircle, RefreshCw,
} from "lucide-react";

// ── types ──────────────────────────────────────────────────────────────────────

interface PayrollRow {
  payDate: string;
  payrollCode: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  grossPay: string;
  netPayable: string;
  totalDeductions?: string | number;
}

type BulkStatus = "pending" | "skipped" | "generating" | "done" | "error";

interface BulkResult {
  empId: number;
  status: BulkStatus;
  message?: string;
}

// ── helpers ────────────────────────────────────────────────────────────────────

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "-01");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function validateDates(input: {
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
}): string | null {
  const { payPeriodStart, payPeriodEnd, payDate } = input;
  if (!payPeriodStart || !payPeriodEnd || !payDate)
    return "Please fill in all three date fields.";

  const start = new Date(payPeriodStart);
  const end   = new Date(payPeriodEnd);
  const pay   = new Date(payDate);

  const MIN_YEAR = 2000;
  if (
    start.getFullYear() < MIN_YEAR ||
    end.getFullYear()   < MIN_YEAR ||
    pay.getFullYear()   < MIN_YEAR
  )
    return `One or more dates have an invalid year. Please enter a year after ${MIN_YEAR}.`;

  if (end < start)
    return "Pay Period End must be on or after Pay Period Start.";

  if (pay < start)
    return "Pay Date cannot be before Pay Period Start.";

  return null;
}

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", accent)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Bulk status pill ───────────────────────────────────────────────────────────

function BulkStatusBadge({ status, message }: { status: BulkStatus; message?: string }) {
  if (status === "pending")
    return <span className="text-xs font-semibold text-slate-400">Pending</span>;
  if (status === "skipped")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
        <AlertCircle className="h-3 w-3" /> Already done
      </span>
    );
  if (status === "generating")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
        <Loader2 className="h-3 w-3 animate-spin" /> Generating…
      </span>
    );
  if (status === "done")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="h-3 w-3" /> Done
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full" title={message}>
      <XCircle className="h-3 w-3" /> Failed
    </span>
  );
}

// ── Employee Payroll Tab ───────────────────────────────────────────────────────

function EmployeePayrollTab() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmp, setLoadingEmp] = useState(true);
  const [search, setSearch] = useState("");

  // single-select state
  const [selected, setSelected] = useState<Employee | null>(null);
  const [history, setHistory] = useState<PayrollRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // bulk-select state
  const [bulkMode, setBulkMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);

  const [allHistories, setAllHistories] = useState<Record<string, PayrollRow[]>>({});
  const [currencySymbol, setCurrencySymbol] = useState("QAR");
  const [generating, setGenerating] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const [payrollInput, setPayrollInput] = useState({
    payPeriodStart: "",
    payPeriodEnd: "",
    payDate: "",
  });

  // ── load employees + histories ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingEmp(true);
      try {
        const emps = await hrService.listEmployees();
        setEmployees(emps);
        const results = await Promise.allSettled(
          emps.map((e) =>
            payrollService.getPayrollHistory(Number(e.id)).then((r) => ({
              id: String(e.id),
              rows: (r?.data ?? []) as PayrollRow[],
            }))
          )
        );
        const map: Record<string, PayrollRow[]> = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") map[r.value.id] = r.value.rows;
        });
        setAllHistories(map);
      } catch {
        setEmployees([]);
      } finally {
        setLoadingEmp(false);
      }
    };
    load();
  }, []);

  // ── load company currency ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.companyId) return;
    fetchCompany(String(user.companyId))
      .then((c: Company) => {
        if (c?.currency?.currencyCode) setCurrencySymbol(c.currency.currencyCode);
      })
      .catch(console.error);
  }, [user?.companyId]);

  // ── single employee select ──────────────────────────────────────────────────
  const handleSelectEmployee = useCallback(async (emp: Employee) => {
    setSelected(emp);
    setPayrollInput({ payPeriodStart: "", payPeriodEnd: "", payDate: "" });
    const empId = Number(emp.id);
    setLoadingHistory(true);
    try {
      const res = await payrollService.getPayrollHistory(empId);
      const rows = (res?.data ?? []) as PayrollRow[];
      setHistory(rows);
      setAllHistories((prev) => ({ ...prev, [String(emp.id)]: rows }));
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── bulk checkbox helpers ───────────────────────────────────────────────────
  const filteredEmployees = employees.filter((e) =>
    `${e.firstName ?? ""} ${e.lastName ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const allFilteredChecked =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((e) => checkedIds.has(Number(e.id)));

  const toggleAll = () => {
    if (allFilteredChecked) {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        filteredEmployees.forEach((e) => next.delete(Number(e.id)));
        return next;
      });
    } else {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        filteredEmployees.forEach((e) => next.add(Number(e.id)));
        return next;
      });
    }
  };

  const toggleOne = (empId: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(empId) ? next.delete(empId) : next.add(empId);
      return next;
    });
  };

  const selectedBulkEmployees = employees.filter((e) => checkedIds.has(Number(e.id)));

  const switchToBulk = () => {
    setBulkMode(true);
    setSelected(null);
    setBulkResults([]);
  };

  const switchToSingle = () => {
    setBulkMode(false);
    setCheckedIds(new Set());
    setBulkResults([]);
  };

  // ── stats ───────────────────────────────────────────────────────────────────
  const thisMonth = currentYearMonth().slice(0, 4) + "-" + currentYearMonth().slice(4);
  const processedThisMonth = Object.entries(allHistories).filter(([, rows]) =>
    rows.some((r) => r.payPeriodStart?.slice(0, 7) === thisMonth || r.payDate?.slice(0, 7) === thisMonth)
  ).length;
  const totalGross = Object.values(allHistories).flat()
    .filter((r) => r.payPeriodStart?.slice(0, 7) === thisMonth || r.payDate?.slice(0, 7) === thisMonth)
    .reduce((s, r) => s + parseFloat(r.grossPay || "0"), 0);
  const totalNet = Object.values(allHistories).flat()
    .filter((r) => r.payPeriodStart?.slice(0, 7) === thisMonth || r.payDate?.slice(0, 7) === thisMonth)
    .reduce((s, r) => s + parseFloat(r.netPayable || "0"), 0);

  // ── once-a-month guard (single mode) ────────────────────────────────────────
  const alreadyGeneratedForMonth = useMemo(() => {
    if (!selected || !payrollInput.payPeriodStart) return false;
    const targetMonth = payrollInput.payPeriodStart.slice(0, 7);
    const rows = allHistories[String(selected.id)] ?? history;
    return rows.some(
      (r) =>
        r.payPeriodStart?.slice(0, 7) === targetMonth ||
        r.payDate?.slice(0, 7) === targetMonth
    );
  }, [selected, payrollInput.payPeriodStart, allHistories, history]);

  // ── single generate ─────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selected) return;
    const dateErr = validateDates(payrollInput);
    if (dateErr) { toast.error(dateErr); return; }
    if (alreadyGeneratedForMonth) {
      const label = formatMonthLabel(payrollInput.payPeriodStart.slice(0, 7));
      toast.error(`Payroll already generated for ${label}. Each employee can only have one payroll per month.`);
      return;
    }
    setGenerating(true);
    try {
      await payrollService.generatePayroll(Number(selected.id), payrollInput);
      toast.success("Payroll generated successfully");
      const res = await payrollService.getPayrollHistory(Number(selected.id));
      const rows = (res?.data ?? []) as PayrollRow[];
      setHistory(rows);
      setAllHistories((prev) => ({ ...prev, [String(selected.id)]: rows }));
      setPayrollInput({ payPeriodStart: "", payPeriodEnd: "", payDate: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  // ── bulk generate ───────────────────────────────────────────────────────────
  const handleBulkGenerate = async () => {
    if (selectedBulkEmployees.length === 0) {
      toast.error("Select at least one employee");
      return;
    }
    const dateErr = validateDates(payrollInput);
    if (dateErr) { toast.error(dateErr); return; }

    const targetMonth = payrollInput.payPeriodStart.slice(0, 7);
    const initialResults: BulkResult[] = selectedBulkEmployees.map((e) => ({
      empId: Number(e.id),
      status: "pending",
    }));
    setBulkResults(initialResults);
    setBulkRunning(true);

    let doneCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const emp of selectedBulkEmployees) {
      const empId = Number(emp.id);

      // check if already generated this month
      const existingRows = allHistories[String(emp.id)] ?? [];
      const alreadyDone = existingRows.some(
        (r) =>
          r.payPeriodStart?.slice(0, 7) === targetMonth ||
          r.payDate?.slice(0, 7) === targetMonth
      );

      if (alreadyDone) {
        skippedCount++;
        setBulkResults((prev) =>
          prev.map((r) => r.empId === empId ? { ...r, status: "skipped" } : r)
        );
        continue;
      }

      setBulkResults((prev) =>
        prev.map((r) => r.empId === empId ? { ...r, status: "generating" } : r)
      );

      try {
        await payrollService.generatePayroll(empId, payrollInput);
        const res = await payrollService.getPayrollHistory(empId);
        const rows = (res?.data ?? []) as PayrollRow[];
        setAllHistories((prev) => ({ ...prev, [String(emp.id)]: rows }));
        doneCount++;
        setBulkResults((prev) =>
          prev.map((r) => r.empId === empId ? { ...r, status: "done" } : r)
        );
      } catch (err: any) {
        errorCount++;
        const msg = err?.response?.data?.message || "Failed";
        setBulkResults((prev) =>
          prev.map((r) => r.empId === empId ? { ...r, status: "error", message: msg } : r)
        );
      }
    }

    setBulkRunning(false);
    const parts: string[] = [];
    if (doneCount) parts.push(`${doneCount} generated`);
    if (skippedCount) parts.push(`${skippedCount} skipped`);
    if (errorCount) parts.push(`${errorCount} failed`);
    toast[errorCount && !doneCount ? "error" : doneCount ? "success" : "warning"](
      parts.join(", ")
    );
  };

  // ── recent payrolls ─────────────────────────────────────────────────────────
  const recentPayrolls = useMemo(() => {
    return Object.entries(allHistories)
      .flatMap(([empId, rows]) => rows.map((r) => ({ ...r, empId })))
      .sort((a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime())
      .slice(0, 6);
  }, [allHistories]);

  const handleDownloadPDF = async (row: PayrollRow) => {
    if (!selected) return;
    setPdfLoading(row.payrollCode);
    try {
      await downloadPayslipPdf(Number(selected.id), row.payrollCode);
      toast.success("Payslip downloaded");
    } catch {
      toast.error("PDF export failed");
    } finally {
      setPdfLoading(null);
    }
  };

  // ── shared date form ────────────────────────────────────────────────────────
  const dateError = useMemo(() => {
    // Only show error when all three fields have some value (avoid nagging on empty state)
    if (!payrollInput.payPeriodStart && !payrollInput.payPeriodEnd && !payrollInput.payDate)
      return null;
    return validateDates(payrollInput);
  }, [payrollInput]);

  const DateForm = ({ title }: { title: string }) => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Calendar className="h-4 w-4 text-indigo-600" />
        <h3 className="font-bold text-slate-800">{title}</h3>
        <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          Once per month
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pay Period Start</label>
          <Input
            type="date"
            value={payrollInput.payPeriodStart}
            min="2000-01-01"
            onChange={(e) => setPayrollInput((p) => ({ ...p, payPeriodStart: e.target.value }))}
            className={cn("h-9", payrollInput.payPeriodStart && new Date(payrollInput.payPeriodStart).getFullYear() < 2000 && "border-red-400 focus-visible:ring-red-400")}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pay Period End</label>
          <Input
            type="date"
            value={payrollInput.payPeriodEnd}
            min={payrollInput.payPeriodStart || "2000-01-01"}
            onChange={(e) => setPayrollInput((p) => ({ ...p, payPeriodEnd: e.target.value }))}
            className={cn("h-9", payrollInput.payPeriodEnd && new Date(payrollInput.payPeriodEnd).getFullYear() < 2000 && "border-red-400 focus-visible:ring-red-400")}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pay Date</label>
          <Input
            type="date"
            value={payrollInput.payDate}
            min={payrollInput.payPeriodStart || "2000-01-01"}
            onChange={(e) => setPayrollInput((p) => ({ ...p, payDate: e.target.value }))}
            className={cn("h-9", payrollInput.payDate && new Date(payrollInput.payDate).getFullYear() < 2000 && "border-red-400 focus-visible:ring-red-400")}
          />
        </div>
      </div>
      {/* Live validation error */}
      {dateError && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
          <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 font-medium">{dateError}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Stats row */}
      {loadingEmp ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Employees"   value={employees.length}                        icon={Users}        accent="bg-gradient-to-br from-violet-500 to-indigo-600" />
          <StatCard label="Payroll Processed" value={processedThisMonth}                       icon={CheckCircle2} accent="bg-gradient-to-br from-emerald-500 to-teal-600"
            sub={new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          />
          <StatCard label="Total Gross Pay"   value={formatMoney(totalGross, currencySymbol)}  icon={TrendingUp}   accent="bg-gradient-to-br from-blue-500 to-sky-600" />
          <StatCard label="Total Net Pay"     value={formatMoney(totalNet, currencySymbol)}    icon={Wallet}       accent="bg-gradient-to-br from-amber-500 to-orange-600" />
        </div>
      )}

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* ── Left panel ── */}
        <div className="space-y-4">
          {/* Employee list */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800">
                    {bulkMode ? "Select Employees" : "Select Employee"}
                  </h3>
                </div>
                {/* Mode toggle */}
                <button
                  onClick={bulkMode ? switchToSingle : switchToBulk}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all",
                    bulkMode
                      ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {bulkMode ? (
                    <><X className="h-3 w-3" /> Single</>
                  ) : (
                    <><ListChecks className="h-3 w-3" /> Bulk</>
                  )}
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm bg-slate-50 border-slate-200"
                />
              </div>

              {/* Bulk: select all row */}
              {bulkMode && filteredEmployees.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="w-full flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {allFilteredChecked ? (
                    <CheckSquare className="h-4 w-4 text-violet-600 shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-300 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-600">
                    {allFilteredChecked ? "Deselect all" : "Select all"} ({filteredEmployees.length})
                  </span>
                  {checkedIds.size > 0 && (
                    <span className="ml-auto text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                      {checkedIds.size} selected
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {loadingEmp ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No employees found</p>
              ) : (
                filteredEmployees.map((emp) => {
                  const empId = Number(emp.id);
                  const isSelected = selected?.id === emp.id;
                  const isChecked = checkedIds.has(empId);
                  const initials = `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`.toUpperCase();
                  const hasPayroll = !!(allHistories[String(emp.id)]?.length);

                  return bulkMode ? (
                    /* ── Bulk mode row ── */
                    <button
                      key={emp.id}
                      onClick={() => toggleOne(empId)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-slate-50 last:border-0",
                        isChecked ? "bg-violet-50/60" : "hover:bg-slate-50"
                      )}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-violet-600 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        isChecked ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      )}>
                        {initials || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-semibold truncate", isChecked ? "text-violet-700" : "text-slate-800")}>
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{emp.employeeNo || `#${emp.id}`}</p>
                      </div>
                      {hasPayroll && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title="Has payroll history" />
                      )}
                    </button>
                  ) : (
                    /* ── Single mode row ── */
                    <button
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-slate-50 last:border-0",
                        isSelected
                          ? "bg-gradient-to-r from-violet-50 to-indigo-50 border-l-2 border-l-violet-500"
                          : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                        isSelected ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      )}>
                        {initials || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-semibold truncate", isSelected ? "text-violet-700" : "text-slate-800")}>
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{emp.employeeNo || `#${emp.id}`}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasPayroll && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Has payroll history" />
                        )}
                        <ChevronRight className={cn("h-3.5 w-3.5 transition-colors", isSelected ? "text-violet-500" : "text-slate-300")} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent payrolls (single mode only) */}
          {!bulkMode && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-slate-800">Recent Payrolls</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {recentPayrolls.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No payroll records yet</p>
                ) : (
                  recentPayrolls.map((r) => {
                    const emp = employees.find((e) => String(e.id) === r.empId);
                    const initials = `${emp?.firstName?.[0] ?? ""}${emp?.lastName?.[0] ?? ""}`.toUpperCase();
                    return (
                      <div key={r.payrollCode} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                          {initials || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {emp?.firstName} {emp?.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {r.payDate ? new Date(r.payDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 shrink-0">
                          {formatMoney(r.netPayable, currencySymbol)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="lg:col-span-2">
          {/* ── BULK MODE RIGHT PANEL ── */}
          {bulkMode ? (
            <div className="space-y-4">
              {/* Date form */}
              <DateForm title="Bulk Generate Payroll" />

              {/* Selected employees list + generate button */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                    <ListChecks className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800">Selected Employees</h3>
                  {checkedIds.size > 0 && (
                    <span className="ml-1 text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
                      {checkedIds.size}
                    </span>
                  )}
                  {bulkResults.length > 0 && !bulkRunning && (
                    <button
                      onClick={() => { setBulkResults([]); setPayrollInput({ payPeriodStart: "", payPeriodEnd: "", payDate: "" }); }}
                      className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-medium"
                    >
                      <RefreshCw className="h-3 w-3" /> Reset
                    </button>
                  )}
                </div>

                {selectedBulkEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <ListChecks className="h-10 w-10 text-slate-200" />
                    <p className="text-sm text-slate-400 font-medium">No employees selected</p>
                    <p className="text-xs text-slate-300">Check employees from the list on the left</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                      {selectedBulkEmployees.map((emp) => {
                        const empId = Number(emp.id);
                        const result = bulkResults.find((r) => r.empId === empId);
                        const initials = `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`.toUpperCase();
                        return (
                          <div key={emp.id} className="flex items-center gap-3 px-5 py-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold">
                              {initials || "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 truncate">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-xs text-slate-400">{emp.employeeNo || `#${emp.id}`}</p>
                            </div>
                            <div className="shrink-0">
                              {result ? (
                                <BulkStatusBadge status={result.status} message={result.message} />
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </div>
                            {!bulkRunning && !bulkResults.length && (
                              <button
                                onClick={() => toggleOne(empId)}
                                className="shrink-0 text-slate-300 hover:text-red-400 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary after run */}
                    {bulkResults.length > 0 && !bulkRunning && (
                      <div className="grid grid-cols-3 divide-x border-t border-slate-100">
                        {[
                          { label: "Generated", count: bulkResults.filter((r) => r.status === "done").length, color: "text-emerald-600" },
                          { label: "Skipped",   count: bulkResults.filter((r) => r.status === "skipped").length, color: "text-amber-600" },
                          { label: "Failed",    count: bulkResults.filter((r) => r.status === "error").length, color: "text-red-500" },
                        ].map(({ label, count, color }) => (
                          <div key={label} className="flex flex-col items-center py-3">
                            <span className={cn("text-lg font-bold", color)}>{count}</span>
                            <span className="text-xs text-slate-400 font-medium">{label}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
                      <Button
                        onClick={handleBulkGenerate}
                        disabled={bulkRunning || selectedBulkEmployees.length === 0 || !!dateError}
                        className="w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                      >
                        {bulkRunning ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                        ) : (
                          <><Wallet className="h-4 w-4" /> Generate Payroll for {checkedIds.size} Employee{checkedIds.size !== 1 ? "s" : ""}</>
                        )}
                      </Button>
                      <p className="text-xs text-slate-400 text-center mt-2">
                        Employees who already have payroll for this month will be skipped automatically.
      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* ── SINGLE MODE RIGHT PANEL ── */
            !selected ? (
              <div className="flex flex-col items-center justify-center h-full min-h-80 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                  <Wallet className="h-7 w-7 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-700 text-lg">No employee selected</p>
                <p className="text-sm text-slate-400 mt-1">Choose an employee from the list to generate or view payroll</p>
                <button
                  onClick={switchToBulk}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:underline"
                >
                  <ListChecks className="h-3.5 w-3.5" /> Or use Bulk mode to process multiple employees
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Employee header */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-lg">
                      {`${selected.firstName?.[0] ?? ""}${selected.lastName?.[0] ?? ""}`.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{selected.firstName} {selected.lastName}</h2>
                      <p className="text-sm text-slate-500">Employee #{selected.id} · {selected.department || "No Department"}</p>
                    </div>
                  </div>
                </div>

                {/* Generate form */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Generate Payroll</h3>
                    <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Once per month
                    </span>
                  </div>

                  {alreadyGeneratedForMonth && payrollInput.payPeriodStart && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-800">
                        Payroll already generated for <strong>{formatMonthLabel(payrollInput.payPeriodStart.slice(0, 7))}</strong>. Only one payroll per month is allowed.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pay Period Start</label>
                      <Input
                        type="date"
                        value={payrollInput.payPeriodStart}
                        onChange={(e) => setPayrollInput((p) => ({ ...p, payPeriodStart: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pay Period End</label>
                      <Input
                        type="date"
                        value={payrollInput.payPeriodEnd}
                        onChange={(e) => setPayrollInput((p) => ({ ...p, payPeriodEnd: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pay Date</label>
                      <Input
                        type="date"
                        value={payrollInput.payDate}
                        onChange={(e) => setPayrollInput((p) => ({ ...p, payDate: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generating || alreadyGeneratedForMonth || !!dateError}
                    className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                    {generating ? "Generating…" : "Generate Payroll"}
                  </Button>
                </div>

                {/* Payroll history */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <h3 className="font-bold text-slate-800">Payroll History</h3>
                  </div>

                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                    </div>
                  ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <FileText className="h-8 w-8 text-slate-200 mb-2" />
                      <p className="text-sm text-slate-400">No payroll history for this employee</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Code</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Period</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Gross Pay</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Deductions</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Pay Date</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-emerald-600 uppercase tracking-wide">Net Pay</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">PDF</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {history.map((row) => (
                            <tr key={row.payrollCode} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{row.payrollCode}</td>
                              <td className="px-4 py-3.5 text-slate-600 text-xs">
                                {row.payPeriodStart}
                                {row.payPeriodEnd ? ` → ${row.payPeriodEnd}` : ""}
                              </td>
                              <td className="px-4 py-3.5 text-slate-700 font-medium">
                                {formatMoney(row.grossPay, currencySymbol)}
                              </td>
                              <td className="px-4 py-3.5 text-red-500 font-medium">
                                -{formatMoney(String(row.totalDeductions ?? 0), currencySymbol)}
                              </td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs">{row.payDate}</td>
                              <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                                {formatMoney(row.netPayable, currencySymbol)}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  disabled={pdfLoading === row.payrollCode}
                                  onClick={() => handleDownloadPDF(row)}
                                >
                                  {pdfLoading === row.payrollCode ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Download className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bank Payroll CSV Tab ───────────────────────────────────────────────────────

function BankPayrollCsvTab() {
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

  const ready = useMemo(() => isPayrollExportSettingsComplete(settings), [settings]);
  const ymOk = /^\d{6}$/.test(yearMonth);

  const handleDownload = async () => {
    if (!cid) { toast.error("No company context"); return; }
    if (!ready) { toast.error("Configure bank payroll file settings in Global Settings → Payroll first"); return; }
    if (!ymOk) { toast.error("Use salary month as yyyyMM (e.g. 202512)"); return; }
    setDownloading(true);
    try {
      await downloadBankPayrollCsvFile(cid, yearMonth);
      toast.success("Payroll CSV downloaded");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Export all employees for the selected salary month (Qatar SIF-style CSV for your bank). Amounts use saved
        payroll when <code className="text-xs bg-slate-100 px-1 rounded">pay date</code> falls in that month; otherwise
        they are calculated from active salary and loans.
      </p>

      <div className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        loadingSettings ? "border-slate-200 bg-slate-50"
          : ready ? "border-emerald-200 bg-emerald-50/60"
          : "border-amber-200 bg-amber-50/60",
      )}>
        {loadingSettings ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-400" />
        ) : ready ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            {loadingSettings ? "Checking settings…" : ready ? "Bank file settings complete" : "Settings incomplete"}
          </p>
          <p className="text-xs text-slate-600">
            Employer EID, payer EID, payer bank short name, and payer IBAN are required. Configure them under{" "}
            <strong>Global Settings → Payroll</strong>.
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
        <label className="text-xs font-semibold text-slate-700">Salary year & month (yyyyMM)</label>
        <Input
          value={yearMonth}
          onChange={(e) => setYearMonth(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="202512"
          className="max-w-xs font-mono"
          maxLength={6}
        />
        {!ymOk && yearMonth.length > 0 && (
          <p className="text-xs text-rose-600">Enter exactly 6 digits (year + month).</p>
        )}
      </div>

      <Button
        type="button"
        disabled={!cid || !ready || !ymOk || downloading}
        onClick={() => void handleDownload()}
        className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600"
      >
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download bank payroll CSV
      </Button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const Payroll = () => {
  const tabsList = [
    {
      value: "employee-payroll",
      label: "Employee Payroll",
      element: () => <EmployeePayrollTab />,
    },
    {
      value: "bank-csv",
      label: "Bank Payroll CSV",
      element: () => <BankPayrollCsvTab />,
    },
  ];
  return (
    <AppTab
      title="Payroll"
      subtitle="Employee payroll management and bank file export"
      tabs={tabsList}
      defaultValue="employee-payroll"
      props={{}}
    />
  );
};

export default Payroll;
