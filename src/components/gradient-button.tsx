import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type GradientButtonProps = React.ComponentProps<"button"> & {
  loading?: boolean;
};

export function GradientButton({
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: GradientButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-base font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-blue-700 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}
