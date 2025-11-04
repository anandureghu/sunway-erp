export type Invoice = {
  id: string;
  invoiceNo: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: "Paid" | "Unpaid" | "Overdue" | "Partially Paid";
  amount: number;
};
