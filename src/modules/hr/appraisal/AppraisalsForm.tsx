import type { ReactElement } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppraisalEditor from "./AppraisalEditor";
import { Plus, Trash2, Eye } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { appraisalService } from "@/service/appraisalService";
import { toast } from "sonner";

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
  year: 2026,

  kpi1: "",
  review1: "",
  kpi2: "",
  review2: "",
  kpi3: "",
  review3: "",
  kpi4: "",
  review4: "",
  kpi5: "",
  review5: "",

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

export default function AppraisalsForm(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const [items, setItems] = useState<AppModel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const ignoreNextSaveRef = useRef(false);

  const reload = useCallback(async () => {
    if (!empId) return;
    try {
      const data = await appraisalService.list(empId);
      setItems(
        (data || []).map((d: any) => ({
          id: d.id,
          month: d.month ?? "",
          year: d.year ?? "",
          jobCode: d.jobCode ?? "",
          employeeComments: d.employeeComments ?? "",
          managerComments: d.managerComments ?? "",
          kpi1: d.kpi1 ?? "", review1: d.review1 ?? "",
          kpi2: d.kpi2 ?? "", review2: d.review2 ?? "",
          kpi3: d.kpi3 ?? "", review3: d.review3 ?? "",
          kpi4: d.kpi4 ?? "", review4: d.review4 ?? "",
          kpi5: d.kpi5 ?? "", review5: d.review5 ?? "",
        }))
      );
    } catch {
      toast.error("Failed to load appraisals");
    }
  }, [empId]);

  useEffect(() => { void reload(); }, [reload]);

  const handleAdd = () => {
    const newItem: AppModel = {
      ...EMPTY,
      _localId: String(Date.now()),
    };
    setItems((cur) => [...cur, newItem]);
    setEditingId(String(newItem._localId));
  };

  /* ============================
     UPDATE ITEM
  ============================ */
  const updateItem = (idKey: string | number | undefined, patch: Partial<AppModel>) => {
    setItems((cur) =>
      cur.map((it) =>
        String(it._localId ?? it.id) === String(idKey)
          ? { ...it, ...patch }
          : it
      )
    );
  };

  /* ============================
     SAVE (FIXED)
  ============================ */
  const handleSave = async (it: AppModel) => {
    if (!empId) return;

    if (!it.month || !it.year) {
      toast.error("Month and year required");
      return;
    }

    const payload = toPayload(it);
    console.log("Submitting payload:", payload);

    try {
      if (it.id && Number(it.id)) {
        await appraisalService.updateById(empId, Number(it.id), payload);
        toast.success("Appraisal updated");
      } else {
        await appraisalService.create(empId, payload);
        toast.success("Appraisal created");
      }

      await reload();
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save appraisal");
    }
  };

  /* ============================
     DELETE
  ============================ */
  const handleDelete = async (appId?: number | string) => {
    if (!empId) return;
    if (!window.confirm("Delete appraisal?")) return;

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

  /* ============================
     CANCEL
  ============================ */
  const handleCancel = () => {
    ignoreNextSaveRef.current = true;
    setEditingId(null);
  };

  /* ============================
     GLOBAL SAVE EVENT
  ============================ */
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

  /* ============================
     RENDER
  ============================ */
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Employee Appraisals</h2>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Appraisal
        </Button>
      </div>

      <div className="grid gap-4">
        {items.map((it) => (
          <Card key={String(it._localId ?? it.id)}>
            <CardContent className="p-4">
              {String(editingId) === String(it._localId ?? it.id) ? (
                <AppraisalEditor
                  value={it}
                  onChange={(patch) => updateItem(it._localId ?? it.id, patch)}
                  onSave={() => void handleSave(it)}
                  onCancel={handleCancel}
                />
              ) : (
                <div className="space-y-4">
                  {String(viewingId) !== String(it._localId ?? it.id) && (
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{it.month} / {it.year}</h3>
                        <p className="text-sm text-gray-500">{it.jobCode || ""}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingId(String(it._localId ?? it.id))}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(String(it._localId ?? it.id))}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(it._localId ?? it.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {String(viewingId) === String(it._localId ?? it.id) && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Month</p>
                          <p className="text-sm mt-1">{it.month || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Year</p>
                          <p className="text-sm mt-1">{it.year || "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Job Code</p>
                          <p className="text-sm mt-1">{it.jobCode || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Employee Comments</p>
                          <p className="text-sm mt-1">{it.employeeComments || "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Manager Comments</p>
                          <p className="text-sm mt-1">{it.managerComments || "—"}</p>
                        </div>
                      </div>

                      {[1, 2, 3, 4, 5].map(num => (
                        <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">KPI {num}</p>
                            <p className="text-sm mt-1">{it[`kpi${num}` as keyof AppModel] || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Review {num}</p>
                            <p className="text-sm mt-1">{it[`review${num}` as keyof AppModel] || "—"}</p>
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={() => setViewingId(null)}>
                          Close
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setViewingId(null);
                            setEditingId(String(it._localId ?? it.id));
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No appraisals added yet. Click "Add Appraisal" to add one.
        </div>
      )}
    </div>
  );
}
