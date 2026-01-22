import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/debounce";
import { apiClient } from "@/service/apiClient";

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
  apiUrl = "/api/countries",
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

  /** Active index for keyboard navigation */
  const activeIdx = useRef(-1);
  useEffect(() => {

    controlledUpdate.current = true;
    setQuery(value || "");
    setOpen(false);
    setSuggestions([]);
    activeIdx.current = -1;
  }, [value]);

  const controlledUpdate = useRef(false);

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
          const response = await apiClient.get(
            `https://restcountries.com/v3.1/name/${encodeURIComponent(
              q
            )}?fields=name`
          );
          const data = response.data;

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

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          const value = e.target.value;
          setQuery(value);
          onChange(value); 
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-40 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white shadow-sm">
          {suggestions.map((s, i) => (
            <li
              key={`${s}-${i}`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s);
              }}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                i === activeIdx.current ? "bg-gray-100" : ""
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <div className="text-xs text-gray-500 mt-1">Loading…</div>
      )}
    </div>
  );
}
