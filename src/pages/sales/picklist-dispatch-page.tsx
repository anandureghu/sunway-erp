/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Truck, Plus, ArrowLeft } from "lucide-react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import { toast } from "sonner";
import type { Dispatch, Picklist, SalesOrder } from "@/types/sales";
import {
  createDispatchColumns,
  createPicklistColumns,
} from "@/lib/columns/sales-columns";
import {
  attachOrderAndItems,
  cancelPicklist,
  cancelShipment,
  dispatchShipment,
  listPicklists,
  listSalesOrders,
  listShipmentsAsDispatches,
  markPicklistPicked,
  markShipmentDelivered,
  markShipmentInTransit,
} from "@/service/salesFlowService";
import { listItems } from "@/service/inventoryService";
import { CreateDispatchForm } from "./components/create-dispatch-form";
import { CreatePicklistForm } from "./components/create-picklist-form";

export default function PicklistDispatchPage() {
  const [activeTab, setActiveTab] = useState("picklists");
  const [showCreatePicklist, setShowCreatePicklist] = useState(false);
  const [showCreateDispatch, setShowCreateDispatch] = useState(false);
  const [picklists, setPicklists] = useState<Picklist[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [orders, pls, shps, items] = await Promise.all([
        listSalesOrders(),
        listPicklists(),
        listShipmentsAsDispatches(),
        listItems(),
      ]);
      const { picklistsEnriched, dispatchesEnriched } = attachOrderAndItems(
        orders,
        pls,
        shps,
        items,
      );
      setSalesOrders(orders);
      setPicklists(picklistsEnriched);
      setDispatches(dispatchesEnriched);
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || "Failed to load data";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const picklistColumns = useMemo(
    () =>
      createPicklistColumns(
        async (id) => {
          try {
            await markPicklistPicked(id);
            toast.success("Picklist marked as picked");
            await loadData();
          } catch (e: any) {
            toast.error(e?.message || "Failed to update picklist");
          }
        },
        async (id) => {
          if (!confirm("Are you sure you want to cancel this picklist?")) return;
          try {
            await cancelPicklist(id);
            toast.success("Picklist cancelled");
            await loadData();
          } catch (e: any) {
            toast.error(e?.message || "Failed to cancel picklist");
          }
        },
        () => setShowCreateDispatch(true),
      ),
    [loadData],
  );

  const dispatchColumns = useMemo(
    () =>
      createDispatchColumns(
        async (id) => {
          await dispatchShipment(id);
          await loadData();
        },
        async (id) => {
          await markShipmentInTransit(id);
          await loadData();
        },
        async (id) => {
          await markShipmentDelivered(id);
          await loadData();
        },
        async (id) => {
          if (!confirm("Are you sure you want to cancel this shipment?")) return;
          await cancelShipment(id);
          await loadData();
        },
      ),
    [loadData],
  );

  if (showCreatePicklist) {
    return (
      <CreatePicklistForm
        salesOrders={salesOrders}
        onCancel={() => setShowCreatePicklist(false)}
        onCreated={loadData}
      />
    );
  }

  if (showCreateDispatch) {
    return (
      <CreateDispatchForm
        picklists={picklists}
        onCancel={() => setShowCreateDispatch(false)}
        onCreated={loadData}
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
            <h1 className="text-3xl font-bold mb-2">Picklist & Dispatch</h1>
            <p className="text-muted-foreground">Generate picklists and plan dispatches</p>
          </div>
        </div>
        {activeTab === "picklists" ? (
          <Button onClick={() => setShowCreatePicklist(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Picklist
          </Button>
        ) : (
          <Button onClick={() => setShowCreateDispatch(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Dispatch
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <StyledTabsTrigger value="picklists">
            <Package className="mr-2 h-4 w-4" />
            Picklists
          </StyledTabsTrigger>
          <StyledTabsTrigger value="dispatches">
            <Truck className="mr-2 h-4 w-4" />
            Dispatches
          </StyledTabsTrigger>
        </TabsList>

        <TabsContent value="picklists">
          <Card>
            <CardHeader>
              <CardTitle>All Picklists</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">Loading picklists...</div>
              ) : loadError ? (
                <div className="py-10 text-center text-red-600">{loadError}</div>
              ) : (
                <DataTable
                  columns={picklistColumns}
                  data={picklists}
                  onRowClick={(row) => navigate(`/inventory/sales/picklist/${row.original.id}`)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispatches">
          <Card>
            <CardHeader>
              <CardTitle>All Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-muted-foreground">Loading shipments...</div>
              ) : loadError ? (
                <div className="py-10 text-center text-red-600">{loadError}</div>
              ) : (
                <DataTable columns={dispatchColumns} data={dispatches} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
