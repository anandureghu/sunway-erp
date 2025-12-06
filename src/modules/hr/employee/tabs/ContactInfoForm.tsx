// modules/hr/employee/tabs/ContactInfoForm.tsx
import { useOutletContext } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Eye } from "lucide-react";
import { generateId } from "@/lib/utils";
import { FormRow, FormField, FormSection } from "@/modules/hr/components/form-components";

type Ctx = { editing: boolean };

type Address = {
  id: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
};

type ContactInfo = {
  email: string;
  phone: string;
  altPhone: string;
  notes: string;
};

const SEED: ContactInfo = {
  email: "aisha.rahman@example.com",
  phone: "+91 99999 12345",
  altPhone: "",
  notes: "",
};

const INITIAL_ADDRESS: Address = {
  id: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zipcode: "",
  country: "",
};

function isAddressValid(address: Address) {
  // required fields: line1, city, country
  return (
    Boolean(address.line1?.trim()) &&
    Boolean(address.city?.trim()) &&
    Boolean(address.country?.trim())
  );
}


export default function ContactInfoForm() {
  const { editing } = useOutletContext<Ctx>();

  const [saved, setSaved] = useState(SEED);
  const [draft, setDraft] = useState(SEED);
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: generateId(),
      line1: "12, Palm Street",
      line2: "Near Lotus Mall",
      city: "Bengaluru",
      state: "KA",
      zipcode: "560001",
      country: "India",
    },
  ]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [viewingAddressId, setViewingAddressId] = useState<string | null>(null);

  useMemo(() => {
    const onSave = () => setSaved(draft);
    const onCancel = () => setDraft(saved);
    const onEdit = () => setDraft(saved);
    const s = () => onSave();
    const c = () => onCancel();
    const e = () => onEdit();
    document.addEventListener("profile:save", s as EventListener);
    document.addEventListener("profile:cancel", c as EventListener);
    document.addEventListener("profile:edit", e as EventListener);
    return () => {
      document.removeEventListener("profile:save", s as EventListener);
      document.removeEventListener("profile:cancel", c as EventListener);
      document.removeEventListener("profile:edit", e as EventListener);
    };
  }, [draft, saved]);

  const set = <K extends keyof ContactInfo>(k: K, v: ContactInfo[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleAddAddress = useCallback(() => {
    const newAddress = { ...INITIAL_ADDRESS, id: generateId() };
    setAddresses((current) => [...current, newAddress]);
    setEditingAddressId(newAddress.id);
  }, []);

  const handleEditAddress = useCallback((address: Address) => {
    setEditingAddressId(address.id);
  }, []);

  const handleSaveAddress = useCallback((address: Address) => {
    setAddresses((current) =>
      current.map((a) => (a.id === address.id ? address : a))
    );
  }, []);

  const handleCancelAddress = useCallback(() => {
    setAddresses((current) =>
      current.filter((a) => {
        if (a.id !== editingAddressId) return true;
        // if address is empty, remove it
        const isEmpty = !(
          a.line1?.trim() ||
          a.city?.trim() ||
          a.state?.trim() ||
          a.country?.trim()
        );
        return !isEmpty;
      })
    );
    setEditingAddressId(null);
  }, [editingAddressId]);

  const handleDeleteAddress = useCallback((id: string) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      setAddresses((current) => current.filter((a) => a.id !== id));
      setEditingAddressId(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      <FormSection title="Contact Information">
        <FormRow columns={3}>
          <FormField label="Email" required>
            <Input
              disabled={!editing}
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="Enter email"
              aria-required="true"
              required
            />
          </FormField>
          <FormField label="Phone" required>
            <Input
              disabled={!editing}
              value={draft.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="Enter phone"
              aria-required="true"
              required
            />
          </FormField>
          <FormField label="Alt Phone">
            <Input
              disabled={!editing}
              value={draft.altPhone}
              onChange={(e) => set("altPhone", e.target.value)}
              placeholder="Enter alternate phone"
            />
          </FormField>
        </FormRow>
      </FormSection>

      {/* Addresses Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Addresses</h3>
          <Button
            onClick={handleAddAddress}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        </div>

        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-4">
                {editingAddressId === address.id ? (
                  <div className="space-y-4">
                    <FormRow columns={2}>
                      <FormField label="Address Line 1" required>
                        <Input
                          disabled={!editing}
                          value={address.line1}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              line1: e.target.value,
                            })
                          }
                          placeholder="Street address"
                          aria-required="true"
                          required
                        />
                      </FormField>
                      <FormField label="Address Line 2">
                        <Input
                          disabled={!editing}
                          value={address.line2}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              line2: e.target.value,
                            })
                          }
                          placeholder="Apartment, suite, etc."
                        />
                      </FormField>
                      <FormField label="City" required>
                        <Input
                          disabled={!editing}
                          value={address.city}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              city: e.target.value,
                            })
                          }
                          placeholder="City"
                          aria-required="true"
                          required
                        />
                      </FormField>
                      <FormField label="State">
                        <Input
                          disabled={!editing}
                          value={address.state}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              state: e.target.value,
                            })
                          }
                          placeholder="State/Province"
                        />
                      </FormField>
                      <FormField label="Postal Code">
                        <Input
                          disabled={!editing}
                          value={address.zipcode}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              zipcode: e.target.value,
                            })
                          }
                          placeholder="Postal code"
                        />
                      </FormField>
                      <FormField label="Country" required>
                        <Input
                          disabled={!editing}
                          value={address.country}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              country: e.target.value,
                            })
                          }
                          placeholder="Country"
                          aria-required="true"
                          required
                        />
                      </FormField>
                    </FormRow>

                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={handleCancelAddress}>
                        Cancel
                      </Button>
                      <Button disabled={!isAddressValid(address)} onClick={() => setEditingAddressId(null)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewingAddressId !== address.id && (
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{address.line1 || "Unnamed Address"}</p>
                          <div className="text-sm text-gray-500 mt-1">
                            <p>
                              {address.line2 && address.line2 + ", "}
                              {address.city}
                            </p>
                            <p>
                              {address.state} {address.zipcode}, {address.country}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingAddressId(address.id)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {viewingAddressId === address.id && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Address Line 1</p>
                            <p className="text-sm mt-1">{address.line1 || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Address Line 2</p>
                            <p className="text-sm mt-1">{address.line2 || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">City</p>
                            <p className="text-sm mt-1">{address.city || "—"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">State</p>
                            <p className="text-sm mt-1">{address.state || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Postal Code</p>
                            <p className="text-sm mt-1">{address.zipcode || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Country</p>
                            <p className="text-sm mt-1">{address.country || "—"}</p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button variant="outline" size="sm" onClick={() => setViewingAddressId(null)}>Close</Button>
                          <Button size="sm" onClick={() => { setViewingAddressId(null); handleEditAddress(address); }}>Edit</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {addresses.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            No addresses added yet. Click "Add Address" to add one.
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-sm">Notes/Remarks:</Label>
        <Textarea
          disabled={!editing}
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="min-h-[100px] w-full"
          placeholder="Enter any additional notes"
        />
      </div>
    </div>
  );
}

