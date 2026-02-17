import { useCallback, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Eye, FileText, Calendar, TrendingUp, MessageSquare } from "lucide-react";
import { useParams } from "react-router-dom";
import { appraisalService } from "@/service/appraisalService";
import { hrService } from "@/service/hr.service";
import { currentJobService } from "@/service/currentJobService";
import { toast } from "sonner";
import AppraisalEditor from "./AppraisalEditor";

export type AppModel = {
  id?: number | string;
  _localId?: string;

  month: string;
  year: number | string;

  jobCode?: string;
  employeeComments?: string;
  managerComments?: string;

  kpi1?: string; review1?: string; rating1?: string;
  kpi2?: string; review2?: string; rating2?: string;
  kpi3?: string; review3?: string; rating3?: string;
  kpi4?: string; review4?: string; rating4?: string;
  kpi5?: string; review5?: string; rating5?: string;

  overallPerformance?: number;
};

const EMPTY: AppModel = {
  month: "",
  year: new Date().getFullYear(),

  kpi1: "", review1: "",
  kpi2: "", review2: "",
  kpi3: "", review3: "",
  kpi4: "", review4: "",
  kpi5: "", review5: "",

  employeeComments: "",
  managerComments: "",
};

function toPayload(it: AppModel) {
  return {
    month: String(it.month).toLowerCase(),
    year: Number(it.year),

    jobCode: it.jobCode || undefined,
    employeeComments: it.employeeComments || undefined,
    managerComments: it.managerComments || undefined,

    kpi1: it.kpi1 || undefined,
    review1: it.review1 || undefined,
    rating1: it.rating1 ? Number(it.rating1) : undefined,
    kpi2: it.kpi2 || undefined,
    review2: it.review2 || undefined,
    rating2: it.rating2 ? Number(it.rating2) : undefined,
    kpi3: it.kpi3 || undefined,
    review3: it.review3 || undefined,
    rating3: it.rating3 ? Number(it.rating3) : undefined,
    kpi4: it.kpi4 || undefined,
    review4: it.review4 || undefined,
    rating4: it.rating4 ? Number(it.rating4) : undefined,
    kpi5: it.kpi5 || undefined,
    review5: it.review5 || undefined,
    rating5: it.rating5 ? Number(it.rating5) : undefined,

    overallPerformance: it.overallPerformance || undefined,
  };
}

