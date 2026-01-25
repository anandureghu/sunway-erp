import { apiClient } from "@/service/apiClient";
import { type PicklistResponseDTO } from "@/service/erpApiTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PicklistDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [picklist, setPicklist] = useState<PicklistResponseDTO | null>(null);

  useEffect(() => {
    apiClient
      .get<PicklistResponseDTO>(`/warehouse/picklists/${id}`)
      .then(({ data }) => setPicklist(data));
  }, [id]);

  if (!picklist) {
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
            Picklist #{picklist.picklistNumber}
          </h1>
          {picklist.createdAt && (
            <p className="text-sm text-muted-foreground">
              Created at {new Date(picklist.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <Badge variant="outline" className="capitalize">
          {picklist.status}
        </Badge>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Picklist Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Picklist Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Picklist Number</p>
              <p className="font-medium">{picklist.picklistNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{picklist.status}</p>
            </div>
          </CardContent>
        </Card>

        {/* Linked Order */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Sales Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Sales Order ID</p>
              <p className="font-medium">#{picklist.salesOrderId}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items to Pick</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-right">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {picklist.items && picklist.items.length > 0 ? (
                  picklist.items.map((item) => (
                    <tr key={item.itemId} className="border-t">
                      <td className="px-3 py-2">{item.itemName}</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {item.quantity}
                      </td>
                    </tr>
                  ))
                ) : (
                  <p>no items added to picklist</p>
                )}
              </tbody>
            </table>
          </div>

          <Separator className="my-4" />

          {/* Summary */}
          <div className="flex justify-end">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Items: </span>
              <span className="font-semibold">
                {picklist.items?.length || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PicklistDetailPage;
