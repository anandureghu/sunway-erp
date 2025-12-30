import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getCustomerColumns } from "@/lib/columns/customer-listing-admin";
import type { Customer } from "@/types/customer";
import type { Row } from "@tanstack/react-table";
import { CustomerDialog } from "@/pages/admin/customers/customer-dialog";

export default function CustomersPage() {
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

  const handleRowClick = (_row: Row<Customer>) => {
    // Optional: navigate to customer detail page
    // const customer = row.original;
    // navigate(`/inventory/sales/customers/${customer.id}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Customers</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Add New Customer
            </Button>
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
