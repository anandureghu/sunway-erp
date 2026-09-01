import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { ItemDetailHero } from "./item-detail-hero";
import { ItemDetailBody } from "./item-detail-body";
import { ItemDetailStockOverview } from "./item-detail-stock-overview";
import { ItemDetailCostSelling } from "./item-detail-cost-selling";
import { ItemDetailAudit } from "./item-detail-audit";

type Props = {
  item: ItemResponseDTO;
  imageNonce: number;
  onEdit: () => void;
  onUpdateImage: () => void;
};

export function ItemDetailSections({
  item,
  imageNonce,
  onEdit,
  onUpdateImage,
}: Props) {
  return (
    <div className="space-y-3">
      <ItemDetailHero
        item={item}
        imageNonce={imageNonce}
        onEdit={onEdit}
        onUpdateImage={onUpdateImage}
      />
      <ItemDetailBody item={item} />
      <ItemDetailStockOverview item={item} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ItemDetailCostSelling item={item} />
        <ItemDetailAudit item={item} />
      </div>
    </div>
  );
}
