import { useCallback, useState } from "react";
import { toast } from "sonner";
import { appraisalService, type AppraisalPayload } from "@/service/appraisalService";
/* ================= COMPONENT ================= */
export default function AppraisalForm() {
  const [appraisal, setAppraisal] = useState<any | undefined>(undefined);
  const [mode, setMode] = useState<"CREATE" | "EDIT">("CREATE");

  const handleSave = useCallback(async (employeeId: number, payload: AppraisalPayload) => {
    try {
      if (appraisal?.id) {
        await appraisalService.updateById(employeeId, appraisal.id, payload);
      } else {
        const saved = await appraisalService.create(employeeId, payload);
        setAppraisal(saved);
      }

      toast.success("Appraisal saved successfully");
      setAppraisal(undefined);
      setMode("CREATE");
      try { document.dispatchEvent(new CustomEvent("appraisal:saved")); } catch { /* ignore */ }
    } catch (err: any) {
      toast.error(appraisalService.extractErrorMessage(err));
    }
  }, [appraisal]);

  void mode;
  void setMode;
  void handleSave;

  return null;
}
