import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { type Company } from "@/types/company";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Phone,
  Hash,
  CreditCard,
  Globe,
  Users,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  UserRound,
  Pencil,
  X,
  Layers,
} from "lucide-react";
import { CompanyDialog } from "../admin/hr/company/company-dialog";
import { EmployeeDialog } from "../admin/hr/employee/employee-dialog";
import type { Employee } from "@/types/hr";
import { useAppSelector } from "@/store/store";
import { hasAnyRole } from "@/lib/utils";

// ── Modules edit dialog ──────────────────────────────────────────────────────

interface ModulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onSuccess: () => void;
}

function ModulesDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
}: ModulesDialogProps) {
  const [hr, setHr] = useState(company.hrEnabled);
  const [finance, setFinance] = useState(company.financeEnabled);
  const [inventory, setInventory] = useState(company.inventoryEnabled);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setHr(company.hrEnabled);
      setFinance(company.financeEnabled);
      setInventory(company.inventoryEnabled);
    }
  }, [open, company]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        companyName: company.companyName,
        crNo: company.crNo,
        noOfEmployees: company.noOfEmployees,
        companyCode: company.companyCode,
        computerCard: company.computerCard,
        street: company.street,
        city: company.city,
        state: company.state,
        country: company.country,
        phoneNo: company.phoneNo,
        currencyId: company.currency?.id,
        hrEnabled: hr,
        financeEnabled: finance,
        inventoryEnabled: inventory,
      };

      const formData = new FormData();
      formData.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" }),
      );

      await apiClient.put(`/companies/${company.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Subscribed modules updated");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Failed to update modules");
    } finally {
      setSaving(false);
    }
  };

  const modules = [
    {
      key: "hr",
      label: "HR & Payroll",
      description: "Employee management, payroll and leaves",
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
      enabled: hr,
      setEnabled: setHr,
    },
    {
      key: "finance",
      label: "Finance",
      description: "Accounts, invoices and general ledger",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      enabled: finance,
      setEnabled: setFinance,
    },
    {
      key: "inventory",
      label: "Inventory",
      description: "Stock, purchase orders and warehousing",
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50",
      enabled: inventory,
      setEnabled: setInventory,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl [&>button]:hidden"
        style={{ maxWidth: 480 }}
      >
        {/* header */}
        <div className="flex items-center justify-between bg-linear-to-r from-slate-800 to-slate-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold text-white">
                Subscribed Modules
              </DialogTitle>
              <p className="text-[12px] text-slate-300">
                Enable or disable modules for this company
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* body */}
        <div className="space-y-3 bg-white px-6 py-5">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.key}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${m.color}`} />
                  </div>
                  <div>
                    <Label className="cursor-pointer text-[14px] font-medium text-slate-800">
                      {m.label}
                    </Label>
                    <p className="text-[12px] text-slate-500">{m.description}</p>
                  </div>
                </div>
                <Switch
                  checked={m.enabled}
                  onCheckedChange={m.setEnabled}
                  className="data-[state=checked]:bg-violet-600"
                />
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-6 text-[13px] font-semibold text-white hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { globalSettingsView } = useAppSelector((state) => state.ui);
  const isSuperAdmin = hasAnyRole(user?.role as string, ["SUPER_ADMIN"]);

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [openModules, setOpenModules] = useState(false);

  const [admin, setAdmin] = useState<Employee | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [, setAdminError] = useState<string | null>(null);
  const [openEditAdmin, setOpenEditAdmin] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [openCreateAdmin, setOpenCreateAdmin] = useState(false);

  const fetchCompany = async () => {
    if (!id || id === "undefined") return;
    try {
      const res = await apiClient.get(`/companies/${id}`);
      setCompany(res.data);
    } catch (err) {
      console.error("fetchCompany:", err);
      toast.error("Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyAdmin = async () => {
    if (!id || id === "undefined") return;
    setAdminLoading(true);
    setAdminError(null);
    apiClient
      .get(`/employees/admin/${id}`)
      .then((res) => {
        setAdmin(res.data);
      })
      .catch((err) => {
        console.warn("fetchCompanyAdmin:", err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to check company admin";
        if (
          message?.toLowerCase().includes("no admin") ||
          err?.response?.status === 404
        ) {
          setAdmin(null);
          setAdminError("No admin exists");
        } else {
          setAdminError(message);
          toast.error("Failed to check admin");
        }
      })
      .finally(() => {
        setAdminLoading(false);
      });
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/companies/${id}`);
      toast.success("Company deleted");
      navigate("/admin/companies");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting company");
    }
  };

  useEffect(() => {
    if (id === "undefined" || id === undefined) {
      const cid = user?.companyId;
      if (cid != null) {
        navigate(`/settings/${cid}`, { replace: true });
      }
      setLoading(false);
      setAdminLoading(false);
      return;
    }
    setLoading(true);
    setAdminLoading(true);
    void fetchCompany();
    void fetchCompanyAdmin();
  }, [id, user?.companyId, navigate]);

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          <p className="text-sm text-slate-500">Loading company details…</p>
        </div>
      </div>
    );

  if (!company)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-700">Company not found</p>
          <p className="mt-1 text-sm text-slate-500">
            The company you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );

  const infoFields = [
    { icon: Hash, label: "Company No", value: company.crNo || "—" },
    { icon: Users, label: "Employees", value: company.noOfEmployees || "—" },
    { icon: Phone, label: "Phone", value: company.phoneNo || "—" },
    {
      icon: CreditCard,
      label: "Computer Card",
      value: company.computerCard || "—",
    },
    {
      icon: Globe,
      label: "Currency",
      value: company.currency
        ? `${company.currency.currencyCode} (${company.currency.currencySymbol}) — ${company.currency.currencyName}`
        : "—",
    },
    {
      icon: Globe,
      label: "Currency Country",
      value: company.currency?.countryName || "—",
    },
  ];

  const addressFields = [
    { label: "Street", value: company.street || "—" },
    { label: "City", value: company.city || "—" },
    { label: "State", value: company.state || "—" },
    { label: "Country", value: company.country || "—" },
  ];

  const modules = [
    {
      label: "HR & Payroll",
      icon: Users,
      enabled: company.hrEnabled,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      label: "Finance",
      icon: DollarSign,
      enabled: company.financeEnabled,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Inventory",
      icon: Package,
      enabled: company.inventoryEnabled,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-600 via-violet-500 to-indigo-600 px-8 py-7 text-white shadow-lg shadow-violet-200">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-10 right-24 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {!globalSettingsView && (
              <button
                onClick={() => navigate("/admin/company")}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}

            {/* Logo / avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm overflow-hidden">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={`${company.companyName} logo`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8 text-violet-500" />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold leading-tight">
                {company.companyName}
              </h1>
              <div className="mt-1.5 flex items-center gap-2 text-[13px] text-white/75">
                {company.companyCode && (
                  <span className="rounded-md bg-white/15 px-2 py-0.5 font-mono text-xs">
                    {company.companyCode}
                  </span>
                )}
                {company.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {company.city}, {company.country}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setOpen(true)}
              className="h-9 rounded-xl bg-white/15 text-white border-white/20 hover:bg-white/25 gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            {!globalSettingsView && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="h-9 rounded-xl bg-red-500/80 hover:bg-red-500 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Company Information */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <Building2 className="h-4 w-4 text-slate-600" />
              </div>
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {infoFields.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="truncate text-[13px] text-slate-700">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
              {addressFields.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-[12px] font-medium text-slate-400">
                    {label}
                  </span>
                  <span className="text-right text-[13px] text-slate-700">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscribed Modules */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                  <Layers className="h-4 w-4 text-violet-600" />
                </div>
                Subscribed Modules
              </CardTitle>
              {isSuperAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpenModules(true)}
                  className="h-7 gap-1 rounded-lg px-2.5 text-[12px] text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {modules.map(({ label, icon: Icon, enabled, color, bg, border }) => (
              <div
                key={label}
                className={`flex items-center justify-between rounded-xl border ${border} ${bg} px-4 py-3`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-[13px] font-medium text-slate-700">
                    {label}
                  </span>
                </div>
                {enabled ? (
                  <Badge className="gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100">
                    <CheckCircle2 className="h-3 w-3" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    <XCircle className="h-3 w-3" />
                    Disabled
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Company Admin ── */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <UserRound className="h-4 w-4 text-orange-600" />
            </div>
            Company Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adminLoading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
              Checking for admin…
            </div>
          ) : admin ? (
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {/* avatar */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white shadow-sm">
                  {admin.firstName?.[0]}
                  {admin.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {admin.firstName} {admin.lastName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-violet-100 px-2 py-0 text-[11px] font-semibold text-violet-700"
                    >
                      {admin.role}
                    </Badge>
                    {admin.phoneNo && (
                      <span className="flex items-center gap-1 text-[12px] text-slate-500">
                        <Phone className="h-3 w-3" />
                        {admin.phoneNo}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/admin/employees/${admin.id}`)}
                  className="h-8 rounded-xl border border-slate-200 bg-white px-4 text-[13px] text-slate-600 hover:bg-slate-50"
                >
                  View Profile
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditEmployee(admin);
                    setOpenEditAdmin(true);
                  }}
                  className="h-8 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-[13px] font-semibold text-white hover:from-violet-700 hover:to-indigo-700"
                >
                  Edit Admin
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-4">
              <div>
                <p className="text-[13px] font-medium text-slate-700">
                  No admin assigned
                </p>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  Create an admin to manage company HR and permissions.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setOpenCreateAdmin(true)}
                className="h-8 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 text-[13px] font-semibold text-white hover:from-violet-700 hover:to-indigo-700"
              >
                Create Admin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}
      <CompanyDialog
        open={open}
        onOpenChange={setOpen}
        company={company}
        onSuccess={() => {
          setOpen(false);
          fetchCompany();
        }}
      />

      {company && (
        <ModulesDialog
          open={openModules}
          onOpenChange={setOpenModules}
          company={company}
          onSuccess={fetchCompany}
        />
      )}

      <EmployeeDialog
        open={openCreateAdmin}
        onOpenChange={setOpenCreateAdmin}
        companyId={company?.id ?? Number(id)}
        presetRole="ADMIN"
        onSuccess={() => {
          setOpenCreateAdmin(false);
          fetchCompanyAdmin();
        }}
      />

      {editEmployee && (
        <EmployeeDialog
          open={openEditAdmin}
          onOpenChange={setOpenEditAdmin}
          mode="edit"
          employee={editEmployee}
          employeeId={editEmployee?.id}
          companyId={company.id}
          presetRole="ADMIN"
          onSuccess={() => {
            setOpenEditAdmin(false);
            fetchCompanyAdmin();
          }}
        />
      )}
    </div>
  );
}
