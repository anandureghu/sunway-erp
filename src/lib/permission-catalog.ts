import type { PermissionModuleRow } from "@/components/permission-matrix";

/**
 * Single source of truth for the permission trees of every module area.
 *
 * Each row is a real page / sub-module mapped to the backend AppModule `id`
 * that gates it (both in the UI via ModuleAccessGate and on the API via
 * @RequiresPermission / @PreAuthorize). `group` is the sub-module branch, so the
 * editor mirrors the sidebar: Area → sub-module → pages.
 *
 * Granting a row's View/Create/Edit/Delete therefore unlocks exactly that page.
 */

// ── HR ────────────────────────────────────────────────────────────────────────
export const HR_PERMISSION_MODULES: PermissionModuleRow[] = [
  // People
  { id: "EMPLOYEE_PROFILE", label: "Employee Profile", group: "People", description: "Employee records, profiles & contact info" },
  { id: "CURRENT_JOB", label: "Current Job", group: "People", description: "Job assignments, designations & transfers" },
  { id: "DEPENDENTS", label: "Dependents", group: "People", description: "Family & dependent records" },
  { id: "IMMIGRATION", label: "Immigration", group: "People", description: "Passports, visas & residence permits" },
  // Compensation
  { id: "SALARY", label: "Salary", group: "Compensation", description: "Salary structure & compensation records" },
  { id: "PAYROLL", label: "Payroll", group: "Compensation", description: "Generate payroll, payslips & bank exports" },
  { id: "LOANS", label: "Loans", group: "Compensation", description: "Employee loans & repayment schedules" },
  // Time & Performance
  { id: "LEAVES", label: "Leaves", group: "Time & Performance", description: "Leave requests, balances & approvals" },
  { id: "APPRAISAL", label: "Appraisal", group: "Time & Performance", description: "Performance reviews & appraisal cycles" },
  // Administration
  { id: "HR_REPORTS", label: "HR Reports", group: "Administration", description: "HR analytics, reports & immigration expiry" },
  { id: "HR_SETTINGS", label: "HR Settings", group: "Administration", description: "Leave types, policies, roles & permissions" },
];

// ── Finance ─────────────────────────────────────────────────────────────────
export const FINANCE_PERMISSION_MODULES: PermissionModuleRow[] = [
  // Accounts Receivable  (/finance/receivable)
  { id: "FINANCE_INVOICE", label: "Invoices & Credit Notes", group: "Accounts Receivable", description: "Customer invoices & credit notes" },
  // Accounts Payable  (/finance/payable)
  { id: "FINANCE_PAYMENT", label: "Payments", group: "Accounts Payable", description: "Supplier bills & payments" },
  // General Ledger  (/finance/ledger)
  { id: "FINANCE_LEDGER", label: "General Ledger", group: "General Ledger", description: "Ledger accounts & balances" },
  { id: "FINANCE_JOURNAL", label: "Journal Entries", group: "General Ledger", description: "Manual journal postings" },
  // Finance Reports  (/finance/reports)
  { id: "FINANCE_REPORTS", label: "Finance Reports", group: "Finance Reports", description: "Financial statements & analytics" },
  // Finance Settings  (/finance/settings)
  { id: "FINANCE_COA", label: "Chart of Accounts", group: "Finance Settings", description: "Account structure" },
  { id: "FINANCE_BUDGET", label: "Budget", group: "Finance Settings", description: "Budgets & budget lines" },
  { id: "FINANCE_RECONCILIATION", label: "Reconciliation", group: "Finance Settings", description: "Bank & account reconciliation" },
];

// ── Inventory ───────────────────────────────────────────────────────────────
export const INVENTORY_PERMISSION_MODULES: PermissionModuleRow[] = [
  // Inventory Stocks  (/inventory/stocks)
  { id: "INVENTORY_STOCK", label: "Stock Management", group: "Inventory Stocks", description: "Stock list, levels & adjustments" },
  { id: "INVENTORY_ITEM", label: "Items", group: "Inventory Stocks", description: "Item master & item detail" },
  // Sales  (/inventory/sales)
  { id: "INVENTORY_SALES", label: "Sales", group: "Sales", description: "Orders, customers, picklist, dispatch & invoices" },
  // Purchase  (/inventory/purchase)
  { id: "INVENTORY_PURCHASE", label: "Purchase", group: "Purchase", description: "Requisitions, orders, suppliers & invoices" },
  { id: "INVENTORY_RECEIPT", label: "Goods Receipt", group: "Purchase", description: "Receiving against purchase orders" },
  // Inventory Settings  (/inventory/settings)
  { id: "INVENTORY_CATEGORY", label: "Categories", group: "Inventory Settings", description: "Item categories" },
  { id: "INVENTORY_WAREHOUSE", label: "Warehouse", group: "Inventory Settings", description: "Warehouses & locations" },
];
