/**
 * FIN_SHEET_REPORTS — page shell for Account Summary.
 * Delete with Financial Summary page, sidebar entries, and backend FinanceSheetReportService.
 */
import { useSearchParams } from "react-router-dom";
import AccountSummaryReport from "@/modules/finance/reports/AccountSummaryReport";

export default function AccountSummaryReportPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("account");
  const accountId = raw && /^\d+$/.test(raw) ? Number(raw) : null;

  const onSelectAccount = (id: number | null) => {
    if (id == null) {
      setParams({}, { replace: true });
      return;
    }
    setParams({ account: String(id) }, { replace: true });
  };

  return (
    <div className="space-y-4 p-6 print:p-0">
      <AccountSummaryReport accountId={accountId} onSelectAccount={onSelectAccount} />
    </div>
  );
}
