import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import type { Customer } from "@/types/customer";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getCustomerColumns } from "@/lib/columns/customer-listing-admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerDialog } from "./customer-dialog";
import { useLocation, useNavigate } from "react-router-dom";
import type { Row } from "@tanstack/react-table";
import { getParentPath } from "@/lib/utils";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { pathname } = useLocation();

  const fetchCustomers = async () => {
    try {
      const res = await apiClient.get("/customers");
      // Map API response to match our Customer type
      const mappedCustomers = res.data.map((customer: any) => {
        const mapped = {
          ...customer,
          customerName: customer.name || customer.customerName,
          companyId: customer.customerId || customer.companyId,
          createdAt:
            customer.createdAt ||
            customer.created_at ||
            customer.dateCreated ||
            customer.date_created,
        };
        // Debug: Log first customer to see what fields are available
        if (res.data.indexOf(customer) === 0) {
          console.log("Sample customer data:", customer);
          console.log("Mapped createdAt:", mapped.createdAt);
        }
        return mapped;
      });
      setCustomers(mappedCustomers);
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

  const handleDialogSuccess = (updated: Customer, mode: "add" | "edit") => {
    if (mode === "add") {
      setCustomers((prev) => [...prev, updated]);
    } else {
      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    }
    setSelected(null);
  };

  const handleEdit = (customer: Customer) => {
    setSelected(customer);
    setOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    try {
      await apiClient.delete(`/customers/${customer.id}`);
      const customerName = customer.name || customer.customerName || "Customer";
      toast.success(`Deleted ${customerName}`);
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete customer");
    }
  };

  const navigate = useNavigate();

  const handleRowClick = (row: Row<Customer>) => {
    const customer = row.original;
    const parentPath = getParentPath(pathname);
    const path = `/${parentPath}/customers/${customer.id}`;
    navigate(path);
  };

  const columns = getCustomerColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  // Debug: Log columns to verify Created At column is included
  useEffect(() => {
    console.log(
      "Customer columns:",
      columns.map((col) => ({
        header: typeof col.header === "string" ? col.header : "function",
        accessorKey: (col as any).accessorKey || (col as any).id,
      }))
    );
  }, [columns]);

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    const name = customer.name || customer.customerName || "";
    return (
      name.toLowerCase().includes(query) ||
      (customer.contactPersonName?.toLowerCase() ?? "").includes(query) ||
      (customer.email?.toLowerCase() ?? "").includes(query) ||
      (customer.phoneNo?.toLowerCase() ?? "").includes(query)
    );
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by company name..."
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
