// src/modules/finance/journal-entry/je-dialog.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import { JournalEntryForm } from "./je-form";
import type { JournalEntry } from "@/types/finance/journal-entry";
import type { JEFormData } from "@/schema/finance/journal-entry";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: JournalEntry | null;
  onSuccess: (je: JournalEntry, mode: "add" | "edit") => void;
}

export const JournalEntryDialog = ({
  open,
  onOpenChange,
  entry,
  onSuccess,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!entry;

  const handleSubmit = async (data: JEFormData) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        amount: Number(data.amount),
      };

      const res = isEdit
        ? await apiClient.put(`/finance/journal-entries/${entry!.id}`, payload)
        : await apiClient.post(`/finance/journal-entries`, payload);

      toast.success(isEdit ? "Journal Entry updated" : "Journal Entry created");

      onSuccess(res.data, isEdit ? "edit" : "add");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to save entry", {
        description: err?.response?.data?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultValues = entry
    ? {
        creditAccountId: entry.creditAccountId,
        debitAccountId: entry.debitAccountId,
        amount: String(entry.amount),
        source: entry.source ?? "",
        description: entry.description ?? "",
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Journal Entry" : "Create Journal Entry"}
          </DialogTitle>
        </DialogHeader>

        <JournalEntryForm
          onSubmit={handleSubmit}
          loading={loading}
          defaultValues={defaultValues}
        />
      </DialogContent>
    </Dialog>
  );
};
