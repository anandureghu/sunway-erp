import type {
  Customer,
  SalesOrder,
  Picklist,
  PicklistItem,
  Dispatch,
  DeliveryTracking,
  Invoice,
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

// Using a mutable array for demo purposes - in production, this would be managed by state/API
export let salesOrders: SalesOrder[] = [];

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

export const invoices: Invoice[] = [];

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
  return invoices.find((inv) => inv.id.toString() === id);
};
