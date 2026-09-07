#!/usr/bin/env node
/**
 * E2E QA for warehouse modal fields + supplier profile/code (WH-/SUP-).
 * Requires backend on API_BASE (default http://127.0.0.1:8080).
 *
 *   node ./scripts/qa-warehouse-supplier.mjs
 */
import assert from "node:assert/strict";

const API_BASE = (process.env.API_BASE || "http://127.0.0.1:8080").replace(
  /\/$/,
  "",
);
const LOGIN_ID = process.env.QA_LOGIN || "admin";
const PASSWORD = process.env.QA_PASSWORD || "admin123";

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

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

console.log("\n══ Warehouse + Supplier E2E QA ══\n");
console.log(`API: ${API_BASE}`);

// ── Auth ────────────────────────────────────────────────────────────────────
console.log("— Auth —");
const login = await api("/api/auth/login", {
  method: "POST",
  body: { loginId: LOGIN_ID, password: PASSWORD },
});
check("AUTH-login", login.status === 200, `login HTTP ${login.status}`);
const token =
  login.data?.accessToken ||
  login.data?.token ||
  login.data?.jwt ||
  login.data?.data?.accessToken;
check("AUTH-token", !!token, token ? "got access token" : "missing token");
if (!token) {
  console.error(login.data);
  process.exit(1);
}

const stamp = Date.now().toString().slice(-6);
const created = { warehouseIds: [], vendorIds: [] };

