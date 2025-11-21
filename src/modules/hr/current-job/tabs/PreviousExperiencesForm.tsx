import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ExperienceData = {
  companyName: string;
  jobTitle: string;
  lastDateWorked: string;
  numberOfYears: string;
  companyAddress: string;
  notes: string;
};

const INITIAL_DATA: ExperienceData = {
  companyName: "",
  jobTitle: "",
  lastDateWorked: "",
  numberOfYears: "",
  companyAddress: "",
  notes: "",
};

export default function PreviousExperiencesForm() {
  const { editing } = useOutletContext<{ editing: boolean }>();
  const [isEdit, setIsEdit] = useState(false);
  const [original, setOriginal] = useState<ExperienceData>(INITIAL_DATA);
  const [form, setForm] = useState<ExperienceData>(original);

  useEffect(() => {
    const onStart = () => {
      setForm(original);
      setIsEdit(true);
    };
    const onSave = () => {
      setOriginal(form);
      setIsEdit(false);
      console.log("Saved experience data:", form);
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

  const handleChange = (field: keyof ExperienceData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Action bar is provided by the Current Job shell */}

      <Section title="Experience">
        <Row label="Previous Company:">
          <Input 
            placeholder="Enter previous company"
            disabled={!isEdit}
            value={form.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
          />
        </Row>
        <Row label="Last Job Title:">
          <Input 
            placeholder="Enter last job title" 
            disabled={!isEdit}
            value={form.jobTitle}
            onChange={(e) => handleChange("jobTitle", e.target.value)}
          />
        </Row>
        <Row label="Last Date Worked:">
          <Input 
            type="date" 
            placeholder="dd-mm-yyyy" 
            disabled={!isEdit}
            value={form.lastDateWorked}
            onChange={(e) => handleChange("lastDateWorked", e.target.value)}
          />
        </Row>
        <Row label="Number of Years:">
          <Input 
            placeholder="Enter years" 
            disabled={!isEdit}
            value={form.numberOfYears}
            onChange={(e) => handleChange("numberOfYears", e.target.value)}
          />
        </Row>
        <Row label="Company Address:">
          <Input 
            placeholder="Enter company address" 
            disabled={!isEdit}
            value={form.companyAddress}
            onChange={(e) => handleChange("companyAddress", e.target.value)}
          />
        </Row>
        <Row label="Notes/Remarks:">
          <Input 
            placeholder="Enter notes or remarks" 
            disabled={!isEdit}
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
          />
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
