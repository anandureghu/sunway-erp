import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  Info,
  Loader2,
  Pencil,
  PartyPopper,
  Repeat,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { useAuth } from "@/context/AuthContext";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { canEditModule } from "@/lib/module-permissions";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import {
  DField,
  DInput,
  DSelect,
  DTextarea,
  DialogSection,
  RecordFormDialog,
} from "@/modules/hr/components/record-form-dialog";
import {
  publicHolidayService,
  type PublicHoliday,
  type PublicHolidayCategory,
  type PublicHolidayInput,
} from "@/service/publicHolidayService";

/**
 * HR Settings → Policies → Public Holidays. HR sets the year's holidays (loading
 * Qatar's official ones or copying last year) and adjusts moving dates such as Eid
 * once announced. Working days inside a holiday are paid days off everywhere:
 * timesheets (not absent), leave (not deducted) and payroll (paid; work on them is
 * holiday overtime).
 */

const CATEGORY_META: Record<
  PublicHolidayCategory,
  { label: string; chip: string; cell: string }
> = {
  NATIONAL: {
    label: "National",
    chip: "border-violet-200 bg-violet-50 text-violet-700",
    cell: "bg-violet-500 text-white",
  },
  RELIGIOUS: {
    label: "Religious",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cell: "bg-emerald-500 text-white",
  },
  COMPANY: {
    label: "Company",
    chip: "border-sky-200 bg-sky-50 text-sky-700",
    cell: "bg-sky-500 text-white",
  },
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
// Qatar week starts on Sunday; Friday & Saturday are the weekend.
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmt = (s: string, withYear = false) =>
  parse(s).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
const rangeLabel = (h: PublicHoliday) =>
  h.startDate === h.endDate
    ? `${parse(h.startDate).toLocaleDateString("en-GB", { weekday: "short" })}, ${fmt(h.startDate, true)}`
    : `${fmt(h.startDate)} – ${fmt(h.endDate, true)}`;

const EMPTY_FORM: PublicHolidayInput = {
  name: "",
  startDate: "",
  endDate: "",
  category: "NATIONAL",
  recurring: false,
  confirmed: true,
  notes: "",
};

export default function PublicHolidaysPanel() {
  const { permissions } = useAuth();
  const { confirm } = useConfirmDialog();
  const canEdit =
    canEditModule(permissions, "HR_SETTINGS") || canEditModule(permissions, "HRS_POLICIES");

  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"load" | "copy" | null>(null);

  // add / edit pop-up
  const [editing, setEditing] = useState<PublicHoliday | "new" | null>(null);
  const [form, setForm] = useState<PublicHolidayInput>(EMPTY_FORM);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHolidays(await publicHolidayService.list(year));
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not load public holidays."));
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void load();
  }, [load]);

  // ── derived ────────────────────────────────────────────────────────────────
  const byDate = useMemo(() => {
    const m = new Map<string, PublicHoliday>();
    holidays.forEach((h) => {
      for (let d = parse(h.startDate); d <= parse(h.endDate); d.setDate(d.getDate() + 1)) {
        m.set(iso(d), h);
      }
    });
    return m;
  }, [holidays]);

  const stats = useMemo(
    () => ({
      count: holidays.length,
      daysOff: holidays.reduce((a, h) => a + (h.totalDays ?? 0), 0),
      paidDays: holidays.reduce((a, h) => a + (h.workingDays ?? 0), 0),
      estimated: holidays.filter((h) => !h.confirmed).length,
    }),
    [holidays],
  );

  const todayIso = iso(new Date());
  const upcoming = holidays.find((h) => h.endDate >= todayIso);

  // ── actions ────────────────────────────────────────────────────────────────
  const openNew = (date?: string) => {
    setForm({ ...EMPTY_FORM, startDate: date ?? "", endDate: date ?? "" });
    setShowErrors(false);
    setEditing("new");
  };

  const openEdit = (h: PublicHoliday) => {
    setForm({
      name: h.name,
      startDate: h.startDate,
      endDate: h.endDate,
      category: h.category,
      recurring: h.recurring,
      confirmed: h.confirmed,
      notes: h.notes ?? "",
    });
    setShowErrors(false);
    setEditing(h);
  };

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Enter the holiday name";
    if (!form.startDate) e.startDate = "Select the start date";
    if (form.endDate && form.startDate && form.endDate < form.startDate)
      e.endDate = "End date cannot be before the start date";
    return e;
  }, [form]);

  const save = async () => {
    setShowErrors(true);
    if (Object.keys(errors).length) {
      toast.error("Please complete the highlighted fields");
      return;
    }
    const payload: PublicHolidayInput = {
      ...form,
      name: form.name.trim(),
      endDate: form.endDate || form.startDate,
      notes: form.notes?.trim() || null,
    };
    setSaving(true);
    try {
      if (editing === "new") {
        await publicHolidayService.create(payload);
        toast.success(`${payload.name} added`);
      } else if (editing) {
        await publicHolidayService.update(editing.id, payload);
        toast.success(`${payload.name} updated`);
      }
      setEditing(null);
      const savedYear = Number(payload.startDate.slice(0, 4));
      if (savedYear !== year) setYear(savedYear);
      else await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the holiday."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (h: PublicHoliday) => {
    const ok = await confirm(
      `Delete "${h.name}" (${rangeLabel(h)})? Those days become normal working days again.`,
    );
    if (!ok) return;
    try {
      await publicHolidayService.remove(h.id);
      toast.success(`${h.name} deleted`);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete the holiday."));
    }
  };

  const markConfirmed = async (h: PublicHoliday) => {
    try {
      await publicHolidayService.update(h.id, { ...h, confirmed: true });
      toast.success(`${h.name} dates confirmed`);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not confirm the holiday."));
    }
  };

  const loadQatar = async () => {
    setBusy("load");
    try {
      const before = holidays.length;
      const list = await publicHolidayService.loadQatar(year);
      setHolidays(list);
      const added = list.length - before;
      toast.success(
        added > 0
          ? `${added} Qatar public holiday${added === 1 ? "" : "s"} added for ${year}. Eid dates are estimates — confirm them once announced.`
          : `Qatar public holidays for ${year} are already in the list.`,
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not load Qatar holidays."));
    } finally {
      setBusy(null);
    }
  };

  const copyPrevious = async () => {
    setBusy("copy");
    try {
      const before = holidays.length;
      const list = await publicHolidayService.copyYear(year - 1, year);
      setHolidays(list);
      const added = list.length - before;
      toast.success(
        added > 0
          ? `${added} holiday${added === 1 ? "" : "s"} copied from ${year - 1}. Review the moving holidays (marked Estimated).`
          : `Nothing new to copy from ${year - 1}.`,
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not copy holidays."));
    } finally {
      setBusy(null);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <SecondaryPageHeader
        title="Public Holidays"
        description="Paid days off for the whole company — set the year's holidays and adjust moving dates like Eid"
        icon={<CalendarDays className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                aria-label="Previous year"
                onClick={() => setYear((y) => y - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-l-xl text-slate-500 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[56px] text-center text-sm font-bold tabular-nums text-slate-800">
                {year}
              </span>
              <button
                type="button"
                aria-label="Next year"
                onClick={() => setYear((y) => y + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-r-xl text-slate-500 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {canEdit && (
              <Button onClick={() => openNew()} className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700">
                <CalendarPlus className="mr-1.5 h-4 w-4" /> Add holiday
              </Button>
            )}
          </div>
        }
      />

      {/* How holidays work */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-[12.5px] text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p>
          A public holiday on a working day (Sun–Thu) is a <strong>paid day off</strong>: employees
          are <strong>not marked absent</strong>, the day is <strong>not deducted from leave</strong>,
          and <strong>payroll pays it</strong>. Anyone who works on a holiday is paid holiday
          overtime. Holidays on Friday or Saturday don't change anything.
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={<PartyPopper className="h-4 w-4" />} label="Holidays" value={stats.count} sub={`in ${year}`} tone="violet" />
        <Tile icon={<CalendarDays className="h-4 w-4" />} label="Days off" value={stats.daysOff} sub="calendar days" tone="blue" />
        <Tile icon={<CheckCircle2 className="h-4 w-4" />} label="Paid working days" value={stats.paidDays} sub="Sun–Thu days off" tone="emerald" />
        <Tile
          icon={<Sparkles className="h-4 w-4" />}
          label="Needs confirmation"
          value={stats.estimated}
          sub={stats.estimated ? "estimated dates" : "all confirmed"}
          tone={stats.estimated ? "amber" : "slate"}
        />
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : holidays.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100">
            <CalendarDays className="h-7 w-7 text-violet-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">No public holidays set for {year}</h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            Start with Qatar's official holidays (Eid dates are estimated until announced) or copy
            last year's list, then adjust the dates.
          </p>
          {canEdit && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={loadQatar} disabled={!!busy} className="h-9 rounded-xl bg-violet-600 hover:bg-violet-700">
                {busy === "load" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Flag className="mr-1.5 h-4 w-4" />}
                Load Qatar public holidays
              </Button>
              <Button variant="outline" onClick={copyPrevious} disabled={!!busy} className="h-9 rounded-xl">
                {busy === "copy" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Copy className="mr-1.5 h-4 w-4" />}
                Copy from {year - 1}
              </Button>
              <Button variant="outline" onClick={() => openNew()} className="h-9 rounded-xl">
                <CalendarPlus className="mr-1.5 h-4 w-4" /> Add manually
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          {/* ── Holiday list ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Holidays in {year}</h3>
                {upcoming && (
                  <p className="text-xs text-slate-500">
                    Next: <span className="font-semibold text-violet-700">{upcoming.name}</span> · {rangeLabel(upcoming)}
                  </p>
                )}
              </div>
              {canEdit && (
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={loadQatar} disabled={!!busy} className="h-8 rounded-lg text-xs" title="Add any missing Qatar official holidays">
                    {busy === "load" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />}
                    <span className="ml-1 hidden sm:inline">Qatar</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyPrevious} disabled={!!busy} className="h-8 rounded-lg text-xs" title={`Copy missing holidays from ${year - 1}`}>
                    {busy === "copy" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="ml-1 hidden sm:inline">{year - 1}</span>
                  </Button>
                </div>
              )}
            </div>

            <ul className="space-y-2">
              {holidays.map((h) => {
                const meta = CATEGORY_META[h.category] ?? CATEGORY_META.NATIONAL;
                const past = h.endDate < todayIso;
                return (
                  <li
                    key={h.id}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                      h.confirmed ? "border-slate-100 bg-white" : "border-amber-200 bg-amber-50/40",
                      past && "opacity-60",
                    )}
                  >
                    <div className="w-12 shrink-0 rounded-lg border border-slate-200 bg-slate-50 py-1 text-center">
                      <p className="text-[10px] font-semibold uppercase text-slate-400">
                        {MONTHS[parse(h.startDate).getMonth()]}
                      </p>
                      <p className="text-lg font-black leading-none text-slate-800">
                        {parse(h.startDate).getDate()}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-slate-800">{h.name}</p>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", meta.chip)}>
                          {meta.label}
                        </span>
                        {h.recurring && (
                          <span title="Same date every year" className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            <Repeat className="h-2.5 w-2.5" /> Yearly
                          </span>
                        )}
                        {!h.confirmed && (
                          <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Estimated
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {rangeLabel(h)} · {h.totalDays} {h.totalDays === 1 ? "day" : "days"}
                        {h.workingDays !== h.totalDays && ` (${h.workingDays} working)`}
                      </p>
                      {h.notes && <p className="mt-0.5 truncate text-[11px] text-slate-400">{h.notes}</p>}
                    </div>
                    {canEdit && (
                      <div className="flex shrink-0 items-center gap-1">
                        {!h.confirmed && (
                          <button
                            type="button"
                            onClick={() => markConfirmed(h)}
                            title="Dates announced — mark as confirmed"
                            className="flex h-7 items-center gap-1 rounded-lg border border-amber-300 bg-white px-2 text-[11px] font-semibold text-amber-700 hover:bg-amber-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(h)}
                          aria-label={`Edit ${h.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(h)}
                          aria-label={`Delete ${h.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Year calendar ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800">{year} calendar</h3>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                {(Object.keys(CATEGORY_META) as PublicHolidayCategory[]).map((c) => (
                  <span key={c} className="inline-flex items-center gap-1">
                    <span className={cn("h-2.5 w-2.5 rounded-sm", CATEGORY_META[c].cell.split(" ")[0])} />
                    {CATEGORY_META[c].label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-amber-500" /> Estimated
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-100" /> Weekend
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {MONTHS.map((label, m) => (
                <MiniMonth
                  key={label}
                  year={year}
                  month={m}
                  label={label}
                  byDate={byDate}
                  todayIso={todayIso}
                  onDay={(date, h) => (h ? (canEdit ? openEdit(h) : undefined) : canEdit ? openNew(date) : undefined)}
                />
              ))}
            </div>
            {canEdit && (
              <p className="mt-3 text-[11px] text-slate-400">
                Click a holiday to edit it, or an empty day to add a holiday on that date.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Add / edit pop-up ── */}
      {editing && (
        <RecordFormDialog
          open
          onClose={() => !saving && setEditing(null)}
          title={editing === "new" ? "Add public holiday" : `Edit ${editing.name}`}
          subtitle="Working days in this range become paid days off"
          badge={<PartyPopper className="h-5 w-5" />}
          badgeClassName="bg-violet-100 text-violet-700"
          saveLabel={editing === "new" ? "Add holiday" : "Save changes"}
          onSave={save}
          saving={saving}
          maxWidth={620}
        >
          <DialogSection
            icon={<CalendarDays className="h-3.5 w-3.5 text-violet-600" />}
            iconBg="bg-violet-50"
            title="Holiday details"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DField label="Holiday name" required error={showErrors ? errors.name : undefined} className="sm:col-span-2">
                <DInput
                  placeholder="e.g. Eid al-Fitr"
                  value={form.name}
                  maxLength={120}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  invalid={showErrors && !!errors.name}
                />
              </DField>
              <DField label="Start date" required error={showErrors ? errors.startDate : undefined}>
                <DInput
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      startDate: e.target.value,
                      endDate: !f.endDate || f.endDate < e.target.value ? e.target.value : f.endDate,
                    }))
                  }
                  invalid={showErrors && !!errors.startDate}
                />
              </DField>
              <DField
                label="End date"
                error={showErrors ? errors.endDate : undefined}
                hint="Same as start for a one-day holiday"
              >
                <DInput
                  type="date"
                  min={form.startDate || undefined}
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  invalid={showErrors && !!errors.endDate}
                />
              </DField>
              <DField label="Category">
                <DSelect
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as PublicHolidayCategory }))
                  }
                >
                  <option value="NATIONAL">National</option>
                  <option value="RELIGIOUS">Religious</option>
                  <option value="COMPANY">Company</option>
                </DSelect>
              </DField>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.recurring}
                    onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600"
                  />
                  Same date every year
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.confirmed}
                    onChange={(e) => setForm((f) => ({ ...f, confirmed: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600"
                  />
                  Dates officially confirmed
                </label>
              </div>
              <DField label="Notes" className="sm:col-span-2">
                <DTextarea
                  placeholder="e.g. Announced by the Amiri Diwan on …"
                  value={form.notes ?? ""}
                  maxLength={500}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </DField>
            </div>
          </DialogSection>
        </RecordFormDialog>
      )}
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  tone: "violet" | "blue" | "emerald" | "amber" | "slate";
}) {
  const tones = {
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    slate: "bg-slate-50 text-slate-500 border-slate-100",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", tones)}>{icon}</span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-xl font-bold leading-tight text-slate-800">
          {value} <span className="text-xs font-normal text-slate-400">{sub}</span>
        </p>
      </div>
    </div>
  );
}

function MiniMonth({
  year,
  month,
  label,
  byDate,
  todayIso,
  onDay,
}: {
  year: number;
  month: number;
  label: string;
  byDate: Map<string, PublicHoliday>;
  todayIso: string;
  onDay: (date: string, holiday?: PublicHoliday) => void;
}) {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(first.getDay()).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  const count = new Set(
    Array.from({ length: days }, (_, i) => byDate.get(iso(new Date(year, month, i + 1)))?.id).filter(Boolean),
  ).size;

  return (
    <div className="rounded-xl border border-slate-100 p-2">
      <div className="mb-1 flex items-center justify-between px-0.5">
        <span className="text-[11px] font-bold text-slate-700">{label}</span>
        {count > 0 && (
          <span className="rounded-full bg-violet-100 px-1.5 text-[10px] font-bold text-violet-700">{count}</span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-px text-center">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className={cn("text-[9px] font-semibold", i >= 5 ? "text-slate-300" : "text-slate-400")}>
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <span key={i} />;
          const date = new Date(year, month, d);
          const key = iso(date);
          const h = byDate.get(key);
          const weekend = date.getDay() === 5 || date.getDay() === 6;
          const meta = h ? CATEGORY_META[h.category] ?? CATEGORY_META.NATIONAL : null;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDay(key, h)}
              title={h ? `${h.name}${h.confirmed ? "" : " (estimated)"}` : undefined}
              className={cn(
                "flex h-5 items-center justify-center rounded text-[10px] tabular-nums transition-colors",
                meta
                  ? cn(meta.cell, "font-bold", !h!.confirmed && "outline outline-1 outline-dashed outline-amber-500 outline-offset-1")
                  : weekend
                    ? "bg-slate-50 text-slate-300"
                    : "text-slate-600 hover:bg-slate-100",
                key === todayIso && "ring-2 ring-blue-500 ring-offset-1",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
