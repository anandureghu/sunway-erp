import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import type { Picklist } from "@/types/sales";
import { SalesOrderDetailFinancials } from "./sales-order-detail-financials";
import { SalesOrderDetailHero } from "./sales-order-detail-hero";
import { SalesOrderDetailItems } from "./sales-order-detail-items";
import { SalesOrderReturnsHistory } from "./sales-order-returns-history";

type Props = {
  so: SalesOrderResponseDTO;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete?: () => void;
  onDownloadDocument: () => void;
  onReturned?: () => void;
  returnsRefreshKey?: number;
  onGeneratePicklist?: () => void;
  onViewPicklist?: () => void;
  activePicklist?: Picklist | null;
  hasActivePicklist?: boolean;
  submitting?: boolean;
};

export function SalesOrderDetailCards({
  so,
  onEdit,
  onConfirm,
  onCancel,
  onComplete,
  onDownloadDocument,
  onReturned,
  returnsRefreshKey = 0,
  onGeneratePicklist,
  onViewPicklist,
  activePicklist = null,
  hasActivePicklist = false,
  submitting = false,
}: Props) {
  return (
    <div className="space-y-6">
      <SalesOrderDetailHero
        so={so}
        onEdit={onEdit}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onComplete={onComplete}
        onDownloadDocument={onDownloadDocument}
        onReturned={onReturned}
        onGeneratePicklist={onGeneratePicklist}
        onViewPicklist={onViewPicklist}
        activePicklist={activePicklist}
        hasActivePicklist={hasActivePicklist}
        submitting={submitting}
      />

      <SalesOrderDetailItems so={so} />

      <SalesOrderDetailFinancials so={so} />

      {so.id != null && (
        <SalesOrderReturnsHistory
          salesOrderId={Number(so.id)}
          refreshKey={returnsRefreshKey}
        />
      )}
    </div>
  );
}
