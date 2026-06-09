import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps } from "react";

type ItemSearchComboboxProps = {
  label?: string;
  query: string;
  onQueryChange: (q: string) => void;
  results: ItemResponseDTO[];
  onSelect: (item: ItemResponseDTO) => void;
  hiddenInputProps?: ComponentProps<"input">;
  errorText?: string;
};

export function ItemSearchCombobox({
  label,
  query,
  onQueryChange,
  results,
  onSelect,
  hiddenInputProps,
  errorText,
}: ItemSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleSelect = (item: ItemResponseDTO) => {
    onSelect(item);
    setOpen(false);
  };

  const showResults = open && query.trim().length > 0 && results.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      {label ? (
        <label className="mb-2 block text-sm font-medium">{label}</label>
      ) : null}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input
          placeholder="Search by SKU, name, or barcode..."
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            onQueryChange(next);
            setOpen(next.trim().length > 0);
          }}
          onFocus={() => {
            if (query.trim().length > 0 && results.length > 0) {
              setOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="pl-10"
        />
      </div>
      {showResults && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
              className="w-full cursor-pointer border-b p-3 text-left last:border-b-0 hover:bg-gray-100"
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">
                SKU: {item.sku} | {item.category}
              </div>
            </button>
          ))}
        </div>
      )}
      {hiddenInputProps ? <input type="hidden" {...hiddenInputProps} /> : null}
      {errorText ? (
        <p className="mt-1 text-sm text-red-500">{errorText}</p>
      ) : null}
    </div>
  );
}
