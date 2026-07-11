import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/debounce";
import { apiClient } from "@/service/apiClient";
import { COUNTRIES, getCountryByName } from "@/lib/countries";
import CountryFlag from "@/components/CountryFlag";
import { Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnchoredPosition } from "@/hooks/use-anchored-position";

type Suggestion = {
  name: string;
  iso2?: string;
};

export type CountrySelectProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minChars?: number;
  apiUrl?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

function allCountrySuggestions(): Suggestion[] {
  return COUNTRIES.map((c) => ({ name: c.name, iso2: c.iso2 }));
}

function searchLocalCountries(query: string): Suggestion[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return allCountrySuggestions();

  const matches = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(needle),
  );

  matches.sort((a, b) => {
    const aPrefix = a.name.toLowerCase().startsWith(needle) ? 0 : 1;
    const bPrefix = b.name.toLowerCase().startsWith(needle) ? 0 : 1;
    return aPrefix - bPrefix || a.name.localeCompare(b.name);
  });

  return matches.map((c) => ({ name: c.name, iso2: c.iso2 }));
}

export default function CountrySelect({
  value = "",
  onChange,
  onBlur,
  placeholder = "Select country...",
  minChars = 0,
  apiUrl,
  disabled = false,
  className,
  id,
}: CountrySelectProps) {
  const [query, setQuery] = useState<string>(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedCountry = getCountryByName(value);
  const showList = open && suggestions.length > 0;
  const showEmptyList =
    open &&
    !loading &&
    suggestions.length === 0 &&
    query.trim().length >= minChars;
  const position = useAnchoredPosition(
    wrapperRef,
    showList || showEmptyList,
  );

  useEffect(() => {
    setQuery(value || "");
    setOpen(false);
    setSuggestions([]);
    setActiveIdx(-1);
  }, [value]);

  const fetchRemote = useCallback(
    debounce(async (q: string, url: string) => {
      setLoading(true);
      try {
        const response = await apiClient.get(
          `${url}?q=${encodeURIComponent(q)}`,
        );
        const data = response.data;
        setSuggestions(
          Array.isArray(data)
            ? data.map((d: { name?: string; iso2?: string } | string) =>
                typeof d === "string"
                  ? { name: d }
                  : { name: d.name ?? "", iso2: d.iso2 },
              )
            : [],
        );
        setOpen(true);
        setActiveIdx(-1);
      } catch (error) {
        console.error("Error fetching countries:", error);
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  function runSearch(raw: string) {
    const q = raw.trim();
    if (q.length < minChars) {
      if (minChars === 0) {
        const results = allCountrySuggestions();
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIdx(-1);
        return;
      }
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    if (apiUrl) {
      fetchRemote(q, apiUrl);
      return;
    }

    const results = searchLocalCountries(q);
    setSuggestions(results);
    setOpen(results.length > 0 || q.length >= minChars);
    setActiveIdx(-1);
  }

  function selectSuggestion(s: Suggestion) {
    setQuery(s.name);
    setOpen(false);
    setSuggestions([]);
    setActiveIdx(-1);
    onChange(s.name);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    runSearch(v);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setActiveIdx((i) => Math.max(i - 1, 0));
      e.preventDefault();
    } else if (e.key === "Enter") {
      const s = suggestions[activeIdx] ?? suggestions[0];
      if (s) selectSuggestion(s);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        {selectedCountry ? (
          <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-base leading-none">
            <CountryFlag iso2={selectedCountry.iso2} />
          </span>
        ) : (
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <Input
          id={id}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            runSearch(query);
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
            onBlur?.();
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "h-9 rounded-lg border-slate-200 transition-colors",
            "focus-visible:border-violet-400 focus-visible:ring-violet-400/30",
            "disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed",
            loading && "pr-9",
            className,
            // Keep the icon's space last so a consumer-passed className (e.g. one
            // with px-3) can't clobber the left padding and overlap the flag.
            "pl-11",
          )}
        />
        {loading && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-violet-500" />
        )}
      </div>

      {showList &&
        position &&
        createPortal(
          <ul
            style={{ ...position.style, marginTop: 4 }}
            className="z-[9999] max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            {suggestions.map((s, i) => (
              <li
                key={`${s.name}-${i}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(s);
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm transition-colors",
                  i === activeIdx
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-700 hover:bg-violet-50 hover:text-violet-700",
                )}
              >
                {s.iso2 ? (
                  <CountryFlag iso2={s.iso2} className="text-base leading-none" />
                ) : (
                  <Globe className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                )}
                {s.name}
              </li>
            ))}
          </ul>,
          position.container,
        )}

      {showEmptyList &&
        position &&
        createPortal(
          <ul
            style={{ ...position.style, marginTop: 4 }}
            className="z-[9999] rounded-xl border border-slate-200 bg-white shadow-2xl"
          >
            <li className="flex items-center gap-2.5 px-3 py-3 text-sm text-slate-500">
              <Globe className="h-4 w-4 text-slate-400" />
              No countries found for &ldquo;{query}&rdquo;
            </li>
          </ul>,
          position.container,
        )}
    </div>
  );
}

/** @deprecated Use CountrySelect from @/components/country-select */
export { CountrySelect as CountryAutocomplete };
