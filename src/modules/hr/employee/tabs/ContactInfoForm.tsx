import { useOutletContext, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  StickyNote,
  KeyRound,
  PencilLine,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateId } from "@/lib/utils";
import { addressService } from "@/service/addressService";
import { contactService } from "@/service/contactService";
import { hrService } from "@/service/hr.service";
import CountrySelect from "@/components/country-select";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import PhoneInput from "@/components/PhoneInput";
import EmailInput from "@/components/EmailInput";
import { validatePhone, normalizePhone } from "@/lib/countries";
import { normalizeEmail, validateEmail } from "@/lib/email";
import { toast } from "sonner";

type Ctx = {
  editing: boolean;
  setEditing?: (v: boolean) => void;
  isAdmin?: boolean;
};

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
    Boolean(address.country?.trim())
  );
}

function calculatePasswordStrength(
  password: string,
): "weak" | "medium" | "strong" {
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
  const { confirm } = useConfirmDialog();
  const { editing, isAdmin } = useOutletContext<Ctx>();

  const [saved, setSaved] = useState(SEED);
  const [draft, setDraft] = useState(SEED);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [viewingAddressId, setViewingAddressId] = useState<string | null>(null);
  const [savingAddressId, setSavingAddressId] = useState<string | null>(null);
  const [passwordState, setPasswordState] = useState<PasswordState>(
    INITIAL_PASSWORD_STATE,
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [employeeUsername, setEmployeeUsername] = useState("");
  // The reset endpoint is keyed by the linked User id, which is distinct from
  // the employee id in the route. Captured from the loaded employee record.
  const [employeeUserId, setEmployeeUserId] = useState<number | null>(null);

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
        const employeeEmail = normalizeEmail(empData.email);
        const employeePhone = normalizePhone(empData.phoneNo);
        setEmployeeUsername(empData.username || "");
        setEmployeeUserId(
          empData.userId != null ? Number(empData.userId) : null,
        );

        // Then fetch contact info (which may be empty for new employees)
        return contactService.getContactInfo(employeeId).then((res) => {
          if (!mounted) return;
          const data = res.data || {};

          // Use contact info if available, otherwise fall back to employee data
          setDraft((d) => ({
            ...d,
            email: normalizeEmail(data.email || employeeEmail),
            phone: normalizePhone(data.phone || employeePhone),
            altPhone: normalizePhone(data.altPhone),
            notes: data.notes || "",
          }));
          setSaved((s) => ({
            ...s,
            email: normalizeEmail(data.email || employeeEmail),
            phone: normalizePhone(data.phone || employeePhone),
            altPhone: normalizePhone(data.altPhone),
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
      // Block saving on an invalid phone number.
      const phoneValid = validatePhone(draft.phone, { required: true });
      const altValid = validatePhone(draft.altPhone, { required: false });
      const emailValid = validateEmail(draft.email, { required: true });
      if (!emailValid.valid) {
        toast.error(emailValid.message ?? "Invalid email address");
        return;
      }
      if (!phoneValid.valid) {
        toast.error(phoneValid.message ?? "Invalid phone number");
        return;
      }
      if (!altValid.valid) {
        toast.error(`Alt. phone: ${altValid.message ?? "invalid"}`);
        return;
      }

      setSaved(draft);
      if (!employeeId) return;

      // Addresses are persisted independently through their own inline
      // Save/Update buttons — the page-level Save only handles contact details,
      // so there is no longer a second, duplicate save of address records.
      try {
        await contactService.saveContactInfo(employeeId, {
          email: normalizeEmail(draft.email),
          phone: normalizePhone(draft.phone),
          altPhone: draft.altPhone ? normalizePhone(draft.altPhone) : undefined,
          notes: draft.notes || "",
        });
        toast.success("Contact information saved");
      } catch (err) {
        console.error("Failed to save contact info", err);
        toast.error("Failed to save contact info");
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
  }, [draft, saved, employeeId]);

  const set = <K extends keyof ContactInfo>(k: K, v: ContactInfo[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const phoneCheck = validatePhone(draft.phone, { required: true });
  const altPhoneCheck = validatePhone(draft.altPhone, { required: false });
  const emailCheck = validateEmail(draft.email, { required: true });

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
      current.map((a) => (a.id === address.id ? address : a)),
    );
  }, []);

  // Reload the canonical address list from the server (also assigns real ids
  // to newly created records, so a subsequent edit updates instead of inserts).
  const reloadAddresses = useCallback(async () => {
    if (!employeeId) return;
    try {
      const res = await addressService.getAddressesByEmployee(employeeId);
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
    } catch (err) {
      console.error("Failed to reload addresses", err);
    }
  }, [employeeId]);

  // Persist a single address immediately (create if new, update if existing).
  const handlePersistAddress = useCallback(
    async (address: Address) => {
      if (!isAddressValid(address)) {
        toast.error("Address line 1, city, and country are required");
        return;
      }
      if (!employeeId) {
        toast.error("Cannot save address: missing employee record");
        return;
      }

      const payload = {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        state: address.state || undefined,
        country: address.country,
        postalCode: address.zipcode || undefined,
        addressType: "HOME" as const,
      };

      setSavingAddressId(address.id);
      try {
        if (/^\d+$/.test(address.id)) {
          await addressService.updateAddress(Number(address.id), payload);
          toast.success("Address updated");
        } else {
          await addressService.addAddress(employeeId, payload);
          toast.success("Address added");
        }
        await reloadAddresses();
        setEditingAddressId(null);
      } catch (err) {
        console.error("Failed to save address", err);
        toast.error("Failed to save address");
      } finally {
        setSavingAddressId(null);
      }
    },
    [employeeId, reloadAddresses],
  );

  const handleCancelAddress = useCallback(() => {
    const editingId = editingAddressId;
    setEditingAddressId(null);
    if (!editingId) return;

    if (/^\d+$/.test(editingId)) {
      // Existing record — discard unsaved edits by reloading canonical data.
      void reloadAddresses();
    } else {
      // New, never-persisted record — simply drop it.
      setAddresses((current) => current.filter((a) => a.id !== editingId));
    }
  }, [editingAddressId, reloadAddresses]);

  const handleDeleteAddress = useCallback(async (id: string) => {
    if (!(await confirm("Are you sure you want to delete this address?")))
      return;

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
  }, [confirm]);

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

    if (!employeeUserId) {
      toast.error("No linked user account found for this employee");
      return;
    }

    setPasswordState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Reset is keyed by the User id (not the employee id from the route).
      await hrService.resetEmployeePassword(employeeUserId, {
        newPassword: passwordState.newPassword,
        confirmPassword: passwordState.confirmPassword,
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
    <div className="bg-slate-50/60 min-h-screen space-y-5">
      {/* ── Page header ── */}
      <SecondaryPageHeader
        title="Contact Information"
        description="Manage email, phone numbers, and addresses"
        icon={<Mail className="h-5 w-5 text-white" />}
        actions={
          isAdmin ? (
            <Button
              onClick={() => setShowPasswordModal(true)}
              size="sm"
              className="h-9 gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-semibold text-white shadow-sm hover:shadow-md"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Reset Password
            </Button>
          ) : null
        }
      />

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
                    <h3 className="font-bold text-slate-900 text-sm">
                      Reset Employee Password
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enter a new secure password for this employee
                    </p>
                  </div>
                </div>

                {/* Username of the employee whose password is being reset */}
                {employeeUsername && (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Username
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-800">
                      {employeeUsername}
                    </span>
                  </div>
                )}

                <div className="h-px w-full bg-slate-100" />

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={passwordState.showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordState.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      className="h-9 pl-9 pr-10 rounded-lg border-slate-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/30"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handlePasswordChange(
                          "showPassword",
                          !passwordState.showPassword,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700 transition-colors"
                    >
                      {passwordState.showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {passwordState.newPassword && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1.5 flex-1 rounded-full transition-colors",
                              i === 1 ||
                                (i === 2 &&
                                  passwordState.passwordStrength !== "weak") ||
                                (i === 3 &&
                                  passwordState.passwordStrength === "strong")
                                ? getPasswordStrengthColor(
                                    passwordState.passwordStrength,
                                  )
                                : "bg-slate-200",
                            )}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Strength:{" "}
                          <span className="font-semibold text-slate-700">
                            {getPasswordStrengthText(
                              passwordState.passwordStrength,
                            )}
                          </span>
                        </span>
                        {passwordState.passwordStrength === "strong" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Requirements checklist */}
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Requirements
                    </p>
                    {[
                      {
                        ok: passwordState.newPassword.length >= 8,
                        label: "At least 8 characters",
                      },
                      {
                        ok:
                          /[a-z]/.test(passwordState.newPassword) &&
                          /[A-Z]/.test(passwordState.newPassword),
                        label: "Upper & lowercase letters",
                      },
                      {
                        ok: /\d/.test(passwordState.newPassword),
                        label: "At least one number",
                      },
                      {
                        ok: /[!@#$%^&*]/.test(passwordState.newPassword),
                        label: "Special character (!@#$%^&*)",
                      },
                    ].map(({ ok, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            ok ? "bg-emerald-500" : "bg-slate-300",
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs",
                            ok ? "text-emerald-700" : "text-slate-500",
                          )}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={passwordState.showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordState.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      className={cn(
                        "h-9 pl-9 rounded-lg border-slate-200 focus-visible:ring-amber-400/30",
                        passwordState.confirmPassword &&
                          passwordState.newPassword !==
                            passwordState.confirmPassword
                          ? "border-rose-300 focus-visible:border-rose-400"
                          : "focus-visible:border-amber-400",
                      )}
                    />
                  </div>
                  {passwordState.confirmPassword &&
                    passwordState.newPassword !==
                      passwordState.confirmPassword && (
                      <p className="flex items-center gap-1 text-xs text-rose-600">
                        <AlertCircle className="h-3.5 w-3.5" /> Passwords do not
                        match
                      </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 rounded-lg text-xs"
                    disabled={passwordState.isLoading}
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordState(INITIAL_PASSWORD_STATE);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 h-9 rounded-lg text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-50"
                    disabled={!isPasswordValid() || passwordState.isLoading}
                    onClick={handleResetPassword}
                  >
                    {passwordState.isLoading ? (
                      <>
                        <span className="mr-1.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />{" "}
                        Resetting…
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Contact Details ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead
          icon={<Phone className="h-3.5 w-3.5" />}
          label="Contact Details"
          accent="from-violet-600 to-blue-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Email Address" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <EmailInput
                disabled={!editing}
                value={draft.email}
                onChange={(v) => set("email", v)}
                placeholder="you@example.com"
                invalid={editing && !!draft.email && !emailCheck.valid}
                className={cn(iCls, "pl-9")}
              />
            </div>
            {editing && !emailCheck.valid && (
              <p className="flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" /> {emailCheck.message}
              </p>
            )}
          </Field>
          <Field label="Phone Number" required>
            <PhoneInput
              disabled={!editing}
              value={draft.phone}
              onChange={(v) => set("phone", v)}
              placeholder="Phone number"
              invalid={editing && !!draft.phone && !phoneCheck.valid}
            />
            {editing && !phoneCheck.valid && (
              <p className="flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" /> {phoneCheck.message}
              </p>
            )}
          </Field>
          <Field label="Alt. Phone">
            <PhoneInput
              disabled={!editing}
              value={draft.altPhone}
              onChange={(v) => set("altPhone", v)}
              placeholder="Phone number"
              invalid={editing && !!draft.altPhone && !altPhoneCheck.valid}
            />
            {editing && !!draft.altPhone && !altPhoneCheck.valid && (
              <p className="flex items-center gap-1 text-xs text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" /> {altPhoneCheck.message}
              </p>
            )}
          </Field>
        </div>
      </div>

      {/* ── Addresses ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHead
          icon={<MapPin className="h-3.5 w-3.5" />}
          label="Addresses"
          accent="from-emerald-500 to-teal-600"
        />

        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Home className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No addresses added yet</p>
            <Button
              size="sm"
              onClick={handleAddAddress}
              className="h-8 gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add First Address
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddAddress}
                disabled={editingAddressId !== null}
                className="h-8 gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add Address
              </Button>
            </div>
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
                {/* ── Inline edit mode — no global edit mode required ── */}
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
                          value={address.line1}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              line1: e.target.value,
                            })
                          }
                          placeholder="Street address"
                          className={cn(iCls)}
                        />
                      </Field>
                      <Field label="Address Line 2">
                        <Input
                          value={address.line2}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              line2: e.target.value,
                            })
                          }
                          placeholder="Apartment, suite, etc."
                          className={cn(iCls)}
                        />
                      </Field>
                      <Field label="City" required>
                        <Input
                          value={address.city}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              city: e.target.value,
                            })
                          }
                          placeholder="City"
                          className={cn(iCls)}
                        />
                      </Field>
                      <Field label="State / Province">
                        <Input
                          value={address.state}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              state: e.target.value,
                            })
                          }
                          placeholder="State / Province"
                          className={cn(iCls)}
                        />
                      </Field>
                      <Field label="Postal Code">
                        <Input
                          value={address.zipcode}
                          onChange={(e) =>
                            handleSaveAddress({
                              ...address,
                              zipcode: e.target.value,
                            })
                          }
                          placeholder="Postal code"
                          className={cn(iCls, "font-mono")}
                        />
                      </Field>
                      <Field label="Country" required>
                        <CountrySelect
                          value={address.country}
                          onChange={(v) =>
                            handleSaveAddress({ ...address, country: v })
                          }
                          placeholder="Select country..."
                        />
                      </Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                        disabled={savingAddressId === address.id}
                        onClick={handleCancelAddress}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={
                          !isAddressValid(address) ||
                          savingAddressId === address.id
                        }
                        onClick={() => handlePersistAddress(address)}
                        className="h-8 rounded-lg text-xs bg-gradient-to-r from-violet-600 to-blue-600 text-white disabled:opacity-50"
                      >
                        {savingAddressId === address.id
                          ? "Saving…"
                          : /^\d+$/.test(address.id)
                            ? "Update"
                            : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : viewingAddressId === address.id ? (
                  /* ── Detail view ── */
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          Address {idx + 1} — Details
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                      {[
                        { label: "Line 1", value: address.line1 },
                        { label: "Line 2", value: address.line2 },
                        { label: "City", value: address.city },
                        { label: "State", value: address.state },
                        { label: "Postal Code", value: address.zipcode },
                        { label: "Country", value: address.country },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {label}
                          </p>
                          <p className="text-sm text-slate-800 mt-0.5">
                            {value || "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => setViewingAddressId(null)}
                      >
                        Close
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 rounded-lg text-xs bg-gradient-to-r from-violet-600 to-blue-600 text-white"
                        onClick={() => {
                          setViewingAddressId(null);
                          handleEditAddress(address);
                        }}
                      >
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
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {address.line1 || "Unnamed Address"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[
                          address.line2,
                          address.city,
                          address.state,
                          address.zipcode,
                          address.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg text-xs gap-1"
                        onClick={() => setViewingAddressId(address.id)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg text-xs gap-1"
                        onClick={() => handleEditAddress(address)}
                      >
                        <PencilLine className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
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
        <SectionHead
          icon={<StickyNote className="h-3.5 w-3.5" />}
          label="Notes & Remarks"
          accent="from-slate-500 to-slate-700"
        />
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

function SectionHead({
  icon,
  label,
  accent = "from-violet-600 to-blue-600",
}: {
  icon: React.ReactNode;
  label: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
          accent,
        )}
      >
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
