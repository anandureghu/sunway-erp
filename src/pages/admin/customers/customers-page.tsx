import { useEffect, useState, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
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
import { getParentPath } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
        prev.map((c) => (c.id === updated.id ? updated : c)),
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

  const handleRowClick = (customer: Customer) => {
    const parentPath = getParentPath(pathname);
    const path = `/${parentPath}/customers/${customer.id}`;
    navigate(path);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => {
      const isActive =
        c.active !== undefined
          ? c.active
          : (c as any).isActive !== undefined
            ? (c as any).isActive
            : (c as any).is_active !== undefined
              ? (c as any).is_active
              : true;
      return isActive !== false;
    }).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [customers]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    customers.forEach((c) => {
      if (c.country) countrySet.add(c.country);
    });
    return Array.from(countrySet).sort();
  }, [customers]);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    customers.forEach((c) => {
      if (c.city) citySet.add(c.city);
    });
    return Array.from(citySet).sort();
  }, [customers]);

  const columns = getCustomerColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onView: handleRowClick,
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const query = searchQuery.toLowerCase();
      const name = customer.name || customer.customerName || "";
      const matchesSearch =
        name.toLowerCase().includes(query) ||
        (customer.contactPersonName?.toLowerCase() ?? "").includes(query) ||
        (customer.email?.toLowerCase() ?? "").includes(query) ||
        (customer.phoneNo?.toLowerCase() ?? "").includes(query) ||
        (customer.city?.toLowerCase() ?? "").includes(query);

      const isActive =
        customer.active !== undefined
          ? customer.active
          : (customer as any).isActive !== undefined
            ? (customer as any).isActive
            : (customer as any).is_active !== undefined
              ? (customer as any).is_active
              : true;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive !== false) ||
        (statusFilter === "inactive" && isActive === false);

      const matchesCountry =
        countryFilter === "all" || customer.country === countryFilter;

      const matchesCity = cityFilter === "all" || customer.city === cityFilter;

      const matchesType =
        typeFilter === "all" || customer.customerType === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCountry &&
        matchesCity &&
        matchesType
      );
    });
  }, [
    customers,
    searchQuery,
    statusFilter,
    countryFilter,
    cityFilter,
    typeFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading customers...</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Button
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          + New Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  TOTAL CUSTOMERS
                </p>
                <h2 className="text-2xl font-bold">{stats.total}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ACTIVE
                </p>
                <h2 className="text-2xl font-bold">{stats.active}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  INACTIVE
                </p>
                <h2 className="text-2xl font-bold">{stats.inactive}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 relative min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, phone, or city..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {paginatedCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers found
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={paginatedCustomers} />
              {/* Pagination */}
              {totalPages > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {Math.min(
                      (currentPage - 1) * itemsPerPage + 1,
                      filteredCustomers.length,
                    )}
                    -
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredCustomers.length,
                    )}{" "}
                    of {filteredCustomers.length} customers
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "min-w-[40px] bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                              : "min-w-[40px]"
                          }
                        >
                          {page}
                        </Button>
                      ),
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              )}
            </>
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
