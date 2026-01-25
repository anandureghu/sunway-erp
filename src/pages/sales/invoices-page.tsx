import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SALES_INVOICE_COLUMNS } from "@/lib/columns/accounts-receivable-columns";
import { Search, Plus, ArrowLeft } from "lucide-react";
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
import { type SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { type Invoice } from "@/types/sales";
import { apiClient } from "@/service/apiClient";
import SelectAccount from "@/components/select-account";

export default function InvoicesPage() {
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState(
    (location.state as { searchQuery?: string })?.searchQuery || ""
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrderResponseDTO[]>([]);

  useEffect(() => {
    apiClient.get<Invoice[]>("/invoices").then((res) => setInvoices(res.data));
    apiClient
      .get<SalesOrderResponseDTO[]>("/sales/orders")
      .then((res) => setSalesOrders(res.data));
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      invoice.invoiceId?.toLowerCase().includes(q) ||
      invoice.toParty?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (showCreateForm) {
    return (
      <CreateInvoiceForm
        salesOrders={salesOrders}
        onCancel={() => setShowCreateForm(false)}
      />
    );
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
            <h1 className="text-3xl font-bold">Sales Invoices</h1>
            <p className="text-muted-foreground">
              Manage invoices and payments
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
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
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
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
          <DataTable data={filteredInvoices} columns={SALES_INVOICE_COLUMNS} />
        </CardContent>
      </Card>
    </div>
  );
}

function CreateInvoiceForm({
  salesOrders,
  onCancel,
}: {
  salesOrders: SalesOrderResponseDTO[];
  onCancel: () => void;
}) {
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(INVOICE_SCHEMA),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const selectedOrder = salesOrders.find(
    (o) => o.id.toString() === selectedOrderId
  );

  const invoiceDate = watch("date");

  useEffect(() => {
    if (invoiceDate) {
      const d = new Date(invoiceDate);
      d.setDate(d.getDate() + 30);
      setValue("dueDate", format(d, "yyyy-MM-dd"));
    }
  }, [invoiceDate, setValue]);

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      await apiClient.post("/invoices", {
        ...data,
        type: "SALES",
      });
      onCancel();
    } catch (e) {
      console.error(e);
      alert("Failed to create invoice");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
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
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sales Order *</Label>
              <Select
                value={selectedOrderId}
                onValueChange={(val) => {
                  setSelectedOrderId(val);
                  setValue("orderId", val);

                  const order = salesOrders.find(
                    (o) => o.id.toString() === val
                  );

                  if (order) {
                    setValue("customerId", order.customerId?.toString() || "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  {salesOrders
                    .filter(
                      (o) => o.status !== "cancelled" && o.status !== "draft"
                    )
                    .map((order) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        {order.orderNumber} – {order.customerName} – ₹
                        {order.totalAmount?.toLocaleString()}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.orderId && (
                <p className="text-sm text-red-500">{errors.orderId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={selectedOrder?.customerName || ""} disabled />
            </div>

            <SelectAccount
              label="Debit Account"
              useId
              value={watch("debitAccount")}
              onChange={(val) => setValue("debitAccount", val)}
            />

            <SelectAccount
              label="Credit Account"
              useId
              value={watch("creditAccount")}
              onChange={(val) => setValue("creditAccount", val)}
            />

            <div className="space-y-2">
              <Label>Invoice Date *</Label>
              <Input type="date" {...register("date")} />
            </div>

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="date" {...register("dueDate")} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Payment Terms</Label>
              <Input {...register("paymentTerms")} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Input {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        {selectedOrder && (
          <Card>
            <CardContent className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Order:</span>{" "}
                {selectedOrder.orderNumber}
              </p>
              <p>
                <span className="text-muted-foreground">Customer:</span>{" "}
                {selectedOrder.customerName}
              </p>
              <p>
                <span className="text-muted-foreground">Total:</span> ₹
                {selectedOrder.totalAmount?.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onCancel}>
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
