import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppraisalCtx } from "../AppraisalShell";
import { useState, useCallback, useEffect } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import type { ReactElement } from "react";
import { performanceService } from "@/service/performanceService";
import { toast } from "sonner";


type Perf = {
  month: string;
  year: string;
  kpi1: string; kpi2: string; kpi3: string; kpi4: string; kpi5: string;
  rev1: string; rev2: string; rev3: string; rev4: string; rev5: string;
};

const SEED: Perf = {
  month: "",
  year: "",
  kpi1: "", kpi2: "", kpi3: "", kpi4: "", kpi5: "",
  rev1: "", rev2: "", rev3: "", rev4: "", rev5: "",
};

export default function PerformanceForm(): ReactElement {
  const { editing } = useOutletContext<AppraisalCtx>();
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const [performance, setPerformance] = useState<Perf>(SEED);
  const [exists, setExists] = useState(false); // whether performance record exists on server

  const normalizeMonth = (m: string) => m.toLowerCase().trim();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!empId || !performance.month || !performance.year) return;
      const month = normalizeMonth(performance.month);
      try {
        const data = await performanceService.get(empId, month, Number(performance.year));
        if (!mounted) return;
        if (data) {
          setExists(true);
          setPerformance((p) => ({
            ...p,
            kpi1: data.kpi1 ?? "",
            kpi2: data.kpi2 ?? "",
            kpi3: data.kpi3 ?? "",
            kpi4: data.kpi4 ?? "",
            kpi5: data.kpi5 ?? "",
            rev1: data.review1 ?? "",
            rev2: data.review2 ?? "",
            rev3: data.review3 ?? "",
            rev4: data.review4 ?? "",
            rev5: data.review5 ?? "",
            month: data.month ?? p.month,
            year: data.year ? String(data.year) : p.year,
          }));
        }
      } catch {
        setExists(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [empId, performance.month, performance.year]);

  const set = useCallback((k: keyof Perf, v: string) => setPerformance((d) => ({ ...d, [k]: v })), []);

  const savePerformance = useCallback(async () => {
    if (!empId || !performance.month || !performance.year) {
      toast.error("Month and year required");
      return;
    }

    try {
      const month = normalizeMonth(performance.month);
      const payload = {
        kpi1: performance.kpi1 || undefined,
        review1: performance.rev1 || undefined,
        kpi2: performance.kpi2 || undefined,
        review2: performance.rev2 || undefined,
        kpi3: performance.kpi3 || undefined,
        review3: performance.rev3 || undefined,
        kpi4: performance.kpi4 || undefined,
        review4: performance.rev4 || undefined,
        kpi5: performance.kpi5 || undefined,
        review5: performance.rev5 || undefined,
      };

      const body = exists
        ? await performanceService.update(empId, month, Number(performance.year), payload)
        : await performanceService.create(empId, month, Number(performance.year), payload);

      setExists(true);

      if (body) {
        setPerformance((p) => ({
          ...p,
          kpi1: body.kpi1 ?? "",
          kpi2: body.kpi2 ?? "",
          kpi3: body.kpi3 ?? "",
          kpi4: body.kpi4 ?? "",
          kpi5: body.kpi5 ?? "",
          rev1: body.review1 ?? "",
          rev2: body.review2 ?? "",
          rev3: body.review3 ?? "",
          rev4: body.review4 ?? "",
          rev5: body.review5 ?? "",
          month: body.month ?? p.month,
          year: body.year ? String(body.year) : p.year,
        }));
      }
      toast.success("Performance saved");
      try { document.dispatchEvent(new CustomEvent("appraisal:saved")); } catch (err) { void err; }
    } catch (err: any) {
      toast.error(performanceService.extractErrorMessage(err));
    }
  }, [empId, performance]);

  useEffect(() => {
    const onSave = () => savePerformance();
    const onCancel = async () => {
      if (!empId || !performance.month || !performance.year) return;
      const month = performance.month.toLowerCase().trim();
      try {
        const data = await performanceService.get(empId, month, Number(performance.year));
        if (data) setPerformance((p) => ({
          ...p,
          kpi1: data.kpi1 ?? "",
          kpi2: data.kpi2 ?? "",
          kpi3: data.kpi3 ?? "",
          kpi4: data.kpi4 ?? "",
          kpi5: data.kpi5 ?? "",
          rev1: data.review1 ?? "",
          rev2: data.review2 ?? "",
          rev3: data.review3 ?? "",
          rev4: data.review4 ?? "",
          rev5: data.review5 ?? "",
        }));
      } catch (err) {
        void err;
      }
    };

    document.addEventListener("appraisal:save", onSave as EventListener);
    document.addEventListener("appraisal:cancel", onCancel as EventListener);
    return () => {
      document.removeEventListener("appraisal:save", onSave as EventListener);
      document.removeEventListener("appraisal:cancel", onCancel as EventListener);
    };
  }, [savePerformance, empId, performance.month, performance.year]);

  return (
    <div className="space-y-6">
      <Section title="Employee Performance">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Month:" required>
            <Input
              disabled={!editing}
              value={performance.month}
              onChange={(e) => set("month", e.target.value)}
              aria-label="Month"
              placeholder="e.g. January"
              required
            />
          </Field>
          <Field label="Year:" required>
            <Input
              disabled={!editing}
              value={performance.year}
              onChange={(e) => set("year", e.target.value)}
              aria-label="Year"
              placeholder="e.g. 2024"
              required
            />
          </Field>

          <Field label="KPI 1:">
            <Input disabled={!editing} value={performance.kpi1} onChange={(e) => set("kpi1", e.target.value)} aria-label="KPI 1" />
          </Field>
          <Field label="Review 1:">
            <Input disabled={!editing} value={performance.rev1} onChange={(e) => set("rev1", e.target.value)} aria-label="Review 1" />
          </Field>

          <Field label="KPI 2:">
            <Input disabled={!editing} value={performance.kpi2} onChange={(e) => set("kpi2", e.target.value)} aria-label="KPI 2" />
          </Field>
          <Field label="Review 2:">
            <Input disabled={!editing} value={performance.rev2} onChange={(e) => set("rev2", e.target.value)} aria-label="Review 2" />
          </Field>

          <Field label="KPI 3:">
            <Input disabled={!editing} value={performance.kpi3} onChange={(e) => set("kpi3", e.target.value)} aria-label="KPI 3" />
          </Field>
          <Field label="Review 3:">
            <Input disabled={!editing} value={performance.rev3} onChange={(e) => set("rev3", e.target.value)} aria-label="Review 3" />
          </Field>

          <Field label="KPI 4:">
            <Input disabled={!editing} value={performance.kpi4} onChange={(e) => set("kpi4", e.target.value)} aria-label="KPI 4" />
          </Field>
          <Field label="Review 4:">
            <Input disabled={!editing} value={performance.rev4} onChange={(e) => set("rev4", e.target.value)} aria-label="Review 4" />
          </Field>

          <Field label="KPI 5:">
            <Input disabled={!editing} value={performance.kpi5} onChange={(e) => set("kpi5", e.target.value)} aria-label="KPI 5" />
          </Field>
          <Field label="Review 5:">
            <Input disabled={!editing} value={performance.rev5} onChange={(e) => set("rev5", e.target.value)} aria-label="Review 5" />
          </Field>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-base font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
