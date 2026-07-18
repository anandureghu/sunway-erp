import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, UserCheck, Mail, UserX } from "lucide-react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getCustomerColumns } from "@/lib/columns/customer-listing-admin";
import type { Customer } from "@/types/customer";
import type { Row } from "@tanstack/react-table";
import { CustomerDialog } from "@/pages/admin/customers/customer-dialog";
import { PageHeader } from "@/components/PageHeader";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCustomerCode,
  isCustomerActive,
  normalizeCustomerFromApi,
} from "@/lib/customer-api";

export default function CustomersPage() {
  const { confirm } = useConfirmDialog();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/customers");
      setCustomers(
        (res.data as Record<string, unknown>[]).map(normalizeCustomerFromApi),
      );
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEdit = (customer: Customer) => {
    setSelected(customer);
    setOpen(true);
  };

  const handleDeactivate = async (customer: Customer) => {
    const displayName = customer.customerName || customer.name || "Customer";
    if (
      !(await confirm(
        `Deactivate customer "${displayName}"? They will be hidden from new orders until reactivated.`,
      ))
    ) {
      return;
    }
    try {
      await apiClient.delete(`/customers/${customer.id}`);
      toast.success(`Customer "${displayName}" deactivated`);
      await fetchCustomers();
    } catch (error) {
      console.error("Deactivate failed:", error);
      toast.error("Failed to deactivate customer");
    }
  };

  const handleRowClick = (row: Row<Customer>) => {
    const customer = row.original;
    navigate(`/inventory/sales/customers/${customer.id}`);
  };

  const handleDialogSuccess = (_updated: Customer, mode: "add" | "edit") => {
    void fetchCustomers();
    setSelected(null);
    if (mode === "add") setOpen(false);
  };

  const columns = getCustomerColumns({
    onEdit: handleEdit,
    onDeactivate: handleDeactivate,
  });

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const phoneQ = phoneFilter.trim().toLowerCase();
    const codeQ = codeFilter.trim().toLowerCase();

    return customers.filter((customer) => {
      const name = customer.customerName || customer.name || "";
      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        (customer.email?.toLowerCase() ?? "").includes(query) ||
        (customer.city?.toLowerCase() ?? "").includes(query);

      const matchesPhone =
        !phoneQ || (customer.phoneNo?.toLowerCase() ?? "").includes(phoneQ);

      const code = formatCustomerCode(customer.id).toLowerCase();
      const rawId = String(customer.id ?? "").toLowerCase();
      const matchesCode =
        !codeQ || code.includes(codeQ) || rawId.includes(codeQ);

      const active = isCustomerActive(customer);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active) ||
        (statusFilter === "with_email" &&
          Boolean((customer.email || "").trim()));

      return matchesSearch && matchesPhone && matchesCode && matchesStatus;
    });
  }, [customers, searchQuery, phoneFilter, codeFilter, statusFilter]);

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    switch (key) {
      case "active":
        setStatusFilter("active");
        break;
      case "inactive":
        setStatusFilter("inactive");
        break;
      case "with_email":
        setStatusFilter("with_email");
        break;
      default:
        setStatusFilter("all");
        break;
    }
  }, []);

  const customerKpis = useMemo((): KpiSummaryStat[] => {
    const total = customers.length;
    const active = customers.filter(isCustomerActive).length;
    const withEmail = customers.filter((c) => (c.email || "").trim()).length;
    const inactive = Math.max(0, total - active);
    return [
      kpiFilterItem(
        {
          label: "Total customers",
          value: total,
          hint: "Sales buyer accounts",
          accent: "sky",
          icon: Users,
        },
        "all",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Active",
          value: active,
          hint: "Enabled for ordering",
          accent: "emerald",
          icon: UserCheck,
        },
        "active",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "With email",
          value: withEmail,
          hint: "Reachable for invoicing",
          accent: "violet",
          icon: Mail,
        },
        "with_email",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Inactive",
          value: inactive,
          hint: "Deactivated accounts",
          accent: "amber",
          icon: UserX,
        },
        "inactive",
        kpiFilter,
        applyKpiFilter,
      ),
    ];
  }, [customers, kpiFilter, applyKpiFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        variant="darkBlue"
        title="Sales Customers"
        description="Maintain buyers used on sales orders: contacts, billing details, and account notes."
        backHref="/inventory/sales"
        actions={
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-white/90"
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
          >
            Add New Customer
          </Button>
        }
      />

      <KpiSummaryStrip items={customerKpis} />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search by customer name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Input
              placeholder="Filter by customer code..."
              className="w-full lg:w-48"
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
            />
            <Input
              placeholder="Filter by phone..."
              className="w-full lg:w-44"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setKpiFilter(null);
              }}
            >
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Inactive only</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers found
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCustomers}
              onRowClick={handleRowClick}
            />
          )}
        </CardContent>
      </Card>

      <CustomerDialog
        open={open}
        onOpenChange={setOpen}
        customer={selected}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
