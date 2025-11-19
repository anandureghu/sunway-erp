import type { Invoice } from "@/types/sales";

export const dummyInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNo: "INV-1001",
    customerName: "Karthik Traders",
    date: "2025-02-10",
    dueDate: "2025-02-25",
    status: "Paid",
    amount: 120000,
  },
  {
    id: "2",
    invoiceNo: "INV-1002",
    customerName: "Madhav Enterprises",
    date: "2025-02-12",
    dueDate: "2025-02-27",
    status: "Unpaid",
    amount: 89000,
  },
  {
    id: "3",
    invoiceNo: "INV-1003",
    customerName: "Green Valley Builders",
    date: "2025-02-14",
    dueDate: "2025-02-28",
    status: "Partially Paid",
    amount: 45000,
  },
  {
    id: "4",
    invoiceNo: "INV-1004",
    customerName: "Blue Horizon Pvt Ltd",
    date: "2025-02-15",
    dueDate: "2025-03-02",
    status: "Overdue",
    amount: 150000,
  },
  {
    id: "5",
    invoiceNo: "INV-1005",
    customerName: "Sundaram Agencies",
    date: "2025-02-18",
    dueDate: "2025-03-03",
    status: "Paid",
    amount: 76000,
  },
];
