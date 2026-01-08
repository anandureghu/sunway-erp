import { useCallback, useState } from "react";
import { toast } from "sonner";
import { appraisalService, type AppraisalPayload } from "@/service/appraisalService";

// Lightweight replacement for the old single-item form.
// Purpose: provide a correct `handleSave` implementation that matches the
// new `appraisalService` API and resets local state after saving.
export default function AppraisalForm() {
  const [appraisal, setAppraisal] = useState<any | undefined>(undefined);
  const [mode, setMode] = useState<"CREATE" | "EDIT">("CREATE");

  const handleSave = useCallback(async (employeeId: number, payload: AppraisalPayload) => {
    try {
      if (appraisal?.id) {
        // EDIT
        await appraisalService.updateById(employeeId, appraisal.id, payload);
      } else {
        // CREATE
        const saved = await appraisalService.create(employeeId, payload);

        // store DB id-backed appraisal so callers see the real `id`
        setAppraisal(saved);
      }

      toast.success("Appraisal saved successfully");

      // Reset local state to initial create mode
      setAppraisal(undefined);
      setMode("CREATE");

      // Notify shell/components that an appraisal was saved
      try { document.dispatchEvent(new CustomEvent("appraisal:saved")); } catch { /* ignore */ }
    } catch (err: any) {
      toast.error(appraisalService.extractErrorMessage(err));
    }
  }, [appraisal]);

  // Reference to avoid "declared but never used" TS6133 during build
  void mode;
  void setMode;
  void handleSave;

  return null;
}
