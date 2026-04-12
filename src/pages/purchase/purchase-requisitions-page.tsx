/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Row } from "@tanstack/react-table";
import type { PurchaseRequisition } from "@/types/purchase";
import type { ColumnDef } from "@tanstack/react-table";
import {
  listPurchaseRequisitions,
  approvePurchaseRequisition,
  submitPurchaseRequisition,
} from "@/service/purchaseFlowService";
import { toast } from "sonner";
import { PurchaseRequisitionsListView } from "./components/purchase-requisitions-list-view";
import { CreatePurchaseRequisitionForm } from "./components/create-purchase-requisition-form";
import { createPurchaseRequisitionColumns } from "@/lib/columns/purchase-requisition-columns";

export default function PurchaseRequisitionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(
    location.pathname.includes("/new"),
  );
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setShowCreateForm(location.pathname.includes("/new"));
  }, [location.pathname]);

  const refreshRequisitions = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listPurchaseRequisitions();
      setRequisitions(data);
    } catch (e: any) {
      setLoadError(e?.message || "Failed to load purchase requisitions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showCreateForm) return;
    void refreshRequisitions();
  }, [showCreateForm, location.pathname, refreshRequisitions]);

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchesSearch =
        req.requisitionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requestedByName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        req.departmentName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        req.preferredSupplierName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requisitions, searchQuery, statusFilter]);

  const handleOpenDetail = useCallback(
    (id: string) => {
      navigate(`/inventory/purchase/requisitions/${id}`);
    },
    [navigate],
  );

  const handleApprove = useCallback(
    async (id: string) => {
      if (
        !confirm(
          "Approve this requisition? A draft purchase order will be created for the preferred supplier.",
        )
      ) {
        return;
      }
      try {
        const updated = await approvePurchaseRequisition(id);
        if (updated.createdPurchaseOrderId != null) {
          toast.success("Requisition approved — draft purchase order created.", {
            action: {
              label: "Open PO",
              onClick: () =>
                navigate(
                  `/inventory/purchase/orders/${updated.createdPurchaseOrderId}`,
                ),
            },
          });
        } else {
          toast.success("Requisition approved — draft purchase order created.");
        }
        await refreshRequisitions();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to approve requisition",
        );
      }
    },
    [navigate, refreshRequisitions],
  );

  const handleSubmit = useCallback(
    async (id: string) => {
      try {
        await submitPurchaseRequisition(id);
        toast.success("Submitted for approval.");
        await refreshRequisitions();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to submit requisition",
        );
      }
    },
    [refreshRequisitions],
  );

  const handleOpenPo = useCallback(
    (poId: string) => {
      navigate(`/inventory/purchase/orders/${poId}`);
    },
    [navigate],
  );

  const handleRowClick = useCallback(
    (row: Row<PurchaseRequisition>) => {
      navigate(`/inventory/purchase/requisitions/${row.original.id}`);
    },
    [navigate],
  );

  const columns: ColumnDef<PurchaseRequisition>[] = useMemo(
    () =>
      createPurchaseRequisitionColumns({
        onOpenDetail: handleOpenDetail,
        onSubmit: handleSubmit,
        onApprove: handleApprove,
        onOpenPurchaseOrder: handleOpenPo,
      }),
    [handleOpenDetail, handleSubmit, handleApprove, handleOpenPo],
  );

  if (showCreateForm) {
    return (
      <CreatePurchaseRequisitionForm
        onCancel={() => {
          setShowCreateForm(false);
          navigate("/inventory/purchase/requisitions", { replace: true });
        }}
        onCreated={() => refreshRequisitions()}
      />
    );
  }

  return (
    <PurchaseRequisitionsListView
      loading={loading}
      error={loadError}
      requisitions={filteredRequisitions}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      columns={columns}
      onCreateNew={() => navigate("/inventory/purchase/requisitions/new")}
      onSearchChange={setSearchQuery}
      onStatusChange={setStatusFilter}
      onRetry={() => void refreshRequisitions()}
      onRowClick={handleRowClick}
    />
  );
}
