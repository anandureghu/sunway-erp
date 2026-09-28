/**
 * STOCK_SHEET_REPORTS — page shell for Item Summary.
 * Delete with Stock Summary page, sidebar entries, and backend StockSheetReportService.
 */
import { useSearchParams } from "react-router-dom";
import ItemSummaryReport from "@/modules/inventory/reports/ItemSummaryReport";

export default function ItemSummaryReportPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("item");
  const itemId = raw && /^\d+$/.test(raw) ? Number(raw) : null;

  const onSelectItem = (id: number | null) => {
    if (id == null) {
      setParams({}, { replace: true });
      return;
    }
    setParams({ item: String(id) }, { replace: true });
  };

  return (
    <div className="space-y-4 p-6 print:p-0">
      <ItemSummaryReport itemId={itemId} onSelectItem={onSelectItem} />
    </div>
  );
}
