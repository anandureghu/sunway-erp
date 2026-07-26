import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { ItemDetailHero } from "./item-detail-hero";
import { ItemDetailBody } from "./item-detail-body";
import { ItemDetailStockOverview } from "./item-detail-stock-overview";

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
    <div className="space-y-6">
      <ItemDetailHero
        item={item}
        imageNonce={imageNonce}
        onEdit={onEdit}
        onUpdateImage={onUpdateImage}
      />
      <ItemDetailBody item={item} />
      <ItemDetailStockOverview item={item} />
    </div>
  );
}
