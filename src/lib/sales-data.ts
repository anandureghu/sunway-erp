import type {
  Customer,
  SalesOrder,
  SalesOrderItem,
  Picklist,
  PicklistItem,
  Dispatch,
  DeliveryTracking,
  Invoice,
  InvoiceItem,
} from "@/types/sales";
import { items, warehouses } from "./inventory-data";

// Mock Customers
export const customers: Customer[] = [
  {
    id: "cust-1",
    code: "CUST001",
    name: "Karthik Traders",
    contactPerson: "Karthik Kumar",
    email: "karthik@traders.com",
    phone: "+91 98765 43210",
    address: "123 Main Street",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    postalCode: "600001",
    taxId: "GSTIN123456789",
    creditLimit: 500000,
    paymentTerms: "Net 30",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "cust-2",
    code: "CUST002",
    name: "Madhav Enterprises",
    contactPerson: "Madhav Sharma",
    email: "madhav@enterprises.com",
    phone: "+91 98765 43211",
    address: "456 Business Avenue",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postalCode: "400001",
    taxId: "GSTIN987654321",
    creditLimit: 750000,
    paymentTerms: "Net 45",
    status: "active",
    createdAt: "2024-01-20T10:00:00Z",
  },
  {
    id: "cust-3",
    code: "CUST003",
    name: "Green Valley Builders",
    contactPerson: "Ravi Patel",
    email: "ravi@greenvalley.com",
    phone: "+91 98765 43212",
    address: "789 Construction Road",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    postalCode: "380001",
    taxId: "GSTIN456789123",
    creditLimit: 1000000,
    paymentTerms: "Net 30",
    status: "active",
    createdAt: "2024-02-01T10:00:00Z",
  },
  {
    id: "cust-4",
    code: "CUST004",
    name: "Blue Horizon Pvt Ltd",
    contactPerson: "Priya Singh",
    email: "priya@bluehorizon.com",
    phone: "+91 98765 43213",
    address: "321 Corporate Plaza",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    postalCode: "110001",
    taxId: "GSTIN789123456",
    creditLimit: 2000000,
    paymentTerms: "Net 60",
    status: "active",
    createdAt: "2024-02-05T10:00:00Z",
  },
  {
    id: "cust-5",
    code: "CUST005",
    name: "Sundaram Agencies",
    contactPerson: "Sundaram Iyer",
    email: "sundaram@agencies.com",
    phone: "+91 98765 43214",
    address: "654 Trade Center",
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    postalCode: "560001",
    taxId: "GSTIN321654987",
    creditLimit: 300000,
    paymentTerms: "Net 15",
    status: "active",
    createdAt: "2024-02-10T10:00:00Z",
  },
];

// Helper function to get customer by ID
export const getCustomerById = (id: string): Customer | undefined => {
  return customers.find((c) => c.id === id);
};

// Mock Sales Orders
const salesOrderItems1: SalesOrderItem[] = [
  {
    id: "soi-1",
    orderId: "so-1",
    itemId: items[0].id,
    item: items[0],
    quantity: 100,
    unitPrice: 1200,
    discount: 5,
    tax: 18,
    total: 120000,
    warehouseId: warehouses[0].id,
    reservedQuantity: 100,
  },
  {
    id: "soi-2",
    orderId: "so-1",
    itemId: items[1].id,
    item: items[1],
    quantity: 50,
    unitPrice: 890,
    discount: 0,
    tax: 18,
    total: 44500,
    warehouseId: warehouses[0].id,
    reservedQuantity: 50,
  },
];

const salesOrderItems2: SalesOrderItem[] = [
  {
    id: "soi-3",
    orderId: "so-2",
    itemId: items[2].id,
    item: items[2],
    quantity: 200,
    unitPrice: 450,
    discount: 10,
    tax: 18,
    total: 81000,
    warehouseId: warehouses[0].id,
    reservedQuantity: 200,
  },
];

