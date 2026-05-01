import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/service/apiClient";
import type { Company } from "@/types/company";
import { InvoiceBrandingSettingsCard } from "./invoice-branding-settings-card";

export default function InvoiceSettingsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId ? Number(user.companyId) : 0;
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await apiClient.get<Company>(`/companies/${companyId}`);
        setCompany(res.data);
      } catch {
        toast.error("Failed to load invoice settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading invoice settings...</div>;
  if (!company) return <div className="p-6 text-muted-foreground">Company context not found.</div>;

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoice Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure invoice-specific text branding and QR toggle behavior.
        </p>
      </div>

      <InvoiceBrandingSettingsCard
        company={company}
        onSaved={(updated) => {
          setCompany(updated);
        }}
      />
    </div>
  );
}
