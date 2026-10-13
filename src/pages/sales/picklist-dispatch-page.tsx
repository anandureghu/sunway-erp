/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  Plus,
  ClipboardList,
  Radar,
  Search,
} from "lucide-react";
import { DataTable } from "@/components/datatable";
import { SelectableDataTable } from "@/components/selectable-data-table";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  archivePicklist,
  cancelPicklist,
  cancelShipment,
  dispatchShipment,
  listPicklists,
  listPicklistsPaged,
  listSalesOrders,
  listShipmentsPaged,
  markPicklistPicked,
  markShipmentFailedDelivery,
  markShipmentInTransit,
  markShipmentOutForDelivery,
} from "@/service/salesFlowService";
import {
  bulkArchiveHistoryRecords,
  summarizeBulkActionResult,
} from "@/service/historyService";
import { CreateDispatchForm } from "./components/create-dispatch-form";
import { CreatePicklistForm } from "./components/create-picklist-form";
import { PageHeader } from "@/components/PageHeader";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import { excludeArchived } from "@/lib/exclude-archived";

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
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [allPicklistsForForms, setAllPicklistsForForms] = useState<Picklist[]>(
    [],
  );
  const [picklistStatusFilter, setPicklistStatusFilter] = useState<
    "all" | "created" | "picked"
  >("all");
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState<
    "all" | "active"
  >("all");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [archivingDispatchId, setArchivingDispatchId] = useState<string | null>(
    null,
  );
  const [kpiCounts, setKpiCounts] = useState({
    picklists: 0,
    awaiting: 0,
    picked: 0,
    activeShipments: 0,
  });
  const navigate = useNavigate();
  const initialSalesOrderId = navState?.salesOrderId || "";

  useEffect(() => {
    if (navState?.activeTab) setActiveTab(navState.activeTab);
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

  const picklistFilters = useMemo(
    () => ({
      status: picklistStatusFilter,
      excludeDispatched: true,
    }),
    [picklistStatusFilter],
  );

  const fetchPicklists = useCallback(
    (params: {
      page: number;
      size: number;
      search: string;
      status: string;
      excludeDispatched: boolean;
    }) =>
      listPicklistsPaged({
        page: params.page,
        size: params.size,
        search: params.search,
        status: params.status,
        excludeDispatched: params.excludeDispatched,
      }),
    [],
  );

  const {
    rows: picklists,
    loading: picklistsLoading,
    searchInput: picklistSearch,
    setSearchInput: setPicklistSearch,
    page: picklistPage,
    setPage: setPicklistPage,
    pageSize: picklistPageSize,
    setPageSize: setPicklistPageSize,
    totalElements: picklistTotal,
    pageCount: picklistPageCount,
    reload: reloadPicklists,
  } = useServerPagedList<
    Picklist,
    { status: string; excludeDispatched: boolean }
  >({
    fetcher: fetchPicklists,
    filters: picklistFilters,
    enabled: activeTab === "picklists" && !showCreatePicklist && !showCreateDispatch,
    errorMessage: "Failed to load picklists",
  });

  const dispatchFilters = useMemo(
    () => ({ status: dispatchStatusFilter }),
    [dispatchStatusFilter],
  );

  const fetchDispatches = useCallback(
    (params: {
      page: number;
      size: number;
      search: string;
      status: string;
    }) =>
      listShipmentsPaged({
        page: params.page,
        size: params.size,
        search: params.search,
        status: params.status,
      }),
    [],
  );

  const {
    rows: dispatches,
    loading: dispatchesLoading,
    searchInput: dispatchSearch,
    setSearchInput: setDispatchSearch,
    page: dispatchPage,
    setPage: setDispatchPage,
    pageSize: dispatchPageSize,
    setPageSize: setDispatchPageSize,
    totalElements: dispatchTotal,
    pageCount: dispatchPageCount,
    reload: reloadDispatches,
  } = useServerPagedList<Dispatch, { status: string }>({
    fetcher: fetchDispatches,
    filters: dispatchFilters,
    enabled: activeTab === "dispatches" && !showCreatePicklist && !showCreateDispatch,
    errorMessage: "Failed to load shipments",
  });

  const reload = useCallback(() => {
    reloadPicklists();
    reloadDispatches();
  }, [reloadPicklists, reloadDispatches]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allPl, created, picked, activeShp] = await Promise.all([
          listPicklistsPaged({
            page: 0,
            size: 1,
            excludeDispatched: true,
          }),
          listPicklistsPaged({
            page: 0,
            size: 1,
            status: "created",
            excludeDispatched: true,
          }),
          listPicklistsPaged({
            page: 0,
            size: 1,
            status: "picked",
            excludeDispatched: true,
          }),
          listShipmentsPaged({ page: 0, size: 1, status: "active" }),
        ]);
        if (cancelled) return;
        setKpiCounts({
          picklists: allPl.totalElements,
          awaiting: created.totalElements,
          picked: picked.totalElements,
          activeShipments: activeShp.totalElements,
        });
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const loadFormData = useCallback(async () => {
    const [orders, pls] = await Promise.all([
      listSalesOrders(),
      listPicklists(),
    ]);
    setSalesOrders(orders);
    setAllPicklistsForForms(pls);
  }, []);

  useEffect(() => {
    if (showCreatePicklist || showCreateDispatch) {
      void loadFormData();
    }
  }, [showCreatePicklist, showCreateDispatch, loadFormData]);

  const handleArchiveDispatch = useCallback(
    async (id: string) => {
      const dispatch = dispatches.find((d) => d.id === id);
      if (!dispatch?.picklistId) {
        return toast.error("No linked picklist to archive for this dispatch.");
      }
      if (dispatch.status !== "delivered") {
        return toast.error("Only delivered dispatches can be archived.");
      }
      if (dispatch.archived) {
        return toast.error("Dispatch is already archived.");
      }
      const label = dispatch.dispatchNo || id;
      if (!(await confirm(`Archive dispatch ${label}?`))) return;
      setArchivingDispatchId(id);
      try {
        await archivePicklist(dispatch.picklistId);
        toast.success("Dispatch archived successfully");
        reload();
      } catch (e: any) {
        toast.error(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to archive dispatch",
        );
      } finally {
        setArchivingDispatchId(null);
      }
    },
    [dispatches, confirm, reload],
  );

  const selectedDispatchIds = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => id),
    [rowSelection],
  );

  const selectedPicklistIdsForArchive = useMemo(() => {
    const ids = selectedDispatchIds
      .map((dispatchId) => {
        const dispatch = dispatches.find((d) => d.id === dispatchId);
        return dispatch?.picklistId ? Number(dispatch.picklistId) : NaN;
      })
      .filter((id) => !Number.isNaN(id));
    return Array.from(new Set(ids));
  }, [selectedDispatchIds, dispatches]);

  const handleBulkArchiveDispatches = useCallback(async () => {
    if (selectedPicklistIdsForArchive.length === 0) return;
    if (
      !(await confirm(
        `Archive ${selectedPicklistIdsForArchive.length} selected dispatch(es)? They will move to Operations and management Reports → History.`,
      ))
    ) {
      return;
    }
    setBulkArchiving(true);
    try {
      const result = await bulkArchiveHistoryRecords(
        "PICKLIST",
        selectedPicklistIdsForArchive,
      );
      toast.success(summarizeBulkActionResult(result));
      setRowSelection({});
      reload();
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to archive selected dispatches.",
      );
    } finally {
      setBulkArchiving(false);
    }
  }, [confirm, reload, selectedPicklistIdsForArchive]);

  const picklistColumns = useMemo(
    () =>
      createPicklistColumns(
        async (id) => {
          try {
            await markPicklistPicked(id);
            toast.success("Picklist marked as picked");
            reload();
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
            reload();
          } catch (e: any) {
            toast.error(e?.message || "Failed to cancel picklist");
          }
        },
        (id) => navigate(`/inventory/sales/picklist/${id}`),
      ),
    [reload, picklists, confirmCancel, navigate],
  );

  const dispatchColumns = useMemo(
    () =>
      createDispatchColumns(
        (id) => {
          navigate(`/inventory/sales/tracking?dispatchId=${id}`);
        },
        async (id) => {
          await dispatchShipment(id);
          reload();
        },
        async (id) => {
          await markShipmentInTransit(id);
          reload();
        },
        async (id) => {
          await markShipmentOutForDelivery(id);
          reload();
        },
        (id) => {
          navigate(
            `/inventory/sales/tracking?dispatchId=${id}&action=deliver`,
          );
        },
        async (id) => {
          await markShipmentFailedDelivery(
            id,
            "Marked failed from dispatch screen",
          );
          reload();
        },
        async (id) => {
          const shipment = dispatches.find((d) => d.id === id);
          const label = shipment?.dispatchNo || id;
          if (!(await confirmCancel(`shipment ${label}`))) return;
          try {
            await cancelShipment(id);
            toast.success("Shipment cancelled");
            reload();
          } catch (e: any) {
            toast.error(e?.message || "Failed to cancel shipment");
          }
        },
        (id) => {
          navigate(
            `/inventory/sales/tracking?dispatchId=${id}&action=tracking`,
          );
        },
        handleArchiveDispatch,
        archivingDispatchId,
      ),
    [
      reload,
      navigate,
      dispatches,
      confirmCancel,
      handleArchiveDispatch,
      archivingDispatchId,
    ],
  );

  const eligiblePicklistsForDispatch = useMemo(
    () =>
      excludeArchived(allPicklistsForForms).filter((p) => {
        if (p.status !== "picked" || p.shipmentId) return false;
        const order = salesOrders.find((o) => String(o.id) === String(p.orderId));
        const orderStatus = (order?.status || "").toLowerCase();
        return orderStatus !== "completed" && orderStatus !== "cancelled";
      }),
    [allPicklistsForForms, salesOrders],
  );

  const hasDispatchablePicklists = kpiCounts.picked > 0;

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
    return [
      kpiFilterItem(
        {
          label: "Picklists",
          value: kpiCounts.picklists,
          hint: "Warehouse documents awaiting dispatch",
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
          value: kpiCounts.awaiting,
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
          value: kpiCounts.picked,
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
          value: kpiCounts.activeShipments,
          hint: "In flight dispatches",
          accent: "violet",
          icon: Radar,
        },
        "active",
        kpiFilter,
        applyKpiFilter,
      ),
    ];
  }, [kpiCounts, kpiFilter, applyKpiFilter]);

  if (showCreatePicklist) {
    return (
      <CreatePicklistForm
        salesOrders={salesOrders}
        picklists={allPicklistsForForms}
        initialSalesOrderId={initialSalesOrderId}
        onCancel={() => setShowCreatePicklist(false)}
        onCreated={async () => {
          setShowCreatePicklist(false);
          reload();
        }}
      />
    );
  }

  if (showCreateDispatch) {
    return (
      <CreateDispatchForm
        picklists={eligiblePicklistsForDispatch}
        initialPicklistId={initialPicklistId}
        onCancel={() => {
          setShowCreateDispatch(false);
          setInitialPicklistId("");
        }}
        onCreated={async () => {
          setShowCreateDispatch(false);
          reload();
        }}
      />
    );
  }

  const loading =
    activeTab === "picklists" ? picklistsLoading : dispatchesLoading;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        variant="darkBlue"
        title="Picklist & Dispatch"
        description="Generate warehouse picklists from paid orders and create shipments when lines are picked."
        backHref="/inventory/sales"
        actions={
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-white/90"
            onClick={() => setShowCreatePicklist(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Picklist
          </Button>
        }
      />

      <KpiSummaryStrip items={fulfillmentKpis} />

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
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search picklist / order / customer..."
                    value={picklistSearch}
                    onChange={(e) => setPicklistSearch(e.target.value)}
                  />
                </div>
                <Button
                  disabled={!hasDispatchablePicklists}
                  onClick={() => {
                    setInitialPicklistId("");
                    setShowCreateDispatch(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Dispatch
                </Button>
              </div>
              <DataTable
                columns={picklistColumns}
                data={picklists}
                onRowClick={(row) =>
                  navigate(`/inventory/sales/picklist/${row.original.id}`)
                }
                serverPagination={{
                  total: picklistTotal,
                  pageIndex: picklistPage,
                  pageSize: picklistPageSize,
                  pageCount: Math.max(picklistPageCount, 1),
                  onPageChange: setPicklistPage,
                  onPageSizeChange: setPicklistPageSize,
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="dispatches">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading shipments...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Search shipment / tracking / customer..."
                    value={dispatchSearch}
                    onChange={(e) => setDispatchSearch(e.target.value)}
                  />
                </div>
                <Button
                  disabled={!hasDispatchablePicklists}
                  onClick={() => {
                    setInitialPicklistId("");
                    setShowCreateDispatch(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Dispatch
                </Button>
              </div>
              <BulkActionBar
                selectedCount={selectedDispatchIds.length}
                onArchive={handleBulkArchiveDispatches}
                onClear={() => setRowSelection({})}
                archiving={bulkArchiving}
              />
              <SelectableDataTable
                columns={dispatchColumns}
                data={dispatches}
                onRowClick={(row) =>
                  navigate(
                    `/inventory/sales/tracking?dispatchId=${row.original.id}`,
                  )
                }
                enableRowSelection
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                getRowId={(row) => row.id}
                isRowSelectable={(row) =>
                  row.status === "delivered" && !row.archived
                }
                serverPagination={{
                  total: dispatchTotal,
                  pageIndex: dispatchPage,
                  pageSize: dispatchPageSize,
                  pageCount: Math.max(dispatchPageCount, 1),
                  onPageChange: setDispatchPage,
                  onPageSizeChange: setDispatchPageSize,
                }}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