// Using a mutable array for demo purposes - in production, this would be managed by state/API
export let salesOrders: SalesOrder[] = [
  {
    id: "so-1",
    orderNo: "SO-2024-001",
    customerId: customers[0].id,
    customer: customers[0],
    orderDate: "2025-02-10",
    requiredDate: "2025-02-25",
    status: "confirmed",
    items: salesOrderItems1,
    subtotal: 164500,
    tax: 29610,
    discount: 8225,
    total: 185885,
    shippingAddress: "123 Main Street, Chennai, Tamil Nadu 600001",
    notes: "Handle with care",
    salesPerson: "John Doe",
    createdBy: "user-1",
    createdAt: "2025-02-10T09:00:00Z",
    updatedAt: "2025-02-10T09:00:00Z",
  },
  {
    id: "so-2",
    orderNo: "SO-2024-002",
    customerId: customers[1].id,
    customer: customers[1],
    orderDate: "2025-02-12",
    requiredDate: "2025-02-27",
    status: "draft",
    items: salesOrderItems2,
    subtotal: 90000,
    tax: 16200,
    discount: 9000,
    total: 97200,
    shippingAddress: "456 Business Avenue, Mumbai, Maharashtra 400001",
    salesPerson: "Jane Smith",
    createdBy: "user-2",
    createdAt: "2025-02-12T10:00:00Z",
    updatedAt: "2025-02-12T10:00:00Z",
  },
  {
    id: "so-3",
    orderNo: "SO-2024-003",
    customerId: customers[2].id,
    customer: customers[2],
    orderDate: "2025-02-14",
    requiredDate: "2025-02-28",
    status: "picked",
    items: [
      {
        id: "soi-4",
        orderId: "so-3",
        itemId: items[3].id,
        item: items[3],
        quantity: 75,
        unitPrice: 600,
        discount: 5,
        tax: 18,
        total: 42750,
        warehouseId: warehouses[0].id,
        reservedQuantity: 75,
      },
    ],
    subtotal: 47500,
    tax: 8550,
    discount: 2375,
    total: 53675,
    shippingAddress: "789 Construction Road, Ahmedabad, Gujarat 380001",
    salesPerson: "John Doe",
    createdBy: "user-1",
    createdAt: "2025-02-14T11:00:00Z",
    updatedAt: "2025-02-14T11:00:00Z",
  },
];

// Mock Picklists
const picklistItems1: PicklistItem[] = [
  {
    id: "pli-1",
    picklistId: "pl-1",
    orderItemId: "soi-1",
    itemId: items[0].id,
    item: items[0],
    quantity: 100,
    pickedQuantity: 100,
    location: "A-1-2",
    batchNo: "BATCH001",
  },
  {
    id: "pli-2",
    picklistId: "pl-1",
    orderItemId: "soi-2",
    itemId: items[1].id,
    item: items[1],
    quantity: 50,
    pickedQuantity: 50,
    location: "B-3-4",
  },
];

export const picklists: Picklist[] = [
  {
    id: "pl-1",
    picklistNo: "PL-2024-001",
    orderId: "so-1",
    order: salesOrders[0],
    warehouseId: warehouses[0].id,
    warehouse: warehouses[0],
    status: "completed",
    items: picklistItems1,
    assignedTo: "picker-1",
    startTime: "2025-02-15T08:00:00Z",
    completedTime: "2025-02-15T10:30:00Z",
    createdAt: "2025-02-15T08:00:00Z",
    updatedAt: "2025-02-15T10:30:00Z",
  },
  {
    id: "pl-2",
    picklistNo: "PL-2024-002",
    orderId: "so-3",
    order: salesOrders[2],
    warehouseId: warehouses[0].id,
    warehouse: warehouses[0],
    status: "created",
    items: [
      {
        id: "pli-3",
        picklistId: "pl-2",
        orderItemId: "soi-4",
        itemId: items[3].id,
        item: items[3],
        quantity: 75,
        pickedQuantity: 60,
        location: "C-5-6",
      },
    ],
    assignedTo: "picker-2",
    startTime: "2025-02-16T09:00:00Z",
    createdAt: "2025-02-16T09:00:00Z",
    updatedAt: "2025-02-16T09:00:00Z",
  },
];

// Mock Dispatches
export const dispatches: Dispatch[] = [
  {
    id: "disp-1",
    dispatchNo: "DISP-2024-001",
    orderId: "so-1",
    order: salesOrders[0],
    picklistId: "pl-1",
    picklist: picklists[0],
    vehicleNumber: "TN-01-AB-1234",
    driverName: "Rajesh Kumar",
    driverPhone: "+91 98765 43220",
    status: "in_transit",
    estimatedDeliveryDate: "2025-02-20",
    deliveryAddress: "123 Main Street, Chennai, Tamil Nadu 600001",
    trackingNumber: "TRK123456789",
    notes: "Fragile items",
    createdBy: "user-1",
    createdAt: "2025-02-15T11:00:00Z",
    updatedAt: "2025-02-15T11:00:00Z",
  },
];

