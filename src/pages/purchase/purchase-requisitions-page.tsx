/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PURCHASE_REQUISITION_SCHEMA,
  type PurchaseRequisitionFormData,
} from "@/schema/purchase";
import { z } from "zod";
import type {
  PurchaseRequisitionItem,
  PurchaseRequisition,
} from "@/types/purchase";
import { listItems } from "@/service/inventoryService";
import {
  listPurchaseRequisitions,
  createPurchaseRequisition,
  approvePurchaseRequisition,
  submitPurchaseRequisition,
  convertRequisitionToPO,
} from "@/service/purchaseFlowService";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function PurchaseRequisitionsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateForm, setShowCreateForm] = useState(
    location.pathname.includes("/new")
  );
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sync showCreateForm with location
  useEffect(() => {
    setShowCreateForm(location.pathname.includes("/new"));
  }, [location.pathname]);

  // Load requisitions when pathname changes or when form is closed
  useEffect(() => {
    if (showCreateForm) return;
    
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const requisitionsData = await listPurchaseRequisitions();
        if (!cancelled) {
          setRequisitions(requisitionsData);
        }
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message || "Failed to load purchase requisitions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, showCreateForm]);

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
    const matchesSearch =
      req.requisitionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedByName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  }, [requisitions, searchQuery, statusFilter]);

  const handleApprove = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to approve this requisition?")) return;
    
    try {
      await approvePurchaseRequisition(id);
      toast.success("Requisition approved successfully!");
      const requisitionsData = await listPurchaseRequisitions();
      setRequisitions(requisitionsData);
    } catch (error: any) {
      console.error("Approve requisition error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to approve requisition");
    }
  }, []);

  const handleSubmit = useCallback(async (id: string) => {
    try {
      await submitPurchaseRequisition(id);
      toast.success("Requisition submitted successfully!");
      const requisitionsData = await listPurchaseRequisitions();
      setRequisitions(requisitionsData);
    } catch (error: any) {
      console.error("Submit requisition error:", error);
      toast.error(error?.response?.data?.message || error?.message || "Failed to submit requisition");
    }
  }, []);

  const handleConvertToPO = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to convert this requisition to a purchase order?")) return;
    
    try {
      const createdOrder = await convertRequisitionToPO(id);
      toast.success(
        `Requisition converted to Purchase Order ${createdOrder.orderNo} successfully!`,
        {
          action: {
            label: "View PO",
            onClick: () => navigate("/inventory/purchase/orders"),
          },
        }
      );
      const requisitionsData = await listPurchaseRequisitions();
      setRequisitions(requisitionsData);
      // Optionally navigate to purchase orders page after a short delay
      setTimeout(() => {
        navigate("/inventory/purchase/orders");
      }, 1500);
    } catch (error: any) {
      console.error("Convert requisition error:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to convert requisition";
      toast.error(errorMessage);
      // Even if there's an error, the PO might have been created, so offer to navigate
      if (errorMessage.includes("created but could not be retrieved") || errorMessage.includes("Purchase order")) {
        toast.info("Purchase order may have been created. Check Purchase Orders page.", {
          action: {
            label: "Go to POs",
            onClick: () => navigate("/inventory/purchase/orders"),
          },
        });
      }
    }
  }, [navigate]);

  const columns: ColumnDef<PurchaseRequisition>[] = useMemo(() => [
    {
      accessorKey: "requisitionNo",
      header: "Requisition No",
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("requisitionNo")}</span>;
      },
    },
    {
      accessorKey: "requestedByName",
      header: "Requested By",
      cell: ({ row }) => {
        return <span>{row.getValue("requestedByName") || row.original.requestedBy || "N/A"}</span>;
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => {
        return <span>{row.getValue("department") || "-"}</span>;
      },
    },
    {
      accessorKey: "requestedDate",
      header: "Requested Date",
      cell: ({ row }) => {
        const date = row.getValue("requestedDate") as string;
        return <span>{date ? format(new Date(date), "MMM dd, yyyy") : "N/A"}</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors: Record<string, string> = {
          draft: "bg-gray-100 text-gray-800",
          pending: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
          cancelled: "bg-gray-100 text-gray-800",
        };
        return (
          <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => {
        return <span>{row.original.items.length} items</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const req = row.original;
        const canSubmit = req.status === "draft";
        const canApprove = req.status === "pending";
        const canConvert = req.status === "approved";
        
        return (
          <div className="flex gap-2">
            {canSubmit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSubmit(req.id)}
              >
                Submit
              </Button>
            )}
            {canApprove && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(req.id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            )}
            {canConvert && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConvertToPO(req.id)}
              >
                Convert to PO
              </Button>
            )}
          </div>
        );
      },
    },
  ], [handleApprove, handleSubmit, handleConvertToPO]);

  if (showCreateForm) {
    return <CreateRequisitionForm onCancel={() => setShowCreateForm(false)} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/purchase">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Purchase Requisitions</h1>
            <p className="text-muted-foreground">
              Create and approve purchase requisitions
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Requisition
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Purchase Requisitions</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requisitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading...</div>
          ) : loadError ? (
            <div className="py-10 text-center text-red-600">{loadError}</div>
          ) : (
            <DataTable columns={columns} data={filteredRequisitions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateRequisitionForm({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate();
  const [requisitionItems, setRequisitionItems] = useState<
    PurchaseRequisitionItem[]
  >([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitPrice, setItemUnitPrice] = useState<number>(0);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadSeq, setReloadSeq] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const it = await listItems();
        if (cancelled) return;
        setItems(it);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(
            e?.response?.data?.message ||
              e?.message ||
              "Failed to load items"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadSeq]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Omit<PurchaseRequisitionFormData, "items"> & { items?: any[] }>({
    resolver: zodResolver(
      z.object({
        requestedBy: z.string().min(1, "Requested by is required"),
        department: z.string().optional(),
        requestedDate: z.string().min(1, "Request date is required"),
        requiredDate: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(z.any()).optional(),
      })
    ),
    defaultValues: {
      requestedDate: format(new Date(), "yyyy-MM-dd"),
      requestedBy: "current-user",
      items: [],
    },
    mode: "onChange",
  });

  const addItemToRequisition = () => {
    if (!selectedItem || itemQuantity <= 0) return;

    const item = items.find((i) => i.id === selectedItem);
    if (!item) return;

    const unitPrice = itemUnitPrice || item.costPrice;
    const estimatedTotal = unitPrice * itemQuantity;

    const newItem: PurchaseRequisitionItem = {
      id: `temp-${Date.now()}`,
      requisitionId: "",
      itemId: item.id,
      item,
      quantity: itemQuantity,
      unitPrice: unitPrice,
      estimatedTotal,
    };

    setRequisitionItems([...requisitionItems, newItem]);
    setSelectedItem("");
    setItemQuantity(1);
    setItemUnitPrice(0);
  };

  const removeItem = (itemId: string) => {
    setRequisitionItems(requisitionItems.filter((item) => item.id !== itemId));
  };

  const calculateTotal = () => {
    return requisitionItems.reduce(
      (sum, item) => sum + (item.estimatedTotal || 0),
      0
    );
  };

  const onSubmit = (data: any) => {
    console.log("Form submitted with data:", data);

    // Validate that items are added
    if (requisitionItems.length === 0) {
      toast.error("Please add at least one item to the requisition.");
      return;
    }

    setSubmitLoading(true);

    const payload = {
      items: requisitionItems.map((item) => ({
        itemId: Number(item.itemId),
        requestedQty: Math.round(item.quantity),
        remarks: item.notes || "",
      })),
    };

    createPurchaseRequisition(payload)
      .then((created) => {
        toast.success(`Purchase requisition ${created.requisitionNo} created successfully!`);
        // Navigate and trigger refresh by changing pathname
        navigate("/inventory/purchase/requisitions", { replace: true });
      })
      .catch((error: any) => {
        console.error("Error creating purchase requisition:", error);
        toast.error(error?.response?.data?.message || error?.message || "Failed to create purchase requisition. Please try again.");
      })
      .finally(() => setSubmitLoading(false));
  };

  const total = calculateTotal();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Create Purchase Requisition</h1>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : loadError ? (
        <div className="py-10 text-center">
          <div className="text-red-600 mb-3">{loadError}</div>
          <Button variant="outline" onClick={() => setReloadSeq((n) => n + 1)}>
            Retry
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit, (errors) => {
              console.error("Form validation errors:", errors);
              const errorCount = Object.keys(errors).length;
              toast.error(`Please fix ${errorCount} form error${errorCount > 1 ? 's' : ''} before submitting.`);
            })(e);
          }}
          className="space-y-6"
        >
        <Card>
          <CardHeader>
            <CardTitle>Requisition Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestedBy">Requested By *</Label>
                <Input
                  id="requestedBy"
                  placeholder="Enter requester name"
                  {...register("requestedBy")}
                />
                {errors.requestedBy && (
                  <p className="text-sm text-red-500">
                    {errors.requestedBy.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Enter department"
                  {...register("department")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedDate">Request Date *</Label>
                <Input
                  id="requestedDate"
                  type="date"
                  {...register("requestedDate")}
                />
                {errors.requestedDate && (
                  <p className="text-sm text-red-500">
                    {errors.requestedDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredDate">Required Date</Label>
                <Input
                  id="requiredDate"
                  type="date"
                  {...register("requiredDate")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items
                      .filter((i) => i.status === "active")
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={itemQuantity}
                  onChange={(e) =>
                    setItemQuantity(parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Estimated Unit Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemUnitPrice}
                  onChange={(e) =>
                    setItemUnitPrice(parseFloat(e.target.value) || 0)
                  }
                  placeholder="Auto from item"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addItemToRequisition}
                  className="w-full"
                >
                  Add Item
                </Button>
              </div>
            </div>

            {requisitionItems.length > 0 && (
              <div className="mt-4">
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Item</th>
                        <th className="p-2 text-left">Quantity</th>
                        <th className="p-2 text-left">Unit Price</th>
                        <th className="p-2 text-left">Estimated Total</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requisitionItems.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.item?.name}</td>
                          <td className="p-2">
                            {item.quantity} {item.item?.unit}
                          </td>
                          <td className="p-2">
                            ₹{item.unitPrice?.toLocaleString() || 0}
                          </td>
                          <td className="p-2 font-medium">
                            ₹{item.estimatedTotal?.toLocaleString() || 0}
                          </td>
                          <td className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {requisitionItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No items added. Add items to create the requisition.
              </p>
            )}
          </CardContent>
        </Card>

        {requisitionItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-lg font-bold">
                <span>Total Estimated Amount:</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or instructions"
                  {...register("notes")}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={requisitionItems.length === 0 || submitLoading}>
            {submitLoading ? "Creating..." : "Create Requisition"}
          </Button>
        </div>
        {requisitionItems.length === 0 && (
          <p className="text-sm text-red-500 text-center">
            Please add at least one item to create the requisition
          </p>
        )}
        </form>
      )}
    </div>
  );
}
