#!/usr/bin/env node
/**
 * E2E QA for supplier CSV bulk upload (preview → import) + category mapping.
 * Requires backend on API_BASE (default http://127.0.0.1:8080).
 *
 *   npm run qa:vendor-import
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

function csvBlob(content, name = "suppliers.csv") {
  return new File([content], name, { type: "text/csv" });
}

console.log("\n══ Supplier CSV Import E2E QA ══\n");
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
  s1: `QA-SUP1-${stamp}`,
  s2: `QA-SUP2-${stamp}`,
  s3: `QA-SUP3-${stamp}`,
};
const createdIds = [];

try {
  console.log("\n— CSV preview (Arabic ignored) —");
  const csvWithArabic = [
    "Supplier Code,Supplier Name (EN),Supplier Name (AR),Category,CR Number,VAT / TIN,Contact Person,Phone,Email,Address,City,Country,Payment Terms,Currency,Bank Name,IBAN,Credit Limit (QAR),Status",
    `${codes.s1},Al Saqr Trading W.L.L.,الصقر,HVAC,QA-CR-${stamp}1,300012345600003,Mansoor Ali,+974 5567 8901,sales@qa${stamp}.test,Street 12,Doha,Qatar,Net 30,QAR,QNB,QA12QNBA000000000000000000001,250000,Active`,
    `${codes.s2},Gulf Refrigeration Co.,الخليج,Electrical,QA-CR-${stamp}2,300098765400003,Tariq Basha,+974 5000 1122,info@qa${stamp}.test,Building 44,Doha,Qatar,Net 45,QAR,CBQ,QA12CBQA000000000000000000002,180000,Active`,
  ].join("\n");

  const previewFd = new FormData();
  previewFd.append("file", csvBlob(csvWithArabic, "preview.csv"));
  const preview = await api("/api/vendors/import-csv/preview", {
    method: "POST",
    token,
    formData: previewFd,
  });
  check("CSV-preview-http", preview.status === 200, `preview HTTP ${preview.status}`);
  const mapping = preview.data?.fieldMapping || {};
  check("CSV-map-code", mapping["Supplier Code"] === "vendorCode", `→ ${mapping["Supplier Code"]}`);
  check("CSV-map-name", mapping["Supplier Name (EN)"] === "vendorName", `→ ${mapping["Supplier Name (EN)"]}`);
  check(
    "CSV-ignore-ar",
    mapping["Supplier Name (AR)"] == null || mapping["Supplier Name (AR)"] === "",
    `AR → ${mapping["Supplier Name (AR)"]}`,
  );
  check("CSV-map-category", mapping["Category"] === "categoryName", `→ ${mapping["Category"]}`);
  check("CSV-map-cr", mapping["CR Number"] === "vendorCrNo", `→ ${mapping["CR Number"]}`);
  check("CSV-map-vat", mapping["VAT / TIN"] === "taxId", `→ ${mapping["VAT / TIN"]}`);
  check("CSV-map-terms", mapping["Payment Terms"] === "paymentTerms", `→ ${mapping["Payment Terms"]}`);
  check("CSV-map-bank", mapping["Bank Name"] === "bankName", `→ ${mapping["Bank Name"]}`);
  check("CSV-map-iban", mapping["IBAN"] === "iban", `→ ${mapping["IBAN"]}`);
  check("CSV-map-credit", mapping["Credit Limit (QAR)"] === "creditLimit", `→ ${mapping["Credit Limit (QAR)"]}`);
  check("CSV-preview-rows", preview.data?.dataRowCount === 2, `rows=${preview.data?.dataRowCount}`);

  console.log("\n— CSV import confirm —");
  const importFd = new FormData();
  importFd.append("file", csvBlob(csvWithArabic, "import.csv"));
  importFd.append("mapping", JSON.stringify(mapping));
  const imported = await api("/api/vendors/import-csv", {
    method: "POST",
    token,
    formData: importFd,
  });
  check("CSV-import-http", imported.status === 200, `import HTTP ${imported.status}`);
  check("CSV-import-created", (imported.data?.created ?? 0) === 2, `created=${imported.data?.created}`);
  check("CSV-import-failed", (imported.data?.failed ?? 1) === 0, `failed=${imported.data?.failed}`);

  console.log("\n— Verify —");
  const list = await api("/api/vendors?size=500", { token });
  const vendors = Array.isArray(list.data?.content)
    ? list.data.content
    : Array.isArray(list.data)
      ? list.data
      : [];
  const byCode = Object.fromEntries(
    vendors.filter((v) => Object.values(codes).includes(v.vendorCode)).map((v) => [v.vendorCode, v]),
  );
  Object.values(byCode).forEach((v) => {
    if (v?.id) createdIds.push(v.id);
  });

  check("CSV-s1-found", !!byCode[codes.s1], `found ${codes.s1}`);
  check(
    "CSV-category-hvac",
    byCode[codes.s1]?.categoryName === "HVAC",
    `category=${byCode[codes.s1]?.categoryName}`,
  );
  check(
    "CSV-category-elec",
    byCode[codes.s2]?.categoryName === "Electrical",
    `category=${byCode[codes.s2]?.categoryName}`,
  );
  check(
    "CSV-vat-stored",
    byCode[codes.s1]?.taxId === "300012345600003",
    `taxId=${byCode[codes.s1]?.taxId}`,
  );
  check(
    "CSV-credit",
    Number(byCode[codes.s1]?.creditLimit) === 250000,
    `credit=${byCode[codes.s1]?.creditLimit}`,
  );
  check(
    "CSV-bank",
    byCode[codes.s1]?.bankName === "QNB",
    `bank=${byCode[codes.s1]?.bankName}`,
  );
  check(
    "CSV-terms",
    byCode[codes.s2]?.paymentTerms === "Net 45",
    `terms=${byCode[codes.s2]?.paymentTerms}`,
  );

  console.log("\n— Duplicate skip —");
  const dupFd = new FormData();
  dupFd.append("file", csvBlob(csvWithArabic, "dup.csv"));
  dupFd.append("mapping", JSON.stringify(mapping));
  const dup = await api("/api/vendors/import-csv", {
    method: "POST",
    token,
    formData: dupFd,
  });
  check("CSV-dup-skipped", (dup.data?.skipped ?? 0) >= 2, `skipped=${dup.data?.skipped}`);
  check("CSV-dup-created", (dup.data?.created ?? 1) === 0, `created=${dup.data?.created}`);

  console.log("\n— Heuristic import —");
  const hCsv = [
    "Supplier Code,Supplier Name (EN),Category,CR Number,VAT / TIN,Contact Person,Phone,Email,Address,City,Country,Payment Terms,Currency,Bank Name,IBAN,Credit Limit (QAR),Status",
    `${codes.s3},PPE Safety Qatar,PPE,QA-CR-${stamp}3,300011122233344,Sara Ali,+974 1111 2222,ppe@qa${stamp}.test,Zone 5,Lusail,Qatar,COD,QAR,HSBC,QA12HSBC000000000000000000003,120000,Active`,
  ].join("\n");
  const hFd = new FormData();
  hFd.append("file", csvBlob(hCsv, "heuristic.csv"));
  const hImport = await api("/api/vendors/import-csv", {
    method: "POST",
    token,
    formData: hFd,
  });
  check("CSV-heuristic-created", (hImport.data?.created ?? 0) === 1, `created=${hImport.data?.created}`);
  const list2 = await api("/api/vendors?size=500", { token });
  const vendors2 = Array.isArray(list2.data?.content) ? list2.data.content : [];
  const s3 = vendors2.find((v) => v.vendorCode === codes.s3);
  if (s3?.id) createdIds.push(s3.id);
  check("CSV-heuristic-ppe", s3?.categoryName === "PPE", `category=${s3?.categoryName}`);

  console.log("\n— Validation —");
  const badFd = new FormData();
  badFd.append("file", csvBlob("foo,bar\n1,2\n", "bad.csv"));
  const bad = await api("/api/vendors/import-csv", {
    method: "POST",
    token,
    formData: badFd,
  });
  check("CSV-bad-rejected", bad.status >= 400, `bad HTTP ${bad.status}`);
} catch (err) {
  fail("FATAL", err?.message || String(err));
  console.error(err);
} finally {
  console.log("\n— Cleanup —");
  for (const id of [...new Set(createdIds)]) {
    await api(`/api/vendors/${id}`, { method: "DELETE", token });
  }
  pass("CLEANUP", `deleted ${createdIds.length} suppliers`);
}

const ok = results.filter((r) => r.ok).length;
const badn = results.filter((r) => !r.ok).length;
console.log(`\n══ Result: ${ok} passed, ${badn} failed ══\n`);
process.exit(badn > 0 ? 1 : 0);
