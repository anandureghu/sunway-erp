/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Info, Plus, ShoppingCart } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { listCustomers } from "@/service/customerService";
import {
  listItems,
  listItemWarehouseStock,
  listWarehouses,
} from "@/service/inventoryService";
import type { ItemWarehouseStockRowDTO } from "@/service/erpApiTypes";
import { apiClient } from "@/service/apiClient";
import { createSalesOrder, updateSalesOrder } from "@/service/salesFlowService";
import type { SalesOrder, SalesOrderItem } from "@/types/sales";
import type { Company } from "@/types/company";
import { hasSalesAccountingDefaults } from "@/lib/accounting-defaults";
import { CurrencyAmount } from "@/components/currency/currency-amount";
import { SalesPageHeader } from "./sales-page-header";

type Props = {
  onCancel: () => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
  initialOrder?: SalesOrder | null;
};

export function CreateSalesOrderForm({
  onCancel,
  onSuccess,
  mode = "create",
  initialOrder = null,
}: Props) {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [itemWarehouse, setItemWarehouse] = useState("");
  const [pickerStockRows, setPickerStockRows] = useState<
    ItemWarehouseStockRowDTO[]
  >([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<ItemResponseDTO[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [salesDefaultsMissing, setSalesDefaultsMissing] = useState(false);
  const [resolvedSalesAccounts, setResolvedSalesAccounts] = useState<{
    bankAccountId: number;
    debitAccountId: number;
    creditAccountId: number;
  } | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const isEditMode = mode === "edit" && Boolean(initialOrder?.id);
  const companyTaxActive = Boolean(company?.isTaxActive);
  const companyTaxRateRaw = Number(company?.taxRate ?? 0);
  const companyTaxRate = Number.isFinite(companyTaxRateRaw)
    ? companyTaxRateRaw
    : 0;

  const { register, handleSubmit, setValue, watch, formState } = useForm<
    Omit<SalesOrderFormData, "items"> & { items?: unknown[] }
  >({
    resolver: zodResolver(
      z.object({
        customerId: z.string().min(1, "Customer is required"),
        orderDate: z.string().min(1, "Order date is required"),
        invoiceDueDate: z.string().min(1, "Invoice due date is required"),
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
  const shippingAddressValue = watch("shippingAddress");
  const selectedCustomer = customers.find(
    (c) => String(c.id) === String(selectedCustomerId),
  );

  const composeCustomerAddress = (customer: any) => {
    if (!customer) return "";
    const parts = [
      customer.address || customer.street,
      customer.city,
      customer.state,
      customer.country,
      customer.postalCode || customer.pin,
    ]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean);
    return parts.join(", ");
  };

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
          const companyRes = await apiClient.get<Company>(
            `/companies/${user.companyId}`,
          );
          if (!cancelled && companyRes.data) {
            const co = companyRes.data;
            if (!hasSalesAccountingDefaults(co)) {
              setSalesDefaultsMissing(true);
              setResolvedSalesAccounts(null);
            } else {
              setSalesDefaultsMissing(false);
              setResolvedSalesAccounts({
                bankAccountId: co.defaultBankAccountId!,
                debitAccountId: co.defaultSalesDebitAccountId!,
                creditAccountId: co.defaultSalesCreditAccountId!,
              });
            }
          }
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

  useEffect(() => {
    if (!selectedItem) {
      setPickerStockRows([]);
      return;
    }
    let cancelled = false;
    listItemWarehouseStock(selectedItem)
      .then((rows) => {
        if (!cancelled) setPickerStockRows(rows);
      })
      .catch(() => {
        if (!cancelled) setPickerStockRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem) return;
    const inv = items.find((i) => String(i.id) === selectedItem);
    if (inv?.warehouse_id != null) {
      setItemWarehouse(String(inv.warehouse_id));
    } else {
      setItemWarehouse("");
    }
  }, [selectedItem, items]);

  useEffect(() => {
    if (!isEditMode || !initialOrder) return;
    setValue("customerId", String(initialOrder.customerId || ""), {
      shouldValidate: true,
    });
    setValue(
      "orderDate",
      initialOrder.orderDate
        ? format(new Date(initialOrder.orderDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
    );
    setValue(
      "invoiceDueDate",
      initialOrder.invoiceDueDate
        ? format(new Date(initialOrder.invoiceDueDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
    );
    setValue("shippingAddress", initialOrder.shippingAddress || "");
    setValue("notes", initialOrder.notes || "");

    setOrderItems(
      (initialOrder.items || []).map((item, idx) => {
        const qty = item.quantity > 0 ? item.quantity : 0.01;
        const unitPrice =
          Number.isFinite(item.unitPrice) && item.unitPrice >= 0
            ? item.unitPrice
            : 0;
        const discountPercent = Math.min(
          100,
          Math.max(0, item.discountPercent ?? item.discount ?? 0),
        );
        const lineSubtotal =
          unitPrice * qty - (unitPrice * qty * discountPercent) / 100;
        const tax = companyTaxActive
          ? lineSubtotal * (companyTaxRate / 100)
          : 0;
        return {
          ...item,
          id: item.id || `edit-${Date.now()}-${idx}`,
          orderId: initialOrder.id,
          quantity: qty,
          unitPrice,
          discountPercent,
          discount: discountPercent,
          lineSubtotal,
          taxRate: companyTaxActive ? companyTaxRate : 0,
          taxAmount: tax,
          tax,
          total: lineSubtotal + tax,
          warehouseId: item.warehouseId ? Number(item.warehouseId) : undefined,
        };
      }),
    );
  }, [initialOrder, isEditMode, setValue]);

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

  const effectiveSalesAccounts = useMemo(() => {
    if (!isEditMode || !initialOrder) return resolvedSalesAccounts;
    const bankAccountId =
      initialOrder.bankAccountId ?? resolvedSalesAccounts?.bankAccountId;
    const debitAccountId =
      initialOrder.debitAccountId ?? resolvedSalesAccounts?.debitAccountId;
    const creditAccountId =
      initialOrder.creditAccountId ?? resolvedSalesAccounts?.creditAccountId;
    if (!bankAccountId || !debitAccountId || !creditAccountId) return null;
    return { bankAccountId, debitAccountId, creditAccountId };
  }, [initialOrder, isEditMode, resolvedSalesAccounts]);

  const recomputeLine = (row: SalesOrderItem): SalesOrderItem => {
    const qty = row.quantity > 0 ? row.quantity : 0.01;
    const unitPrice =
      Number.isFinite(row.unitPrice) && row.unitPrice >= 0 ? row.unitPrice : 0;
    const rawDisc = row.discountPercent ?? row.discount ?? 0;
    const discountPct = Math.min(100, Math.max(0, rawDisc));
    const discountAmount = (unitPrice * qty * discountPct) / 100;
    const lineSubtotal = unitPrice * qty - discountAmount;
    const tax = companyTaxActive ? lineSubtotal * (companyTaxRate / 100) : 0;
    const total = lineSubtotal + tax;
    return {
      ...row,
      quantity: qty,
      unitPrice,
      discountPercent: discountPct,
      discount: discountPct,
      lineSubtotal,
      taxRate: companyTaxActive ? companyTaxRate : 0,
      taxAmount: tax,
      tax,
      total,
    };
  };

  const updateOrderLine = (
    lineId: string,
    patch: Partial<{
      quantity: number;
      unitPrice: number;
      discountPercent: number;
      warehouseId: number;
    }>,
  ) => {
    setOrderItems((prev) =>
      prev.map((row) => {
        if (row.id !== lineId) return row;
        const merged: SalesOrderItem = {
          ...row,
          ...patch,
          ...(patch.discountPercent !== undefined
            ? { discount: patch.discountPercent }
            : {}),
        };
        return recomputeLine(merged);
      }),
    );
  };

  const addItemToOrder = () => {
    if (!selectedItem || itemQuantity <= 0) return;
    const item = items.find((i) => String(i.id) === String(selectedItem));
    if (!item) return;

    const whId = itemWarehouse
      ? Number(itemWarehouse)
      : Number(item.warehouse_id ?? 0);
    if (!whId) {
      toast.error("Select a warehouse for this line.");
      return;
    }

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
        warehouseId: whId,
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
    if (!effectiveSalesAccounts) {
      return toast.error(
        "Default accounts are not loaded. Open Global Settings → Default Accounts.",
      );
    }
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
      const manualShippingAddress =
        typeof data.shippingAddress === "string"
          ? data.shippingAddress.trim()
          : "";
      const fallbackCustomerAddress = composeCustomerAddress(selectedCustomer);
      const resolvedShippingAddress =
        manualShippingAddress || fallbackCustomerAddress || undefined;
      const payloadItems = orderItems.map((it) => ({
        itemId: Number(it.itemId),
        warehouseId: Number(it.warehouseId),
        quantity: Math.round(it.quantity),
        unitPrice: it.unitPrice,
        discountPercent: it.discountPercent ?? it.discount,
        taxRate: it.taxRate ?? 0,
      }));
      if (isEditMode && initialOrder?.id) {
        const updated = await updateSalesOrder(initialOrder.id, {
          orderDate: data.orderDate,
          invoiceDueDate: data.invoiceDueDate,
          shippingAddress: resolvedShippingAddress,
          items: payloadItems,
        });
        toast.success(`Sales order ${updated.orderNo} updated successfully!`);
      } else {
        const created = await createSalesOrder({
          customerId: Number(data.customerId),
          orderDate: data.orderDate,
          invoiceDueDate: data.invoiceDueDate,
          shippingAddress: resolvedShippingAddress,
          bankAccountId: effectiveSalesAccounts.bankAccountId,
          debitAccountId: effectiveSalesAccounts.debitAccountId,
          creditAccountId: effectiveSalesAccounts.creditAccountId,
          items: payloadItems,
        });
        toast.success(`Sales order ${created.orderNo} created successfully!`);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/inventory/sales/orders", { replace: true });
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEditMode ? "update" : "create"} sales order.`,
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

  if (salesDefaultsMissing) {
    return (
      <div className="p-4 sm:p-6 max-w-lg space-y-4">
        <Card className="border-amber-200 bg-amber-50/90 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100 text-base">
              <Info className="h-5 w-5 shrink-0" />
              Set default accounts first
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900/90 dark:text-amber-100/90 space-y-3">
            <p>
              Configure sales debit, sales credit, and default bank in Global
              Settings before creating sales orders.
            </p>
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link to="/admin/default-accounts">
                Open Default Accounts (Global Settings)
              </Link>
            </Button>
            <div>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <SalesPageHeader
        title={isEditMode ? "Edit Sales Order" : "Create Sales Order"}
        description={
          isEditMode
            ? "Update draft lines, pricing, and delivery details before confirming."
            : "Add customer, lines, warehouses, and accounting defaults for a new draft order."
        }
        onBack={onCancel}
        actions={
          <Button
            size="lg"
            variant="secondary"
            className="border border-white/20 bg-white/10 text-white hover:bg-white/15"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </Button>
        }
      />

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
                  onValueChange={(value) => {
                    setValue("customerId", value, { shouldValidate: true });

                    // Auto-fill from customer profile only when address is currently empty.
                    const currentShipping = (shippingAddressValue || "").trim();
                    if (currentShipping) return;

                    const customerForSelection = customers.find(
                      (c) => String(c.id) === String(value),
                    );
                    const defaultAddress =
                      composeCustomerAddress(customerForSelection);
                    if (!defaultAddress) return;

                    setValue("shippingAddress", defaultAddress, {
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }}
                  disabled={isEditMode}
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
              <p className="text-sm text-muted-foreground md:col-span-2">
                Bank and GL accounts use your company defaults from Global
                Settings → Default Accounts.
              </p>
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
                            {item.name} - {item.sellingPrice || 0}
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
              {selectedItem && pickerStockRows.length > 0 && (
                <div className="text-sm border rounded-md p-3 bg-muted/30 space-y-2">
                  <p className="font-medium">Stock by warehouse</p>
                  <ul className="space-y-1 max-h-36 overflow-y-auto">
                    {pickerStockRows.map((r) => (
                      <li
                        key={r.warehouseId}
                        className="flex justify-between gap-4 tabular-nums"
                      >
                        <span>{r.warehouseName}</span>
                        <span>Available: {r.available}</span>
                      </li>
                    ))}
                  </ul>
                  {itemWarehouse ? (
                    <p
                      className={
                        itemQuantity >
                        (pickerStockRows.find(
                          (x) => String(x.warehouseId) === itemWarehouse,
                        )?.available ?? 0)
                          ? "text-amber-800 dark:text-amber-200"
                          : "text-muted-foreground"
                      }
                    >
                      Selected warehouse available:{" "}
                      {pickerStockRows.find(
                        (x) => String(x.warehouseId) === itemWarehouse,
                      )?.available ?? 0}
                      .{" "}
                      {itemQuantity >
                        (pickerStockRows.find(
                          (x) => String(x.warehouseId) === itemWarehouse,
                        )?.available ?? 0) &&
                        "Reduce quantity or choose a warehouse with enough stock."}
                    </p>
                  ) : null}
                </div>
              )}
              <Button type="button" onClick={addItemToOrder}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>

              {orderItems.length > 0 ? (
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead className="bg-muted/60">
                      <tr>
                        <th className="text-left p-3">Item</th>
                        <th className="text-right p-3 w-28">Qty</th>
                        <th className="text-right p-3 w-32">Unit price</th>
                        <th className="text-right p-3 w-24">Disc %</th>
                        <th className="text-left p-3 min-w-[140px]">
                          Warehouse
                        </th>
                        <th className="text-right p-3 w-32">Line total</th>
                        <th className="text-left p-3 w-24" />
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-3 align-middle">
                            {item.item?.name ?? item.itemName}
                          </td>
                          <td className="p-3 align-middle">
                            <Input
                              type="number"
                              min={0.01}
                              step={0.01}
                              className="text-right h-9 tabular-nums"
                              value={item.quantity}
                              onChange={(e) =>
                                updateOrderLine(item.id, {
                                  quantity: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="p-3 align-middle">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              className="text-right h-9 tabular-nums"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateOrderLine(item.id, {
                                  unitPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="p-3 align-middle">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              className="text-right h-9 tabular-nums"
                              value={item.discountPercent ?? item.discount}
                              onChange={(e) =>
                                updateOrderLine(item.id, {
                                  discountPercent:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="p-3 align-middle">
                            <Select
                              value={
                                item.warehouseId ? String(item.warehouseId) : ""
                              }
                              onValueChange={(value) =>
                                updateOrderLine(item.id, {
                                  warehouseId: Number(value),
                                })
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Warehouse" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses
                                  .filter((wh) => wh.status === "active")
                                  .map((wh) => (
                                    <SelectItem
                                      key={wh.id}
                                      value={String(wh.id)}
                                    >
                                      {wh.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 text-right font-medium align-middle tabular-nums">
                            <CurrencyAmount amount={item.total} />
                          </td>
                          <td className="p-3 align-middle">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
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
                <span>
                  <CurrencyAmount amount={totals.subtotal} />
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span>
                  -<CurrencyAmount amount={totals.discount} />
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>
                  <CurrencyAmount amount={totals.tax} />
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {companyTaxActive
                  ? `Tax is applied at company rate (${companyTaxRate}%).`
                  : "Tax is disabled at company level."}
              </p>
              <div className="flex justify-between text-base font-semibold border-t pt-3">
                <span>Total</span>
                <span>
                  <CurrencyAmount amount={totals.total} />
                </span>
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
                {submitLoading
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Sales Order"}
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
