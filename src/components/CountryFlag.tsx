import { cn } from "@/lib/utils";

type Props = {
  /** ISO-3166 alpha-2 code, e.g. "QA". */
  iso2?: string;
  className?: string;
};

/**
 * Renders a country flag as a bundled SVG (flag-icons), sized by the inherited
 * font-size. Unlike emoji flags (regional-indicator characters), these display
 * consistently on every platform — notably Windows, where emoji flags show as
 * two letters instead of a flag.
 */
export default function CountryFlag({ iso2, className }: Props) {
  const code = iso2?.trim().toLowerCase();
  if (!code || code.length !== 2) return null;

  return (
    <span
      className={cn(`fi fi-${code}`, className)}
      role="img"
      aria-label={`${code.toUpperCase()} flag`}
    />
  );
}
