import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { SalesOrderDetailCustomer } from "./sales-order-detail-customer";
import { SalesOrderDetailFinancials } from "./sales-order-detail-financials";
import { SalesOrderDetailHero } from "./sales-order-detail-hero";
import { SalesOrderDetailItems } from "./sales-order-detail-items";

type Props = {
  so: SalesOrderResponseDTO;
  onEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onDownloadDocument: () => void;
};

export function SalesOrderDetailCards({
  so,
  onEdit,
  onConfirm,
  onCancel,
  onDownloadDocument,
}: Props) {
  return (
    <div className="space-y-6">
      <SalesOrderDetailHero
        so={so}
        onEdit={onEdit}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onDownloadDocument={onDownloadDocument}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SalesOrderDetailItems so={so} />
        </div>
        <div className="lg:col-span-4">
          <SalesOrderDetailCustomer so={so} />
        </div>
      </div>

      <SalesOrderDetailFinancials so={so} />
    </div>
  );
}
