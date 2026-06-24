import { normalizeModuleKey } from "@/components/permission-matrix";

/**
 * Metadata that turns each catalog page into a set of named permission cards
 * (like `hr:leaves:create`). The card UI is a presentation over the existing
 * module + own/all backend: a "Simple" card toggles the own+all pair for an
 * action, an "Advanced" card toggles a single own/all cap key.
 */

export type SimpleAction = "view" | "create" | "edit" | "delete" | "approve";

const DEFAULT_ACTIONS: SimpleAction[] = ["view", "create", "edit", "delete"];

/**
 * The actions that apply to each page, matched to the actions the backend
 * controllers actually enforce (so we never show a verb the API ignores):
 *  - reports are read-only,
 *  - pages whose controllers post/confirm/approve get Approve,
 *  - pages with no DELETE endpoint (ledger, journal, budget, items, stock,
 *    receipts) omit Delete.
 * Anything not listed falls back to full view/create/edit/delete.
 */
const PAGE_ACTIONS: Record<string, SimpleAction[]> = {
  // ── HR ──
  EMPLOYEE_PROFILE: ["view", "create", "edit", "delete"],
  CURRENT_JOB: ["view", "create", "edit", "delete"],
  DEPENDENTS: ["view", "create", "edit", "delete"],
  IMMIGRATION: ["view", "create", "edit", "delete"],
  SALARY: ["view", "create", "edit", "delete"],
  PAYROLL: ["view", "create", "edit"],
  LOANS: ["view", "create", "edit", "delete", "approve"],
  LEAVES: ["view", "create", "edit", "delete", "approve"],
  APPRAISAL: ["view", "create", "edit", "delete", "approve"],
  HR_REPORTS: ["view"],
  HR_SETTINGS: ["view", "create", "edit", "delete"],
  // ── Finance ──
  FINANCE_INVOICE: ["view", "create", "edit", "delete"],
  FINANCE_PAYMENT: ["view", "create", "edit", "delete", "approve"],
  FINANCE_LEDGER: ["view", "create", "edit", "approve"],
  FINANCE_JOURNAL: ["view", "create", "edit", "approve"],
  FINANCE_REPORTS: ["view"],
  FINANCE_COA: ["view", "create", "edit", "delete"],
  FINANCE_BUDGET: ["view", "create", "edit"],
  FINANCE_RECONCILIATION: ["view", "create", "edit", "approve"],
  // ── Inventory ──
  INVENTORY_STOCK: ["view", "create", "edit", "approve"],
  INVENTORY_ITEM: ["view", "create", "edit"],
  INVENTORY_SALES: ["view", "create", "edit", "delete"],
  INVENTORY_PURCHASE: ["view", "create", "edit", "delete", "approve"],
  INVENTORY_RECEIPT: ["view", "create", "edit"],
  INVENTORY_CATEGORY: ["view", "create", "edit", "delete"],
  INVENTORY_WAREHOUSE: ["view", "create", "edit", "delete"],
};

/** Pages whose management is reserved for administrators (badge only). */
const ADMIN_ONLY = new Set(["HR_SETTINGS"]);

/** The Simple actions that apply to a given page. */
export function pageActions(moduleId: string): SimpleAction[] {
  return PAGE_ACTIONS[normalizeModuleKey(moduleId)] ?? DEFAULT_ACTIONS;
}

export function isAdminOnly(moduleId: string): boolean {
  return ADMIN_ONLY.has(normalizeModuleKey(moduleId));
}

/** The two own/all cap keys behind a scoped Simple action. */
export const SCOPED_KEYS: Record<
  Exclude<SimpleAction, "approve">,
  [string, string]
> = {
  view: ["view_own", "view_all"],
  create: ["create_own", "create_all"],
  edit: ["edit_own", "edit_all"],
  delete: ["delete_own", "delete_all"],
};

/** The cap keys an action controls (approve is a single, unscoped key). */
export function actionCapKeys(action: SimpleAction): string[] {
  return action === "approve" ? ["approve"] : SCOPED_KEYS[action];
}

/** Namespaced permission code, e.g. `hr:leaves:create` or `hr:leaves:create:own`. */
export function permissionCode(
  moduleId: string,
  action: SimpleAction,
  scope?: "own" | "all",
): string {
  const id = normalizeModuleKey(moduleId);
  let area = "hr";
  let page = id;
  if (id.startsWith("FINANCE_")) {
    area = "finance";
    page = id.slice("FINANCE_".length);
  } else if (id.startsWith("INVENTORY_")) {
    area = "inventory";
    page = id.slice("INVENTORY_".length);
  }
  const slug = page.toLowerCase().replace(/_/g, "-");
  return scope
    ? `${area}:${slug}:${action}:${scope}`
    : `${area}:${slug}:${action}`;
}

const ACTION_VERB: Record<SimpleAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  approve: "Approve",
};

export function actionTitle(
  action: SimpleAction,
  label: string,
  scope?: "own" | "all",
): string {
  const verb = ACTION_VERB[action];
  if (!scope) return `${verb} ${label}`;
  return `${verb} ${scope === "own" ? "Own" : "All"} · ${label}`;
}

export function actionDescription(
  action: SimpleAction,
  label: string,
  scope?: "own" | "all",
): string {
  const lower = label.toLowerCase();
  const note =
    scope === "own"
      ? " — limited to their own records"
      : scope === "all"
        ? " — across every record"
        : "";
  switch (action) {
    case "view":
      return `See and open ${lower}${note}.`;
    case "create":
      return `Add new ${lower}${note}.`;
    case "edit":
      return `Modify existing ${lower}${note}.`;
    case "delete":
      return `Remove ${lower}${note}.`;
    case "approve":
      return `Approve or reject ${lower} submitted for review.`;
  }
}
