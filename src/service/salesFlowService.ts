import { apiClient } from "@/service/apiClient";
import type {
  SalesOrder,
  SalesOrderItem,
  Picklist,
  PicklistItem,
  Dispatch,
  DispatchTrackingEvent,
} from "@/types/sales";
import type {
  Id,
  SalesOrderCreateDTO,
  SalesOrderResponseDTO,
  SalesOrderUpdateDTO,
  PicklistResponseDTO,
  ShipmentCreateDTO,
  ShipmentResponseDTO,
  ShipmentTrackingEventDTO,
  ShipmentTrackingEventCreateDTO,
  ItemResponseDTO,
} from "@/service/erpApiTypes";

function normalizeStatus(status?: string) {
  return (status || "").toLowerCase();
}

function normalizePaymentStatus(status?: string) {
  const normalized = (status || "").trim().toUpperCase();
  if (!normalized) return "UNPAID";
  if (normalized === "PAID") return "PAID";
  if (normalized === "PARTIALLY_PAID" || normalized === "PARTIAL" || normalized === "PARTIALLY PAID") {
    return "PARTIALLY_PAID";
  }
  if (normalized === "OVERDUE") return "OVERDUE";
  if (normalized === "CANCELLED") return "CANCELLED";
  if (normalized === "UNPAID" || normalized === "PENDING") return "UNPAID";
  return normalized;
}

