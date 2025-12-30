import { apiClient } from "@/service/apiClient";
import type { PurchaseOrder, PurchaseOrderItem, PurchaseRequisition, PurchaseRequisitionItem } from "@/types/purchase";

function normalizeStatus(status?: string) {
  return (status || "").toLowerCase();
}

// Purchase Requisition DTOs
export interface PurchaseRequisitionCreateDTO {
  items: Array<{
    itemId: number;
    requestedQty: number;
    remarks?: string;
  }>;
}

export interface PurchaseRequisitionResponseDTO {
  id: number;
  requisitionNumber: string;
  status: string;
  createdAt: string;
  approvedAt?: string | null;
  items: Array<{
    itemId: number;
    requestedQty: number;
    remarks?: string;
  }>;
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

export interface PurchaseOrderResponseDTO {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: Array<{
    itemId: number;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }>;
  createdAt: string;
  createdById: number;
  createdByName: string;
}

function toPurchaseRequisition(dto: PurchaseRequisitionResponseDTO): PurchaseRequisition {
  const items: PurchaseRequisitionItem[] = (dto.items || []).map((li, idx) => ({
    id: `pri-${dto.id}-${idx}`,
    requisitionId: String(dto.id),
    itemId: String(li.itemId || ""),
    quantity: Number(li.requestedQty || 0),
    notes: li.remarks,
  }));

  return {
    id: String(dto.id),
    requisitionNo: dto.requisitionNumber || `PR-${dto.id}`,
    requestedBy: "", // API doesn't provide this
    requestedDate: dto.createdAt || "",
    status: (normalizeStatus(dto.status) as any) || "draft",
    items,
    approvedDate: dto.approvedAt || undefined,
    createdAt: dto.createdAt || "",
    updatedAt: dto.createdAt || "",
  };
}

function toPurchaseOrder(dto: PurchaseOrderResponseDTO): PurchaseOrder {
  const items: PurchaseOrderItem[] = (dto.items || []).map((li, idx) => ({
    id: `poi-${dto.id}-${idx}`,
    orderId: String(dto.id),
    itemId: String(li.itemId || ""),
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
    supplierId: String(dto.supplierId || ""),
    orderDate: dto.orderDate || "",
    status: (normalizeStatus(dto.status) as any) || "draft",
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
export async function listPurchaseRequisitions(): Promise<PurchaseRequisition[]> {
  const res = await apiClient.get<PurchaseRequisitionResponseDTO[]>("/purchase/requisitions");
  return (res.data || []).map(toPurchaseRequisition);
}

export async function createPurchaseRequisition(payload: PurchaseRequisitionCreateDTO) {
  const res = await apiClient.post<PurchaseRequisitionResponseDTO>("/purchase/requisitions", payload);
  return toPurchaseRequisition(res.data);
}

export async function submitPurchaseRequisition(id: string | number) {
  const res = await apiClient.post<PurchaseRequisitionResponseDTO>(`/purchase/requisitions/${id}/submit`);
  return toPurchaseRequisition(res.data);
}

export async function convertRequisitionToPO(id: string | number): Promise<PurchaseOrder> {
  // The convert-to-po endpoint should return a PurchaseOrderResponseDTO
  // But if it returns a PurchaseRequisitionResponseDTO, we'll handle that too
  try {
    const res = await apiClient.post<any>(`/purchase/requisitions/${id}/convert-to-po`);
    
    // Check if response is a PurchaseOrder (has orderNumber)
    if (res.data && ('orderNumber' in res.data || 'order_number' in res.data)) {
      return toPurchaseOrder(res.data as PurchaseOrderResponseDTO);
    }
    
    // If response is a PurchaseRequisition, the PO was created but not returned
    // Fetch all orders and find the one created from this requisition
    if (res.data && ('requisitionNumber' in res.data || 'requisition_number' in res.data)) {
      const requisition = toPurchaseRequisition(res.data as PurchaseRequisitionResponseDTO);
      // Wait a bit for the backend to process, then fetch orders
      await new Promise(resolve => setTimeout(resolve, 500));
      const orders = await listPurchaseOrders();
      const createdOrder = orders.find(o => o.requisitionId === requisition.id);
      if (createdOrder) {
        return createdOrder;
      }
      // If not found immediately, it might still be processing
      throw new Error("Purchase order is being created. Please check Purchase Orders page in a moment.");
    }
    
    throw new Error("Unexpected response format from convert-to-po endpoint");
  } catch (error: any) {
    // If it's already our custom error, re-throw it
    if (error.message && error.message.includes("Purchase order")) {
      throw error;
    }
    // Otherwise, wrap the error
    throw new Error(error?.response?.data?.message || error?.message || "Failed to convert requisition to purchase order");
  }
}

export async function approvePurchaseRequisition(id: string | number) {
  const res = await apiClient.post<PurchaseRequisitionResponseDTO>(`/purchase/requisitions/${id}/approve`);
  return toPurchaseRequisition(res.data);
}

// --- Purchase Orders ---
export async function listPurchaseOrders(): Promise<PurchaseOrder[]> {
  try {
    const res = await apiClient.get<PurchaseOrderResponseDTO[]>("/purchase/orders");
    return (res.data || []).map(toPurchaseOrder);
  } catch (error: any) {
    // Provide more context for routing errors
    if (error?.response?.status === 500) {
      const errorData = error.response.data;
      if (errorData?.message?.includes("No static resource") || 
          errorData?.error?.includes("No static resource")) {
        throw new Error("Purchase Orders API endpoint is not configured on the server. Please contact your administrator.");
      }
    }
    throw error;
  }
}

export async function getPurchaseOrder(id: string | number): Promise<PurchaseOrder> {
  const res = await apiClient.get<PurchaseOrderResponseDTO>(`/purchase/orders/${id}`);
  return toPurchaseOrder(res.data);
}

export async function createPurchaseOrder(payload: PurchaseOrderCreateDTO) {
  try {
    // Try with the standard payload first
    const res = await apiClient.post<PurchaseOrderResponseDTO>("/purchase/orders", payload);
    return toPurchaseOrder(res.data);
  } catch (error: any) {
    // Check for Jackson deserialization errors
    if (error?.response?.status === 500) {
      const errorData = error.response.data;
      
      // Check for "No static resource" error
      if (errorData?.message?.includes("No static resource") || 
          errorData?.error?.includes("No static resource")) {
        throw new Error("Purchase Orders API endpoint is not configured on the server. Please contact your administrator.");
      }
      
      // Check for Jackson deserialization error
      if (errorData?.message?.includes("Type definition error") || 
          errorData?.message?.includes("PurchaseOrderItemDTO")) {
        // Try alternative format: without lineTotal (backend might calculate it)
        console.warn("Jackson error detected, trying without lineTotal...");
        try {
          const payloadWithoutLineTotal = {
            ...payload,
            items: payload.items.map(item => ({
              itemId: item.itemId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              // Omit lineTotal - backend might calculate it
            })),
          };
          const res = await apiClient.post<PurchaseOrderResponseDTO>("/purchase/orders", payloadWithoutLineTotal);
          return toPurchaseOrder(res.data);
        } catch (retryError: any) {
          // If that also fails, throw the original error with helpful message
          throw new Error(
            `Backend DTO mismatch: The PurchaseOrderItemDTO structure doesn't match. ` +
            `Check backend DTO field names - they might need to be snake_case (item_id, unit_cost, line_total) ` +
            `or the DTO might be missing a default constructor. ` +
            `Original error: ${errorData?.message || errorData?.error || 'Unknown error'}`
          );
        }
      }
    }
    throw error;
  }
}

export async function updatePurchaseOrder(id: string | number, payload: Partial<PurchaseOrderCreateDTO>) {
  const res = await apiClient.put<PurchaseOrderResponseDTO>(`/purchase/orders/${id}`, payload);
  return toPurchaseOrder(res.data);
}

export async function confirmPurchaseOrder(id: string | number) {
  const res = await apiClient.post<PurchaseOrderResponseDTO>(`/purchase/orders/${id}/confirm`);
  return toPurchaseOrder(res.data);
}

export async function cancelPurchaseOrder(id: string | number) {
  const res = await apiClient.post<PurchaseOrderResponseDTO>(`/purchase/orders/${id}/cancel`);
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

function toGoodsReceipt(dto: GoodsReceiptResponseDTO, order?: PurchaseOrder): GoodsReceipt {
  const items: GoodsReceiptItem[] = (dto.items || []).map((li, idx) => {
    const orderItem = order?.items.find(oi => String(oi.itemId) === String(li.itemId));
    return {
      id: `gri-${dto.id}-${idx}`,
      receiptId: String(dto.id),
      orderItemId: orderItem?.id || `poi-${dto.purchaseOrderId}-${idx}`,
      orderItem: orderItem,
      itemId: String(li.itemId || ""),
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
  const res = await apiClient.post<GoodsReceiptResponseDTO>("/purchase/receipts", payload);
  // Optionally fetch the order to enrich the receipt
  let order: PurchaseOrder | undefined;
  try {
    order = await getPurchaseOrder(payload.purchaseOrderId);
  } catch (e) {
    console.warn("Could not fetch order for receipt:", e);
  }
  return toGoodsReceipt(res.data, order);
}

export async function getGoodsReceiptsByPurchaseOrder(poId: string | number): Promise<GoodsReceipt[]> {
  const res = await apiClient.get<GoodsReceiptResponseDTO[]>(`/purchase/receipts/purchase-order/${poId}`);
  // Optionally fetch the order to enrich receipts
  let order: PurchaseOrder | undefined;
  try {
    order = await getPurchaseOrder(poId);
  } catch (e) {
    console.warn("Could not fetch order for receipts:", e);
  }
  return (res.data || []).map(dto => toGoodsReceipt(dto, order));
}

