import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { type Customer } from "@/types/customer";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { CustomerDialog } from "./customer-dialog";
import { SalesPageHeader } from "@/pages/sales/components/sales-page-header";

const SALES_CUSTOMERS_LIST = "/inventory/sales/customers";
const ADMIN_CUSTOMERS_LIST = "/admin/customers";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSalesHub = pathname.includes("/inventory/sales/customers");
  const listPath = isSalesHub ? SALES_CUSTOMERS_LIST : ADMIN_CUSTOMERS_LIST;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchCustomer = async () => {
    try {
      const res = await apiClient.get(`/customers/${id}`);
      setCustomer(res.data);
    } catch (err) {
      console.error("fetchCustomer:", err);
      toast.error("Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/customers/${id}`);
      toast.success("Customer deleted");
      navigate(listPath);
    } catch (err) {
      console.error(err);
      toast.error("Error deleting customer");
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );

  if (!customer)
    return (
      <div className="p-6">
        <p className="text-red-500">Customer not found.</p>
      </div>
    );

  const displayName =
    customer.customerName ?? customer.name ?? "Customer";
  const subtitle = [customer.contactPersonName, customer.email]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={
        isSalesHub ? "space-y-6 p-4 sm:p-6" : "space-y-6 p-6"
      }
    >
      {isSalesHub ? (
        <SalesPageHeader
          badge="Customer"
          title={displayName}
          description={
            subtitle ||
            "Contacts, billing details, and terms used on sales orders."
          }
          backHref={listPath}
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
              <Button
                size="lg"
                variant="destructive"
                className="shadow-md"
                onClick={handleDelete}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </Button>
            </>
          }
        />
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex gap-3 items-center">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-semibold">{displayName}</h1>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setOpen(true)}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>

            <Button variant="destructive" onClick={handleDelete}>
              <Trash className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Customer Name:</span>{" "}
              {displayName}
            </p>
            <p>
              <span className="font-semibold">Contact Person:</span>{" "}
              {customer.contactPersonName || "-"}
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {customer.email || "-"}
            </p>
            <p>
              <span className="font-semibold">Phone:</span>{" "}
              {customer.phoneNo || "-"}
            </p>
            <p>
              <span className="font-semibold">Customer Type:</span>{" "}
              {customer.customerType || "-"}
            </p>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Street:</span>{" "}
              {customer.street || "-"}
            </p>
            <p>
              <span className="font-semibold">City:</span>{" "}
              {customer.city || "-"}
            </p>
            <p>
              <span className="font-semibold">State:</span>{" "}
              {customer.state || "-"}
            </p>
            <p>
              <span className="font-semibold">Country:</span>{" "}
              {customer.country || "-"}
            </p>
          </CardContent>
        </Card>

        {/* Financial Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Tax ID:</span>{" "}
              {customer.taxId || "-"}
            </p>
            <p>
              <span className="font-semibold">Payment Terms:</span>{" "}
              {customer.paymentTerms || "-"}
            </p>
            <p>
              <span className="font-semibold">Currency:</span>{" "}
              {customer.currencyCode || "-"}
            </p>
            <p>
              <span className="font-semibold">Credit Limit:</span>{" "}
              {customer.creditLimit
                ? `${
                    customer.currencyCode || ""
                  } ${customer.creditLimit.toLocaleString()}`
                : "-"}
            </p>
            {customer.websiteUrl && (
              <p>
                <span className="font-semibold">Website:</span>{" "}
                <a
                  href={customer.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {customer.websiteUrl}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <CustomerDialog
        open={open}
        onOpenChange={setOpen}
        customer={customer}
        onSuccess={() => {
          setOpen(false);
          void fetchCustomer();
        }}
      />
    </div>
  );
}
