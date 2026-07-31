import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormRowProps {
  children: React.ReactNode;
  /** Max columns on the largest breakpoint. Scales down on smaller screens. */
  columns?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

/**
 * A responsive grid layout for form fields.
 * Densifies toward `columns` on large screens so more inputs fit per row.
 */
export function FormRow({ children, columns = 2, className }: FormRowProps) {
  const gridCols: Record<NonNullable<FormRowProps["columns"]>, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  };

  return (
    <div className={cn("grid gap-3", gridCols[columns], className)}>
      {children}
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

/**
 * A form field with label and optional error message
 */
export function FormField({
  label,
  children,
  error,
  required,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <Label className="text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * A section in a form with a title
 */
export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}
