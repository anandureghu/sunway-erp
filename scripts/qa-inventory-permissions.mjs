#!/usr/bin/env node
/**
 * QA harness for inventory permission scenarios (S1–S6).
 * Run: node ./scripts/qa-inventory-permissions.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND = join(__dirname, "..");
const BACKEND = join(FRONTEND, "..", "backend");

const results = [];
function pass(id, msg) {
  results.push({ id, ok: true, msg });
  console.log(`  ✅ ${id}: ${msg}`);
}
function fail(id, msg) {
  results.push({ id, ok: false, msg });
  console.log(`  ❌ ${id}: ${msg}`);
}
function check(id, cond, msg) {
  if (cond) pass(id, msg);
  else fail(id, msg);
}

// ── Parse PAGE_ACTIONS from source ──────────────────────────────────────────
function parsePageActions() {
  const src = readFileSync(
    join(FRONTEND, "src/lib/permission-card-meta.ts"),
    "utf8",
  );
  const block = src.match(/const PAGE_ACTIONS[^=]*=\s*\{([\s\S]*?)\n\};/);
  assert.ok(block, "PAGE_ACTIONS block not found");
  const map = {};
  for (const m of block[1].matchAll(
    /(INVENTORY_\w+|FINANCE_INVOICE):\s*\[([^\]]+)\]/g,
  )) {
    map[m[1]] = m[2]
      .split(",")
      .map((s) => s.trim().replace(/["']/g, ""))
      .filter(Boolean);
  }
  return map;
}

// ── Parse backend @RequiresPermission for inventory modules ─────────────────
function walkJava(dir, out = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walkJava(p, out);
    else if (name.name.endsWith(".java")) out.push(p);
  }
  return out;
}

function parseBackendInventoryActions() {
  const controllerRoot = join(BACKEND, "src/main/java/com/erp/controller");
  const files = walkJava(controllerRoot);
  /** @type {Record<string, Set<string>>} */
  const byModule = {};
  const actionMap = {
    VIEW_ALL: "view",
    VIEW_OWN: "view",
    CREATE: "create",
    EDIT: "edit",
    DELETE: "delete",
    APPROVE: "approve",
  };
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(
      /@RequiresPermission\(\s*module\s*=\s*AppModule\.(INVENTORY_\w+|FINANCE_INVOICE)\s*,\s*action\s*=\s*\{([^}]+)\}/g,
    )) {
      const mod = m[1];
      const actions = [...m[2].matchAll(/AppAction\.(\w+)/g)].map((x) => x[1]);
      if (!byModule[mod]) byModule[mod] = new Set();
      for (const a of actions) {
        const coarse = actionMap[a];
        if (coarse) byModule[mod].add(coarse);
      }
    }
  }
  return Object.fromEntries(
    Object.entries(byModule).map(([k, v]) => [k, [...v].sort()]),
  );
}

// ── Cap helpers (mirror module-permissions + canView) ───────────────────────
function fullCaps(extra = {}) {
  return {
    view_own: true,
    view_all: true,
    create_own: true,
    create_all: true,
    edit_own: true,
    edit_all: true,
    delete_own: true,
    delete_all: true,
    create: true,
    edit: true,
    delete: true,
    approve: true,
    ...extra,
  };
}

function viewOnly() {
  return {
    view_own: true,
    view_all: true,
    create_own: false,
    create_all: false,
    edit_own: false,
    edit_all: false,
    delete_own: false,
    delete_all: false,
    create: false,
    edit: false,
    delete: false,
    approve: false,
  };
}

function canView(perms, mod) {
  if (perms == null) return true;
  const m = perms[mod];
  if (!m) return false;
  return !!(m.view_own || m.view_all);
}

function canCreate(perms, mod) {
  if (perms == null) return true;
  const m = perms[mod];
  return !!(m && (m.create || m.create_own || m.create_all));
}

