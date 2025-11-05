import React, { useState, useCallback } from "react";
import type { PropsWithChildren } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type EducationData = {
  schoolName: string;
  yearGraduated: string;
  degreeEarned: string;
  major: string;
  awards: string;
  notes: string;
};

const INITIAL_DATA: EducationData = {
  schoolName: "",
  yearGraduated: "",
  degreeEarned: "",
  major: "",
  awards: "",
  notes: "",
};

export default function EducationQualificationsForm(): React.ReactElement {
  const [isEdit, setIsEdit] = useState(false);
  const [original, setOriginal] = useState<EducationData>(INITIAL_DATA);
  const [form, setForm] = useState<EducationData>(original);

  const handleEdit = useCallback(() => {
    // restore current data into the editable form
    setForm(original);
    setIsEdit(true);
  }, [original]);

  const handleCancel = useCallback(() => {
    // revert changes
    setForm(original);
    setIsEdit(false);
  }, [original]);

  const handleSave = useCallback(() => {
    // persist changes (placeholder)
    setOriginal(form);
    setIsEdit(false);
    // TODO: replace with API call
    // small console output for dev visibility
    // eslint-disable-next-line no-console
    console.log("Saved education data:", form);
  }, [form]);

  const handleChange = useCallback((field: keyof EducationData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {!isEdit ? (
          <Button onClick={handleEdit} variant="outline" aria-label="Edit education">
            ✏️ Edit/Update
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="secondary" aria-label="Cancel editing">
              Cancel
            </Button>
            <Button onClick={handleSave} aria-label="Save education">Save</Button>
          </div>
        )}
      </div>

      <Section title="Education 1">
        <Row label="School Name:">
          <Input
            value={form.schoolName}
            onChange={e => handleChange("schoolName", e.target.value)}
            placeholder="Enter school name"
            disabled={!isEdit}
            aria-label="School Name"
          />
        </Row>

        <Row label="Year Graduated:">
          <Input
            value={form.yearGraduated}
            onChange={e => handleChange("yearGraduated", e.target.value)}
            placeholder="Enter year"
            disabled={!isEdit}
            aria-label="Year Graduated"
          />
        </Row>

        <Row label="Degree Earned:">
          <Input
            value={form.degreeEarned}
            onChange={e => handleChange("degreeEarned", e.target.value)}
            placeholder="Enter degree"
            disabled={!isEdit}
            aria-label="Degree Earned"
          />
        </Row>

        <Row label="Major:">
          <Input
            value={form.major}
            onChange={e => handleChange("major", e.target.value)}
            placeholder="Enter major"
            disabled={!isEdit}
            aria-label="Major"
          />
        </Row>

        <Row label="Awards and Certificates:">
          <Input
            value={form.awards}
            onChange={e => handleChange("awards", e.target.value)}
            placeholder="Enter awards"
            disabled={!isEdit}
            aria-label="Awards and Certificates"
          />
        </Row>

        <Row label="Notes/Remarks:">
          <Input
            value={form.notes}
            onChange={e => handleChange("notes", e.target.value)}
            placeholder="Enter notes"
            disabled={!isEdit}
            aria-label="Notes or Remarks"
          />
        </Row>
      </Section>
    </div>
  );
}

function Section({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="rounded-md border">
      <div className="px-4 py-3 border-b text-lg font-semibold">{title}</div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Row({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <div className="grid grid-cols-12 gap-0 border rounded-md">
      <div className="col-span-5 bg-gray-50 px-3 py-2 font-medium">{label}</div>
      <div className="col-span-7 px-3 py-2">{children}</div>
    </div>
  );
}
