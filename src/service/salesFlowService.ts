import { apiClient } from "@/service/apiClient";
import type {
  SalesOrder,
  SalesOrderItem,
  Picklist,
  PicklistItem,
  Dispatch,
} from "@/types/sales";
import type {
  Id,
  SalesOrderCreateDTO,
  SalesOrderResponseDTO,
  SalesOrderUpdateDTO,
  PicklistResponseDTO,
  ShipmentCreateDTO,
  ShipmentResponseDTO,
  ItemResponseDTO,
} from "@/service/erpApiTypes";

function normalizeStatus(status?: string) {
  return (status || "").toLowerCase();
}

function toSalesOrder(dto: SalesOrderResponseDTO): SalesOrder {
  const items: SalesOrderItem[] = (dto.items || []).map((li, idx) => ({
    id: `soi-${dto.id}-${idx}`,
    orderId: String(dto.id),
    itemId: li.itemId || 0,
    itemName: li.itemName,
    warehouseId: li.warehouseId,
    warehouseName: li.warehouseName,
    quantity: Number(li.quantity || 0),
    unitPrice: Number(li.unitPrice || 0),
    discount: 0,
    tax: 0,
    total: Number(li.lineTotal || 0),
  }));

  const total = Number(dto.totalAmount || 0);

  return {
    id: String(dto.id),
    orderNo: dto.orderNumber || `SO-${dto.id}`,
    customerId: String(dto.customerId || ""),
    customerName: dto.customerName || "",
    customerEmail: dto.customerEmail || "",
    customerPhone: dto.customerPhone || "",
    orderDate: dto.orderDate || "",
    requiredDate: undefined,
    status: (normalizeStatus(dto.status) as any) || "draft",
    items,
    subtotal: total,
    tax: 0,
    discount: 0,
    total,
    shippingAddress: undefined,
    notes: undefined,
    salesPerson: undefined,
    createdBy: undefined,
    createdAt: "",
    updatedAt: "",
  };
}

function toPicklist(dto: PicklistResponseDTO): Picklist {
  const items: PicklistItem[] = (dto.items || []).map((li, idx) => ({
    id: `pli-${dto.id}-${idx}`,
    picklistId: String(dto.id),
    orderItemId: "",
    itemId: li.itemId || 0,
    quantity: Number(li.quantity || 0),
    warehouse: dto.warehouse,
    warehouseId: dto.warehouseId,
  }));

  // Map backend status -> UI picklist statuses (created, picked, cancelled)
  const s = normalizeStatus(dto.status);
  const status =
    s === "picked" ? "picked" : s === "cancelled" ? "cancelled" : "created"; // Default to "created"

  return {
    id: String(dto.id),
    picklistNo: dto.picklistNumber || `PL-${dto.id}`,
    orderId: String(dto.salesOrderId || ""),
    warehouseId: "", // Backend doesn't return warehouseId in PicklistResponseDTO
    // Will be enriched from sales order if needed via attachOrderAndItems
    status,
    items,
    assignedTo: undefined,
    startTime: undefined,
    completedTime: undefined,
    createdAt: dto.createdAt || "",
    updatedAt: undefined,
  };
}

function toShipmentAsDispatch(dto: ShipmentResponseDTO): Dispatch {
  // Map backend status -> UI dispatch statuses (created, dispatched, in_transit, delivered, cancelled)
  const s = normalizeStatus(dto.status);
  const status =
    s === "delivered"
      ? "delivered"
      : s === "in_transit"
        ? "in_transit"
        : s === "dispatched"
          ? "dispatched"
          : s === "cancelled"
            ? "cancelled"
            : "created"; // Default to "created"

  return {
    id: String(dto.id),
    dispatchNo: dto.shipmentNumber || `SHP-${dto.id}`,
    orderId: "", // Will be derived from picklist in attachOrderAndItems function
    picklistId: String(dto.picklistId || ""),
    status,
    vehicleId: undefined,
    vehicleNumber: undefined,
    driverName: undefined,
    driverPhone: undefined,
    estimatedDeliveryDate: undefined,
    actualDeliveryDate: dto.deliveredAt || undefined,
    deliveryAddress: "", // Backend doesn't provide this in ShipmentResponseDTO
    trackingNumber: dto.trackingNumber || undefined,
    notes: dto.carrierName || undefined,
    createdBy: undefined,
    createdAt: dto.dispatchedAt || dto.deliveredAt || "",
    updatedAt: undefined,
  };
}

// --- Sales Orders ---
export async function listSalesOrders(): Promise<SalesOrder[]> {
  const res = await apiClient.get<SalesOrderResponseDTO[]>("/sales/orders");
  return (res.data || []).map(toSalesOrder);
}

