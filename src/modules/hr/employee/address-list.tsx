import { useEffect, useState } from "react";
import { addressService, type Address } from "@/service/addressService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AddressList({ employeeId }: { employeeId: number }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Address, "id" | "employeeId">>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    addressType: "HOME",
  });

  const load = async () => {
    setLoading(true);
    try {
      const list = await addressService.getAddressesByEmployee(employeeId);
      setAddresses(list || []);
    } catch (err: any) {
      console.error("AddressList -> failed to load:", err?.response?.data ?? err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [employeeId]);

  const handleAdd = async () => {
    try {
      await addressService.addAddress(employeeId, form);
      toast.success("Address added");
      setShowForm(false);
      setForm({ line1: "", line2: "", city: "", state: "", country: "", postalCode: "", addressType: "HOME" });
      load();
    } catch (err: any) {
      console.error("AddressList -> add failed:", err?.response?.data ?? err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to add address");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!confirm("Delete this address?")) return;
    try {
      await addressService.deleteAddress(id);
      toast.success("Address deleted");
      load();
    } catch (err: any) {
      console.error("AddressList -> delete failed:", err?.response?.data ?? err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete address");
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Addresses</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={load}>Refresh</Button>
          <Button onClick={() => setShowForm((s) => !s)} size="sm">{showForm ? "Cancel" : "+ Add Address"}</Button>
        </div>
      </div>

      {showForm && (
        <div className="grid grid-cols-1 gap-2 mb-4">
          <input className="border p-2 rounded" placeholder="Line 1" value={form.line1} onChange={(e) => setForm((s) => ({ ...s, line1: e.target.value }))} />
          <input className="border p-2 rounded" placeholder="Line 2" value={form.line2} onChange={(e) => setForm((s) => ({ ...s, line2: e.target.value }))} />
          <div className="grid grid-cols-3 gap-2">
            <input className="border p-2 rounded" placeholder="City" value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} />
            <input className="border p-2 rounded" placeholder="State" value={form.state} onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))} />
            <input className="border p-2 rounded" placeholder="Postal Code" value={form.postalCode} onChange={(e) => setForm((s) => ({ ...s, postalCode: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="border p-2 rounded" placeholder="Country" value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} />
            <select className="border p-2 rounded" value={form.addressType} onChange={(e) => setForm((s) => ({ ...s, addressType: e.target.value as any }))}>
              <option value="HOME">Home</option>
              <option value="OFFICE">Office</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <Button onClick={handleAdd}>Save Address</Button>
          </div>
        </div>
      )}

      {loading && <div className="text-sm text-gray-500">Loading...</div>}

      {!loading && addresses.length === 0 && (
        <div className="text-sm text-gray-500">No addresses found.</div>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <div key={addr.id} className="rounded-md border p-3 bg-white">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{addr.line1} {addr.line2 ? `, ${addr.line2}` : ""}</div>
                <div className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.postalCode} — {addr.country}</div>
                <div className="text-xs text-gray-500 mt-1">{addr.addressType}</div>
              </div>
              <div className="flex items-start gap-2">
                <Button variant="ghost" size="sm" onClick={() => {
                  // simple inline edit: populate form and open
                  setForm({ line1: addr.line1, line2: addr.line2, city: addr.city, state: addr.state, country: addr.country, postalCode: addr.postalCode, addressType: addr.addressType });
                  setShowForm(true);
                }}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(addr.id)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
