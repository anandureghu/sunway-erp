import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { listActiveCarriersForDispatch } from "@/service/inventoryService";
import type { DispatchCarrier } from "@/types/inventory";

/**
 * Carrier selection is dropdown-only, sourced from the carrier master list —
 * no free-text carrier name/vehicle number entry. Only driver name/phone stay
 * editable per-shipment, since the assigned driver can vary even for the same
 * registered carrier.
 */
const SelectCarrier = ({
  value,
  onSelect,
  label = "Carrier",
  placeholder = "Select carrier",
}: {
  value: string | undefined;
  onSelect: (carrier: DispatchCarrier) => void;
  label?: string;
  placeholder?: string;
}) => {
  const [carriers, setCarriers] = useState<DispatchCarrier[]>([]);

  useEffect(() => {
    void listActiveCarriersForDispatch()
      .then(setCarriers)
      .catch(() => setCarriers([]));
  }, []);

  return (
    <>
      <Label>{label}</Label>
      <Select
        value={value || undefined}
        onValueChange={(id) => {
          const carrier = carriers.find((c) => c.id === id);
          if (carrier) onSelect(carrier);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {carriers.map((carrier) => (
            <SelectItem key={carrier.id} value={carrier.id}>
              {carrier.name}
              {carrier.vehicleNumber ? ` — ${carrier.vehicleNumber}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default SelectCarrier;
