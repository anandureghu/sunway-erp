import { apiClient } from "@/service/apiClient";
import type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderPostingPreview,
  PurchaseRequisition,
  PurchaseRequisitionDocument,
  PurchaseRequisitionItem,
} from "@/types/purchase";

function normalizeStatus(status?: string) {
  return (status || "").toLowerCase();
}

// Purchase Requisition DTOs
export interface PurchaseRequisitionCreateDTO {
  debitAccountId: number;
  creditAccountId: number;
  preferredSupplierId?: number;
  supplierAddress?: string;
  departmentId?: number;
  requestedByUserId?: number;
  requestedDate?: string;
  requiredDeliveryDate: string;
  projectCode?: string;
  requisitionDescription: string;
  urgency?: "NORMAL" | "URGENT" | "CRITICAL";
  deliveryWarehouseId: number;
  justification: string;
  items: Array<{
    itemId: number;
    requestedQty: number;
    remarks?: string;
    /** Applied line rate; server recomputes from item cost + otherUnitCost. */
    estimatedUnitCost?: number;
    /** Optional override; when set, used instead of item cost price. */
    otherUnitCost?: number;
  }>;
}

export interface PurchaseRequisitionItemDTO {
  itemId: number;
  itemName?: string | null;
  requestedQty: number;
  remarks?: string;
  /** Snapshot of item cost price from master. */
  actualItemPrice?: number;
  otherUnitCost?: number;
  estimatedUnitCost?: number;
}

export interface PurchaseRequisitionDocumentDTO {
  id: number;
  fileName: string;
  contentType?: string | null;
  fileSizeBytes?: number | null;
  downloadUrl?: string | null;
  uploadedAt?: string | null;
  uploadedById?: number | null;
  uploadedByName?: string | null;
}

export interface PurchaseRequisitionResponseDTO {
  id: number;
  requisitionNumber: string;
  status: string;
  createdAt: string;
  approvedAt?: string | null;
  convertedAt?: string | null;
  preferredSupplierId?: number | null;
  preferredSupplierName?: string | null;
  supplierAddress?: string | null;
  departmentId?: number;
  departmentName?: string;
  requestedById?: number;
  requestedByName?: string;
  requestedDate?: string | null;
  requiredDeliveryDate?: string | null;
  projectCode?: string | null;
  requisitionDescription?: string | null;
  urgency?: string | null;
  deliveryWarehouseId?: number | null;
  deliveryWarehouseName?: string | null;
  justification?: string | null;
  rejectionReason?: string | null;
  reviewAction?: string | null;
  rejectedAt?: string | null;
  rejectedById?: number | null;
  rejectedByName?: string | null;
  createdPurchaseOrderId?: number | null;
  createdPurchaseOrderNumber?: string | null;
  debitAccountId?: number | null;
  debitAccountName?: string | null;
  creditAccountId?: number | null;
  creditAccountName?: string | null;
  financeTransactionId?: number | null;
  archived?: boolean;
  items: PurchaseRequisitionItemDTO[];
  documents?: PurchaseRequisitionDocumentDTO[];
}

function toPurchaseRequisitionDocument(
  dto: PurchaseRequisitionDocumentDTO,
): PurchaseRequisitionDocument {
  return {
    id: String(dto.id),
    fileName: dto.fileName,
    contentType: dto.contentType ?? undefined,
    fileSizeBytes:
      dto.fileSizeBytes != null ? Number(dto.fileSizeBytes) : undefined,
    downloadUrl: dto.downloadUrl ?? undefined,
    uploadedAt: dto.uploadedAt ?? undefined,
    uploadedById:
      dto.uploadedById != null ? String(dto.uploadedById) : undefined,
    uploadedByName: dto.uploadedByName ?? undefined,
  };
}

// Purchase Order DTOs
export interface PurchaseOrderCreateDTO {
  supplierId: number;
  orderDate: string;
  items: Array<{
    itemId: number;
    quantity: number;
    unitCost: number;
    otherUnitCost?: number;
    lineTotal?: number;
  }>;
}

export interface PurchaseOrderItemDTO {
  itemId: number;
  itemName?: string | null;
  quantity: number;
  actualItemPrice?: number;
  otherUnitCost?: number;
  unitCost: number;
  lineTotal?: number;
}

