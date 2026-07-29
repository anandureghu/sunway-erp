import { useState, useEffect } from "react";
import { toast } from "sonner";
import { initialsFrom } from "@/lib/utils";
import { UserCheck, Users, Star, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { appraisalService } from "@/service/appraisalService";
import type {
  EmployeeAppraisal,
  GoalWithRating,
  RatingScale,
} from "./appraisal-types";
import { CURRENT_YEAR, YEARS } from "./appraisal-constants";

// ── Panel 6: Manager Ratings ───────────────────────────────────────────────
export function ManagerRatingsPanel({
  ratingScale,
}: {
  ratingScale: RatingScale[];
}) {
  const [selectedYear, setSelectedYear] = useState<string>(String(CURRENT_YEAR));
  const [appraisals, setAppraisals] = useState<EmployeeAppraisal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeAppraisal | null>(null);
  const [goals, setGoals] = useState<GoalWithRating[]>([]);
  const [managerComments, setManagerComments] = useState("");

  useEffect(() => {
    const year = parseInt(selectedYear);
    if (!year) return;
    setLoading(true);
    appraisalService
      .listByYear(year)
      .then((data) => {
        setAppraisals(
          (data.content || []).map((app: any) => ({
            id: app.id,
            employeeId: app.employeeId,
            employeeName: app.employeeName,
            employeeRole: app.employeeRole,
            year: app.year,
            status: app.status,
            overallScore: app.overallScore,
            goals: (app.goals || []).map((g: any) => ({
              goalId: g.goalId,
              kpi: g.kpi,
              description: g.description,
              weight: g.weight,
              selfRating: g.selfRating ?? null,
              managerRating: g.managerRating ?? null,
              selfComment: g.selfComment || "",
              managerComment: g.managerComment || "",
            })),
            employeeComments: app.employeeComments,
            managerComments: app.managerComments,
          })),
        );
      })
      .catch(() => {
        toast.error("Failed to load appraisals");
        setAppraisals([]);
      })
      .finally(() => setLoading(false));
  }, [selectedYear]);

  function openEmployee(app: EmployeeAppraisal) {
    setSelectedEmp(app);
    setGoals(app.goals?.map((g) => ({ ...g })) || []);
    setManagerComments(app.managerComments || "");
    setShowModal(true);
  }

  function updateGoalRating(
    goalId: number,
    field: keyof GoalWithRating,
    value: number | string,
  ) {
    setGoals((prev) =>
      prev.map((g) => (g.goalId === goalId ? { ...g, [field]: value } : g)),
    );
  }

  async function submitAppraisal() {
    if (!selectedEmp) return;
    try {
      await appraisalService.submitManagerReview(
        selectedEmp.employeeId,
        selectedEmp.id,
        {
          goals: goals.map((g) => ({
            goalId: g.goalId,
            managerRating: g.managerRating ?? undefined,
            managerComment: g.managerComment,
          })),
          managerComments,
        },
      );
      toast.success("Manager review submitted");
      setShowModal(false);
      // Reload
      const data = await appraisalService.listByYear(parseInt(selectedYear));
      setAppraisals(
        (data.content || []).map((app: any) => ({
          id: app.id,
          employeeId: app.employeeId,
          employeeName: app.employeeName,
          employeeRole: app.employeeRole,
          year: app.year,
          status: app.status,
          overallScore: app.overallScore,
          goals: (app.goals || []).map((g: any) => ({
            goalId: g.goalId,
            kpi: g.kpi,
            description: g.description,
            weight: g.weight,
            selfRating: g.selfRating ?? null,
            managerRating: g.managerRating ?? null,
            selfComment: g.selfComment || "",
            managerComment: g.managerComment || "",
          })),
          employeeComments: app.employeeComments,
          managerComments: app.managerComments,
        })),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit review");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Manager Ratings
                </h3>
                <p className="text-sm text-slate-500">
                  Rate employee performance and provide feedback
                </p>
              </div>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Loading appraisals...</p>
        </div>
      ) : appraisals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-700 mb-2">
              No Appraisals Found
            </h4>
            <p className="text-slate-500">
              No appraisals for {selectedYear}. Employees need to submit
              self-assessments first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appraisals.map((app) => {
            const totalGoals = app.goals?.length ?? 0;
            const ratedGoals =
              app.goals?.filter((g) => g.managerRating != null).length ?? 0;
            // "Rated" means every goal is rated; a subset is "Partial".
            const fullyRated = totalGoals > 0 && ratedGoals === totalGoals;
            const partiallyRated = ratedGoals > 0 && ratedGoals < totalGoals;
            const hasAnyRating = ratedGoals > 0;
            return (
              <Card
                key={app.id}
                className={
                  fullyRated
                    ? "border-green-200 bg-green-50"
                    : partiallyRated
                      ? "border-blue-200 bg-blue-50"
                      : "border-amber-200 bg-amber-50"
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {initialsFrom(app.employeeName)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {app.employeeName}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {app.employeeRole} · {app.year}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {app.overallScore != null && (
                        <Badge className="bg-indigo-100 text-indigo-700">
                          Score: {app.overallScore.toFixed(2)}
                        </Badge>
                      )}
                      {fullyRated ? (
                        <Badge className="bg-green-100 text-green-700">
                          <Star className="w-3 h-3 mr-1" />
                          Rated
                        </Badge>
                      ) : partiallyRated ? (
                        <Badge className="bg-blue-100 text-blue-700">
                          <Clock className="w-3 h-3 mr-1" />
                          Partial ({ratedGoals}/{totalGoals})
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      <Button size="sm" onClick={() => openEmployee(app)}>
                        {hasAnyRating ? "View/Edit" : "Rate"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Rate Performance — {selectedEmp?.employeeName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {goals.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No KPIs found for this employee.
              </div>
            ) : (
              goals.map((goal, idx) => (
                <div
                  key={goal.goalId}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {goal.kpi}
                      </span>
                    </div>
                    {goal.weight > 0 && (
                      <Badge className="bg-slate-200 text-slate-700">
                        {goal.weight}%
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                        Self Rating
                      </label>
                      <div className="flex gap-1">
                        {ratingScale.map((r) => (
                          <button
                            key={r.score}
                            disabled
                            className={`w-8 h-8 rounded-lg text-sm font-bold ${goal.selfRating === r.score ? "bg-blue-500 text-white" : "bg-white border border-slate-200 text-slate-400"}`}
                          >
                            {r.score}
                          </button>
                        ))}
                      </div>
                      {goal.selfComment && (
                        <p className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border">
                          {goal.selfComment}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">
                        Manager Rating *
                      </label>
                      <div className="flex gap-1">
                        {ratingScale.map((r) => (
                          <button
                            key={r.score}
                            type="button"
                            onClick={() =>
                              updateGoalRating(
                                goal.goalId,
                                "managerRating",
                                r.score,
                              )
                            }
                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                              goal.managerRating === r.score
                                ? "bg-orange-500 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:border-orange-300"
                            }`}
                          >
                            {r.score}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Manager Comments
              </label>
              <Textarea
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                placeholder="Provide feedback on employee performance..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAppraisal}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={goals.some(
                (g) => g.managerRating === null || g.managerRating === undefined,
              )}
            >
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
