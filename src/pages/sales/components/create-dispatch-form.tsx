/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { DISPATCH_SCHEMA, type DispatchFormData } from "@/schema/sales";
import {
  createShipmentFromPicklist,
  getSalesOrderById,
} from "@/service/salesFlowService";
import { listCustomers } from "@/service/customerService";
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
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
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
      if (currentTypedAddress) return;

      let preferredAddress = (order?.shippingAddress || "").trim();
      if (!preferredAddress && selectedPicklist.orderId) {
        try {
          const fullOrder = await getSalesOrderById(selectedPicklist.orderId);
          preferredAddress = (fullOrder.shippingAddress || "").trim();
          if (!preferredAddress && fullOrder.customerId) {
            const customers = await listCustomers();
            const customer = customers.find(
              (c) => c.id === fullOrder.customerId,
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
          }
        } catch {
          // Keep form usable even if enrichment request fails.
        }
      }
      if (!cancelled && preferredAddress) {
        setValue("deliveryAddress", preferredAddress);
      }
      if (!cancelled) {
        setValue(
          "notes",
          [order?.customerName, order?.customerPhone]
            .filter(Boolean)
            .join(" | "),
        );
      }
    };
    void hydrateDispatchDefaults();
    return () => {
      cancelled = true;
    };
  }, [getValues, selectedPicklist, setValue]);

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
        description="Turn a picked picklist into a shipment with carrier, tracking, and delivery details."
        backHref="/inventory/sales/picklist"
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
            <CardTitle>Dispatch Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPicklist?.order && (
              <div className="rounded-md border p-3 text-sm">
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
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Input id="deliveryAddress" {...register("deliveryAddress")} />
                {errors.deliveryAddress && (
                  <p className="text-sm text-red-500">
                    {errors.deliveryAddress.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrierName">Carrier Name</Label>
                <Input id="carrierName" {...register("carrierName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input id="trackingNumber" {...register("trackingNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input id="vehicleNumber" {...register("vehicleNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverName">Driver Name</Label>
                <Input id="driverName" {...register("driverName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverPhone">Driver Phone</Label>
                <Input id="driverPhone" {...register("driverPhone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryDate">
                  Estimated Delivery Date
                </Label>
                <Input
                  id="estimatedDeliveryDate"
                  type="date"
                  {...register("estimatedDeliveryDate")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" {...register("notes")} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!selectedPicklistId || submitting}>
            {submitting ? "Creating..." : "Create Dispatch"}
          </Button>
        </div>
      </form>
    </div>
  );
}
