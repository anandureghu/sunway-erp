import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/service/apiClient";
import type { SalesOrderResponseDTO } from "@/service/erpApiTypes";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const SalesOrdersDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [so, setSo] = useState<SalesOrderResponseDTO | null>(null);

  const updateStatus = async (action: "confirm" | "cancel") => {
    if (!so) return;

    try {
      await apiClient.post(`/sales/orders/${so.id}/${action}`);
      const { data } = await apiClient.get<SalesOrderResponseDTO>(
        `/sales/orders/${so.id}`
      );
      setSo(data);
    } catch (error) {
      console.error("Status update failed", error);
    }
  };

  useEffect(() => {
    apiClient
      .get<SalesOrderResponseDTO>(`/sales/orders/${id}`)
      .then(({ data }) => setSo(data));
  }, [id]);

  if (!so) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Button variant="secondary" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Sales Order #{so.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            Order Date: {so.orderDate}
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {so.status}
        </Badge>
      </div>

      <div className="flex gap-2">
        {so.status !== "CONFIRMED" && so.status !== "CANCELLED" && (
          <>
            <Button onClick={() => updateStatus("confirm")}>Confirm</Button>

            <Button
              variant="destructive"
              onClick={() => updateStatus("cancel")}
            >
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{so.customerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{so.customerEmail}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{so.customerPhone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Order Number</p>
              <p className="font-medium">{so.orderNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{so.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Amount</p>
              <p className="font-semibold">₹ {so.totalAmount?.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {so.items?.map((item) => (
                  <tr key={item.itemId} className="border-t">
                    <td className="px-3 py-2">{item.itemName}</td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">
                      ₹ {item.unitPrice?.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      ₹ {item.lineTotal?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Separator className="my-4" />

          {/* Summary */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">
                  ₹ {so.totalAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesOrdersDetailPage;
