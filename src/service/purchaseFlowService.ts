import { apiClient } from "@/service/apiClient";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequisition,
  PurchaseRequisitionItem,
} from "@/types/purchase";

function normalizeStatus(status?: string) {
  return (status || "").toLowerCase();
}

// Purchase Requisition DTOs
export interface PurchaseRequisitionCreateDTO {
  debitAccountId: number;
  creditAccountId: number;
  preferredSupplierId: number;
  departmentId?: number;
  requestedByUserId?: number;
  items: Array<{
    itemId: number;
    requestedQty: number;
    remarks?: string;
    estimatedUnitCost?: number;
  }>;
}

export interface PurchaseRequisitionItemDTO {
  itemId: number;
  requestedQty: number;
  remarks?: string;
  estimatedUnitCost?: number;
}

export interface PurchaseRequisitionResponseDTO {
  id: number;
  requisitionNumber: string;
  status: string;
  createdAt: string;
  approvedAt?: string | null;
  convertedAt?: string | null;
  preferredSupplierId?: number;
  preferredSupplierName?: string;
  departmentId?: number;
  departmentName?: string;
  requestedById?: number;
  requestedByName?: string;
  createdPurchaseOrderId?: number | null;
  debitAccountId?: number | null;
  debitAccountName?: string | null;
  creditAccountId?: number | null;
  creditAccountName?: string | null;
  financeTransactionId?: number | null;
  items: PurchaseRequisitionItemDTO[];
}

// Purchase Order DTOs
export interface PurchaseOrderCreateDTO {
  supplierId: number;
  orderDate: string;
  items: Array<{
    itemId: number;
    quantity: number;
    unitCost: number;
    lineTotal?: number; // Optional - backend might calculate this
  }>;
}

export interface PurchaseOrderItemDTO {
  itemId: number;
  quantity: number;
  unitCost: number;
  lineTotal?: number; // Optional - backend might calculate this
}

export interface PurchaseOrderResponseDTO {
  id: number;
  orderNumber: string;
  sourceRequisitionId?: number | null;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: PurchaseOrderItemDTO[];
  createdAt: string;
  createdById: number;
  createdByName: string;
  /** From backend: false until vendor payable is confirmed in AP */
  vendorPaymentSettled?: boolean | null;
}

function toPurchaseRequisition(
  dto: PurchaseRequisitionResponseDTO,
): PurchaseRequisition {
  const items: PurchaseRequisitionItem[] = (dto.items || []).map((li, idx) => {
    const est =
      li.estimatedUnitCost != null && li.estimatedUnitCost !== undefined
        ? Number(li.estimatedUnitCost)
        : undefined;
    const qty = Number(li.requestedQty || 0);
    return {
      id: `pri-${dto.id}-${idx}`,
      requisitionId: String(dto.id),
      itemId: li.itemId,
      quantity: qty,
      notes: li.remarks,
      estimatedUnitCost: est,
      unitPrice: est,
      estimatedTotal: est != null ? est * qty : undefined,
      item: li,
    };
  });

  const st = normalizeStatus(dto.status) as PurchaseRequisition["status"];

  return {
    id: String(dto.id),
    requisitionNo: dto.requisitionNumber || `PR-${dto.id}`,
    requestedBy: dto.requestedById != null ? String(dto.requestedById) : "",
    requestedById:
      dto.requestedById != null ? String(dto.requestedById) : undefined,
    requestedByName: dto.requestedByName,
    department:
      dto.departmentName ||
      (dto.departmentId != null ? String(dto.departmentId) : undefined),
    departmentId:
      dto.departmentId != null ? String(dto.departmentId) : undefined,
    departmentName: dto.departmentName,
    preferredSupplierId:
      dto.preferredSupplierId != null
        ? String(dto.preferredSupplierId)
        : undefined,
    preferredSupplierName: dto.preferredSupplierName,
    requestedDate: dto.createdAt || "",
    status: st || "draft",
    items,
    approvedDate: dto.approvedAt || undefined,
    convertedAt: dto.convertedAt || undefined,
    createdPurchaseOrderId:
      dto.createdPurchaseOrderId != null
        ? String(dto.createdPurchaseOrderId)
        : undefined,
    debitAccountId:
      dto.debitAccountId != null ? String(dto.debitAccountId) : undefined,
    debitAccountName: dto.debitAccountName ?? undefined,
    creditAccountId:
      dto.creditAccountId != null ? String(dto.creditAccountId) : undefined,
    creditAccountName: dto.creditAccountName ?? undefined,
    financeTransactionId:
      dto.financeTransactionId != null
        ? String(dto.financeTransactionId)
        : undefined,
    createdAt: dto.createdAt || "",
    updatedAt: dto.createdAt || "",
  };
}

