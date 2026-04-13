import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/debounce";
import { apiClient } from "@/service/apiClient";
import { Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Selected value (controlled by parent) */
  value?: string;
  /** Called ONLY when a suggestion is selected */
  onChange: (value: string) => void;
  placeholder?: string;
  minChars?: number;
  apiUrl?: string;
  disabled?: boolean;
};

export default function CountryAutocomplete({
  value = "",
  onChange,
  placeholder = "Type country...",
  minChars = 2,
  apiUrl,
  disabled = false,
}: Props) {
  /** What user is typing */
  const [query, setQuery] = useState<string>(value);

  /** Suggestions list */
  const [suggestions, setSuggestions] = useState<string[]>([]);

  /** Dropdown state */
  const [open, setOpen] = useState(false);

  /** Loading state */
  const [loading, setLoading] = useState(false);

  /** Fixed-position coords for the dropdown (escapes overflow-hidden parents) */
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  /** Active index for keyboard navigation */
  const activeIdx = useRef(-1);

  /** Track if update is from controlled value change */
  const controlledUpdate = useRef(false);

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

  useEffect(() => {
    if (value !== query) {
      controlledUpdate.current = true;
      setQuery(value || "");
      setOpen(false);
      setSuggestions([]);
      activeIdx.current = -1;
    }
  }, [value]);

  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (controlledUpdate.current) {
        controlledUpdate.current = false;
        return;
      }
      if (!q || q.length < minChars) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      setLoading(true);

      try {
        if (apiUrl) {
          const response = await apiClient.get(`${apiUrl}?q=${encodeURIComponent(q)}`);
          const data = response.data;

          setSuggestions(
            Array.isArray(data)
              ? data.map((d: any) =>
                  typeof d === "string" ? d : d.name
                )
              : []
          );
        } else {
          const response = await fetch(
            `https://restcountries.com/v3.1/name/${encodeURIComponent(q)}?fields=name`
          );
          const data = await response.json();

          setSuggestions(
            Array.isArray(data)
              ? data.map((d: any) => d.name.common)
              : []
          );
        }

        setOpen(true);
        activeIdx.current = -1;
      } catch (error) {
        console.error("Error fetching countries:", error);
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300),
    [apiUrl, minChars]
  );

  /** Trigger search when query changes */
  useEffect(() => {
    fetchSuggestions(query.trim());
  }, [query, fetchSuggestions]);

  /** Select a suggestion */
  function selectSuggestion(s: string) {
    setQuery(s);
    setOpen(false);
    setSuggestions([]);
    onChange(s);
  }

  /** Handle input change - only update query, don't call onChange */
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  /** Keyboard navigation */
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      activeIdx.current = Math.min(
        activeIdx.current + 1,
        suggestions.length - 1
      );
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      activeIdx.current = Math.max(activeIdx.current - 1, 0);
      e.preventDefault();
    } else if (e.key === "Enter") {
      const s = suggestions[activeIdx.current] ?? suggestions[0];
      if (s) selectSuggestion(s);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showEmpty = open && !loading && suggestions.length === 0 && query.trim().length >= minChars;

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
            loading && "pr-9"
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
              key={`${s}-${i}`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s);
              }}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm transition-colors",
                i === activeIdx.current
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-700 hover:bg-violet-50 hover:text-violet-700"
              )}
            >
              <Globe className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              {s}
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
