/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PhoneInput from "@/components/PhoneInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISPATCH_SCHEMA, type DispatchFormData } from "@/schema/sales";
import {
  createShipmentFromPicklist,
  getSalesOrderById,
} from "@/service/salesFlowService";
import { listActiveCarriersForDispatch } from "@/service/inventoryService";
import { listCustomers } from "@/service/customerService";
import type { DispatchCarrier } from "@/types/inventory";
import type { Picklist } from "@/types/sales";
import { SalesPageHeader } from "./sales-page-header";

type Props = {
  onCancel: () => void;
  picklists: Picklist[];
  initialPicklistId?: string;
  onCreated: () => Promise<void>;
};

export function CreateDispatchForm({
  onCancel,
  picklists,
  initialPicklistId,
  onCreated,
}: Props) {
  const [selectedPicklistId, setSelectedPicklistId] = useState(
    initialPicklistId || "",
  );
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const [carriers, setCarriers] = useState<DispatchCarrier[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<DispatchFormData>({
    resolver: zodResolver(DISPATCH_SCHEMA),
  });

  const selectedPicklist = useMemo(
    () => picklists.find((pl) => pl.id === selectedPicklistId),
    [picklists, selectedPicklistId],
  );

  useEffect(() => {
    void listActiveCarriersForDispatch()
      .then(setCarriers)
      .catch(() => setCarriers([]));
  }, []);

  useEffect(() => {
    if (!initialPicklistId) return;
    setSelectedPicklistId(initialPicklistId);
    setValue("picklistId", initialPicklistId, { shouldValidate: true });
  }, [initialPicklistId, setValue]);

  useEffect(() => {
    if (!selectedPicklist) return;
    let cancelled = false;
    const hydrateDispatchDefaults = async () => {
      const order = selectedPicklist.order;
      setValue("picklistId", selectedPicklist.id, { shouldValidate: true });
      setValue("orderId", selectedPicklist.orderId || "");

      const currentTypedAddress = (getValues("deliveryAddress") || "").trim();
      const currentCustomerPhone = (getValues("customerPhone") || "").trim();

      let preferredAddress = (order?.shippingAddress || "").trim();
      let customerPhone = (order?.customerPhone || "").trim();

      if ((!preferredAddress || !customerPhone) && selectedPicklist.orderId) {
        try {
          const fullOrder = await getSalesOrderById(selectedPicklist.orderId);
          if (!preferredAddress) {
            preferredAddress = (fullOrder.shippingAddress || "").trim();
          }
          if (!customerPhone) {
            customerPhone = (fullOrder.customerPhone || "").trim();
          }
          if (!preferredAddress && fullOrder.customerId) {
            const customers = await listCustomers();
            const customer = customers.find(
              (c) => String(c.id) === String(fullOrder.customerId),
            );
            preferredAddress = [
              customer?.address,
              customer?.city,
              customer?.state,
              customer?.country,
              customer?.postalCode,
            ]
              .filter(Boolean)
              .join(", ")
              .trim();
            if (!customerPhone) {
              customerPhone = (customer?.phone || "").trim();
            }
          }
        } catch {
          // Keep form usable even if enrichment request fails.
        }
      }

      if (!cancelled) {
        if (!currentTypedAddress && preferredAddress) {
          setValue("deliveryAddress", preferredAddress);
        }
        if (!currentCustomerPhone && customerPhone) {
          setValue("customerPhone", customerPhone);
        }
      }
    };
    void hydrateDispatchDefaults();
    return () => {
      cancelled = true;
    };
  }, [getValues, selectedPicklist, setValue]);

  const applyCarrierPreset = (carrierId: string) => {
    setSelectedCarrierId(carrierId);
    if (!carrierId || carrierId === "manual") {
      return;
    }
    const carrier = carriers.find((c) => c.id === carrierId);
    if (!carrier) return;
    setValue("carrierName", carrier.name);
    setValue("vehicleNumber", carrier.vehicleNumber || "");
    setValue("driverName", carrier.driverName || "");
    setValue("driverPhone", carrier.driverPhone || "");
    setValue("notes", carrier.comments || "");
  };

  const onSubmit = async (data: DispatchFormData) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await createShipmentFromPicklist(selectedPicklistId, {
        carrierName: data.carrierName || "",
        trackingNumber: data.trackingNumber || "",
        vehicleNumber: data.vehicleNumber || undefined,
        driverName: data.driverName || undefined,
        driverPhone: data.driverPhone || undefined,
        customerPhone: data.customerPhone || undefined,
        estimatedDeliveryDate: data.estimatedDeliveryDate || undefined,
        deliveryAddress: data.deliveryAddress || undefined,
        notes: data.notes || undefined,
      });
      toast.success("Shipment created successfully!");
      await onCreated();
      onCancel();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create shipment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <SalesPageHeader
        title="Create Dispatch"
        description="Turn a picked picklist into a shipment. Select a saved carrier to prefill driver and comment details."
        backHref="/inventory/sales"
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dispatch information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPicklist?.order && (
              <div className="rounded-xl border bg-slate-50/80 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Order:</span>{" "}
                  {selectedPicklist.order.orderNo || "-"}
                </p>
                <p>
                  <span className="text-muted-foreground">Customer:</span>{" "}
                  {selectedPicklist.order.customerName || "-"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="picklistId">Picklist *</Label>
                <Select
                  value={selectedPicklistId}
                  onValueChange={(value) => {
                    setSelectedPicklistId(value);
                    setValue("picklistId", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select picklist" />
                  </SelectTrigger>
                  <SelectContent>
                    {picklists
                      .filter((pl) => pl.status === "picked")
                      .map((pl) => (
                        <SelectItem key={pl.id} value={pl.id}>
                          {pl.picklistNo}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.picklistId && (
                  <p className="text-sm text-red-500">
                    {errors.picklistId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Saved carrier</Label>
                <Select
                  value={selectedCarrierId || "manual"}
                  onValueChange={applyCarrierPreset}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Enter manually</SelectItem>
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="deliveryAddress">Delivery address *</Label>
                <Input id="deliveryAddress" {...register("deliveryAddress")} />
                {errors.deliveryAddress && (
                  <p className="text-sm text-red-500">
                    {errors.deliveryAddress.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer phone</Label>
                <Controller
                  name="customerPhone"
                  control={control}
                  render={({ field, fieldState }) => (
                    <PhoneInput
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      invalid={!!fieldState.error}
                    />
                  )}
                />
                {errors.customerPhone && (
                  <p className="text-sm text-rose-600">
                    {errors.customerPhone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryDate">
                  Estimated delivery date
                </Label>
                <Input
                  id="estimatedDeliveryDate"
                  type="date"
                  {...register("estimatedDeliveryDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrierName">Carrier name</Label>
                <Input id="carrierName" {...register("carrierName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking number</Label>
                <Input id="trackingNumber" {...register("trackingNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle number</Label>
                <Input id="vehicleNumber" {...register("vehicleNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverName">Driver name</Label>
                <Input id="driverName" {...register("driverName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverPhone">Driver phone</Label>
                <Controller
                  name="driverPhone"
                  control={control}
                  render={({ field, fieldState }) => (
                    <PhoneInput
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      invalid={!!fieldState.error}
                    />
                  )}
                />
                {errors.driverPhone && (
                  <p className="text-sm text-rose-600">
                    {errors.driverPhone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / comments</Label>
              <Textarea
                id="notes"
                className="min-h-[100px]"
                placeholder="Dispatch comments"
                {...register("notes")}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedPicklistId || submitting}>
            {submitting ? "Creating..." : "Create dispatch"}
          </Button>
        </div>
      </form>
    </div>
  );
}
