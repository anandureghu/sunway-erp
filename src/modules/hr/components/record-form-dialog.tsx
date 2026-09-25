import React from "react";
import { ChevronDown, Loader2, Pencil, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Pop-up form shell matching the "Add new employee" modal
 * (context/employee-selection.tsx → AddEmployeeModal): dark header with a live
 * initials/icon badge, scrollable body of titled section cards, and a footer with
 * the required-fields note, Cancel and a gradient Save button.
 *
 * Used for add/edit on the employee sub-records (Dependents, Previous Experiences,
 * Education & Qualifications).
 */

// ── Shared field styles (same as AddEmployeeModal) ────────────────────────────
export const dInputCls =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

export const dSelectCls =
  "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-[13px] text-slate-800 outline-none transition-all duration-150 focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

export const dTextareaCls =
  "min-h-[88px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

export const dLabelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500";

const invalidCls =
  "border-rose-300 focus:border-rose-400 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.12)]";

// ── Section card ──────────────────────────────────────────────────────────────
export function DialogSection({
  icon,
  iconBg = "bg-slate-100",
  title,
  children,
}: {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            iconBg,
          )}
        >
          {icon}
        </div>
        <span className="text-[13px] font-semibold text-slate-700">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Field wrapper: uppercase label, required star, hint / error line ──────────
export function DField({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label className={dLabelCls}>
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] font-medium text-rose-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

// ── Inputs ────────────────────────────────────────────────────────────────────
export const DInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ invalid, className, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={cn(dInputCls, invalid && invalidCls, className)}
  />
));
DInput.displayName = "DInput";

export function DSelect({
  value,
  onChange,
  invalid,
  children,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={cn(dSelectCls, invalid && invalidCls)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

export function DTextarea({
  invalid,
  className,
  showCount = true,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
  showCount?: boolean;
}) {
  const length = typeof props.value === "string" ? props.value.length : 0;
  return (
    <div>
      <textarea
        {...props}
        className={cn(dTextareaCls, invalid && invalidCls, className)}
      />
      {showCount && props.maxLength ? (
        <p className="mt-1 text-right text-[11px] text-slate-400">
          {length} / {props.maxLength}
        </p>
      ) : null}
    </div>
  );
}

// ── Read-only view pieces ─────────────────────────────────────────────────────

/** One labelled value tile for the view pop-up. Empty values show a soft dash. */
export function DFact({
  icon,
  label,
  value,
  mono,
  wide,
  multiline,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  /** Span the full row (addresses, notes). */
  wide?: boolean;
  /** Keep line breaks and wrap long text instead of truncating. */
  multiline?: boolean;
  /** Optional accent for the value, e.g. "text-rose-600". */
  tone?: string;
}) {
  const empty =
    value == null || value === "" || (typeof value === "string" && !value.trim());
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5",
        wide && "sm:col-span-2 lg:col-span-3",
      )}
    >
      {icon && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <div
          className={cn(
            "mt-0.5 text-[13.5px] font-semibold",
            empty ? "text-slate-300" : tone ?? "text-slate-800",
            mono && "font-mono text-[13px]",
            multiline ? "whitespace-pre-wrap break-words" : "truncate",
          )}
        >
          {empty ? "—" : value}
        </div>
      </div>
    </div>
  );
}

/** Responsive grid for DFact tiles. */
export function DFactGrid({
  children,
  columns = 3,
}: {
  children: React.ReactNode;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2.5 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}

/** Headline chips shown at the top of a view pop-up (relationship, age, years…). */
export function DHighlights({
  items,
}: {
  items: { label: string; value: React.ReactNode; className?: string }[];
}) {
  const shown = items.filter((i) => i.value != null && i.value !== "");
  if (shown.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {shown.map((i) => (
        <div
          key={i.label}
          className={cn(
            "rounded-2xl border px-3.5 py-3",
            i.className ?? "border-slate-200 bg-white",
          )}
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-wider opacity-70">
            {i.label}
          </p>
          <p className="mt-1 truncate text-base font-bold">{i.value}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Read-only pop-up matching {@link RecordFormDialog}: same dark header and badge,
 * body of sections, footer with Close and an Edit button that jumps to the editor.
 */
export function RecordViewDialog({
  open,
  onClose,
  title,
  subtitle,
  badge,
  badgeClassName = "bg-blue-100 text-blue-700",
  headerExtra,
  onEdit,
  editLabel = "Edit",
  maxWidth = 760,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge: React.ReactNode;
  badgeClassName?: string;
  /** Tags shown under the title (relationship, emergency flag, …). */
  headerExtra?: React.ReactNode;
  onEdit?: () => void;
  editLabel?: string;
  maxWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/20 text-lg font-bold tracking-wide",
                badgeClassName,
              )}
            >
              {badge}
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-[17px] font-semibold leading-tight text-white">
                {title}
              </DialogTitle>
              {subtitle && (
                <DialogDescription className="mt-0.5 truncate text-[12.5px] text-slate-300">
                  {subtitle}
                </DialogDescription>
              )}
              {headerExtra && <div className="mt-2 flex flex-wrap gap-1.5">{headerExtra}</div>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-white px-6 py-5">
          {children}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-[13px] font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              {editLabel}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Small pill for the view header (on the dark background). */
export function DHeaderTag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Dialog shell ──────────────────────────────────────────────────────────────
export function RecordFormDialog({
  open,
  onClose,
  title,
  subtitle,
  badge,
  badgeClassName = "bg-blue-100 text-blue-700",
  saveLabel,
  saveIcon,
  onSave,
  saving,
  maxWidth = 720,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Initials or an icon shown in the header badge. */
  badge: React.ReactNode;
  badgeClassName?: string;
  saveLabel: string;
  saveIcon?: React.ReactNode;
  onSave: () => void;
  saving?: boolean;
  maxWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !saving) onClose();
      }}
    >
      <DialogContent
        className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 text-sm font-bold tracking-wide transition-all duration-300",
                badgeClassName,
              )}
            >
              {badge}
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-[15px] font-semibold leading-tight text-white">
                {title}
              </DialogTitle>
              {subtitle && (
                <DialogDescription className="mt-0.5 truncate text-[12px] text-slate-300">
                  {subtitle}
                </DialogDescription>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-white px-6 py-5">
          {children}
        </div>

        {/* ── Footer ── */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            Fields marked <span className="text-rose-400">*</span> are required
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-[13px] font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                saveIcon ?? <Save className="h-3.5 w-3.5" />
              )}
              {saving ? "Saving…" : saveLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
