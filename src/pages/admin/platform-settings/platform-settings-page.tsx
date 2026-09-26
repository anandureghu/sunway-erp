import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  fetchPlatformSettings,
  updatePlatformSettings,
} from "@/service/platformSettingsService";
import type { PlatformSettingsRequest } from "@/types/platform";
import { getApiErrorMessage } from "@/lib/api-error-message";

const EMPTY_FORM: PlatformSettingsRequest = {
  street: "",
  city: "",
  state: "",
  country: "",
  bankName: "",
  accountHolder: "",
  iban: "",
  ifscCode: "",
  branchName: "",
};

export default function PlatformSettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [form, setForm] = useState<PlatformSettingsRequest>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchPlatformSettings()
      .then((data) =>
        setForm({
          street: data.street ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          country: data.country ?? "",
          bankName: data.bankName ?? "",
          accountHolder: data.accountHolder ?? "",
          iban: data.iban ?? "",
          ifscCode: data.ifscCode ?? "",
          branchName: data.branchName ?? "",
        }),
      )
      .catch((err) =>
        toast.error(getApiErrorMessage(err, "Failed to load platform settings")),
      )
      .finally(() => setLoading(false));
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const field = (key: keyof PlatformSettingsRequest, label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={form[key] ?? ""}
        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
        disabled={loading || saving}
      />
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePlatformSettings(form);
      toast.success("Platform settings saved");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save platform settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Settings"
        description="Sunway Solutions' address and bank details shown on subscription invoices (Payment Information) and receipts."
      />
      <Card className="max-w-2xl space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
          {field("street", "Street")}
          {field("city", "City")}
          {field("state", "State")}
          {field("country", "Country")}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field("bankName", "Bank Name")}
          {field("accountHolder", "Account Holder")}
          {field("iban", "IBAN Number")}
          {field("ifscCode", "IFSC / SWIFT")}
          {field("branchName", "Branch")}
        </div>
        <Button onClick={handleSave} disabled={loading || saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </Card>
    </div>
  );
}