// Mock Delivery Tracking
export const deliveryTracking: DeliveryTracking[] = [
  {
    id: "dt-1",
    dispatchId: "disp-1",
    dispatch: dispatches[0],
    location: "Chennai Distribution Center",
    status: "in_transit",
    timestamp: "2025-02-16T14:00:00Z",
    notes: "In transit to customer location",
    createdAt: "2025-02-16T14:00:00Z",
  },
];

// Mock Invoices
const invoiceItems1: InvoiceItem[] = [
  {
    id: "ii-1",
    invoiceId: "inv-1",
    itemId: items[0].id,
    item: items[0],
    quantity: 100,
    unitPrice: 1200,
    discount: 5,
    tax: 18,
    total: 120000,
  },
  {
    id: "ii-2",
    invoiceId: "inv-1",
    itemId: items[1].id,
    item: items[1],
    quantity: 50,
    unitPrice: 890,
    discount: 0,
    tax: 18,
    total: 44500,
  },
];

export const invoices: Invoice[] = [
  {
    id: "inv-1",
    invoiceNo: "INV-1001",
    orderId: "so-1",
    order: salesOrders[0],
    customerId: customers[0].id,
    customer: customers[0],
    customerName: "Karthik Traders",
    date: "2025-02-10",
    dueDate: "2025-02-25",
    items: invoiceItems1,
    subtotal: 164500,
    tax: 29610,
    discount: 8225,
    total: 185885,
    paidAmount: 185885,
    status: "Paid",
    paymentTerms: "Net 30",
    notes: "Payment received",
    createdAt: "2025-02-10T10:00:00Z",
    updatedAt: "2025-02-10T10:00:00Z",
  },
  {
    id: "inv-2",
    invoiceNo: "INV-1002",
    orderId: "so-2",
    order: salesOrders[1],
    customerId: customers[1].id,
    customer: customers[1],
    customerName: "Madhav Enterprises",
    date: "2025-02-12",
    dueDate: "2025-02-27",
    items: [
      {
        id: "ii-3",
        invoiceId: "inv-2",
        itemId: items[2].id,
        item: items[2],
        quantity: 200,
        unitPrice: 450,
        discount: 10,
        tax: 18,
        total: 81000,
      },
    ],
    subtotal: 90000,
    tax: 16200,
    discount: 9000,
    total: 97200,
    paidAmount: 0,
    status: "Unpaid",
    paymentTerms: "Net 45",
    createdAt: "2025-02-12T11:00:00Z",
    updatedAt: "2025-02-12T11:00:00Z",
  },
  {
    id: "inv-3",
    invoiceNo: "INV-1003",
    orderId: "so-3",
    order: salesOrders[2],
    customerId: customers[2].id,
    customer: customers[2],
    customerName: "Green Valley Builders",
    date: "2025-02-14",
    dueDate: "2025-02-28",
    items: [
      {
        id: "ii-4",
        invoiceId: "inv-3",
        itemId: items[3].id,
        item: items[3],
        quantity: 75,
        unitPrice: 600,
        discount: 5,
        tax: 18,
        total: 42750,
      },
    ],
    subtotal: 47500,
    tax: 8550,
    discount: 2375,
    total: 53675,
    paidAmount: 25000,
    status: "Partially Paid",
    paymentTerms: "Net 30",
    createdAt: "2025-02-14T12:00:00Z",
    updatedAt: "2025-02-14T12:00:00Z",
  },
];

// Helper functions
export const getSalesOrderById = (id: string): SalesOrder | undefined => {
  return salesOrders.find((so) => so.id === id);
};

// Function to add a new sales order (for demo purposes)
export const addSalesOrder = (order: SalesOrder) => {
  salesOrders = [...salesOrders, order];
  return order;
};

export const getPicklistById = (id: string): Picklist | undefined => {
  return picklists.find((pl) => pl.id === id);
};

export const getDispatchById = (id: string): Dispatch | undefined => {
  return dispatches.find((d) => d.id === id);
};

export const getInvoiceById = (id: string): Invoice | undefined => {
  return invoices.find((inv) => inv.id === id);
};
