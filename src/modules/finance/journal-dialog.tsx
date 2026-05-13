"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import {
  type JournalEntryResponseDTO,
  JOURNAL_STATUS,
  type JournalEntryUpdateDTO,
} from "@/types/journal";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  FileText,
  X,
  Clock,
  BookOpen,
} from "lucide-react";

// Extends UpdateDTO to include source (present in actual API response)
interface JournalDialogFormState extends JournalEntryUpdateDTO {
  source: string;
}

export function JournalDialog({
  open,
  onOpenChange,
  data,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: JournalEntryResponseDTO | null;
  companyId: number;
  onSuccess: (updated: JournalEntryResponseDTO, mode: "add" | "edit") => void;
}) {
  const { openPeriod } = useAuth();

  const [form, setForm] = useState<JournalDialogFormState>({
    description: "",
    entryDate: new Date().toISOString().split("T")[0],
    periodId: openPeriod?.id || 0,
    source: "MANUAL",
    lines: [],
    status: "DRAFT",
  });

  const update = (key: keyof JournalDialogFormState, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (data) {
      setForm({
        description: data.description ?? "",
        entryDate: data.entryDate || new Date().toISOString().split("T")[0],
        periodId: openPeriod!.id,
        source: data.source || "MANUAL",
        status: data.status || JOURNAL_STATUS.DRAFT,
        lines: data.lines.map((l) => ({
          debitAccount: l.debitAccount,
          creditAccount: l.creditAccount,
          debitAmount: l.debitAmount,
          creditAmount: l.creditAmount,
          departmentId: l.departmentId,
          projectId: l.projectId,
          currencyCode: l.currencyCode,
          exchangeRate: l.exchangeRate,
          description: l.description,
        })),
      });
    }
  }, [data]);

  const handleSave = async () => {
    try {
      const res = data
        ? await apiClient.put(`/finance/journal-entries/${data.id}`, form)
        : await apiClient.post(`/finance/journal-entries`, form);
      onSuccess(res.data, data ? "edit" : "add");
      toast.success("Journal saved");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 640, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-indigo-100 text-indigo-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {data ? "Edit journal entry" : "Create journal entry"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {data
                  ? "Update journal entry details"
                  : "Create a new journal entry record"}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          <div className="space-y-5">

            {/* ── Section: Entry Details ── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                  <FileText className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  Entry details
                </span>
              </div>
              <div className="p-5 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Description
                  </label>
                  <Textarea
                    value={form.description ?? ""}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Journal entry description..."
                    rows={3}
                    className="rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] resize-none px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Entry date
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <Calendar className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        type="date"
                        value={form.entryDate || new Date().toISOString().split("T")[0]}
                        onChange={(e) => update("entryDate", e.target.value)}
                        disabled
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Period
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <Clock className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        type="text"
                        value={openPeriod?.periodName}
                        disabled
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Source
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <BookOpen className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        type="text"
                        value={form.source}
                        onChange={(e) => update("source", e.target.value)}
                        placeholder="MANUAL"
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Status
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                        <Clock className="h-[15px] w-[15px]" />
                      </span>
                      <Input
                        type="text"
                        value={"DRAFT"}
                        disabled
                        className="h-10 pl-9 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-500 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            Journal lines are managed in the detail view
          </p>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              Save journal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
