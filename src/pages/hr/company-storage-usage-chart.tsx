import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatBytes, cn } from "@/lib/utils";
import { Cell, Pie, PieChart } from "recharts";

type Props = {
  cloudBytes: number;
  databaseBytes: number;
  maxBytes: number;
  calculatedAt?: string | null;
};

const chartConfig = {
  cloud: { label: "Cloud", color: "#2563eb" },
  database: { label: "Database", color: "#7c3aed" },
  remaining: { label: "Remaining", color: "#e2e8f0" },
} satisfies ChartConfig;

export function CompanyStorageUsageChart({
  cloudBytes,
  databaseBytes,
  maxBytes,
  calculatedAt,
}: Props) {
  const cloud = Math.max(0, cloudBytes);
  const database = Math.max(0, databaseBytes);
  const totalUsed = cloud + database;
  const remaining =
    maxBytes > 0 ? Math.max(0, maxBytes - totalUsed) : 0;
  const usageRatio = maxBytes > 0 ? totalUsed / maxBytes : 0;
  const usagePct =
    maxBytes > 0 ? Math.min(100, Math.round(usageRatio * 1000) / 10) : 0;

  const slices = [
    { key: "cloud", name: "Cloud", value: cloud, fill: chartConfig.cloud.color },
    {
      key: "database",
      name: "Database",
      value: database,
      fill: chartConfig.database.color,
    },
    ...(maxBytes > 0
      ? [
          {
            key: "remaining",
            name: "Remaining",
            value: remaining,
            fill: chartConfig.remaining.color,
          },
        ]
      : []),
  ];

  // Pie needs at least one positive slice; if everything is 0 show remaining or a placeholder.
  const chartSlices =
    slices.filter((s) => s.value > 0).length > 0
      ? slices.filter((s) => s.value > 0)
      : maxBytes > 0
        ? [
            {
              key: "remaining",
              name: "Remaining",
              value: maxBytes,
              fill: chartConfig.remaining.color,
            },
          ]
        : [{ key: "empty", name: "Empty", value: 1, fill: "#e2e8f0" }];

  const legend = [
    { name: "Cloud", value: cloud, fill: chartConfig.cloud.color },
    { name: "Database", value: database, fill: chartConfig.database.color },
    ...(maxBytes > 0
      ? [
          {
            name: "Remaining",
            value: remaining,
            fill: chartConfig.remaining.color,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[220px_1fr]">
        <div className="relative mx-auto w-full max-w-[220px]">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[200px]"
          >
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span className="font-medium tabular-nums">
                        {name === "Empty"
                          ? "No usage yet"
                          : formatBytes(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Pie
                data={chartSlices}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={84}
                strokeWidth={2}
                stroke="#fff"
              >
                {chartSlices.map((s) => (
                  <Cell key={s.key} fill={s.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Total used
            </p>
            <p className="text-sm font-bold tabular-nums text-slate-800">
              {formatBytes(totalUsed)}
            </p>
            {maxBytes > 0 ? (
              <p className="text-[11px] tabular-nums text-slate-400">
                of {formatBytes(maxBytes)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <ul className="space-y-2">
            {legend.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-[13px] text-slate-600">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  {item.name}
                </span>
                <span className="text-[13px] font-semibold tabular-nums text-slate-800">
                  {formatBytes(item.value)}
                </span>
              </li>
            ))}
          </ul>

          {maxBytes > 0 ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[12px] text-slate-500">
                <span>Quota used</span>
                <span className="tabular-nums">{usagePct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    usageRatio >= 0.9
                      ? "bg-rose-500"
                      : usageRatio >= 0.7
                        ? "bg-amber-500"
                        : "bg-cyan-500",
                  )}
                  style={{
                    width: `${Math.min(100, usageRatio * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Cloud and database both count toward the subscription max.
                Uploads are blocked when the total is reached.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-[12px] text-slate-400">
        {calculatedAt
          ? `Database storage last calculated ${new Date(
              calculatedAt,
            ).toLocaleString()}`
          : "Database storage has not been calculated yet."}
      </p>
    </div>
  );
}
