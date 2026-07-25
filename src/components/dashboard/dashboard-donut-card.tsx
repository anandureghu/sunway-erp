import type { ReactNode } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Cell, Pie, PieChart } from "recharts";
import { DashboardEmpty } from "./dashboard-empty";
import { DashboardSectionCard } from "./dashboard-section-card";

export type DashboardDonutSlice = {
  name: string;
  value: number;
  fill: string;
  count?: number;
};

export function DashboardDonutCard({
  title,
  description,
  slices,
  centerLabel,
  centerValue,
  emptyMessage = "No data.",
  formatValue,
  showZeroSlicesInLegend = true,
  size = "md",
}: {
  title: string;
  description?: string;
  slices: DashboardDonutSlice[];
  centerLabel?: string;
  centerValue?: ReactNode;
  emptyMessage?: string;
  formatValue?: (value: number) => string;
  showZeroSlicesInLegend?: boolean;
  size?: "sm" | "md";
}) {
  const chartSlices = slices.filter((s) => s.value > 0);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const legendSlices = showZeroSlicesInLegend ? slices : chartSlices;
  const chartH = size === "sm" ? "h-[160px]" : "h-[200px]";
  const inner = size === "sm" ? 48 : 58;
  const outer = size === "sm" ? 70 : 84;

  return (
    <DashboardSectionCard title={title} description={description}>
      {total === 0 ? (
        <DashboardEmpty message={emptyMessage} className="h-56" />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full max-w-[220px]">
            <ChartContainer
              config={{ value: { label: "Value" } }}
              className={`mx-auto aspect-square ${chartH}`}
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        formatValue
                          ? formatValue(Number(value))
                          : String(value)
                      }
                    />
                  }
                />
                <Pie
                  data={chartSlices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={inner}
                  outerRadius={outer}
                  strokeWidth={2}
                >
                  {chartSlices.map((s) => (
                    <Cell key={s.name} fill={s.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            {(centerLabel || centerValue != null) && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                {centerLabel ? (
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {centerLabel}
                  </p>
                ) : null}
                {centerValue != null ? (
                  <p className="text-sm font-bold tabular-nums">{centerValue}</p>
                ) : null}
              </div>
            )}
          </div>
          <ul className="w-full space-y-1.5 text-xs">
            {legendSlices.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.fill }}
                  />
                  {s.name}
                  {s.count != null ? (
                    <span className="text-[10px]">({s.count})</span>
                  ) : null}
                </span>
                <span className="font-medium tabular-nums">
                  {formatValue ? formatValue(s.value) : s.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardSectionCard>
  );
}
