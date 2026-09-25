import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/format-date";

/**
 * Shared building blocks for the employee sub-forms (Dependents, Previous
 * Experiences, Education & Qualifications) so they match the Add Employee /
 * profile form: white rounded-2xl cards, gradient section headings, icon inputs,
 * violet focus rings, and clean icon + value tiles in view mode.
 */

/** Read-only value tile shown in place of a greyed-out input. */
export const ReadOnlyValue = ({
  icon,
  value,
  className,
}: {
  icon?: React.ReactNode;
  value?: React.ReactNode;
  className?: string;
}) => {
  const empty = value == null || value === "";
  return (
    <div className="flex h-9 items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-3">
      {icon && <span className="shrink-0 text-violet-400">{icon}</span>}
      <span
        className={cn(
          "truncate text-sm font-semibold",
          empty ? "text-slate-300" : "text-slate-700",
          className,
        )}
      >
        {empty ? "—" : value}
      </span>
    </div>
  );
};

/** View-mode item: icon + label + value (no input box). */
export const ViewField = ({
  icon,
  label,
  value,
  mono,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  className?: string;
}) => {
  const empty = value == null || value === "" || value === "—";
  return (
    <div className={cn("flex min-w-0 items-start gap-2.5", className)}>
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-semibold",
            empty ? "text-slate-300" : "text-slate-700",
            mono && "font-mono",
          )}
        >
          {empty ? "—" : value}
        </p>
      </div>
    </div>
  );
};

/** Multi-line view item (notes, addresses, awards) that wraps instead of truncating. */
export const ViewBlock = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p
        className={cn(
          "whitespace-pre-wrap break-words text-sm font-semibold",
          value?.trim() ? "text-slate-700" : "text-slate-300",
        )}
      >
        {value?.trim() ? value : "—"}
      </p>
    </div>
  </div>
);

/** Native select styled like the profile form. */
export const StyledSelect = ({
  value,
  onChange,
  children,
  invalid,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
  invalid?: boolean;
}) => (
  <select
    value={value}
    onChange={onChange}
    className={cn(
      "h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-700 transition-all",
      "focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-300/20",
      invalid ? "border-red-300" : "border-slate-200",
    )}
  >
    {children}
  </select>
);

/** Input with a leading icon; renders a value tile when disabled. */
export const IconInput = ({
  icon,
  invalid,
  ...props
}: React.ComponentProps<typeof Input> & {
  icon: React.ReactNode;
  invalid?: boolean;
}) => {
  if (props.disabled) {
    const display =
      props.type === "date"
        ? formatDisplayDate(props.value as string)
        : props.value;
    return (
      <ReadOnlyValue
        icon={icon}
        value={display as React.ReactNode}
        className={props.className}
      />
    );
  }
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <Input
        {...props}
        className={cn(
          "h-9 pl-9 rounded-lg text-slate-700 focus-visible:border-violet-300 focus-visible:ring-violet-300/20",
          invalid ? "border-red-300" : "border-slate-200",
          props.className,
        )}
      />
    </div>
  );
};

/** Textarea styled like the profile inputs, with an optional character counter. */
export const StyledTextarea = ({
  showCount = true,
  ...props
}: React.ComponentProps<typeof Textarea> & { showCount?: boolean }) => {
  const length = typeof props.value === "string" ? props.value.length : 0;
  return (
    <div>
      <Textarea
        {...props}
        className={cn(
          "min-h-[80px] resize-none rounded-lg border-slate-200 bg-white text-sm text-slate-700",
          "focus-visible:border-violet-300 focus-visible:ring-violet-300/20",
          props.className,
        )}
      />
      {showCount && props.maxLength ? (
        <p className="mt-1 text-right text-[11px] text-slate-400">
          {length} / {props.maxLength}
        </p>
      ) : null}
    </div>
  );
};

/** Section heading with a gradient icon tile (profile-form style). */
export const SectionHeading = ({
  icon,
  label,
  description,
  accent = "from-violet-600 to-blue-600",
  actions,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  accent?: string;
  actions?: React.ReactNode;
}) => (
  <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
          accent,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-slate-800">{label}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

/** White rounded card used for every section. */
export const SectionCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
      className,
    )}
  >
    {children}
  </div>
);

/** Icon-only action buttons for a record row: View, Edit, Delete. */
export const RecordActions = ({
  onView,
  onEdit,
  onDelete,
  viewLabel = "View",
}: {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
}) => {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors";
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {onView && (
        <button
          type="button"
          title={viewLabel}
          aria-label={viewLabel}
          onClick={onView}
          className={cn(btn, "hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600")}
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          title="Edit"
          aria-label="Edit"
          onClick={onEdit}
          className={cn(btn, "hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600")}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          title="Delete"
          aria-label="Delete"
          onClick={onDelete}
          className={cn(btn, "hover:border-red-200 hover:bg-red-50 hover:text-red-600")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

/** Initial / icon avatar tile for a record row. */
export const RecordAvatar = ({
  children,
  accent = "from-violet-500 to-blue-600",
}: {
  children: React.ReactNode;
  accent?: string;
}) => (
  <div
    className={cn(
      "flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm",
      accent,
    )}
  >
    {children}
  </div>
);

/** Today as yyyy-mm-dd (local time) for date `max` limits and future-date checks. */
export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};
