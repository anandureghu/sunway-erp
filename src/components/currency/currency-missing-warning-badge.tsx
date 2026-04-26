import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CURRENCY_NOT_SET_MESSAGE } from "@/lib/currency";

type CurrencyMissingWarningBadgeProps = {
  className?: string;
  message?: string;
};

export function CurrencyMissingWarningBadge({
  className,
  message = CURRENCY_NOT_SET_MESSAGE,
}: CurrencyMissingWarningBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white",
            className,
          )}
          aria-label={message}
        >
          <AlertCircle className="h-3 w-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{message}</TooltipContent>
    </Tooltip>
  );
}
