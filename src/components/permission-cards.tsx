import { useMemo, useState } from "react";
import { Check, Minus, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  normalizeModuleKey,
  type PermissionModuleRow,
  type CapsState,
} from "@/components/permission-matrix";
import {
  pageActions,
  isAdminOnly,
  actionCapKeys,
  permissionCode,
  actionTitle,
  actionDescription,
} from "@/lib/permission-card-meta";

/**
 * Page-level permission editor rendered as a card grid (mirrors the product's
 * permission reference UI). Each card is a named permission derived from a page
 * + action. A "Simple" card toggles the own+all pair for an action; "Advanced"
 * splits each scoped action into Own and All cards. Fully controlled — the
 * parent owns the same `caps` state the matrix used, so save/load is unchanged.
 */

type Mode = "simple" | "advanced";

type CardDef = {
  id: string; // unique within the page
  modId: string; // normalized module key
  capKeys: string[]; // granular cap keys this card controls
  title: string;
  description: string;
  code: string;
  adminOnly: boolean;
};

interface Props {
  modules: PermissionModuleRow[];
  caps: CapsState;
  onChange: (next: CapsState) => void;
}

function buildCards(mod: PermissionModuleRow, mode: Mode): CardDef[] {
  const modId = normalizeModuleKey(mod.id);
  const adminOnly = isAdminOnly(mod.id);
  const cards: CardDef[] = [];
  for (const action of pageActions(mod.id)) {
    if (mode === "simple" || action === "approve") {
      cards.push({
        id: `${action}`,
        modId,
        capKeys: actionCapKeys(action),
        title: actionTitle(action, mod.label),
        description: actionDescription(action, mod.label),
        code: permissionCode(mod.id, action),
        adminOnly,
      });
    } else {
      // Advanced: split the scoped action into Own and All cards.
      (["own", "all"] as const).forEach((scope) => {
        const key = scope === "own" ? actionCapKeys(action)[0] : actionCapKeys(action)[1];
        cards.push({
          id: `${action}_${scope}`,
          modId,
          capKeys: [key],
          title: actionTitle(action, mod.label, scope),
          description: actionDescription(action, mod.label, scope),
          code: permissionCode(mod.id, action, scope),
          adminOnly,
        });
      });
    }
  }
  return cards;
}

export default function PermissionCards({ modules, caps, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("simple");
  const [query, setQuery] = useState("");

  const capOn = (modId: string, key: string) =>
    !!caps?.[normalizeModuleKey(modId)]?.[key];

  // Group pages by their sub-module branch, preserving catalog order.
  const grouped = useMemo(() => {
    const groups: { group: string; items: PermissionModuleRow[] }[] = [];
    const byGroup = new Map<string, number>();
    for (const mod of modules) {
      const g = mod.group ?? "";
      if (!byGroup.has(g)) {
        byGroup.set(g, groups.length);
        groups.push({ group: g, items: [] });
      }
      groups[byGroup.get(g)!].items.push(mod);
    }
    return groups;
  }, [modules]);

  // All cards for the current mode, keyed by page, with search applied.
  const cardsByMod = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, CardDef[]>();
    for (const mod of modules) {
      let cards = buildCards(mod, mode);
      if (q) {
        cards = cards.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            mod.label.toLowerCase().includes(q) ||
            (mod.group ?? "").toLowerCase().includes(q),
        );
      }
      map.set(normalizeModuleKey(mod.id), cards);
    }
    return map;
  }, [modules, mode, query]);

  const cardState = (card: CardDef): "on" | "partial" | "off" => {
    const all = card.capKeys.every((k) => capOn(card.modId, k));
    if (all) return "on";
    const some = card.capKeys.some((k) => capOn(card.modId, k));
    return some ? "partial" : "off";
  };

  const setCards = (cards: CardDef[], value: boolean) => {
    const next: CapsState = { ...caps };
    for (const card of cards) {
      const cur = next[card.modId] ?? {};
      next[card.modId] = {
        ...cur,
        ...Object.fromEntries(card.capKeys.map((k) => [k, value])),
      };
    }
    onChange(next);
  };

  const toggleCard = (card: CardDef) =>
    setCards([card], cardState(card) !== "on");

  // ── Counters ──
  const allCards = useMemo(
    () => Array.from(cardsByMod.values()).flat(),
    [cardsByMod],
  );
  const total = allCards.length;
  const granted = allCards.filter((c) => cardState(c) === "on").length;
  const allOn = total > 0 && granted === total;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="text-sm font-semibold text-slate-700">
          Page access{" "}
          <span className="font-normal text-slate-400">
            ({granted} of {total} permissions)
          </span>
        </div>

        {/* Simple / Advanced segmented toggle */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-sm">
          {(["simple", "advanced"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-3 py-1 font-medium capitalize transition-colors",
                mode === m
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <CheckBox state={allOn ? "on" : granted > 0 ? "partial" : "off"} />
          Select all
          <input
            type="checkbox"
            className="sr-only"
            checked={allOn}
            onChange={() => setCards(allCards, !allOn)}
          />
        </label>
      </div>

      {/* Search */}
      <div className="border-b border-slate-100 px-4 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search permissions…"
          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
        />
      </div>

      {/* Groups */}
      <div className="max-h-[55vh] space-y-6 overflow-y-auto p-4">
        {grouped.map(({ group, items }) => {
          const groupCards = items.flatMap(
            (m) => cardsByMod.get(normalizeModuleKey(m.id)) ?? [],
          );
          if (groupCards.length === 0) return null;
          const gGranted = groupCards.filter(
            (c) => cardState(c) === "on",
          ).length;
          const gAllOn = gGranted === groupCards.length;
          return (
            <section key={group || "_"}>
              {/* Group header */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <FolderTree className="h-4 w-4 text-slate-400" />
                  {group || "General"}
                  <span className="font-normal text-slate-400">
                    ({gGranted}/{groupCards.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCards(groupCards, !gAllOn)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  {gAllOn ? "Deselect all" : "Select all"}
                </button>
              </div>

              {/* Cards for each page in this group */}
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {items.flatMap((m) => {
                  const cards = cardsByMod.get(normalizeModuleKey(m.id)) ?? [];
                  return cards.map((card) => {
                    const state = cardState(card);
                    return (
                      <button
                        key={`${card.modId}:${card.id}`}
                        type="button"
                        onClick={() => toggleCard(card)}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                          state === "off"
                            ? "border-slate-200 bg-white hover:border-slate-300"
                            : "border-blue-300 bg-blue-50/40",
                        )}
                      >
                        <CheckBox state={state} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {card.title}
                            </p>
                            {card.adminOnly && (
                              <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                Admin only
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs leading-snug text-slate-500">
                            {card.description}
                          </p>
                          <p className="mt-1 font-mono text-[11px] text-slate-400">
                            {card.code}
                          </p>
                        </div>
                      </button>
                    );
                  });
                })}
              </div>
            </section>
          );
        })}

        {allCards.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            No permissions match “{query}”.
          </p>
        )}
      </div>
    </div>
  );
}

function CheckBox({ state }: { state: "on" | "partial" | "off" }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
        state === "on"
          ? "border-blue-600 bg-blue-600 text-white"
          : state === "partial"
            ? "border-blue-400 bg-blue-100 text-blue-600"
            : "border-slate-300 bg-white",
      )}
    >
      {state === "on" && <Check className="h-3.5 w-3.5" />}
      {state === "partial" && <Minus className="h-3.5 w-3.5" />}
    </span>
  );
}