function toPurchaseOrder(dto: PurchaseOrderResponseDTO): PurchaseOrder {
  const items: PurchaseOrderItem[] = (dto.items || []).map((li, idx) => ({
    id: `poi-${dto.id}-${idx}`,
    orderId: String(dto.id),
    itemId: li.itemId,
    item: li,
    quantity: Number(li.quantity || 0),
    unitPrice: Number(li.unitCost || 0),
    discount: 0,
    tax: 0,
    total: Number(li.lineTotal || 0),
    lineTotal: Number(li.lineTotal || 0),
  }));

  const total = Number(dto.totalAmount || 0);

  return {
    id: String(dto.id),
    orderNo: dto.orderNumber || `PO-${dto.id}`,
    requisitionId:
      dto.sourceRequisitionId != null && dto.sourceRequisitionId !== undefined
        ? String(dto.sourceRequisitionId)
        : undefined,
    supplierId: String(dto.supplierId || ""),
    orderDate: dto.orderDate || "",
    status: (normalizeStatus(dto.status) as any) || "draft",
    vendorPaymentSettled:
      dto.vendorPaymentSettled === undefined || dto.vendorPaymentSettled === null
        ? true
        : Boolean(dto.vendorPaymentSettled),
    items,
    subtotal: total,
    tax: 0,
    discount: 0,
    total,
    orderedBy: String(dto.createdById || ""),
    orderedByName: dto.createdByName,
    createdAt: dto.createdAt || "",
    updatedAt: dto.createdAt || "",
  };
}

// --- Purchase Requisitions ---
export async function listPurchaseRequisitions(): Promise<
  PurchaseRequisition[]
> {
  const res = await apiClient.get<PurchaseRequisitionResponseDTO[]>(
    "/purchase/requisitions",
  );
  return (res.data || []).map(toPurchaseRequisition);
}

export async function getPurchaseRequisition(
  id: string | number,
): Promise<PurchaseRequisition> {
  try {
    const res = await apiClient.get<PurchaseRequisitionResponseDTO>(
      `/purchase/requisitions/${id}`,
    );
    return toPurchaseRequisition(res.data);
  } catch (e: unknown) {
    const ax = e as {
      response?: {
        status?: number;
        data?: { message?: string; detail?: string };
      };
    };
    const status = ax.response?.status;
    const body = ax.response?.data;
    const msg = String(body?.message ?? body?.detail ?? "");
    const treatAsMissing =
      status === 404 || (msg.length > 0 && /no static resource/i.test(msg));

    if (treatAsMissing) {
      const list = await listPurchaseRequisitions();
      const found = list.find((r) => String(r.id) === String(id));
      if (found) return found;
    }
    throw e;
  }
}

export async function createPurchaseRequisition(
  payload: PurchaseRequisitionCreateDTO,
) {
  const res = await apiClient.post<PurchaseRequisitionResponseDTO>(
    "/purchase/requisitions",
    payload,
  );
  return toPurchaseRequisition(res.data);
}

export async function submitPurchaseRequisition(id: string | number) {
  const res = await apiClient.post<PurchaseRequisitionResponseDTO>(
    `/purchase/requisitions/${id}/submit`,
  );
  return toPurchaseRequisition(res.data);
}

