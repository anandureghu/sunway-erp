import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RatingScale } from "./appraisal-types";

// ── Panel 3: Rating Scale ──────────────────────────────────────────────────
export function RatingScalePanel({
  ratingScale,
  setRatingScale,
}: {
  ratingScale: RatingScale[];
  setRatingScale: React.Dispatch<React.SetStateAction<RatingScale[]>>;
}) {
  function update(score: number, field: keyof RatingScale, val: string) {
    setRatingScale((p) =>
      p.map((r) => (r.score === score ? { ...r, [field]: val } : r)),
    );
  }

  const colors: Record<number, { bg: string; border: string; header: string }> =
    {
      5: {
        bg: "bg-green-50",
        border: "border-green-200",
        header: "bg-green-500",
      },
      4: { bg: "bg-blue-50", border: "border-blue-200", header: "bg-blue-500" },
      3: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        header: "bg-purple-500",
      },
      2: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        header: "bg-amber-500",
      },
      1: { bg: "bg-red-50", border: "border-red-200", header: "bg-red-500" },
    };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-lg">⭐</span>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Rating Scale Configuration
            </h3>
            <p className="text-sm text-slate-500">
              Define what each score means throughout the appraisal process.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {ratingScale.map((r) => {
            const c = colors[r.score] || {
              bg: "bg-slate-50",
              border: "border-slate-200",
              header: "bg-slate-500",
            };
            return (
              <div
                key={r.score}
                className={`grid grid-cols-[60px_1fr_2fr] gap-4 p-5 rounded-xl border-2 ${c.bg} ${c.border}`}
              >
                <div
                  className={`w-14 h-14 rounded-xl ${c.header} text-white flex items-center justify-center text-2xl font-black`}
                >
                  {r.score}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Label
                  </label>
                  <Input
                    value={r.label}
                    onChange={(e) => update(r.score, "label", e.target.value)}
                    className="h-9 font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Definition
                  </label>
                  <Textarea
                    value={r.definition}
                    onChange={(e) =>
                      update(r.score, "definition", e.target.value)
                    }
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
