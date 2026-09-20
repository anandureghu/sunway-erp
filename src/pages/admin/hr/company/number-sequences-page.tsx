import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/service/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { Hash } from "lucide-react";

type NumberingConfig = {
  docType: string;
  prefix: string;
  startNumber: number;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  EMP:     "Employee Numbers",
  PO:      "Purchase Orders",
  PR:      "Purchase Requisitions",
  INV:     "Invoices",
  SO:      "Sales Orders",
  SR:      "Sales Returns",
  SH:      "Shipments",
  PL:      "Picklists",
  LV:      "Leaves",
  PAYROLL: "Payroll Runs",
  SUP:     "Suppliers / Vendors",
  WH:      "Warehouses",
  TX:      "Transactions",
  JE:      "Journal Entries (JE No.)",
  BUDGET:  "Budget Codes",
  CN:      "Credit Notes",
  CUST:    "Customer Codes",
};

const DEFAULT_CONFIGS: NumberingConfig[] = [
  { docType: "JE",     prefix: "JE",     startNumber: 1000 },
  { docType: "BUDGET", prefix: "BUD",    startNumber: 1000 },
  { docType: "CN",     prefix: "CN",     startNumber: 1000 },
  { docType: "CUST",   prefix: "CUST",   startNumber: 1000 },
];

export default function NumberSequencesPage({ hrSettings }: { hrSettings?: boolean }) {
  const { user } = useAuth();
  const companyId = user?.companyId ? Number(user.companyId) : null;
  const [configs, setConfigs] = useState<NumberingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    void (async () => {
      try {
        const res = await apiClient.get<NumberingConfig[]>(
          `/companies/${companyId}/numbering-config`,
        );
        const existing = res.data;
        const existingTypes = new Set(existing.map((c) => c.docType));
        const merged = [
          ...existing,
          ...DEFAULT_CONFIGS.filter((d) => !existingTypes.has(d.docType)),
        ];
        setConfigs(merged);
      } catch {
        toast.error("Failed to load numbering config");
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  const update = (docType: string, field: keyof NumberingConfig, value: string | number) => {
    setConfigs((prev) =>
      prev.map((c) => (c.docType === docType ? { ...c, [field]: value } : c)),
    );
  };

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const res = await apiClient.put<NumberingConfig[]>(
        `/companies/${companyId}/numbering-config`,
        configs,
      );
      setConfigs(res.data);
      toast.success("Number sequences saved");
    } catch {
      toast.error("Failed to save numbering config");
    } finally {
      setSaving(false);
    }
  };

  const preview = (c: NumberingConfig) => {
    const n = c.startNumber ?? 1000;
    if (!c.prefix) return String(n);
    return `${c.prefix}-${n}`;
  };

  const header = (
    <SecondaryPageHeader
      title="Number Sequences"
      description="Configure prefix and starting number for auto-generated codes"
      icon={<Hash className="h-5 w-5" />}
      actions={
        <Button onClick={() => void handleSave()} disabled={saving || loading}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      }
    />
  );

  return (
    <div className={hrSettings ? "space-y-4" : "p-6 space-y-4"}>
      {header}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Document type</th>
                <th className="px-4 py-3 text-left font-medium">Prefix</th>
                <th className="px-4 py-3 text-left font-medium">Start number</th>
                <th className="px-4 py-3 text-left font-medium">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {configs.map((c) => (
                <tr key={c.docType} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {DOC_TYPE_LABELS[c.docType] ?? c.docType}
                    <span className="ml-2 text-xs text-slate-400 font-mono">{c.docType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      className="h-8 w-28 font-mono text-sm"
                      placeholder="e.g. EMP"
                      value={c.prefix}
                      onChange={(e) => update(c.docType, "prefix", e.target.value.toUpperCase())}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      className="h-8 w-28 font-mono text-sm"
                      min={1}
                      value={c.startNumber}
                      onChange={(e) =>
                        update(c.docType, "startNumber", e.target.value ? Number(e.target.value) : 1000)
                      }
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">
                    {preview(c)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2.5 text-xs text-muted-foreground border-t bg-slate-50">
            Start number applies when a sequence is first created. Existing sequences continue from their current counter.
          </p>
        </div>
      )}
    </div>
  );
}
