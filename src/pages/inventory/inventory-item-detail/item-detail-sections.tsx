import type {
  ItemResponseDTO,
  ItemWarehouseStockRowDTO,
} from "@/service/erpApiTypes";
import { listItemWarehouseStock } from "@/service/inventoryService";
import { useEffect, useState } from "react";
import { ItemDetailHero } from "./item-detail-hero";
import { ItemDetailBody } from "./item-detail-body";
import { ItemDetailLocation } from "./item-detail-location";
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
  const [warehouseStock, setWarehouseStock] = useState<
    ItemWarehouseStockRowDTO[]
  >([]);
  const [warehouseStockLoading, setWarehouseStockLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setWarehouseStockLoading(true);
    listItemWarehouseStock(item.id)
      .then((rows) => {
        if (!cancelled) setWarehouseStock(rows);
      })
      .catch(() => {
        if (!cancelled) setWarehouseStock([]);
      })
      .finally(() => {
        if (!cancelled) setWarehouseStockLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  return (
    <div className="space-y-3">
      <ItemDetailHero
        item={item}
        imageNonce={imageNonce}
        onEdit={onEdit}
        onUpdateImage={onUpdateImage}
      />
      <ItemDetailBody item={item} />
      <ItemDetailLocation item={item} />
      <ItemDetailStockOverview
        item={item}
        warehouseStock={warehouseStock}
        warehouseStockLoading={warehouseStockLoading}
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ItemDetailCostSelling item={item} />
        <ItemDetailAudit item={item} />
      </div>
    </div>
  );
}
