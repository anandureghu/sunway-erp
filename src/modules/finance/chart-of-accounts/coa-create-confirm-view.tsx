import { Button } from "@/components/ui/button";
import { COA } from "@/types/coa";
import type { COAFormData } from "@/schema/finance/chart-of-account";
import { AlertTriangle, ArrowLeft, Check } from "lucide-react";

function labelForType(type: string) {
  return COA.find((c) => c.key === type)?.label ?? type;
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);
  return (
    <div className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-3 gap-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-slate-900 break-words">{display}</span>
    </div>
  );
}

export function CoaCreateConfirmView({
  data,
  onBack,
  onConfirm,
  loading,
}: {
  data: COAFormData;
  onBack: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">Review before creating</p>
          <p className="text-amber-900/90">
            GL accounts cannot be edited after they are created. Check every
            field below, then confirm or go back to change the form.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Account summary
        </p>
        <SummaryRow label="Account code" value={data.accountCode} />
        <SummaryRow label="Account name" value={data.accountName} />
        <SummaryRow label="Account type" value={labelForType(data.type)} />
        <SummaryRow label="Account no." value={data.accountNo} />
        {data.type !== "BUDGET" && (
          <>
            <SummaryRow
              label="Department ID"
              value={data.departmentId ?? undefined}
            />
            <SummaryRow label="Project code" value={data.projectCode} />
          </>
        )}
        <SummaryRow
          label="Parent account ID"
          value={data.parentId ?? undefined}
        />
        <SummaryRow
          label="Inter-company no."
          value={data.interCompanyNumber}
        />
        <SummaryRow label="Description" value={data.description} />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={loading}
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back to form
        </Button>
        <Button
          type="button"
          className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600"
          disabled={loading}
          onClick={() => void onConfirm()}
        >
          {loading ? (
            "Creating…"
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Confirm &amp; create account
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