export async function createSalesOrder(payload: SalesOrderCreateDTO) {
  const res = await apiClient.post<SalesOrderResponseDTO>(
    "/sales/orders",
    payload,
  );
  return toSalesOrder(res.data);
}

export async function confirmSalesOrder(id: Id | string) {
  const res = await apiClient.post<SalesOrderResponseDTO>(
    `/sales/orders/${id}/confirm`,
  );
  return toSalesOrder(res.data);
}

export async function cancelSalesOrder(id: Id | string) {
  const res = await apiClient.post<SalesOrderResponseDTO>(
    `/sales/orders/${id}/cancel`,
  );
  return toSalesOrder(res.data);
}

export async function updateSalesOrder(
  id: Id | string,
  payload: SalesOrderUpdateDTO,
) {
  const res = await apiClient.put<SalesOrderResponseDTO>(
    `/sales/orders/${id}`,
    payload,
  );
  return toSalesOrder(res.data);
}

// --- Picklists ---
export async function listPicklists(): Promise<Picklist[]> {
  const res = await apiClient.get<PicklistResponseDTO[]>(
    "/warehouse/picklists",
  );
  return (res.data || []).map(toPicklist);
}

export async function generatePicklistFromSalesOrder(
  salesOrderId: Id | string,
  options?: { warehouseId?: Id | string },
) {
  const res = await apiClient.post<PicklistResponseDTO>(
    `/warehouse/picklists/from-sales-order/${salesOrderId}`,
    options?.warehouseId
      ? { warehouseId: Number(options.warehouseId) }
      : undefined,
  );
  return toPicklist(res.data);
}

export async function markPicklistPicked(id: Id | string) {
  const res = await apiClient.post<PicklistResponseDTO>(
    `/warehouse/picklists/${id}/picked`,
  );
  return toPicklist(res.data);
}

export async function cancelPicklist(id: Id | string) {
  const res = await apiClient.post<PicklistResponseDTO>(
    `/warehouse/picklists/${id}/cancel`,
  );
  return toPicklist(res.data);
}

// --- Shipments (mapped to UI Dispatch type) ---
export async function listShipmentsAsDispatches(): Promise<Dispatch[]> {
  const res = await apiClient.get<ShipmentResponseDTO[]>(
    "/warehouse/shipments",
  );
  return (res.data || []).map(toShipmentAsDispatch);
}

export async function createShipmentFromPicklist(
  picklistId: Id | string,
  payload: ShipmentCreateDTO,
) {
  const res = await apiClient.post<ShipmentResponseDTO>(
    `/warehouse/shipments/from-picklist/${picklistId}`,
    payload,
  );
  return toShipmentAsDispatch(res.data);
}

export async function dispatchShipment(id: Id | string) {
  const res = await apiClient.post<ShipmentResponseDTO>(
    `/warehouse/shipments/${id}/dispatch`,
  );
  return toShipmentAsDispatch(res.data);
}

export async function markShipmentInTransit(id: Id | string) {
  const res = await apiClient.post<ShipmentResponseDTO>(
    `/warehouse/shipments/${id}/in-transit`,
  );
  return toShipmentAsDispatch(res.data);
}

export async function markShipmentDelivered(id: Id | string) {
  const res = await apiClient.post<ShipmentResponseDTO>(
    `/warehouse/shipments/${id}/delivered`,
  );
  return toShipmentAsDispatch(res.data);
}

export async function cancelShipment(id: Id | string) {
  const res = await apiClient.post<ShipmentResponseDTO>(
    `/warehouse/shipments/${id}/cancel`,
  );
  return toShipmentAsDispatch(res.data);
}

// --- Helpers for UI joins ---
export function attachOrderAndItems(
  orders: SalesOrder[],
  picklists: Picklist[],
  dispatches: Dispatch[],
  items: ItemResponseDTO[],
) {
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const itemById = new Map(items.map((i) => [i.id, i]));

  const picklistsEnriched = picklists.map((p) => {
    const order = orderById.get(p.orderId);
    // Try to get warehouseId from order items if available
    let warehouseId = p.warehouseId || "";
    if (!warehouseId && order && order.items.length > 0) {
      const itemWithWarehouse = order.items.find((item) => item.warehouseId);
      warehouseId = itemWithWarehouse?.warehouseId?.toString() || "";
    }

    return {
      ...p,
      warehouseId,
      order,
      items: p.items.map((pli) => ({
        ...pli,
        item: itemById.get(Number(pli.itemId)),
      })),
    };
  });

  const dispatchesEnriched = dispatches.map((d) => {
    const pick = picklists.find((p) => p.id === d.picklistId);
    const orderId = pick?.orderId || "";
    return {
      ...d,
      orderId,
      order: orderId ? orderById.get(orderId) : undefined,
    };
  });

  return { picklistsEnriched, dispatchesEnriched };
}
