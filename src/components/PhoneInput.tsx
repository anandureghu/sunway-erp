import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  composePhone,
  getCountryByIso,
  parsePhone,
  type Country,
} from "@/lib/countries";
import CountryFlag from "@/components/CountryFlag";

type Props = {
  /** Stored combined value, e.g. "+974 33001122" */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** Show error styling (validation handled by the parent) */
  invalid?: boolean;
  className?: string;
};

/**
 * Phone field with a searchable country dial-code selector and a national-number
 * input. Emits the canonical "+<dial> <digits>" string (or "" when cleared).
 */
export default function PhoneInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = "Phone number",
  invalid = false,
  className,
}: Props) {
  const initial = parsePhone(value);
  const [iso, setIso] = useState(initial.country.iso2);
  const [national, setNational] = useState(initial.national);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const country = getCountryByIso(iso) ?? DEFAULT_COUNTRY;

  // Re-sync local state when the value changes from outside (e.g. data load).
  useEffect(() => {
    if (composePhone(country, national) === (value ?? "")) return;
    const parsed = parsePhone(value);
    setIso(parsed.country.iso2);
    setNational(parsed.national);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (nextCountry: Country, nextNational: string) => {
    onChange(composePhone(nextCountry, nextNational));
  };

  const selectCountry = (c: Country) => {
    setIso(c.iso2);
    setOpen(false);
    setSearch("");
    emit(c, national);
  };

  const handleNationalChange = (raw: string) => {
    // keep digits and spaces only for a tidy display; storage strips spaces
    const cleaned = raw.replace(/[^\d\s]/g, "");
    setNational(cleaned);
    emit(country, cleaned);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q.replace(/\D/g, "")) ||
        c.iso2.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-9 items-stretch overflow-hidden rounded-lg border bg-white transition-colors",
          invalid
            ? "border-rose-300 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/30"
            : "border-slate-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/30",
          disabled && "bg-slate-50",
        )}
      >
        {/* Country selector */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 border-r border-slate-200 bg-slate-50 px-2.5 text-sm font-medium text-slate-700 transition-colors",
            !disabled && "hover:bg-slate-100",
            disabled && "cursor-not-allowed",
          )}
          aria-label="Select country code"
        >
          <CountryFlag iso2={country.iso2} className="text-base leading-none" />
          <span className="tabular-nums">+{country.dial}</span>
          {!disabled && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>

        {/* National number */}
        <input
          type="tel"
          inputMode="tel"
          disabled={disabled}
          value={national}
          onChange={(e) => handleNationalChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-slate-600"
        />
      </div>

      {/* Country dropdown */}
      {open && !disabled && (
        <>
          {/* click-away backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => {
              setOpen(false);
              setSearch("");
            }}
          />
          <div className="absolute z-[9999] mt-1 w-72 max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country or code…"
                  className="h-8 w-full rounded-lg border border-slate-200 pl-8 pr-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                />
              </div>
            </div>
            <ul className="max-h-60 overflow-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-3 text-sm text-slate-500">
                  No countries found
                </li>
              ) : (
                filtered.map((c) => (
                  <li key={c.iso2}>
                    <button
                      type="button"
                      onClick={() => selectCountry(c)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-violet-50 hover:text-violet-700",
                        c.iso2 === country.iso2 &&
                          "bg-violet-50/60 text-violet-700",
                      )}
                    >
                      <CountryFlag
                        iso2={c.iso2}
                        className="text-base leading-none"
                      />
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="tabular-nums text-slate-400">
                        +{c.dial}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
