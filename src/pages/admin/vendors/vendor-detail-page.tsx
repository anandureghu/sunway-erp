import { useEffect, useState, type ReactNode } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { type Vendor } from "@/types/vendor";
import { normalizeVendorFromApi } from "@/lib/vendor-api";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  Building2,
  CreditCard,
  Edit,
  Globe,
  Mail,
  MapPin,
  Phone,
  Trash,
  Truck,
  User,
} from "lucide-react";
import { VendorDialog } from "./vendor-dialog";
import { PageHeader } from "@/components/PageHeader";
import { resolveVendorListPath } from "@/lib/navigation-back";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0 last:pb-0 first:pt-0">
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="min-w-0 text-right text-[13px] font-medium text-slate-800 break-all">
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isPurchaseHub = pathname.includes("/inventory/purchase/suppliers");
  const listPath = resolveVendorListPath(pathname);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchVendor = async () => {
    try {
      const res = await apiClient.get(`/vendors/${id}`);
      setVendor(normalizeVendorFromApi(res.data));
    } catch (err) {
      console.error("fetchVendor:", err);
      toast.error("Failed to load supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await apiClient.delete(`/vendors/${id}`);
      toast.success("Supplier deactivated");
      navigate(listPath);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, "Error deactivating supplier"));
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [id]);

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );

  if (!vendor)
    return (
      <div className="p-6">
        <p className="text-red-500">Supplier not found.</p>
      </div>
    );

  const subtitle = [vendor.vendorCode, vendor.contactPersonName, vendor.email]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={
        isPurchaseHub ? "mx-auto space-y-6 p-4 sm:p-6" : "space-y-6 p-6"
      }
    >
      <PageHeader
        variant={isPurchaseHub ? "darkGreen" : "darkBlue"}
        title={vendor.vendorName}
        description={
          subtitle ||
          "Vendor master record used on purchase orders and supplier invoices."
        }
        backHref={listPath}
        icon={<Truck className="h-5 w-5 text-white" />}
        actions={
          <>
            <Button
              size="lg"
              variant="secondary"
              className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
              onClick={() => setOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            {vendor.active !== false && (
              <Button
                size="lg"
                variant="destructive"
                className="shadow-md"
                onClick={handleDeactivate}
              >
                <Trash className="mr-2 h-4 w-4" /> Deactivate
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/80 pb-4">
            <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
              Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 pt-4">
            <DetailRow label="Supplier Code" value={vendor.vendorCode || "—"} />
            <DetailRow label="Supplier Name" value={vendor.vendorName} />
            <DetailRow
              label="Contact Person"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {vendor.contactPersonName || "—"}
                </span>
              }
            />
            <DetailRow label="Category" value={vendor.categoryName || "—"} />
            <DetailRow
              label="Email"
              value={
                vendor.email ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {vendor.email}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow
              label="Phone"
              value={
                vendor.phoneNo ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {vendor.phoneNo}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <DetailRow label="Fax" value={vendor.fax || "—"} />
            <DetailRow
              label="Active"
              value={
                <Badge
                  variant="outline"
                  className={
                    vendor.active
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }
                >
                  {vendor.active ? "Yes" : "No"}
                </Badge>
              }
            />
            <DetailRow
              label="1099 Supplier"
              value={vendor.is1099Vendor ? "Yes" : "No"}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/80 pb-4">
            <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-0 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-1">
              <DetailRow label="Street" value={vendor.street || "—"} />
              <DetailRow label="City" value={vendor.city || "—"} />
              <DetailRow label="Country" value={vendor.country || "—"} />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/80 pb-4">
            <CardTitle className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <CreditCard className="h-4 w-4 text-amber-600" />
              </div>
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 pt-4">
            {vendor.is1099Vendor ? (
              <DetailRow label="VAT" value={vendor.taxId || "—"} />
            ) : null}
            <DetailRow label="Vendor CR. No." value={vendor.vendorCrNo || "—"} />
            <DetailRow label="Bank Name" value={vendor.bankName || "—"} />
            <DetailRow label="IBAN" value={vendor.iban || "—"} />
            <DetailRow label="Payment Terms" value={vendor.paymentTerms || "—"} />
            <DetailRow label="Currency" value={vendor.currencyCode || "—"} />
            <DetailRow
              label="Credit Limit"
              value={
                vendor.creditLimit
                  ? `${vendor.currencyCode || ""} ${vendor.creditLimit.toLocaleString()}`.trim()
                  : "—"
              }
            />
            {vendor.websiteUrl ? (
              <DetailRow
                label="Website"
                value={
                  <a
                    href={vendor.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {vendor.websiteUrl}
                  </a>
                }
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <VendorDialog
        open={open}
        onOpenChange={setOpen}
        vendor={vendor}
        onSuccess={() => {
          setOpen(false);
          void fetchVendor();
        }}
      />
    </div>
  );
}
