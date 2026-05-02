import { useEffect, useMemo, useState } from "react";
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
import { SalesPageHeader } from "./components/sales-page-header";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/customers");
      setCustomers(res.data);
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

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete customer "${customer.name}"?`)) {
      return;
    }
    try {
      await apiClient.delete(`/customers/${customer.id}`);
      toast.success(`Customer "${customer.name}" deleted successfully`);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete customer");
    }
  };

  const handleRowClick = (row: Row<Customer>) => {
    const customer = row.original;
    navigate(`/inventory/sales/customers/${customer.id}`);
  };

  const handleDialogSuccess = (updated: Customer, mode: "add" | "edit") => {
    if (mode === "add") {
      fetchCustomers(); // Refresh the list
    } else {
      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      fetchCustomers(); // Also refresh to get any server-computed fields
    }
    setSelected(null);
  };

  const columns = getCustomerColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      (customer.name?.toLowerCase() ?? "").includes(query) ||
      (customer.email?.toLowerCase() ?? "").includes(query) ||
      (customer.phoneNo?.toLowerCase() ?? "").includes(query) ||
      (customer.city?.toLowerCase() ?? "").includes(query)
    );
  });

  const customerKpis = useMemo((): KpiSummaryStat[] => {
    const total = customers.length;
    const active = customers.filter(
      (c) => c.active !== false && c.isActive !== false,
    ).length;
    const withEmail = customers.filter((c) => (c.email || "").trim()).length;
    const inactive = Math.max(0, total - active);
    return [
      {
        label: "Total customers",
        value: total,
        hint: "Sales buyer accounts",
        accent: "sky",
        icon: Users,
      },
      {
        label: "Active",
        value: active,
        hint: "Enabled for ordering",
        accent: "emerald",
        icon: UserCheck,
      },
      {
        label: "With email",
        value: withEmail,
        hint: "Reachable for invoicing",
        accent: "violet",
        icon: Mail,
      },
      {
        label: "Inactive",
        value: inactive,
        hint: "Hidden or disabled accounts",
        accent: "amber",
        icon: UserX,
      },
    ];
  }, [customers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <SalesPageHeader
        badge="Customers"
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search by customer name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
