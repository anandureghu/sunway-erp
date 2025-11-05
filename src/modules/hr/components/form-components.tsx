import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormRowProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * A responsive grid layout for form fields
 */
export function FormRow({ children, columns = 2, className }: FormRowProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
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
  className 
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
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
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}