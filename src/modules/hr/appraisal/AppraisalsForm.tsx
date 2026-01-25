import type { ReactElement } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppraisalEditor from "./AppraisalEditor";
import { Plus, Trash2, Eye, FileText, Calendar, TrendingUp, MessageSquare } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { appraisalService } from "@/service/appraisalService";
import { toast } from "sonner";

/* ================= TYPES ================= */

export type AppModel = {
  id?: number | string;
  _localId?: string;

  month: string;
  year: number | string;

  jobCode?: string;
  employeeComments?: string;
  managerComments?: string;

  kpi1?: string; review1?: string;
  kpi2?: string; review2?: string;
  kpi3?: string; review3?: string;
  kpi4?: string; review4?: string;
  kpi5?: string; review5?: string;
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

/* ================= PAYLOAD ================= */

function toPayload(it: AppModel) {
  return {
    month: String(it.month).toLowerCase(),
    year: Number(it.year),

    jobCode: it.jobCode || undefined,
    employeeComments: it.employeeComments || undefined,
    managerComments: it.managerComments || undefined,

    kpi1: it.kpi1 || undefined,
    review1: it.review1 || undefined,
    kpi2: it.kpi2 || undefined,
    review2: it.review2 || undefined,
    kpi3: it.kpi3 || undefined,
    review3: it.review3 || undefined,
    kpi4: it.kpi4 || undefined,
    review4: it.review4 || undefined,
    kpi5: it.kpi5 || undefined,
    review5: it.review5 || undefined,
  };
}

/* ================= COMPONENT ================= */

export default function AppraisalsForm(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const [items, setItems] = useState<AppModel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const ignoreNextSaveRef = useRef(false);

  /* ================= LOAD ================= */

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

  /* ================= ACTIONS ================= */

  const handleAdd = () => {
    const newItem: AppModel = { ...EMPTY, _localId: String(Date.now()) };
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

  const handleSave = async (it: AppModel) => {
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
  };

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

  /* ================= GLOBAL SAVE ================= */

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
  }, [editingId, items]);

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="p-8 border-b bg-gradient-to-r from-white to-slate-50">
          <h2 className="font-serif text-3xl font-semibold text-slate-800">
            Employee Performance Review
          </h2>
          <p className="text-slate-500 mt-1">
            Comprehensive performance evaluation
          </p>
        </div>

        {/* CONTENT */}
        <div className="p-8 space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Appraisal
            </Button>
          </div>

          {items.map((it) => {
            const key = String(it._localId ?? it.id);
            const editing = editingId === key;
            const viewing = viewingId === key;

            return (
              <Card key={key} className="rounded-2xl shadow-sm">
                <CardContent className="p-6">

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
                              className="hover:bg-blue-50 rounded-lg"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(key)}
                              className="hover:bg-indigo-50 rounded-lg"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(it._localId ?? it.id)}
                              className="hover:bg-red-50 text-red-600 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">
                              {it.month || "—"} {it.year || "—"} Performance Review
                            </h3>
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
                      )
                    }
                  </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================= DETAIL ITEM ================= */

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

/* ================= INFO CARD ================= */

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

// add helper to normalize DTO field names
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
