import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // your shadcn textarea
import type { AppraisalCtx } from "../AppraisalShell";
import { useState, useCallback } from "react";
import type { ReactElement } from "react";

type AppraisalModel = {
  jobCode: string;
  employeeComments: string;
  managerComments: string;
};

const SEED: AppraisalModel = {
  jobCode: "",
  employeeComments: "",
  managerComments: "",
};

export default function AppraisalForm(): ReactElement {
  const { editing } = useOutletContext<AppraisalCtx>();
  const [data, setData] = useState<AppraisalModel>(SEED);

  const set = useCallback((k: keyof AppraisalModel, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
  }, []);

  return (
    <div className="space-y-6">
      <Section title="Employee Appraisal">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Job Code:">
            <Input
              disabled={!editing}
              value={data.jobCode}
              onChange={(e) => set("jobCode", e.target.value)}
              aria-label="Job Code"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Employee Comments:">
              <Textarea
                disabled={!editing}
                value={data.employeeComments}
                onChange={(e) => set("employeeComments", e.target.value)}
                className="min-h-[280px]"
                aria-label="Employee Comments"
              />
            </Field>
            <Field label="Manager Comments:">
              <Textarea
                disabled={!editing}
                value={data.managerComments}
                onChange={(e) => set("managerComments", e.target.value)}
                className="min-h-[280px]"
                aria-label="Manager Comments"
              />
            </Field>
          </div>
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