export interface PurchaseOrderResponseDTO {
  id: number;
  orderNumber: string;
  sourceRequisitionId?: number | null;
  sourceRequisitionNumber?: string | null;
  supplierId?: number | null;
  supplierName?: string | null;
  orderDate: string;
  status: string;
  archived?: boolean;
  totalAmount: number;
  items: PurchaseOrderItemDTO[];
  createdAt: string;
  createdById: number;
  createdByName: string;
  vendorPaymentSettled?: boolean | null;
  purchaseInvoiceId?: number | null;
  vendorPaymentId?: number | null;
}

function toPurchaseRequisition(
  dto: PurchaseRequisitionResponseDTO,
): PurchaseRequisition {
  const items: PurchaseRequisitionItem[] = (dto.items || []).map((li, idx) => {
    const est =
      li.estimatedUnitCost != null && li.estimatedUnitCost !== undefined
        ? Number(li.estimatedUnitCost)
        : undefined;
    const actualSnap =
      li.actualItemPrice != null && li.actualItemPrice !== undefined
        ? Number(li.actualItemPrice)
        : undefined;
    const other =
      li.otherUnitCost != null && li.otherUnitCost !== undefined
        ? Number(li.otherUnitCost)
        : undefined;
    const qty = Number(li.requestedQty || 0);
    return {
      id: `pri-${dto.id}-${idx}`,
      requisitionId: String(dto.id),
      itemId: li.itemId,
      itemName: li.itemName ?? undefined,
      quantity: qty,
      notes: li.remarks,
      actualItemPrice: actualSnap,
      otherUnitCost: other,
      estimatedUnitCost: est,
      unitPrice: est,
      estimatedTotal: est != null ? est * qty : undefined,
      item: li,
    };
  });

  const rawStatus = normalizeStatus(dto.status);
  const st = (
    rawStatus === "approved" ? "converted" : rawStatus
  ) as PurchaseRequisition["status"];

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
    preferredSupplierName: dto.preferredSupplierName ?? undefined,
    supplierAddress: dto.supplierAddress || undefined,
    requestedDate: dto.requestedDate || dto.createdAt || "",
    requiredDeliveryDate: dto.requiredDeliveryDate || undefined,
    requiredDate: dto.requiredDeliveryDate || undefined,
    projectCode: dto.projectCode ?? undefined,
    requisitionDescription: dto.requisitionDescription ?? undefined,
    urgency: dto.urgency
      ? (dto.urgency.toLowerCase() as PurchaseRequisition["urgency"])
      : undefined,
    deliveryWarehouseId:
      dto.deliveryWarehouseId != null
        ? String(dto.deliveryWarehouseId)
        : undefined,
    deliveryWarehouseName: dto.deliveryWarehouseName ?? undefined,
    justification: dto.justification ?? undefined,
    rejectionReason: dto.rejectionReason ?? undefined,
    reviewAction: dto.reviewAction
      ? (dto.reviewAction.toLowerCase() as PurchaseRequisition["reviewAction"])
      : undefined,
    rejectedAt: dto.rejectedAt ?? undefined,
    rejectedById:
      dto.rejectedById != null ? String(dto.rejectedById) : undefined,
    rejectedByName: dto.rejectedByName ?? undefined,
    status: st || "draft",
    items,
    approvedDate: dto.approvedAt || undefined,
    convertedAt: dto.convertedAt || undefined,
    archived: Boolean(dto.archived),
    createdPurchaseOrderId:
      dto.createdPurchaseOrderId != null
        ? String(dto.createdPurchaseOrderId)
        : undefined,
    createdPurchaseOrderNumber: dto.createdPurchaseOrderNumber || undefined,
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
    documents: (dto.documents || []).map(toPurchaseRequisitionDocument),
    createdAt: dto.createdAt || "",
    updatedAt: dto.createdAt || "",
  };
}

