import { useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SALES_INVOICE_COLUMNS } from "@/lib/columns/accounts-receivable-columns";
import { invoices, salesOrders } from "@/lib/sales-data";
import { Search, Plus, FileText, Printer, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { INVOICE_SCHEMA, type InvoiceFormData } from "@/schema/sales";
import { Link, useLocation } from "react-router-dom";

export default function InvoicesPage() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState((location.state as { searchQuery?: string })?.searchQuery || "");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (showCreateForm) {
    return <CreateInvoiceForm onCancel={() => setShowCreateForm(false)} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Sales Invoices</h1>
            <p className="text-muted-foreground">Manage invoices and payments</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Invoices</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={SALES_INVOICE_COLUMNS} data={filteredInvoices} />
        </CardContent>
      </Card>
    </div>
  );
}

function CreateInvoiceForm({ onCancel }: { onCancel: () => void }) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(INVOICE_SCHEMA),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const selectedOrder = salesOrders.find((o) => o.id === selectedOrderId);

  const onSubmit = (data: InvoiceFormData) => {
    console.log("Creating invoice:", data);
    // TODO: Make API call to create invoice
    alert("Invoice created successfully!");
    onCancel();
  };

  // Calculate due date (30 days from invoice date by default)
  const invoiceDate = watch("date");
  const calculateDueDate = () => {
    if (invoiceDate) {
      const date = new Date(invoiceDate);
      date.setDate(date.getDate() + 30);
      return format(date, "yyyy-MM-dd");
    }
    return "";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Create Invoice</h1>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Sales Order *</Label>
                <Select
                  value={selectedOrderId}
                  onValueChange={(value) => {
                    setSelectedOrderId(value);
                    setValue("orderId", value);
                    if (selectedOrder) {
                      setValue("customerId", selectedOrder.customerId);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales order" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesOrders
                      .filter((o) => o.status !== "cancelled" && o.status !== "draft")
                      .map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.orderNo} - {order.customer?.name} - ₹{order.total.toLocaleString()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.orderId && (
                  <p className="text-sm text-red-500">{errors.orderId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Input
                  id="customerId"
                  value={selectedOrder?.customerId || ""}
                  disabled
                  {...register("customerId")}
                />
                {errors.customerId && (
                  <p className="text-sm text-red-500">{errors.customerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Invoice Date *</Label>
                <Input
                  id="date"
                  type="date"
                  {...register("date")}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register("dueDate")}
                  defaultValue={calculateDueDate()}
                />
                {errors.dueDate && (
                  <p className="text-sm text-red-500">{errors.dueDate.message}</p>
                )}
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  placeholder="Net 30, Net 45, etc."
                  {...register("paymentTerms")}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes"
                  {...register("notes")}
                />
              </div>
            </div>

            {selectedOrder && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Order Summary:</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Order No:</span> {selectedOrder.orderNo}</p>
                  <p><span className="text-muted-foreground">Customer:</span> {selectedOrder.customer?.name}</p>
                  <p><span className="text-muted-foreground">Items:</span> {selectedOrder.items.length} items</p>
                  <p><span className="text-muted-foreground">Total:</span> ₹{selectedOrder.total.toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedOrderId}>
            Create Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}

