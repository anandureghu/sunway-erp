import type {
  Supplier,
  PurchaseRequisition,
  PurchaseRequisitionItem,
  PurchaseOrder,
  PurchaseOrderItem,
  GoodsReceipt,
  GoodsReceiptItem,
  PurchaseInvoice,
  PurchaseInvoiceItem,
} from "@/types/purchase";
import { items, warehouses } from "./inventory-data";

// Mock Suppliers (mutable for demo purposes)
export const suppliers: Supplier[] = [
  {
    id: "supp-1",
    code: "SUPP001",
    name: "Steel Works Industries",
    contactPerson: "Rajesh Kumar",
    email: "rajesh@steelworks.com",
    phone: "+91 98765 43250",
    address: "789 Industrial Road",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postalCode: "400070",
    taxId: "GSTIN112233445",
    paymentTerms: "Net 30",
    creditLimit: 1000000,
    rating: 4.5,
    status: "active",
    totalOrders: 45,
    onTimeDeliveryRate: 92,
    qualityScore: 4.3,
    averageDeliveryTime: 5,
    createdAt: "2024-01-10T10:00:00Z",
  },
  {
    id: "supp-2",
    code: "SUPP002",
    name: "Cement Suppliers Ltd",
    contactPerson: "Priya Singh",
    email: "priya@cementsuppliers.com",
    phone: "+91 98765 43251",
    address: "456 Construction Avenue",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    postalCode: "380001",
    taxId: "GSTIN998877665",
    paymentTerms: "Net 45",
    creditLimit: 800000,
    rating: 4.2,
    status: "active",
    totalOrders: 32,
    onTimeDeliveryRate: 88,
    qualityScore: 4.1,
    averageDeliveryTime: 7,
    createdAt: "2024-01-12T10:00:00Z",
  },
  {
    id: "supp-3",
    code: "SUPP003",
    name: "Hardware Distributors",
    contactPerson: "Amit Patel",
    email: "amit@hardware.com",
    phone: "+91 98765 43252",
    address: "321 Hardware Street",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    postalCode: "411001",
    taxId: "GSTIN554433221",
    paymentTerms: "Net 30",
    creditLimit: 600000,
    rating: 4.7,
    status: "active",
    totalOrders: 28,
    onTimeDeliveryRate: 95,
    qualityScore: 4.6,
    averageDeliveryTime: 4,
    createdAt: "2024-01-14T10:00:00Z",
  },
];

// Mock Purchase Requisitions
const requisitionItems1: PurchaseRequisitionItem[] = [
  {
    id: "pri-1",
    requisitionId: "pr-1",
    itemId: items[0].id,
    item: items[0],
    quantity: 200,
    unitPrice: 1200,
    estimatedTotal: 240000,
  },
  {
    id: "pri-2",
    requisitionId: "pr-1",
    itemId: items[1].id,
    item: items[1],
    quantity: 100,
    unitPrice: 890,
    estimatedTotal: 89000,
  },
];

// Using a mutable array for demo purposes
export const purchaseRequisitions: PurchaseRequisition[] = [
  {
    id: "pr-1",
    requisitionNo: "PR-2024-001",
    requestedBy: "user-1",
    requestedByName: "John Doe",
    department: "Construction",
    requestedDate: "2025-02-01",
    requiredDate: "2025-02-15",
    status: "approved",
    items: requisitionItems1,
    totalAmount: 329000,
    notes: "Urgent requirement for site work",
    approvedBy: "manager-1",
    approvedByName: "Jane Manager",
    approvedDate: "2025-02-02",
    createdAt: "2025-02-01T09:00:00Z",
    updatedAt: "2025-02-02T10:00:00Z",
  },
  {
    id: "pr-2",
    requisitionNo: "PR-2024-002",
    requestedBy: "user-2",
    requestedByName: "Alice Smith",
    department: "Maintenance",
    requestedDate: "2025-02-05",
    requiredDate: "2025-02-20",
    status: "pending",
    items: [
      {
        id: "pri-3",
        requisitionId: "pr-2",
        itemId: items[2].id,
        item: items[2],
        quantity: 150,
        estimatedTotal: 67500,
      },
    ],
    totalAmount: 67500,
    createdAt: "2025-02-05T10:00:00Z",
    updatedAt: "2025-02-05T10:00:00Z",
  },
];

