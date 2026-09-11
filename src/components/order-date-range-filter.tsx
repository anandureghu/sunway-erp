import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type OrderDateRange = {
  from: string;
  to: string;
};

type Props = {
  from: string;
  to: string;
  onChange: (next: OrderDateRange) => void;
};

function iso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function OrderDateRangeFilter({ from, to, onChange }: Props) {
  const setPreset = (kind: "this_month" | "last_month" | "last_year") => {
    const now = new Date();
    if (kind === "this_month") {
      onChange({ from: iso(startOfMonth(now)), to: iso(now) });
      return;
    }
    if (kind === "last_month") {
      const prev = subMonths(now, 1);
      onChange({ from: iso(startOfMonth(prev)), to: iso(endOfMonth(prev)) });
      return;
    }
    const prevYear = subYears(now, 1);
    onChange({
      from: iso(startOfYear(prevYear)),
      to: iso(endOfYear(prevYear)),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        value={from}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="w-[140px]"
        aria-label="Order date from"
      />
      <span className="text-xs text-muted-foreground">to</span>
      <Input
        type="date"
        value={to}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="w-[140px]"
        aria-label="Order date to"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => setPreset("this_month")}
      >
        This month
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => setPreset("last_month")}
      >
        Last month
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => setPreset("last_year")}
      >
        Last year
      </Button>
      {(from || to) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => onChange({ from: "", to: "" })}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
