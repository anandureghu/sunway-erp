import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { addressService, type Address } from "@/service/addressService";

export default function EmployeeAddresses({ employeeId }: { employeeId?: number }) {
  const params = useParams<{ id: string }>();
  const id = employeeId ?? (params.id ? Number(params.id) : undefined);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);

    addressService
      .getAddressesByEmployee(Number(id))
      .then((list) => {
        if (mounted) setAddresses(list || []);
      })
      .catch((err) => {
        console.error("Failed to load addresses", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;

  if (!addresses || addresses.length === 0) return <div className="text-sm text-gray-500">No addresses found</div>;

  return (
    <div className="space-y-3">
      {addresses.map((addr) => (
        <div key={addr.id} className="rounded-lg border-2 border-gradient-to-r from-blue-200 to-purple-200 p-4 bg-gradient-to-br from-white to-blue-50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between">
            <div>
              <div className="font-medium text-gray-800">{addr.line1} {addr.line2 ? `, ${addr.line2}` : ""}</div>
              <div className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.postalCode} — {addr.country}</div>
              <div className="text-xs text-blue-600 mt-1 font-medium">{addr.addressType}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