export async function approvePurchaseRequisition(id: string | number) {
  const res = await apiClient.post<PurchaseRequisitionResponseDTO>(
    `/purchase/requisitions/${id}/approve`,
  );
  return toPurchaseRequisition(res.data);
}

// --- Purchase Orders ---
export async function listPurchaseOrders(): Promise<PurchaseOrder[]> {
  try {
    const res =
      await apiClient.get<PurchaseOrderResponseDTO[]>("/purchase/orders");
    return (res.data || []).map(toPurchaseOrder);
  } catch (error: any) {
    // Provide more context for routing errors
    if (error?.response?.status === 500) {
      const errorData = error.response.data;
      if (
        errorData?.message?.includes("No static resource") ||
        errorData?.error?.includes("No static resource")
      ) {
        throw new Error(
          "Purchase Orders API endpoint is not configured on the server. Please contact your administrator.",
        );
      }
    }
    throw error;
  }
}

export async function getPurchaseOrder(
  id: string | number,
): Promise<PurchaseOrder> {
  const res = await apiClient.get<PurchaseOrderResponseDTO>(
    `/purchase/orders/${id}`,
  );
  return toPurchaseOrder(res.data);
}

export async function createPurchaseOrder(payload: PurchaseOrderCreateDTO) {
  try {
    // Try with the standard payload first
    const res = await apiClient.post<PurchaseOrderResponseDTO>(
      "/purchase/orders",
      payload,
    );
    return toPurchaseOrder(res.data);
  } catch (error: any) {
    // Check for Jackson deserialization errors
    if (error?.response?.status === 500) {
      const errorData = error.response.data;

      // Check for "No static resource" error
      if (
        errorData?.message?.includes("No static resource") ||
        errorData?.error?.includes("No static resource")
      ) {
        throw new Error(
          "Purchase Orders API endpoint is not configured on the server. Please contact your administrator.",
        );
      }

      // Check for Jackson deserialization error
      if (
        errorData?.message?.includes("Type definition error") ||
        errorData?.message?.includes("PurchaseOrderItemDTO")
      ) {
        // Try alternative format: without lineTotal (backend might calculate it)
        console.warn("Jackson error detected, trying without lineTotal...");
        try {
          const payloadWithoutLineTotal = {
            ...payload,
            items: payload.items.map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              // Omit lineTotal - backend might calculate it
            })),
          };
          const res = await apiClient.post<PurchaseOrderResponseDTO>(
            "/purchase/orders",
            payloadWithoutLineTotal,
          );
          return toPurchaseOrder(res.data);
        } catch (retryError: any) {
          // If that also fails, throw the original error with helpful message
          throw new Error(
            `Backend DTO mismatch: The PurchaseOrderItemDTO structure doesn't match. ` +
              `Check backend DTO field names - they might need to be snake_case (item_id, unit_cost, line_total) ` +
              `or the DTO might be missing a default constructor. ` +
              `Original error: ${errorData?.message || errorData?.error || "Unknown error"}`,
          );
        }
      }
    }
    throw error;
  }
}

export async function updatePurchaseOrder(
  id: string | number,
  payload: Partial<PurchaseOrderCreateDTO>,
) {
  const res = await apiClient.put<PurchaseOrderResponseDTO>(
    `/purchase/orders/${id}`,
    payload,
  );
  return toPurchaseOrder(res.data);
}

export async function confirmPurchaseOrder(id: string | number) {
  const res = await apiClient.post<PurchaseOrderResponseDTO>(
    `/purchase/orders/${id}/confirm`,
  );
  return toPurchaseOrder(res.data);
}

export async function cancelPurchaseOrder(id: string | number) {
  const res = await apiClient.post<PurchaseOrderResponseDTO>(
    `/purchase/orders/${id}/cancel`,
  );
  return toPurchaseOrder(res.data);
}

// --- Goods Receipt DTOs ---
export interface GoodsReceiptCreateDTO {
  purchaseOrderId: number;
  items: Array<{
    itemId: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    remarks?: string;
  }>;
}

