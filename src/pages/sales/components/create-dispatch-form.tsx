/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
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
import { createShipmentFromPicklist } from "@/service/salesFlowService";
import type { Picklist } from "@/types/sales";

type Props = {
  onCancel: () => void;
  picklists: Picklist[];
  onCreated: () => Promise<void>;
};

export function CreateDispatchForm({ onCancel, picklists, onCreated }: Props) {
  const [selectedPicklistId, setSelectedPicklistId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DispatchFormData>({
    resolver: zodResolver(DISPATCH_SCHEMA),
  });

  const onSubmit = async (data: DispatchFormData) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await createShipmentFromPicklist(selectedPicklistId, {
        carrierName: data.notes || data.driverName || "",
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
        err?.response?.data?.message || err?.message || "Failed to create shipment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Create Dispatch</h1>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <p className="text-sm text-red-500">{errors.picklistId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                <Input id="deliveryAddress" {...register("deliveryAddress")} />
              </div>
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
