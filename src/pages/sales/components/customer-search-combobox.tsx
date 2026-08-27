import type { Customer } from "@/types/sales";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredPosition } from "@/hooks/use-anchored-position";

type CustomerSearchComboboxProps = {
  label?: string;
  query: string;
  onQueryChange: (q: string) => void;
  results: Customer[];
  onSelect: (customer: Customer) => void;
  disabled?: boolean;
  errorText?: string;
  placeholder?: string;
};

export function CustomerSearchCombobox({
  label,
  query,
  onQueryChange,
  results,
  onSelect,
  disabled = false,
  errorText,
  placeholder = "Search by name or phone...",
}: CustomerSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !resultsRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setOpen(false);
  };

  const showResults = !disabled && open && results.length > 0;
  const position = useAnchoredPosition(inputWrapperRef, showResults);

  return (
    <div className="relative" ref={containerRef}>
      {label ? (
        <label className="mb-2 block text-sm font-medium">{label}</label>
      ) : null}
      <div className="relative" ref={inputWrapperRef}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled && results.length > 0) {
              setOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="pl-10"
        />
      </div>
      {showResults &&
        position &&
        createPortal(
          <div
            ref={resultsRef}
            style={{ ...position.style, marginTop: 4 }}
            className="z-[9999] max-h-60 overflow-auto rounded-md border bg-white shadow-lg"
          >
            {results.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(customer)}
                className="w-full cursor-pointer border-b p-3 text-left last:border-b-0 hover:bg-gray-100"
              >
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-gray-500">
                  {customer.code}
                  {customer.phone ? ` · ${customer.phone}` : ""}
                </div>
              </button>
            ))}
          </div>,
          position.container,
        )}
      {errorText ? (
        <p className="mt-1 text-sm text-red-500">{errorText}</p>
      ) : null}
    </div>
  );
}

export function filterCustomersByQuery(
  customers: Customer[],
  query: string,
): Customer[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return customers;
  return customers.filter((c) => {
    const name = (c.name || "").toLowerCase();
    const phone = (c.phone || "").toLowerCase();
    const code = (c.code || "").toLowerCase();
    const email = (c.email || "").toLowerCase();
    return (
      name.includes(trimmed) ||
      phone.includes(trimmed) ||
      phone.replace(/\s+/g, "").includes(trimmed.replace(/\s+/g, "")) ||
      code.includes(trimmed) ||
      email.includes(trimmed)
    );
  });
}
