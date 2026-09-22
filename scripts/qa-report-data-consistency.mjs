#!/usr/bin/env node
/**
 * Static QA for report-area data consistency fixes.
 * Verifies source contains the aligned filters/KPIs from the plan.
 *
 * Run: npm run qa:report-consistency
 *   or: node ./scripts/qa-report-data-consistency.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND = join(__dirname, "..");
const BACKEND = join(FRONTEND, "..", "backend");
const JAVA = join(BACKEND, "src/main/java/com/erp");

const results = [];
function pass(id, msg) {
  results.push({ id, ok: true, msg });
  console.log(`  PASS ${id}: ${msg}`);
}
function fail(id, msg) {
  results.push({ id, ok: false, msg });
  console.log(`  FAIL ${id}: ${msg}`);
}
function check(id, cond, msg) {
  if (cond) pass(id, msg);
  else fail(id, msg);
}
function read(...parts) {
  return readFileSync(join(...parts), "utf8");
}

console.log("\n=== HR Reports / Dashboard ===\n");

{
  const src = read(FRONTEND, "src/modules/hr/reports/HRReports.tsx");
  check(
    "HR-1",
    src.includes("function normalizeStatus") &&
      src.includes('normalizeStatus(e.status) === "ACTIVE"') &&
      !src.includes('e.status === "Active"'),
    "Workforce KPIs normalize API status enums (ACTIVE), not display labels",
  );
  check(
    "HR-2",
    src.includes("function deptOf") &&
      src.includes("e.departmentName || e.department") &&
      src.includes("countBy(employees, (e) => deptOf(e))"),
    "Department chart uses departmentName ?? department",
  );
}

{
  const src = read(JAVA, "service/dashboard/HrDashboardService.java");
  check(
    "HR-3",
    src.includes("countByCompany_IdAndArchivedFalse(companyId)") &&
      src.includes("countByCompany_IdAndStatusAndArchivedFalse") &&
      !src.includes(".totalEmployees(employeeRepo.countByCompany_Id(companyId))"),
    "HR dashboard total/active exclude archived employees",
  );
  check(
    "HR-4",
    src.includes("findByCompany_IdAndStatusAndArchivedFalseOrderByCreatedAtDesc") &&
      src.includes("countByDepartment"),
    "Workforce status + dept distribution use archived-safe queries",
  );
}

{
  const src = read(JAVA, "repo/EmployeeRepository.java");
  check(
    "HR-5",
    src.includes("countByCompany_IdAndArchivedFalse") &&
      src.includes("countByCompany_IdAndStatusAndArchivedFalse") &&
      src.includes("AND e.archived = false") &&
      src.includes("countByDepartment"),
    "EmployeeRepository has archived-false count + dept aggregation",
  );
}

{
  const src = read(JAVA, "service/ImmigrationReportService.java");
  check(
    "HR-6",
    src.includes("isReportableEmployee") &&
      src.includes("emp.isArchived()") &&
      src.includes("isDepartedOrInactive()"),
    "Immigration expiry filters archived + departed/inactive",
  );
}

{
  const src = read(
    FRONTEND,
    "src/pages/hr/hr-dashboard/hr-dashboard-insight-cards.tsx",
  );
  check(
    "HR-7",
    src.includes(
      'viewAllTo="/hr/settings?tab=lifecycle&sub=confirm-employees"',
    ) && !src.includes("/hr/reports?tab=confirm-employees"),
    "Probation tracker links to HR Settings Confirm Employees",
  );
}

console.log("\n=== Finance Reports ===\n");

{
  const svc = read(JAVA, "service/finance/report/FinanceReportService.java");
  const tx = read(JAVA, "repo/finance/TransactionRepository.java");
  const inv = read(JAVA, "repo/finance/InvoiceRepository.java");
  const pay = read(JAVA, "repo/finance/PaymentRepository.java");
  const ui = read(FRONTEND, "src/pages/finance/finance-reports-page.tsx");

  check(
    "FIN-1",
    svc.includes("sumDebitByAccountTypes") &&
      tx.includes("sumDebitByAccountTypes") &&
      !svc.includes("expenseTotalFromLedger = sumThird(expenseAccountsRaw)"),
    "Expense KPI sums all ledger EXPENSE/COST debits (not top-10 only)",
  );
  check(
    "FIN-2",
    svc.includes("useLedgerExpenses") &&
      svc.includes("monthlyDebitByAccountTypes") &&
      tx.includes("monthlyDebitByAccountTypes"),
    "Expense monthly series uses ledger when KPI uses ledger",
  );
  check(
    "FIN-3",
    svc.includes("countInvoicesByTypeBetween") &&
      svc.includes("InvoiceType.SALES") &&
      inv.includes("countInvoicesByTypeBetween"),
    "Revenue invoice count is sales invoices only",
  );
  check(
    "FIN-4",
    pay.includes("PENDING_REQUEST") &&
      pay.includes("PENDING_VENDOR_PAYMENT") &&
      pay.includes("sumByDirectionBetween") &&
      /sumByDirectionBetween[\s\S]*PENDING_VENDOR_PAYMENT/.test(pay),
    "Cash in/out aggregations exclude pending payment methods",
  );
  check(
    "FIN-5",
    ui.includes("Current open") &&
      ui.includes("not limited to the selected report period"),
    "AR/AP UI labels current outstanding (not period totals)",
  );
}

console.log("\n=== Inventory / Sales ===\n");

{
  const svc = read(JAVA, "service/inventory/InventoryReportService.java");
  const dash = read(JAVA, "service/dashboard/InventoryDashboardService.java");
  const stock = read(JAVA, "repo/inventory/ItemWarehouseStockRepository.java");
  const batch = read(JAVA, "repo/inventory/StockBatchRepository.java");
  const sales = read(FRONTEND, "src/pages/sales/sales-landing-page.tsx");

  const reportStatuses =
    svc.includes("PurchaseOrderStatus.APPROVED") &&
    svc.includes("PurchaseOrderStatus.CONFIRMED") &&
    svc.includes("PurchaseOrderStatus.PARTIALLY_RECEIVED");
  const dashStatuses =
    dash.includes("PurchaseOrderStatus.APPROVED") &&
    dash.includes("PurchaseOrderStatus.CONFIRMED") &&
    dash.includes("PurchaseOrderStatus.PARTIALLY_RECEIVED");
  check(
    "INV-1",
    reportStatuses && dashStatuses,
    "On-order statuses match between report and dashboard (APPROVED+CONFIRMED+PARTIALLY_RECEIVED)",
  );

  const archivedHits = (stock.match(/i\.archived = false/g) || []).length;
  check(
    "INV-2",
    archivedHits >= 7,
    `Stock report queries exclude archived items (${archivedHits} filters)`,
  );
  check(
    "INV-3",
    batch.includes("i.archived = false") &&
      batch.includes("sumBatchValueAtCost") &&
      batch.includes("aggregateBatchValueByWarehouse") &&
      batch.includes("aggregateBatchValueByCategory") &&
      batch.includes("topBatchLinesByValue"),
    "Batch valuation queries exclude archived + support warehouse/category/top breakdowns",
  );
  check(
    "INV-4",
    svc.includes("useBatchValuation") &&
      svc.includes("aggregateBatchValueByWarehouse") &&
      svc.includes("topBatchLinesByValue"),
    "When batch cost drives KPI, charts/top lines use batch valuation",
  );
  check(
    "INV-5",
    sales.includes('"out_for_delivery"') &&
      sales.includes('"in_transit"') &&
      sales.includes('"dispatched"') &&
      !/status === "shipped"/.test(sales),
    "Sales landing in-transit aligns with dashboard (no invalid shipped)",
  );
}

console.log("\n=== Summary ===\n");
const failed = results.filter((r) => !r.ok);
const passed = results.filter((r) => r.ok);
console.log(`Passed: ${passed.length}/${results.length}`);
if (failed.length) {
  console.log("Failed:");
  for (const f of failed) console.log(`  - ${f.id}: ${f.msg}`);
  process.exit(1);
}
console.log("All report consistency source checks passed.\n");
process.exit(0);
