import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Warehouse,
  Phone,
  User,
  MapPin,
} from "lucide-react";
import type { WarehouseResponseDTO } from "@/service/erpApiTypes";
import { getWarehouseById } from "@/service/warehouseService";
import { InventoryPageHeader } from "@/components/inventory-page-header";

const WarehouseDetail = () => {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<WarehouseResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    getWarehouseById(id)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading warehouse details…
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <InventoryPageHeader
        title={data.name}
        description={`Warehouse · Code: ${data.code}`}
        variant="warehouse"
        backHref="/inventory/settings"
      >
        <Warehouse className="h-6 w-6 text-white" />
      </InventoryPageHeader>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Address */}
        <div className="rounded-xl border bg-white p-5 space-y-2">
          <div className="flex items-center gap-2 font-medium text-gray-700">
            <MapPin className="h-4 w-4 text-indigo-500" />
            Address
          </div>

          <p className="text-sm text-gray-600">
            {[data.street, data.city].filter(Boolean).join(", ")}
          </p>

          <p className="text-sm text-gray-600">
            {[data.country, data.pin].filter(Boolean).join(" - ")}
          </p>
        </div>

        {/* Contact */}
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <div className="flex items-center gap-2 font-medium text-gray-700">
            <Phone className="h-4 w-4 text-indigo-500" />
            Contact
          </div>

          <p className="text-sm text-gray-600">
            <span className="text-gray-400">Person:</span>{" "}
            {data.contactPersonName ?? "—"}
          </p>

          <p className="text-sm text-gray-600">
            <span className="text-gray-400">Phone:</span> {data.phone ?? "—"}
          </p>
        </div>

        {/* Manager */}
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <div className="flex items-center gap-2 font-medium text-gray-700">
            <User className="h-4 w-4 text-indigo-500" />
            Manager
          </div>

          <p className="text-sm text-gray-600">
            <span className="text-gray-400">Name:</span>{" "}
            {data.managerName ?? "—"}
          </p>

          <p className="text-sm text-gray-600">
            <span className="text-gray-400">ID:</span> {data.managerId ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDetail;