// Mock Purchase Orders
const purchaseOrderItems1: PurchaseOrderItem[] = [];

// Using a mutable array for demo purposes
export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "po-1",
    orderNo: "PO-2024-001",
    requisitionId: "pr-1",
    requisition: purchaseRequisitions[0],
    supplierId: suppliers[0].id,
    supplier: suppliers[0],
    orderDate: "2025-02-03",
    expectedDate: "2025-02-18",
    status: "ordered",
    items: purchaseOrderItems1,
    subtotal: 317000,
    tax: 57060,
    discount: 15850,
    total: 358210,
    shippingAddress: "789 Industrial Road, Mumbai, Maharashtra 400070",
    notes: "Handle with care",
    orderedBy: "user-1",
    orderedByName: "John Doe",
    approvedBy: "manager-1",
    approvedByName: "Jane Manager",
    approvedDate: "2025-02-03",
    createdAt: "2025-02-03T09:00:00Z",
    updatedAt: "2025-02-03T09:00:00Z",
  },
  {
    id: "po-2",
    orderNo: "PO-2024-002",
    supplierId: suppliers[1].id,
    supplier: suppliers[1],
    orderDate: "2025-02-08",
    expectedDate: "2025-02-25",
    status: "approved",
    items: [],
    subtotal: 67500,
    tax: 12150,
    discount: 6750,
    total: 72900,
    shippingAddress: "456 Construction Avenue, Ahmedabad, Gujarat 380001",
    orderedBy: "user-2",
    orderedByName: "Alice Smith",
    createdAt: "2025-02-08T10:00:00Z",
    updatedAt: "2025-02-08T10:00:00Z",
  },
  {
    id: "po-3",
    orderNo: "PO-2024-003",
    supplierId: suppliers[2].id,
    supplier: suppliers[2],
    orderDate: "2025-02-10",
    expectedDate: "2025-02-28",
    status: "draft",
    items: [],
    subtotal: 48000,
    tax: 8640,
    discount: 2400,
    total: 54240,
    orderedBy: "user-3",
    orderedByName: "Bob Johnson",
    createdAt: "2025-02-10T11:00:00Z",
    updatedAt: "2025-02-10T11:00:00Z",
  },
];

// Mock Goods Receipts
const receiptItems1: GoodsReceiptItem[] = [
  {
    id: "gri-1",
    receiptId: "gr-1",
    orderItemId: "poi-1",
    orderItem: purchaseOrderItems1[0],
    itemId: items[0].id,
    item: items[0],
    orderedQuantity: 200,
    receivedQuantity: 200,
    acceptedQuantity: 195,
    rejectedQuantity: 5,
    qualityStatus: "partial",
    batchNo: "BATCH001",
    warehouseId: warehouses[0].id,
    warehouse: warehouses[0],
    notes: "5 units damaged in transit",
  },
  {
    id: "gri-2",
    receiptId: "gr-1",
    orderItemId: "poi-2",
    orderItem: purchaseOrderItems1[1],
    itemId: items[1].id,
    item: items[1],
    orderedQuantity: 100,
    receivedQuantity: 100,
    acceptedQuantity: 100,
    rejectedQuantity: 0,
    qualityStatus: "passed",
    warehouseId: warehouses[0].id,
    warehouse: warehouses[0],
  },
];

// Using a mutable array for demo purposes
export const goodsReceipts: GoodsReceipt[] = [
  {
    id: "gr-1",
    receiptNo: "GR-2024-001",
    orderId: "po-1",
    order: purchaseOrders[0],
    receiptDate: "2025-02-18",
    status: "completed",
    items: receiptItems1,
    receivedBy: "user-4",
    receivedByName: "Charlie Brown",
    inspectedBy: "user-5",
    inspectedByName: "David Wilson",
    inspectionDate: "2025-02-18",
    notes: "Partial quality issue noted",
    createdAt: "2025-02-18T08:00:00Z",
    updatedAt: "2025-02-18T10:00:00Z",
  },
];

