import type { Invoice } from "@/types/sales";
import { invoices } from "./sales-data";

// Re-export invoices from sales-data for backward compatibility
export const dummyInvoices: Invoice[] = invoices;
