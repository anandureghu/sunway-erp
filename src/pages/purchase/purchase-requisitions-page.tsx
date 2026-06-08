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
  rejectPurchaseRequisition,
  sendBackPurchaseRequisition,
  revisePurchaseRequisition,
} from "@/service/purchaseFlowService";
import {
  PurchaseRequisitionReviewDialog,
  type ReviewActionType,
} from "./components/purchase-requisition-review-dialog";
import { toast } from "sonner";
import { PurchaseRequisitionsListView } from "./components/purchase-requisitions-list-view";
import { CreatePurchaseRequisitionForm } from "./components/create-purchase-requisition-form";
import { createPurchaseRequisitionColumns } from "@/lib/columns/purchase-requisition-columns";
import type { KpiSummaryStat } from "@/components/kpi-summary-strip";
import {
  ClipboardList,
  Send,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { archivePurchaseRequisition } from "@/service/purchaseFlowService";
import { useModulePermission } from "@/hooks/use-module-permission";
import { InventoryModule } from "@/lib/module-permissions";

export default function PurchaseRequisitionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canCreate, canEdit, canApprove, canDelete } = useModulePermission(
    InventoryModule.PURCHASE,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(
    location.pathname.includes("/new"),
  );
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<{
    id: string;
    type: "archive";
  } | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    requisitionNo: string;
    action: ReviewActionType;
  } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    const wantsCreate = location.pathname.includes("/new");
    if (wantsCreate && !canCreate) {
      navigate("/inventory/purchase/requisitions", { replace: true });
      return;
    }
    setShowCreateForm(wantsCreate && canCreate);
  }, [location.pathname, canCreate, navigate]);

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

  const requisitionKpis = useMemo((): KpiSummaryStat[] => {
    const draft = requisitions.filter(
      (r) => r.status === "draft",
    ).length;
    const rejected = requisitions.filter(
      (r) => r.status === "rejected",
    ).length;
    const awaitingApproval = requisitions.filter(
      (r) => r.status === "submitted",
    ).length;
    const converted = requisitions.filter(
      (r) => r.status === "converted",
    ).length;
    return [
      {
        label: "Draft requisitions",
        value: draft,
        hint: "Not yet submitted",
        accent: "sky",
        icon: ClipboardList,
      },
      {
        label: "Rejected",
        value: rejected,
        hint: "Declined requisitions",
        accent: "rose",
        icon: XCircle,
      },
      {
        label: "Awaiting approval",
        value: awaitingApproval,
        hint: "Submitted, pending decision",
        accent: "orange",
        icon: Send,
      },
      {
        label: "Converted to Purchase Order",
        value: converted,
        hint: "Approved & Purchase Order generated",
        accent: "violet",
        icon: CheckCircle2,
      },
    ];
  }, [requisitions]);

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchesSearch =
        req.requisitionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requestedByName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        req.departmentName?.toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/inventory/purchase/requisitions/${id}/edit`);
    },
    [navigate],
  );

  const handleApprove = useCallback(
    async (id: string) => {
      if (
        !confirm(
          "Approve this requisition? A draft purchase order will be created. Assign the supplier on the PO before release.",
        )
      ) {
        return;
      }
      try {
        const updated = await approvePurchaseRequisition(id);
        if (updated.createdPurchaseOrderId != null) {
          toast.success(
            "Requisition approved — draft purchase order created.",
            {
              action: {
                label: "Open Purchase Order",
                onClick: () =>
                  navigate(
                    `/inventory/purchase/orders/${updated.createdPurchaseOrderId}`,
                  ),
              },
            },
          );
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

  const handleReviewConfirm = useCallback(
    async (comments: string) => {
      if (!reviewTarget) return;
      setReviewLoading(true);
      try {
        if (reviewTarget.action === "reject") {
          await rejectPurchaseRequisition(reviewTarget.id, comments);
          toast.success("Requisition rejected.");
        } else {
          await sendBackPurchaseRequisition(reviewTarget.id, comments);
          toast.success("Sent back to requester.");
        }
        setReviewTarget(null);
        await refreshRequisitions();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to update requisition",
        );
      } finally {
        setReviewLoading(false);
      }
    },
    [reviewTarget, refreshRequisitions],
  );

  const handleSendBack = useCallback((id: string) => {
    const req = requisitions.find((r) => r.id === id);
    if (!req) return;
    setReviewTarget({
      id,
      requisitionNo: req.requisitionNo,
      action: "send_back",
    });
  }, [requisitions]);

  const handleReject = useCallback((id: string) => {
    const req = requisitions.find((r) => r.id === id);
    if (!req) return;
    setReviewTarget({
      id,
      requisitionNo: req.requisitionNo,
      action: "reject",
    });
  }, [requisitions]);

  const handleRevise = useCallback(
    async (id: string) => {
      try {
        await revisePurchaseRequisition(id);
        toast.success("Requisition reopened for editing.");
        navigate(`/inventory/purchase/requisitions/${id}/edit`);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to start revision",
        );
      }
    },
    [navigate],
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

  const handleArchiveRequisition = useCallback(
    async (id: string) => {
      const req = requisitions.find((r) => r.id === id);
      if (!req) return toast.error("Requisition not found");
      if (req.status !== "converted" && req.status !== "rejected") {
        return toast.error("Only converted or rejected requisitions can be archived.");
      }
      if (req.archived) return toast.error("Requisition is already archived.");
      if (!confirm(`Archive requisition ${req.requisitionNo}?`)) return;
      setActionState({ id, type: "archive" });
      try {
        const updated = await archivePurchaseRequisition(id);
        setRequisitions((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, archived: updated.archived ?? true } : r,
          ),
        );
        toast.success("Requisition archived successfully");
        void refreshRequisitions();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to archive requisition",
        );
      } finally {
        setActionState(null);
      }
    },
    [requisitions, refreshRequisitions],
  );

  const columns: ColumnDef<PurchaseRequisition>[] = useMemo(
    () =>
      createPurchaseRequisitionColumns({
        onOpenDetail: handleOpenDetail,
        onEdit: canEdit ? handleEdit : undefined,
        onSubmit: canEdit ? handleSubmit : undefined,
        onApprove: canApprove ? handleApprove : undefined,
        onSendBack: canApprove ? handleSendBack : undefined,
        onReject: canApprove ? handleReject : undefined,
        onRevise: canEdit ? handleRevise : undefined,
        onOpenPurchaseOrder: handleOpenPo,
        onArchive: canDelete ? handleArchiveRequisition : undefined,
        processingRequisitionId: actionState?.id ?? null,
        processingAction: actionState?.type ?? null,
      }),
    [
      handleOpenDetail,
      handleEdit,
      handleSubmit,
      handleApprove,
      handleSendBack,
      handleReject,
      handleRevise,
      handleOpenPo,
      handleArchiveRequisition,
      actionState,
      canEdit,
      canApprove,
      canDelete,
    ],
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
    <>
      <PurchaseRequisitionReviewDialog
        open={reviewTarget != null}
        onOpenChange={(open) => {
          if (!open) setReviewTarget(null);
        }}
        action={reviewTarget?.action ?? "send_back"}
        requisitionNo={reviewTarget?.requisitionNo}
        loading={reviewLoading}
        onConfirm={handleReviewConfirm}
      />
      <PurchaseRequisitionsListView
      loading={loading}
      error={loadError}
      requisitions={filteredRequisitions}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      columns={columns}
      onCreateNew={() => navigate("/inventory/purchase/requisitions/new")}
      showCreateButton={canCreate}
      onSearchChange={setSearchQuery}
      onStatusChange={setStatusFilter}
      onRetry={() => void refreshRequisitions()}
      onRowClick={handleRowClick}
      kpiItems={requisitionKpis}
    />
    </>
  );
}
