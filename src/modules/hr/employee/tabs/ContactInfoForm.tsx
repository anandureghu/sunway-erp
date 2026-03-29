import { useOutletContext, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { addressService } from "@/service/addressService";
import { contactService } from "@/service/contactService";
import { hrService } from "@/service/hr.service";
import { toast } from "sonner";
import { FormRow, FormField, FormSection } from "@/modules/hr/components/form-components";

type Ctx = { editing: boolean; setEditing?: (v: boolean) => void; isAdmin?: boolean };

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

type PasswordState = {
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  isLoading: boolean;
  passwordStrength: "weak" | "medium" | "strong";
};

const SEED: ContactInfo = {
  email: "",
  phone: "",
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

const INITIAL_PASSWORD_STATE: PasswordState = {
  newPassword: "",
  confirmPassword: "",
  showPassword: false,
  isLoading: false,
  passwordStrength: "weak",
};

function isAddressValid(address: Address) {
  return (
    Boolean(address.line1?.trim()) &&
    Boolean(address.city?.trim()) &&
    Boolean(address.country?.trim()) &&
    Boolean(address.zipcode?.trim())
  );
}

function calculatePasswordStrength(password: string): "weak" | "medium" | "strong" {
  if (!password) return "weak";
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*]/.test(password)) strength++;
  
  if (strength <= 1) return "weak";
  if (strength <= 3) return "medium";
  return "strong";
}

