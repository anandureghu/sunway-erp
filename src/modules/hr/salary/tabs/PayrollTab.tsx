import { useEffect, useState, useCallback } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import { payrollService } from "@/service/payrollService";
import { fetchCompany } from "@/service/companyService";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { Company } from "@/types/company";

type SalaryCtx = { editing: boolean };

type PayrollRow = {
  payDate: string; // yyyy-mm-dd
  payrollCode: string;
  payPeriodStart: string; // yyyy-mm-dd (populated from salary)
  payPeriodEnd: string; // yyyy-mm-dd (populated from salary)
  grossPay: string; // calculated from Total Compensation (basicSalary + totalAllowance)
  payDay: string; // only editable field
  netPayable: string;
  bankName?: string;
  bankAccount?: string;
};
type PayrollRowExtended = PayrollRow & {
  totalDeductions?: string | number;
  loanDeduction?: string | number;
};

export default function PayrollTab() {
  const { editing } = useOutletContext<SalaryCtx>();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;
  const { user } = useAuth();

  const [payroll, setPayroll] = useState({
    payPeriodStart: "",
    payPeriodEnd: "",
    payDate: "",
  });
  const [history, setHistory] = useState<PayrollRow[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const loadPayrollHistory = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await payrollService.getPayrollHistory(employeeId);
      setHistory(res.data || []);
    } catch (err: any) {
      console.error("Failed to load payroll history", err);
      toast.error(
        err?.response?.data?.message || "Failed to load payroll history",
      );
    }
  }, [employeeId]);

  useEffect(() => {
    void loadPayrollHistory();
  }, [loadPayrollHistory]);

  useEffect(() => {
    if (user?.companyId) {
      fetchCompany(user.companyId.toString())
        .then((company: Company) => {
          if (company?.currency?.currencyCode) {
            setCurrencySymbol(company.currency.currencyCode);
          }
        })
        .catch((err) => {
          console.error("Failed to load company currency", err);
        });
    }
  }, [user?.companyId]);

  const patch = (k: keyof typeof payroll, v: string) =>
    setPayroll((p) => ({ ...p, [k]: v }));

  const handleGeneratePayroll = async () => {
    if (!employeeId) return;

    try {
      await payrollService.generatePayroll(employeeId, {
        payPeriodStart: payroll.payPeriodStart,
        payPeriodEnd: payroll.payPeriodEnd,
        payDate: payroll.payDate,
      });

      toast.success("Payroll generated successfully");

      await loadPayrollHistory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate payroll");
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">Payroll </div>
      <div className="grid grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-sm font-medium">Pay Period Start</label>
          <Input
            type="date"
            value={payroll.payPeriodStart}
            onChange={(e) => patch("payPeriodStart", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Pay Period End</label>
          <Input
            type="date"
            value={payroll.payPeriodEnd}
            onChange={(e) => patch("payPeriodEnd", e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Pay Date</label>
          <Input
            type="date"
            value={payroll.payDate}
            onChange={(e) => patch("payDate", e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGeneratePayroll} disabled={!editing}>
          Generate Payroll
        </Button>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Payroll History</h3>
        <div className="overflow-x-auto rounded-md border mt-2">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Payroll Code</th>
                <th className="px-3 py-2 font-medium">Pay Period Start</th>
                <th className="px-3 py-2 font-medium">Pay Period End</th>
                <th className="px-3 py-2 font-medium">Gross Pay</th>
                <th className="px-3 py-2 font-medium">Total Deductions</th>
                <th className="px-3 py-2 font-medium">Pay Date</th>
                <th className="px-3 py-2 font-medium">Net Payable</th>
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
              {history.map((r) => {
                const row = r as PayrollRowExtended;
                return (
                  <tr key={row.payrollCode} className="border-t">
                    <td className="px-3 py-2">{row.payrollCode}</td>
                    <td className="px-3 py-2">{row.payPeriodStart}</td>
                    <td className="px-3 py-2">{row.payPeriodEnd}</td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {history.map((r) => {
          const row = r as PayrollRowExtended;
          return (
            <div
              key={row.payrollCode}
              className="text-xs text-muted-foreground mt-2"
            >
              Loan: {formatMoney(String(row.loanDeduction ?? 0))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