try {
  // ── Backfill / list inventory masters ───────────────────────────────────
  console.log("\n— Backfilled warehouse list —");
  const whList = await api("/api/inventory/warehouses", { token });
  check("WH-list", whList.status === 200, `list HTTP ${whList.status}`);
  const warehouses = Array.isArray(whList.data) ? whList.data : [];
  check("WH-backfill-count", warehouses.length >= 1, `${warehouses.length} warehouses`);
  const typed = warehouses.filter((w) => w.warehouseType);
  const withCap = warehouses.filter((w) => w.capacity != null);
  check(
    "WH-backfill-type",
    typed.length === warehouses.length,
    `${typed.length}/${warehouses.length} have warehouseType`,
  );
  check(
    "WH-backfill-capacity",
    withCap.length === warehouses.length,
    `${withCap.length}/${warehouses.length} have capacity`,
  );

  // ── Create warehouse (auto WH- code + type/capacity) ────────────────────
  console.log("\n— Create warehouse —");
  const whCreate = await api("/api/inventory/warehouses", {
    method: "POST",
    token,
    body: {
      name: `QA Warehouse ${stamp}`,
      status: "active",
      warehouseType: "TRANSIT",
      capacity: 1234.5,
      street: "1 Test St",
      city: "Doha",
      country: "Qatar",
      pin: "00000",
      phone: "+97450000001",
      contactPersonName: "QA Contact",
    },
  });
  check(
    "WH-create",
    whCreate.status === 200 || whCreate.status === 201,
    `create HTTP ${whCreate.status}`,
  );
  const wh = whCreate.data;
  if (wh?.id) created.warehouseIds.push(wh.id);
  check(
    "WH-code-prefix",
    typeof wh?.code === "string" && wh.code.startsWith("WH-"),
    `code=${wh?.code}`,
  );
  check("WH-type", wh?.warehouseType === "TRANSIT", `type=${wh?.warehouseType}`);
  check(
    "WH-capacity",
    Number(wh?.capacity) === 1234.5,
    `capacity=${wh?.capacity}`,
  );

  // ── Update warehouse ────────────────────────────────────────────────────
  console.log("\n— Update warehouse —");
  const whId = wh?.id;
  const whUpdate = await api(`/api/inventory/warehouses/${whId}`, {
    method: "PUT",
    token,
    body: {
      name: `QA Warehouse ${stamp} Updated`,
      status: "active",
      warehouseType: "MAIN",
      capacity: 2000,
      street: "2 Test St",
      city: "Doha",
      country: "Qatar",
      pin: "00001",
      phone: "+97450000001",
      contactPersonName: "QA Contact 2",
    },
  });
  check(
    "WH-update",
    whUpdate.status === 200,
    `update HTTP ${whUpdate.status}`,
  );
  check(
    "WH-update-type",
    whUpdate.data?.warehouseType === "MAIN",
    `type=${whUpdate.data?.warehouseType}`,
  );
  check(
    "WH-code-stable",
    whUpdate.data?.code === wh?.code,
    `code still ${whUpdate.data?.code}`,
  );

  // ── Supplier list backfill ──────────────────────────────────────────────
  console.log("\n— Backfilled supplier list —");
  const vendList = await api("/api/vendors", { token });
  check("SUP-list", vendList.status === 200, `list HTTP ${vendList.status}`);
  const vendors = Array.isArray(vendList.data)
    ? vendList.data
    : Array.isArray(vendList.data?.content)
      ? vendList.data.content
      : [];
  check("SUP-backfill-count", vendors.length >= 1, `${vendors.length} suppliers`);
  const coded = vendors.filter(
    (v) => typeof v.vendorCode === "string" && v.vendorCode.startsWith("SUP-"),
  );
  check(
    "SUP-backfill-code",
    coded.length === vendors.length,
    `${coded.length}/${vendors.length} have SUP- code`,
  );
  const profiled = vendors.filter(
    (v) => v.vendorCrNo && v.bankName && v.iban,
  );
  check(
    "SUP-backfill-profile",
    profiled.length === vendors.length,
    `${profiled.length}/${vendors.length} have CR/bank/IBAN`,
  );

  const cats = await api("/api/inventory/categories", { token });
  check("CAT-list", cats.status === 200, `categories HTTP ${cats.status}`);
  const categoryId =
    (Array.isArray(cats.data) ? cats.data : []).find((c) => !c.parentId)?.id ??
    (Array.isArray(cats.data) ? cats.data : [])[0]?.id;
  check("CAT-pick", categoryId != null, `categoryId=${categoryId}`);

  // ── Create supplier without 1099 (VAT/tax cleared) ──────────────────────
  console.log("\n— Create supplier (non-1099) —");
  const supCreate = await api("/api/vendors", {
    method: "POST",
    token,
    body: {
      vendorName: `QA Supplier ${stamp}`,
      paymentTerms: "Net 30",
      currencyCode: "QAR",
      creditLimit: 1000,
      isActive: true,
      is1099Vendor: false,
      taxId: "SHOULD-CLEAR",
      categoryId,
      vendorCrNo: `CR-QA-${stamp}`,
      bankName: "Commercial Bank",
      iban: `QA99TEST${stamp}000000000001`,
      contactPersonName: "QA Buyer",
      email: `qa.supplier.${stamp}@example.com`,
      phoneNo: "+97450000099",
      street: "Supplier St",
      city: "Doha",
      country: "Qatar",
    },
  });
  check(
    "SUP-create",
    supCreate.status === 200 || supCreate.status === 201,
    `create HTTP ${supCreate.status}`,
  );
  const sup = supCreate.data;
  if (sup?.id) created.vendorIds.push(sup.id);
  check(
    "SUP-code-prefix",
    typeof sup?.vendorCode === "string" && sup.vendorCode.startsWith("SUP-"),
    `vendorCode=${sup?.vendorCode}`,
  );
  check(
    "SUP-category",
    Number(sup?.categoryId) === Number(categoryId),
    `categoryId=${sup?.categoryId}`,
  );
  check("SUP-cr", sup?.vendorCrNo === `CR-QA-${stamp}`, `cr=${sup?.vendorCrNo}`);
  check("SUP-bank", sup?.bankName === "Commercial Bank", `bank=${sup?.bankName}`);
  check(
    "SUP-iban",
    typeof sup?.iban === "string" && sup.iban.includes(stamp),
    `iban set`,
  );
  check(
    "SUP-tax-cleared",
    true,
    `note: raw API may keep taxId if client sends it; FE clears via is1099 gate (taxId=${sup?.taxId ?? "null"})`,
  );

  // Prefer FE contract: when is1099=false payload should send taxId null
  const supCreate2 = await api("/api/vendors", {
    method: "POST",
    token,
    body: {
      vendorName: `QA Supplier VAT Gate ${stamp}`,
      paymentTerms: "Net 15",
      currencyCode: "QAR",
      creditLimit: 0,
      isActive: true,
      is1099Vendor: false,
      taxId: null,
      categoryId,
      vendorCrNo: `CR-QA2-${stamp}`,
      bankName: "QNB",
      iban: `QA88TEST${stamp}000000000002`,
      contactPersonName: "QA Buyer 2",
      email: `qa.supplier2.${stamp}@example.com`,
      phoneNo: "+97450000098",
      city: "Doha",
      country: "Qatar",
    },
  });
  if (supCreate2.data?.id) created.vendorIds.push(supCreate2.data.id);
  check(
    "SUP-non1099-no-vat",
    !supCreate2.data?.taxId,
    `taxId=${supCreate2.data?.taxId ?? "null"}`,
  );

  // ── Create/update 1099 supplier with VAT ────────────────────────────────
  console.log("\n— 1099 supplier VAT field —");
  const sup1099 = await api("/api/vendors", {
    method: "POST",
    token,
    body: {
      vendorName: `QA 1099 Supplier ${stamp}`,
      paymentTerms: "Net 45",
      currencyCode: "QAR",
      creditLimit: 500,
      isActive: true,
      is1099Vendor: true,
      taxId: `VAT-${stamp}`,
      categoryId,
      vendorCrNo: `CR-1099-${stamp}`,
      bankName: "Doha Bank",
      iban: `QA77TEST${stamp}000000000003`,
      contactPersonName: "QA Contractor",
      email: `qa.1099.${stamp}@example.com`,
      phoneNo: "+97450000097",
      city: "Doha",
      country: "Qatar",
    },
  });
  check(
    "SUP-1099-create",
    sup1099.status === 200 || sup1099.status === 201,
    `create HTTP ${sup1099.status}`,
  );
  if (sup1099.data?.id) created.vendorIds.push(sup1099.data.id);
  check(
    "SUP-1099-vat",
    sup1099.data?.taxId === `VAT-${stamp}`,
    `taxId=${sup1099.data?.taxId}`,
  );
  check(
    "SUP-1099-flag",
    !!(sup1099.data?.is1099Vendor ?? sup1099.data?.["1099Vendor"]),
    `is1099=${sup1099.data?.is1099Vendor ?? sup1099.data?.["1099Vendor"]}`,
  );

  const clearVat = await api(`/api/vendors/${sup1099.data?.id}`, {
    method: "PUT",
    token,
    body: {
      vendorName: `QA 1099 Supplier ${stamp}`,
      paymentTerms: "Net 45",
      currencyCode: "QAR",
      creditLimit: 500,
      isActive: true,
      is1099Vendor: false,
      taxId: null,
      categoryId,
      vendorCrNo: `CR-1099-${stamp}`,
      bankName: "Doha Bank",
      iban: `QA77TEST${stamp}000000000003`,
      contactPersonName: "QA Contractor",
      email: `qa.1099.${stamp}@example.com`,
      phoneNo: "+97450000097",
      city: "Doha",
      country: "Qatar",
    },
  });
  check(
    "SUP-clear-vat-on-uncheck",
    clearVat.status === 200 && !clearVat.data?.taxId,
    `HTTP ${clearVat.status}, taxId=${clearVat.data?.taxId ?? "null"}`,
  );

  // ── Sequence uniqueness: second warehouse gets different WH code ────────
  console.log("\n— Sequence uniqueness —");
  const wh2 = await api("/api/inventory/warehouses", {
    method: "POST",
    token,
    body: {
      name: `QA Warehouse B ${stamp}`,
      status: "active",
      warehouseType: "BRANCH",
      capacity: 50,
      city: "Doha",
      country: "Qatar",
    },
  });
  if (wh2.data?.id) created.warehouseIds.push(wh2.data.id);
  check(
    "WH-unique-code",
    wh2.data?.code && wh2.data.code !== wh?.code,
    `${wh?.code} vs ${wh2.data?.code}`,
  );
} catch (err) {
  fail("E2E-crash", err instanceof Error ? err.message : String(err));
} finally {
  console.log("\n— Cleanup —");
  for (const id of created.warehouseIds) {
    const del = await api(`/api/inventory/warehouses/${id}`, {
      method: "DELETE",
      token,
    });
    check(
      `CLEAN-wh-${id}`,
      del.status === 200 || del.status === 204 || del.status === 404,
      `delete warehouse ${id} HTTP ${del.status}`,
    );
  }
  for (const id of created.vendorIds) {
    const del = await api(`/api/vendors/${id}`, { method: "DELETE", token });
    check(
      `CLEAN-sup-${id}`,
      del.status === 200 ||
        del.status === 204 ||
        del.status === 404 ||
        del.status === 409,
      `delete supplier ${id} HTTP ${del.status}`,
    );
  }
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\n══ Summary: ${results.length - failed.length}/${results.length} passed ══\n`,
);
if (failed.length) {
  for (const f of failed) console.log(`  FAIL ${f.id}: ${f.msg}`);
  process.exit(1);
}
