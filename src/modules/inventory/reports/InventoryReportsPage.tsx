import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  useInventoryReports,
  type InventoryReportView,
} from "./use-inventory-reports";
import { OperationsReportTab } from "./OperationsReportTab";
import { ManagementReportTab } from "./ManagementReportTab";

export default function InventoryReportsPage() {
  const data = useInventoryReports();
  const { company, summaryLoading, loadSummary, summary } = data;
  const location = useLocation();

  const view: InventoryReportView = useMemo(
    () =>
      location.pathname.endsWith("/management") ? "management" : "operations",
    [location.pathname],
  );

  const handleExport = () => {
    if (view === "operations") data.exportOperationsCsv();
    else data.exportManagementCsv();
  };

  const pageTitle =
    view === "operations" ? "Operations Reports" : "Management Reports";
  const pageDescription =
    view === "operations"
      ? `${company?.companyName ?? "Company"} · stock movements, batches, and warehouse actions`
      : `${company?.companyName ?? "Company"} · valuation, turnover, and capital analytics`;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        variant="darkGreen"
        icon={<BarChart3 className="w-6 h-6" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={summaryLoading}
              onClick={() => void loadSummary()}
              className="border border-white/25 bg-white/15 text-white hover:bg-white/25 hover:text-white"
            >
              {summaryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={!summary || summaryLoading}
              className="bg-white text-emerald-800 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      {view === "operations" ? (
        <OperationsReportTab data={data} />
      ) : (
        <ManagementReportTab data={data} />
      )}
    </div>
  );
}
