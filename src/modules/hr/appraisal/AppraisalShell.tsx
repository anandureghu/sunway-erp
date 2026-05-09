import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import type { ReactElement, Dispatch, SetStateAction } from "react";
import type { AppraisalPayload } from "@/service/appraisalService";
import AppraisalsForm from "./AppraisalsForm";
import EditUpdateButton from "@/components/EditUpdateButton";
import { hrService } from "@/service/hr.service";
import type { Employee } from "@/types/hr";
import { ArrowLeft } from "lucide-react";

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
    return () => { mounted = false; };
  }, [id]);

  const handleEdit = useCallback(() => setEditing(true), []);

  const handleCancel = useCallback(() => {
    setEditing(false);
    try { document.dispatchEvent(new CustomEvent("appraisal:cancel")); } catch {}
  }, []);

  const handleSave = useCallback(() => {
    if (!editing) return;
    try { document.dispatchEvent(new CustomEvent("appraisal:save")); } catch {}
  }, [editing]);

  useEffect(() => {
    if (editing) {
      try { document.dispatchEvent(new CustomEvent("appraisal:edit")); } catch {}
    }
  }, [editing]);

  useEffect(() => {
    const onSaved = () => setEditing(false);
    document.addEventListener("appraisal:saved", onSaved as EventListener);
    return () => document.removeEventListener("appraisal:saved", onSaved as EventListener);
  }, []);

  useEffect(() => setEditing(false), [id]);

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-white overflow-hidden shadow-xl">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg" asChild>
            <Link to="/hr/employees" aria-label="Back to employees"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <span className="text-lg font-semibold">Employee Appraisal – {title}</span>
        </div>
      </div>

      {/* Action row */}
      <div className="px-4 pt-3 flex justify-end items-center border-b bg-white pb-2">
        <EditUpdateButton
          module="APPRAISAL"
          editing={editing}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <AppraisalsForm />
      </div>
    </div>
  );
}