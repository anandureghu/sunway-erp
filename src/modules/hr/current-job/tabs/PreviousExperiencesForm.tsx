import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PreviousExperiencesForm() {
  const [isEdit, setIsEdit] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {!isEdit ? (
          <Button onClick={() => setIsEdit(true)} variant="outline">
            ✏️ Edit/Update
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEdit(false)} variant="secondary">Cancel</Button>
            <Button onClick={() => setIsEdit(false)}>Save</Button>
          </div>
        )}
      </div>

      <Section title="Experience 1">
        <Row label="Previous Company:">
          <Input placeholder="Enter previous company" disabled={!isEdit} />
        </Row>
        <Row label="Last Job Title:">
          <Input placeholder="Enter last job title" disabled={!isEdit} />
        </Row>
        <Row label="Last Date Worked:">
          <Input type="date" placeholder="dd-mm-yyyy" disabled={!isEdit} />
        </Row>
        <Row label="Number of Years:">
          <Input placeholder="Enter years" disabled={!isEdit} />
        </Row>
      </Section>
    </div>
  );
}

function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="rounded-md border">
      <div className="px-4 py-3 border-b text-lg font-semibold">{title}</div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Row({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <div className="grid grid-cols-12 gap-0 border rounded-md">
      <div className="col-span-5 bg-gray-50 px-3 py-2 font-medium">{label}</div>
      <div className="col-span-7 px-3 py-2">{children}</div>
    </div>
  );
}
