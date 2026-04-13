import { useOutletContext, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Trash2, Eye, EyeOff, Lock, AlertCircle, CheckCircle2,
  Mail, Phone, PhoneCall, MapPin, StickyNote, KeyRound, PencilLine,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateId } from "@/lib/utils";
import { addressService } from "@/service/addressService";
import { contactService } from "@/service/contactService";
import { hrService } from "@/service/hr.service";
import { toast } from "sonner";

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
    <div className="bg-slate-50/60 min-h-screen p-5 space-y-5">

      {/* ── Page header ── */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600" />
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-md">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Contact Information</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage email, phone numbers, and addresses</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                onClick={() => setShowPasswordModal(true)}
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-sm hover:shadow-md"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Reset Password
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Password Reset Modal ── */}
      {showPasswordModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 rounded-2xl shadow-2xl border border-slate-200">
            <CardContent className="p-0 overflow-hidden rounded-2xl">
              {/* Modal header strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="p-6 space-y-5">
                {/* Title */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Reset Employee Password</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Enter a new secure password for this employee</p>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100" />

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">New Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={passwordState.showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordState.newPassword}
                      onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                      className="h-9 pl-9 pr-10 rounded-lg border-slate-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasswordChange("showPassword", !passwordState.showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700 transition-colors"
                    >
                      {passwordState.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {passwordState.newPassword && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={cn(
                            "h-1.5 flex-1 rounded-full transition-colors",
                            i === 1 || (i === 2 && passwordState.passwordStrength !== "weak") || (i === 3 && passwordState.passwordStrength === "strong")
                              ? getPasswordStrengthColor(passwordState.passwordStrength)
                              : "bg-slate-200",
                          )} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Strength: <span className="font-semibold text-slate-700">{getPasswordStrengthText(passwordState.passwordStrength)}</span>
                        </span>
                        {passwordState.passwordStrength === "strong" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Requirements checklist */}
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Requirements</p>
                    {[
                      { ok: passwordState.newPassword.length >= 8,                                                          label: "At least 8 characters" },
                      { ok: /[a-z]/.test(passwordState.newPassword) && /[A-Z]/.test(passwordState.newPassword),            label: "Upper & lowercase letters" },
                      { ok: /\d/.test(passwordState.newPassword),                                                           label: "At least one number" },
                      { ok: /[!@#$%^&*]/.test(passwordState.newPassword),                                                  label: "Special character (!@#$%^&*)" },
                    ].map(({ ok, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", ok ? "bg-emerald-500" : "bg-slate-300")} />
                        <span className={cn("text-xs", ok ? "text-emerald-700" : "text-slate-500")}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={passwordState.showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordState.confirmPassword}
                      onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                      className={cn(
                        "h-9 pl-9 rounded-lg border-slate-200 focus-visible:ring-amber-400/30",
                        passwordState.confirmPassword && passwordState.newPassword !== passwordState.confirmPassword
                          ? "border-rose-300 focus-visible:border-rose-400"
                          : "focus-visible:border-amber-400",
                      )}
                    />
                  </div>
                  {passwordState.confirmPassword && passwordState.newPassword !== passwordState.confirmPassword && (
                    <p className="flex items-center gap-1 text-xs text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5" /> Passwords do not match
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 rounded-lg text-xs"
                    disabled={passwordState.isLoading}
                    onClick={() => { setShowPasswordModal(false); setPasswordState(INITIAL_PASSWORD_STATE); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 h-9 rounded-lg text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-50"
                    disabled={!isPasswordValid() || passwordState.isLoading}
                    onClick={handleResetPassword}
                  >
                    {passwordState.isLoading ? (
                      <><span className="mr-1.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Resetting…</>
                    ) : "Reset Password"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Contact Details ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead icon={<Phone className="h-3.5 w-3.5" />} label="Contact Details" accent="from-violet-600 to-blue-600" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Email Address" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                disabled={!editing}
                value={draft.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                className={cn(iCls, "pl-9")}
              />
            </div>
          </Field>
          <Field label="Phone Number" required>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                disabled={!editing}
                value={draft.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className={cn(iCls, "pl-9")}
              />
            </div>
          </Field>
          <Field label="Alt. Phone">
            <div className="relative">
              <PhoneCall className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                disabled={!editing}
                value={draft.altPhone}
                onChange={(e) => set("altPhone", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className={cn(iCls, "pl-9")}
              />
            </div>
          </Field>
        </div>
      </div>

      {/* ── Addresses ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead icon={<MapPin className="h-3.5 w-3.5" />} label="Addresses" accent="from-emerald-500 to-teal-600" />

        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Home className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No addresses added yet</p>
            <Button
              size="sm"
              onClick={() => { setEditing?.(true); handleAddAddress(); }}
              className="h-8 gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add First Address
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address, idx) => (
              <div
                key={address.id}
                className={cn(
                  "rounded-xl border transition-all",
                  editingAddressId === address.id
                    ? "border-violet-200 bg-violet-50/30 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm",
                )}
              >
                {/* ── Editing mode ── */}
                {editingAddressId === address.id ? (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-violet-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
                        Address {idx + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Address Line 1" required>
                        <Input
                          disabled={!editing}
                          value={address.line1}
                          onChange={(e) => handleSaveAddress({ ...address, line1: e.target.value })}
                          placeholder="Street address"
                          className={cn(iCls)}
                        />
                      </Field>
                      <Field label="Address Line 2">
                        <Input
                          disabled={!editing}
                          value={address.line2}
                          onChange={(e) => handleSaveAddress({ ...address, line2: e.target.value })}
                          placeholder="Apartment, suite, etc."
                          className={cn(iCls)}
                        />
                      </Field>
                      <Field label="City" required>
                        <Input
                          disabled={!editing}
                          value={address.city}
                          onChange={(e) => handleSaveAddress({ ...address, city: e.target.value })}
                          placeholder="City"
                          className={cn(iCls)}
                        />
                      </Field>
                      <Field label="State / Province">
                        <Input
                          disabled={!editing}
                          value={address.state}
                          onChange={(e) => handleSaveAddress({ ...address, state: e.target.value })}
                          placeholder="State / Province"
                          className={cn(iCls)}
                        />
                      </Field>
                      <Field label="Postal Code" required>
                        <Input
                          disabled={!editing}
                          value={address.zipcode}
                          onChange={(e) => handleSaveAddress({ ...address, zipcode: e.target.value })}
                          placeholder="Postal code"
                          className={cn(iCls, "font-mono")}
                        />
                      </Field>
                      <Field label="Country" required>
                        <Input
                          disabled={!editing}
                          value={address.country}
                          onChange={(e) => handleSaveAddress({ ...address, country: e.target.value })}
                          placeholder="Country"
                          className={cn(iCls)}
                        />
                      </Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={handleCancelAddress}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={!isAddressValid(address)}
                        onClick={() => setEditingAddressId(null)}
                        className="h-8 rounded-lg text-xs bg-gradient-to-r from-violet-600 to-blue-600 text-white disabled:opacity-50"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                ) : viewingAddressId === address.id ? (
                  /* ── Detail view ── */
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Address {idx + 1} — Details</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                      {[
                        { label: "Line 1",      value: address.line1   },
                        { label: "Line 2",      value: address.line2   },
                        { label: "City",        value: address.city    },
                        { label: "State",       value: address.state   },
                        { label: "Postal Code", value: address.zipcode },
                        { label: "Country",     value: address.country },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                          <p className="text-sm text-slate-800 mt-0.5">{value || "—"}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setViewingAddressId(null)}>
                        Close
                      </Button>
                      <Button size="sm" className="h-8 rounded-lg text-xs bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                        onClick={() => { setViewingAddressId(null); handleEditAddress(address); }}>
                        <PencilLine className="mr-1 h-3 w-3" /> Edit
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Summary row ── */
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Home className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{address.line1 || "Unnamed Address"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[address.line2, address.city, address.state, address.zipcode, address.country]
                          .filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1"
                        onClick={() => setViewingAddressId(address.id)}>
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1"
                        onClick={() => handleEditAddress(address)}>
                        <PencilLine className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeleteAddress(address.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Notes ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead icon={<StickyNote className="h-3.5 w-3.5" />} label="Notes & Remarks" accent="from-slate-500 to-slate-700" />
        <div className="relative">
          <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            disabled={!editing}
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Enter any additional notes or remarks…"
            className="min-h-[100px] pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 resize-none disabled:bg-slate-50"
          />
        </div>
      </div>
    </div>
  );
}

/* ── UI helpers ── */

const iCls =
  "h-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30 disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors";

function SectionHead({ icon, label, accent = "from-violet-600 to-blue-600" }: {
  icon: React.ReactNode; label: string; accent?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white", accent)}>
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}