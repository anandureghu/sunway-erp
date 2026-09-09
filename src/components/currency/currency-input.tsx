import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCompanyCurrency } from "@/hooks/use-company-currency";

type Props = React.ComponentProps<"input"> & {
  currencyCode?: string;
  inputClassName?: string;
};

/**
 * Number input with a visible company (or override) currency code prefix.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, Props>(
  function CurrencyInput(
    { currencyCode, className, inputClassName, ...props },
    ref,
  ) {
    const { currencyCode: companyCode } = useCompanyCurrency();
    const code = (currencyCode ?? companyCode)?.trim() || "—";

    return (
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-blue-400 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] h-9",
          className,
        )}
      >
        <span className="flex shrink-0 items-center border-r border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {code}
        </span>
        <Input
          ref={ref}
          type="number"
          step="0.01"
          min={0}
          {...props}
          className={cn(
            "h-full rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0",
            inputClassName,
          )}
        />
      </div>
    );
  },
);