export default function ContactInfoForm() {
  const { editing, setEditing, isAdmin } = useOutletContext<Ctx>();

  const [saved, setSaved] = useState(SEED);
  const [draft, setDraft] = useState(SEED);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [viewingAddressId, setViewingAddressId] = useState<string | null>(null);
  const [passwordState, setPasswordState] = useState<PasswordState>(INITIAL_PASSWORD_STATE);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const params = useParams<{ id?: string }>();
  const employeeId = params.id ? Number(params.id) : undefined;

  useEffect(() => {
    let mounted = true;
    if (!employeeId) return;
    addressService
      .getAddressesByEmployee(employeeId)
      .then((res) => {
        if (!mounted) return;
        const mapped = (res || []).map((a) => ({
          id: String(a.id),
          line1: a.line1 || "",
          line2: a.line2 || "",
          city: a.city || "",
          state: a.state || "",
          zipcode: a.postalCode || "",
          country: a.country || "",
        }));
        setAddresses(mapped);
      })
      .catch((err) => {
        console.error("Failed to load addresses", err);
        toast.error("Failed to load addresses");
      });
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  // Fetch employee data to get email and phoneNo as fallback
  useEffect(() => {
    let mounted = true;
    if (!employeeId) return;
    
    // First fetch the employee data to get email and phoneNo as fallback
    hrService
      .getEmployee(employeeId)
      .then((empData) => {
        if (!mounted) return;
        const employeeEmail = empData.email || "";
        const employeePhone = empData.phoneNo || "";
        
        // Then fetch contact info (which may be empty for new employees)
        return contactService.getContactInfo(employeeId).then((res) => {
          if (!mounted) return;
          const data = res.data || {};
          
          // Use contact info if available, otherwise fall back to employee data
          setDraft((d) => ({
            ...d,
            email: data.email || employeeEmail,
            phone: data.phone || employeePhone,
            altPhone: data.altPhone || "",
            notes: data.notes || "",
          }));
          setSaved((s) => ({
            ...s,
            email: data.email || employeeEmail,
            phone: data.phone || employeePhone,
            altPhone: data.altPhone || "",
            notes: data.notes || "",
          }));
        });
      })
      .catch(() => {
        /* silent - if employee fetch fails, contact info will be empty */
      });
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  useEffect(() => {
    const onSave = async () => {
      setSaved(draft);
      if (!employeeId) return;
      try {
        try {
          await contactService.saveContactInfo(employeeId, {
            email: draft.email,
            phone: draft.phone,
            altPhone: draft.altPhone || undefined,
            notes: draft.notes || "",
          });
        } catch (err) {
          console.error("Failed to save contact info", err);
          toast.error("Failed to save contact info");
        }

        for (const a of addresses) {
          const payload = {
            line1: a.line1,
            line2: a.line2 || undefined,
            city: a.city,
            state: a.state || undefined,
            country: a.country,
            postalCode: a.zipcode || undefined,
            addressType: "HOME",
          } as any;

          if (/^\d+$/.test(a.id)) {
            await addressService.updateAddress(Number(a.id), payload);
          } else {
            await addressService.addAddress(employeeId, payload);
          }
        }

        try {
          const resAddrs = await addressService.getAddressesByEmployee(employeeId);
          const mapped = (resAddrs || []).map((a) => ({
            id: String(a.id),
            line1: a.line1 || "",
            line2: a.line2 || "",
            city: a.city || "",
            state: a.state || "",
            zipcode: a.postalCode || "",
            country: a.country || "",
          }));
          setAddresses(mapped);
        } catch (err) {
          console.error("Failed to reload addresses", err);
        }

        toast.success("Addresses saved");
      } catch (err) {
        console.error("Failed to save addresses", err);
        toast.error("Failed to save addresses");
      }
    };

    const onCancel = () => setDraft(saved);
    const onEdit = () => setDraft(saved);

    document.addEventListener("profile:save", onSave as EventListener);
    document.addEventListener("profile:cancel", onCancel as EventListener);
    document.addEventListener("profile:edit", onEdit as EventListener);
    return () => {
      document.removeEventListener("profile:save", onSave as EventListener);
      document.removeEventListener("profile:cancel", onCancel as EventListener);
      document.removeEventListener("profile:edit", onEdit as EventListener);
    };
  }, [draft, saved, addresses, employeeId]);

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
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    (async () => {
      try {
        if (/^\d+$/.test(id)) {
          await addressService.deleteAddress(Number(id));
        }
        setAddresses((current) => current.filter((a) => a.id !== id));
        setEditingAddressId(null);
        toast.success("Address deleted");
      } catch (err) {
        console.error("Failed to delete address", err);
        toast.error("Failed to delete address");
      }
    })();
  }, []);

  // Password Management
  const handlePasswordChange = (field: keyof PasswordState, value: any) => {
    const newState = { ...passwordState, [field]: value };
    
    if (field === "newPassword") {
      newState.passwordStrength = calculatePasswordStrength(value);
    }
    
    setPasswordState(newState);
  };

  const isPasswordValid = () => {
    return (
      passwordState.newPassword.length >= 8 &&
      passwordState.newPassword === passwordState.confirmPassword &&
      passwordState.passwordStrength !== "weak"
    );
  };

  const handleResetPassword = async () => {
    if (!isPasswordValid()) {
      toast.error("Passwords must match and meet security requirements");
      return;
    }

    if (!employeeId) {
      toast.error("Employee ID not found");
      return;
    }

    setPasswordState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Call your password reset service here
      await hrService.resetEmployeePassword(employeeId, {
        newPassword: passwordState.newPassword,
      });

      toast.success("Password reset successfully");
      setShowPasswordModal(false);
      setPasswordState(INITIAL_PASSWORD_STATE);
    } catch (err) {
      console.error("Failed to reset password", err);
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setPasswordState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-slate-300";
    }
  };

  const getPasswordStrengthText = (strength: string) => {
    switch (strength) {
      case "weak":
        return "Weak";
      case "medium":
        return "Medium";
      case "strong":
        return "Strong";
      default:
        return "N/A";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-6 shadow-md border border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 text-white p-3 rounded-xl shadow-lg">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="opacity-95" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5C3 6.29 4.79 4.5 7 4.5H17C19.21 4.5 21 6.29 21 8.5V15.5C21 17.71 19.21 19.5 17 19.5H7C4.79 19.5 3 17.71 3 15.5V8.5Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Contact Information</h2>
              <p className="text-sm text-slate-500">Update email, phone and addresses for this employee</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                onClick={() => setShowPasswordModal(true)}
                className="bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-md hover:shadow-lg rounded-lg flex items-center gap-2 px-4 py-2"
              >
                <Lock className="h-4 w-4" />
                Reset Password
              </Button>
            )}
            <Button
              onClick={() => {
                setEditing?.(true);
                handleAddAddress();
              }}
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md hover:shadow-lg rounded-lg flex items-center gap-2 px-4 py-2"
            >
              <Plus className="h-4 w-4" />
              Add Address
            </Button>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 rounded-2xl shadow-2xl border-0">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <div className="bg-gradient-to-br from-amber-600 to-orange-500 text-white p-2 rounded-lg">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Reset Employee Password</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Enter a new secure password for the employee</p>
                  </div>
                </div>

                {/* New Password Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">New Password</Label>
                  <div className="relative">
                    <Input
                      type={passwordState.showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordState.newPassword}
                      onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                      className="pr-10 ring-0 focus:ring-2 focus:ring-amber-200 border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasswordChange("showPassword", !passwordState.showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {passwordState.showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordState.newPassword && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i === 1 || (i === 2 && passwordState.passwordStrength !== "weak") || (i === 3 && passwordState.passwordStrength === "strong")
                                ? getPasswordStrengthColor(passwordState.passwordStrength)
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Strength: <span className="font-semibold text-slate-700">{getPasswordStrengthText(passwordState.passwordStrength)}</span>
                        </span>
                        {passwordState.passwordStrength === "strong" && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Password Requirements */}
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase">Requirements:</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li className={`flex items-center gap-2 ${passwordState.newPassword.length >= 8 ? "text-green-600" : ""}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${passwordState.newPassword.length >= 8 ? "bg-green-500" : "bg-slate-300"}`} />
                        At least 8 characters
                      </li>
                      <li className={`flex items-center gap-2 ${/[a-z]/.test(passwordState.newPassword) && /[A-Z]/.test(passwordState.newPassword) ? "text-green-600" : ""}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(passwordState.newPassword) && /[A-Z]/.test(passwordState.newPassword) ? "bg-green-500" : "bg-slate-300"}`} />
                        Mix of upper and lowercase
                      </li>
                      <li className={`flex items-center gap-2 ${/\d/.test(passwordState.newPassword) ? "text-green-600" : ""}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${/\d/.test(passwordState.newPassword) ? "bg-green-500" : "bg-slate-300"}`} />
                        At least one number
                      </li>
                      <li className={`flex items-center gap-2 ${/[!@#$%^&*]/.test(passwordState.newPassword) ? "text-green-600" : ""}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*]/.test(passwordState.newPassword) ? "bg-green-500" : "bg-slate-300"}`} />
                        Special character (!@#$%^&*)
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Confirm Password</Label>
                  <Input
                    type={passwordState.showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={passwordState.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    className={`ring-0 border-slate-300 rounded-lg ${
                      passwordState.confirmPassword && passwordState.newPassword !== passwordState.confirmPassword
                        ? "focus:ring-2 focus:ring-red-200 border-red-300"
                        : "focus:ring-2 focus:ring-amber-200"
                    }`}
                  />
                  {passwordState.confirmPassword && passwordState.newPassword !== passwordState.confirmPassword && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Passwords do not match</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordState(INITIAL_PASSWORD_STATE);
                    }}
                    className="flex-1 rounded-lg"
                    disabled={passwordState.isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleResetPassword}
                    disabled={!isPasswordValid() || passwordState.isLoading}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
                  >
                    {passwordState.isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <FormSection title="Contact Information">
        <FormRow columns={3}>
          <FormField label="Email" required>
            <Input
              disabled={!editing}
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              aria-required="true"
              required
              className="ring-0 focus:ring-2 focus:ring-indigo-200"
            />
          </FormField>
          <FormField label="Phone" required>
            <Input
              disabled={!editing}
              value={draft.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+1 (555) 000-0000"
              aria-required="true"
              required
              className="ring-0 focus:ring-2 focus:ring-indigo-200"
            />
          </FormField>
          <FormField label="Alt Phone">
            <Input
              disabled={!editing}
              value={draft.altPhone}
              onChange={(e) => set("altPhone", e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="ring-0 focus:ring-2 focus:ring-indigo-200"
            />
          </FormField>
        </FormRow>
      </FormSection>

      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 shadow-sm border border-cyan-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Addresses</h3>
        </div>

        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
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
                      <FormField label="Postal Code" required>
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
                          aria-required="true"
                          required
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
                      <Button variant="outline" onClick={handleCancelAddress} className="rounded-md px-4">
                        Cancel
                      </Button>
                      <Button disabled={!isAddressValid(address)} onClick={() => setEditingAddressId(null)} className="rounded-md px-4 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white">
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {viewingAddressId !== address.id && (
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-800">{address.line1 || "Unnamed Address"}</p>
                          <div className="text-sm text-slate-500 mt-1">
                            <p>
                              {address.line2 && address.line2 + ", "}
                              {address.city}
                            </p>
                            <p>
                              {address.state} {address.zipcode}{address.state || address.zipcode ? ", " : ""}{address.country}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingAddressId(address.id)}
                            className="flex items-center gap-2"
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
                            className="text-red-600 rounded-lg flex-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}

                    {viewingAddressId === address.id && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Address Line 1</p>
                            <p className="text-sm mt-1 text-slate-800">{address.line1 || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Address Line 2</p>
                            <p className="text-sm mt-1 text-slate-800">{address.line2 || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">City</p>
                            <p className="text-sm mt-1 text-slate-800">{address.city || "—"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">State</p>
                            <p className="text-sm mt-1 text-slate-800">{address.state || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Postal Code</p>
                            <p className="text-sm mt-1 text-slate-800">{address.zipcode || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Country</p>
                            <p className="text-sm mt-1 text-slate-800">{address.country || "—"}</p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button variant="outline" size="sm" onClick={() => setViewingAddressId(null)} className="rounded-md px-3">Close</Button>
                          <Button size="sm" onClick={() => { setViewingAddressId(null); handleEditAddress(address); }} className="rounded-md px-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white">Edit</Button>
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
          <div className="text-center p-6 text-slate-500 bg-white rounded-lg border border-slate-100">
            No addresses added yet. Click "Add Address" to add one.
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Notes / Remarks</Label>
        <Textarea
          disabled={!editing}
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="min-h-[120px] w-full rounded-lg border-slate-200"
          placeholder="Enter any additional notes"
        />
      </div>
    </div>
  );
}