function canEdit(perms, mod) {
  if (perms == null) return true;
  const m = perms[mod];
  return !!(m && (m.edit || m.edit_own || m.edit_all));
}

function canDelete(perms, mod) {
  if (perms == null) return true;
  const m = perms[mod];
  return !!(m && (m.delete || m.delete_own || m.delete_all));
}

function canApprove(perms, mod) {
  if (perms == null) return true;
  const m = perms[mod];
  return !!(m && m.approve);
}

function canViewAny(perms, mods) {
  return mods.some((m) => canView(perms, m));
}

/** Mirror Manage Stocks tab gates */
function stocksUi(perms) {
  const stockView = canView(perms, "INVENTORY_STOCK") || canView(perms, "INVENTORY_ITEM");
  const canReceive =
    (canCreate(perms, "INVENTORY_STOCK") || canEdit(perms, "INVENTORY_STOCK")) &&
    canView(perms, "INVENTORY_WAREHOUSE");
  const canManageVariances =
    canCreate(perms, "INVENTORY_STOCK") ||
    canEdit(perms, "INVENTORY_STOCK") ||
    canApprove(perms, "INVENTORY_STOCK");
  const canArchiveMovement = canDelete(perms, "INVENTORY_STOCK");
  return { stockView, canReceive, canManageVariances, canArchiveMovement };
}

/** Mirror sidebar inventory items */
function sidebarInventory(perms) {
  return {
    dashboard: canView(perms, "INVENTORY_DASHBOARD"),
    stocks:
      canView(perms, "INVENTORY_STOCK") || canView(perms, "INVENTORY_ITEM"),
    sales: canView(perms, "INVENTORY_SALES"),
    purchase:
      canView(perms, "INVENTORY_PURCHASE") ||
      canView(perms, "INVENTORY_RECEIPT"),
    reports: canView(perms, "INVENTORY_STOCK"),
    settings:
      canView(perms, "INVENTORY_CATEGORY") ||
      canView(perms, "INVENTORY_WAREHOUSE") ||
      canView(perms, "INVENTORY_PURCHASE") ||
      canView(perms, "INVENTORY_SALES") ||
      canView(perms, "INVENTORY_ITEM") ||
      canView(perms, "INVENTORY_RECEIPT"),
  };
}

/** Mirror settings tab visibility */
function settingsTabs(perms) {
  return {
    categories: canView(perms, "INVENTORY_CATEGORY"),
    warehouses: canView(perms, "INVENTORY_WAREHOUSE"),
    customers: canView(perms, "INVENTORY_SALES"),
    suppliers: canView(perms, "INVENTORY_PURCHASE"),
    pricing: canView(perms, "INVENTORY_ITEM"),
  };
}

/** Mirror purchase landing cards */
function purchaseCards(perms) {
  const invoices =
    canView(perms, "FINANCE_INVOICE");
  return {
    requisitions: canView(perms, "INVENTORY_PURCHASE"),
    orders: canView(perms, "INVENTORY_PURCHASE"),
    inspection: canView(perms, "INVENTORY_RECEIPT"),
    invoices,
    suppliers: canView(perms, "INVENTORY_PURCHASE"),
  };
}

function selectAllInventory() {
  const mods = [
    "INVENTORY_DASHBOARD",
    "INVENTORY_STOCK",
    "INVENTORY_ITEM",
    "INVENTORY_SALES",
    "INVENTORY_PURCHASE",
    "INVENTORY_RECEIPT",
    "INVENTORY_CATEGORY",
    "INVENTORY_WAREHOUSE",
  ];
  /** @type {Record<string, ReturnType<typeof fullCaps>>} */
  const perms = {};
  for (const m of mods) perms[m] = fullCaps();
  // Dashboard is view-only in UI cards
  perms.INVENTORY_DASHBOARD = viewOnly();
  return perms;
}

// ── Tests ───────────────────────────────────────────────────────────────────
console.log("\n══ Inventory permission QA ══\n");

