/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Package, Truck, Plus, ClipboardList, Radar } from "lucide-react";
import { DataTable } from "@/components/datatable";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import { toast } from "sonner";
import type { RowSelectionState } from "@tanstack/react-table";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import type { Dispatch, Picklist, SalesOrder } from "@/types/sales";
import {
  createDispatchColumns,
  createPicklistColumns,
} from "@/lib/columns/sales-columns";
import {
  attachOrderAndItems,
  archivePicklist,
  cancelPicklist,
  cancelShipment,
  dispatchShipment,
  listPicklists,
  listSalesOrders,
  listShipmentsAsDispatches,
  markPicklistPicked,
  markShipmentDelivered,
  markShipmentFailedDelivery,
  markShipmentInTransit,
  markShipmentOutForDelivery,
} from "@/service/salesFlowService";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import { listItems } from "@/service/inventoryService";
import { CreateDispatchForm } from "./components/create-dispatch-form";
import { CreatePicklistForm } from "./components/create-picklist-form";
import { PageHeader } from "@/components/PageHeader";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";

export default function PicklistDispatchPage() {
  const { confirm, confirmCancel } = useConfirmDialog();
  const location = useLocation();
  const navState =
    (location.state as {
      salesOrderId?: string;
      initialPicklistId?: string;
      openCreateDispatch?: boolean;
      activeTab?: "picklists" | "dispatches";
    } | null) ?? null;
  const [activeTab, setActiveTab] = useState("picklists");
  const [showCreatePicklist, setShowCreatePicklist] = useState(
    Boolean(navState?.salesOrderId),
  );
  const [showCreateDispatch, setShowCreateDispatch] = useState(
    Boolean(navState?.openCreateDispatch),
  );
  const [initialPicklistId, setInitialPicklistId] = useState(
    navState?.initialPicklistId || "",
  );
  const [picklists, setPicklists] = useState<Picklist[]>([]);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [picklistStatusFilter, setPicklistStatusFilter] = useState<
    "all" | "created" | "picked"
  >("all");
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState<
    "all" | "active"
  >("all");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [archivingPicklistId, setArchivingPicklistId] = useState<
    string | null
  >(null);
  const navigate = useNavigate();
  const initialSalesOrderId = navState?.salesOrderId || "";

  useEffect(() => {
    if (navState?.activeTab) {
      setActiveTab(navState.activeTab);
    }
    if (navState?.initialPicklistId) {
      setInitialPicklistId(navState.initialPicklistId);
    }
    if (navState?.openCreateDispatch) {
      setShowCreateDispatch(true);
      setShowCreatePicklist(false);
    }
  }, [
    navState?.activeTab,
    navState?.initialPicklistId,
    navState?.openCreateDispatch,
  ]);

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
      const message =
        e?.response?.data?.message || e?.message || "Failed to load data";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleArchivePicklist = useCallback(
    async (id: string) => {
      const picklist = picklists.find((p) => p.id === id);
      const label = picklist?.picklistNo || id;
      if (!(await confirm(`Archive picklist ${label}?`))) return;
      setArchivingPicklistId(id);
      try {
        await archivePicklist(id);
        toast.success("Picklist archived successfully");
        await loadData();
      } catch (e: any) {
        toast.error(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to archive picklist",
        );
      } finally {
        setArchivingPicklistId(null);
      }
    },
    [picklists, confirm, loadData],
  );

  const selectedPicklistIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => Number(id))
        .filter((id) => !Number.isNaN(id)),
    [rowSelection],
  );

  const handleBulkArchivePicklists = useCallback(async () => {
    if (selectedPicklistIds.length === 0) return;
    if (
      !(await confirm(
        `Archive ${selectedPicklistIds.length} selected picklist(s)? They will move to Operations and management Reports → History.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const result = await bulkArchiveHistoryRecords(
        "PICKLIST",
        selectedPicklistIds,
      );
      toast.success(summarizeBulkActionResult(result));
      setRowSelection({});
      await loadData();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to archive selected picklists.",
      );
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, loadData, selectedPicklistIds]);

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
          const picklist = picklists.find((p) => p.id === id);
          const label = picklist?.picklistNo || id;
          if (!(await confirmCancel(`picklist ${label}`))) return;
          try {
            await cancelPicklist(id);
            toast.success("Picklist cancelled");
            await loadData();
          } catch (e: any) {
            toast.error(e?.message || "Failed to cancel picklist");
          }
        },
        (id) => {
          setInitialPicklistId(id);
          setShowCreateDispatch(true);
        },
        handleArchivePicklist,
        archivingPicklistId,
      ),
    [
      loadData,
      picklists,
      confirmCancel,
      handleArchivePicklist,
      archivingPicklistId,
    ],
  );

  const dispatchColumns = useMemo(
    () =>
      createDispatchColumns(
        (id) => {
          navigate(`/inventory/sales/tracking?dispatchId=${id}`);
        },
        async (id) => {
          await dispatchShipment(id);
          await loadData();
        },
        async (id) => {
          await markShipmentInTransit(id);
          await loadData();
        },
        async (id) => {
          await markShipmentOutForDelivery(id);
          await loadData();
        },
        async (id) => {
          await markShipmentDelivered(id);
          await loadData();
        },
        async (id) => {
          await markShipmentFailedDelivery(
            id,
            "Marked failed from dispatch screen",
          );
          await loadData();
        },
        async (id) => {
          const shipment = dispatches.find((d) => d.id === id);
          const label = shipment?.dispatchNo || id;
          if (!(await confirmCancel(`shipment ${label}`))) return;
          try {
            await cancelShipment(id);
            toast.success("Shipment cancelled");
            await loadData();
          } catch (e: any) {
            toast.error(e?.message || "Failed to cancel shipment");
          }
        },
        (id) => {
          navigate(`/inventory/sales/tracking?dispatchId=${id}`);
        },
      ),
    [loadData, navigate, dispatches, confirmCancel],
  );

  const filteredPicklists = useMemo(() => {
    if (picklistStatusFilter === "created") {
      return picklists.filter((p) => p.status === "created");
    }
    if (picklistStatusFilter === "picked") {
      return picklists.filter((p) => p.status === "picked");
    }
    return picklists;
  }, [picklists, picklistStatusFilter]);

  const filteredDispatches = useMemo(() => {
    if (dispatchStatusFilter === "active") {
      return dispatches.filter(
        (d) => !["delivered", "cancelled", "failed_delivery"].includes(d.status),
      );
    }
    return dispatches;
  }, [dispatches, dispatchStatusFilter]);

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    setRowSelection({});
    switch (key) {
      case "awaiting":
        setActiveTab("picklists");
        setPicklistStatusFilter("created");
        break;
      case "picked":
        setActiveTab("picklists");
        setPicklistStatusFilter("picked");
        break;
      case "active":
        setActiveTab("dispatches");
        setDispatchStatusFilter("active");
        break;
      default:
        setActiveTab("picklists");
        setPicklistStatusFilter("all");
        setDispatchStatusFilter("all");
        break;
    }
  }, []);

  const fulfillmentKpis = useMemo((): KpiSummaryStat[] => {
    const awaitingPick = picklists.filter((p) => p.status === "created").length;
    const pickedReady = picklists.filter((p) => p.status === "picked").length;
    const shipmentsTotal = dispatches.length;
    const activeShipments = dispatches.filter(
      (d) => !["delivered", "cancelled", "failed_delivery"].includes(d.status),
    ).length;
    return [
      kpiFilterItem(
        {
          label: "Picklists",
          value: picklists.length,
          hint: "Warehouse documents",
          accent: "sky",
          icon: ClipboardList,
        },
        "all",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Awaiting pick",
          value: awaitingPick,
          hint: "Still in CREATED status",
          accent: "orange",
          icon: Package,
        },
        "awaiting",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Picked ready",
          value: pickedReady,
          hint: "Eligible for shipment",
          accent: "emerald",
          icon: Truck,
        },
        "picked",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Active shipments",
          value: activeShipments,
          hint: `${shipmentsTotal} total · in-flight logistics`,
          accent: "violet",
          icon: Radar,
        },
        "active",
        kpiFilter,
        applyKpiFilter,
      ),
    ];
  }, [picklists, dispatches, kpiFilter, applyKpiFilter]);

  if (showCreatePicklist) {
    return (
      <CreatePicklistForm
        salesOrders={salesOrders}
        picklists={picklists}
        initialSalesOrderId={initialSalesOrderId}
        onCancel={() => setShowCreatePicklist(false)}
        onCreated={loadData}
      />
    );
  }

  if (showCreateDispatch) {
    return (
      <CreateDispatchForm
        picklists={picklists}
        initialPicklistId={initialPicklistId}
        onCancel={() => {
          setShowCreateDispatch(false);
          setInitialPicklistId("");
        }}
        onCreated={loadData}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Picklist & Dispatch"
        description="Generate warehouse picklists from paid orders and create shipments when lines are picked."
        backHref="/inventory/sales"
        variant="darkBlue"
        actions={
          activeTab === "picklists" ? (
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-white/90"
              onClick={() => setShowCreatePicklist(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate Picklist
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-white/90"
              onClick={() => {
                setInitialPicklistId("");
                setShowCreateDispatch(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Dispatch
            </Button>
          )
        }
      />

      {!loading && !loadError ? (
        <KpiSummaryStrip items={fulfillmentKpis} />
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          setKpiFilter(null);
          setPicklistStatusFilter("all");
          setDispatchStatusFilter("all");
          setRowSelection({});
        }}
      >
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
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading picklists...
            </div>
          ) : loadError ? (
            <div className="py-10 text-center text-red-600">{loadError}</div>
          ) : (
            <div className="space-y-4">
              <BulkActionBar
                selectedCount={selectedPicklistIds.length}
                onArchive={handleBulkArchivePicklists}
                onClear={() => setRowSelection({})}
                archiving={bulkArchiving}
              />
              <SelectableDataTable
                columns={picklistColumns}
                data={filteredPicklists}
                onRowClick={(row) =>
                  navigate(`/inventory/sales/picklist/${row.original.id}`)
                }
                enableRowSelection
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                getRowId={(row) => row.id}
                isRowSelectable={(row) =>
                  !row.archived &&
                  (row.status === "picked" || row.status === "cancelled")
                }
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="dispatches">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading shipments...
            </div>
          ) : loadError ? (
            <div className="py-10 text-center text-red-600">{loadError}</div>
          ) : (
            <DataTable columns={dispatchColumns} data={filteredDispatches} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