function toPurchaseOrder(dto: PurchaseOrderResponseDTO): PurchaseOrder {
  const items: PurchaseOrderItem[] = (dto.items || []).map((li, idx) => ({
    id: `poi-${dto.id}-${idx}`,
    orderId: String(dto.id),
    itemId: li.itemId,
    itemName: li.itemName ?? undefined,
    item: li,
    quantity: Number(li.quantity || 0),
    actualItemPrice:
      li.actualItemPrice != null && li.actualItemPrice !== undefined
        ? Number(li.actualItemPrice)
        : undefined,
    otherUnitCost:
      li.otherUnitCost != null && li.otherUnitCost !== undefined
        ? Number(li.otherUnitCost)
        : undefined,
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
    requisitionNo: dto.sourceRequisitionNumber || undefined,
    supplierId:
      dto.supplierId != null && dto.supplierId !== undefined
        ? String(dto.supplierId)
        : "",
    orderDate: dto.orderDate || "",
    status: (normalizeStatus(dto.status) as any) || "draft",
    archived: Boolean(dto.archived),
    vendorPaymentSettled: Boolean(dto.vendorPaymentSettled),
    purchaseInvoiceId: dto.purchaseInvoiceId ?? undefined,
    vendorPaymentId: dto.vendorPaymentId ?? undefined,
    items,
    subtotal: total,
    tax: 0,
    discount: 0,
    total,
    orderedBy: String(dto.createdById || ""),
    orderedByName: dto.createdByName,
    supplierName: dto.supplierName ?? undefined,
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

export async function archivePurchaseRequisition(
  id: string,
): Promise<PurchaseRequisition> {
  const res = await apiClient.post<PurchaseRequisitionResponseDTO>(
    `/purchase/requisitions/${id}/archive`,
  );
  return toPurchaseRequisition(res.data);
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

export async function rejectPurchaseRequisition(
  id: string | number,
  comments: string,
) {
  const res = await apiClient.post<PurchaseRequisitionResponseDTO>(
    `/purchase/requisitions/${id}/reject`,
    { action: "REJECT", comments },
  );
  return toPurchaseRequisition(res.data);
}

export async function sendBackPurchaseRequisition(
  id: string | number,
  comments: string,
) {
  const res = await apiClient.post<PurchaseRequisitionResponseDTO>(
    `/purchase/requisitions/${id}/send-back`,
    { action: "SEND_BACK", comments },
  );
  return toPurchaseRequisition(res.data);
}

export async function revisePurchaseRequisition(id: string | number) {
  const res = await apiClient.post<PurchaseRequisitionResponseDTO>(
    `/purchase/requisitions/${id}/revise`,
  );
  return toPurchaseRequisition(res.data);
}

export async function updatePurchaseRequisition(
  id: string | number,
  payload: PurchaseRequisitionCreateDTO,
) {
  const res = await apiClient.put<PurchaseRequisitionResponseDTO>(
    `/purchase/requisitions/${id}`,
    payload,
  );
  return toPurchaseRequisition(res.data);
}

export async function uploadPurchaseRequisitionDocument(
  requisitionId: string | number,
  file: File,
): Promise<PurchaseRequisitionDocument> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<PurchaseRequisitionDocumentDTO>(
    `/purchase/requisitions/${requisitionId}/documents`,
    formData,
  );
  return toPurchaseRequisitionDocument(res.data);
}

export async function listPurchaseRequisitionDocuments(
  requisitionId: string | number,
): Promise<PurchaseRequisitionDocument[]> {
  const res = await apiClient.get<PurchaseRequisitionDocumentDTO[]>(
    `/purchase/requisitions/${requisitionId}/documents`,
  );
  return (res.data || []).map(toPurchaseRequisitionDocument);
}

export async function deletePurchaseRequisitionDocument(
  requisitionId: string | number,
  documentId: string | number,
): Promise<void> {
  await apiClient.delete(
    `/purchase/requisitions/${requisitionId}/documents/${documentId}`,
  );
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

export async function assignPurchaseOrderSupplier(
  id: string | number,
  supplierId: number,
) {
  const res = await apiClient.post<PurchaseOrderResponseDTO>(
    `/purchase/orders/${id}/supplier`,
    { supplierId },
  );
  return toPurchaseOrder(res.data);
}

export interface PurchaseOrderPostingPreviewDTO {
  action: string;
  amount: number;
  debitAccountId?: number | null;
  debitAccountCode?: string | null;
  debitAccountName?: string | null;
  debitBalanceBefore?: number | null;
  debitBalanceAfter?: number | null;
  creditAccountId?: number | null;
  creditAccountCode?: string | null;
  creditAccountName?: string | null;
  creditBalanceBefore?: number | null;
  creditBalanceAfter?: number | null;
  sufficientFunds: boolean;
  insufficientFundsMessage?: string | null;
  fundsAlreadyCommitted?: boolean | null;
  willReleaseCommittedFunds?: boolean | null;
  summary?: string | null;
}

function toPostingPreview(
  dto: PurchaseOrderPostingPreviewDTO,
): PurchaseOrderPostingPreview {
  const action = dto.action === "cancel" ? "cancel" : "release";
  return {
    action,
    amount: Number(dto.amount ?? 0),
    debitAccountId: dto.debitAccountId ?? undefined,
    debitAccountCode: dto.debitAccountCode ?? undefined,
    debitAccountName: dto.debitAccountName ?? undefined,
    debitBalanceBefore:
      dto.debitBalanceBefore != null ? Number(dto.debitBalanceBefore) : undefined,
    debitBalanceAfter:
      dto.debitBalanceAfter != null ? Number(dto.debitBalanceAfter) : undefined,
    creditAccountId: dto.creditAccountId ?? undefined,
    creditAccountCode: dto.creditAccountCode ?? undefined,
    creditAccountName: dto.creditAccountName ?? undefined,
    creditBalanceBefore:
      dto.creditBalanceBefore != null ? Number(dto.creditBalanceBefore) : undefined,
    creditBalanceAfter:
      dto.creditBalanceAfter != null ? Number(dto.creditBalanceAfter) : undefined,
    sufficientFunds: Boolean(dto.sufficientFunds),
    insufficientFundsMessage: dto.insufficientFundsMessage ?? undefined,
    fundsAlreadyCommitted: dto.fundsAlreadyCommitted ?? undefined,
    willReleaseCommittedFunds: dto.willReleaseCommittedFunds ?? undefined,
    summary: dto.summary ?? undefined,
  };
}

export async function getPurchaseOrderPostingPreview(
  id: string | number,
  action: "release" | "cancel",
) {
  const res = await apiClient.get<PurchaseOrderPostingPreviewDTO>(
    `/purchase/orders/${id}/posting-preview`,
    { params: { action } },
  );
  return toPostingPreview(res.data);
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

export async function archivePurchaseOrder(id: string | number) {
  const res = await apiClient.post<PurchaseOrderResponseDTO>(
    `/purchase/orders/${id}/archive`,
  );
  return toPurchaseOrder(res.data);
}

// --- Goods Receipt DTOs ---
export interface GoodsReceiptCreateDTO {
  purchaseOrderId: number;
  items: Array<{
    itemId: number;
    warehouseId: number;
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
  documentPdfUrl?: string | null;
  items: Array<{
    itemId: number;
    warehouseId?: number;
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
      item: orderItem
        ? {
            id: orderItem.itemId,
            name:
              orderItem.itemName ??
              orderItem.item?.itemName ??
              undefined,
          }
        : undefined,
      orderedQuantity: orderItem?.quantity || 0,
      receivedQuantity: Number(li.receivedQty || 0),
      acceptedQuantity: Number(li.acceptedQty || 0),
      rejectedQuantity: Number(li.rejectedQty || 0),
      qualityStatus: (li.rejectedQty > 0 ? "partial" : "passed") as any,
      warehouseId:
        li.warehouseId != null && li.warehouseId !== undefined
          ? String(li.warehouseId)
          : orderItem?.warehouseId || "",
      notes: li.remarks,
    };
  });

  return {
    id: String(dto.id),
    receiptNo: `GR-${dto.id}`,
    orderId: String(dto.purchaseOrderId || ""),
    order: order,
    receiptDate: dto.receivedAt || "",
    documentPdfUrl: dto.documentPdfUrl ?? null,
    status: "completed" as const,
    items,
    createdAt: dto.receivedAt || "",
    updatedAt: dto.receivedAt || "",
  };
}

export async function getGoodsReceiptPdfUrl(
  receiptId: string | number,
): Promise<string> {
  const res = await apiClient.get<string>(
    `/purchase/receipts/${receiptId}/pdf`,
  );
  const data = res.data;
  if (typeof data === "string") {
    return data.replace(/^"|"$/g, "").trim();
  }
  return String(data ?? "").trim();
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

export async function listGoodsReceipts(
  orders?: PurchaseOrder[],
): Promise<GoodsReceipt[]> {
  const res = await apiClient.get<GoodsReceiptResponseDTO[]>("/purchase/receipts");
  const orderById = new Map(
    (orders ?? []).map((order) => [String(order.id), order]),
  );
  return (res.data || []).map((dto) => {
    const order = orderById.get(String(dto.purchaseOrderId));
    return toGoodsReceipt(dto, order);
  });
}

export async function getGoodsReceiptsByPurchaseOrder(
  poId: string | number,
  order?: PurchaseOrder,
): Promise<GoodsReceipt[]> {
  const res = await apiClient.get<GoodsReceiptResponseDTO[]>(
    `/purchase/receipts/purchase-order/${poId}`,
  );
  let enrichedOrder = order;
  if (!enrichedOrder) {
    try {
      enrichedOrder = await getPurchaseOrder(poId);
    } catch (e) {
      console.warn("Could not fetch order for receipts:", e);
    }
  }
  return (res.data || []).map((dto) => toGoodsReceipt(dto, enrichedOrder));
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
