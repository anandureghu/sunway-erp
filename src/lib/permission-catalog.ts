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
  // Overview
  { id: "HR_DASHBOARD", label: "Dashboard", group: "Overview", description: "HR & payroll dashboard overview" },
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
  // HR Settings — per tab (HR_SETTINGS umbrella grants all of them)
  { id: "HR_SETTINGS", label: "All HR Settings", group: "HR Settings", description: "Umbrella — grants every HR Settings tab below" },
  { id: "HRS_ORG_STRUCTURE", label: "Org Structure", group: "HR Settings", description: "Divisions & organization chart" },
  { id: "HRS_DEPARTMENTS", label: "Departments", group: "HR Settings", description: "Company departments" },
  { id: "HRS_JOB_CODES", label: "Job Codes", group: "HR Settings", description: "Job codes, grades & approval" },
  { id: "HRS_ROLES", label: "Roles", group: "HR Settings", description: "Company roles" },
  { id: "HRS_CONFIRMATIONS", label: "Confirmations", group: "HR Settings", description: "Probation confirmations" },
  { id: "HRS_CONTRACT_RENEWALS", label: "Contract Renewals", group: "HR Settings", description: "Contract renewal review" },
  { id: "HRS_APPRAISAL_CONFIG", label: "Appraisals Setup", group: "HR Settings", description: "Appraisal cycle configuration" },
  { id: "HRS_LEAVE_TYPES", label: "Leave Types", group: "HR Settings", description: "Leave type / policy customization" },
  { id: "HRS_LEAVE_APPROVALS", label: "Leave Approvals", group: "HR Settings", description: "Approve / reject leave requests" },
  { id: "HRS_LOAN_APPROVALS", label: "Loan Approvals", group: "HR Settings", description: "Approve / reject loan requests" },
  { id: "HRS_POLICIES", label: "HR Policies", group: "HR Settings", description: "Company HR policies & statutory defaults" },
  { id: "HRS_SOCIAL", label: "Social", group: "HR Settings", description: "Social / branding settings" },
  { id: "HRS_PERMISSIONS", label: "Permissions", group: "HR Settings", description: "Assign role permissions" },
  // HR Reports — per tab (HR_REPORTS umbrella grants all of them)
  { id: "HR_REPORTS", label: "All HR Reports", group: "HR Reports", description: "Umbrella — grants every HR Reports tab below" },
  { id: "HRR_WORKFORCE", label: "Workforce Overview", group: "HR Reports", description: "Workforce analytics" },
  { id: "HRR_PERFORMANCE", label: "Employee Performance", group: "HR Reports", description: "Appraisal performance report" },
  { id: "HRR_TIMESHEETS", label: "Employee Time Sheets", group: "HR Reports", description: "Timesheet report" },
  { id: "HRR_ATTENDANCE_HISTORY", label: "Attendance History", group: "HR Reports", description: "Attendance history report" },
  { id: "HRR_LEAVE_HISTORY", label: "Leave History", group: "HR Reports", description: "Leave history report" },
  { id: "HRR_LOAN_HISTORY", label: "Loan History", group: "HR Reports", description: "Loan history report" },
  { id: "HRR_IMMIGRATION_EXPIRY", label: "Immigration Expiry", group: "HR Reports", description: "Passport / visa / permit expiry report" },
  { id: "HRR_PAYROLL_SUMMARY", label: "Payroll Summary", group: "HR Reports", description: "Company payroll summary" },
  { id: "HRR_EXIT_INTERVIEWS", label: "Exit Interviews", group: "HR Reports", description: "Exit interview records" },
  { id: "HRR_ARCHIVE", label: "Archive", group: "HR Reports", description: "Archived employees" },
  { id: "HRR_HISTORY", label: "Activity History", group: "HR Reports", description: "HR activity history" },
];

// ── Finance ─────────────────────────────────────────────────────────────────
export const FINANCE_PERMISSION_MODULES: PermissionModuleRow[] = [
  // Overview
  { id: "FINANCE_DASHBOARD", label: "Dashboard", group: "Overview", description: "Finance dashboard overview" },
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
  // Overview
  { id: "INVENTORY_DASHBOARD", label: "Dashboard", group: "Overview", description: "Inventory dashboard overview" },
  // Inventory Stocks  (/inventory/stocks)
  { id: "INVENTORY_STOCK", label: "Stock Management", group: "Inventory Stocks", description: "Stock list, receive, variances, batch movements & ops reports" },
  { id: "INVENTORY_ITEM", label: "Items", group: "Inventory Stocks", description: "Item master, catalog archive/delete & discounts" },
  // Sales  (/inventory/sales)
  { id: "INVENTORY_SALES", label: "Sales", group: "Sales", description: "Orders, customers, picklist & dispatch (invoices need Finance → Invoices)" },
  // Purchase  (/inventory/purchase)
  { id: "INVENTORY_PURCHASE", label: "Purchase", group: "Purchase", description: "Requisitions, POs & suppliers (invoices need Finance → Invoices)" },
  { id: "INVENTORY_RECEIPT", label: "Goods Receipt", group: "Purchase", description: "Inspect receipts, confirm inspection, post stock & archive" },
  // Inventory Settings  (/inventory/settings)
  { id: "INVENTORY_CATEGORY", label: "Categories", group: "Inventory Settings", description: "Item categories" },
  { id: "INVENTORY_WAREHOUSE", label: "Warehouse", group: "Inventory Settings", description: "Warehouses, locations & dispatch carriers" },
];
