#!/usr/bin/env node
/**
 * E2E QA for item CSV bulk upload (preview → import) + field mapping.
 * Requires backend on API_BASE (default http://127.0.0.1:8080).
 *
 *   npm run qa:item-import
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
  if (formData) payload = formData;
  else if (body != null) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function csvBlob(content, name = "items.csv") {
  return new File([content], name, { type: "text/csv" });
}

console.log("\n══ Item CSV Import E2E QA ══\n");
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
const sku = `ITM-QA-${stamp}`;
const whCode = `WH-QA-${stamp}`;
const vendorCode = `VEN-QA-${stamp}`;
const catName = `QA-HVAC-${stamp}`;
const subName = `QA-AC-${stamp}`;
const vendorName = `QA Supplier ${stamp}`;

const createdItemIds = [];

try {
  console.log("\n— Seed warehouse / category / supplier —");
  const wh = await api("/api/inventory/warehouses", {
    method: "POST",
    token,
    body: {
      code: whCode,
      name: `${whCode} Main Store`,
      status: "active",
      warehouseType: "main",
      city: "Doha",
    },
  });
  check("SEED-wh", wh.status === 200 || wh.status === 201, `warehouse HTTP ${wh.status}`);
  const warehouseId = wh.data?.id;

  const parentCat = await api("/api/inventory/categories", {
    method: "POST",
    token,
    body: { code: `QA-C-${stamp}`, name: catName, status: "active" },
  });
  check(
    "SEED-cat",
    parentCat.status === 200 || parentCat.status === 201,
    `category HTTP ${parentCat.status}`,
  );
  const parentId = parentCat.data?.id;
  const subCat = await api("/api/inventory/categories", {
    method: "POST",
    token,
    body: {
      code: `QA-S-${stamp}`,
      name: subName,
      parentId,
      status: "active",
    },
  });
  check(
    "SEED-sub",
    subCat.status === 200 || subCat.status === 201,
    `sub-category HTTP ${subCat.status}`,
  );

  const vendor = await api("/api/vendors", {
    method: "POST",
    token,
    body: {
      vendorCode,
      vendorName,
      isActive: true,
      currencyCode: "QAR",
      paymentTerms: "Net 30",
      city: "Doha",
      country: "Qatar",
    },
  });
  check(
    "SEED-vendor",
    vendor.status === 200 || vendor.status === 201,
    `vendor HTTP ${vendor.status} ${JSON.stringify(vendor.data)?.slice(0, 200)}`,
  );
  const vendorId = vendor.data?.id;

  console.log("\n— CSV preview (Arabic ignored) —");
  const headers = [
    "Item Code",
    "Item Name (EN)",
    "Item Name (AR)",
    "Category",
    "Sub-Category",
    "UOM",
    "Brand / Manufacturer",
    "Model / Part No.",
    "Description",
    "Item Type",
    "Criticality",
    "HSN / Tariff Code",
    "Unit Cost (QAR)",
    "Selling Price (QAR)",
    "VAT Applicable",
    "Reorder Level",
    "Reorder Qty",
    "Min Stock",
    "Max Stock",
    "Lead Time (Days)",
    "Default Warehouse",
    "Shelf / Bin Location",
    "Preferred Supplier",
    "Supplier Part No.",
    "Weight (kg)",
    "Dimensions (LxWxH)",
    "Warranty (Months)",
    "Status",
    "Remarks",
  ];
  const row = [
    sku,
    "Split AC Unit 2 Ton",
    "وحدة تكييف",
    catName,
    subName,
    "Unit",
    "Daikin",
    "FTX250N",
    "2-ton split AC",
    "Stock",
    "Critical",
    "8415.1",
    "6200",
    "7500",
    "Yes",
    "5",
    "2",
    "10",
    "30",
    "14",
    `${whCode} Main Store`,
    "A1-01-01",
    vendorName,
    "DKN-FTXZ50N",
    "45",
    "98x30x22",
    "24",
    "Active",
    "QA remark",
  ];
  const csv = [headers.join(","), row.map((v) => `"${v}"`).join(",")].join("\n");

  const previewFd = new FormData();
  previewFd.append("file", csvBlob(csv, "preview.csv"));
  const preview = await api("/api/inventory/items/import-csv/preview", {
    method: "POST",
    token,
    formData: previewFd,
  });
  check("CSV-preview-http", preview.status === 200, `preview HTTP ${preview.status}`);
  const mapping = preview.data?.fieldMapping || {};
  check("CSV-map-sku", mapping["Item Code"] === "sku", `→ ${mapping["Item Code"]}`);
  check("CSV-map-name", mapping["Item Name (EN)"] === "name", `→ ${mapping["Item Name (EN)"]}`);
  check(
    "CSV-ignore-ar",
    mapping["Item Name (AR)"] == null || mapping["Item Name (AR)"] === "",
    `AR → ${mapping["Item Name (AR)"]}`,
  );
  check("CSV-map-cat", mapping["Category"] === "category", `→ ${mapping["Category"]}`);
  check(
    "CSV-map-sub",
    mapping["Sub-Category"] === "subCategory",
    `→ ${mapping["Sub-Category"]}`,
  );
  check(
    "CSV-map-wh",
    mapping["Default Warehouse"] === "warehouse",
    `→ ${mapping["Default Warehouse"]}`,
  );
  check(
    "CSV-map-supplier",
    mapping["Preferred Supplier"] === "preferredSupplier",
    `→ ${mapping["Preferred Supplier"]}`,
  );
  check(
    "CSV-map-criticality",
    mapping["Criticality"] === "criticality",
    `→ ${mapping["Criticality"]}`,
  );
  check(
    "CSV-map-hsn",
    mapping["HSN / Tariff Code"] === "hsnCode",
    `→ ${mapping["HSN / Tariff Code"]}`,
  );

  console.log("\n— Confirm import —");
  const importFd = new FormData();
  importFd.append("file", csvBlob(csv, "import.csv"));
  importFd.append("mapping", JSON.stringify(mapping));
  const imported = await api("/api/inventory/items/import-csv", {
    method: "POST",
    token,
    formData: importFd,
  });
  check("CSV-import-http", imported.status === 200, `import HTTP ${imported.status}`);
  check(
    "CSV-import-created",
    imported.data?.created === 1,
    `created=${imported.data?.created} failed=${imported.data?.failed} err=${JSON.stringify(imported.data?.errors?.[0])}`,
  );

  console.log("\n— Verify item fields —");
  const list = await api("/api/inventory/items", { token });
  const item = (list.data || []).find((i) => i.sku === sku);
  check("ITEM-found", !!item, item ? `id=${item.id}` : "not found");
  if (item) createdItemIds.push(item.id);

  check("ITEM-category", item?.category === catName, `category=${item?.category}`);
  check("ITEM-sub", item?.subCategory === subName, `sub=${item?.subCategory}`);
  check(
    "ITEM-warehouse",
    Number(item?.warehouse_id) === Number(warehouseId),
    `wh=${item?.warehouse_id} expected=${warehouseId}`,
  );
  check("ITEM-location", item?.location === "A1-01-01", `loc=${item?.location}`);
  check(
    "ITEM-vendor",
    Number(item?.preferredVendorId) === Number(vendorId),
    `vendor=${item?.preferredVendorId}`,
  );
  check(
    "ITEM-supplier-part",
    item?.supplierPartNo === "DKN-FTXZ50N",
    `part=${item?.supplierPartNo}`,
  );
  check("ITEM-criticality", item?.criticality === "Critical", `crit=${item?.criticality}`);
  check("ITEM-hsn", item?.hsnCode === "8415.1", `hsn=${item?.hsnCode}`);
  check("ITEM-vat", item?.vatApplicable === true, `vat=${item?.vatApplicable}`);
  check("ITEM-reorder-qty", Number(item?.reorderQty) === 2, `rq=${item?.reorderQty}`);
  check("ITEM-lead", Number(item?.leadTimeDays) === 14, `lead=${item?.leadTimeDays}`);
  check("ITEM-weight", Number(item?.weightKg) === 45, `wt=${item?.weightKg}`);
  check("ITEM-dims", item?.dimensions === "98x30x22", `dims=${item?.dimensions}`);
  check("ITEM-warranty", Number(item?.warrantyMonths) === 24, `warr=${item?.warrantyMonths}`);
  check("ITEM-remarks", item?.remarks === "QA remark", `remarks=${item?.remarks}`);
  check("ITEM-brand", item?.brand === "Daikin", `brand=${item?.brand}`);
  check(
    "ITEM-cost",
    Number(item?.costPrice) === 6200,
    `cost=${item?.costPrice}`,
  );
  check(
    "ITEM-sell",
    Number(item?.sellingPrice) === 7500,
    `sell=${item?.sellingPrice}`,
  );

  console.log("\n— Unmatched category / supplier left empty —");
  const sku2 = `ITM-QA2-${stamp}`;
  const csv2 = [
    "Item Code,Item Name (EN),Category,Sub-Category,Preferred Supplier,Default Warehouse,Status",
    `"${sku2}","Orphan Item","MissingCatXYZ","MissingSub","Ghost Supplier Inc","${whCode} Main Store","Active"`,
  ].join("\n");
  const preview2Fd = new FormData();
  preview2Fd.append("file", csvBlob(csv2, "orphan-preview.csv"));
  const preview2 = await api("/api/inventory/items/import-csv/preview", {
    method: "POST",
    token,
    formData: preview2Fd,
  });
  const mapping2 = preview2.data?.fieldMapping || {};
  const import2Fd = new FormData();
  import2Fd.append("file", csvBlob(csv2, "orphan.csv"));
  import2Fd.append("mapping", JSON.stringify(mapping2));
  const imported2 = await api("/api/inventory/items/import-csv", {
    method: "POST",
    token,
    formData: import2Fd,
  });
  check(
    "CSV-orphan-created",
    imported2.data?.created === 1,
    `created=${imported2.data?.created} err=${JSON.stringify(imported2.data?.errors?.[0])}`,
  );
  const list2 = await api("/api/inventory/items", { token });
  const orphan = (list2.data || []).find((i) => i.sku === sku2);
  if (orphan) createdItemIds.push(orphan.id);
  check(
    "ITEM-orphan-cat-empty",
    !orphan?.category,
    `category=${orphan?.category}`,
  );
  check(
    "ITEM-orphan-sub-empty",
    !orphan?.subCategory,
    `sub=${orphan?.subCategory}`,
  );
  check(
    "ITEM-orphan-vendor-empty",
    !orphan?.preferredVendorId,
    `vendor=${orphan?.preferredVendorId}`,
  );
  check(
    "ITEM-orphan-wh-fallback",
    !!orphan?.warehouse_id,
    `wh=${orphan?.warehouse_id}`,
  );
} catch (err) {
  fail("RUN-exception", err?.message || String(err));
  console.error(err);
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\n══ Summary: ${results.length - failed.length}/${results.length} passed ══\n`,
);
process.exit(failed.length ? 1 : 0);
