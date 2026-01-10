import { useEffect, useState } from "react";
import type { AppModel } from "./AppraisalsForm";
import { Button } from "@/components/ui/button";

type Props = {
  value: AppModel;
  onChange: (patch: Partial<AppModel>) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function AppraisalEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: Props) {
  const [form, setForm] = useState<AppModel>({ ...value });

  /* ============================
     SYNC FROM PARENT
  ============================ */
  useEffect(() => {
    setForm({ ...value });
  }, [value]);

  /* ============================
     UPDATE LOCAL + PARENT
  ============================ */
  const updateLocal = (k: keyof AppModel, v: any) => {
    if (k === "id" || k === "_localId") return;

    setForm((prev) => {
      const next = { ...prev, [k]: v };
      onChange({ [k]: v }); // push immediately to parent
      return next;
    });
  };

  /* ============================
     SAVE (CRITICAL FIX)
  ============================ */
  const handleSave = () => {
    // push full latest state to parent FIRST
    onChange({ ...form });

    // allow parent state to update before save
    setTimeout(() => {
      onSave();
    }, 0);
  };

  return (
    <div>
      <style>{`
        .ae-container { background: white; border-radius: 12px; padding: 16px; }
        .ae-period { display:flex; gap:12px; margin-bottom:16px; }
        .ae-grid { display:grid; gap:12px; grid-template-columns: repeat(2, 1fr); }
        .ae-card { border:1px solid #e6eef5; border-radius:10px; padding:12px; }
        label { display:block; font-weight:600; margin-bottom:6px; }
        input, textarea, select { width:100%; padding:10px; border:1px solid #e0e6ed; border-radius:8px; }
        .ae-buttons { display:flex; gap:8px; justify-content:flex-end; margin-top:12px; }
      `}</style>

      <div className="ae-container">
        {/* PERIOD */}
        <div className="ae-period">
          <div style={{ flex: 1 }}>
            <label>
              Month <span style={{ color: "#E67E22" }}>*</span>
            </label>
            <select
              value={form.month || ""}
              onChange={(e) => updateLocal("month", e.target.value)}
            >
              <option value="">Select Month</option>
              <option value="january">January</option>
              <option value="february">February</option>
              <option value="march">March</option>
              <option value="april">April</option>
              <option value="may">May</option>
              <option value="june">June</option>
              <option value="july">July</option>
              <option value="august">August</option>
              <option value="september">September</option>
              <option value="october">October</option>
              <option value="november">November</option>
              <option value="december">December</option>
            </select>
          </div>

          <div style={{ width: 140 }}>
            <label>
              Year <span style={{ color: "#E67E22" }}>*</span>
            </label>
            <input
              type="number"
              value={String(form.year || new Date().getFullYear())}
              onChange={(e) =>
                updateLocal("year", Number(e.target.value) || "")
              }
            />
          </div>
        </div>

        {/* KPI GRID */}
        <div className="ae-grid">
          {/* KPI 1 */}
          <div className="ae-card">
            <label>KPI 1</label>
            <input
              value={form.kpi1 || ""}
              onChange={(e) => updateLocal("kpi1", e.target.value)}
              placeholder="e.g., Sales Target Achievement"
            />
            <label style={{ marginTop: 12 }}>Review 1</label>
            <textarea
              value={form.review1 || ""}
              onChange={(e) => updateLocal("review1", e.target.value)}
              rows={4}
            />
          </div>

          {/* KPI 2 */}
          <div className="ae-card">
            <label>KPI 2</label>
            <input
              value={form.kpi2 || ""}
              onChange={(e) => updateLocal("kpi2", e.target.value)}
              placeholder="e.g., Customer Satisfaction"
            />
            <label style={{ marginTop: 12 }}>Review 2</label>
            <textarea
              value={form.review2 || ""}
              onChange={(e) => updateLocal("review2", e.target.value)}
              rows={4}
            />
          </div>

          {/* KPI 3 */}
          <div className="ae-card">
            <label>KPI 3</label>
            <input
              value={form.kpi3 || ""}
              onChange={(e) => updateLocal("kpi3", e.target.value)}
              placeholder="e.g., Project Delivery"
            />
            <label style={{ marginTop: 12 }}>Review 3</label>
            <textarea
              value={form.review3 || ""}
              onChange={(e) => updateLocal("review3", e.target.value)}
              rows={4}
            />
          </div>

          {/* KPI 4 */}
          <div className="ae-card">
            <label>KPI 4</label>
            <input
              value={form.kpi4 || ""}
              onChange={(e) => updateLocal("kpi4", e.target.value)}
              placeholder="e.g., Team Collaboration"
            />
            <label style={{ marginTop: 12 }}>Review 4</label>
            <textarea
              value={form.review4 || ""}
              onChange={(e) => updateLocal("review4", e.target.value)}
              rows={4}
            />
          </div>

          {/* KPI 5 */}
          <div className="ae-card">
            <label>KPI 5</label>
            <input
              value={form.kpi5 || ""}
              onChange={(e) => updateLocal("kpi5", e.target.value)}
              placeholder="e.g., Professional Development"
            />
            <label style={{ marginTop: 12 }}>Review 5</label>
            <textarea
              value={form.review5 || ""}
              onChange={(e) => updateLocal("review5", e.target.value)}
              rows={4}
            />
          </div>

          {/* COMMENTS */}
          <div className="ae-card" style={{ gridColumn: "1 / -1" }}>
            <label>Employee Comments</label>
            <textarea
              value={form.employeeComments || ""}
              onChange={(e) =>
                updateLocal("employeeComments", e.target.value)
              }
              rows={4}
            />

            <label style={{ marginTop: 12 }}>Manager Comments</label>
            <textarea
              value={form.managerComments || ""}
              onChange={(e) =>
                updateLocal("managerComments", e.target.value)
              }
              rows={4}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="ae-buttons">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
