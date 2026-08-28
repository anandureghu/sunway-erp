import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Archive,
  ArchiveRestore,
  UserRound,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { hrService } from "@/service/hr.service";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { initialsFrom } from "@/lib/utils";
import type { Employee } from "@/types/hr";

const empName = (e: Employee) =>
  [e.firstName, e.lastName].filter(Boolean).join(" ").trim() ||
  e.employeeNo ||
  "—";

const fmtStatus = (s?: string) =>
  (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function Row({
  e,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  busy,
}: {
  e: Employee;
  actionLabel: string;
  actionIcon: typeof Archive;
  onAction: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-xs font-bold text-white">
        {initialsFrom(empName(e))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-800">{empName(e)}</p>
        <p className="truncate font-mono text-[11px] text-slate-400">
          {e.employeeNo || `EMP-${e.id}`}
          {e.departmentName ? ` · ${e.departmentName}` : ""}
        </p>
      </div>
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        {fmtStatus(e.status)}
      </span>
      <button
        type="button"
        onClick={onAction}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ActionIcon className="h-3.5 w-3.5" />
        )}
        {actionLabel}
      </button>
    </div>
  );
}

/**
 * HR Reports → Archive. Inactive (settled) employees can be archived out of the
 * active working set to keep the database lean; archived staff are kept for records
 * and can be restored.
 */
export function ArchivePanel() {
  const [inactive, setInactive] = useState<Employee[]>([]);
  const [archived, setArchived] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [active, arch] = await Promise.all([
        hrService.listEmployees(),
        hrService.listArchivedEmployees(),
      ]);
      setInactive(
        (Array.isArray(active) ? active : []).filter(
          (e) => String(e.status ?? "").toUpperCase() === "INACTIVE",
        ),
      );
      setArchived(Array.isArray(arch) ? arch : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load archive"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const doArchive = async (e: Employee) => {
    if (e.id == null) return;
    setBusyId(String(e.id));
    try {
      await hrService.archiveEmployee(Number(e.id));
      toast.success(`${empName(e)} archived`);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to archive"));
    } finally {
      setBusyId(null);
    }
  };
  const doRestore = async (e: Employee) => {
    if (e.id == null) return;
    setBusyId(String(e.id));
    try {
      await hrService.unarchiveEmployee(Number(e.id));
      toast.success(`${empName(e)} restored`);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to restore"));
    } finally {
      setBusyId(null);
    }
  };

  const q = search.trim().toLowerCase();
  const flt = (list: Employee[]) =>
    !q
      ? list
      : list.filter((e) =>
          [empName(e), e.employeeNo, e.departmentName]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q),
        );
  const inactiveFiltered = useMemo(() => flt(inactive), [inactive, q]);
  const archivedFiltered = useMemo(() => flt(archived), [archived, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white">
            <Archive className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Employee Archive</h3>
            <p className="text-[11px] text-slate-500">
              Keep the working set lean — archive settled (inactive) staff
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="h-9 w-56 rounded-lg border border-slate-300 pl-8 pr-3 text-sm focus:border-violet-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2 text-[11px] text-sky-700">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Employees become <strong>Inactive</strong> automatically once their final
          settlement payroll is processed. Archiving removes them from every active
          listing (org chart, payroll, dropdowns) while keeping their records.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* ready to archive */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ready to archive
              </p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {inactiveFiltered.length}
              </span>
            </div>
            {inactiveFiltered.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-sm text-slate-400">
                <UserRound className="mb-1 h-7 w-7 text-slate-200" />
                No inactive employees.
              </div>
            ) : (
              inactiveFiltered.map((e) => (
                <Row
                  key={e.id}
                  e={e}
                  actionLabel="Archive"
                  actionIcon={Archive}
                  onAction={() => doArchive(e)}
                  busy={busyId === String(e.id)}
                />
              ))
            )}
          </div>

          {/* archived */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Archived
              </p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {archivedFiltered.length}
              </span>
            </div>
            {archivedFiltered.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-sm text-slate-400">
                <Archive className="mb-1 h-7 w-7 text-slate-200" />
                Nothing archived yet.
              </div>
            ) : (
              archivedFiltered.map((e) => (
                <Row
                  key={e.id}
                  e={e}
                  actionLabel="Restore"
                  actionIcon={ArchiveRestore}
                  onAction={() => doRestore(e)}
                  busy={busyId === String(e.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArchivePanel;
