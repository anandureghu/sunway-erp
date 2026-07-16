import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ShieldAlert, FileText, Contact2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  immigrationService,
  type ImmigrationExpiryItem,
} from "@/service/immigrationService";

const WINDOWS = [
  { label: "Next 30 days", value: 30 },
  { label: "Next 60 days", value: 60 },
  { label: "Next 90 days", value: 90 },
];

function statusBadge(item: ImmigrationExpiryItem) {
  if (item.status === "EXPIRED" || item.daysRemaining < 0) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (item.daysRemaining <= 30) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-yellow-50 text-yellow-700 border-yellow-200";
}

function daysLabel(d: number) {
  if (d < 0)
    return `Expired ${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} ago`;
  if (d === 0) return "Expires today";
  return `${d} day${d === 1 ? "" : "s"} left`;
}

/**
 * Immigration expiry report — passports & residence permits that are expired or
 * expiring soon. The backend scopes the rows to the caller's IMMIGRATION grant:
 * VIEW_ALL returns every employee in the company, VIEW_OWN only the caller's own
 * documents. This component just renders whatever it receives.
 */
export default function ImmigrationExpiryReport() {
  const [withinDays, setWithinDays] = useState(30);
  const [items, setItems] = useState<ImmigrationExpiryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (days: number) => {
    setLoading(true);
    try {
      setItems(await immigrationService.getExpiring(days));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load expiry report";
      toast.error(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(withinDays);
  }, [withinDays, load]);

  const expiredCount = items.filter((i) => i.daysRemaining < 0).length;
  const soonCount = items.length - expiredCount;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-rose-500" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Immigration Expiry
        </h3>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {WINDOWS.map((w) => (
            <Button
              key={w.value}
              variant={withinDays === w.value ? "default" : "outline"}
              size="sm"
              onClick={() => setWithinDays(w.value)}
            >
              {w.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-medium text-rose-700">
            {expiredCount} expired
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-700">
            {soonCount} expiring
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[1.4fr_110px_130px_1fr_120px_130px_100px] gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <div>Employee Name</div>
            <div>Emp. Code</div>
            <div>Document</div>
            <div>Doc. Code</div>
            <div>Expiry Date</div>
            <div>Days Left</div>
            <div>Status</div>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <FileText className="mx-auto mb-2 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">
                Nothing expiring in this window.
              </p>
            </div>
          ) : (
            items.map((it) => {
              const expired = it.status === "EXPIRED" || it.daysRemaining < 0;
              return (
                <Link
                  key={`${it.documentType}-${it.employeeId}-${it.documentNumber}`}
                  to={`/hr/employees/${it.employeeId}/immigration${
                    it.documentType === "RESIDENCE_PERMIT"
                      ? "/residence-permit"
                      : ""
                  }`}
                  className="grid grid-cols-[1.4fr_110px_130px_1fr_120px_130px_100px] items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-0 hover:bg-slate-50"
                >
                  <div className="truncate font-medium text-slate-800">
                    {it.employeeName || "—"}
                  </div>
                  <div className="truncate font-mono text-xs text-slate-500">
                    {it.employeeCode || "—"}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    {it.documentType === "RESIDENCE_PERMIT" ? (
                      <Landmark className="h-4 w-4 shrink-0 text-indigo-500" />
                    ) : (
                      <Contact2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    )}
                    <span className="text-xs font-medium">
                      {it.documentType === "RESIDENCE_PERMIT"
                        ? "Residence"
                        : "Passport"}
                    </span>
                  </div>
                  <div className="truncate font-mono text-xs text-slate-600">
                    {it.documentNumber}
                  </div>
                  <div className="text-xs text-slate-600">{it.expiryDate}</div>
                  <div>
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadge(it)}`}
                    >
                      {daysLabel(it.daysRemaining)}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        expired
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {expired ? "Expired" : "Active"}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
