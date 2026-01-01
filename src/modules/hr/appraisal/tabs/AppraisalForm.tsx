import { useOutletContext, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AppraisalCtx } from "../AppraisalShell";
import { useCallback, useEffect, useState } from "react";
import type { ReactElement } from "react";
import { appraisalService, type AppraisalPayload } from "@/service/appraisalService";
import { toast } from "sonner";

type AppraisalModel = AppraisalPayload & {
  id?: number;
  month?: string;
  year?: number;
};

export default function AppraisalForm(): ReactElement {
  const { editing, appraisal, setAppraisal } = useOutletContext<AppraisalCtx>();
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number | "">("");

  /* ===========================
     LOAD APPRAISAL (GET)
  =========================== */
  useEffect(() => {
    if (!empId || !selectedMonth || !selectedYear) return;
    const month = selectedMonth.toLowerCase().trim();

    appraisalService
      .get(empId, month, Number(selectedYear))
      .then((data) => {
        if (data && setAppraisal) {
          setAppraisal(data);
        }
      })
      .catch(() => {
        
        if (setAppraisal) {
          setAppraisal({
            month,
            year: Number(selectedYear),
          });
        }
      });
  }, [empId, selectedMonth, selectedYear, setAppraisal]);

  /* ===========================
     SAVE (CREATE / UPDATE)
  =========================== */
  const onSave = useCallback(async () => {
    if (!empId || !selectedMonth || !selectedYear) {
      toast.error("Please select month and year");
      return;
    }

    if (!appraisal) return;

    const month = selectedMonth.toLowerCase().trim();

    const payload: AppraisalPayload = {
      jobCode: appraisal.jobCode || undefined,
      employeeComments: appraisal.employeeComments || undefined,
      managerComments: appraisal.managerComments || undefined,
      kpi1: appraisal.kpi1 || undefined,
      review1: appraisal.review1 || undefined,
      kpi2: appraisal.kpi2 || undefined,
      review2: appraisal.review2 || undefined,
      kpi3: appraisal.kpi3 || undefined,
      review3: appraisal.review3 || undefined,
      kpi4: appraisal.kpi4 || undefined,
      review4: appraisal.review4 || undefined,
      kpi5: appraisal.kpi5 || undefined,
      review5: appraisal.review5 || undefined,
    };

    try {
      const body = appraisal.id
        ? await appraisalService.update(empId, month, Number(selectedYear), payload)
        : await appraisalService.create(empId, month, Number(selectedYear), payload);

      if (setAppraisal) setAppraisal(body);
      toast.success("Appraisal saved successfully");
      try { document.dispatchEvent(new CustomEvent("appraisal:saved")); } catch { /* ignore */ }
    } catch (err: any) {
      toast.error(appraisalService.extractErrorMessage(err));
    }
  }, [empId, selectedMonth, selectedYear, appraisal, setAppraisal]);

  /* ===========================
     FIELD SETTER
  =========================== */
  const set = (key: keyof AppraisalModel, value: string) => {
    if (!setAppraisal) return;
    setAppraisal((prev) => ({ ...(prev ?? {}), [key]: value }));
  };

  /* ===========================
     SHELL EVENTS
  =========================== */
  useEffect(() => {
    document.addEventListener("appraisal:save", onSave as EventListener);
    return () => {
      document.removeEventListener("appraisal:save", onSave as EventListener);
    };
  }, [onSave]);

  /* ===========================
     UI
  =========================== */
  return (
    <div className="space-y-6">
      {/* Month / Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input
          disabled={!editing}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          placeholder="e.g. January"
        />

        <Input
          disabled={!editing}
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value) || "")}
          placeholder="e.g. 2024"
        />
      </div>

      {/* Appraisal */}
      <Section title="Employee Appraisal">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Job Code">
            <Input
              disabled={!editing}
              value={appraisal?.jobCode ?? ""}
              onChange={(e) => set("jobCode", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Employee Comments">
              <Textarea
                disabled={!editing}
                value={appraisal?.employeeComments ?? ""}
                onChange={(e) => set("employeeComments", e.target.value)}
                className="min-h-[280px]"
              />
            </Field>

            <Field label="Manager Comments">
              <Textarea
                disabled={!editing}
                value={appraisal?.managerComments ?? ""}
                onChange={(e) => set("managerComments", e.target.value)}
                className="min-h-[280px]"
              />
            </Field>
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ===========================
   HELPERS
=========================== */
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
