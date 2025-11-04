import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppraisalCtx } from "../AppraisalShell";
import { useState, useCallback } from "react";
import type { ReactElement } from "react";

type Perf = {
  kpi1: string; kpi2: string; kpi3: string; kpi4: string; kpi5: string;
  rev1: string; rev2: string; rev3: string; rev4: string; rev5: string;
};

const SEED: Perf = {
  kpi1: "", kpi2: "", kpi3: "", kpi4: "", kpi5: "",
  rev1: "", rev2: "", rev3: "", rev4: "", rev5: "",
};

export default function PerformanceForm(): ReactElement {
  const { editing } = useOutletContext<AppraisalCtx>();
  const [data, setData] = useState<Perf>(SEED);

  const set = useCallback((k: keyof Perf, v: string) => setData((d) => ({ ...d, [k]: v })), []);

  return (
    <div className="space-y-6">
      <Section title="Employee Performance">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="KPI 1:">
            <Input disabled={!editing} value={data.kpi1} onChange={(e) => set("kpi1", e.target.value)} aria-label="KPI 1" />
          </Field>
          <Field label="Review 1:">
            <Input disabled={!editing} value={data.rev1} onChange={(e) => set("rev1", e.target.value)} aria-label="Review 1" />
          </Field>

          <Field label="KPI 2:">
            <Input disabled={!editing} value={data.kpi2} onChange={(e) => set("kpi2", e.target.value)} aria-label="KPI 2" />
          </Field>
          <Field label="Review 2:">
            <Input disabled={!editing} value={data.rev2} onChange={(e) => set("rev2", e.target.value)} aria-label="Review 2" />
          </Field>

          <Field label="KPI 3:">
            <Input disabled={!editing} value={data.kpi3} onChange={(e) => set("kpi3", e.target.value)} aria-label="KPI 3" />
          </Field>
          <Field label="Review 3:">
            <Input disabled={!editing} value={data.rev3} onChange={(e) => set("rev3", e.target.value)} aria-label="Review 3" />
          </Field>

          <Field label="KPI 4:">
            <Input disabled={!editing} value={data.kpi4} onChange={(e) => set("kpi4", e.target.value)} aria-label="KPI 4" />
          </Field>
          <Field label="Review 4:">
            <Input disabled={!editing} value={data.rev4} onChange={(e) => set("rev4", e.target.value)} aria-label="Review 4" />
          </Field>

          <Field label="KPI 5:">
            <Input disabled={!editing} value={data.kpi5} onChange={(e) => set("kpi5", e.target.value)} aria-label="KPI 5" />
          </Field>
          <Field label="Review 5:">
            <Input disabled={!editing} value={data.rev5} onChange={(e) => set("rev5", e.target.value)} aria-label="Review 5" />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
