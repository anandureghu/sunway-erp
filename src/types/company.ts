export interface Company {
  id: number;
  companyName: string;
  noOfEmployees: number; // number of employees
  crNo: number; // CR NO (Commercial Registration)
  computerCard: string;
  street: string;
  city: string;
  state: string;
  country: string;
  phoneNo: string;
  companyEmail?: string | null;
  billingEmail?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  createdBy: string;
  hrEnabled: boolean;
  financeEnabled: boolean;
  inventoryEnabled: boolean;
  /** Whether the company punches in/out. When false, the header check-in widget is hidden. */
  requireCheckIn?: boolean;
  /** Company head (CEO / Chairperson) — the employee all department managers report to. */
  ceoEmployeeId?: number | null;
  ceoTitle?: string | null;
  currency?: Currency;
  companyCode: string;
  industry?: string | null;
  active?: boolean;
  /** Live count of ACTIVE employees, computed server-side. */
  employeeCount?: number;
  /** Storage usage, populated for SUPER_ADMIN only. */
  cloudStorageBytes?: number;
  databaseStorageBytes?: number;
  storageCalculatedAt?: string | null;
  /** Subscription total storage quota — cloud + database (bytes), SUPER_ADMIN storage card. */
  maxStorageBytes?: number;
  isTaxActive?: boolean;
  taxRate?: number;
  defaultSalesDebitAccountId?: number | null;
  defaultSalesCreditAccountId?: number | null;
  defaultPurchaseDebitAccountId?: number | null;
  defaultPurchaseCreditAccountId?: number | null;
  defaultBankAccountId?: number | null;
  invoiceHeaderSubtitle?: string | null;
  invoiceNotesUnpaid?: string | null;
  invoiceNotesPaid?: string | null;
  invoiceTerms?: string | null;
  invoiceFooterCompanyLine?: string | null;
  invoiceFooterTaxLine?: string | null;
  invoiceFooterSignatureNote?: string | null;
  invoiceFooterSupportEmail?: string | null;
  invoiceFooterBillingEmail?: string | null;
  invoiceQrEnabled?: boolean;
}

export type IModules = "hr" | "finance" | "inventory";

import type { LucideIcon } from "lucide-react";
import type { Currency } from "./currency";

export interface SidebarSubItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface SidebarItem {
  title: string;
  icon: LucideIcon;
  color: string;
  image: string;
  url: string;
  items: SidebarSubItem[];
}
