/**
 * FIN_SHEET_REPORTS — page shell for Financial Summary.
 * Delete with Account Summary page, sidebar entries, and backend FinanceSheetReportService.
 */
import { useNavigate } from "react-router-dom";
import FinancialSummaryReportView from "@/modules/finance/reports/FinancialSummaryReport";

export default function FinancialSummaryReportPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 p-6 print:p-0">
      <FinancialSummaryReportView
        onOpenAccount={(id) =>
          navigate(`/finance/reports/account-summary?account=${id}`)
        }
      />
    </div>
  );
}