function toSalesOrder(dto: SalesOrderResponseDTO): SalesOrder {
  const dtoAny = dto as SalesOrderResponseDTO & {
    invoiceStatus?: string;
    payment_status?: string;
    paymentState?: string;
    statusPayment?: string;
  };
  const rawPaymentStatus =
    dto.paymentStatus ||
    dtoAny.invoiceStatus ||
    dtoAny.payment_status ||
    dtoAny.paymentState ||
    dtoAny.statusPayment;

  const items: SalesOrderItem[] = (dto.items || []).map((li, idx) => ({
    id: `soi-${dto.id}-${idx}`,
    orderId: String(dto.id),
    itemId: li.itemId || 0,
    itemName: li.itemName,
    warehouseId: li.warehouseId,
    warehouseName: li.warehouseName,
    quantity: Number(li.quantity || 0),
    unitPrice: Number(li.unitPrice || 0),
    lineSubtotal: Number(li.lineSubtotal || 0),
    discountPercent: Number(li.discountPercent || 0),
    taxRate: Number(li.taxRate || 0),
    taxAmount: Number(li.taxAmount || 0),
    discount: Number(li.discountPercent || 0),
    tax: Number(li.taxAmount || 0),
    total: Number(li.lineTotal || 0),
  }));

  const subtotal = Number(dto.subtotalAmount || 0);
  const discount = Number(dto.discountAmount || 0);
  const tax = Number(dto.taxAmount || 0);
  const total = Number(dto.totalAmount || subtotal + tax);

  return {
    id: String(dto.id),
    orderNo: dto.orderNumber || `SO-${dto.id}`,
    customerId: String(dto.customerId || ""),
    customerName: dto.customerName || "",
    customerEmail: dto.customerEmail || "",
    customerPhone: dto.customerPhone || "",
    orderDate: dto.orderDate || "",
    invoiceDueDate: dto.invoiceDueDate || "",
    requiredDate: undefined,
    status: (normalizeStatus(dto.status) as any) || "draft",
    paymentStatus: normalizePaymentStatus(rawPaymentStatus),
    items,
    subtotal,
    tax,
    discount,
    subtotalAmount: subtotal,
    discountAmount: discount,
    taxAmount: tax,
    total,
    bankAccountId: dto.bankAccountId,
    bankAccountName: dto.bankAccountName,
    debitAccountId: dto.debitAccountId,
    debitAccountName: dto.debitAccountName,
    creditAccountId: dto.creditAccountId,
    creditAccountName: dto.creditAccountName,
    shippingAddress: dto.shippingAddress || dto.deliveryAddress || undefined,
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
    warehouseId: dto.warehouseId ? String(dto.warehouseId) : "",
    warehouse: dto.warehouse,
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
  // Map backend status -> UI dispatch statuses.
  const s = normalizeStatus(dto.status);
  const status =
    s === "delivered"
      ? "delivered"
      : s === "in_transit"
        ? "in_transit"
        : s === "out_for_delivery"
          ? "out_for_delivery"
          : s === "failed_delivery"
            ? "failed_delivery"
            : s === "dispatched"
              ? "dispatched"
              : s === "cancelled"
                ? "cancelled"
                : "created"; // Default to "created"

  const trackingEvents: DispatchTrackingEvent[] = (dto.trackingEvents || []).map(
    (event: ShipmentTrackingEventDTO) => ({
      id: event.id ? String(event.id) : undefined,
      status: (normalizeStatus(event.status) as DispatchTrackingEvent["status"]) || status,
      location: event.location || undefined,
      notes: event.notes || undefined,
      eventAt: event.eventAt || undefined,
    }),
  );

  return {
    id: String(dto.id),
    dispatchNo: dto.shipmentNumber || `SHP-${dto.id}`,
    orderId: "", // Will be derived from picklist in attachOrderAndItems function
    picklistId: String(dto.picklistId || ""),
    status,
    vehicleId: undefined,
    vehicleNumber: dto.vehicleNumber || undefined,
    driverName: dto.driverName || undefined,
    driverPhone: dto.driverPhone || undefined,
    estimatedDeliveryDate: dto.estimatedDeliveryDate || undefined,
    actualDeliveryDate: dto.deliveredAt || undefined,
    deliveryAddress: dto.deliveryAddress || "",
    carrierName: dto.carrierName || undefined,
    trackingNumber: dto.trackingNumber || undefined,
    notes: dto.notes || undefined,
    createdBy: undefined,
    createdAt: dto.createdAt || dto.dispatchedAt || dto.deliveredAt || "",
    updatedAt: undefined,
    inTransitAt: dto.inTransitAt || undefined,
    outForDeliveryAt: dto.outForDeliveryAt || undefined,
    failedDeliveryAt: dto.failedDeliveryAt || undefined,
    trackingEvents,
  };
}

// --- Sales Orders ---
export async function listSalesOrders(): Promise<SalesOrder[]> {
  const res = await apiClient.get<SalesOrderResponseDTO[]>("/sales/orders");
  return (res.data || []).map(toSalesOrder);
}

export async function getSalesOrderById(id: Id | string): Promise<SalesOrder> {
  const res = await apiClient.get<SalesOrderResponseDTO>(`/sales/orders/${id}`);
  return toSalesOrder(res.data);
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

export async function updateShipmentDetails(
  id: Id | string,
  payload: ShipmentCreateDTO,
) {
  const res = await apiClient.put<ShipmentResponseDTO>(
    `/warehouse/shipments/${id}`,
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

export async function markShipmentOutForDelivery(id: Id | string) {
  const res = await apiClient.post<ShipmentResponseDTO>(
    `/warehouse/shipments/${id}/out-for-delivery`,
  );
  return toShipmentAsDispatch(res.data);
}

export async function markShipmentFailedDelivery(id: Id | string, notes?: string) {
  const res = await apiClient.post<ShipmentResponseDTO>(
    `/warehouse/shipments/${id}/failed-delivery`,
    notes ? { notes } : undefined,
  );
  return toShipmentAsDispatch(res.data);
}

export async function cancelShipment(id: Id | string) {
  const res = await apiClient.post<ShipmentResponseDTO>(
    `/warehouse/shipments/${id}/cancel`,
  );
  return toShipmentAsDispatch(res.data);
}

export async function addShipmentTrackingEvent(
  id: Id | string,
  payload: ShipmentTrackingEventCreateDTO,
) {
  const res = await apiClient.post<ShipmentResponseDTO>(
    `/warehouse/shipments/${id}/tracking-events`,
    payload,
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
    const order = orderId ? orderById.get(orderId) : undefined;
    return {
      ...d,
      orderId,
      order,
      deliveryAddress: d.deliveryAddress || order?.shippingAddress || "",
    };
  });

  return { picklistsEnriched, dispatchesEnriched };
}
