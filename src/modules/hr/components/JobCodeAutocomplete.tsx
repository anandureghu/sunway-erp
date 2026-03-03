import React, { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Briefcase, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobCode } from "@/service/jobCodeService";

type Props = {
  /** Selected job code value */
  value: string;
  /** Called when a job code is selected */
  onChange: (jobCode: string, job?: JobCode) => void;
  /** List of available job codes */
  jobCodes: JobCode[];
  /** Loading state */
  loading?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
};

export default function JobCodeAutocomplete({
  value,
  onChange,
  jobCodes,
  loading = false,
  placeholder = "Search job code...",
  disabled = false,
}: Props) {
  /** What user is typing */
  const [query, setQuery] = useState("");
  
  /** Dropdown open state */
  const [open, setOpen] = useState(false);
  
  /** Active index for keyboard navigation */
  const activeIdx = useRef(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Find selected job from value
  const selectedJob = useMemo(() => {
    return jobCodes.find(j => j.code === value);
  }, [jobCodes, value]);

  // Filter job codes based on search query
  const filteredJobCodes = useMemo(() => {
    if (!query.trim()) return jobCodes;
    
    const q = query.toLowerCase();
    return jobCodes.filter(job => 
      job.code.toLowerCase().includes(q) ||
      job.title.toLowerCase().includes(q) ||
      job.level.toLowerCase().includes(q) ||
      job.grade.toLowerCase().includes(q)
    );
  }, [jobCodes, query]);

  // Sync query with selected value on initial load
  useEffect(() => {
    if (value && selectedJob) {
      setQuery(selectedJob.title);
    } else if (!value) {
      setQuery("");
    }
  }, [value, selectedJob]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset active index when filtered results change
  useEffect(() => {
    activeIdx.current = -1;
  }, [filteredJobCodes]);

  /** Handle keyboard navigation */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredJobCodes.length > 0) {
        activeIdx.current = Math.min(activeIdx.current + 1, filteredJobCodes.length - 1);
        setOpen(true);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredJobCodes.length > 0) {
        activeIdx.current = Math.max(activeIdx.current - 1, 0);
        setOpen(true);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filteredJobCodes.length > 0) {
        const job = filteredJobCodes[activeIdx.current >= 0 ? activeIdx.current : 0];
        selectJob(job);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      activeIdx.current = -1;
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  /** Select a job from dropdown */
  function selectJob(job: JobCode) {
    setQuery(job.title);
    setOpen(false);
    activeIdx.current = -1;
    onChange(job.code, job);
  }

  /** Clear selection */
  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setQuery("");
    onChange("");
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (!open) setOpen(true);
            // If the typed value doesn't match any job code, clear the selection
            const matched = jobCodes.find(j => j.code === val || j.title === val);
            if (!matched && val !== query) {
              // User is typing, not selecting - don't clear yet
            }
          }}
          onFocus={() => {
            if (filteredJobCodes.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={loading ? "Loading..." : placeholder}
          disabled={disabled || loading}
          className={cn(
            "h-10 pl-10 pr-20 border-slate-300 bg-white",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
            "disabled:bg-slate-50 disabled:text-slate-700",
            "transition-all"
          )}
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {loading ? (
            <div className="h-4 w-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          ) : (
            <Briefcase className="h-4 w-4 text-slate-400" />
          )}
        </div>

        {/* Clear and Dropdown Toggle Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}
          {!disabled && !loading && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronDown className={cn(
                "h-4 w-4 text-slate-400 transition-transform",
                open && "rotate-180"
              )} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Options */}
      {open && filteredJobCodes.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-white shadow-lg">
          {filteredJobCodes.map((job, idx) => (
            <li
              key={job.id}
              onClick={() => selectJob(job)}
              onMouseEnter={() => activeIdx.current = idx}
              className={cn(
                "px-3 py-2.5 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors",
                idx === activeIdx.current 
                  ? "bg-blue-50" 
                  : "hover:bg-slate-50",
                job.code === value && "bg-blue-100"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 text-sm">
                      {job.code}
                    </span>
                    <span className="text-slate-500 text-sm">
                      {job.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      job.level === "Senior" || job.level === "Manager" || job.level === "Principal" || job.level === "Lead"
                        ? "bg-purple-100 text-purple-700"
                        : job.level === "Mid"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    )}>
                      {job.level}
                    </span>
                    <span className="text-xs text-slate-500">
                      Grade: {job.grade}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* No results message */}
      {open && query && filteredJobCodes.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg p-3">
          <p className="text-sm text-slate-500 text-center">No job codes found</p>
        </div>
      )}
    </div>
  );
}
