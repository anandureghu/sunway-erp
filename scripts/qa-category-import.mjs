#!/usr/bin/env node
/**
 * E2E QA for category GL field + CSV bulk upload (preview → import).
 * Requires backend on API_BASE (default http://127.0.0.1:8080).
 *
 *   npm run qa:category-import
 *   node ./scripts/qa-category-import.mjs
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

function csvBlob(content, name = "categories.csv") {
  return new File([content], name, { type: "text/csv" });
}

console.log("\n══ Category GL + CSV Import E2E QA ══\n");
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
const catCode = `QA-CAT-${stamp}`;
const catCode2 = `QA-CAT2-${stamp}`;
const sc1 = `QA-SC1-${stamp}`;
const sc2 = `QA-SC2-${stamp}`;
const sc3 = `QA-SC3-${stamp}`;
const createdIds = [];

try {
  // ── Manual create with optional GL ─────────────────────────────────────
  console.log("\n— Create category with optional GL —");
  const createParent = await api("/api/inventory/categories", {
    method: "POST",
    token,
    body: {
      code: catCode,
      name: `QA HVAC ${stamp}`,
      status: "active",
      glAccountCode: null,
    },
  });
  check(
    "CAT-create-parent",
    createParent.status === 200 || createParent.status === 201,
    `create parent HTTP ${createParent.status}`,
  );
  const parent = createParent.data;
  if (parent?.id) createdIds.push(parent.id);
  check(
    "CAT-gl-null",
    parent?.glAccountCode == null || parent?.glAccountCode === "",
    `parent GL empty (${parent?.glAccountCode ?? "null"})`,
  );

  const createSub = await api("/api/inventory/categories", {
    method: "POST",
    token,
    body: {
      code: sc1,
      name: `QA Air Conditioning ${stamp}`,
      status: "active",
      parentId: parent.id,
      glAccountCode: "5100-100",
    },
  });
  check(
    "CAT-create-sub-gl",
    createSub.status === 200 || createSub.status === 201,
    `create sub HTTP ${createSub.status}`,
  );
  if (createSub.data?.id) createdIds.push(createSub.data.id);
  check(
    "CAT-sub-gl",
    createSub.data?.glAccountCode === "5100-100",
    `sub GL=${createSub.data?.glAccountCode}`,
  );

  const updateClearGl = await api(`/api/inventory/categories/${createSub.data.id}`, {
    method: "PUT",
    token,
    body: {
      name: createSub.data.name,
      status: "active",
      glAccountCode: null,
    },
  });
  check(
    "CAT-clear-gl",
    updateClearGl.status === 200 &&
      (updateClearGl.data?.glAccountCode == null ||
        updateClearGl.data?.glAccountCode === ""),
    "cleared optional GL",
  );
  const updateSetGl = await api(`/api/inventory/categories/${createSub.data.id}`, {
    method: "PUT",
    token,
    body: {
      name: createSub.data.name,
      status: "active",
      glAccountCode: "5100-200",
    },
  });
  check(
    "CAT-set-gl",
    updateSetGl.data?.glAccountCode === "5100-200",
    `updated GL=${updateSetGl.data?.glAccountCode}`,
  );

  // ── Preview with spreadsheet-style headers + Arabic column ─────────────
  console.log("\n— CSV preview (template + Arabic ignored) —");
  const csvWithArabic = [
    "Category Code,Category Name (EN),Category Name (AR),Sub-Category Code,Sub-Category Name,GL Account Code,Status",
    `${catCode2},Electrical,كهرباء,${sc2},Lighting,5200-100,Active`,
    `${catCode2},Electrical,كهرباء,${sc3},Switches,,Active`,
  ].join("\n");

  const previewFd = new FormData();
  previewFd.append("file", csvBlob(csvWithArabic, "preview.csv"));
  const preview = await api("/api/inventory/categories/import-csv/preview", {
    method: "POST",
    token,
    formData: previewFd,
  });
  check(
    "CSV-preview-http",
    preview.status === 200,
    `preview HTTP ${preview.status}`,
  );
  const mapping = preview.data?.fieldMapping || {};
  check(
    "CSV-map-cat-code",
    mapping["Category Code"] === "categoryCode",
    `Category Code → ${mapping["Category Code"]}`,
  );
  check(
    "CSV-map-cat-name",
    mapping["Category Name (EN)"] === "categoryName",
    `Category Name (EN) → ${mapping["Category Name (EN)"]}`,
  );
  check(
    "CSV-ignore-ar",
    mapping["Category Name (AR)"] == null ||
      mapping["Category Name (AR)"] === "",
    `Arabic ignored → ${mapping["Category Name (AR)"]}`,
  );
  check(
    "CSV-map-sub-code",
    mapping["Sub-Category Code"] === "subCategoryCode",
    `Sub-Category Code → ${mapping["Sub-Category Code"]}`,
  );
  check(
    "CSV-map-sub-name",
    mapping["Sub-Category Name"] === "subCategoryName",
    `Sub-Category Name → ${mapping["Sub-Category Name"]}`,
  );
  check(
    "CSV-map-gl",
    mapping["GL Account Code"] === "glAccountCode",
    `GL Account Code → ${mapping["GL Account Code"]}`,
  );
  check(
    "CSV-map-status",
    mapping["Status"] === "status",
    `Status → ${mapping["Status"]}`,
  );
  check(
    "CSV-preview-rows",
    preview.data?.dataRowCount === 2,
    `dataRowCount=${preview.data?.dataRowCount}`,
  );
  check(
    "CSV-preview-ai-flag",
    typeof preview.data?.aiMapped === "boolean",
    `aiMapped=${preview.data?.aiMapped}`,
  );

  // ── Import with confirmed mapping ──────────────────────────────────────
  console.log("\n— CSV import confirm —");
  const importFd = new FormData();
  importFd.append("file", csvBlob(csvWithArabic, "import.csv"));
  importFd.append("mapping", JSON.stringify(mapping));
  const imported = await api("/api/inventory/categories/import-csv", {
    method: "POST",
    token,
    formData: importFd,
  });
  check(
    "CSV-import-http",
    imported.status === 200,
    `import HTTP ${imported.status}`,
  );
  check(
    "CSV-import-created",
    (imported.data?.created ?? 0) >= 3,
    `created=${imported.data?.created} (expect ≥3: 1 parent + 2 subs)`,
  );
  check(
    "CSV-import-parents",
    (imported.data?.parentsCreated ?? 0) >= 1,
    `parentsCreated=${imported.data?.parentsCreated}`,
  );
  check(
    "CSV-import-subs",
    (imported.data?.subCategoriesCreated ?? 0) >= 2,
    `subCategoriesCreated=${imported.data?.subCategoriesCreated}`,
  );
  check(
    "CSV-import-failed",
    (imported.data?.failed ?? 1) === 0,
    `failed=${imported.data?.failed}`,
  );

  // ── Verify persisted hierarchy + optional GL ───────────────────────────
  console.log("\n— Verify imported data —");
  const list = await api("/api/inventory/categories", { token });
  const parents = Array.isArray(list.data) ? list.data : [];
  const importedParent = parents.find(
    (c) => (c.code || "").toUpperCase() === catCode2.toUpperCase(),
  );
  check("CSV-parent-found", !!importedParent, `found parent ${catCode2}`);
  if (importedParent?.id) createdIds.push(importedParent.id);

  const children = await api(
    `/api/inventory/categories/${importedParent.id}/children`,
    { token },
  );
  const kids = Array.isArray(children.data) ? children.data : [];
  kids.forEach((k) => {
    if (k?.id) createdIds.push(k.id);
  });
  const lighting = kids.find((k) => (k.code || "").toUpperCase() === sc2.toUpperCase());
  const switches = kids.find((k) => (k.code || "").toUpperCase() === sc3.toUpperCase());
  check("CSV-sub-lighting", !!lighting, `found ${sc2}`);
  check("CSV-sub-switches", !!switches, `found ${sc3}`);
  check(
    "CSV-gl-present",
    lighting?.glAccountCode === "5200-100",
    `lighting GL=${lighting?.glAccountCode}`,
  );
  check(
    "CSV-gl-optional-empty",
    switches?.glAccountCode == null || switches?.glAccountCode === "",
    `switches GL empty (${switches?.glAccountCode ?? "null"})`,
  );

  // ── Re-import same file → skip duplicates ──────────────────────────────
  console.log("\n— Duplicate skip —");
  const dupFd = new FormData();
  dupFd.append("file", csvBlob(csvWithArabic, "dup.csv"));
  dupFd.append("mapping", JSON.stringify(mapping));
  const dup = await api("/api/inventory/categories/import-csv", {
    method: "POST",
    token,
    formData: dupFd,
  });
  check("CSV-dup-http", dup.status === 200, `dup import HTTP ${dup.status}`);
  check(
    "CSV-dup-skipped",
    (dup.data?.skipped ?? 0) >= 2,
    `skipped=${dup.data?.skipped}`,
  );
  check(
    "CSV-dup-no-new-subs",
    (dup.data?.subCategoriesCreated ?? 0) === 0,
    `subCategoriesCreated=${dup.data?.subCategoriesCreated}`,
  );

  // ── Import without mapping part (server-side heuristic) ────────────────
  console.log("\n— Heuristic import (no client mapping) —");
  const hCode = `QA-H-${stamp}`;
  const hSc = `QA-HS-${stamp}`;
  const heuristicCsv = [
    "Category Code,Category Name (EN),Sub-Category Code,Sub-Category Name,GL Account Code,Status",
    `${hCode},Plumbing,${hSc},Pipes,5300-100,Active`,
  ].join("\n");
  const hFd = new FormData();
  hFd.append("file", csvBlob(heuristicCsv, "heuristic.csv"));
  const hImport = await api("/api/inventory/categories/import-csv", {
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
    (hImport.data?.created ?? 0) >= 2,
    `created=${hImport.data?.created}`,
  );
  const list2 = await api("/api/inventory/categories", { token });
  const hParent = (Array.isArray(list2.data) ? list2.data : []).find(
    (c) => (c.code || "").toUpperCase() === hCode.toUpperCase(),
  );
  if (hParent?.id) createdIds.push(hParent.id);
  if (hParent?.id) {
    const hKids = await api(`/api/inventory/categories/${hParent.id}/children`, {
      token,
    });
    (Array.isArray(hKids.data) ? hKids.data : []).forEach((k) => {
      if (k?.id) createdIds.push(k.id);
    });
    const pipe = (Array.isArray(hKids.data) ? hKids.data : []).find(
      (k) => (k.code || "").toUpperCase() === hSc.toUpperCase(),
    );
    check(
      "CSV-heuristic-gl",
      pipe?.glAccountCode === "5300-100",
      `pipe GL=${pipe?.glAccountCode}`,
    );
  } else {
    fail("CSV-heuristic-gl", "parent not found after heuristic import");
  }

  // ── Bad file ───────────────────────────────────────────────────────────
  console.log("\n— Validation —");
  const badFd = new FormData();
  badFd.append(
    "file",
    csvBlob("foo,bar\n1,2\n", "bad.csv"),
  );
  const bad = await api("/api/inventory/categories/import-csv", {
    method: "POST",
    token,
    formData: badFd,
  });
  check(
    "CSV-bad-rejected",
    bad.status >= 400,
    `bad CSV rejected HTTP ${bad.status}`,
  );
} catch (err) {
  fail("FATAL", err?.message || String(err));
  console.error(err);
} finally {
  console.log("\n— Cleanup —");
  // Delete children first, then parents
  const unique = [...new Set(createdIds)].reverse();
  for (const id of unique) {
    await api(`/api/inventory/categories/${id}`, { method: "DELETE", token });
  }
  // Second pass for parents that failed due to children order
  for (const id of unique) {
    await api(`/api/inventory/categories/${id}`, { method: "DELETE", token });
  }
  pass("CLEANUP", `attempted delete of ${unique.length} ids`);
}

const ok = results.filter((r) => r.ok).length;
const bad = results.filter((r) => !r.ok).length;
console.log(`\n══ Result: ${ok} passed, ${bad} failed ══\n`);
process.exit(bad > 0 ? 1 : 0);
