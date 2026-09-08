#!/usr/bin/env node
/**
 * E2E QA for warehouse CSV bulk upload (preview → import) + type normalization.
 * Requires backend on API_BASE (default http://127.0.0.1:8080).
 *
 *   npm run qa:warehouse-import
 */

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

async function api(path, { method = "GET", token, body, formData } = {}) {
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  let payload;
  if (formData) {
    payload = formData;
  } else if (body != null) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: payload,
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

function csvBlob(content, name = "warehouses.csv") {
  return new File([content], name, { type: "text/csv" });
}

console.log("\n══ Warehouse CSV Import E2E QA ══\n");
console.log(`API: ${API_BASE}`);

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
const codes = {
  wh1: `QA-WH1-${stamp}`,
  wh2: `QA-WH2-${stamp}`,
  wh3: `QA-WH3-${stamp}`,
  wh4: `QA-WH4-${stamp}`,
};
const createdIds = [];

try {
  console.log("\n— CSV preview (template + Arabic ignored) —");
  const csvWithArabic = [
    "Warehouse Code,Warehouse Name,Warehouse Name (AR),Type,Address,City,Manager,Contact No.,Capacity (Pallets),Status",
    `${codes.wh1},Main Store – Industrial Area,مخزن رئيسي,General,"Street 44, Industrial Area",Doha,Abdullah Al Mansouri,+974 5567 8901,500,Active`,
    `${codes.wh2},Chemical Store,مخزن كيميائي,Hazardous,Street 12,Doha,Rizwan Ahmed,+974 5000 1122,80,Active`,
    `${codes.wh3},Al Wakra Site Store,موقع الوكرة,Site Store,Al Wakra Industrial Zone,Al Wakra,Mark Reyes,+974 3333 4444,120,Active`,
  ].join("\n");

  const previewFd = new FormData();
  previewFd.append("file", csvBlob(csvWithArabic, "preview.csv"));
  const preview = await api("/api/inventory/warehouses/import-csv/preview", {
    method: "POST",
    token,
    formData: previewFd,
  });
  check("CSV-preview-http", preview.status === 200, `preview HTTP ${preview.status}`);
  const mapping = preview.data?.fieldMapping || {};
  check(
    "CSV-map-code",
    mapping["Warehouse Code"] === "warehouseCode",
    `Warehouse Code → ${mapping["Warehouse Code"]}`,
  );
  check(
    "CSV-map-name",
    mapping["Warehouse Name"] === "warehouseName",
    `Warehouse Name → ${mapping["Warehouse Name"]}`,
  );
  check(
    "CSV-ignore-ar",
    mapping["Warehouse Name (AR)"] == null ||
      mapping["Warehouse Name (AR)"] === "",
    `Arabic ignored → ${mapping["Warehouse Name (AR)"]}`,
  );
  check(
    "CSV-map-type",
    mapping["Type"] === "warehouseType",
    `Type → ${mapping["Type"]}`,
  );
  check(
    "CSV-map-address",
    mapping["Address"] === "street",
    `Address → ${mapping["Address"]}`,
  );
  check(
    "CSV-map-city",
    mapping["City"] === "city",
    `City → ${mapping["City"]}`,
  );
  check(
    "CSV-map-manager",
    mapping["Manager"] === "manager",
    `Manager → ${mapping["Manager"]}`,
  );
  check(
    "CSV-map-phone",
    mapping["Contact No."] === "phone",
    `Contact No. → ${mapping["Contact No."]}`,
  );
  check(
    "CSV-map-capacity",
    mapping["Capacity (Pallets)"] === "capacity",
    `Capacity → ${mapping["Capacity (Pallets)"]}`,
  );
  check(
    "CSV-map-status",
    mapping["Status"] === "status",
    `Status → ${mapping["Status"]}`,
  );
  check(
    "CSV-preview-rows",
    preview.data?.dataRowCount === 3,
    `dataRowCount=${preview.data?.dataRowCount}`,
  );

  console.log("\n— CSV import confirm —");
  const importFd = new FormData();
  importFd.append("file", csvBlob(csvWithArabic, "import.csv"));
  importFd.append("mapping", JSON.stringify(mapping));
  const imported = await api("/api/inventory/warehouses/import-csv", {
    method: "POST",
    token,
    formData: importFd,
  });
  check("CSV-import-http", imported.status === 200, `import HTTP ${imported.status}`);
  check(
    "CSV-import-created",
    (imported.data?.created ?? 0) === 3,
    `created=${imported.data?.created}`,
  );
  check(
    "CSV-import-failed",
    (imported.data?.failed ?? 1) === 0,
    `failed=${imported.data?.failed}`,
  );

  console.log("\n— Verify imported data —");
  const list = await api("/api/inventory/warehouses", { token });
  const warehouses = Array.isArray(list.data) ? list.data : [];
  const byCode = Object.fromEntries(
    warehouses
      .filter((w) => Object.values(codes).includes(w.code))
      .map((w) => [w.code, w]),
  );
  Object.values(byCode).forEach((w) => {
    if (w?.id) createdIds.push(w.id);
  });

  check("CSV-wh1-found", !!byCode[codes.wh1], `found ${codes.wh1}`);
  check(
    "CSV-type-general",
    byCode[codes.wh1]?.warehouseType === "MAIN",
    `General → ${byCode[codes.wh1]?.warehouseType}`,
  );
  check(
    "CSV-type-hazardous",
    byCode[codes.wh2]?.warehouseType === "HAZARDOUS",
    `Hazardous → ${byCode[codes.wh2]?.warehouseType}`,
  );
  check(
    "CSV-type-site",
    byCode[codes.wh3]?.warehouseType === "SITE_STORE",
    `Site Store → ${byCode[codes.wh3]?.warehouseType}`,
  );
  check(
    "CSV-city",
    byCode[codes.wh3]?.city === "Al Wakra",
    `city=${byCode[codes.wh3]?.city}`,
  );
  check(
    "CSV-capacity",
    Number(byCode[codes.wh1]?.capacity) === 500,
    `capacity=${byCode[codes.wh1]?.capacity}`,
  );
  check(
    "CSV-phone",
    !!byCode[codes.wh1]?.phone,
    `phone=${byCode[codes.wh1]?.phone}`,
  );
  check(
    "CSV-manager-fallback",
    !!byCode[codes.wh1]?.managerName ||
      byCode[codes.wh1]?.contactPersonName === "Abdullah Al Mansouri",
    `manager/contact=${byCode[codes.wh1]?.managerName || byCode[codes.wh1]?.contactPersonName}`,
  );

  // Client-side filter fields exist on payloads (UI uses these)
  const cities = new Set(
    warehouses.map((w) => w.city).filter(Boolean),
  );
  const types = new Set(
    warehouses.map((w) => w.warehouseType).filter(Boolean),
  );
  check("FILTER-city-field", cities.has("Al Wakra") || cities.has("Doha"), `cities=${[...cities].slice(0, 5)}`);
  check(
    "FILTER-type-field",
    types.has("MAIN") || types.has("HAZARDOUS") || types.has("SITE_STORE"),
    `types include imported`,
  );

  console.log("\n— Duplicate skip —");
  const dupFd = new FormData();
  dupFd.append("file", csvBlob(csvWithArabic, "dup.csv"));
  dupFd.append("mapping", JSON.stringify(mapping));
  const dup = await api("/api/inventory/warehouses/import-csv", {
    method: "POST",
    token,
    formData: dupFd,
  });
  check("CSV-dup-http", dup.status === 200, `dup HTTP ${dup.status}`);
  check(
    "CSV-dup-skipped",
    (dup.data?.skipped ?? 0) >= 3,
    `skipped=${dup.data?.skipped}`,
  );
  check(
    "CSV-dup-created",
    (dup.data?.created ?? 1) === 0,
    `created=${dup.data?.created}`,
  );

  console.log("\n— Heuristic import (no client mapping) —");
  const heuristicCsv = [
    "Warehouse Code,Warehouse Name,Type,Address,City,Manager,Contact No.,Capacity (Pallets),Status",
    `${codes.wh4},Lusail PPE Store,PPE / Safety,Marina District,Lusail,Sara Ali,+974 1111 2222,100,Active`,
  ].join("\n");
  const hFd = new FormData();
  hFd.append("file", csvBlob(heuristicCsv, "heuristic.csv"));
  const hImport = await api("/api/inventory/warehouses/import-csv", {
    method: "POST",
    token,
    formData: hFd,
  });
  check(
    "CSV-heuristic-http",
    hImport.status === 200,
    `heuristic HTTP ${hImport.status}`,
  );
  check(
    "CSV-heuristic-created",
    (hImport.data?.created ?? 0) === 1,
    `created=${hImport.data?.created}`,
  );
  const list2 = await api("/api/inventory/warehouses", { token });
  const wh4 = (Array.isArray(list2.data) ? list2.data : []).find(
    (w) => w.code === codes.wh4,
  );
  if (wh4?.id) createdIds.push(wh4.id);
  check(
    "CSV-heuristic-type",
    wh4?.warehouseType === "PPE_SAFETY",
    `PPE / Safety → ${wh4?.warehouseType}`,
  );

  console.log("\n— Validation —");
  const badFd = new FormData();
  badFd.append("file", csvBlob("foo,bar\n1,2\n", "bad.csv"));
  const bad = await api("/api/inventory/warehouses/import-csv", {
    method: "POST",
    token,
    formData: badFd,
  });
  check("CSV-bad-rejected", bad.status >= 400, `bad CSV HTTP ${bad.status}`);
} catch (err) {
  fail("FATAL", err?.message || String(err));
  console.error(err);
} finally {
  console.log("\n— Cleanup —");
  for (const id of [...new Set(createdIds)]) {
    await api(`/api/inventory/warehouses/${id}`, { method: "DELETE", token });
  }
  pass("CLEANUP", `deleted ${createdIds.length} warehouses`);
}

const ok = results.filter((r) => r.ok).length;
const bad = results.filter((r) => !r.ok).length;
console.log(`\n══ Result: ${ok} passed, ${bad} failed ══\n`);
process.exit(bad > 0 ? 1 : 0);