console.log("— Catalog ↔ API action coverage —");
const pageActions = parsePageActions();
const apiActions = parseBackendInventoryActions();

for (const [mod, apiActs] of Object.entries(apiActions)) {
  const ui = pageActions[mod] ?? [];
  const missing = apiActs.filter((a) => !ui.includes(a));
  check(
    `COV-${mod}`,
    missing.length === 0,
    missing.length === 0
      ? `UI cards cover API actions [${apiActs.join(", ")}]`
      : `UI missing [${missing.join(", ")}] (API needs [${apiActs.join(", ")}], UI has [${ui.join(", ")}])`,
  );
}

check(
  "COV-STOCK-delete",
  (pageActions.INVENTORY_STOCK || []).includes("delete"),
  "STOCK Select-all includes delete",
);
check(
  "COV-RECEIPT-approve",
  (pageActions.INVENTORY_RECEIPT || []).includes("approve") &&
    (pageActions.INVENTORY_RECEIPT || []).includes("delete"),
  "RECEIPT Select-all includes approve+delete",
);
check(
  "COV-SALES-approve",
  (pageActions.INVENTORY_SALES || []).includes("approve"),
  "SALES Select-all includes approve",
);

console.log("\n— S1 Full inventory clerk (Select all, no FINANCE_INVOICE) —");
{
  const p = selectAllInventory();
  const nav = sidebarInventory(p);
  check("S1-nav", nav.dashboard && nav.stocks && nav.sales && nav.purchase && nav.reports && nav.settings, "Sidebar shows all inventory areas");
  const ui = stocksUi(p);
  check("S1-receive", ui.canReceive, "Receive tab available (STOCK write + WAREHOUSE view)");
  check("S1-variance", ui.canManageVariances, "Variances tab available");
  check("S1-archive-move", ui.canArchiveMovement, "Batch archive/delete available (STOCK delete)");
  check("S1-receipt-approve", canApprove(p, "INVENTORY_RECEIPT"), "RECEIPT approve granted");
  check("S1-receipt-delete", canDelete(p, "INVENTORY_RECEIPT"), "RECEIPT delete granted");
  check("S1-sales-approve", canApprove(p, "INVENTORY_SALES"), "SALES approve granted");
  check(
    "S1-invoice-denied",
    !canView(p, "FINANCE_INVOICE"),
    "Invoices still denied without FINANCE_INVOICE",
  );
  check(
    "S1-invoice-route",
    !canViewAny(p, ["FINANCE_INVOICE"]),
    "Invoice ModuleAccessGate would deny",
  );
}

console.log("\n— S2 STOCK view only —");
{
  const p = {
    INVENTORY_STOCK: viewOnly(),
    INVENTORY_WAREHOUSE: viewOnly(),
  };
  const ui = stocksUi(p);
  check("S2-stock-view", ui.stockView, "Stocks page opens");
  check("S2-no-receive", !ui.canReceive, "Receive tab hidden");
  check("S2-no-variance", !ui.canManageVariances, "Variances tab hidden");
  check("S2-no-archive", !ui.canArchiveMovement, "Movement archive/delete hidden");
  check("S2-reports", sidebarInventory(p).reports, "Ops/Mgmt reports in sidebar");
}

console.log("\n— S3 ITEM only (no STOCK) —");
{
  const p = { INVENTORY_ITEM: fullCaps() };
  const nav = sidebarInventory(p);
  check("S3-stocks-nav", nav.stocks, "Stocks nav visible via ITEM");
  check("S3-route", canViewAny(p, ["INVENTORY_ITEM", "INVENTORY_STOCK"]), "stocks/:id gate allows ITEM");
  check(
    "S3-catalog-api",
    !canView(p, "INVENTORY_STOCK"),
    "stock-catalog API would 403 without STOCK view (expected gap)",
  );
  check("S3-pricing", settingsTabs(p).pricing, "Pricing settings visible");
  check("S3-no-reports", !nav.reports, "Reports hidden without STOCK");
}

