import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ShieldAlert,
  FileText,
  Contact2,
  Landmark,
  ChevronRight,
} from "lucide-react";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
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

export default function ImmigrationExpiryPage() {
  const [withinDays, setWithinDays] = useState(30);
  const [items, setItems] = useState<ImmigrationExpiryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (days: number) => {
    setLoading(true);
    try {
      setItems(await immigrationService.getExpiring(days));
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to load expiry report";
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
    <div className="space-y-6 p-6 bg-slate-50/60 min-h-screen">
      <SecondaryPageHeader
        title="Immigration Expiry"
        description="Passports & residence permits that are expired or expiring soon"
        icon={<ShieldAlert className="h-5 w-5" />}
      />

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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[140px_1fr_1fr_130px_150px_40px] gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          <div>Document</div>
          <div>Employee</div>
          <div>Number</div>
          <div>Expiry</div>
          <div>Status</div>
          <div />
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
          items.map((it) => (
            <Link
              key={`${it.documentType}-${it.employeeId}-${it.documentNumber}`}
              to={`/hr/employees/${it.employeeId}/immigration${
                it.documentType === "RESIDENCE_PERMIT"
                  ? "/residence-permit"
                  : ""
              }`}
              className="grid grid-cols-[140px_1fr_1fr_130px_150px_40px] items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-0 hover:bg-slate-50"
            >
              <div className="flex items-center gap-2 text-slate-600">
                {it.documentType === "RESIDENCE_PERMIT" ? (
                  <Landmark className="h-4 w-4 text-indigo-500" />
                ) : (
                  <Contact2 className="h-4 w-4 text-emerald-500" />
                )}
                <span className="text-xs font-medium">
                  {it.documentType === "RESIDENCE_PERMIT"
                    ? "Residence"
                    : "Passport"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">
                  {it.employeeName || "—"}
                </p>
                {it.employeeCode && (
                  <p className="truncate text-xs text-slate-400">
                    {it.employeeCode}
                  </p>
                )}
              </div>
              <div className="truncate font-mono text-xs text-slate-600">
                {it.documentNumber}
              </div>
              <div className="text-slate-600">{it.expiryDate}</div>
              <div>
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadge(it)}`}
                >
                  {daysLabel(it.daysRemaining)}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