export default function AppraisalsForm() {
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const [items, setItems] = useState<AppModel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [employee, setEmployee] = useState<{ firstName?: string; middleName?: string; lastName?: string } | null>(null);
  const [currentJobCode, setCurrentJobCode] = useState<string>("");
  const ignoreNextSaveRef = useRef(false);

  const reload = useCallback(async (): Promise<void> => {
    if (!empId) return;
    try {
      const data = await appraisalService.list(empId);
      setItems(
        (data || []).map((d: any) => ({
          id: d.id,
          month: d.month ?? "",
          year: d.year ?? "",
          jobCode: readDtoField(d, "jobCode") || readDtoField(d, "job_code"),
          employeeComments: readDtoField(d, "employeeComments"),
          managerComments: readDtoField(d, "managerComments"),
          kpi1: readDtoField(d, "kpi", 1),
          review1: readDtoField(d, "review", 1),
          kpi2: readDtoField(d, "kpi", 2),
          review2: readDtoField(d, "review", 2),
          kpi3: readDtoField(d, "kpi", 3),
          review3: readDtoField(d, "review", 3),
          kpi4: readDtoField(d, "kpi", 4),
          review4: readDtoField(d, "review", 4),
          kpi5: readDtoField(d, "kpi", 5),
          review5: readDtoField(d, "review", 5),
        }))
      );

    } catch (error) {
      console.error("Failed to load appraisals:", error);
      toast.error("Failed to load appraisals");
    }
  }, [empId]);

  useEffect(() => { void reload(); }, [reload]);

  useEffect(() => {
    if (!empId) return;
    let mounted = true;
    (async () => {
      try {
        const e = await hrService.getEmployee(empId);
        if (mounted) setEmployee({ firstName: e.firstName, middleName: (e as any).middleName, lastName: e.lastName });
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [empId]);

  useEffect(() => {
    if (!empId) return;
    let mounted = true;
    (async () => {
      try {
        const job = await currentJobService.get(empId);
        if (mounted) setCurrentJobCode(job?.jobCode || "");
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [empId]);

  const handleAdd = () => {
    const newItem: AppModel = { ...EMPTY, _localId: String(Date.now()), jobCode: currentJobCode || undefined };
    setItems((c) => [...c, newItem]);
    setEditingId(String(newItem._localId));
  };

  const updateItem = (idKey: string | number | undefined, patch: Partial<AppModel>) => {
    setItems((cur) =>
      cur.map((it) =>
        String(it._localId ?? it.id) === String(idKey)
          ? { ...it, ...patch }
          : it
      )
    );
  };

  const handleSave = useCallback(async (it: AppModel) => {
    if (!empId) return;

    if (!it.month || !it.year) {
      toast.error("Month and year required");
      return;
    }

    try {
      if (it.id && Number(it.id)) {
        await appraisalService.updateById(empId, Number(it.id), toPayload(it));
        toast.success("Appraisal updated");
      } else {
        await appraisalService.create(empId, toPayload(it));
        toast.success("Appraisal created");
      }

      await reload();
      setEditingId(null);
    } catch (err: any) {
      console.error("Save failed:", err);
      toast.error(err?.response?.data?.message || "Failed to save appraisal");
    }
  }, [empId, reload]);

  const handleDelete = async (appId?: number | string) => {
    if (!empId) return;
    if (!confirm("Delete appraisal?")) return;

    try {
      if (appId && Number(appId)) {
        await appraisalService.removeById(empId, Number(appId));
      }
      setItems((cur) =>
        cur.filter((it) => String(it._localId ?? it.id) !== String(appId))
      );
      toast.success("Appraisal deleted");
    } catch {
      toast.error("Failed to delete appraisal");
    }
  };

  const handleCancel = () => {
    ignoreNextSaveRef.current = true;
    setItems((cur) =>
      cur.filter((it) => {
        if (String(it._localId ?? it.id) !== String(editingId)) return true;
        if (it._localId && !it.id) {
          const isEmpty =
            !it.month &&
            !it.jobCode &&
            !it.employeeComments &&
            !it.managerComments &&
            !it.kpi1 &&
            !it.review1 &&
            !it.kpi2 &&
            !it.review2 &&
            !it.kpi3 &&
            !it.review3 &&
            !it.kpi4 &&
            !it.review4 &&
            !it.kpi5 &&
            !it.review5;
          return !isEmpty;
        }
        return true;
      })
    );
    setEditingId(null);
  };

  useEffect(() => {
    const onSaveEvent = () => {
      if (ignoreNextSaveRef.current) {
        ignoreNextSaveRef.current = false;
        return;
      }
      if (!editingId) return;
      const it = items.find(
        (x) => String(x._localId ?? x.id) === String(editingId)
      );
      if (it) void handleSave(it);
    };

    document.addEventListener("appraisal:save", onSaveEvent);
    return () => document.removeEventListener("appraisal:save", onSaveEvent);
  }, [editingId, items, handleSave]);

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Employee Performance Review
            </h2>
            <p className="text-sm text-slate-500 mt-1">Comprehensive performance evaluation</p>
            {employee && (
              <p className="text-sm text-slate-600 mt-1">{`${employee.firstName || ""} ${employee.middleName || ""} ${employee.lastName || ""}`.trim()}</p>
            )}
          </div>
          <Button
            onClick={handleAdd}
            className="bg-blue-600 text-white shadow-lg flex items-center gap-2 px-6 py-3 rounded-xl"
          >
            <Plus className="h-5 w-5" />
            Add Appraisal
          </Button>
        </div>
      </div>

      {/* Performance Review Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          Performance Review Details
        </h3>

        {/* Performance Reviews Grid */}
        <div className="grid gap-6">

          {items.map((it) => {
            const key = String(it._localId ?? it.id);
            const editing = editingId === key;
            const viewing = viewingId === key;

            return (
              <div key={key} className="border border-slate-200 rounded-lg p-6 mb-6">

                  {/* EDIT MODE */}
                  {editing ? (
                    <AppraisalEditor
                      value={it}
                      onChange={(patch) => updateItem(it._localId ?? it.id, patch)}
                      onSave={() => void handleSave(it)}
                      onCancel={handleCancel}
                    />
                  ) : (
                    <>
                      {!viewing ? (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-slate-800">
                                {it.month || "—"} / {it.year || "—"}
                              </h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                                <p className="text-xs text-slate-600 mb-1">Job Code</p>
                                <p className="text-sm font-semibold text-blue-700">{it.jobCode || "No code"}</p>
                              </div>
                              {it.employeeComments && (
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
                                  <p className="text-xs text-slate-600 mb-1">Employee Comments</p>
                                  <p className="text-sm font-semibold text-emerald-700">✓ Present</p>
                                </div>
                              )}
                              {it.managerComments && (
                                <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                                  <p className="text-xs text-slate-600 mb-1">Manager Comments</p>
                                  <p className="text-sm font-semibold text-violet-700">✓ Present</p>
                                </div>
                              )}
                              {(() => {
                                const read = (base: string, n?: number) => {
                                  const keys = n != null
                                    ? [`${base}${n}`, `${base}_${n}`, `${base}${n}`.toLowerCase()]
                                    : [base, base.toLowerCase(), base.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)];
                                  for (const k of keys) {
                                    // @ts-ignore
                                    const v = it[k];
                                    if (v !== undefined && v !== null) return String(v);
                                  }
                                  return "";
                                };

                                const kpiCount = [1, 2, 3, 4, 5].filter(n => {
                                  const k = read("kpi", n);
                                  return k.trim() !== "";
                                }).length;
                                return kpiCount > 0 ? (
                                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100">
                                    <p className="text-xs text-slate-600 mb-1">KPIs Defined</p>
                                    <p className="text-sm font-semibold text-amber-700">{kpiCount} of 5</p>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setViewingId(key)}
                              className="rounded-lg"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(key)}
                              className="rounded-lg"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(it._localId ?? it.id)}
                              className="text-red-600 rounded-lg flex-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">
                              {employee ? `${employee.firstName || ""} ${employee.middleName || ""} ${employee.lastName || ""}`.trim() : "Employee"}
                            </h3>
                            <p className="text-sm text-slate-600">{it.month || "—"} {it.year || "—"} Performance Review</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setViewingId(null)}>Close</Button>
                              <Button size="sm" onClick={() => { setViewingId(null); setEditingId(key); }} className="bg-gradient-to-r from-amber-500 to-orange-400 text-white">Edit</Button>
                            </div>
                          </div>

                          {/* Basic Information */}
                          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              Basic Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <DetailItem label="Month" value={it.month || "—"} />
                              <DetailItem label="Year" value={String(it.year) || "—"} />
                              <DetailItem label="Job Code" value={it.jobCode || "—"} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InfoCard icon={Calendar} label="Period" value={`${it.month || "—"} ${it.year || "—"}`} color="blue" />
                            <InfoCard icon={FileText} label="Job Code" value={it.jobCode || "—"} color="emerald" />
                            <InfoCard icon={TrendingUp} label="KPIs Defined" value={`${[1, 2, 3, 4, 5].filter(n => {
                              const kpiValue = it[`kpi${n}` as keyof AppModel];
                              return kpiValue && String(kpiValue).trim() !== "";
                            }).length} of 5`} color="violet" />
                          </div>

                          {/* KPI Performance Section */}
                          {(() => {
                            const read = (base: string, n?: number) => {
                              const keys = n != null
                                ? [`${base}${n}`, `${base}_${n}`, `${base}${n}`.toLowerCase()]
                                : [base, base.toLowerCase(), base.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)];
                              for (const k of keys) {
                                // @ts-ignore
                                const v = it[k];
                                if (v !== undefined && v !== null) return String(v);
                              }
                              return "";
                            };

                            const kpis = [1, 2, 3, 4, 5].filter(n => {
                              const kpiValue = read("kpi", n);
                              const reviewValue = read("review", n);
                              return (kpiValue && kpiValue.trim() !== "") || (reviewValue && reviewValue.trim() !== "");
                            });
                            return kpis.length > 0 ? (
                              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                  <TrendingUp className="h-5 w-5 text-blue-600" />
                                  Key Performance Indicators
                                </h4>
                                <div className="space-y-4">
                                  {kpis.map((n) => {
                                    const kpiVal = read("kpi", n);
                                    const revVal = read("review", n);
                                    return (
                                      <div key={n} className="bg-white rounded-lg p-4 border border-slate-200">
                                        <div className="flex items-start gap-4">
                                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                                            {n}
                                          </div>
                                          <div className="flex-1 space-y-2">
                                            {kpiVal && (
                                              <div>
                                                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">KPI</p>
                                                <p className="text-sm text-slate-800">{kpiVal}</p>
                                              </div>
                                            )}
                                            {revVal && (
                                              <div>
                                                <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Review</p>
                                                <p className="text-sm text-slate-800">{revVal}</p>
                                              </div>
                                            )}
                                            {(() => {
                                              const ratingVal = read("rating", n);
                                              return ratingVal ? (
                                                <div>
                                                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Rating</p>
                                                  <p className="text-sm text-slate-800">{ratingVal}</p>
                                                </div>
                                              ) : null;
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null;
                          })()}

                          {/* Comments Section */}
                          {(() => {
                            const readField = (k: string) => {
                              const candidates = [
                                k,
                                k.toLowerCase(),
                                k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`),
                              ];
                              for (const c of candidates) {
                                // @ts-ignore
                                const v = it[c];
                                if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
                              }
                              return "";
                            };

                            const empComm = readField("employeeComments");
                            const mgrComm = readField("managerComments");
                            return (empComm || mgrComm) ? (
                               <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                                 <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                   <MessageSquare className="h-5 w-5 text-blue-600" />
                                   Comments & Feedback
                                 </h4>
                                 <div className="space-y-4">
                                  {empComm && (
                                    <div>
                                      <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                        Employee Comments
                                      </h5>
                                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <p className="text-slate-700 whitespace-pre-wrap">{empComm}</p>
                                      </div>
                                    </div>
                                  )}
                                  {mgrComm && (
                                    <div>
                                      <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        Manager Comments
                                      </h5>
                                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                                        <p className="text-slate-700 whitespace-pre-wrap">{mgrComm}</p>
                                      </div>
                                    </div>
                                  )}
                                 </div>
                               </div>
                             ) : null;
                           })()}
                        </div>
                      )}
                    </>
                  )}
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center mt-6">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No appraisals added yet</h3>
            <p className="text-slate-600 mb-6">Click "Add Appraisal" to create your first employee appraisal</p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg rounded-xl px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Appraisal
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">
        {label}
      </p>
      <p className="text-sm text-slate-800">{value ?? "—"}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number | null | undefined;
  color: "blue" | "emerald" | "violet";
}) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          container: "bg-gradient-to-br from-slate-50 to-blue-50 border-blue-100",
          icon: "bg-gradient-to-br from-blue-500 to-blue-600",
        };
      case "emerald":
        return {
          container: "bg-gradient-to-br from-slate-50 to-emerald-50 border-emerald-100",
          icon: "bg-gradient-to-br from-emerald-500 to-emerald-600",
        };
      case "violet":
        return {
          container: "bg-gradient-to-br from-slate-50 to-violet-50 border-violet-100",
          icon: "bg-gradient-to-br from-violet-500 to-violet-600",
        };
      default:
        return {
          container: "bg-gradient-to-br from-slate-50 to-blue-50 border-blue-100",
          icon: "bg-gradient-to-br from-blue-500 to-blue-600",
        };
    }
  };

  const classes = getColorClasses(color);

  return (
    <div
      className={`p-4 rounded-xl border flex items-center gap-4 ${classes.container}`}
    >
      <div className={`p-3 rounded-full ${classes.icon}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-600 uppercase">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function readDtoField(dto: any, base: string, n?: number) {
  if (!dto) return "";

  const pad = (num: number) => String(num).padStart(2, "0");
  const candidates: string[] = [];
  if (n != null) {
    candidates.push(`${base}${n}`, `${base}_${n}`, `${base}${pad(n)}`, `${base}_${pad(n)}`, `${base}${n}`.toLowerCase());
  } else {
    candidates.push(base, base.toLowerCase(), base.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`));
  }

  // try direct candidates first
  for (const k of candidates) {
    if (k in dto) {
      const v = dto[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    }
  }

  // as a final fallback, match by normalized key (remove non-alphanum and compare lowercase)
  const target = (n != null ? `${base}${n}` : base).replace(/[^a-z0-9]/gi, "").toLowerCase();
  for (const key of Object.keys(dto)) {
    const norm = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (norm === target) {
      const v = dto[key];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    }
  }

  return "";
}