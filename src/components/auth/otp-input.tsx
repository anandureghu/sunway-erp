import { useRef, type KeyboardEvent, type ClipboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  className,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  const focusAt = (index: number) => {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  };

  const updateAt = (index: number, char: string) => {
    const next = digits.map((d, i) => (i === index ? char : d.trim())).join("");
    onChange(next.slice(0, length));
  };

  const handleChange = (index: number, nextValue: string) => {
    const digit = nextValue.replace(/\D/g, "").slice(-1);
    if (!digit) {
      updateAt(index, "");
      return;
    }
    updateAt(index, digit);
    if (index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index]?.trim()) {
      if (index > 0) {
        e.preventDefault();
        updateAt(index - 1, "");
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  };

  return (
    <div className={cn("flex justify-center gap-2 sm:gap-3", className)}>
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit.trim()}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          className="h-12 w-11 rounded-lg border-violet-200/80 bg-white text-center text-lg font-semibold shadow-sm focus-visible:border-violet-400 focus-visible:ring-violet-400/30 sm:h-14 sm:w-12"
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
