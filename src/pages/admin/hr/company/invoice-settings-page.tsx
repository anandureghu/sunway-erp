import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/service/apiClient";
import type { Company } from "@/types/company";
import { InvoiceBrandingSettingsCard } from "./invoice-branding-settings-card";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

export default function InvoiceSettingsPage({
  financeSettings,
}: {
  financeSettings?: boolean;
}) {
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

  if (loading)
    return (
      <div className="p-6 text-muted-foreground">
        Loading invoice settings...
      </div>
    );
  if (!company)
    return (
      <div className="p-6 text-muted-foreground">
        Company context not found.
      </div>
    );

  return (
    <div className={financeSettings ? "space-y-6" : "p-6 space-y-6"}>
      {financeSettings ? (
        <SecondaryPageHeader
          title="Invoice Settings"
          description="Configure invoice-specific text branding and QR toggle behavior."
          icon={<Receipt className="h-5 w-5" />}
        />
      ) : (
        <PageHeader
          title="Invoice Settings"
          description="Configure invoice-specific text branding and QR toggle behavior."
          variant="darkBlue"
          icon={<Receipt className="w-6 h-6" />}
        />
      )}

      <InvoiceBrandingSettingsCard
        company={company}
        onSaved={(updated) => {
          setCompany(updated);
        }}
      />
    </div>
  );
}
