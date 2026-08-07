import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { SalesOrderDetailFinancials } from "./sales-order-detail-financials";
import { SalesOrderDetailHero } from "./sales-order-detail-hero";
import { SalesOrderDetailItems } from "./sales-order-detail-items";

type Props = {
  so: SalesOrderResponseDTO;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onDownloadDocument: () => void;
  onReturned?: () => void;
};

export function SalesOrderDetailCards({
  so,
  onEdit,
  onConfirm,
  onCancel,
  onDownloadDocument,
  onReturned,
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
      />

      <SalesOrderDetailItems so={so} />

      <SalesOrderDetailFinancials so={so} />
    </div>
  );
}
