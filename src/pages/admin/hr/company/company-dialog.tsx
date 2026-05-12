"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import type { Company } from "@/types/company";
import type { CompanyFormData } from "@/schema/company";
import { CompanyForm } from "./company-form";
import type { AxiosError } from "axios";
import { X, Building2 } from "lucide-react";

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSuccess: (company: Company, mode: "add" | "edit") => void;
}

type ApiErrorPayload = {
  message?: string;
  error?: string;
  details?: string[];
  errors?: string[] | Record<string, string | string[]>;
};

const extractApiMessages = (error: unknown): string[] => {
  const fallback = "Failed to save company. Please try again.";
  const axiosError = error as AxiosError<ApiErrorPayload>;
  const data = axiosError?.response?.data;

  if (!data) return [fallback];

  const messages: string[] = [];

  if (typeof data.message === "string" && data.message.trim()) {
    messages.push(data.message);
  }
  if (typeof data.error === "string" && data.error.trim()) {
    messages.push(data.error);
  }
  if (Array.isArray(data.details)) {
    messages.push(...data.details.filter((item): item is string => !!item));
  }
  if (Array.isArray(data.errors)) {
    messages.push(...data.errors.filter((item): item is string => !!item));
  } else if (data.errors && typeof data.errors === "object") {
    Object.values(data.errors).forEach((value) => {
      if (Array.isArray(value)) {
        messages.push(...value.filter((item): item is string => !!item));
      } else if (typeof value === "string" && value.trim()) {
        messages.push(value);
      }
    });
  }

  const unique = [...new Set(messages.map((m) => m.trim()).filter(Boolean))];
  return unique.length ? unique : [fallback];
};

export const CompanyDialog = ({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompanyDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!company;

  const handleSubmit = async (
    data: CompanyFormData,
    logoFile: File | null,
  ) => {
    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append(
        "data",
        new Blob([JSON.stringify(data)], { type: "application/json" }),
      );
      if (logoFile) formData.append("logo", logoFile);

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
      };
      const res = isEditMode
        ? await apiClient.put(`/companies/${company!.id}`, formData, config)
        : await apiClient.post("/companies", formData, config);

      toast.success(
        isEditMode
          ? "Company updated successfully"
          : "Company added successfully",
      );
      onSuccess(res.data, isEditMode ? "edit" : "add");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting company:", error);
      const messages = extractApiMessages(error);
      messages.forEach((message) => toast.error(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 720, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-violet-100 text-violet-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEditMode ? "Edit company" : "Add new company"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEditMode
                  ? "Update company details and configuration"
                  : "Enter your company information to get started"}
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

        {/* ── Body: CompanyForm without its own footer button ── */}
        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          {/* Hide CompanyForm's submit button via class on the form wrapper */}
          <CompanyForm
            onSubmit={handleSubmit}
            loading={submitting}
            defaultValues={company}
            isEditMode={isEditMode}
            hideSubmitButton
          />
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            Fill in all required fields before submitting
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
              onClick={() => {
                // Trigger CompanyForm's hidden submit button
                const formEl = document.querySelector<HTMLButtonElement>(
                  "#company-form-submit-btn"
                );
                formEl?.click();
              }}
              disabled={submitting}
              className="h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {isEditMode ? "Saving…" : "Creating…"}
                </span>
              ) : isEditMode ? (
                "Save changes"
              ) : (
                "Create company"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
