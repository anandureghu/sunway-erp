import { useEffect, useState, useCallback } from "react";
import { Download, Loader2, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { useParams } from "react-router-dom";
import { payrollService } from "@/service/payrollService";
import { fetchCompany } from "@/service/companyService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { Company } from "@/types/company";
import { downloadPayslipPdf } from "@/service/payslipService";

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

/** Read-only payroll runs for this employee (generation is from HR Settings → Payroll). */
export default function PayrollTab() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;
  const { user } = useAuth();

  const [history, setHistory] = useState<PayrollRow[]>([]);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const loadPayrollHistory = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await payrollService.getPayrollHistory(employeeId);
      setHistory(res?.data ?? []);
    } catch (err: unknown) {
      console.error("Failed to load payroll history", err);
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(
        ax?.response?.data?.message ?? "Failed to load payroll history",
      );
    }
  }, [employeeId]);

  useEffect(() => {
    void loadPayrollHistory();
  }, [loadPayrollHistory]);

  useEffect(() => {
    if (!user?.companyId) return;
    fetchCompany(user.companyId.toString())
      .then((company: Company) => {
        if (company?.currency?.currencyCode) {
          setCurrencySymbol(company.currency.currencyCode);
        }
      })
      .catch((err) => console.error("Failed to load company currency", err));
  }, [user?.companyId]);

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
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
        <ScrollText className="h-5 w-5 shrink-0 text-slate-500 mt-0.5" />
        <p>
          This is a read-only list of payroll runs for this employee. Monthly payroll generation is done from{" "}
          <span className="font-medium text-slate-900">HR Settings → Payroll</span>.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Payroll history</h3>
        <div className="mt-2 overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Payroll Code</th>
                <th className="px-3 py-2 font-medium">Pay Period</th>
                <th className="px-3 py-2 font-medium">Gross Pay</th>
                <th className="px-3 py-2 font-medium">Deductions</th>
                <th className="px-3 py-2 font-medium">Pay Date</th>
                <th className="px-3 py-2 font-medium">Net Payable</th>
                <th className="w-24 px-3 py-2 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No payroll history
                  </td>
                </tr>
              )}

              {history.map((row) => (
                <tr
                  key={row.payrollCode}
                  className="border-t hover:bg-muted/50"
                >
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.payrollCode}
                  </td>
                  <td className="px-3 py-2">
                    {row.payPeriodStart}
                    {row.payPeriodEnd ? ` → ${row.payPeriodEnd}` : ""}
                  </td>
                  <td className="px-3 py-2">
                    {formatMoney(row.grossPay, currencySymbol)}
                  </td>
                  <td className="px-3 py-2 text-red-600">
                    -
                    {formatMoney(
                      String(row.totalDeductions ?? 0),
                      currencySymbol,
                    )}
                  </td>
                  <td className="px-3 py-2">{row.payDate}</td>
                  <td className="px-3 py-2 font-bold text-green-700">
                    {formatMoney(row.netPayable, currencySymbol)}
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Download payslip PDF"
                        disabled={pdfLoading === row.payrollCode}
                        onClick={() => void handleDownloadPDF(row)}
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
              ))}
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
