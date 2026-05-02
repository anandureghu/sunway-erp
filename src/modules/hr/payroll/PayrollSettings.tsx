import { useEffect, useState, useCallback } from "react";
import { hrService } from "@/service/hr.service";
import { payrollService } from "@/service/payrollService";
import { salaryService } from "@/service/salaryService";
import { downloadPayslipPdf } from "@/service/payslipService";
import { fetchCompany } from "@/service/companyService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Banknote,
  Search,
  Calendar,
  Download,
  Loader2,
  TrendingUp,
  Users,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Employee } from "@/types/hr";

interface PayrollRow {
  payDate: string;
  payrollCode: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  grossPay: string;
  netPayable: string;
  totalDeductions?: string | number;
  loanDeduction?: string | number;
  bankName?: string;
  bankAccount?: string;
}

interface EmployeePayrollSummary {
  employee: Employee;
  salary: number;
  latestPayroll: PayrollRow | null;
  totalPayrolls: number;
}

export default function PayrollSettings() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [loadingEmps, setLoadingEmps] = useState(true);

  // Payroll generation state
  const [payInput, setPayInput] = useState({ payPeriodStart: "", payPeriodEnd: "", payDate: "" });
  const [generating, setGenerating] = useState(false);

  // Payroll history for selected employee
  const [history, setHistory] = useState<PayrollRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  // Summary stats across all employees
  const [summaries, setSummaries] = useState<EmployeePayrollSummary[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);

  // Load company currency
  useEffect(() => {
    if (!user?.companyId) return;
    fetchCompany(user.companyId.toString())
      .then((c: any) => { if (c?.currency?.currencyCode) setCurrencySymbol(c.currency.currencyCode); })
      .catch(() => {});
  }, [user?.companyId]);

  // Load employee list
  useEffect(() => {
    setLoadingEmps(true);
    hrService.listEmployees()
      .then((res) => setEmployees(res ?? []))
      .catch(() => toast.error("Failed to load employees"))
      .finally(() => setLoadingEmps(false));
  }, []);

  // Load summary stats (latest payroll + salary per employee, first 20)
  useEffect(() => {
    if (employees.length === 0) return;
    setLoadingSummaries(true);
    const subset = employees.slice(0, 20);
    Promise.allSettled(
      subset.map(async (emp) => {
        const empId = Number(emp.id);
        const [salRes, payRes] = await Promise.allSettled([
          salaryService.get(empId),
          payrollService.getPayrollHistory(empId),
        ]);
        const salary = salRes.status === "fulfilled" ? Number(salRes.value?.data?.basicSalary ?? 0) : 0;
        const histData: PayrollRow[] = payRes.status === "fulfilled" ? (payRes.value?.data ?? []) : [];
        return {
          employee: emp,
          salary,
          latestPayroll: histData[histData.length - 1] ?? null,
          totalPayrolls: histData.length,
        } as EmployeePayrollSummary;
      })
    ).then((results) => {
      setSummaries(results.filter((r) => r.status === "fulfilled").map((r) => (r as any).value));
    }).finally(() => setLoadingSummaries(false));
  }, [employees]);

  // Load history for selected employee
  const loadHistory = useCallback(async (empId: number) => {
    setLoadingHistory(true);
    try {
      const res = await payrollService.getPayrollHistory(empId);
      setHistory(res?.data ?? []);
    } catch {
      toast.error("Failed to load payroll history");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const selectEmployee = (emp: Employee) => {
    setSelectedEmp(emp);
    loadHistory(Number(emp.id));
  };

  const clearEmployee = () => {
    setSelectedEmp(null);
    setHistory([]);
  };

  const handleGenerate = async () => {
    if (!selectedEmp) { toast.error("Select an employee first"); return; }
    if (!payInput.payPeriodStart || !payInput.payPeriodEnd || !payInput.payDate) {
      toast.error("Fill in all date fields");
      return;
    }
    setGenerating(true);
    try {
      await payrollService.generatePayroll(Number(selectedEmp.id), payInput);
      toast.success("Payroll generated");
      await loadHistory(Number(selectedEmp.id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (row: PayrollRow) => {
    if (!selectedEmp) return;
    setPdfLoading(row.payrollCode);
    try {
      await downloadPayslipPdf(Number(selectedEmp.id), row.payrollCode);
      toast.success("Payslip downloaded");
    } catch {
      toast.error("PDF export failed");
    } finally {
      setPdfLoading(null);
    }
  };

  const filteredEmps = empSearch.trim()
    ? employees.filter((e) =>
        `${e.firstName} ${e.lastName} ${e.employeeNo} ${e.email}`
          .toLowerCase()
          .includes(empSearch.toLowerCase())
      )
    : employees;

  // KPI totals
  const totalGross = summaries.reduce((s, x) => s + Number(x.latestPayroll?.grossPay ?? 0), 0);
  const totalNet = summaries.reduce((s, x) => s + Number(x.latestPayroll?.netPayable ?? 0), 0);
  const processedCount = summaries.filter((x) => x.latestPayroll).length;

  const fmt = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6">

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Employees", value: employees.length, icon: <Users className="h-4 w-4" />, color: "text-blue-600 bg-blue-50 border-blue-100", iconBg: "bg-blue-100 text-blue-600" },
          { label: "Payroll Processed", value: processedCount, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-50 border-emerald-100", iconBg: "bg-emerald-100 text-emerald-600" },
          { label: "Total Gross Pay", value: formatMoney(String(totalGross), currencySymbol), icon: <TrendingUp className="h-4 w-4" />, color: "text-violet-600 bg-violet-50 border-violet-100", iconBg: "bg-violet-100 text-violet-600" },
          { label: "Total Net Pay", value: formatMoney(String(totalNet), currencySymbol), icon: <Banknote className="h-4 w-4" />, color: "text-amber-600 bg-amber-50 border-amber-100", iconBg: "bg-amber-100 text-amber-600" },
        ].map((kpi) => (
          <div key={kpi.label} className={cn("flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm", kpi.color)}>
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", kpi.iconBg)}>
              {kpi.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate">{kpi.label}</p>
              <p className="text-xl font-bold tabular-nums leading-tight truncate">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

        {/* ── Left: Employee Selector ── */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600">
                <Users className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-slate-700">Select Employee</span>
            </div>

            <div className="p-3">
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  placeholder="Search employees…"
                  className="pl-9 h-9 text-sm border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
                />
              </div>

              {loadingEmps ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-1 pr-0.5">
                  {filteredEmps.slice(0, 50).map((emp) => {
                    const isSelected = selectedEmp?.id === emp.id;
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => isSelected ? clearEmployee() : selectEmployee(emp)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                          isSelected
                            ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md"
                            : "hover:bg-slate-50 text-slate-700",
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          isSelected ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700",
                        )}>
                          {(emp.firstName?.[0] ?? "?").toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm font-semibold truncate", isSelected ? "text-white" : "text-slate-800")}>
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className={cn("text-[10px] font-mono truncate", isSelected ? "text-white/70" : "text-slate-400")}>
                            {emp.employeeNo}
                          </p>
                        </div>
                        {isSelected && <X className="h-4 w-4 shrink-0 text-white/70" />}
                      </button>
                    );
                  })}
                  {filteredEmps.length === 0 && (
                    <div className="py-6 text-center text-sm text-slate-400">No employees found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Employee payroll summary list ── */}
          {!selectedEmp && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Clock className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-700">Recent Payrolls</span>
              </div>
              {loadingSummaries ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                  {summaries.filter((s) => s.latestPayroll).slice(0, 10).map((s) => (
                    <div
                      key={String(s.employee.id)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 cursor-pointer transition-colors"
                      onClick={() => selectEmployee(s.employee)}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 text-xs font-bold">
                        {(s.employee.firstName?.[0] ?? "?").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {s.employee.firstName} {s.employee.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400">{s.latestPayroll?.payDate ? fmt(s.latestPayroll.payDate) : "—"}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 shrink-0">
                        {formatMoney(s.latestPayroll?.netPayable ?? "0", currencySymbol)}
                      </span>
                    </div>
                  ))}
                  {summaries.filter((s) => s.latestPayroll).length === 0 && (
                    <div className="py-6 text-center text-sm text-slate-400">No payrolls processed yet</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Payroll Generation + History ── */}
        <div className="space-y-5">
          {!selectedEmp ? (
            /* Empty state */
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
                <Banknote className="h-7 w-7 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-slate-700">No employee selected</p>
                <p className="text-sm text-slate-400 mt-1">Choose an employee from the list to generate or view payroll</p>
              </div>
            </div>
          ) : (
            <>
              {/* Selected employee header */}
              <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600" />
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white text-sm font-bold shadow">
                      {(selectedEmp.firstName?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">{selectedEmp.firstName} {selectedEmp.lastName}</p>
                      <p className="text-xs text-slate-400 font-mono">{selectedEmp.employeeNo} · {selectedEmp.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={clearEmployee}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                </div>
              </div>

              {/* ── Generate Payroll ── */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600">
                    <Play className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Generate Payroll</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  {[
                    { key: "payPeriodStart" as const, label: "Pay Period Start" },
                    { key: "payPeriodEnd" as const, label: "Pay Period End" },
                    { key: "payDate" as const, label: "Pay Date" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">{label} <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="date"
                          value={payInput[key]}
                          onChange={(e) => setPayInput((p) => ({ ...p, [key]: e.target.value }))}
                          className="pl-9 h-9 text-sm border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="h-10 gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold px-5"
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  ) : (
                    <><Play className="h-4 w-4" /> Generate Payroll</>
                  )}
                </Button>
              </div>

              {/* ── Payroll History ── */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                    <FileText className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Payroll History</span>
                  {history.length > 0 && (
                    <span className="ml-auto text-[10px] font-semibold text-slate-400">{history.length} record{history.length !== 1 ? "s" : ""}</span>
                  )}
                </div>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-sm">Loading history…</span>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm font-medium">No payroll history yet</p>
                    <p className="text-xs">Generate your first payroll above</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          {["Payroll Code", "Pay Period", "Pay Date", "Gross Pay", "Deductions", "Net Payable", ""].map((h) => (
                            <th key={h} className={cn(
                              "px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500",
                              h === "" ? "text-center" : "text-left",
                            )}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((row, idx) => (
                          <tr
                            key={row.payrollCode ?? idx}
                            className={cn(
                              "border-b border-slate-100 transition-colors hover:bg-slate-50/60",
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                            )}
                          >
                            <td className="px-4 py-3">
                              <code className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
                                {row.payrollCode}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs">
                              <div className="flex items-center gap-1">
                                <span>{fmt(row.payPeriodStart)}</span>
                                {row.payPeriodEnd && (
                                  <>
                                    <ChevronDown className="h-3 w-3 rotate-[-90deg] text-slate-400" />
                                    <span>{fmt(row.payPeriodEnd)}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs">{fmt(row.payDate)}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {formatMoney(row.grossPay, currencySymbol)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-rose-600">
                              -{formatMoney(String(row.totalDeductions ?? 0), currencySymbol)}
                            </td>
                            <td className="px-4 py-3 font-bold text-emerald-700">
                              {formatMoney(row.netPayable, currencySymbol)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleDownload(row)}
                                disabled={pdfLoading === row.payrollCode}
                                title="Download Payslip PDF"
                                className={cn(
                                  "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors",
                                  "hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600",
                                  pdfLoading === row.payrollCode && "opacity-50 cursor-wait",
                                )}
                              >
                                {pdfLoading === row.payrollCode
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Download className="h-3.5 w-3.5" />
                                }
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
