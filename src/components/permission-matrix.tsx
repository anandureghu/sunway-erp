import { useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { FolderTree } from "lucide-react";

/**
 * Shared permission tree used by every module's permission editor (HR, Finance,
 * Inventory). It renders a sidebar-style tree — sub-module branch → pages — with
 * per-page View/Create/Edit/Delete/Approve toggles plus branch- and page-level
 * "select all". It is fully controlled: the parent owns the caps state.
 */

export type CapKey =
  | "view_own"
  | "view_all"
  | "create"
  | "edit"
  | "delete"
  | "approve";

export const CAP_COLUMNS: { key: CapKey; label: string }[] = [
  { key: "view_own", label: "View (Own)" },
  { key: "view_all", label: "View (All)" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
];

/** Canonical AppModule key — uppercase, underscores only (e.g. "INVENTORY_STOCK"). */
export const normalizeModuleKey = (mod: string): string =>
  mod.toUpperCase().replace(/[_-]/g, "_");

export type PermissionModuleRow = {
  /** Backend AppModule id, e.g. "INVENTORY_STOCK". */
  id: string;
  /** Page label shown in the tree. */
  label: string;
  /** Parent sub-module / sidebar entry (tree branch). */
  group?: string;
  /** One-line hint about what the page does. */
  description?: string;
};

export type CapsState = Record<string, Record<string, boolean>>;

/** All-false caps for the given rows, keyed by normalized module id. */
export function emptyCapsFor(modules: PermissionModuleRow[]): CapsState {
  return Object.fromEntries(
    modules.map((m) => [
      normalizeModuleKey(m.id),
      Object.fromEntries(CAP_COLUMNS.map((c) => [c.key, false])),
    ]),
  );
}

/** Number of granted capabilities across the given rows. */
export function countGrantedCaps(
  modules: PermissionModuleRow[],
  caps: CapsState,
): number {
  return modules.reduce((sum, m) => {
    const row = caps[normalizeModuleKey(m.id)];
    return sum + (row ? Object.values(row).filter(Boolean).length : 0);
  }, 0);
}

interface Props {
  modules: PermissionModuleRow[];
  caps: CapsState;
  onChange: (next: CapsState) => void;
}

export default function PermissionMatrix({ modules, caps, onChange }: Props) {
  const grouped = useMemo(() => {
    const groups: { group: string; items: PermissionModuleRow[] }[] = [];
    const indexByGroup = new Map<string, number>();
    for (const mod of modules) {
      const g = mod.group ?? "";
      if (!indexByGroup.has(g)) {
        indexByGroup.set(g, groups.length);
        groups.push({ group: g, items: [] });
      }
      groups[indexByGroup.get(g)!].items.push(mod);
    }
    return groups;
  }, [modules]);

  const capOn = (modId: string, cap: string) =>
    !!caps?.[normalizeModuleKey(modId)]?.[cap];

  const pageAllOn = (modId: string) =>
    CAP_COLUMNS.every((c) => capOn(modId, c.key));

  const setCap = (modId: string, cap: string, value: boolean) => {
    const key = normalizeModuleKey(modId);
    onChange({ ...caps, [key]: { ...caps[key], [cap]: value } });
  };

  const setPage = (modId: string, on: boolean) => {
    const key = normalizeModuleKey(modId);
    onChange({
      ...caps,
      [key]: Object.fromEntries(CAP_COLUMNS.map((c) => [c.key, on])),
    });
  };

  const setBranch = (items: PermissionModuleRow[], on: boolean) => {
    const next = { ...caps };
    items.forEach((m) => {
      next[normalizeModuleKey(m.id)] = Object.fromEntries(
        CAP_COLUMNS.map((c) => [c.key, on]),
      );
    });
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      {/* Column header */}
      <div className="grid grid-cols-[240px_repeat(6,1fr)] border-b border-slate-200 bg-slate-50">
        <div className="p-2.5 text-xs font-semibold uppercase text-slate-600">
          Page
        </div>
        {CAP_COLUMNS.map((c) => (
          <div
            key={c.key}
            className="p-2.5 text-center text-xs font-semibold uppercase text-slate-600"
          >
            {c.label}
          </div>
        ))}
      </div>

      {grouped.map(({ group, items }) => {
        const branchOn = items.every((m) => pageAllOn(m.id));
        return (
          <div key={group || "_ungrouped"}>
            {/* Branch (sub-module) header with a branch-wide toggle */}
            {group && (
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/70 px-3 py-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <FolderTree className="h-3.5 w-3.5 text-slate-400" />
                  {group}
                </div>
                <button
                  type="button"
                  onClick={() => setBranch(items, !branchOn)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  {branchOn ? "Deselect branch" : "Select branch"}
                </button>
              </div>
            )}

            {/* Leaf rows = pages, indented under their branch */}
            {items.map((mod) => {
              const normalizedMod = normalizeModuleKey(mod.id);
              return (
                <div
                  key={mod.id}
                  className="grid grid-cols-[240px_repeat(6,1fr)] border-b border-slate-100 last:border-0"
                >
                  <div className={`py-2.5 pr-3 ${group ? "pl-7" : "pl-3"}`}>
                    <p className="text-sm font-medium text-slate-900">
                      {mod.label}
                    </p>
                    {mod.description && (
                      <p className="text-[11px] leading-tight text-slate-400">
                        {mod.description}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(mod.id, !pageAllOn(mod.id))}
                      className="mt-0.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {pageAllOn(mod.id) ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  {CAP_COLUMNS.map((cap) => (
                    <div
                      key={cap.key}
                      className="flex items-center justify-center p-3"
                    >
                      <Switch
                        checked={!!caps?.[normalizedMod]?.[cap.key]}
                        onCheckedChange={(checked) =>
                          setCap(mod.id, cap.key, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