console.log("\n— S4 RECEIPT only (no PURCHASE) —");
{
  const p = { INVENTORY_RECEIPT: fullCaps() };
  const nav = sidebarInventory(p);
  const cards = purchaseCards(p);
  check("S4-purchase-nav", nav.purchase, "Purchase sidebar for RECEIPT-only");
  check("S4-landing-gate", canViewAny(p, ["INVENTORY_PURCHASE", "INVENTORY_RECEIPT"]), "Purchase landing gate allows");
  check("S4-inspect-card", cards.inspection, "Goods receipt card shown");
  check("S4-no-po", !cards.orders && !cards.requisitions && !cards.suppliers, "PO/requisition/supplier cards hidden");
  check("S4-confirm", canApprove(p, "INVENTORY_RECEIPT"), "Confirm inspection (approve) allowed");
}

console.log("\n— S5 Settings isolation —");
{
  const cat = settingsTabs({ INVENTORY_CATEGORY: viewOnly() });
  check("S5-cat", cat.categories && !cat.warehouses && !cat.customers && !cat.suppliers && !cat.pricing, "CATEGORY-only → Categories");
  const wh = settingsTabs({ INVENTORY_WAREHOUSE: viewOnly() });
  check("S5-wh", wh.warehouses && !wh.categories && !wh.customers && !wh.pricing, "WAREHOUSE-only → Warehouses");
  const sales = settingsTabs({ INVENTORY_SALES: viewOnly() });
  check("S5-sales", sales.customers && !sales.suppliers, "SALES-only → Customers");
  const purch = settingsTabs({ INVENTORY_PURCHASE: viewOnly() });
  check("S5-purch", purch.suppliers && !purch.customers, "PURCHASE-only → Suppliers");
  const item = settingsTabs({ INVENTORY_ITEM: viewOnly() });
  check("S5-item", item.pricing && !item.categories, "ITEM-only → Pricing");
}

console.log("\n— S6 Invoice mismatch —");
{
  const invOnly = selectAllInventory();
  check("S6-no-inv", !purchaseCards(invOnly).invoices, "Select-all inventory hides invoice card");
  const withInv = { ...selectAllInventory(), FINANCE_INVOICE: viewOnly() };
  check("S6-with-inv", purchaseCards(withInv).invoices, "FINANCE_INVOICE unlocks invoice card");
  check(
    "S6-route-ok",
    canView(withInv, "FINANCE_INVOICE"),
    "Invoice route gate passes with FINANCE_INVOICE",
  );
}

console.log("\n— Source gates present —");
{
  const app = readFileSync(join(FRONTEND, "src/App.tsx"), "utf8");
  check(
    "SRC-invoice-sales",
    app.includes('module="FINANCE_INVOICE"') &&
      app.includes("sales/invoices"),
    "sales/invoices gated by FINANCE_INVOICE",
  );
  check(
    "SRC-purchase-or",
    app.includes("InventoryModule.PURCHASE, InventoryModule.RECEIPT"),
    "purchase landing allows PURCHASE|RECEIPT",
  );
  check(
    "SRC-item-detail",
    app.includes("InventoryModule.ITEM, InventoryModule.STOCK"),
    "stocks/:id allows ITEM|STOCK",
  );
  const dash = readFileSync(
    join(
      BACKEND,
      "src/main/java/com/erp/controller/dashboard/InventoryDashboardController.java",
    ),
    "utf8",
  );
  check(
    "SRC-dash-api",
    dash.includes("INVENTORY_DASHBOARD") && dash.includes("RequiresPermission"),
    "Dashboard API requires INVENTORY_DASHBOARD",
  );
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\n══ Result: ${results.length - failed.length}/${results.length} passed ══\n`,
);
if (failed.length) {
  console.log("Failures:");
  for (const f of failed) console.log(`  - ${f.id}: ${f.msg}`);
  process.exit(1);
}
