/**
 * STOCK_SHEET_REPORTS — page shell for Stock Summary.
 * Delete with Item Summary page, sidebar entries, and backend StockSheetReportService.
 */
import { useNavigate } from "react-router-dom";
import StockSummaryReport from "@/modules/inventory/reports/StockSummaryReport";

export default function StockSummaryReportPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 p-6 print:p-0">
      <StockSummaryReport
        onOpenItem={(id) =>
          navigate(`/inventory/reports/item-summary?item=${id}`)
        }
      />
    </div>
  );
}
