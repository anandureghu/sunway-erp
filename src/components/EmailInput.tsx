import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { formatEmailInput, normalizeEmail } from "@/lib/email";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  id?: string;
};

/**
 * Email field with live formatting (no spaces, lowercase) and blur normalization.
 * Validation is handled by the parent form or validateEmail().
 */
export default function EmailInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = "email@example.com",
  invalid = false,
  className,
  id,
}: Props) {
  return (
    <Input
      id={id}
      type="email"
      inputMode="email"
      autoComplete="email"
      spellCheck={false}
      disabled={disabled}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(formatEmailInput(e.target.value))}
      onBlur={() => {
        onChange(normalizeEmail(value));
        onBlur?.();
      }}
      className={cn(
        invalid &&
          "border-rose-300 focus-visible:border-rose-400 focus-visible:ring-rose-400/30",
        className,
      )}
    />
  );
}