// Mock Purchase Invoices
const invoiceItems1: PurchaseInvoiceItem[] = [
  {
    id: "pii-1",
    invoiceId: "inv-1",
    orderItemId: "poi-1",
    itemId: items[0].id,
    item: items[0],
    quantity: 200,
    unitPrice: 1200,
    discount: 5,
    tax: 18,
    total: 228000,
  },
  {
    id: "pii-2",
    invoiceId: "inv-1",
    orderItemId: "poi-2",
    itemId: items[1].id,
    item: items[1],
    quantity: 100,
    unitPrice: 890,
    discount: 0,
    tax: 18,
    total: 89000,
  },
];

export const purchaseInvoices: PurchaseInvoice[] = [
  {
    id: "inv-1",
    invoiceNo: "PINV-1001",
    orderId: "po-1",
    order: purchaseOrders[0],
    supplierId: suppliers[0].id,
    supplier: suppliers[0],
    supplierName: "Steel Works Industries",
    date: "2025-02-18",
    dueDate: "2025-03-20",
    items: invoiceItems1,
    subtotal: 317000,
    tax: 57060,
    discount: 15850,
    total: 358210,
    paidAmount: 358210,
    status: "paid",
    paymentTerms: "Net 30",
    notes: "Payment processed",
    createdAt: "2025-02-18T10:00:00Z",
    updatedAt: "2025-02-18T10:00:00Z",
  },
  {
    id: "inv-2",
    invoiceNo: "PINV-1002",
    orderId: "po-2",
    order: purchaseOrders[1],
    supplierId: suppliers[1].id,
    supplier: suppliers[1],
    supplierName: "Cement Suppliers Ltd",
    date: "2025-02-25",
    dueDate: "2025-04-11",
    items: [
      {
        id: "pii-3",
        invoiceId: "inv-2",
        orderItemId: "poi-3",
        itemId: items[2].id,
        item: items[2],
        quantity: 150,
        unitPrice: 450,
        discount: 10,
        tax: 18,
        total: 60750,
      },
    ],
    subtotal: 67500,
    tax: 12150,
    discount: 6750,
    total: 72900,
    paidAmount: 0,
    status: "pending",
    paymentTerms: "Net 45",
    createdAt: "2025-02-25T11:00:00Z",
    updatedAt: "2025-02-25T11:00:00Z",
  },
];

// Helper functions
export const getPurchaseOrderById = (id: string): PurchaseOrder | undefined => {
  return purchaseOrders.find((po) => po.id === id);
};

export const addPurchaseOrder = (order: PurchaseOrder) => {
  purchaseOrders = [...purchaseOrders, order];
  return order;
};

export const getSupplierById = (id: string): Supplier | undefined => {
  return suppliers.find((s) => s.id === id);
};

export const addSupplier = (supplier: Supplier) => {
  suppliers.push(supplier);
  return supplier;
};

export const getPurchaseRequisitionById = (
  id: string
): PurchaseRequisition | undefined => {
  return purchaseRequisitions.find((pr) => pr.id === id);
};

export const addPurchaseRequisition = (requisition: PurchaseRequisition) => {
  purchaseRequisitions.push(requisition);
  return requisition;
};

export const updatePurchaseRequisition = (
  id: string,
  updates: Partial<PurchaseRequisition>
) => {
  const index = purchaseRequisitions.findIndex((pr) => pr.id === id);
  if (index >= 0) {
    purchaseRequisitions[index] = {
      ...purchaseRequisitions[index],
      ...updates,
    };
    return purchaseRequisitions[index];
  }
  return undefined;
};

export const getGoodsReceiptById = (id: string): GoodsReceipt | undefined => {
  return goodsReceipts.find((gr) => gr.id === id);
};

export const addGoodsReceipt = (receipt: GoodsReceipt) => {
  goodsReceipts.push(receipt);
  return receipt;
};

export const getPurchaseInvoiceById = (
  id: string
): PurchaseInvoice | undefined => {
  return purchaseInvoices.find((inv) => inv.id === id);
};