export interface GoodsReceiptResponseDTO {
  id: number;
  purchaseOrderId: number;
  receivedAt: string;
  items: Array<{
    itemId: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    remarks?: string;
  }>;
}

import type { GoodsReceipt, GoodsReceiptItem } from "@/types/purchase";

function toGoodsReceipt(
  dto: GoodsReceiptResponseDTO,
  order?: PurchaseOrder,
): GoodsReceipt {
  const items: GoodsReceiptItem[] = (dto.items || []).map((li, idx) => {
    const orderItem = order?.items.find(
      (oi) => String(oi.itemId) === String(li.itemId),
    );
    return {
      id: `gri-${dto.id}-${idx}`,
      receiptId: String(dto.id),
      orderItemId: orderItem?.id || `poi-${dto.purchaseOrderId}-${idx}`,
      orderItem: orderItem,
      itemId: li.itemId,
      orderedQuantity: orderItem?.quantity || 0,
      receivedQuantity: Number(li.receivedQty || 0),
      acceptedQuantity: Number(li.acceptedQty || 0),
      rejectedQuantity: Number(li.rejectedQty || 0),
      qualityStatus: (li.rejectedQty > 0 ? "partial" : "passed") as any,
      warehouseId: orderItem?.warehouseId || "",
      notes: li.remarks,
    };
  });

  return {
    id: String(dto.id),
    receiptNo: `GR-${dto.id}`,
    orderId: String(dto.purchaseOrderId || ""),
    order: order,
    receiptDate: dto.receivedAt || "",
    status: "completed" as const,
    items,
    createdAt: dto.receivedAt || "",
    updatedAt: dto.receivedAt || "",
  };
}

// --- Goods Receipts ---
export async function createGoodsReceipt(payload: GoodsReceiptCreateDTO) {
  const res = await apiClient.post<GoodsReceiptResponseDTO>(
    "/purchase/receipts",
    payload,
  );
  // Optionally fetch the order to enrich the receipt
  let order: PurchaseOrder | undefined;
  try {
    order = await getPurchaseOrder(payload.purchaseOrderId);
  } catch (e) {
    console.warn("Could not fetch order for receipt:", e);
  }
  return toGoodsReceipt(res.data, order);
}

export async function getGoodsReceiptsByPurchaseOrder(
  poId: string | number,
): Promise<GoodsReceipt[]> {
  const res = await apiClient.get<GoodsReceiptResponseDTO[]>(
    `/purchase/receipts/purchase-order/${poId}`,
  );
  // Optionally fetch the order to enrich receipts
  let order: PurchaseOrder | undefined;
  try {
    order = await getPurchaseOrder(poId);
  } catch (e) {
    console.warn("Could not fetch order for receipts:", e);
  }
  return (res.data || []).map((dto) => toGoodsReceipt(dto, order));
}

export async function getGoodsReceiptById(
  receiptId: string | number,
): Promise<GoodsReceipt | null> {
  try {
    // Try direct endpoint first
    const res = await apiClient.get<GoodsReceiptResponseDTO>(
      `/purchase/receipts/${receiptId}`,
    );
    if (res.data) {
      // Fetch the order to enrich the receipt
      let order: PurchaseOrder | undefined;
      try {
        order = await getPurchaseOrder(res.data.purchaseOrderId);
      } catch (e) {
        console.warn("Could not fetch order for receipt:", e);
      }
      return toGoodsReceipt(res.data, order);
    }
    return null;
  } catch (e: any) {
    // If direct endpoint doesn't exist, search through orders
    console.warn(
      "Direct receipt endpoint not available, searching through orders...",
    );
    const orders = await listPurchaseOrders();

    for (const order of orders) {
      try {
        const receipts = await getGoodsReceiptsByPurchaseOrder(order.id);
        const receipt = receipts.find(
          (r) => String(r.id) === String(receiptId),
        );
        if (receipt) {
          return receipt;
        }
      } catch (err) {
        // Continue searching
        console.warn(`Error fetching receipts for order ${order.id}:`, err);
      }
    }

    return null;
  }
}
