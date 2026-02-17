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

  useEffect(() => {
    setForm({ ...value });
  }, [value]);

  const updateLocal = (k: keyof AppModel, v: any) => {
    if (k === "id" || k === "_localId") return;

    setForm((prev) => {
      const next = { ...prev, [k]: v };

      // Calculate overall performance if rating changed
      if (k.startsWith('rating')) {
        const ratings = [1, 2, 3, 4, 5].map(n => {
          const ratingKey = `rating${n}` as keyof AppModel;
          const rating = next[ratingKey];
          return rating ? Number(rating) : 0;
        }).filter(r => r > 0);

        if (ratings.length > 0) {
          const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          next.overallPerformance = Math.round(average * 100) / 100; // round to 2 decimals
        } else {
          next.overallPerformance = undefined;
        }
      }

      onChange({ ...next }); // push full updated state
      return next;
    });
  };
  const handleSave = () => {
    // push full latest state to parent FIRST
    onChange({ ...form });

    // allow parent state to update before save
    setTimeout(() => {
      onSave();
    }, 0);
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Month <span className="text-orange-500">*</span>
          </label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        <div className="w-32">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Year <span className="text-orange-500">*</span>
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={String(form.year || new Date().getFullYear())}
            onChange={(e) =>
              updateLocal("year", Number(e.target.value) || "")
            }
          />
        </div>
      </div>

      {/* JOB CODE */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Job Code</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={form.jobCode || ""}
          onChange={(e) => updateLocal("jobCode", e.target.value)}
          placeholder="Enter job code"
        />
      </div>

      {/* KPI GRID */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* KPI 1 */}
        <div className="border border-slate-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">KPI 1</label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            value={form.kpi1 || ""}
            onChange={(e) => updateLocal("kpi1", e.target.value)}
            placeholder="e.g., Sales Target Achievement"
          />
          <label className="block text-sm font-medium text-slate-700 mb-2">Review 1</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            value={form.review1 || ""}
            onChange={(e) => updateLocal("review1", e.target.value)}
            rows={4}
          />
          <label className="block text-sm font-medium text-slate-700 mb-2">Ratings</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.rating1 || ""}
            onChange={(e) => updateLocal("rating1", e.target.value)}
          >
            <option value="">Select Rating</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        {/* KPI 2 */}
        <div className="border border-slate-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">KPI 2</label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            value={form.kpi2 || ""}
            onChange={(e) => updateLocal("kpi2", e.target.value)}
            placeholder="e.g., Customer Satisfaction"
          />
          <label className="block text-sm font-medium text-slate-700 mb-2">Review 2</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            value={form.review2 || ""}
            onChange={(e) => updateLocal("review2", e.target.value)}
            rows={4}
          />
          <label className="block text-sm font-medium text-slate-700 mb-2">Ratings</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.rating2 || ""}
            onChange={(e) => updateLocal("rating2", e.target.value)}
          >
            <option value="">Select Rating</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        {/* KPI 3 */}
        <div className="border border-slate-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">KPI 3</label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            value={form.kpi3 || ""}
            onChange={(e) => updateLocal("kpi3", e.target.value)}
            placeholder="e.g., Project Delivery"
          />
          <label className="block text-sm font-medium text-slate-700 mb-2">Review 3</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            value={form.review3 || ""}
            onChange={(e) => updateLocal("review3", e.target.value)}
            rows={4}
          />
          <label className="block text-sm font-medium text-slate-700 mb-2">Ratings</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.rating3 || ""}
            onChange={(e) => updateLocal("rating3", e.target.value)}
          >
            <option value="">Select Rating</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        {/* KPI 4 */}
        <div className="border border-slate-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">KPI 4</label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            value={form.kpi4 || ""}
            onChange={(e) => updateLocal("kpi4", e.target.value)}
            placeholder="e.g., Team Collaboration"
          />
          <label className="block text-sm font-medium text-slate-700 mb-2">Review 4</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            value={form.review4 || ""}
            onChange={(e) => updateLocal("review4", e.target.value)}
            rows={4}
          />
          <label className="block text-sm font-medium text-slate-700 mb-2">Ratings</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.rating4 || ""}
            onChange={(e) => updateLocal("rating4", e.target.value)}
          >
            <option value="">Select Rating</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        {/* KPI 5 */}
        <div className="border border-slate-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">KPI 5</label>
          <input
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            value={form.kpi5 || ""}
            onChange={(e) => updateLocal("kpi5", e.target.value)}
            placeholder="e.g., Professional Development"
          />
          <label className="block text-sm font-medium text-slate-700 mb-2">Review 5</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
            value={form.review5 || ""}
            onChange={(e) => updateLocal("review5", e.target.value)}
            rows={4}
          />
          <label className="block text-sm font-medium text-slate-700 mb-2">Ratings</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.rating5 || ""}
            onChange={(e) => updateLocal("rating5", e.target.value)}
          >
            <option value="">Select Rating</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>

        {/* OVERALL PERFORMANCE */}
        <div className="border border-slate-200 rounded-lg p-4 col-span-full">
          <label className="block text-sm font-medium text-slate-700 mb-2">Overall Performance</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
            value={form.overallPerformance || ""}
            readOnly
            placeholder="Calculated average rating"
          />
        </div>

        {/* COMMENTS */}
        <div className="border border-slate-200 rounded-lg p-4 col-span-full">
          <label className="block text-sm font-medium text-slate-700 mb-2">Employee Comments</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            value={form.employeeComments || ""}
            onChange={(e) =>
              updateLocal("employeeComments", e.target.value)
            }
            rows={4}
          />

          <label className="block text-sm font-medium text-slate-700 mb-2">Manager Comments</label>
          <textarea
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={form.managerComments || ""}
            onChange={(e) =>
              updateLocal("managerComments", e.target.value)
            }
            rows={4}
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 justify-end mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
}
