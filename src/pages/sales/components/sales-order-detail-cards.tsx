import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { SalesOrderDetailFinancials } from "./sales-order-detail-financials";
import { SalesOrderDetailHero } from "./sales-order-detail-hero";
import { SalesOrderDetailItems } from "./sales-order-detail-items";
import { SalesOrderReturnsHistory } from "./sales-order-returns-history";

type Props = {
  so: SalesOrderResponseDTO;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onDownloadDocument: () => void;
  onReturned?: () => void;
  returnsRefreshKey?: number;
  onGeneratePicklist?: () => void;
  onViewPicklist?: () => void;
  hasActivePicklist?: boolean;
};

export function SalesOrderDetailCards({
  so,
  onEdit,
  onConfirm,
  onCancel,
  onDownloadDocument,
  onReturned,
  returnsRefreshKey = 0,
  onGeneratePicklist,
  onViewPicklist,
  hasActivePicklist = false,
}: Props) {
  return (
    <div className="space-y-6">
      <SalesOrderDetailHero
        so={so}
        onEdit={onEdit}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onDownloadDocument={onDownloadDocument}
        onReturned={onReturned}
        onGeneratePicklist={onGeneratePicklist}
        onViewPicklist={onViewPicklist}
        hasActivePicklist={hasActivePicklist}
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
