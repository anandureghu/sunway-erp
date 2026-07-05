import { useEffect, useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/ui/data-table";
import type { Customer } from "@/types/customer";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getCustomerColumns } from "@/lib/columns/customer-listing-admin";
import {
  formatCustomerCode,
  isCustomerActive,
  normalizeCustomerFromApi,
} from "@/lib/customer-api";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerDialog } from "./customer-dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { getParentPath } from "@/lib/utils";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { pathname } = useLocation();

  const fetchCustomers = async () => {
    try {
      const res = await apiClient.get("/customers");
      // Map API response to match our Customer type
      const mappedCustomers = (res.data as Record<string, unknown>[]).map(
        normalizeCustomerFromApi,
      );
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

  const handleDeactivate = async (customer: Customer) => {
    const customerName = customer.customerName || customer.name || "Customer";
    try {
      await apiClient.delete(`/customers/${customer.id}`);
      toast.success(`Deactivated ${customerName}`);
      await fetchCustomers();
    } catch (err) {
      console.error("Deactivate failed:", err);
      toast.error("Failed to deactivate customer");
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
    const active = customers.filter(isCustomerActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [customers]);

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    switch (key) {
      case "active":
        setStatusFilter("active");
        break;
      case "inactive":
        setStatusFilter("inactive");
        break;
      default:
        setStatusFilter("all");
        break;
    }
  }, []);

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
    onDeactivate: handleDeactivate,
    onView: handleRowClick,
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const query = searchQuery.toLowerCase();
      const phoneQ = phoneFilter.trim().toLowerCase();
      const codeQ = codeFilter.trim().toLowerCase();
      const name = customer.customerName || customer.name || "";
      const matchesSearch =
        name.toLowerCase().includes(query) ||
        (customer.contactPersonName?.toLowerCase() ?? "").includes(query) ||
        (customer.email?.toLowerCase() ?? "").includes(query) ||
        (customer.phoneNo?.toLowerCase() ?? "").includes(query) ||
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
        (statusFilter === "inactive" && !active);

      const matchesCountry =
        countryFilter === "all" || customer.country === countryFilter;

      const matchesCity = cityFilter === "all" || customer.city === cityFilter;

      const matchesType =
        typeFilter === "all" || customer.customerType === typeFilter;

      return (
        matchesSearch &&
        matchesPhone &&
        matchesCode &&
        matchesStatus &&
        matchesCountry &&
        matchesCity &&
        matchesType
      );
    });
  }, [
    customers,
    searchQuery,
    phoneFilter,
    codeFilter,
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
    <div className="space-y-6 w-full">
      <SecondaryPageHeader
        title="Customers"
        description="Manage customers"
        icon={<Users className="h-5 w-5" />}
        actions={
          <Button
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            + New Customer
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="mb-6">
        <KpiSummaryStrip
          items={[
            kpiFilterItem(
              {
                label: "Total Customers",
                value: stats.total,
                hint: "Customer master rows",
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
                value: stats.active,
                hint: "Currently active",
                accent: "emerald",
                icon: Users,
              },
              "active",
              kpiFilter,
              applyKpiFilter,
            ),
            kpiFilterItem(
              {
                label: "Inactive",
                value: stats.inactive,
                hint: "Disabled accounts",
                accent: "rose",
                icon: Users,
              },
              "inactive",
              kpiFilter,
              applyKpiFilter,
            ),
          ]}
        />
      </div>

      {/* Search and Filters */}

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
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Customer code..."
            className="w-[140px]"
            value={codeFilter}
            onChange={(e) => setCodeFilter(e.target.value)}
          />
          <Input
            placeholder="Phone..."
            className="w-[140px]"
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
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
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
                {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}{" "}
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

      <CustomerDialog
        open={open}
        onOpenChange={setOpen}
        customer={selected}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
