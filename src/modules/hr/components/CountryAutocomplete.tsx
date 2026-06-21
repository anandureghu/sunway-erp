import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/debounce";
import { apiClient } from "@/service/apiClient";
import { COUNTRIES, flagEmoji } from "@/lib/countries";
import { Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = {
  /** Display name */
  name: string;
  /** ISO-3166 alpha-2 code, when known (drives the flag emoji) */
  iso2?: string;
};

type Props = {
  /** Selected value (controlled by parent) */
  value?: string;
  /** Called ONLY when a suggestion is selected */
  onChange: (value: string) => void;
  placeholder?: string;
  minChars?: number;
  /**
   * Optional API endpoint to source suggestions from. When omitted (the default),
   * the component filters the bundled local country dataset — instant, offline,
   * and not dependent on any external network service.
   */
  apiUrl?: string;
  disabled?: boolean;
};

/** Filter the bundled country list, ranking prefix matches ahead of substring matches. */
function searchLocalCountries(query: string): Suggestion[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

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

export default function CountryAutocomplete({
  value = "",
  onChange,
  placeholder = "Type country...",
  minChars = 1,
  apiUrl,
  disabled = false,
}: Props) {
  /** What user is typing */
  const [query, setQuery] = useState<string>(value);

  /** Suggestions list */
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  /** Dropdown state */
  const [open, setOpen] = useState(false);

  /** Loading state (API mode only) */
  const [loading, setLoading] = useState(false);

  /** Fixed-position coords for the dropdown (escapes overflow-hidden parents) */
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  /** Active index for keyboard navigation */
  const [activeIdx, setActiveIdx] = useState(-1);

  /** Ref to measure wrapper position */
  const wrapperRef = useRef<HTMLDivElement>(null);

  /** Recalculate dropdown position whenever it opens or suggestions change */
  useLayoutEffect(() => {
    if (open && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [open, suggestions]);

  /**
   * Sync the input when the controlled value changes from the parent (e.g. a
   * record loads, or another field clears it). This never opens the dropdown or
   * triggers a search — searching is driven solely by user typing.
   */
  useEffect(() => {
    setQuery(value || "");
    setOpen(false);
    setSuggestions([]);
    setActiveIdx(-1);
  }, [value]);

  /** Remote lookup (only used when an apiUrl is provided). */
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
            ? data.map((d: any) =>
                typeof d === "string"
                  ? { name: d }
                  : { name: d.name, iso2: d.iso2 },
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

  /** Run a search for the current input. Local data is instant; API is debounced. */
  function runSearch(raw: string) {
    const q = raw.trim();
    if (q.length < minChars) {
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

  /** Select a suggestion */
  function selectSuggestion(s: Suggestion) {
    setQuery(s.name);
    setOpen(false);
    setSuggestions([]);
    setActiveIdx(-1);
    onChange(s.name);
  }

  /** Handle input change — update query and search. onChange fires only on select. */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    runSearch(v);
  }

  /** Keyboard navigation */
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

  const showEmpty =
    open &&
    !loading &&
    suggestions.length === 0 &&
    query.trim().length >= minChars;

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input with leading globe icon and trailing spinner */}
      <div className="relative">
        <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "h-9 rounded-lg border-slate-200 pl-9 transition-colors",
            "focus-visible:border-violet-400 focus-visible:ring-violet-400/30",
            "disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed",
            loading && "pr-9",
          )}
        />
        {loading && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-violet-500" />
        )}
      </div>

      {/* Suggestions dropdown — fixed positioning escapes overflow-hidden ancestors */}
      {open && suggestions.length > 0 && (
        <ul
          style={dropdownStyle}
          className="fixed z-[9999] max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
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
                <span className="text-base leading-none">
                  {flagEmoji(s.iso2)}
                </span>
              ) : (
                <Globe className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              )}
              {s.name}
            </li>
          ))}
        </ul>
      )}

      {/* Empty state */}
      {showEmpty && (
        <ul
          style={dropdownStyle}
          className="fixed z-[9999] rounded-xl border border-slate-200 bg-white shadow-2xl"
        >
          <li className="flex items-center gap-2.5 px-3 py-3 text-sm text-slate-500">
            <Globe className="h-4 w-4 text-slate-400" />
            No countries found for &ldquo;{query}&rdquo;
          </li>
        </ul>
      )}
    </div>
  );
}
