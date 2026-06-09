import { COA } from "@/types/coa";

export function coaTypeLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return COA.find((entry) => entry.key === type)?.label ?? type;
}

export function coaTypeBadgeClass(type: string | null | undefined): string {
  const key = (type ?? "").toUpperCase();
  if (key === "ASSET" || key === "CASH")
    return "border-sky-200 bg-sky-50 text-sky-800";
  if (key === "LIABILITY") return "border-amber-200 bg-amber-50 text-amber-800";
  if (key === "EQUITY") return "border-violet-200 bg-violet-50 text-violet-800";
  if (key === "REVENUE" || key === "INCOME")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (key === "EXPENSE" || key === "COST")
    return "border-rose-200 bg-rose-50 text-rose-800";
  if (key === "TAX") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (key === "BUDGET") return "border-orange-200 bg-orange-50 text-orange-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}
