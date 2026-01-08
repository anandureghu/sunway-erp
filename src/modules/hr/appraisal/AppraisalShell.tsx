import { useParams } from "react-router-dom";

import { useState, useCallback, useEffect } from "react";
import type { ReactElement, Dispatch, SetStateAction } from "react";
import type { AppraisalPayload } from "@/service/appraisalService";
import AppraisalsForm from "./AppraisalsForm";
import { Button } from "@/components/ui/button";
import { hrService } from "@/service/hr.service";
import type { Employee } from "@/types/hr";

/** Shared “Edit/Update ↔ Save/Cancel” bar used under the blue header */
function EditUpdateBar(props: {
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}): ReactElement {
  const { editing, onEdit, onCancel, onSave } = props;

  if (!editing) {
    return (
      <Button
        variant="outline"
        className="rounded-full shadow-sm hover:shadow bg-white"
        onClick={onEdit}
        aria-label="Edit appraisal"
      >
        <span className="mr-2">✏️</span> Edit/Update
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onCancel} aria-label="Cancel editing">
        Cancel
      </Button>
      <Button onClick={onSave} className="bg-emerald-600 hover:bg-emerald-700" aria-label="Save changes">
        Save
      </Button>
    </div>
  );
}

export type AppraisalModel = AppraisalPayload & { id?: number; month?: string; year?: number };

export type AppraisalCtx = {
  editing: boolean;
  setEditing?: (b: boolean) => void;
  appraisal?: AppraisalModel;
  setAppraisal?: Dispatch<SetStateAction<AppraisalModel>>;
};

export default function AppraisalShell(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const [emp, setEmp] = useState<Employee | null>(null);
  const title = emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeNo})` : "";

  const [editing, setEditing] = useState(false);
  

  useEffect(() => {
    let mounted = true;
    if (id) hrService.getEmployee(id).then((e) => mounted && setEmp(e ?? null));
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleEdit = useCallback(() => setEditing(true), []);
  const handleCancel = useCallback(() => {
    setEditing(false);
    try { document.dispatchEvent(new CustomEvent("appraisal:cancel")); } catch { /* ignore */ }
  }, []);

  const handleSave = useCallback(() => {
    if (!editing) return;
    try { document.dispatchEvent(new CustomEvent("appraisal:save")); } catch { /* ignore */ }
  }, [editing]);

  useEffect(() => {
    if (editing) {
      try { document.dispatchEvent(new CustomEvent("appraisal:edit")); } catch { /* ignore */ }
    }
  }, [editing]);

  useEffect(() => {
    const onSaved = () => setEditing(false);
    document.addEventListener("appraisal:saved", onSaved as EventListener);
    return () => document.removeEventListener("appraisal:saved", onSaved as EventListener);
  }, []);

  useEffect(() => setEditing(false), [id]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Blue header */}
      <div className="px-4 py-3 bg-blue-600 text-white text-lg font-semibold rounded-t-xl">
        Employee Appraisal – {title}
      </div>

      {/* Action row */}
      <div className="px-4 pt-3 flex justify-between items-center border-b bg-white">
        <div />

        <EditUpdateBar editing={editing} onEdit={handleEdit} onCancel={handleCancel} onSave={handleSave} />
      </div>

      {/* Content (dependents-style list) */}
      <div className="p-4">
        <AppraisalsForm />
      </div>
    </div>
  );
}

