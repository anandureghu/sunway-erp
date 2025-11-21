import React, { useState, useCallback, useEffect } from "react";
import type { PropsWithChildren } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type EducationData = {
  schoolName: string;
  schoolAddress: string;
  yearGraduated: string;
  degreeEarned: string;
  major: string;
  awards: string;
  notes: string;
};

const INITIAL_DATA: EducationData = {
  schoolName: "",
  schoolAddress: "",
  yearGraduated: "",
  degreeEarned: "",
  major: "",
  awards: "",
  notes: "",
};

export default function EducationQualificationsForm(): React.ReactElement {
  const { editing } = useOutletContext<{ editing: boolean }>();
  const [isEdit, setIsEdit] = useState(false);
  const [original, setOriginal] = useState<EducationData>(INITIAL_DATA);
  const [form, setForm] = useState<EducationData>(original);

  useEffect(() => {
    const onStart = () => {
      setForm(original);
      setIsEdit(true);
    };
    const onSave = () => {
      setOriginal(form);
      setIsEdit(false);
      console.log("Saved education data:", form);
    };
    const onCancel = () => {
      setForm(original);
      setIsEdit(false);
    };

    document.addEventListener("current-job:start-edit", onStart as EventListener);
    document.addEventListener("current-job:save", onSave as EventListener);
    document.addEventListener("current-job:cancel", onCancel as EventListener);

    return () => {
      document.removeEventListener("current-job:start-edit", onStart as EventListener);
      document.removeEventListener("current-job:save", onSave as EventListener);
      document.removeEventListener("current-job:cancel", onCancel as EventListener);
    };
  }, [form, original]);

  const handleChange = useCallback((field: keyof EducationData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="space-y-4">
      {/* Action bar is provided by Current Job shell */}

      <Section title="Education">
        <Row label="School Name:">
          <Input
            value={form.schoolName}
            onChange={e => handleChange("schoolName", e.target.value)}
            placeholder="Enter school name"
            disabled={!isEdit}
            aria-label="School Name"
          />
        </Row>

        <Row label="School Address:">
          <Input
            value={form.schoolAddress}
            onChange={e => handleChange("schoolAddress", e.target.value)}
            placeholder="Enter school address"
            disabled={!isEdit}
            aria-label="School Address"
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
