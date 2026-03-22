import type { ItemResponseDTO } from "@/service/erpApiTypes";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { ComponentProps } from "react";

type ItemSearchComboboxProps = {
  label?: string;
  query: string;
  onQueryChange: (q: string) => void;
  results: ItemResponseDTO[];
  onSelect: (item: ItemResponseDTO) => void;
  hiddenInputProps: ComponentProps<"input">;
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
  return (
    <div className="relative">
      {label ? (
        <label className="text-sm font-medium mb-2 block">{label}</label>
      ) : null}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by SKU, name, or barcode..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full text-left p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">
                SKU: {item.sku} | {item.category}
              </div>
            </button>
          ))}
        </div>
      )}
      <input type="hidden" {...hiddenInputProps} />
      {errorText ? (
        <p className="text-sm text-red-500 mt-1">{errorText}</p>
      ) : null}
    </div>
  );
}
