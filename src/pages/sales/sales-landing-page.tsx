import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingBag,
  ShoppingCart,
  FileText,
  Package,
  Truck,
  Users,
  Receipt,
  Search,
  Clock,
  DollarSign,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { salesOrders, invoices, dispatches, customers } from "@/lib/sales-data";

export default function SalesLandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate KPIs
  const totalSales = invoices.reduce((sum, inv) => sum + inv.total!, 0);
  const pendingOrders = salesOrders.filter(
    (o) => o.status === "draft" || o.status === "confirmed"
  ).length;
  const dispatchesToday = dispatches.filter((d) => {
    const today = new Date().toDateString();
    const dispatchDate = new Date(d.createdAt).toDateString();
    return dispatchDate === today;
  }).length;
  const unpaidInvoices = invoices.filter(
    (inv) => inv.status === "Unpaid" || inv.status === "Overdue"
  ).length;

  // Search functionality
  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    const lowerQuery = query.toLowerCase();

    // Search in sales orders
    const foundOrder = salesOrders.find(
      (o) =>
        o.orderNo.toLowerCase().includes(lowerQuery) ||
        o.customer?.name.toLowerCase().includes(lowerQuery)
    );

    // Search in customers
    const foundCustomer = customers.find(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.code.toLowerCase().includes(lowerQuery) ||
        c.contactPerson?.toLowerCase().includes(lowerQuery)
    );

    // Search in invoices
    const foundInvoice = invoices.find(
      (inv) =>
        inv.invoiceNo?.toLowerCase().includes(lowerQuery) ||
        inv.customerName?.toLowerCase().includes(lowerQuery)
    );

    // Navigate to the first match found, prioritizing orders
    if (foundOrder) {
      navigate("/inventory/sales/orders", { state: { searchQuery: query } });
    } else if (foundCustomer) {
      navigate("/inventory/sales/customers", { state: { searchQuery: query } });
    } else if (foundInvoice) {
      navigate("/inventory/sales/invoices", { state: { searchQuery: query } });
    } else {
      // Show search results in a modal or navigate to search results page
      alert(
        `No results found for "${query}". Try searching for order numbers, customer names, or invoice numbers.`
      );
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-w-0">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-foreground break-words">
          Sales
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground break-words">
          Manage sales orders, customers, and invoices
        </p>
      </div>

      {/* Sales Summary / Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 items-stretch">
        <Card className="hover:shadow-md transition-shadow min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Total Sales
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5 sm:mt-1 break-all">
                  ₹{totalSales.toLocaleString()}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 lg:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Pending Orders
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5 sm:mt-1 break-all">
                  {pendingOrders}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 lg:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Dispatches Today
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5 sm:mt-1 break-all">
                  {dispatchesToday}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 lg:p-3 bg-green-100 rounded-lg flex-shrink-0">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow min-w-0 overflow-hidden">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Unpaid Invoices
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-0.5 sm:mt-1 break-all">
                  {unpaidInvoices}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 lg:p-3 bg-orange-100 rounded-lg flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Search */}
      <Card className="bg-muted/50 min-w-0">
        <CardContent className="p-3 sm:p-4">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative min-w-0">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Quick search: orders, customers, invoices..."
                className="pl-8 sm:pl-10 pr-8 sm:pr-10 min-w-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
          {searchQuery && (
            <div className="mt-2 text-xs sm:text-sm text-muted-foreground break-words">
              Press Enter to search, or click on a category below
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Operations Section */}
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground break-words">
            Sales Operations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 min-w-0 items-stretch">
            {/* Manage Sales */}
            <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-300 min-w-0 flex flex-col h-full justify-between">
              <CardHeader className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-3 sm:pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 lg:p-3 bg-blue-100 rounded-lg flex-shrink-0 self-start">
                    <ShoppingCart className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <CardTitle className="text-base sm:text-base lg:text-lg break-words leading-tight font-semibold">
                      Manage Sales Orders
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words mt-1.5">
                      View and manage sales orders
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6 pt-0">
                <Button
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-sm lg:text-base"
                >
                  <Link
                    to="/inventory/sales/orders"
                    className="block text-center"
                  >
                    Manage Sales Orders
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Create New Sales */}
            <Card className="hover:shadow-lg transition-shadow border-2 hover:border-green-300 min-w-0 flex flex-col h-full justify-between">
              <CardHeader className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-3 sm:pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 lg:p-3 bg-green-100 rounded-lg flex-shrink-0 self-start">
                    <ShoppingBag className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <CardTitle className="text-base sm:text-base lg:text-lg break-words leading-tight font-semibold">
                      Create New Sales
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words mt-1.5">
                      Create a new sales order
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6 pt-0">
                <Button
                  asChild
                  className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-sm lg:text-base"
                >
                  <Link
                    to="/inventory/sales/orders/new"
                    className="block text-center"
                  >
                    Create New Sales Order
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Sales Invoices */}
            <Card className="hover:shadow-lg transition-shadow border-2 hover:border-blue-300 min-w-0 flex flex-col h-full justify-between">
              <CardHeader className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-3 sm:pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 lg:p-3 bg-blue-100 rounded-lg flex-shrink-0 self-start">
                    <Receipt className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <CardTitle className="text-base sm:text-base lg:text-lg break-words leading-tight font-semibold">
                      Sales Invoices
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words mt-1.5">
                      Manage invoices and payments
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6 pt-0">
                <Button
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-sm lg:text-base"
                >
                  <Link
                    to="/inventory/sales/invoices"
                    className="block text-center"
                  >
                    View Invoices
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Customer & Dispatch Section */}
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground break-words">
            Customer & Dispatch
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 min-w-0 items-stretch">
            {/* Customers */}
            <Card className="hover:shadow-lg transition-shadow border-2 hover:border-amber-300 min-w-0 flex flex-col h-full justify-between">
              <CardHeader className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-3 sm:pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 lg:p-3 bg-amber-100 rounded-lg flex-shrink-0 self-start">
                    <Users className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <CardTitle className="text-base sm:text-base lg:text-lg break-words leading-tight font-semibold">
                      Customer Management
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words mt-1.5">
                      Manage customer information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6 pt-0">
                <Button
                  asChild
                  className="w-full bg-amber-600 hover:bg-amber-700 text-sm sm:text-sm lg:text-base"
                >
                  <Link
                    to="/inventory/sales/customers"
                    className="block text-center"
                  >
                    Manage Customers
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Picklist & Dispatch */}
            <Card className="hover:shadow-lg transition-shadow border-2 hover:border-amber-300 min-w-0 flex flex-col h-full justify-between">
              <CardHeader className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-3 sm:pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 lg:p-3 bg-amber-100 rounded-lg flex-shrink-0 self-start">
                    <Package className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <CardTitle className="text-base sm:text-base lg:text-lg break-words leading-tight font-semibold">
                      Picklist & Dispatch
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words mt-1.5">
                      Generate picklists and plan dispatch
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6 pt-0">
                <Button
                  asChild
                  className="w-full bg-amber-600 hover:bg-amber-700 text-sm sm:text-sm lg:text-base"
                >
                  <Link
                    to="/inventory/sales/picklist"
                    className="block text-center"
                  >
                    Picklist & Dispatch
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Delivery Tracking */}
            <Card className="hover:shadow-lg transition-shadow border-2 hover:border-orange-300 min-w-0 flex flex-col h-full justify-between">
              <CardHeader className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-3 sm:pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 sm:p-2.5 lg:p-3 bg-orange-100 rounded-lg flex-shrink-0 self-start">
                    <Truck className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <CardTitle className="text-base sm:text-base lg:text-lg break-words leading-tight font-semibold">
                      Delivery Tracking
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words mt-1.5">
                      Track shipments and deliveries
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-shrink-0 px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6 pt-0">
                <Button
                  asChild
                  className="w-full bg-orange-600 hover:bg-orange-700 text-sm sm:text-sm lg:text-base"
                >
                  <Link
                    to="/inventory/sales/tracking"
                    className="block text-center"
                  >
                    Track Deliveries
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
