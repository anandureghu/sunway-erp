import { cn } from "@/lib/utils";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectField({ 
  options,
  placeholder = "Select...",
  className,
  ...props
}: SelectFieldProps) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40",
        className
      )}
      {...props}
    >
      <option value="" disabled hidden>
        {placeholder}
      </option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}