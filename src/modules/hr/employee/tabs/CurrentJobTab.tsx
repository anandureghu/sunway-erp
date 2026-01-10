import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const EMPTY_FORM = {
  jobCode: "",
  jobTitle: "",
  jobLevel: "",
  departmentCode: "",
  departmentNumber: "",
  grade: "",
  startDate: "",
  expectedEndDate: "",
  effectiveFrom: "",
};

export default function CurrentJobTab() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const onChange =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      {/* ROW 1: Job identity */}
      <Row>
        <Field label="Job Code *">
          <Input value={form.jobCode} onChange={onChange("jobCode")} disabled={!editing} />
        </Field>

        <Field label="Job Title *">
          <Input value={form.jobTitle} onChange={onChange("jobTitle")} disabled={!editing} />
        </Field>

        <Field label="Job Level">
          <Input value={form.jobLevel} onChange={onChange("jobLevel")} disabled={!editing} />
        </Field>
      </Row>

      {/* ROW 2: Department */}
      <Row>
        <Field label="Department Code *">
          <Input value={form.departmentCode} onChange={onChange("departmentCode")} disabled={!editing} />
        </Field>

        <Field label="Department Name">
          <Input value={form.departmentNumber} onChange={onChange("departmentNumber")} disabled={!editing} />
        </Field>

        <Field label="Grade">
          <Input value={form.grade} onChange={onChange("grade")} disabled={!editing} />
        </Field>
      </Row>

      {/* ROW 3: Dates */}
      <Row>
        <Field label="Effective From *">
          <Input placeholder="dd-mm-yyyy" value={form.effectiveFrom} onChange={onChange("effectiveFrom")} disabled={!editing} />
        </Field>

        <Field label="Start Date *">
          <Input placeholder="dd-mm-yyyy" value={form.startDate} onChange={onChange("startDate")} disabled={!editing} />
        </Field>

        <Field label="Expected End Date">
          <Input placeholder="dd-mm-yyyy" value={form.expectedEndDate} onChange={onChange("expectedEndDate")} disabled={!editing} />
        </Field>
      </Row>

      <div className="flex gap-2">
        {!editing ? (
          <Button onClick={() => setEditing(true)}>Edit / Update</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={() => setEditing(false)}>Save</Button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {children}
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

