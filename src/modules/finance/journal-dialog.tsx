import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useEffect, useState } from "react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";

import {
  type JournalEntryResponseDTO,
  type JournalEntryCreateDTO,
  // type JournalStatus,
  JOURNAL_STATUS,
  type JournalEntryUpdateDTO,
} from "@/types/journal";
import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

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
  const [form, setForm] = useState<
    JournalEntryCreateDTO | JournalEntryUpdateDTO
  >({
    description: "",
    entryDate: "",
    periodId: new Date().getFullYear(),
    source: "MANUAL",
    lines: [],
    status: "DRAFT",
  });

  // -----------------------------
  // Update form fields
  // -----------------------------
  const update = (key: keyof JournalEntryCreateDTO, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // -----------------------------
  // Load Edit Data
  // -----------------------------
  useEffect(() => {
    if (data) {
      setForm({
        description: data.description ?? "",
        entryDate: data.entryDate,
        periodId: new Date().getFullYear(),
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

  // -----------------------------
  // Save API
  // -----------------------------
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {data ? "Edit Journal Entry" : "Create Journal Entry"}
          </DialogTitle>
        </DialogHeader>

        {/* BASIC INFO */}

        <div>
          <Label>Description</Label>
          <Textarea
            value={form.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={form.entryDate}
            onChange={(e) => update("entryDate", e.target.value)}
          />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="w-full">
            <Label>Period</Label>
            <Input
              type="text"
              value={form.periodId}
              onChange={(e) => update("periodId", e.target.value)}
            />
          </div>

          <div className="w-full">
            <Label>Status</Label>
            <Input disabled type="text" value={"DRAFT"} />
            {/* <Select
              onValueChange={(val) => update("status", val)}
              value={form.status}
              disabled={!data}
            >
              <SelectTrigger>
                <SelectValue placeholder={"Select Journal Status"} />
              </SelectTrigger>

              <SelectContent className="w-full">
                {Object.values(JOURNAL_STATUS).map((d: JournalStatus) => (
                  <SelectItem key={d} value={d}>
                    <div>
                      <h2 className="font-semibold">{d}</h2>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
          </div>
        </div>

        {/* SAVE */}
        <Button className="w-full mt-4" onClick={handleSave}>
          Save Journal
        </Button>
      </DialogContent>
    </Dialog>
  );
}
