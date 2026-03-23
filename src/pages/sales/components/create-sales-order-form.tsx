/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SALES_ORDER_SCHEMA, type SalesOrderFormData } from "@/schema/sales";
import type { ItemResponseDTO } from "@/service/erpApiTypes";
import type { BankAccount } from "@/types/bank-account";
import { useAuth } from "@/context/AuthContext";
import { listCustomers } from "@/service/customerService";
import { listItems, listWarehouses } from "@/service/inventoryService";
import { apiClient } from "@/service/apiClient";
import { createSalesOrder } from "@/service/salesFlowService";
import type { SalesOrderItem } from "@/types/sales";
import SelectAccount from "@/components/select-account";

type Props = {
  onCancel: () => void;
};

export function CreateSalesOrderForm({ onCancel }: Props) {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemWarehouse, setItemWarehouse] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const companyTaxActive = Boolean(company?.isTaxActive);
  const companyTaxRateRaw = Number(company?.taxRate ?? 0);
  const companyTaxRate = Number.isFinite(companyTaxRateRaw) ? companyTaxRateRaw : 0;

  const { register, handleSubmit, setValue, watch, formState } = useForm<
    Omit<SalesOrderFormData, "items"> & { items?: unknown[] }
  >({
    resolver: zodResolver(
      z.object({
        customerId: z.string().min(1, "Customer is required"),
        orderDate: z.string().min(1, "Order date is required"),
        invoiceDueDate: z.string().min(1, "Invoice due date is required"),
        bankAccountId: z.string().min(1, "Bank account is required"),
        debitAccountId: z.string().min(1, "Debit account is required"),
        creditAccountId: z.string().min(1, "Credit account is required"),
        requiredDate: z.string().optional(),
        shippingAddress: z.string().optional(),
        notes: z.string().optional(),
        salesPerson: z.string().optional(),
        items: z.array(z.any()).optional(),
      }),
    ),
    defaultValues: {
      orderDate: format(new Date(), "yyyy-MM-dd"),
      invoiceDueDate: format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd",
      ),
      items: [],
    },
    mode: "onChange",
  });

  const selectedCustomerId = watch("customerId");
  const selectedCustomer = customers.find(
    (c) => String(c.id) === String(selectedCustomerId),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [c, it, wh] = await Promise.all([
          listCustomers(),
          listItems(),
          listWarehouses(),
        ]);
        if (cancelled) return;
        setCustomers(c);
        setItems(it);
        setWarehouses(wh);
        if (user?.companyId) {
          const bankResponse = await apiClient.get<BankAccount[]>(
            `/bank-accounts/company/${user.companyId}`,
          );
          if (!cancelled) setBankAccounts(bankResponse.data || []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(
            e?.response?.data?.message ||
              e?.message ||
              "Failed to load form data",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.companyId]);

  const totals = useMemo(() => {
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.total - item.tax,
      0,
    );
    const tax = orderItems.reduce((sum, item) => sum + item.tax, 0);
    const discount = orderItems.reduce(
      (sum, item) =>
        sum + (item.unitPrice * item.quantity * item.discount) / 100,
      0,
    );
    return { subtotal, tax, discount, total: subtotal + tax };
  }, [orderItems]);

  const addItemToOrder = () => {
    if (!selectedItem || itemQuantity <= 0) return;
    const item = items.find((i) => String(i.id) === String(selectedItem));
    if (!item) return;

    const unitPrice = item.sellingPrice;
    const discountAmount = (unitPrice * itemQuantity * itemDiscount) / 100;
    const subtotal = unitPrice * itemQuantity - discountAmount;
    const tax = companyTaxActive ? subtotal * (companyTaxRate / 100) : 0;
    const total = subtotal + tax;

    setOrderItems((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        orderId: "",
        itemId: item.id,
        itemName: item.name,
        quantity: itemQuantity,
        unitPrice,
        lineSubtotal: subtotal,
        discountPercent: itemDiscount,
        taxRate: companyTaxActive ? companyTaxRate : 0,
        taxAmount: tax,
        discount: itemDiscount,
        tax,
        total,
        warehouseId: Number(itemWarehouse || 0),
        item,
      },
    ]);
    setSelectedItem("");
    setItemQuantity(1);
    setItemDiscount(0);
    setItemWarehouse("");
  };

  const removeItem = (itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const onSubmit = async (data: any) => {
    if (orderItems.length === 0) return toast.error("Add at least one item.");
    const completeData = {
      ...data,
      items: orderItems.map((item) => ({
        itemId: String(item.itemId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent ?? item.discount,
        taxRate: item.taxRate ?? 0,
        warehouseId: item.warehouseId,
      })),
    };
    const validationResult = SALES_ORDER_SCHEMA.safeParse(completeData);

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0]?.message;
      return toast.error(firstIssue || "Please correct form errors.");
    }

    try {
      setSubmitLoading(true);
      const created = await createSalesOrder({
        customerId: Number(data.customerId),
        orderDate: data.orderDate,
        invoiceDueDate: data.invoiceDueDate,
        bankAccountId: Number(data.bankAccountId),
        debitAccountId: Number(data.debitAccountId),
        creditAccountId: Number(data.creditAccountId),
        items: orderItems.map((it) => ({
          itemId: Number(it.itemId),
          quantity: Math.round(it.quantity),
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent ?? it.discount,
          taxRate: it.taxRate ?? 0,
        })),
      });
      toast.success(`Sales order ${created.orderNo} created successfully!`);
      navigate("/inventory/sales/orders", { replace: true });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create sales order.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Loading order form...
      </div>
    );
  }

  if (loadError) {
    return <div className="p-10 text-center text-red-600">{loadError}</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card className="border-0 shadow-md bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-800 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">
                  Sales
                </p>
                <h1 className="text-2xl font-bold">Create Sales Order</h1>
              </div>
            </div>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        <div className="xl:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Customer & Order Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select
                  value={selectedCustomerId || ""}
                  onValueChange={(value) =>
                    setValue("customerId", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers
                      .filter((c) => c.status === "active")
                      .map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={String(customer.id)}
                        >
                          {customer.name} ({customer.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formState.errors.customerId && (
                  <p className="text-sm text-red-500">
                    {formState.errors.customerId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Order Date *</Label>
                <Input type="date" {...register("orderDate")} />
              </div>
              <div className="space-y-2">
                <Label>Invoice Due Date *</Label>
                <Input type="date" {...register("invoiceDueDate")} />
              </div>
              <div className="space-y-2">
                <Label>Bank Account *</Label>
                <Select
                  value={watch("bankAccountId") || ""}
                  onValueChange={(value) =>
                    setValue("bankAccountId", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.bankName} - {account.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formState.errors.bankAccountId && (
                  <p className="text-sm text-red-500">
                    {formState.errors.bankAccountId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <SelectAccount
                  label="Debit Account *"
                  useId
                  value={watch("debitAccountId")}
                  onChange={(value) =>
                    setValue("debitAccountId", value, { shouldValidate: true })
                  }
                />
                {formState.errors.debitAccountId && (
                  <p className="text-sm text-red-500">
                    {formState.errors.debitAccountId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <SelectAccount
                  label="Credit Account *"
                  useId
                  value={watch("creditAccountId")}
                  onChange={(value) =>
                    setValue("creditAccountId", value, { shouldValidate: true })
                  }
                />
                {formState.errors.creditAccountId && (
                  <p className="text-sm text-red-500">
                    {formState.errors.creditAccountId.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Shipping Address</Label>
                <Textarea
                  placeholder="Enter shipping address"
                  {...register("shippingAddress")}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Add Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-2 space-y-2">
                  <Label>Item</Label>
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items
                        .filter((i) => i.status === "active")
                        .map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.name} - ₹{item.sellingPrice || 0}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={itemQuantity}
                    onChange={(e) =>
                      setItemQuantity(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={itemDiscount}
                    onChange={(e) =>
                      setItemDiscount(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warehouse</Label>
                  <Select
                    value={itemWarehouse}
                    onValueChange={setItemWarehouse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses
                        .filter((wh) => wh.status === "active")
                        .map((wh) => (
                          <SelectItem key={wh.id} value={String(wh.id)}>
                            {wh.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="button" onClick={addItemToOrder}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>

              {orderItems.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="text-left p-3">Item</th>
                        <th className="text-left p-3">Qty</th>
                        <th className="text-left p-3">Total</th>
                        <th className="text-left p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3">{item.item?.name}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">
                            ₹{item.total.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground rounded-lg border border-dashed">
                  No items added yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span>-₹{totals.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>₹{totals.tax.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {companyTaxActive
                  ? `Tax is applied at company rate (${companyTaxRate}%).`
                  : "Tax is disabled at company level."}
              </p>
              <div className="flex justify-between text-base font-semibold border-t pt-3">
                <span>Total</span>
                <span>₹{totals.total.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Internal notes" {...register("notes")} />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={submitLoading || orderItems.length === 0}
              >
                {submitLoading ? "Creating..." : "Create Sales Order"}
              </Button>
            </CardContent>
          </Card>

          {selectedCustomer && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Selected Customer</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{selectedCustomer.name}</p>
                <p className="text-muted-foreground">
                  {selectedCustomer.address}, {selectedCustomer.city},{" "}
                  {selectedCustomer.state}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </form>
    </div>
  );
}
