import { useEffect, useState, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Employee, Salary } from "@/types/hr";

import { formatMoney } from "@/lib/utils";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { hrService } from "@/service/hr.service";
import { salaryService } from "@/service/salaryService";
import { bankService } from "@/service/bankService";
import { payrollService } from "@/service/payrollService";
import { leaveService } from "@/service/leaveService";
import { fetchCompany } from "@/service/companyService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { Company } from "@/types/company";
import { downloadPayslipPdf } from "@/service/payslipService";

type SalaryCtx = { editing: boolean };

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
  bankBranch?: string;
}

interface AppState {
  employee: Employee | null;
  salary: Salary | null;
  bank: any | null;
  currencySymbol: string;
  leaveTaken: number;
}



export default function PayrollTab() {
  const { editing }  = useOutletContext<SalaryCtx>();
  const { id }       = useParams<{ id: string }>();
  const employeeId   = id ? Number(id) : undefined;
  const { user }     = useAuth();

  const [payrollInput, setPayrollInput] = useState({
    payPeriodStart: "",
    payPeriodEnd:   "",
    payDate:        "",
  });
  const [history,    setHistory]    = useState<PayrollRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);

  const [appState, setAppState] = useState<AppState>({
    employee:      null,
    salary:        null,
    bank:          null,
    currencySymbol: "$",
    leaveTaken:    0,
  });



  const loadAppData = useCallback(async () => {
    if (!employeeId) return;
    try {
      const [empRes, salRes, bankRes, leaveRes] = await Promise.all([
        hrService.getEmployee(employeeId),
        salaryService.get(employeeId),
        bankService.get(employeeId),
leaveService.fetchLeaveHistory(employeeId).catch(() => ({ data: [] })),
      ]);

      const currentYear = new Date().getFullYear();
      const leaveTaken = (leaveRes?.data ?? [])
        .filter((l: any) => {
          const year = new Date(l.startDate ?? l.dateReported ?? "").getFullYear();
          return year === currentYear;
        })
        .reduce((sum: number, l: any) => sum + (l.totalDays ?? 0), 0);

      setAppState((prev) => ({
        ...prev,
        employee:  empRes,
        salary:    salRes?.data  ?? null,
        bank:      bankRes?.data ?? null,
        leaveTaken,
      }));
    } catch (err) {
      console.error("Failed to load employee data", err);
      toast.error("Failed to load employee data");
    }
  }, [employeeId]);

  useEffect(() => { loadAppData(); }, [loadAppData]);

  const loadPayrollHistory = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await payrollService.getPayrollHistory(employeeId);
      setHistory(res?.data ?? []);
    } catch (err: any) {
      console.error("Failed to load payroll history", err);
      toast.error(err?.response?.data?.message || "Failed to load payroll history");
    }
  }, [employeeId]);

  useEffect(() => { void loadPayrollHistory(); }, [loadPayrollHistory]);

  useEffect(() => {
    if (!user?.companyId) return;
    fetchCompany(user.companyId.toString())
      .then((company: Company) => {
        if (company?.currency?.currencyCode) {
          setAppState((prev) => ({
            ...prev,
            currencySymbol: company.currency!.currencyCode,
          }));
        }
      })
      .catch((err) => console.error("Failed to load company currency", err));
  }, [user?.companyId]);

  const patchInput = (k: keyof typeof payrollInput, v: string) =>
    setPayrollInput((p) => ({ ...p, [k]: v }));

  const handleGeneratePayroll = async () => {
    if (!employeeId) return;
    if (!payrollInput.payPeriodStart || !payrollInput.payPeriodEnd || !payrollInput.payDate) {
      toast.error("Please fill in all date fields before generating payroll");
      return;
    }

    setGenerating(true);
    try {
      await payrollService.generatePayroll(employeeId, {
        payPeriodStart: payrollInput.payPeriodStart,
        payPeriodEnd:   payrollInput.payPeriodEnd,
        payDate:        payrollInput.payDate,
      });
      toast.success("Payroll generated successfully");
      await loadPayrollHistory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

const handleDownloadPDF = async (row: PayrollRow) => {
  if (!employeeId) return;
  setPdfLoading(row.payrollCode);
  try {
    await downloadPayslipPdf(employeeId, row.payrollCode);
    toast.success("PDF downloaded");
  } catch (err) {
    console.error("PDF export failed", err);
    toast.error("PDF export failed");
  } finally {
    setPdfLoading(null);
  }
};

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Payroll</div>

      <div className="grid grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-sm font-medium">Pay Period Start</label>
<Input
            type="date"
            value={payrollInput.payPeriodStart}
            onChange={editing ? (e) => patchInput("payPeriodStart", e.target.value) : undefined}
            disabled={!editing}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Pay Period End</label>
<Input
            type="date"
            value={payrollInput.payPeriodEnd}
            onChange={editing ? (e) => patchInput("payPeriodEnd", e.target.value) : undefined}
            disabled={!editing}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Pay Date</label>
<Input
            type="date"
            value={payrollInput.payDate}
            onChange={editing ? (e) => patchInput("payDate", e.target.value) : undefined}
            disabled={!editing}
          />
        </div>
      </div>

      <Button
        onClick={handleGeneratePayroll}
        disabled={!editing || generating}
        className="flex items-center gap-2"
      >
        {generating && <Loader2 className="h-4 w-4 animate-spin" />}
        {generating ? "Generating…" : "Generate Payroll"}
      </Button>

      <div>
        <h3 className="text-lg font-semibold">Payroll History</h3>
        <div className="overflow-x-auto rounded-md border mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Payroll Code</th>
                <th className="px-3 py-2 font-medium">Pay Period</th>
                <th className="px-3 py-2 font-medium">Gross Pay</th>
                <th className="px-3 py-2 font-medium">Deductions</th>
                <th className="px-3 py-2 font-medium">Pay Date</th>
                <th className="px-3 py-2 font-medium">Net Payable</th>
                <th className="px-3 py-2 font-medium w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    No payroll history
                  </td>
                </tr>
              )}

              {history.map((row) => {


                return (
                  <tr key={row.payrollCode} className="border-t hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">{row.payrollCode}</td>
                    <td className="px-3 py-2">
                      {row.payPeriodStart}
                      {row.payPeriodEnd ? ` → ${row.payPeriodEnd}` : ""}
                    </td>
                    <td className="px-3 py-2">
                      {formatMoney(row.grossPay, appState.currencySymbol)}
                    </td>
                    <td className="px-3 py-2 text-red-600">
                      -{formatMoney(String(row.totalDeductions ?? 0), appState.currencySymbol)}
                    </td>
                    <td className="px-3 py-2">{row.payDate}</td>
                    <td className="px-3 py-2 font-bold text-green-700">
                      {formatMoney(row.netPayable, appState.currencySymbol)}
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-center">

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Download PDF"
                          disabled={pdfLoading === row.payrollCode}
                          onClick={() => handleDownloadPDF(row)}
                        >
                          {pdfLoading === row.payrollCode ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>

                      </div>

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          body > *:not(#payslip-print-root) { display: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

